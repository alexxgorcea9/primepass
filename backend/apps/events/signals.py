"""
Django signals for automatic cache invalidation.
These signals fire when models are saved/deleted and invalidate relevant cache.
"""
import logging
from django.db.models.signals import post_save, post_delete, pre_delete
from django.dispatch import receiver

from apps.events.models import Event, EventMedia
from apps.events.cache.service import EventCacheService

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Event)
def invalidate_event_cache_on_save(sender, instance, created, **kwargs):
    """
    Invalidate cache when an Event is created or updated.

    Args:
        instance: The Event instance being saved
        created: True if this is a new event, False if updated
    """
    try:
        EventCacheService.invalidate_event(
            event_id=instance.id,
            organizer_id=instance.organizer_id
        )

        action = "created" if created else "updated"
        logger.info(f"Event {action}: {instance.id} - cache invalidated")
    except Exception as e:
        logger.error(f"Error invalidating cache on event save: {e}")


@receiver(post_delete, sender=Event)
def invalidate_event_cache_on_delete(sender, instance, **kwargs):
    """
    Invalidate cache when an Event is deleted.

    Args:
        instance: The Event instance being deleted
    """
    try:
        EventCacheService.invalidate_event(
            event_id=instance.id,
            organizer_id=instance.organizer_id
        )
        logger.info(f"Event deleted: {instance.id} - cache invalidated")
    except Exception as e:
        logger.error(f"Error invalidating cache on event delete: {e}")


@receiver(post_save, sender=EventMedia)
def invalidate_media_cache_on_save(sender, instance, created, **kwargs):
    """
    Invalidate event cache when EventMedia is created or updated.
    This ensures the event detail view reflects new/updated media.

    Args:
        instance: The EventMedia instance being saved
        created: True if this is new media, False if updated
    """
    try:
        # Invalidate the parent event's cache
        EventCacheService.invalidate_event(
            event_id=instance.event_id,
            organizer_id=instance.event.organizer_id
        )

        action = "created" if created else "updated"
        logger.info(f"EventMedia {action}: {instance.id} for event {instance.event_id} - cache invalidated")
    except Exception as e:
        logger.error(f"Error invalidating cache on media save: {e}")


@receiver(post_delete, sender=EventMedia)
def invalidate_media_cache_on_delete(sender, instance, **kwargs):
    """
    Invalidate event cache when EventMedia is deleted.

    Args:
        instance: The EventMedia instance being deleted
    """
    try:
        # Invalidate the parent event's cache
        EventCacheService.invalidate_event(
            event_id=instance.event_id,
            organizer_id=instance.event.organizer_id
        )
        logger.info(f"EventMedia deleted: {instance.id} for event {instance.event_id} - cache invalidated")
    except Exception as e:
        logger.error(f"Error invalidating cache on media delete: {e}")