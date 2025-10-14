"""
Apple Sign In OAuth Implementation

This module handles Apple OAuth authentication flow:
1. Generate authorization URL
2. Handle callback and exchange authorization code for tokens
3. Verify Apple's ID token (JWT)
4. Create or update user account

Documentation: https://developer.apple.com/documentation/sign_in_with_apple
"""

import jwt
import time
import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend
import secrets
import json
from django.core.cache import cache
from datetime import datetime

User = get_user_model()

# Apple OAuth Configuration
APPLE_CLIENT_ID = getattr(settings, 'APPLE_CLIENT_ID', '')
APPLE_TEAM_ID = getattr(settings, 'APPLE_TEAM_ID', '')
APPLE_KEY_ID = getattr(settings, 'APPLE_KEY_ID', '')
APPLE_PRIVATE_KEY = getattr(settings, 'APPLE_PRIVATE_KEY', '')
APPLE_REDIRECT_URI = getattr(settings, 'APPLE_REDIRECT_URI', 'http://localhost:5173/oauth/apple/callback')

# Apple OAuth URLs
APPLE_AUTH_URL = 'https://appleid.apple.com/auth/authorize'
APPLE_TOKEN_URL = 'https://appleid.apple.com/auth/token'
APPLE_KEYS_URL = 'https://appleid.apple.com/auth/keys'


def generate_client_secret():
    """
    Generate a client secret JWT for Apple Sign In.
    This is required for server-to-server requests.
    
    The client secret is a JWT signed with your private key.
    """
    if not all([APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY, APPLE_CLIENT_ID]):
        raise ValueError("Missing Apple OAuth configuration. Please set APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY, and APPLE_CLIENT_ID in settings.")
    
    # Current time
    now = int(time.time())
    
    # JWT headers
    headers = {
        'kid': APPLE_KEY_ID,
        'alg': 'ES256'
    }
    
    # JWT payload
    payload = {
        'iss': APPLE_TEAM_ID,
        'iat': now,
        'exp': now + 86400 * 180,  # 180 days (max allowed)
        'aud': 'https://appleid.apple.com',
        'sub': APPLE_CLIENT_ID,
    }
    
    # Load private key
    try:
        # Handle both PEM string and file path
        if APPLE_PRIVATE_KEY.startswith('-----BEGIN PRIVATE KEY-----'):
            private_key = serialization.load_pem_private_key(
                APPLE_PRIVATE_KEY.encode(),
                password=None,
                backend=default_backend()
            )
        else:
            # Try to load from file
            with open(APPLE_PRIVATE_KEY, 'rb') as key_file:
                private_key = serialization.load_pem_private_key(
                    key_file.read(),
                    password=None,
                    backend=default_backend()
                )
    except Exception as e:
        raise ValueError(f"Failed to load Apple private key: {str(e)}")
    
    # Generate JWT
    client_secret = jwt.encode(
        payload,
        private_key,
        algorithm='ES256',
        headers=headers
    )
    
    return client_secret


def get_apple_public_keys():
    """
    Fetch Apple's public keys for JWT verification.
    Keys are cached for 24 hours.
    
    Returns a fallback to cached keys even if expired if the fetch fails.
    """
    cache_key = 'apple_public_keys'
    cache_key_backup = 'apple_public_keys_backup'
    
    # Try to get fresh cached keys
    cached_keys = cache.get(cache_key)
    if cached_keys:
        return json.loads(cached_keys)
    
    # Fetch new keys from Apple
    try:
        response = requests.get(APPLE_KEYS_URL, timeout=10)
        response.raise_for_status()
        keys = response.json()
        
        # Validate keys structure
        if not keys.get('keys') or not isinstance(keys['keys'], list):
            raise ValueError("Invalid keys structure from Apple")
        
        # Cache for 24 hours
        cache.set(cache_key, json.dumps(keys), 86400)
        # Keep a backup for 7 days
        cache.set(cache_key_backup, json.dumps(keys), 604800)
        return keys
    except Exception as e:
        # Try to use backup cache if fetch fails
        backup_keys = cache.get(cache_key_backup)
        if backup_keys:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Failed to fetch Apple public keys, using backup: {str(e)}")
            return json.loads(backup_keys)
        raise Exception(f"Failed to fetch Apple public keys and no backup available: {str(e)}")


def verify_apple_token(id_token, nonce=None):
    """
    Verify Apple's ID token (JWT).
    
    This validates:
    - Token signature using Apple's public keys
    - Token expiration
    - Issuer and audience
    - Nonce (if provided)
    
    Args:
        id_token: The ID token from Apple
        nonce: The nonce value to validate (optional but recommended)
    """
    try:
        # Get Apple's public keys
        apple_keys = get_apple_public_keys()
        
        # Decode header without verification to get key ID
        unverified_header = jwt.get_unverified_header(id_token)
        key_id = unverified_header.get('kid')
        
        if not key_id:
            raise ValueError("Token missing key ID")
        
        # Find the matching public key
        public_key = None
        for key in apple_keys.get('keys', []):
            if key.get('kid') == key_id:
                public_key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(key))
                break
        
        if not public_key:
            raise ValueError(f"No matching public key found for key ID: {key_id}")
        
        # Verify and decode the token
        payload = jwt.decode(
            id_token,
            public_key,
            algorithms=['RS256'],
            audience=APPLE_CLIENT_ID,
            issuer='https://appleid.apple.com'
        )
        
        # Validate nonce if provided (prevents replay attacks)
        if nonce:
            token_nonce = payload.get('nonce')
            if not token_nonce:
                raise ValueError("Token missing nonce claim")
            if token_nonce != nonce:
                raise ValueError("Nonce mismatch - possible replay attack")
        
        # Additional validations
        if not payload.get('email'):
            raise ValueError("Token missing email claim")
        
        if not payload.get('email_verified', False):
            raise ValueError("Email not verified by Apple")
        
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Apple token has expired")
    except jwt.InvalidTokenError as e:
        raise ValueError(f"Invalid Apple token: {str(e)}")
    except Exception as e:
        raise ValueError(f"Token verification failed: {str(e)}")


def store_oauth_state(state, nonce=None):
    """Store OAuth state and nonce in cache with 10-minute expiry."""
    cache_data = {
        "created": datetime.now().timestamp(),
        "nonce": nonce
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


def get_or_create_user_from_apple(email, apple_id, first_name=None, last_name=None):
    """
    Get or create user from Apple OAuth data.
    
    Apple only provides name on first sign-in, so we store it then.
    """
    try:
        # Try to find user by apple_id first
        try:
            user = User.objects.get(apple_id=apple_id)
            is_new = False
        except User.DoesNotExist:
            # Try to find by email
            try:
                user = User.objects.get(email=email)
                is_new = False
                # Link Apple ID to existing account
                user.apple_id = apple_id
                user.save()
            except User.DoesNotExist:
                # Create new user
                user = User.objects.create_user(
                    email=email,
                    password=None,  # No password for OAuth users
                    is_active=True,
                    role='guest'  # Default role
                )
                user.apple_id = apple_id
                
                # Set name if provided (only on first login)
                if first_name or last_name:
                    name_parts = []
                    if first_name:
                        name_parts.append(first_name)
                    if last_name:
                        name_parts.append(last_name)
                    user.name = ' '.join(name_parts)
                
                user.save()
                is_new = True
        
        return user, is_new
    except Exception as e:
        raise Exception(f"Failed to create/update user: {str(e)}")


@api_view(['GET'])
@permission_classes([AllowAny])
def apple_auth_initiate(request):
    """
    Initiate Apple Sign In flow.
    Returns the authorization URL to redirect the user to.
    """
    try:
        # Generate state for CSRF protection
        state = secrets.token_urlsafe(32)
        nonce = secrets.token_urlsafe(32)
        
        # Store state and nonce
        store_oauth_state(state, nonce)
        
        # Build authorization URL
        params = {
            'client_id': APPLE_CLIENT_ID,
            'redirect_uri': APPLE_REDIRECT_URI,
            'response_type': 'code id_token',
            'response_mode': 'form_post',
            'scope': 'email name',
            'state': state,
            'nonce': nonce,
        }
        
        # Construct URL
        auth_url = APPLE_AUTH_URL + '?' + '&'.join([f"{k}={v}" for k, v in params.items()])
        
        return Response({
            'auth_url': auth_url,
            'state': state
        })
    except ValueError as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        return Response({
            'error': f'Failed to initiate Apple Sign In: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def apple_auth_callback(request):
    """
    Handle Apple Sign In callback.
    
    Apple sends the authorization code and user data (first time only) via form_post.
    Frontend should intercept this and send to this endpoint.
    """
    try:
        # Get data from request
        code = request.data.get('code')
        state = request.data.get('state')
        id_token = request.data.get('id_token')
        user_data = request.data.get('user')  # Only provided on first sign-in
        
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
        
        nonce = state_data.get('nonce')
        
        # If we have id_token from client, verify it
        if id_token:
            try:
                token_payload = verify_apple_token(id_token, nonce=nonce)
                email = token_payload.get('email')
                apple_user_id = token_payload.get('sub')
            except ValueError as e:
                return Response({
                    'error': f'Token verification failed: {str(e)}'
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            # Exchange authorization code for tokens
            try:
                client_secret = generate_client_secret()
            except ValueError as e:
                return Response({
                    'error': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            token_data = {
                'client_id': APPLE_CLIENT_ID,
                'client_secret': client_secret,
                'code': code,
                'grant_type': 'authorization_code',
                'redirect_uri': APPLE_REDIRECT_URI
            }
            
            try:
                token_response = requests.post(APPLE_TOKEN_URL, data=token_data, timeout=10)
                token_response.raise_for_status()
                tokens = token_response.json()
            except requests.RequestException as e:
                return Response({
                    'error': f'Failed to exchange code for token: {str(e)}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verify the ID token
            id_token = tokens.get('id_token')
            if not id_token:
                return Response({
                    'error': 'No ID token received from Apple'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                token_payload = verify_apple_token(id_token, nonce=nonce)
                email = token_payload.get('email')
                apple_user_id = token_payload.get('sub')
            except ValueError as e:
                return Response({
                    'error': f'Token verification failed: {str(e)}'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        if not email or not apple_user_id:
            return Response({
                'error': 'Required user information missing from Apple'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Parse user data (only provided on first sign-in)
        first_name = None
        last_name = None
        if user_data and isinstance(user_data, dict):
            name_data = user_data.get('name', {})
            if name_data:
                first_name = name_data.get('firstName', '')
                last_name = name_data.get('lastName', '')
        
        # Get or create user
        user, is_new = get_or_create_user_from_apple(
            email=email,
            apple_id=apple_user_id,
            first_name=first_name,
            last_name=last_name
        )
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        # Create response
        response = Response({
            'user': {
                'id': user.id,
                'email': user.email,
                'role': user.role,
                'name': user.name if user.name else email.split('@')[0],
                'profile_picture': user.profile_picture.url if user.profile_picture else None
            },
            'token': {
                'access': access_token,
                'refresh': refresh_token
            },
            'is_new_user': is_new
        })
        
        # Set tokens in HTTP-only cookies
        response.set_cookie(
            key='access_token',
            value=access_token,
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
