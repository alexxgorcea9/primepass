"""
Redis cache service for Events app.
Centralized caching operations with error handling and logging.
"""
import json
import logging
from typing import Any, Optional, List
from django.core.cache import cache
from django.conf import settings

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
            pattern: Redis pattern (e.g., "events:list:*")

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


class EventCacheService:
    """High-level cache operations for Events"""

    @staticmethod
    def invalidate_event(event_id: int, organizer_id: int = None):
        """
        Invalidate all cache related to a specific event.

        Args:
            event_id: Event ID
            organizer_id: Optional organizer ID for targeted invalidation
        """
        from .keys import EventCacheKeys, PostCacheKeys

        # Delete event detail
        CacheService.delete(EventCacheKeys.event_detail(event_id))

        # Delete event media
        CacheService.delete(EventCacheKeys.event_media(event_id))

        # Delete event posts
        CacheService.delete(PostCacheKeys.event_posts(event_id))
        CacheService.delete_pattern(PostCacheKeys.event_pattern(event_id))

        # Delete all event lists (since the event appears in lists)
        CacheService.delete_pattern(EventCacheKeys.event_list_pattern())

        # Delete organizer's event lists if known
        if organizer_id:
            CacheService.delete_pattern(EventCacheKeys.organizer_pattern(organizer_id))

        logger.info(f"Invalidated cache for event {event_id}")

    @staticmethod
    def invalidate_event_lists():
        """Invalidate all event list caches"""
        from .keys import EventCacheKeys
        CacheService.delete_pattern(EventCacheKeys.event_list_pattern())
        logger.info("Invalidated all event list caches")

    @staticmethod
    def invalidate_organizer_events(organizer_id: int):
        """Invalidate all cache for a specific organizer"""
        from .keys import EventCacheKeys
        CacheService.delete_pattern(EventCacheKeys.organizer_pattern(organizer_id))
        logger.info(f"Invalidated cache for organizer {organizer_id}")

    @staticmethod
    def invalidate_all_events():
        """Invalidate ALL event-related cache. Use sparingly!"""
        from .keys import EventCacheKeys
        CacheService.delete_pattern(EventCacheKeys.all_events_pattern())
        logger.warning("Invalidated ALL event caches")

    @staticmethod
    def invalidate_event_posts(event_id: int):
        """
        Invalidate post list cache for an event.

        Args:
            event_id: Event ID
        """
        from .keys import PostCacheKeys

        cache_key = PostCacheKeys.event_posts(event_id)
        CacheService.delete(cache_key)
        logger.info(f"Invalidated event posts cache: {cache_key}")

    @staticmethod
    def invalidate_post(post_id: int, event_id: int):
        """
        Invalidate single post and related caches.

        Args:
            post_id: Post ID
            event_id: Event ID
        """
        from .keys import PostCacheKeys

        # Invalidate post detail
        post_key = PostCacheKeys.post_detail(post_id)
        CacheService.delete(post_key)

        # Invalidate event posts list
        EventCacheService.invalidate_event_posts(event_id)

        logger.info(f"Invalidated post cache: {post_key}")


class TierCacheService:
    """High-level cache operations for Tiers and related models"""

    @staticmethod
    def invalidate_tier(tier_id: int, event_id: int = None):
        """
        Invalidate all cache related to a specific tier.

        Args:
            tier_id: Tier ID
            event_id: Optional event ID for targeted invalidation
        """
        from .keys import TierCacheKeys, WaveCacheKeys, PrivilegeCacheKeys, AddOnCacheKeys, TableCacheKeys

        # Delete tier detail
        CacheService.delete(TierCacheKeys.tier_detail(tier_id))

        # Delete tier's nested resources
        CacheService.delete_pattern(WaveCacheKeys.tier_pattern(tier_id))
        CacheService.delete_pattern(PrivilegeCacheKeys.tier_pattern(tier_id))
        CacheService.delete_pattern(AddOnCacheKeys.tier_pattern(tier_id))
        CacheService.delete_pattern(TableCacheKeys.tier_pattern(tier_id))

        # Delete event's tier list if known
        if event_id:
            CacheService.delete(TierCacheKeys.event_tiers(event_id))

        logger.info(f"Invalidated cache for tier {tier_id}")

    @staticmethod
    def invalidate_event_tiers(event_id: int):
        """Invalidate all tier cache for a specific event"""
        from .keys import TierCacheKeys
        CacheService.delete(TierCacheKeys.event_tiers(event_id))
        CacheService.delete_pattern(TierCacheKeys.event_pattern(event_id))
        logger.info(f"Invalidated tier cache for event {event_id}")

    @staticmethod
    def invalidate_wave(wave_id: int, tier_id: int = None):
        """Invalidate cache for a specific wave"""
        from .keys import WaveCacheKeys, TierCacheKeys

        CacheService.delete(WaveCacheKeys.wave_detail(wave_id))

        if tier_id:
            CacheService.delete(WaveCacheKeys.tier_waves(tier_id))
            CacheService.delete(TierCacheKeys.tier_detail(tier_id))

        logger.info(f"Invalidated cache for wave {wave_id}")

    @staticmethod
    def invalidate_privilege(privilege_id: int, tier_id: int = None):
        """Invalidate cache for a specific privilege"""
        from .keys import PrivilegeCacheKeys, TierCacheKeys

        CacheService.delete(PrivilegeCacheKeys.privilege_detail(privilege_id))

        if tier_id:
            CacheService.delete(PrivilegeCacheKeys.tier_privileges(tier_id))
            CacheService.delete(TierCacheKeys.tier_detail(tier_id))

        logger.info(f"Invalidated cache for privilege {privilege_id}")

    @staticmethod
    def invalidate_addon(addon_id: int, tier_id: int = None):
        """Invalidate cache for a specific add-on"""
        from .keys import AddOnCacheKeys, TierCacheKeys

        CacheService.delete(AddOnCacheKeys.addon_detail(addon_id))

        if tier_id:
            CacheService.delete(AddOnCacheKeys.tier_addons(tier_id))
            CacheService.delete(TierCacheKeys.tier_detail(tier_id))

        logger.info(f"Invalidated cache for add-on {addon_id}")

    @staticmethod
    def invalidate_table(table_id: int, tier_id: int = None):
        """Invalidate cache for a specific table"""
        from .keys import TableCacheKeys, TierCacheKeys

        CacheService.delete(TableCacheKeys.table_detail(table_id))

        if tier_id:
            CacheService.delete(TableCacheKeys.tier_tables(tier_id))
            CacheService.delete(TierCacheKeys.tier_detail(tier_id))

        logger.info(f"Invalidated cache for table {table_id}")