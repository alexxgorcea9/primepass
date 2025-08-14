from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.exceptions import TokenError

from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from datetime import timedelta
from django.conf import settings

from apps.legacy.models import User, UserRole, Organizer
from apps.legacy.serializers import UserSerializer, OrganizerSerializer
from apps.legacy.cache import get_cached_user

ROLE_CHOICES = ['guest', 'organizer', 'vendor']

class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        role = request.data.get('role')
        remember_me = request.data.get('remember_me', False)

        if role not in ROLE_CHOICES:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Invalid role selected.")

        try:
            validate_password(password)
        except DjangoValidationError as e:
            return Response({"password": list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save(password=password, role=role)
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)

            response = Response({
                "token": {"access": access_token, "refresh": refresh_token},
                "user": {"id": user.id, "email": user.email, "role": user.role}
            }, status=status.HTTP_201_CREATED)

            cookie_max_age = 7 * 24 * 60 * 60 if remember_me else None
            cookie_params = {
                "key": "refresh_token",
                "value": refresh_token,
                "secure": not settings.DEBUG,  # True in prod
                "httponly": True,
                "samesite": "Lax",
            }
            if remember_me:
                cookie_params["max_age"] = 7 * 24 * 60 * 60  # 7 days

            response.set_cookie(**cookie_params)
            return response

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        try:
            refresh_token = request.COOKIES.get('refresh_token') or request.data.get('refresh_token')
            if not refresh_token:
                return Response({"detail": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)
            token = RefreshToken(refresh_token)
            token.blacklist()
            response = Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
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
            response = Response({"detail": "Successfully logged out from all devices."}, status=status.HTTP_200_OK)
            response.delete_cookie('refresh_token')
            return response
        except Exception as e:
            return Response({"detail": f"Logout failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    permission_classes = [AllowAny]

    email = request.data.get('email')
    password = request.data.get('password')
    remember_me = request.data.get('remember_me', False)

    user = authenticate(request=request, username=email, password=password)
    if not user:
        from django.contrib.auth import get_user_model
        UserModel = get_user_model()
        try:
            user_exists = UserModel.objects.filter(email=email).exists()
            if not user_exists:
                return Response({'error': 'user_not_found', 'message': 'No account found with this email.'}, status=404)
            return Response({'error': 'invalid_password', 'message': 'Incorrect password.'}, status=401)
        except Exception as e:
            return Response({'error': 'server_error', 'message': str(e)}, status=500)

    if not user.is_active:
        return Response({'error': 'account_disabled', 'message': 'This account has been disabled.'}, status=403)

    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)

    user_data = get_cached_user(user.id)
    user_data['role'] = user.role

    response = Response({'token': {'access': access_token, 'refresh': refresh_token}, 'user': user_data})

    cookie_max_age = 7 * 24 * 60 * 60 if remember_me else None
    cookie_params = {
        "key": "refresh_token",
        "value": refresh_token,
        "secure": not settings.DEBUG,  # True in prod
        "httponly": True,
        "samesite": "Lax",
    }
    if remember_me:
        cookie_params["max_age"] = 7 * 24 * 60 * 60  # 7 days

    response.set_cookie(**cookie_params)
    return response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    user = request.user
    return Response({"id": user.id, "email": user.email, "profile_picture": getattr(user, "profile_picture", None)})
