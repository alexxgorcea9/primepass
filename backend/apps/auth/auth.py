import jwt
from datetime import datetime, timedelta
from django.conf import settings
from django.core.cache import cache

class JWTAuth:
    @staticmethod
    def generate_tokens(user):
        payload = {
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(hours=1),  # Short-lived access token
            'iat': datetime.utcnow(),
            'type': 'access'
        }
        access_token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

        # Refresh token (longer-lived, stored in Redis)
        refresh_payload = {
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(days=7),
            'type': 'refresh'
        }
        refresh_token = jwt.encode(refresh_payload, settings.SECRET_KEY, algorithm='HS256')

        # Store refresh token in Redis
        cache.set(f"refresh_token:{user.id}", refresh_token, timeout=7*24*3600)

        return access_token, refresh_token

    @staticmethod
    def verify_token(token):
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
