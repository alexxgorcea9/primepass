from django.conf import settings
from django.shortcuts import redirect
from django.urls import reverse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
import requests
import jwt
from datetime import datetime, timedelta
import json
import hashlib
import base64
import secrets
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

# Read from environment variables
GOOGLE_CLIENT_ID = settings.GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET = settings.GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI = settings.GOOGLE_REDIRECT_URI

# NOTE: Instagram OAuth configuration moved to instagram_auth.py
# Instagram now uses proper settings from Django settings (INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET)
# and handles the email collection issue properly

# NOTE: Apple OAuth configuration moved to apple_auth.py
# Apple Sign In now uses proper settings from Django settings and secure JWT verification


# Note: You'll need to register these redirect URIs with each provider's developer console
# Google: https://console.developers.google.com/
# Instagram: https://developers.facebook.com/
# Apple: https://developer.apple.com/account/resources/identifiers/list

# Store state and PKCE values in cache
def store_oauth_state(state, code_verifier=None, nonce=None):
    # Store state, code_verifier, and nonce in cache with 10-minute expiry
    cache_data = {
        "created": datetime.now().timestamp(),
        "code_verifier": code_verifier,
        "nonce": nonce
    }
    cache.set(f"oauth_state:{state}", json.dumps(cache_data), timeout=600)  # 10 minutes


def retrieve_oauth_state(state):
    cache_key = f"oauth_state:{state}"
    data = cache.get(cache_key)
    if data:
        cache.delete(cache_key)  # Use once only
        return json.loads(data)
    return None


# Generate a secure random state parameter for OAuth
def generate_state():
    return secrets.token_urlsafe(32)


# Generate PKCE code verifier and challenge
def generate_pkce_pair():
    code_verifier = secrets.token_urlsafe(64)
    code_challenge = base64.urlsafe_b64encode(
        hashlib.sha256(code_verifier.encode()).digest()
    ).decode().rstrip('=')
    return code_verifier, code_challenge


# Create or get user from OAuth profile
def get_or_create_user_from_oauth(email, provider, provider_id, profile_data):
    try:
        # Look for existing user with this email
        user = User.objects.get(email=email)
        is_new = False

        # Update provider details if needed
        if not getattr(user, f"{provider}_id", None):
            setattr(user, f"{provider}_id", provider_id)
            user.save()
        
        # Mark email as verified (OAuth providers verify emails)
        if not user.email_verified:
            user.email_verified = True
            user.save(update_fields=['email_verified'])

    except User.DoesNotExist:
        # Create new user
        user = User.objects.create_user(
            email=email,
            password=None,  # No password for OAuth users
            is_active=True,
            email_verified=True  # OAuth providers verify emails
        )
        setattr(user, f"{provider}_id", provider_id)
        is_new = True

        # Set name if available
        if 'name' in profile_data and hasattr(user, 'name'):
            user.name = profile_data.get('name')

        # Note: We skip setting profile_picture here since it's a URL from OAuth
        # The frontend can fetch and upload it separately if needed

        # Default role is 'guest'
        user.role = 'guest'
        user.save()

    return user, is_new


class GoogleAuthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        """
        Start the Google OAuth flow
        """
        state = generate_state()
        code_verifier, code_challenge = generate_pkce_pair()

        # Store state and code_verifier in cache
        store_oauth_state(state, code_verifier)

        # Construct Google OAuth URL
        params = {
            'client_id': GOOGLE_CLIENT_ID,
            'redirect_uri': GOOGLE_REDIRECT_URI,
            'response_type': 'code',
            'scope': 'email profile',
            'state': state,
            'code_challenge': code_challenge,
            'code_challenge_method': 'S256',
            'access_type': 'offline',
            'prompt': 'consent'
        }

        auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + "&".join([f"{k}={v}" for k, v in params.items()])

        return Response({
            'auth_url': auth_url
        })


@api_view(['POST'])
@permission_classes([AllowAny])
def google_callback(request):
    """
    Handle Google OAuth callback - should be called from frontend after redirect
    """
    code = request.data.get('code')
    state = request.data.get('state')

    print(f"[GOOGLE CALLBACK] Received code: {code[:20] if code else 'None'}... state: {state[:20] if state else 'None'}...")

    if not code or not state:
        print("[GOOGLE CALLBACK] Error: Missing code or state")
        return Response({'error': 'Invalid request, missing code or state'}, status=status.HTTP_400_BAD_REQUEST)

    # Validate state and get code_verifier
    state_data = retrieve_oauth_state(state)
    if not state_data:
        print(f"[GOOGLE CALLBACK] Error: Invalid or expired state parameter")
        return Response({'error': 'Invalid or expired state parameter. Please try again.'}, status=status.HTTP_400_BAD_REQUEST)

    code_verifier = state_data.get('code_verifier')

    # Exchange code for tokens
    token_url = 'https://oauth2.googleapis.com/token'
    token_data = {
        'client_id': GOOGLE_CLIENT_ID,
        'client_secret': GOOGLE_CLIENT_SECRET,
        'code': code,
        'code_verifier': code_verifier,
        'grant_type': 'authorization_code',
        'redirect_uri': GOOGLE_REDIRECT_URI
    }

    token_response = requests.post(token_url, data=token_data)

    if token_response.status_code != 200:
        return Response({
            'error': 'Failed to obtain access token',
            'details': token_response.text
        }, status=status.HTTP_400_BAD_REQUEST)

    tokens = token_response.json()
    access_token = tokens.get('access_token')

    # Get user info with access token
    userinfo_url = 'https://www.googleapis.com/oauth2/v3/userinfo'
    userinfo_response = requests.get(userinfo_url, headers={
        'Authorization': f'Bearer {access_token}'
    })

    if userinfo_response.status_code != 200:
        return Response({
            'error': 'Failed to get user information',
            'details': userinfo_response.text
        }, status=status.HTTP_400_BAD_REQUEST)

    userinfo = userinfo_response.json()

    # Get or create user
    email = userinfo.get('email')
    if not email:
        return Response({'error': 'Email not provided by Google'}, status=status.HTTP_400_BAD_REQUEST)

    user, is_new = get_or_create_user_from_oauth(
        email=email,
        provider='google',
        provider_id=userinfo.get('sub'),  # Google's user ID
        profile_data={
            'name': userinfo.get('name'),
            'picture': userinfo.get('picture')
        }
    )

    # Generate JWT tokens using simplejwt (consistent with other auth methods)
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)

    # Create response with tokens
    response = Response({
        'user': {
            'id': user.id,
            'email': user.email,
            'role': user.role,
            'name': user.name if hasattr(user, 'name') else email,
            'profile_picture': user.profile_picture.url if user.profile_picture else None
        },
        'token': {
            'access': access_token,
            'refresh': refresh_token
        },
        'is_new_user': is_new
    })

    # Set access token cookie (15 minutes)
    response.set_cookie(
        key='access_token',
        value=access_token,
        max_age=15 * 60,  # 15 minutes
        httponly=True,
        secure=not settings.DEBUG,
        samesite='Lax'
    )

    # Set refresh token cookie (7 days)
    response.set_cookie(
        key='refresh_token',
        value=refresh_token,
        max_age=7 * 24 * 3600,  # 7 days
        httponly=True,
        secure=not settings.DEBUG,
        samesite='Lax'
    )

    return response


# ==============================================================================
# NOTE: Instagram OAuth Implementation Moved to instagram_auth.py
# ==============================================================================
# The secure Instagram implementation with proper email handling is now in
# apps/auth/instagram_auth.py
#
# Key improvements in the new implementation:
# 1. Uses .primepass.internal TLD for synthetic emails (reserved, not valid)
# 2. Adds random suffix to prevent username collisions
# 3. Creates users as inactive until real email is provided
# 4. Includes 'requires_email_verification' flag in response
# 5. Provides dedicated endpoint for email collection (POST /api/auth/update-email/)
# 6. Validates state timestamp to prevent replay attacks


# ==============================================================================
# NOTE: Apple OAuth Implementation Moved to apple_auth.py
# ==============================================================================
# The secure Apple Sign In implementation with proper JWT verification
# is now in apps/auth/apple_auth.py
# This was moved to ensure proper signature verification and security.
