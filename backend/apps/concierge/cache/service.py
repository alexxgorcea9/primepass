"""
Redis cache service for Concierge app (Special Requests).
Centralized caching operations with error handling and logging.
"""
import logging
from typing import Any, Optional, List
from django.core.cache import cache

logger = logging.getLogger(__name__)


class CacheService:
    """Service for Redis caching operations"""

    @staticmethod
    def get(key: str) -> Optional[Any]:
        """
        Get value from cache.

        Args:
            key: Cache key

        Returns:
            Cached value or None if not found/error
        """
        try:
            value = cache.get(key)
            if value is not None:
                logger.debug(f"Cache HIT: {key}")
            else:
                logger.debug(f"Cache MISS: {key}")
            return value
        except Exception as e:
            logger.error(f"Cache GET error for key '{key}': {e}")
            return None

    @staticmethod
    def set(key: str, value: Any, timeout: int = None) -> bool:
        """
        Set value in cache.

        Args:
            key: Cache key
            value: Value to cache (will be JSON serialized if dict/list)
            timeout: TTL in seconds (None = default from settings)

        Returns:
            True if successful, False otherwise
        """
        try:
            cache.set(key, value, timeout)
            logger.debug(f"Cache SET: {key} (TTL: {timeout}s)")
            return True
        except Exception as e:
            logger.error(f"Cache SET error for key '{key}': {e}")
            return False

    @staticmethod
    def delete(key: str) -> bool:
        """
        Delete a single key from cache.

        Args:
            key: Cache key to delete

        Returns:
            True if successful, False otherwise
        """
        try:
            cache.delete(key)
            logger.debug(f"Cache DELETE: {key}")
            return True
        except Exception as e:
            logger.error(f"Cache DELETE error for key '{key}': {e}")
            return False

    @staticmethod
    def delete_pattern(pattern: str) -> int:
        """
        Delete all keys matching a pattern.

        Args:
            pattern: Redis pattern (e.g., "special_requests:list:*")

        Returns:
            Number of keys deleted
        """
        try:
            # Django's cache doesn't have delete_pattern by default
            # We need to use the underlying Redis client
            if hasattr(cache, 'delete_pattern'):
                # django-redis supports this
                deleted = cache.delete_pattern(pattern)
                logger.info(f"Cache DELETE_PATTERN: {pattern} ({deleted} keys)")
                return deleted
            else:
                # Fallback: get all keys and delete them
                # Note: This requires django-redis or similar backend
                from django.core.cache import caches
                redis_cache = caches['default']

                if hasattr(redis_cache, 'keys'):
                    keys = redis_cache.keys(pattern)
                    if keys:
                        cache.delete_many(keys)
                        logger.info(f"Cache DELETE_PATTERN: {pattern} ({len(keys)} keys)")
                        return len(keys)

                logger.warning(f"Cache backend doesn't support pattern deletion: {pattern}")
                return 0
        except Exception as e:
            logger.error(f"Cache DELETE_PATTERN error for pattern '{pattern}': {e}")
            return 0

    @staticmethod
    def delete_many(keys: List[str]) -> bool:
        """
        Delete multiple keys from cache.

        Args:
            keys: List of cache keys to delete

        Returns:
            True if successful, False otherwise
        """
        try:
            if keys:
                cache.delete_many(keys)
                logger.debug(f"Cache DELETE_MANY: {len(keys)} keys")
            return True
        except Exception as e:
            logger.error(f"Cache DELETE_MANY error: {e}")
            return False

    @staticmethod
    def clear_all() -> bool:
        """
        Clear entire cache. Use with caution!

        Returns:
            True if successful, False otherwise
        """
        try:
            cache.clear()
            logger.warning("Cache CLEARED: All keys deleted")
            return True
        except Exception as e:
            logger.error(f"Cache CLEAR error: {e}")
            return False

    @staticmethod
    def get_or_set(key: str, callback, timeout: int = None) -> Optional[Any]:
        """
        Get from cache, or set using callback if not found.

        Args:
            key: Cache key
            callback: Function to call if cache miss (should return value to cache)
            timeout: TTL in seconds

        Returns:
            Cached or freshly computed value
        """
        try:
            value = CacheService.get(key)

            if value is None:
                # Cache miss - compute value
                value = callback()
                if value is not None:
                    CacheService.set(key, value, timeout)

            return value
        except Exception as e:
            logger.error(f"Cache GET_OR_SET error for key '{key}': {e}")
            # On error, just return fresh data without caching
            try:
                return callback()
            except Exception as callback_error:
                logger.error(f"Callback error in get_or_set: {callback_error}")
                return None


class SpecialRequestCacheService:
    """High-level cache operations for Special Requests"""

    @staticmethod
    def invalidate_request(request_id: int, guest_id: int = None, 
                          event_id: int = None, assigned_to_id: int = None):
        """
        Invalidate all cache related to a specific special request.

        Args:
            request_id: Special request ID
            guest_id: Optional guest ID for targeted invalidation
            event_id: Optional event ID for targeted invalidation
            assigned_to_id: Optional assigned team member ID for targeted invalidation
        """
        from .keys import SpecialRequestCacheKeys, SpecialRequestMessageCacheKeys

        # Delete request detail
        CacheService.delete(SpecialRequestCacheKeys.request_detail(request_id))

        # Delete request messages
        CacheService.delete(SpecialRequestMessageCacheKeys.request_messages(request_id))
        CacheService.delete_pattern(SpecialRequestMessageCacheKeys.request_pattern(request_id))

        # Delete all request lists (since the request appears in lists)
        CacheService.delete_pattern(SpecialRequestCacheKeys.request_list_pattern())

        # Delete guest's request lists if known
        if guest_id:
            CacheService.delete_pattern(SpecialRequestCacheKeys.guest_pattern(guest_id))

        # Delete event's request lists if known
        if event_id:
            CacheService.delete_pattern(SpecialRequestCacheKeys.event_pattern(event_id))

        # Delete assigned team member's request lists if known
        if assigned_to_id:
            CacheService.delete_pattern(SpecialRequestCacheKeys.assigned_pattern(assigned_to_id))

        logger.info(f"Invalidated cache for special request {request_id}")

    @staticmethod
    def invalidate_request_lists():
        """Invalidate all special request list caches"""
        from .keys import SpecialRequestCacheKeys
        CacheService.delete_pattern(SpecialRequestCacheKeys.request_list_pattern())
        logger.info("Invalidated all special request list caches")

    @staticmethod
    def invalidate_guest_requests(guest_id: int):
        """Invalidate all cache for a specific guest's requests"""
        from .keys import SpecialRequestCacheKeys
        CacheService.delete_pattern(SpecialRequestCacheKeys.guest_pattern(guest_id))
        logger.info(f"Invalidated cache for guest {guest_id} requests")

    @staticmethod
    def invalidate_event_requests(event_id: int):
        """Invalidate all cache for a specific event's requests"""
        from .keys import SpecialRequestCacheKeys
        CacheService.delete_pattern(SpecialRequestCacheKeys.event_pattern(event_id))
        logger.info(f"Invalidated cache for event {event_id} requests")

    @staticmethod
    def invalidate_assigned_requests(user_id: int):
        """Invalidate all cache for requests assigned to a team member"""
        from .keys import SpecialRequestCacheKeys
        CacheService.delete_pattern(SpecialRequestCacheKeys.assigned_pattern(user_id))
        logger.info(f"Invalidated cache for assigned requests to user {user_id}")

    @staticmethod
    def invalidate_all_requests():
        """Invalidate ALL special request-related cache. Use sparingly!"""
        from .keys import SpecialRequestCacheKeys
        CacheService.delete_pattern(SpecialRequestCacheKeys.all_requests_pattern())
        logger.warning("Invalidated ALL special request caches")

    @staticmethod
    def invalidate_request_messages(request_id: int):
        """
        Invalidate message cache for a special request.

        Args:
            request_id: Special request ID
        """
        from .keys import SpecialRequestMessageCacheKeys, SpecialRequestCacheKeys

        # Delete messages list
        cache_key = SpecialRequestMessageCacheKeys.request_messages(request_id)
        CacheService.delete(cache_key)

        # Also invalidate the request detail since it includes messages
        CacheService.delete(SpecialRequestCacheKeys.request_detail(request_id))

        logger.info(f"Invalidated special request messages cache: {cache_key}")

    @staticmethod
    def invalidate_message(message_id: int, request_id: int):
        """
        Invalidate single message and related caches.

        Args:
            message_id: Message ID
            request_id: Special request ID
        """
        from .keys import SpecialRequestMessageCacheKeys

        # Invalidate message detail
        message_key = SpecialRequestMessageCacheKeys.message_detail(message_id)
        CacheService.delete(message_key)

        # Invalidate request messages list
        SpecialRequestCacheService.invalidate_request_messages(request_id)

        logger.info(f"Invalidated message cache: {message_key}")


class MessageCacheService:
    """High-level cache operations for Messages"""

    @staticmethod
    def invalidate_message(message_id: int, request_id: int):
        """
        Invalidate cache for a specific message.

        Args:
            message_id: Message ID
            request_id: Special request ID
        """
        from .keys import SpecialRequestMessageCacheKeys

        # Delete message detail
        CacheService.delete(SpecialRequestMessageCacheKeys.message_detail(message_id))

        # Delete request messages list
        CacheService.delete(SpecialRequestMessageCacheKeys.request_messages(request_id))

        logger.info(f"Invalidated cache for message {message_id}")

    @staticmethod
    def invalidate_request_messages(request_id: int):
        """Invalidate all message cache for a specific request"""
        from .keys import SpecialRequestMessageCacheKeys
        CacheService.delete(SpecialRequestMessageCacheKeys.request_messages(request_id))
        CacheService.delete_pattern(SpecialRequestMessageCacheKeys.request_pattern(request_id))
        logger.info(f"Invalidated message cache for request {request_id}")
