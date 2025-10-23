import logging

from axes.exceptions import AxesBackendPermissionDenied
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken

from .cache import get_cached_user, invalidate_user_cache
from .emails import send_verification_email, send_verification_success_email, send_account_lockout_email
from .models import User
from .serializers import UserSerializer
from .permissions import IsEmailVerified
logger = logging.getLogger(__name__)

ROLE_CHOICES = ['guest', 'organizer', 'team']

class SignupView(APIView):
    permission_classes = [AllowAny]

    @method_decorator(ratelimit(key='ip', rate='20/h', method='POST'))
    @method_decorator(ratelimit(key='post:email', rate='10/d', method='POST'))
    def post(self, request):
        # Check if rate limited
        if getattr(request, 'limited', False):
            return Response({
                'error': 'rate_limited',
                'message': 'Too many signup attempts. Please try again later.'
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        email = request.data.get('email')
        password = request.data.get('password')
        role = request.data.get('role', 'guest')
        remember_me = request.data.get('remember_me', False)

        logger.info(f"Signup attempt for email: {email}, role: {role}")

        if role not in ROLE_CHOICES:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Invalid role selected.")

        try:
            validate_password(password)
        except DjangoValidationError as e:
            return Response({"password": list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

        # Prepare data with validated role
        signup_data = {
            'email': email,
            'password': password,
            'role': role
        }

        serializer = UserSerializer(data=signup_data)
        if serializer.is_valid():
            try:
                user = serializer.save()
                logger.info(f"User created successfully - Email: {user.email}, Role: {user.role}")
            except IntegrityError as e:
                logger.warning(f"Duplicate email signup attempt: {email}")
                return Response(
                    {"error": "email_exists", "message": "An account with this email already exists."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            except Exception as e:
                logger.exception(f"Unexpected error during user creation for email: {email}")
                return Response(
                    {"error": "user_creation_failed", "message": "An error occurred during signup."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Generate email verification token
            verification_token = user.generate_email_verification_token()
            
            # Send verification email
            email_sent = send_verification_email(user, verification_token)
            if not email_sent:
                logger.warning(f"Failed to send verification email to {user.email}")
            
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)

            # Return user data with verification status
            response = Response({
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "role": user.role,
                    "email_verified": user.email_verified
                },
                "message": "Account created successfully. Please check your email to verify your account.",
                "email_sent": email_sent,
                "onboarding_state": "is_waiting"
            }, status=status.HTTP_201_CREATED)

            # Set both tokens as HTTP-only cookies
            # Access token cookie (shorter expiry - 15 minutes)
            response.set_cookie(
                key="access_token",
                value=access_token,
                max_age=15 * 60,  # 15 minutes
                secure=not settings.DEBUG,
                httponly=True,
                samesite="Lax",
            )
            
            # Refresh token cookie
            refresh_cookie_params = {
                "key": "refresh_token",
                "value": refresh_token,
                "secure": not settings.DEBUG,
                "httponly": True,
                "samesite": "Lax",
            }
            if remember_me:
                refresh_cookie_params["max_age"] = 7 * 24 * 60 * 60  # 7 days
            
            response.set_cookie(**refresh_cookie_params)
            return response

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        try:
            # Only accept refresh token from cookie for security
            refresh_token = request.COOKIES.get('refresh_token')
            if not refresh_token:
                return Response({"detail": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            # Invalidate user cache on logout
            invalidate_user_cache(request.user.id)
            
            response = Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
            response.delete_cookie('access_token')
            response.delete_cookie('refresh_token')
            return response
        except TokenError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"detail": f"Logout failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

class LogoutAllView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        try:
            tokens = OutstandingToken.objects.filter(user_id=request.user.id)
            for token in tokens:
                BlacklistedToken.objects.get_or_create(token=token)
            
            # Invalidate user cache on logout from all devices
            invalidate_user_cache(request.user.id)
            
            response = Response({"detail": "Successfully logged out from all devices."}, status=status.HTTP_200_OK)
            response.delete_cookie('access_token')
            response.delete_cookie('refresh_token')
            return response
        except Exception as e:
            return Response({"detail": f"Logout failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

@ratelimit(key='ip', rate='100/m', method='POST')
@ratelimit(key='post:email', rate='20/h', method='POST')
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    # Check if rate limited
    if getattr(request, 'limited', False):
        return Response({
            'error': 'rate_limited',
            'message': 'Too many login attempts. Please try again later.'
        }, status=status.HTTP_429_TOO_MANY_REQUESTS)
    
    email = request.data.get('email')
    password = request.data.get('password')
    remember_me = request.data.get('remember_me', False)

    # Try to authenticate - django-axes will raise exception if locked
    try:
        user = authenticate(request=request, username=email, password=password)
    except AxesBackendPermissionDenied:
        # Account locked by django-axes after too many failed attempts
        logger.warning(f"Account locked for email: {email}")
        
        # Send lockout notification email
        try:
            locked_user = User.objects.get(email=email)
            send_account_lockout_email(locked_user)
        except User.DoesNotExist:
            pass  # User doesn't exist, no email to send
        
        return Response({
            'error': 'account_locked',
            'message': 'Too many failed login attempts. Account locked for 1 hour.'
        }, status=status.HTTP_403_FORBIDDEN)
    
    if not user:
        # Log failed attempt
        logger.warning(f"Failed login attempt for email: {email}")
        # Use generic error to prevent user enumeration
        return Response({
            'error': 'invalid_credentials',
            'message': 'Invalid email or password.'
        }, status=401)

    if not user.is_active:
        return Response({'error': 'account_disabled', 'message': 'This account has been disabled.'}, status=403)

    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)

    user_data = get_cached_user(user.id)
    user_data['role'] = user.role
    
    logger.info(f"User logged in successfully - Email: {user.email}, Role: {user.role}")

    # Return user data only (no tokens in response body)
    response = Response({'user': user_data})

    # Set both tokens as HTTP-only cookies
    # Access token cookie (shorter expiry - 15 minutes)
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=15 * 60,  # 15 minutes
        secure=not settings.DEBUG,
        httponly=True,
        samesite="Lax",
    )
    
    # Refresh token cookie
    refresh_cookie_params = {
        "key": "refresh_token",
        "value": refresh_token,
        "secure": not settings.DEBUG,
        "httponly": True,
        "samesite": "Lax",
    }
    if remember_me:
        refresh_cookie_params["max_age"] = 7 * 24 * 60 * 60  # 7 days
    
    response.set_cookie(**refresh_cookie_params)
    return response

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsEmailVerified])
def user_profile(request):
    user = request.user
    profile_picture_url = None
    if hasattr(user, 'profile_picture') and user.profile_picture:
        try:
            profile_picture_url = user.profile_picture.url
        except (ValueError, AttributeError):
            profile_picture_url = None
    
    return Response({
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "name": getattr(user, "name", ""),
        "profile_picture": profile_picture_url,
        "email_verified": getattr(user, "email_verified", False),
        "organizer_bio": getattr(user, "organizer_bio", None)
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_email_for_oauth(request):
    """
    Update email for OAuth users who signed up without an email (e.g., Instagram).
    
    This endpoint is specifically for users with temporary synthetic emails
    from OAuth providers that don't provide email addresses.
    """
    user = request.user
    new_email = request.data.get('email')
    
    if not new_email:
        return Response({
            'error': 'email_required',
            'message': 'Email address is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if user has a temporary email
    has_temp_email = user.email.endswith('@instagram.primepass.internal')
    
    if not has_temp_email:
        return Response({
            'error': 'email_already_set',
            'message': 'Your account already has a valid email address'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate email format
    from django.core.validators import validate_email as django_validate_email
    try:
        django_validate_email(new_email)
    except DjangoValidationError:
        return Response({
            'error': 'invalid_email',
            'message': 'Please provide a valid email address'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if email is already taken
    if User.objects.filter(email=new_email).exclude(id=user.id).exists():
        return Response({
            'error': 'email_taken',
            'message': 'This email address is already registered'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Update user email
    old_email = user.email
    user.email = new_email
    user.is_active = True  # Activate account now that real email is provided
    user.save()
    
    # Invalidate user cache after email update
    invalidate_user_cache(user.id)
    
    logger.info(f"Email updated for Instagram user {user.id}: {old_email} -> {new_email}")
    
    return Response({
        'message': 'Email updated successfully',
        'user': {
            'id': user.id,
            'email': user.email,
            'is_active': user.is_active,
            'role': user.role,
            'name': user.name
        }
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    """
    Verify user's email address using the verification token.
    
    Request body:
        email: User's email address
        token: Verification token from email
    """
    email = request.data.get('email')
    token = request.data.get('token')
    
    if not email or not token:
        return Response({
            'error': 'missing_parameters',
            'message': 'Email and token are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({
            'error': 'user_not_found',
            'message': 'No account found with this email address'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Check if already verified
    if user.email_verified:
        return Response({
            'message': 'Email already verified',
            'email_verified': True
        }, status=status.HTTP_200_OK)
    
    # Verify the token
    if user.verify_email_token(token):
        # Send success email
        send_verification_success_email(user)
        
        # Invalidate user cache to refresh data
        invalidate_user_cache(user.id)
        
        logger.info(f"Email verified successfully for user: {user.email}")
        
        return Response({
            'message': 'Email verified successfully',
            'email_verified': True
        }, status=status.HTTP_200_OK)
    else:
        logger.warning(f"Invalid or expired verification token for user: {user.email}")
        return Response({
            'error': 'invalid_token',
            'message': 'Invalid or expired verification token'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
@ratelimit(key='ip', rate='10/h', method='POST')
@ratelimit(key='post:email', rate='5/d', method='POST')
def resend_verification_email(request):
    """
    Resend verification email to user.
    
    Request body:
        email: User's email address
    """
    # Check if rate limited
    if getattr(request, 'limited', False):
        return Response({
            'error': 'rate_limited',
            'message': 'Too many requests. Please try again later.'
        }, status=status.HTTP_429_TOO_MANY_REQUESTS)
    
    email = request.data.get('email')
    
    if not email:
        return Response({
            'error': 'missing_email',
            'message': 'Email address is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Don't reveal if email exists or not (security best practice)
        return Response({
            'message': 'If an account exists with this email, a verification email has been sent.'
        }, status=status.HTTP_200_OK)
    
    # Check if already verified
    if user.email_verified:
        return Response({
            'error': 'already_verified',
            'message': 'This email is already verified'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Generate new verification token
    verification_token = user.generate_email_verification_token()
    
    # Send verification email
    email_sent = send_verification_email(user, verification_token)
    
    if email_sent:
        logger.info(f"Verification email resent to {user.email}")
        return Response({
            'message': 'Verification email sent successfully. Please check your inbox.'
        }, status=status.HTTP_200_OK)
    else:
        logger.error(f"Failed to resend verification email to {user.email}")
        return Response({
            'error': 'email_send_failed',
            'message': 'Failed to send verification email. Please try again later.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
