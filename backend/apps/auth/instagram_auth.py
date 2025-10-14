"""
Instagram OAuth Implementation

This module handles Instagram OAuth authentication flow via Facebook's Graph API:
1. Generate authorization URL
2. Handle callback and exchange authorization code for tokens
3. Fetch user profile from Instagram Graph API
4. Create or update user account

Note: Instagram Basic Display API requires Facebook App setup
Documentation: https://developers.facebook.com/docs/instagram-basic-display-api
"""

import requests
import secrets
import json
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.cache import cache
from datetime import datetime

User = get_user_model()

# Instagram OAuth Configuration (via Facebook)
INSTAGRAM_APP_ID = getattr(settings, 'INSTAGRAM_APP_ID', '')
INSTAGRAM_APP_SECRET = getattr(settings, 'INSTAGRAM_APP_SECRET', '')
INSTAGRAM_REDIRECT_URI = getattr(settings, 'INSTAGRAM_REDIRECT_URI', 'http://localhost:5173/oauth/instagram/callback')

# Instagram OAuth URLs
INSTAGRAM_AUTH_URL = 'https://api.instagram.com/oauth/authorize'
INSTAGRAM_TOKEN_URL = 'https://api.instagram.com/oauth/access_token'
INSTAGRAM_GRAPH_URL = 'https://graph.instagram.com'


def store_oauth_state(state):
    """Store OAuth state in cache with 10-minute expiry."""
    cache_data = {
        "created": datetime.now().timestamp()
    }
    cache.set(f"oauth_state:{state}", json.dumps(cache_data), timeout=600)


def retrieve_oauth_state(state):
    """Retrieve and delete OAuth state from cache."""
    cache_key = f"oauth_state:{state}"
    data = cache.get(cache_key)
    if data:
        cache.delete(cache_key)
        return json.loads(data)
    return None


def get_or_create_user_from_instagram(instagram_id, username, account_type='PERSONAL'):
    """
    Get or create user from Instagram OAuth data.
    
    IMPORTANT: Instagram Basic Display API doesn't provide email addresses.
    
    Strategy:
    1. Try to find existing user by instagram_id
    2. If not found, create temporary account with synthetic email
    3. Flag account as requiring real email verification
    4. Frontend should prompt user to provide real email immediately
    
    Security Notes:
    - Synthetic emails use .primepass.internal domain (not valid TLD)
    - Accounts with synthetic emails should be limited in functionality
    - Real email must be collected and verified before full access
    """
    try:
        # Try to find user by instagram_id first
        try:
            user = User.objects.get(instagram_id=instagram_id)
            is_new = False
        except User.DoesNotExist:
            # Create a synthetic email for Instagram users
            # Using .internal TLD which is reserved and can't be confused with real domains
            base_email = f"{username}@instagram.primepass.internal"
            
            # Add random suffix to prevent collisions (Instagram usernames can change)
            email = f"{username}.{secrets.token_hex(6)}@instagram.primepass.internal"
            
            # Double-check email doesn't exist (extremely unlikely with random suffix)
            while User.objects.filter(email=email).exists():
                email = f"{username}.{secrets.token_hex(6)}@instagram.primepass.internal"
            
            # Create new user with temporary email
            user = User.objects.create_user(
                email=email,
                password=None,  # No password for OAuth users
                is_active=False,  # Inactive until real email is provided
                role='guest'  # Default role
            )
            user.instagram_id = instagram_id
            user.name = username
            user.save()
            is_new = True
        
        return user, is_new
    except Exception as e:
        raise Exception(f"Failed to create/update user: {str(e)}")


@api_view(['GET'])
@permission_classes([AllowAny])
def instagram_auth_initiate(request):
    """
    Initiate Instagram OAuth flow.
    Returns the authorization URL to redirect the user to.
    """
    if not all([INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET]):
        return Response({
            'error': 'not_configured',
            'message': 'Instagram OAuth is not configured. Please contact the administrator.'
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    try:
        # Generate state for CSRF protection
        state = secrets.token_urlsafe(32)
        
        # Store state
        store_oauth_state(state)
        
        # Build authorization URL
        params = {
            'client_id': INSTAGRAM_APP_ID,
            'redirect_uri': INSTAGRAM_REDIRECT_URI,
            'scope': 'user_profile,user_media',
            'response_type': 'code',
            'state': state,
        }
        
        # Construct URL
        auth_url = INSTAGRAM_AUTH_URL + '?' + '&'.join([f"{k}={v}" for k, v in params.items()])
        
        return Response({
            'auth_url': auth_url,
            'state': state
        })
    except Exception as e:
        return Response({
            'error': f'Failed to initiate Instagram OAuth: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def instagram_auth_callback(request):
    """
    Handle Instagram OAuth callback.
    
    Exchange authorization code for access token and create/login user.
    """
    try:
        # Get data from request
        code = request.data.get('code')
        state = request.data.get('state')
        
        if not code or not state:
            return Response({
                'error': 'Missing required parameters (code or state)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate state
        state_data = retrieve_oauth_state(state)
        if not state_data:
            return Response({
                'error': 'Invalid or expired state parameter'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate state timestamp (prevent replay attacks)
        state_created = state_data.get('created')
        if state_created:
            state_age = datetime.now().timestamp() - state_created
            if state_age > 600:  # 10 minutes
                return Response({
                    'error': 'State parameter expired'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Exchange authorization code for access token
        token_data = {
            'client_id': INSTAGRAM_APP_ID,
            'client_secret': INSTAGRAM_APP_SECRET,
            'grant_type': 'authorization_code',
            'redirect_uri': INSTAGRAM_REDIRECT_URI,
            'code': code
        }
        
        try:
            token_response = requests.post(INSTAGRAM_TOKEN_URL, data=token_data, timeout=10)
            token_response.raise_for_status()
            tokens = token_response.json()
        except requests.RequestException as e:
            return Response({
                'error': f'Failed to exchange code for token: {str(e)}',
                'details': getattr(token_response, 'text', '')
            }, status=status.HTTP_400_BAD_REQUEST)
        
        access_token = tokens.get('access_token')
        instagram_user_id = tokens.get('user_id')
        
        if not access_token or not instagram_user_id:
            return Response({
                'error': 'No access token or user ID received from Instagram'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get user profile from Instagram Graph API
        # Available fields: id, username, account_type, media_count
        graph_url = f'{INSTAGRAM_GRAPH_URL}/me'
        params = {
            'fields': 'id,username,account_type,media_count',
            'access_token': access_token
        }
        
        try:
            userinfo_response = requests.get(graph_url, params=params, timeout=10)
            userinfo_response.raise_for_status()
            userinfo = userinfo_response.json()
        except requests.RequestException as e:
            return Response({
                'error': f'Failed to get user information: {str(e)}',
                'details': getattr(userinfo_response, 'text', '')
            }, status=status.HTTP_400_BAD_REQUEST)
        
        instagram_id = userinfo.get('id')
        username = userinfo.get('username')
        account_type = userinfo.get('account_type', 'PERSONAL')
        
        if not instagram_id or not username:
            return Response({
                'error': 'Required user information missing from Instagram'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get or create user
        user, is_new = get_or_create_user_from_instagram(
            instagram_id=instagram_id,
            username=username,
            account_type=account_type
        )
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access_token_jwt = str(refresh.access_token)
        refresh_token = str(refresh)
        
        # Check if user has temporary email
        has_temp_email = user.email.endswith('@instagram.primepass.internal')
        
        # Create response
        response = Response({
            'user': {
                'id': user.id,
                'email': user.email if not has_temp_email else None,  # Don't expose temp email
                'role': user.role,
                'name': user.name if user.name else username,
                'profile_picture': user.profile_picture.url if user.profile_picture else None,
                'is_active': user.is_active
            },
            'token': {
                'access': access_token_jwt,
                'refresh': refresh_token
            },
            'is_new_user': is_new,
            'instagram_username': username,
            'requires_email_verification': has_temp_email,  # Frontend must collect email
            'warning': 'Please provide your email address to complete registration' if has_temp_email else None
        })
        
        # Set tokens in HTTP-only cookies
        response.set_cookie(
            key='access_token',
            value=access_token_jwt,
            max_age=15 * 60,  # 15 minutes
            httponly=True,
            secure=not settings.DEBUG,
            samesite='Lax'
        )
        
        response.set_cookie(
            key='refresh_token',
            value=refresh_token,
            max_age=7 * 24 * 3600,  # 7 days
            httponly=True,
            secure=not settings.DEBUG,
            samesite='Lax'
        )
        
        return response
        
    except Exception as e:
        return Response({
            'error': f'Authentication failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
