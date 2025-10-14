"""
CSRF Protection Utilities

This module provides CSRF protection for cookie-based JWT authentication.
Django's built-in CSRF protection is used with custom enforcement for JWT cookies.
"""

from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def get_csrf_token(request):
    """
    Get CSRF token for the current session.
    
    The frontend should call this endpoint before making any state-changing
    requests (POST, PUT, PATCH, DELETE) to get a CSRF token.
    
    The token is automatically set in a cookie (csrftoken) and also returned
    in the response for convenience.
    
    Usage (Frontend):
        1. Call this endpoint: GET /api/auth/csrf/
        2. Extract token from cookie 'csrftoken' or from response body
        3. Include token in subsequent requests as:
           - Header: X-CSRFToken: <token>
           - OR Form field: csrfmiddlewaretoken=<token>
    
    Returns:
        JSON with csrf_token
    """
    csrf_token = get_token(request)
    
    logger.debug(f"CSRF token generated for session")
    
    return Response({
        'csrf_token': csrf_token,
        'detail': 'CSRF cookie set successfully'
    })
