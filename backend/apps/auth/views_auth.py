# apps/auth/views_auth.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model  # 👈 add this
from rest_framework.permissions import AllowAny, IsAuthenticated

class TokenRefreshView(APIView):
    permission_classes = [AllowAny]  # keep public

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get('refresh_token')
        remember_me = bool(request.data.get('remember_me', False))

        if not refresh_token:
            return Response({"detail": "Refresh token not found in cookies."},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            refresh = RefreshToken(refresh_token)

            # default: no rotation
            out_refresh = str(refresh)
            access_token = str(refresh.access_token)

            if settings.SIMPLE_JWT.get('ROTATE_REFRESH_TOKENS', False):
                # blacklist old token if blacklist app is enabled
                try:
                    refresh.blacklist()
                except Exception:
                    # ignore if blacklist not configured/migrated
                    pass

                # get user from token payload (not request.user!)
                User = get_user_model()
                user_id = refresh.get('user_id') or refresh.payload.get('user_id')
                user = User.objects.get(id=user_id)

                new_refresh = RefreshToken.for_user(user)
                out_refresh = str(new_refresh)
                access_token = str(new_refresh.access_token)

            # build response
            resp = Response({
                "access": access_token,
                # include refresh only in DEBUG to avoid leaking it to JS in prod
                "refresh": out_refresh if settings.DEBUG else None,
            })

            # set cookie (use max_age only; no expires)
            cookie_params = {
                "key": "refresh_token",
                "value": out_refresh,
                "secure": not settings.DEBUG,
                "httponly": True,
                "samesite": "Lax",
            }
            if remember_me:
                cookie_params["max_age"] = 7 * 24 * 60 * 60  # 7 days
            resp.set_cookie(**cookie_params)
            return resp

        except TokenError as e:
            return Response({"detail": f"Invalid token: {str(e)}"},
                            status=status.HTTP_401_UNAUTHORIZED)
        except get_user_model().DoesNotExist:
            return Response({"detail": "User not found for this token."},
                            status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"detail": f"Error refreshing token: {str(e)}"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
