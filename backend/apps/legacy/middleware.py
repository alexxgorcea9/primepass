import jwt
from django.http import JsonResponse
from django.conf import settings
from .cache import get_cached_user

class JWTAuthMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        token = self.get_token_from_request(request)

        if token:
            payload = self.verify_token(token)
            if payload:
                user_data = get_cached_user(payload['user_id'])
                if user_data and user_data['is_active']:
                    request.user_data = user_data
                    request.is_authenticated = True
                else:
                    request.is_authenticated = False
            else:
                request.is_authenticated = False
        else:
            request.is_authenticated = False

        response = self.get_response(request)
        return response

    def get_token_from_request(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if auth_header and auth_header.startswith('Bearer '):
            return auth_header.split(' ')[1]
        return None

    def verify_token(self, token):
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            return payload
        except:
            return None
