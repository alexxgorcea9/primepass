from django.urls import path
from .views import SignupView, login, LogoutView, LogoutAllView, user_profile
from .views_auth import TokenRefreshView
from .views_oauth import (
    GoogleAuthView, google_callback,
    InstagramAuthView, instagram_callback,
    AppleAuthView, apple_callback
)

urlpatterns = [
    path("signup/", SignupView.as_view(), name="signup"),
    path("login/", login),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("logout-all/", LogoutAllView.as_view(), name="logout-all"),
    path("user-profile/", user_profile),

    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    path("auth/google/", GoogleAuthView.as_view(), name="google_auth"),
    path("auth/google/callback/", google_callback, name="google_callback"),
    path("auth/instagram/", InstagramAuthView.as_view(), name="instagram_auth"),
    path("auth/instagram/callback/", instagram_callback, name="instagram_callback"),
    path("auth/apple/", AppleAuthView.as_view(), name="apple_auth"),
    path("auth/apple/callback/", apple_callback, name="apple_callback"),
]
