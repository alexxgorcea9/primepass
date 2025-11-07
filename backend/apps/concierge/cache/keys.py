"""
Cache key generators for Concierge app (Special Requests).
Centralized key naming ensures consistency and easier invalidation.
"""


class SpecialRequestCacheKeys:
    """Generate cache keys for SpecialRequest-related data"""

    # Prefixes
    PREFIX = "special_requests"
    DETAIL_PREFIX = f"{PREFIX}:detail"
    LIST_PREFIX = f"{PREFIX}:list"
    GUEST_PREFIX = f"{PREFIX}:guest"
    EVENT_PREFIX = f"{PREFIX}:event"
    STATUS_PREFIX = f"{PREFIX}:status"
    ASSIGNED_PREFIX = f"{PREFIX}:assigned"

    # TTL (Time To Live) in seconds
    DETAIL_TTL = 60 * 30  # 30 minutes
    LIST_TTL = 60 * 10    # 10 minutes
    GUEST_TTL = 60 * 10   # 10 minutes
    EVENT_TTL = 60 * 15   # 15 minutes

    @classmethod
    def request_detail(cls, request_id: int) -> str:
        """
        Cache key for a single special request detail.
        Example: special_requests:detail:123
        """
        return f"{cls.DETAIL_PREFIX}:{request_id}"

    @classmethod
    def request_list(cls, page: int = 1, status: str = None, 
                     event_id: int = None, user_id: int = None) -> str:
        """
        Cache key for special request list with filters.
        Example: special_requests:list:page:1:status:pending
        Example: special_requests:list:page:1:event:42
        """
        key_parts = [cls.LIST_PREFIX, f"page:{page}"]

        if status:
            key_parts.append(f"status:{status}")

        if event_id:
            key_parts.append(f"event:{event_id}")

        if user_id:
            key_parts.append(f"user:{user_id}")

        return ":".join(key_parts)

    @classmethod
    def guest_requests(cls, guest_id: int, page: int = 1, status: str = None) -> str:
        """
        Cache key for requests by a specific guest.
        Example: special_requests:guest:42:page:1
        Example: special_requests:guest:42:page:1:status:pending
        """
        key = f"{cls.GUEST_PREFIX}:{guest_id}:page:{page}"
        if status:
            key += f":status:{status}"
        return key

    @classmethod
    def event_requests(cls, event_id: int, page: int = 1, status: str = None) -> str:
        """
        Cache key for requests for a specific event.
        Example: special_requests:event:123:page:1
        Example: special_requests:event:123:page:1:status:resolved
        """
        key = f"{cls.EVENT_PREFIX}:{event_id}:page:{page}"
        if status:
            key += f":status:{status}"
        return key

    @classmethod
    def assigned_requests(cls, user_id: int, page: int = 1) -> str:
        """
        Cache key for requests assigned to a specific team member.
        Example: special_requests:assigned:42:page:1
        """
        return f"{cls.ASSIGNED_PREFIX}:{user_id}:page:{page}"

    @classmethod
    def request_list_pattern(cls) -> str:
        """
        Pattern to match all request list cache keys for bulk invalidation.
        Example: special_requests:list:*
        """
        return f"{cls.LIST_PREFIX}:*"

    @classmethod
    def guest_pattern(cls, guest_id: int) -> str:
        """
        Pattern to match all cache keys for a specific guest.
        Example: special_requests:guest:42:*
        """
        return f"{cls.GUEST_PREFIX}:{guest_id}:*"

    @classmethod
    def event_pattern(cls, event_id: int) -> str:
        """
        Pattern to match all cache keys for a specific event.
        Example: special_requests:event:123:*
        """
        return f"{cls.EVENT_PREFIX}:{event_id}:*"

    @classmethod
    def assigned_pattern(cls, user_id: int) -> str:
        """
        Pattern to match all cache keys for assigned requests.
        Example: special_requests:assigned:42:*
        """
        return f"{cls.ASSIGNED_PREFIX}:{user_id}:*"

    @classmethod
    def all_requests_pattern(cls) -> str:
        """
        Pattern to match ALL special request-related cache keys.
        Example: special_requests:*
        """
        return f"{cls.PREFIX}:*"


class SpecialRequestMessageCacheKeys:
    """Generate cache keys for SpecialRequestMessage-related data"""

    PREFIX = "special_request_messages"
    DETAIL_PREFIX = f"{PREFIX}:detail"
    REQUEST_PREFIX = f"{PREFIX}:request"

    # TTL
    DETAIL_TTL = 60 * 30  # 30 minutes
    REQUEST_TTL = 60 * 10  # 10 minutes

    @classmethod
    def message_detail(cls, message_id: int) -> str:
        """
        Cache key for a single message.
        Example: special_request_messages:detail:456
        """
        return f"{cls.DETAIL_PREFIX}:{message_id}"

    @classmethod
    def request_messages(cls, request_id: int) -> str:
        """
        Cache key for all messages in a special request.
        Example: special_request_messages:request:123
        """
        return f"{cls.REQUEST_PREFIX}:{request_id}"

    @classmethod
    def request_pattern(cls, request_id: int) -> str:
        """
        Pattern to match all message cache keys for a specific request.
        Example: special_request_messages:request:123:*
        """
        return f"{cls.REQUEST_PREFIX}:{request_id}:*"

    @classmethod
    def all_messages_pattern(cls) -> str:
        """
        Pattern to match all message cache keys.
        Example: special_request_messages:*
        """
        return f"{cls.PREFIX}:*"
