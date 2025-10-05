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
from .auth import JWTAuth
from django.core.cache import cache

User = get_user_model()

# These would normally be in settings.py or environment variables
# To fix the 'invalid_client' error, replace these placeholder values with your actual credentials
# from the Google Cloud Console: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID"  # Replace with your actual client ID
GOOGLE_CLIENT_SECRET = "YOUR_GOOGLE_CLIENT_SECRET"  # Replace with your actual client secret
GOOGLE_REDIRECT_URI = "http://localhost:5173/oauth/google/callback"  # Frontend callback URL

INSTAGRAM_CLIENT_ID = "YOUR_INSTAGRAM_CLIENT_ID"  # Replace with your actual client ID
INSTAGRAM_CLIENT_SECRET = "YOUR_INSTAGRAM_CLIENT_SECRET"  # Replace with your actual client secret
INSTAGRAM_REDIRECT_URI = "http://localhost:5173/oauth/instagram/callback"  # Frontend callback URL

APPLE_CLIENT_ID = "YOUR_APPLE_CLIENT_ID"  # Replace with your actual client ID
APPLE_TEAM_ID = "YOUR_APPLE_TEAM_ID"  # Replace with your actual team ID
APPLE_KEY_ID = "YOUR_APPLE_KEY_ID"  # Replace with your actual key ID
APPLE_PRIVATE_KEY = "YOUR_APPLE_PRIVATE_KEY"  # Replace with your actual private key
APPLE_REDIRECT_URI = "http://localhost:5173/oauth/apple/callback"  # Frontend callback URL


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

        # Update provider details if needed
        if not getattr(user, f"{provider}_id", None):
            setattr(user, f"{provider}_id", provider_id)
            user.save()

    except User.DoesNotExist:
        # Create new user
        user = User.objects.create_user(
            email=email,
            password=None,  # No password for OAuth users
            is_active=True
        )
        setattr(user, f"{provider}_id", provider_id)

        # Set name if available
        if 'name' in profile_data and hasattr(user, 'name'):
            user.name = profile_data.get('name')

        # Set profile picture if available
        if 'picture' in profile_data and hasattr(user, 'profile_picture'):
            user.profile_picture = profile_data.get('picture')

        # Default role is 'guest'
        user.role = 'guest'
        user.save()

    return user


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

    if not code or not state:
        return Response({'error': 'Invalid request, missing code or state'}, status=status.HTTP_400_BAD_REQUEST)

    # Validate state and get code_verifier
    state_data = retrieve_oauth_state(state)
    if not state_data:
        return Response({'error': 'Invalid state parameter'}, status=status.HTTP_400_BAD_REQUEST)

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

    user = get_or_create_user_from_oauth(
        email=email,
        provider='google',
        provider_id=userinfo.get('sub'),  # Google's user ID
        profile_data={
            'name': userinfo.get('name'),
            'picture': userinfo.get('picture')
        }
    )

    # Generate our JWT tokens
    access_token, refresh_token = JWTAuth.generate_tokens(user)

    # Create response with tokens
    response = Response({
        'user': {
            'id': user.id,
            'email': user.email,
            'role': user.role,
            'profile_picture': getattr(user, 'profile_picture', None)
        },
        'token': {
            'access': access_token,
            'refresh': refresh_token
        }
    })

    # Set refresh token in HTTP-only cookie
    response.set_cookie(
        key='refresh_token',
        value=refresh_token,
        httponly=True,
        secure=not settings.DEBUG,
        samesite='Lax',
        max_age=7 * 24 * 3600  # 7 days
    )

    return response


class InstagramAuthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        """
        Start the Instagram OAuth flow
        """
        state = generate_state()

        # Store state in cache
        store_oauth_state(state)

        # Construct Instagram OAuth URL
        params = {
            'client_id': INSTAGRAM_CLIENT_ID,
            'redirect_uri': INSTAGRAM_REDIRECT_URI,
            'response_type': 'code',
            'scope': 'user_profile,user_media',
            'state': state
        }

        auth_url = "https://api.instagram.com/oauth/authorize?" + "&".join([f"{k}={v}" for k, v in params.items()])

        return Response({
            'auth_url': auth_url
        })


@api_view(['POST'])
@permission_classes([AllowAny])
def instagram_callback(request):
    """
    Handle Instagram OAuth callback - should be called from frontend after redirect
    """
    code = request.data.get('code')
    state = request.data.get('state')

    if not code or not state:
        return Response({'error': 'Invalid request, missing code or state'}, status=status.HTTP_400_BAD_REQUEST)

    # Validate state
    state_data = retrieve_oauth_state(state)
    if not state_data:
        return Response({'error': 'Invalid state parameter'}, status=status.HTTP_400_BAD_REQUEST)

    # Exchange code for token
    token_url = 'https://api.instagram.com/oauth/access_token'
    token_data = {
        'client_id': INSTAGRAM_CLIENT_ID,
        'client_secret': INSTAGRAM_CLIENT_SECRET,
        'code': code,
        'grant_type': 'authorization_code',
        'redirect_uri': INSTAGRAM_REDIRECT_URI
    }

    token_response = requests.post(token_url, data=token_data)

    if token_response.status_code != 200:
        return Response({
            'error': 'Failed to obtain access token',
            'details': token_response.text
        }, status=status.HTTP_400_BAD_REQUEST)

    tokens = token_response.json()
    access_token = tokens.get('access_token')
    user_id = tokens.get('user_id')

    # Get user info with access token (requires additional API call for Instagram)
    graph_url = f'https://graph.instagram.com/me?fields=id,username&access_token={access_token}'
    userinfo_response = requests.get(graph_url)

    if userinfo_response.status_code != 200:
        return Response({
            'error': 'Failed to get user information',
            'details': userinfo_response.text
        }, status=status.HTTP_400_BAD_REQUEST)

    userinfo = userinfo_response.json()
    username = userinfo.get('username')

    # Instagram doesn't provide email, so we create a placeholder email
    email = f"{username}@instagram.user"

    # Get or create user (note: since Instagram doesn't provide email,
    # this implementation is simplified and might need adjustment for real use)
    user = get_or_create_user_from_oauth(
        email=email,
        provider='instagram',
        provider_id=user_id,
        profile_data={
            'name': username
        }
    )

    # Generate our JWT tokens
    access_token, refresh_token = JWTAuth.generate_tokens(user)

    # Create response with tokens
    response = Response({
        'user': {
            'id': user.id,
            'email': user.email,
            'role': user.role,
            'profile_picture': getattr(user, 'profile_picture', None)
        },
        'token': {
            'access': access_token,
            'refresh': refresh_token
        }
    })

    # Set refresh token in HTTP-only cookie
    response.set_cookie(
        key='refresh_token',
        value=refresh_token,
        httponly=True,
        secure=not settings.DEBUG,
        samesite='Lax',
        max_age=7 * 24 * 3600  # 7 days
    )

    return response


class AppleAuthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        """
        Start the Apple OAuth flow
        """
        state = generate_state()
        nonce = secrets.token_urlsafe(32)

        # Store state and nonce in cache
        store_oauth_state(state, nonce=nonce)

        # Construct Apple OAuth URL
        params = {
            'client_id': APPLE_CLIENT_ID,
            'redirect_uri': APPLE_REDIRECT_URI,
            'response_type': 'code',
            'scope': 'email name',
            'state': state,
            'response_mode': 'form_post'
        }

        auth_url = "https://appleid.apple.com/auth/authorize?" + "&".join([f"{k}={v}" for k, v in params.items()])

        return Response({
            'auth_url': auth_url
        })


@api_view(['POST'])
@permission_classes([AllowAny])
def apple_callback(request):
    """
    Handle Apple OAuth callback - should be called from frontend after redirect
    """
    code = request.data.get('code')
    state = request.data.get('state')
    id_token = request.data.get('id_token')
    user_data = request.data.get('user')

    if not code or not state:
        return Response({'error': 'Invalid request, missing code or state'}, status=status.HTTP_400_BAD_REQUEST)

    # Validate state and get nonce
    state_data = retrieve_oauth_state(state)
    if not state_data:
        return Response({'error': 'Invalid state parameter'}, status=status.HTTP_400_BAD_REQUEST)

    # Parse the id_token (JWT)
    try:
        # Note: This is simplified - in production, validate the JWT signature properly
        payload = jwt.decode(id_token, options={"verify_signature": False})

        # Extract user information
        email = payload.get('email')
        sub = payload.get('sub')  # Apple's unique user identifier

        if not email or not sub:
            return Response({'error': 'Required user information missing from token'},
                            status=status.HTTP_400_BAD_REQUEST)

        # User data might contain name on first login only
        name = None
        if user_data and isinstance(user_data, dict):
            name_data = user_data.get('name', {})
            if name_data:
                first_name = name_data.get('firstName', '')
                last_name = name_data.get('lastName', '')
                name = f"{first_name} {last_name}".strip()

        # Get or create user
        user = get_or_create_user_from_oauth(
            email=email,
            provider='apple',
            provider_id=sub,
            profile_data={
                'name': name
            }
        )

        # Generate our JWT tokens
        access_token, refresh_token = JWTAuth.generate_tokens(user)

        # Create response with tokens
        response = Response({
            'user': {
                'id': user.id,
                'email': user.email,
                'role': user.role,
                'profile_picture': getattr(user, 'profile_picture', None)
            },
            'token': {
                'access': access_token,
                'refresh': refresh_token
            }
        })

        # Set refresh token in HTTP-only cookie
        response.set_cookie(
            key='refresh_token',
            value=refresh_token,
            httponly=True,
            secure=not settings.DEBUG,
            samesite='Lax',
            max_age=7 * 24 * 3600  # 7 days
        )

        return response

    except jwt.PyJWTError as e:
        return Response({'error': f'Invalid token: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
