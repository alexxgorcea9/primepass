# apps/auth/views_verification.py (or in views.py if you prefer)
import logging
from datetime import timedelta
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)

class VerificationStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Optional: surface resend cooldown to power the button UI
        # (adjust if you store last_sent on the user; fallback to ratelimit only)
        resend_available_in = 0
        if hasattr(user, "email_verification_sent_at") and user.email_verification_sent_at:
            # e.g., 60s local cooldown for the button UX (independent from server ratelimit)
            cooldown = timedelta(seconds=60)
            remaining = (user.email_verification_sent_at + cooldown) - timezone.now()
            resend_available_in = max(0, int(remaining.total_seconds()))

        state = "verified" if user.email_verified else "is_waiting"

        # TODO: compute your next onboarding step; placeholder for now
        next_step = "complete_profile" if user.email_verified else None

        return Response({
            "email_verified": bool(user.email_verified),
            "state": state,
            "next_step": next_step,
            "resend_available_in": resend_available_in
        }, status=status.HTTP_200_OK)
