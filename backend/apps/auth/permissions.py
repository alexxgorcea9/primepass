from rest_framework.permissions import BasePermission

class IsEmailVerified(BasePermission):
    """
        Allow only verified users. Views can opt-out with `email_verification_exempt = True`.
    """
    message = "Email not verified."
    def has_permission(self, request, view):
        if getattr(view, "email_verification_exempt", False):
            return True
        user = request.user
        return bool(user and user.is_authenticated and getattr(user, "email_verified", False))