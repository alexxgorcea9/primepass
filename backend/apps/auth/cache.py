"""
User caching utilities with automatic invalidation.

This module provides user data caching with 24-hour expiry and
automatic cache invalidation when user data changes.
"""

from django.core.cache import cache
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


def get_cached_user(user_id):
    """
    Get user data from cache or database with improved performance.
    
    Args:
        user_id: The user's primary key
        
    Returns:
        dict: User data dictionary or None if user doesn't exist
    """
    cache_key = f"user:{user_id}"
    user_data = cache.get(cache_key)

    if user_data is None:
        try:
            user = User.objects.get(id=user_id)
            permissions = list(user.get_all_permissions())

            user_data = {
                'id': user.id,
                'email': user.email,
                'name': getattr(user, 'name', user.email),
                'is_active': user.is_active,
                'permissions': permissions,
                'role': user.role,
                'profile_picture': user.profile_picture.url if user.profile_picture else None,
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'organizer_bio': getattr(user, 'organizer_bio', None)
            }

            cache.set(cache_key, user_data, timeout=86400)  # 24 hours
            logger.debug(f"Cached user data for user_id={user_id}")
        except User.DoesNotExist:
            logger.warning(f"User with id={user_id} not found")
            return None

    return user_data


def invalidate_user_cache(user_id):
    """
    Invalidate cached user data.
    
    Call this after any operation that modifies user data:
    - Email changes
    - Role/permission changes
    - Profile updates
    - Account deactivation
    - Logout operations
    
    Args:
        user_id: The user's primary key
    """
    cache_key = f"user:{user_id}"
    result = cache.delete(cache_key)
    logger.info(f"Invalidated cache for user_id={user_id} (existed={result})")
    return result


def invalidate_multiple_user_caches(user_ids):
    """
    Invalidate cached data for multiple users.
    
    Useful for bulk operations like role changes for a group of users.
    
    Args:
        user_ids: List or iterable of user primary keys
    """
    cache_keys = [f"user:{user_id}" for user_id in user_ids]
    cache.delete_many(cache_keys)
    logger.info(f"Invalidated cache for {len(user_ids)} users")


# ==============================================================================
# AUTOMATIC CACHE INVALIDATION VIA SIGNALS
# ==============================================================================

@receiver(post_save, sender=User)
def invalidate_cache_on_user_save(sender, instance, created, **kwargs):
    """
    Automatically invalidate user cache when user model is saved.
    
    This ensures cache stays fresh when:
    - User profile is updated
    - Email is changed
    - Role is modified
    - Account is activated/deactivated
    - Any field is updated
    """
    if not created:  # Only invalidate on updates, not creates
        invalidate_user_cache(instance.id)
        logger.debug(f"Auto-invalidated cache for updated user_id={instance.id}")


@receiver(post_delete, sender=User)
def invalidate_cache_on_user_delete(sender, instance, **kwargs):
    """
    Automatically invalidate user cache when user is deleted.
    """
    invalidate_user_cache(instance.id)
    logger.debug(f"Auto-invalidated cache for deleted user_id={instance.id}")
