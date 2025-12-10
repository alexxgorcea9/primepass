"""
Views for Events app with Redis caching integration.
"""
import logging
from rest_framework import viewsets, status, permissions,generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from rest_framework.viewsets import ModelViewSet

from apps.events.models import EventMedia, Tier, Wave, Privilege, AddOn, Table, Event, Post, Ticket, Order
from apps.events.serializers import (
    EventListSerializer,
    EventDetailSerializer,
    EventCreateUpdateSerializer,
    EventMediaSerializer,
    EventMediaUploadSerializer,
    TierListSerializer,
    TierDetailSerializer,
    TierCreateUpdateSerializer,
    WaveSerializer,
    WaveCreateUpdateSerializer,
    PrivilegeSerializer,
    PrivilegeCreateUpdateSerializer,
    AddOnSerializer,
    AddOnCreateUpdateSerializer,
    TableSerializer,
    TableCreateUpdateSerializer,
    BulkEventCreateSerializer, PostCreateUpdateSerializer, PostSerializer,
    JoinTeamSerializer, TeamMemberSerializer,
    TicketListSerializer,
    TicketDetailSerializer,
    BuyTicketsSerializer
)
from apps.events.cache.service import CacheService, EventCacheService, TierCacheService
from apps.events.cache.keys import (
    EventCacheKeys,
    TierCacheKeys,
    WaveCacheKeys,
    PrivilegeCacheKeys,
    AddOnCacheKeys,
    TableCacheKeys,
    PostCacheKeys,
)
from apps.events.permissions import IsEventOrganizer

logger = logging.getLogger(__name__)


class EventPagination(PageNumberPagination):
    """Custom pagination for events"""
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class EventViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Event CRUD operations with caching.

    List/Retrieve: Allow any user (cached)
    Create/Update/Delete: Require authentication
    """
    pagination_class = EventPagination

    def get_permissions(self):
        """
        Set permissions based on action.
        List and retrieve are public, everything else requires auth.
        """
        if self.action in ['list', 'retrieve', 'upcoming', 'finished']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return EventListSerializer
        elif self.action == 'retrieve':
            return EventDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return EventCreateUpdateSerializer
        return EventDetailSerializer

    def get_queryset(self):
        """
        Get queryset with optimizations.
        Prefetch related data to avoid N+1 queries.
        """
        queryset = Event.objects.select_related('organizer').prefetch_related('media', 'team_members')

        # Filter by is_finished if specified
        is_finished = self.request.query_params.get('is_finished')
        if is_finished is not None:
            is_finished_bool = is_finished.lower() == 'true'
            queryset = queryset.filter(is_finished=is_finished_bool)

        # Filter by organizer if specified
        organizer_id = self.request.query_params.get('organizer_id')
        if organizer_id:
            queryset = queryset.filter(organizer_id=organizer_id)

        return queryset

    def list(self, request, *args, **kwargs):
        """
        List events with caching.
        Cache key includes pagination and filters.
        """
        page = request.query_params.get('page', 1)
        is_finished = request.query_params.get('is_finished')
        organizer_id = request.query_params.get('organizer_id')

        # Parse is_finished to boolean or None
        is_finished_bool = None
        if is_finished is not None:
            is_finished_bool = is_finished.lower() == 'true'

        # Generate cache key with safe parameter parsing
        try:
            page_int = int(page) if page else 1
            organizer_id_int = int(organizer_id) if organizer_id else None
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid page or organizer_id parameter'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generate cache key
        cache_key = EventCacheKeys.event_list(
            page=page_int,
            is_finished=is_finished_bool,
            organizer_id=organizer_id_int
        )

        # Try to get from cache
        cached_data = CacheService.get(cache_key)
        if cached_data is not None:
            logger.info(f"Returning cached event list: {cache_key}")
            return Response(cached_data)

        # Cache miss - fetch from database
        queryset = self.filter_queryset(self.get_queryset())
        page_obj = self.paginate_queryset(queryset)

        if page_obj is not None:
            serializer = self.get_serializer(page_obj, many=True)
            response_data = self.get_paginated_response(serializer.data).data
        else:
            serializer = self.get_serializer(queryset, many=True)
            response_data = serializer.data

        # Cache the response
        CacheService.set(cache_key, response_data, EventCacheKeys.LIST_TTL)
        logger.info(f"Cached event list: {cache_key}")

        return Response(response_data)

    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve single event with caching.
        """
        event_id = kwargs.get('pk')
        cache_key = EventCacheKeys.event_detail(event_id)

        # Try to get from cache
        cached_data = CacheService.get(cache_key)
        if cached_data is not None:
            logger.info(f"Returning cached event detail: {cache_key}")
            return Response(cached_data)

        # Cache miss - fetch from database
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        response_data = serializer.data

        # Cache the response
        CacheService.set(cache_key, response_data, EventCacheKeys.DETAIL_TTL)
        logger.info(f"Cached event detail: {cache_key}")

        return Response(response_data)

    def create(self, request, *args, **kwargs):
        """
        Create new event.
        Cache invalidation handled by signals.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        # Return detailed representation
        instance = serializer.instance
        detail_serializer = EventDetailSerializer(instance)

        return Response(
            detail_serializer.data,
            status=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        """
        Update event.
        Cache invalidation handled by signals.
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        # Check permission - only organizer can update
        if instance.organizer != request.user:
            return Response(
                {'error': 'You do not have permission to edit this event.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Return detailed representation
        detail_serializer = EventDetailSerializer(instance)
        return Response(detail_serializer.data)

    def destroy(self, request, *args, **kwargs):
        """
        Delete event.
        Cache invalidation handled by signals.
        """
        instance = self.get_object()

        # Check permission - only organizer can delete
        if instance.organizer != request.user:
            return Response(
                {'error': 'You do not have permission to delete this event.'},
                status=status.HTTP_403_FORBIDDEN
            )

        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """
        Get upcoming events (not finished).
        Convenience endpoint with caching.
        """
        page = request.query_params.get('page', 1)
        cache_key = EventCacheKeys.event_list(page=int(page), is_finished=False)

        # Try cache
        cached_data = CacheService.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        # Fetch and cache
        queryset = self.get_queryset().filter(is_finished=False)
        page_obj = self.paginate_queryset(queryset)

        if page_obj is not None:
            serializer = EventListSerializer(page_obj, many=True)
            response_data = self.get_paginated_response(serializer.data).data
        else:
            serializer = EventListSerializer(queryset, many=True)
            response_data = serializer.data

        CacheService.set(cache_key, response_data, EventCacheKeys.LIST_TTL)
        return Response(response_data)

    @action(detail=False, methods=['get'])
    def finished(self, request):
        """
        Get finished events.
        Convenience endpoint with caching.
        """
        page = request.query_params.get('page', 1)
        cache_key = EventCacheKeys.event_list(page=int(page), is_finished=True)

        # Try cache
        cached_data = CacheService.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        # Fetch and cache
        queryset = self.get_queryset().filter(is_finished=True)
        page_obj = self.paginate_queryset(queryset)

        if page_obj is not None:
            serializer = EventListSerializer(page_obj, many=True)
            response_data = self.get_paginated_response(serializer.data).data
        else:
            serializer = EventListSerializer(queryset, many=True)
            response_data = serializer.data

        CacheService.set(cache_key, response_data, EventCacheKeys.LIST_TTL)
        return Response(response_data)

    @action(detail=False, methods=['get'])
    def my_events(self, request):
        """
        Get events created by the authenticated user.
        Requires authentication.
        """
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        page = request.query_params.get('page', 1)
        is_finished = request.query_params.get('is_finished')
        is_finished_bool = None
        if is_finished is not None:
            is_finished_bool = is_finished.lower() == 'true'
        
        cache_key = EventCacheKeys.organizer_events(
            organizer_id=request.user.id,
            page=int(page),
            is_finished=is_finished_bool
        )

        # Try cache
        cached_data = CacheService.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        # Fetch and cache
        queryset = self.get_queryset().filter(organizer=request.user)
        page_obj = self.paginate_queryset(queryset)

        if page_obj is not None:
            serializer = EventListSerializer(page_obj, many=True)
            response_data = self.get_paginated_response(serializer.data).data
        else:
            serializer = EventListSerializer(queryset, many=True)
            response_data = serializer.data

        CacheService.set(cache_key, response_data, EventCacheKeys.ORGANIZER_TTL)
        return Response(response_data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated],
            parser_classes=[MultiPartParser, FormParser])
    def upload_media(self, request, pk=None):
        """
        Upload media (image/video) to an event.
        Only the organizer can upload media.
        """
        event = self.get_object()

        # Check permission
        if event.organizer != request.user:
            return Response(
                {'error': 'You do not have permission to upload media to this event.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = EventMediaUploadSerializer(
            data=request.data,
            context={'event': event, 'request': request}
        )
        serializer.is_valid(raise_exception=True)
        media = serializer.save()

        # Return created media
        response_serializer = EventMediaSerializer(media)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def media(self, request, pk=None):
        """
        Get all media for an event.
        Cached separately from event detail.
        """
        event = self.get_object()
        cache_key = EventCacheKeys.event_media(event.id)

        # Try cache
        cached_data = CacheService.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        # Fetch and cache
        media = event.media.all()
        serializer = EventMediaSerializer(media, many=True)
        response_data = serializer.data

        CacheService.set(cache_key, response_data, EventCacheKeys.MEDIA_TTL)
        return Response(response_data)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated],
            parser_classes=[MultiPartParser, FormParser])
    def bulk_create(self, request):
        """
        Create an event with all related data (tiers, waves, privileges, add-ons, tables) in one request.
        Requires authentication.
        """
        try:
            serializer = BulkEventCreateSerializer(
                data=request.data,
                context={'request': request}
            )
            
            if not serializer.is_valid():
                logger.error(f"Serializer validation failed: {serializer.errors}")
                return Response(
                    {'error': 'Invalid data', 'details': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            event = serializer.save()
            logger.info(f"Event created successfully: {event.id}")

            # Return detailed representation
            detail_serializer = EventDetailSerializer(event, context={'request': request})
            return Response(
                detail_serializer.data,
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            logger.error(f"Error in bulk_create: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to create event', 'message': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def join_team(self, request):
        """
        Join an event team using an access code.
        Requires authentication.
        """
        serializer = JoinTeamSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if not serializer.is_valid():
            return Response(
                {'error': 'Invalid data', 'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            event = serializer.save()
            
            # Invalidate event detail cache
            EventCacheService.invalidate_event(event.id)
            
            # Return event detail with team members
            detail_serializer = EventDetailSerializer(event, context={'request': request})
            return Response(
                {
                    'message': 'Successfully joined the team',
                    'event': detail_serializer.data
                },
                status=status.HTTP_200_OK
            )
        except serializers.ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error joining team: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to join team', 'message': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def leave_team(self, request, pk=None):
        """
        Leave an event team.
        Requires authentication.
        """
        event = self.get_object()
        user = request.user
        
        # Check if user is a team member
        if not event.team_members.filter(id=user.id).exists():
            return Response(
                {'error': 'You are not a member of this team'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Remove user from team
        event.team_members.remove(user)
        
        # Invalidate event detail cache
        EventCacheService.invalidate_event(event.id)
        
        return Response(
            {'message': 'Successfully left the team'},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def team_members(self, request, pk=None):
        """
        Get list of team members for an event.
        Only accessible to organizer and team members.
        """
        event = self.get_object()
        
        # Check if user is organizer or team member
        if event.organizer != request.user and not event.team_members.filter(id=request.user.id).exists():
            return Response(
                {'error': 'You do not have permission to view this team'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = TeamMemberSerializer(event.team_members.all(), many=True)
        return Response(serializer.data)


class EventMediaViewSet(viewsets.ModelViewSet):
    """
    ViewSet for EventMedia operations.
    Allows organizers to manage media for their events.
    """
    queryset = EventMedia.objects.select_related('event')
    serializer_class = EventMediaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter to only media from user's events"""
        return self.queryset.filter(event__organizer=self.request.user)

    def update(self, request, *args, **kwargs):
        """
        Update media metadata (e.g., is_featured flag).
        Cannot change the file itself.
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        # Check permission
        if instance.event.organizer != request.user:
            return Response(
                {'error': 'You do not have permission to edit this media.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """
        Delete media.
        Cache invalidation handled by signals.
        """
        instance = self.get_object()

        # Check permission
        if instance.event.organizer != request.user:
            return Response(
                {'error': 'You do not have permission to delete this media.'},
                status=status.HTTP_403_FORBIDDEN
            )

        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ==============================================================================
# Tier ViewSet
# ==============================================================================

class TierViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Tier CRUD operations with caching.
    Only event organizers can create/update/delete tiers.
    """
    permission_classes = [IsEventOrganizer]

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return TierListSerializer
        elif self.action == 'retrieve':
            return TierDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return TierCreateUpdateSerializer
        return TierDetailSerializer

    def get_queryset(self):
        """Get tiers for a specific event"""
        event_id = self.kwargs.get('event_pk')
        if event_id:
            return Tier.objects.filter(event_id=event_id).prefetch_related(
                'price_waves', 'privileges', 'add_ons', 'tables'
            )
        return Tier.objects.none()

    def list(self, request, event_pk=None):
        """List all tiers for an event with caching"""
        cache_key = TierCacheKeys.event_tiers(event_pk)

        # Try cache
        cached_data = CacheService.get(cache_key)
        if cached_data is not None:
            logger.info(f"Returning cached tier list: {cache_key}")
            return Response(cached_data)

        # Fetch from database
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        response_data = serializer.data

        # Cache the response
        CacheService.set(cache_key, response_data, TierCacheKeys.EVENT_TTL)
        logger.info(f"Cached tier list: {cache_key}")

        return Response(response_data)

    def retrieve(self, request, pk=None, event_pk=None):
        """Retrieve single tier with caching"""
        cache_key = TierCacheKeys.tier_detail(pk)

        # Try cache
        cached_data = CacheService.get(cache_key)
        if cached_data is not None:
            logger.info(f"Returning cached tier detail: {cache_key}")
            return Response(cached_data)

        # Fetch from database
        tier = get_object_or_404(self.get_queryset(), pk=pk)
        self.check_object_permissions(request, tier)
        serializer = self.get_serializer(tier)
        response_data = serializer.data

        # Cache the response
        CacheService.set(cache_key, response_data, TierCacheKeys.DETAIL_TTL)
        logger.info(f"Cached tier detail: {cache_key}")

        return Response(response_data)

    def create(self, request, event_pk=None):
        """Create new tier for an event"""
        # Verify event exists and user is organizer
        event = get_object_or_404(Event, pk=event_pk)
        if event.organizer != request.user:
            return Response(
                {'error': 'You do not have permission to add tiers to this event.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(
            data=request.data,
            context={'event': event, 'request': request}
        )
        serializer.is_valid(raise_exception=True)
        tier = serializer.save()

        # Invalidate cache
        TierCacheService.invalidate_event_tiers(event_pk)

        # Return detailed representation
        detail_serializer = TierDetailSerializer(tier)
        return Response(detail_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None, event_pk=None):
        """Update tier"""
        tier = get_object_or_404(self.get_queryset(), pk=pk)
        self.check_object_permissions(request, tier)

        serializer = self.get_serializer(tier, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        tier = serializer.save()

        # Invalidate cache
        TierCacheService.invalidate_tier(pk, event_pk)

        # Return detailed representation
        detail_serializer = TierDetailSerializer(tier)
        return Response(detail_serializer.data)

    def partial_update(self, request, pk=None, event_pk=None):
        """Partially update tier"""
        tier = get_object_or_404(self.get_queryset(), pk=pk)
        self.check_object_permissions(request, tier)

        serializer = self.get_serializer(tier, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        tier = serializer.save()

        # Invalidate cache
        TierCacheService.invalidate_tier(pk, event_pk)

        # Return detailed representation
        detail_serializer = TierDetailSerializer(tier)
        return Response(detail_serializer.data)

    def destroy(self, request, pk=None, event_pk=None):
        """Delete tier"""
        tier = get_object_or_404(self.get_queryset(), pk=pk)
        self.check_object_permissions(request, tier)

        tier.delete()

        # Invalidate cache
        TierCacheService.invalidate_tier(pk, event_pk)

        return Response(status=status.HTTP_204_NO_CONTENT)


# ==============================================================================
# Wave ViewSet
# ==============================================================================

class WaveViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Wave CRUD operations with caching.
    Waves belong to tiers.
    """
    permission_classes = [IsEventOrganizer]

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action in ['create', 'update', 'partial_update']:
            return WaveCreateUpdateSerializer
        return WaveSerializer

    def get_queryset(self):
        """Get waves for a specific tier"""
        tier_id = self.kwargs.get('tier_pk')
        if tier_id:
            return Wave.objects.filter(tier_id=tier_id)
        return Wave.objects.none()

    def list(self, request, event_pk=None, tier_pk=None):
        """List all waves for a tier with caching"""
        cache_key = WaveCacheKeys.tier_waves(tier_pk)

        # Try cache
        cached_data = CacheService.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        # Fetch from database
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        response_data = serializer.data

        # Cache the response
        CacheService.set(cache_key, response_data, WaveCacheKeys.TIER_TTL)
        return Response(response_data)

    def retrieve(self, request, pk=None, event_pk=None, tier_pk=None):
        """Retrieve single wave with caching"""
        cache_key = WaveCacheKeys.wave_detail(pk)

        # Try cache
        cached_data = CacheService.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        # Fetch from database
        wave = get_object_or_404(self.get_queryset(), pk=pk)
        self.check_object_permissions(request, wave)
        serializer = self.get_serializer(wave)
        response_data = serializer.data

        # Cache the response
        CacheService.set(cache_key, response_data, WaveCacheKeys.DETAIL_TTL)
        return Response(response_data)

    def create(self, request, event_pk=None, tier_pk=None):
        """Create new wave for a tier"""
        # Verify tier exists and user is organizer
        tier = get_object_or_404(Tier, pk=tier_pk, event_id=event_pk)
        if tier.event.organizer != request.user:
            return Response(
                {'error': 'You do not have permission to add waves to this tier.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(
            data=request.data,
            context={'tier': tier, 'request': request}
        )
        serializer.is_valid(raise_exception=True)
        wave = serializer.save()

        # Invalidate cache
        TierCacheService.invalidate_wave(wave.id, tier_pk)

        return Response(WaveSerializer(wave).data, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None, event_pk=None, tier_pk=None):
        """Update wave"""
        wave = get_object_or_404(self.get_queryset(), pk=pk)
        self.check_object_permissions(request, wave)

        serializer = self.get_serializer(wave, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        wave = serializer.save()

        # Invalidate cache
        TierCacheService.invalidate_wave(pk, tier_pk)

        return Response(WaveSerializer(wave).data)

    def partial_update(self, request, pk=None, event_pk=None, tier_pk=None):
        """Partially update wave"""
        wave = get_object_or_404(self.get_queryset(), pk=pk)
        self.check_object_permissions(request, wave)

        serializer = self.get_serializer(wave, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        wave = serializer.save()

        # Invalidate cache
        TierCacheService.invalidate_wave(pk, tier_pk)

        return Response(WaveSerializer(wave).data)

    def destroy(self, request, pk=None, event_pk=None, tier_pk=None):
        """Delete wave"""
        wave = get_object_or_404(self.get_queryset(), pk=pk)
        self.check_object_permissions(request, wave)

        wave.delete()

        # Invalidate cache
        TierCacheService.invalidate_wave(pk, tier_pk)

        return Response(status=status.HTTP_204_NO_CONTENT)


# ==============================================================================
# Privilege ViewSet
# ==============================================================================

class PrivilegeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Privilege CRUD operations with caching.
    Privileges belong to tiers.
    """
    permission_classes = [IsEventOrganizer]

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action in ['create', 'update', 'partial_update']:
            return PrivilegeCreateUpdateSerializer
        return PrivilegeSerializer

    def get_queryset(self):
        """Get privileges for a specific tier"""
        tier_id = self.kwargs.get('tier_pk')
        if tier_id:
            return Privilege.objects.filter(tier_id=tier_id)
        return Privilege.objects.none()

    def list(self, request, event_pk=None, tier_pk=None):
        """List all privileges for a tier with caching"""
        cache_key = PrivilegeCacheKeys.tier_privileges(tier_pk)

        # Try cache
        cached_data = CacheService.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        # Fetch from database
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        response_data = serializer.data

        # Cache the response
        CacheService.set(cache_key, response_data, PrivilegeCacheKeys.TIER_TTL)
        return Response(response_data)

    def retrieve(self, request, pk=None, event_pk=None, tier_pk=None):
        """Retrieve single privilege with caching"""
        cache_key = PrivilegeCacheKeys.privilege_detail(pk)

        # Try cache
        cached_data = CacheService.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        # Fetch from database
        privilege = get_object_or_404(self.get_queryset(), pk=pk)
        self.check_object_permissions(request, privilege)
        serializer = self.get_serializer(privilege)
        response_data = serializer.data

        # Cache the response
        CacheService.set(cache_key, response_data, PrivilegeCacheKeys.DETAIL_TTL)
        return Response(response_data)

    def create(self, request, event_pk=None, tier_pk=None):
        """Create new privilege for a tier"""
        # Verify tier exists and user is organizer
        tier = get_object_or_404(Tier, pk=tier_pk, event_id=event_pk)
        if tier.event.organizer != request.user:
            return Response(
                {'error': 'You do not have permission to add privileges to this tier.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(
            data=request.data,
            context={'tier': tier, 'request': request}
        )
        serializer.is_valid(raise_exception=True)
        privilege = serializer.save()

        # Invalidate cache
        TierCacheService.invalidate_privilege(privilege.id, tier_pk)

        return Response(PrivilegeSerializer(privilege).data, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None, event_pk=None, tier_pk=None):
        """Update privilege"""
        privilege = get_object_or_404(self.get_queryset(), pk=pk)
        self.check_object_permissions(request, privilege)

        serializer = self.get_serializer(privilege, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        privilege = serializer.save()

        # Invalidate cache
        TierCacheService.invalidate_privilege(pk, tier_pk)

        return Response(PrivilegeSerializer(privilege).data)

    def partial_update(self, request, pk=None, event_pk=None, tier_pk=None):
        """Partially update privilege"""
        privilege = get_object_or_404(self.get_queryset(), pk=pk)
        self.check_object_permissions(request, privilege)

        serializer = self.get_serializer(privilege, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        privilege = serializer.save()

        # Invalidate cache
        TierCacheService.invalidate_privilege(pk, tier_pk)

        return Response(PrivilegeSerializer(privilege).data)

    def destroy(self, request, pk=None, event_pk=None, tier_pk=None):
        """Delete privilege"""
        privilege = get_object_or_404(self.get_queryset(), pk=pk)
        self.check_object_permissions(request, privilege)

        privilege.delete()

        # Invalidate cache
        TierCacheService.invalidate_privilege(pk, tier_pk)

        return Response(status=status.HTTP_204_NO_CONTENT)


# ==============================================================================
# AddOn ViewSet
# ==============================================================================

class AddOnViewSet(viewsets.ModelViewSet):
    """
    ViewSet for AddOn CRUD operations with caching.
    AddOns belong to tiers.
    """
    permission_classes = [IsEventOrganizer]

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action in ['create', 'update', 'partial_update']:
            return AddOnCreateUpdateSerializer
        return AddOnSerializer

    def get_queryset(self):
        """Get add-ons for a specific tier"""
        tier_id = self.kwargs.get('tier_pk')
        if tier_id:
            return AddOn.objects.filter(tier_id=tier_id)
        return AddOn.objects.none()

    def list(self, request, event_pk=None, tier_pk=None):
        """List all add-ons for a tier with caching"""
        cache_key = AddOnCacheKeys.tier_addons(tier_pk)

        # Try cache
        cached_data = CacheService.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        # Fetch from database
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        response_data = serializer.data

        # Cache the response
        CacheService.set(cache_key, response_data, AddOnCacheKeys.TIER_TTL)
        return Response(response_data)

    def retrieve(self, request, pk=None, event_pk=None, tier_pk=None):
        """Retrieve single add-on with caching"""
        cache_key = AddOnCacheKeys.addon_detail(pk)

        # Try cache
        cached_data = CacheService.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        # Fetch from database
        addon = get_object_or_404(self.get_queryset(), pk=pk)
        self.check_object_permissions(request, addon)
        serializer = self.get_serializer(addon)
        response_data = serializer.data

        # Cache the response
        CacheService.set(cache_key, response_data, AddOnCacheKeys.DETAIL_TTL)
        return Response(response_data)

    def create(self, request, event_pk=None, tier_pk=None):
        """Create new add-on for a tier"""
        # Verify tier exists and user is organizer
        tier = get_object_or_404(Tier, pk=tier_pk, event_id=event_pk)
        if tier.event.organizer != request.user:
            return Response(
                {'error': 'You do not have permission to add add-ons to this tier.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(
            data=request.data,
            context={'tier': tier, 'request': request}
        )
        serializer.is_valid(raise_exception=True)
        addon = serializer.save()

        # Invalidate cache
        TierCacheService.invalidate_addon(addon.id, tier_pk)

        return Response(AddOnSerializer(addon).data, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None, event_pk=None, tier_pk=None):
        """Update add-on"""
        addon = get_object_or_404(self.get_queryset(), pk=pk)
        self.check_object_permissions(request, addon)

        serializer = self.get_serializer(addon, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        addon = serializer.save()

        # Invalidate cache
        TierCacheService.invalidate_addon(pk, tier_pk)

        return Response(AddOnSerializer(addon).data)

    def partial_update(self, request, pk=None, event_pk=None, tier_pk=None):
        """Partially update add-on"""
        addon = get_object_or_404(self.get_queryset(), pk=pk)
        self.check_object_permissions(request, addon)

        serializer = self.get_serializer(addon, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        addon = serializer.save()

        # Invalidate cache
        TierCacheService.invalidate_addon(pk, tier_pk)

        return Response(AddOnSerializer(addon).data)

    def destroy(self, request, pk=None, event_pk=None, tier_pk=None):
        """Delete add-on"""
        addon = get_object_or_404(self.get_queryset(), pk=pk)
        self.check_object_permissions(request, addon)

        addon.delete()

        # Invalidate cache
        TierCacheService.invalidate_addon(pk, tier_pk)

        return Response(status=status.HTTP_204_NO_CONTENT)


# ==============================================================================
# Table ViewSet
# ==============================================================================

class TableViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Table CRUD operations with caching.
    Tables belong to tiers.
    """
    permission_classes = [IsEventOrganizer]

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action in ['create', 'update', 'partial_update']:
            return TableCreateUpdateSerializer
        return TableSerializer

    def get_queryset(self):
        """Get tables for a specific tier"""
        tier_id = self.kwargs.get('tier_pk')
        if tier_id:
            return Table.objects.filter(tier_id=tier_id).select_related('reserved_by')
        return Table.objects.none()

    def list(self, request, event_pk=None, tier_pk=None):
        """List all tables for a tier with caching"""
        cache_key = TableCacheKeys.tier_tables(tier_pk)

        # Try cache
        cached_data = CacheService.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        # Fetch from database
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        response_data = serializer.data

        # Cache the response
        CacheService.set(cache_key, response_data, TableCacheKeys.TIER_TTL)
        return Response(response_data)

    def retrieve(self, request, pk=None, event_pk=None, tier_pk=None):
        """Retrieve single table with caching"""
        cache_key = TableCacheKeys.table_detail(pk)

        # Try cache
        cached_data = CacheService.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        # Fetch from database
        table = get_object_or_404(self.get_queryset(), pk=pk)
        self.check_object_permissions(request, table)
        serializer = self.get_serializer(table)
        response_data = serializer.data

        # Cache the response
        CacheService.set(cache_key, response_data, TableCacheKeys.DETAIL_TTL)
        return Response(response_data)

    def create(self, request, event_pk=None, tier_pk=None):
        """Create new table for a tier"""
        # Verify tier exists and user is organizer
        tier = get_object_or_404(Tier, pk=tier_pk, event_id=event_pk)
        if tier.event.organizer != request.user:
            return Response(
                {'error': 'You do not have permission to add tables to this tier.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(
            data=request.data,
            context={'tier': tier, 'request': request}
        )
        serializer.is_valid(raise_exception=True)
        table = serializer.save()

        # Invalidate cache
        TierCacheService.invalidate_table(table.id, tier_pk)

        return Response(TableSerializer(table).data, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None, event_pk=None, tier_pk=None):
        """Update table"""
        table = get_object_or_404(self.get_queryset(), pk=pk)
        self.check_object_permissions(request, table)

        serializer = self.get_serializer(table, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        table = serializer.save()

        # Invalidate cache
        TierCacheService.invalidate_table(pk, tier_pk)

        return Response(TableSerializer(table).data)

    def partial_update(self, request, pk=None, event_pk=None, tier_pk=None):
        """Partially update table"""
        table = get_object_or_404(self.get_queryset(), pk=pk)
        self.check_object_permissions(request, table)

        serializer = self.get_serializer(table, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        table = serializer.save()

        # Invalidate cache
        TierCacheService.invalidate_table(pk, tier_pk)

        return Response(TableSerializer(table).data)

    def destroy(self, request, pk=None, event_pk=None, tier_pk=None):
        """Delete table"""
        table = get_object_or_404(self.get_queryset(), pk=pk)
        self.check_object_permissions(request, table)

        table.delete()

        # Invalidate cache
        TierCacheService.invalidate_table(pk, tier_pk)

        return Response(status=status.HTTP_204_NO_CONTENT)


# ==============================================================================
# Post ViewSet
# ==============================================================================

class PostViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Post CRUD operations with caching.
    Posts belong to events.
    """
    permission_classes = [IsEventOrganizer]

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action in ['create', 'update', 'partial_update']:
            return PostCreateUpdateSerializer
        return PostSerializer

    def get_queryset(self):
        """Get posts for a specific event"""
        event_id = self.kwargs.get('event_pk')
        if event_id:
            return Post.objects.filter(event_id=event_id).select_related('event')
        return Post.objects.none()

    def list(self, request, event_pk=None):
        """List all posts for an event with caching"""
        cache_key = PostCacheKeys.event_posts(event_pk)

        # Try cache
        cached_data = CacheService.get(cache_key)
        if cached_data is not None:
            logger.info(f"Returning cached post list: {cache_key}")
            return Response(cached_data)

        # Fetch from database
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        response_data = serializer.data

        # Cache the response
        CacheService.set(cache_key, response_data, PostCacheKeys.EVENT_TTL)
        logger.info(f"Cached post list: {cache_key}")

        return Response(response_data)

    def retrieve(self, request, pk=None, event_pk=None):
        """Retrieve single post with caching"""
        cache_key = PostCacheKeys.post_detail(pk)

        # Try cache
        cached_data = CacheService.get(cache_key)
        if cached_data is not None:
            logger.info(f"Returning cached post detail: {cache_key}")
            return Response(cached_data)

        # Fetch from database
        post = get_object_or_404(self.get_queryset(), pk=pk)
        self.check_object_permissions(request, post)
        serializer = self.get_serializer(post)
        response_data = serializer.data

        # Cache the response
        CacheService.set(cache_key, response_data, PostCacheKeys.DETAIL_TTL)
        logger.info(f"Cached post detail: {cache_key}")

        return Response(response_data)

    def create(self, request, event_pk=None):
        """Create new post for an event"""
        # Verify event exists and user is organizer
        event = get_object_or_404(Event, pk=event_pk)
        if event.organizer != request.user:
            return Response(
                {'error': 'You do not have permission to create posts for this event.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(
            data=request.data,
            context={'event': event, 'request': request}
        )
        serializer.is_valid(raise_exception=True)
        post = serializer.save()

        # Invalidate cache
        EventCacheService.invalidate_event_posts(event_pk)

        return Response(PostSerializer(post).data, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None, event_pk=None):
        """Update post"""
        post = get_object_or_404(self.get_queryset(), pk=pk)
        self.check_object_permissions(request, post)

        serializer = self.get_serializer(post, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        post = serializer.save()

        # Invalidate cache
        EventCacheService.invalidate_post(pk, event_pk)

        return Response(PostSerializer(post).data)

    def partial_update(self, request, pk=None, event_pk=None):
        """Partially update post"""
        post = get_object_or_404(self.get_queryset(), pk=pk)
        self.check_object_permissions(request, post)

        serializer = self.get_serializer(post, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        post = serializer.save()

        # Invalidate cache
        EventCacheService.invalidate_post(pk, event_pk)

        return Response(PostSerializer(post).data)

    def destroy(self, request, pk=None, event_pk=None):
        """Delete post"""
        post = get_object_or_404(self.get_queryset(), pk=pk)
        self.check_object_permissions(request, post)

        post.delete()

        # Invalidate cache
        EventCacheService.invalidate_post(pk, event_pk)

        return Response(status=status.HTTP_204_NO_CONTENT)


### GUEST VIEWS
class IsGuestUser(permissions.BasePermission):
    """
    Optional: if you want to restrict to users with role='guest'.
    If not needed, you can just use IsAuthenticated.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == "guest"
        )

class MyTicketViewSet(viewsets.ReadOnlyModelViewSet):
    """
    - GET /api/guest/tickets/       -> list tickets for current user
    - GET /api/guest/tickets/<id>/  -> ticket detail (if belongs to user)
    """
    permission_classes = [permissions.IsAuthenticated]  # or [IsGuestUser]

    def get_queryset(self):
        return (
            Ticket.objects
            .select_related("event", "tier", "wave", "table")
            .filter(user=self.request.user)
            .order_by("-created_at")
        )

    def get_serializer_class(self):
        if self.action == "retrieve":
            return TicketDetailSerializer
        return TicketListSerializer


class BuyTicketsView(generics.GenericAPIView):
    """
    POST /api/guest/tickets/buy/
    Body: BuyTicketsSerializer payload
    """
    permission_classes = [permissions.IsAuthenticated]  # or [IsGuestUser]
    serializer_class = BuyTicketsSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        order = serializer.save()

        #return full order, or just tickets, or a simple confirmation
        return Response(
            {
                "order_id": order.id,
                "event_id": order.event_id,
                "total": str(order.total),
            },
            status=status.HTTP_201_CREATED,
        )
