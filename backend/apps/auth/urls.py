from django.urls import path
from .views import (
    SignupView, login, LogoutView, LogoutAllView, user_profile,
    verify_email, resend_verification_email, get_organizer_by_user_id
)
from .views_auth import TokenRefreshView
from .views_oauth import GoogleAuthView, google_callback
from .csrf import get_csrf_token
# from .apple_auth import apple_auth_initiate, apple_auth_callback
# from .instagram_auth import instagram_auth_initiate, instagram_auth_callback

urlpatterns = [
    # ==============================================================================
    # CORE AUTHENTICATION
    # ==============================================================================
    path("signup/", SignupView.as_view(), name="signup"),
    path("login/", login, name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("logout-all/", LogoutAllView.as_view(), name="logout-all"),
    path("user-profile/", user_profile, name="user_profile"),
    path("organizers/user/<int:user_id>/", get_organizer_by_user_id, name="get_organizer"),

    # ==============================================================================
    # EMAIL VERIFICATION
    # ==============================================================================
    path("verify-email/", verify_email, name="verify_email"),
    path("resend-verification/", resend_verification_email, name="resend_verification"),

    # ==============================================================================
    # CSRF PROTECTION
    # ==============================================================================
    path("csrf/", get_csrf_token, name="csrf_token"),

    # ==============================================================================
    # TOKEN MANAGEMENT
    # ==============================================================================
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # ==============================================================================
    # OAUTH PROVIDERS (Active)
    # ==============================================================================
    path("auth/google/", GoogleAuthView.as_view(), name="google_auth"),
    path("auth/google/callback/", google_callback, name="google_callback"),
    
    # ==============================================================================
    # OAUTH PROVIDERS (Disabled - Uncomment to enable)
    # ==============================================================================
    # Apple Sign In - Requires: APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY
    # path("auth/apple/", apple_auth_initiate, name="apple_auth"),
    # path("auth/apple/callback/", apple_auth_callback, name="apple_callback"),
    
    # Instagram OAuth - Requires: INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET
    # Note: Instagram users need email collection endpoint (see update_email_for_oauth)
    # path("auth/instagram/", instagram_auth_initiate, name="instagram_auth"),
    # path("auth/instagram/callback/", instagram_auth_callback, name="instagram_callback"),
    # path("update-email/", update_email_for_oauth, name="update_email_oauth"),
]
