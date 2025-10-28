"""
Cache key generators for Events app.
Centralized key naming ensures consistency and easier invalidation.
"""


class EventCacheKeys:
    """Generate cache keys for Event-related data"""

    # Prefixes
    PREFIX = "events"
    DETAIL_PREFIX = f"{PREFIX}:detail"
    LIST_PREFIX = f"{PREFIX}:list"
    ORGANIZER_PREFIX = f"{PREFIX}:organizer"
    MEDIA_PREFIX = f"{PREFIX}:media"

    # TTL (Time To Live) in seconds
    DETAIL_TTL = 60 * 60  # 1 hour
    LIST_TTL = 60 * 15    # 15 minutes
    ORGANIZER_TTL = 60 * 15  # 15 minutes
    MEDIA_TTL = 60 * 60   # 1 hour

    @classmethod
    def event_detail(cls, event_id: int) -> str:
        """
        Cache key for a single event detail.
        Example: events:detail:123
        """
        return f"{cls.DETAIL_PREFIX}:{event_id}"

    @classmethod
    def event_list(cls, page: int = 1, is_finished: bool = None,
                   organizer_id: int = None) -> str:
        """
        Cache key for event list with filters.
        Example: events:list:page:1:finished:false
        Example: events:list:page:1:organizer:42
        """
        key_parts = [cls.LIST_PREFIX, f"page:{page}"]

        if is_finished is not None:
            key_parts.append(f"finished:{str(is_finished).lower()}")

        if organizer_id is not None:
            key_parts.append(f"organizer:{organizer_id}")

        return ":".join(key_parts)

    @classmethod
    def organizer_events(cls, organizer_id: int, page: int = 1) -> str:
        """
        Cache key for events by a specific organizer.
        Example: events:organizer:42:page:1
        """
        return f"{cls.ORGANIZER_PREFIX}:{organizer_id}:page:{page}"

    @classmethod
    def event_media(cls, event_id: int) -> str:
        """
        Cache key for media belonging to an event.
        Example: events:media:123
        """
        return f"{cls.MEDIA_PREFIX}:{event_id}"

    @classmethod
    def event_list_pattern(cls) -> str:
        """
        Pattern to match all event list cache keys for bulk invalidation.
        Example: events:list:*
        """
        return f"{cls.LIST_PREFIX}:*"

    @classmethod
    def organizer_pattern(cls, organizer_id: int) -> str:
        """
        Pattern to match all cache keys for a specific organizer.
        Example: events:organizer:42:*
        """
        return f"{cls.ORGANIZER_PREFIX}:{organizer_id}:*"

    @classmethod
    def all_events_pattern(cls) -> str:
        """
        Pattern to match ALL event-related cache keys.
        Example: events:*
        """
        return f"{cls.PREFIX}:*"


class EventMediaCacheKeys:
    """Generate cache keys for EventMedia-related data"""

    PREFIX = "event_media"
    DETAIL_PREFIX = f"{PREFIX}:detail"

    # TTL
    DETAIL_TTL = 60 * 60  # 1 hour

    @classmethod
    def media_detail(cls, media_id: int) -> str:
        """
        Cache key for a single media item.
        Example: event_media:detail:456
        """
        return f"{cls.DETAIL_PREFIX}:{media_id}"

    @classmethod
    def media_pattern(cls) -> str:
        """
        Pattern to match all media cache keys.
        Example: event_media:*
        """
        return f"{cls.PREFIX}:*"


class TierCacheKeys:
    """Generate cache keys for Tier-related data"""

    PREFIX = "tiers"
    DETAIL_PREFIX = f"{PREFIX}:detail"
    EVENT_PREFIX = f"{PREFIX}:event"

    # TTL
    DETAIL_TTL = 60 * 60  # 1 hour
    EVENT_TTL = 60 * 30   # 30 minutes

    @classmethod
    def tier_detail(cls, tier_id: int) -> str:
        """
        Cache key for a single tier detail.
        Example: tiers:detail:123
        """
        return f"{cls.DETAIL_PREFIX}:{tier_id}"

    @classmethod
    def event_tiers(cls, event_id: int) -> str:
        """
        Cache key for all tiers of an event.
        Example: tiers:event:456
        """
        return f"{cls.EVENT_PREFIX}:{event_id}"

    @classmethod
    def event_pattern(cls, event_id: int) -> str:
        """
        Pattern to match all tier cache keys for a specific event.
        Example: tiers:event:456:*
        """
        return f"{cls.EVENT_PREFIX}:{event_id}:*"

    @classmethod
    def all_tiers_pattern(cls) -> str:
        """
        Pattern to match ALL tier-related cache keys.
        Example: tiers:*
        """
        return f"{cls.PREFIX}:*"


class WaveCacheKeys:
    """Generate cache keys for Wave-related data"""

    PREFIX = "waves"
    DETAIL_PREFIX = f"{PREFIX}:detail"
    TIER_PREFIX = f"{PREFIX}:tier"

    # TTL
    DETAIL_TTL = 60 * 60  # 1 hour
    TIER_TTL = 60 * 30    # 30 minutes

    @classmethod
    def wave_detail(cls, wave_id: int) -> str:
        """Cache key for a single wave detail."""
        return f"{cls.DETAIL_PREFIX}:{wave_id}"

    @classmethod
    def tier_waves(cls, tier_id: int) -> str:
        """Cache key for all waves of a tier."""
        return f"{cls.TIER_PREFIX}:{tier_id}"

    @classmethod
    def tier_pattern(cls, tier_id: int) -> str:
        """Pattern to match all wave cache keys for a specific tier."""
        return f"{cls.TIER_PREFIX}:{tier_id}:*"


class PrivilegeCacheKeys:
    """Generate cache keys for Privilege-related data"""

    PREFIX = "privileges"
    DETAIL_PREFIX = f"{PREFIX}:detail"
    TIER_PREFIX = f"{PREFIX}:tier"

    # TTL
    DETAIL_TTL = 60 * 60  # 1 hour
    TIER_TTL = 60 * 30    # 30 minutes

    @classmethod
    def privilege_detail(cls, privilege_id: int) -> str:
        """Cache key for a single privilege detail."""
        return f"{cls.DETAIL_PREFIX}:{privilege_id}"

    @classmethod
    def tier_privileges(cls, tier_id: int) -> str:
        """Cache key for all privileges of a tier."""
        return f"{cls.TIER_PREFIX}:{tier_id}"

    @classmethod
    def tier_pattern(cls, tier_id: int) -> str:
        """Pattern to match all privilege cache keys for a specific tier."""
        return f"{cls.TIER_PREFIX}:{tier_id}:*"


class AddOnCacheKeys:
    """Generate cache keys for AddOn-related data"""

    PREFIX = "addons"
    DETAIL_PREFIX = f"{PREFIX}:detail"
    TIER_PREFIX = f"{PREFIX}:tier"

    # TTL
    DETAIL_TTL = 60 * 60  # 1 hour
    TIER_TTL = 60 * 30    # 30 minutes

    @classmethod
    def addon_detail(cls, addon_id: int) -> str:
        """Cache key for a single add-on detail."""
        return f"{cls.DETAIL_PREFIX}:{addon_id}"

    @classmethod
    def tier_addons(cls, tier_id: int) -> str:
        """Cache key for all add-ons of a tier."""
        return f"{cls.TIER_PREFIX}:{tier_id}"

    @classmethod
    def tier_pattern(cls, tier_id: int) -> str:
        """Pattern to match all add-on cache keys for a specific tier."""
        return f"{cls.TIER_PREFIX}:{tier_id}:*"


class TableCacheKeys:
    """Generate cache keys for Table-related data"""

    PREFIX = "tables"
    DETAIL_PREFIX = f"{PREFIX}:detail"
    TIER_PREFIX = f"{PREFIX}:tier"

    # TTL
    DETAIL_TTL = 60 * 60  # 1 hour
    TIER_TTL = 60 * 30    # 30 minutes

    @classmethod
    def table_detail(cls, table_id: int) -> str:
        """Cache key for a single table detail."""
        return f"{cls.DETAIL_PREFIX}:{table_id}"

    @classmethod
    def tier_tables(cls, tier_id: int) -> str:
        """Cache key for all tables of a tier."""
        return f"{cls.TIER_PREFIX}:{tier_id}"

    @classmethod
    def tier_pattern(cls, tier_id: int) -> str:
        """Pattern to match all table cache keys for a specific tier."""
        return f"{cls.TIER_PREFIX}:{tier_id}:*"