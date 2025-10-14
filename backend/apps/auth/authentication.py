from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed


class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication class that reads the JWT token from cookies
    instead of the Authorization header.
    """
    
    def authenticate(self, request):
        # First try to get token from cookie
        raw_token = request.COOKIES.get('access_token')
        
        if raw_token is None:
            # Fallback to header for backward compatibility
            header = self.get_header(request)
            if header is None:
                return None
            raw_token = self.get_raw_token(header)
        
        if raw_token is None:
            return None

        # Validate the token
        validated_token = self.get_validated_token(raw_token)
        
        # Return user and token
        return self.get_user(validated_token), validated_token
