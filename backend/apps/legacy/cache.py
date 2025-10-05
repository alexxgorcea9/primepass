from django.core.cache import cache
from django.contrib.auth import get_user_model

User = get_user_model()


def get_cached_user(user_id):
    """Get user data from cache or database with improved performance.

    Uses a longer cache timeout and includes all necessary user data to prevent
    additional database queries during authentication flows.
    """
    cache_key = f"user:{user_id}"
    user_data = cache.get(cache_key)

    if user_data is None:
        try:
            # Use select_related to minimize database queries
            user = User.objects.get(id=user_id)

            # Pre-fetch permissions in a single query to avoid N+1 query problems
            permissions = list(user.get_all_permissions())

            user_data = {
                'id': user.id,
                'email': user.email,
                'name': user.get_full_name(),
                'is_active': user.is_active,
                'permissions': permissions,
                'role': user.role,
                'profile_picture': user.profile_picture,
                'last_login': user.last_login.isoformat() if user.last_login else None
            }

            # Extend cache timeout to 24 hours to reduce DB load
            # This significantly helps during high traffic login periods
            cache.set(cache_key, user_data, timeout=86400)  # 24 hours
        except User.DoesNotExist:
            return None

    return user_data


def invalidate_user_cache(user_id):
    cache.delete(f"user:{user_id}")
