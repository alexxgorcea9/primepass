"""
Views for Concierge app (Special Requests).
"""
import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q

from .models import SpecialRequest, SpecialRequestMessage
from .serializers import (
    SpecialRequestListSerializer,
    SpecialRequestDetailSerializer,
    SpecialRequestCreateSerializer,
    SpecialRequestUpdateSerializer,
    SpecialRequestMessageSerializer,
)
from .permissions import (
    IsGuestOrEventTeam,
    CanCreateSpecialRequest,
    CanUpdateSpecialRequest,
    CanSendMessage,
)
from .cache.service import CacheService, SpecialRequestCacheService
from .cache.keys import SpecialRequestCacheKeys, SpecialRequestMessageCacheKeys

logger = logging.getLogger(__name__)


class SpecialRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Special Request CRUD operations.
    
    Endpoints:
    - GET /api/concierge/special-requests/ - List all accessible special requests
    - POST /api/concierge/special-requests/ - Create a new special request (guests only)
    - GET /api/concierge/special-requests/{id}/ - Retrieve a specific special request
    - PATCH /api/concierge/special-requests/{id}/ - Update a special request
    - DELETE /api/concierge/special-requests/{id}/ - Delete a special request
    - GET /api/concierge/special-requests/my-requests/ - Get current user's special requests
    - GET /api/concierge/special-requests/event/{event_id}/ - Get special requests for an event
    - POST /api/concierge/special-requests/{id}/messages/ - Send a message
    """
    
    def get_queryset(self):
        """
        Return special requests based on user role:
        - Guests: only their own requests
        - Organizers: requests for their events
        - Team members: requests for events they're affiliated with
        """
        user = self.request.user
        
        if not user.is_authenticated:
            return SpecialRequest.objects.none()
        
        # Guests see only their own requests
        if user.role == 'guest':
            return SpecialRequest.objects.filter(guest=user).select_related(
                'guest', 'event', 'tier', 'assigned_to'
            ).prefetch_related('messages')
        
        # Organizers see requests for their events
        if user.role == 'organizer':
            return SpecialRequest.objects.filter(
                event__organizer=user
            ).select_related(
                'guest', 'event', 'tier', 'assigned_to'
            ).prefetch_related('messages')
        
        # Team members see requests for events they're affiliated with
        if user.role == 'team':
            return SpecialRequest.objects.filter(
                Q(event__team_members=user) | Q(event__organizer=user)
            ).distinct().select_related(
                'guest', 'event', 'tier', 'assigned_to'
            ).prefetch_related('messages')
        
        return SpecialRequest.objects.none()
    
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action == 'create':
            return [CanCreateSpecialRequest()]
        elif self.action in ['update', 'partial_update']:
            return [CanUpdateSpecialRequest()]
        elif self.action == 'send_message':
            return [CanSendMessage()]
        return [IsGuestOrEventTeam()]
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list' or self.action == 'my_requests' or self.action == 'event_requests':
            return SpecialRequestListSerializer
        elif self.action == 'retrieve':
            return SpecialRequestDetailSerializer
        elif self.action == 'create':
            return SpecialRequestCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return SpecialRequestUpdateSerializer
        elif self.action == 'send_message':
            return SpecialRequestMessageSerializer
        return SpecialRequestDetailSerializer
    
    def list(self, request, *args, **kwargs):
        """List special requests with caching"""
        page = request.query_params.get('page', 1)
        status_filter = request.query_params.get('status')
        event_id = request.query_params.get('event_id')
        
        # Generate cache key
        try:
            page_int = int(page) if page else 1
            event_id_int = int(event_id) if event_id else None
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid page or event_id parameter'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cache_key = SpecialRequestCacheKeys.request_list(
            page=page_int,
            status=status_filter,
            event_id=event_id_int,
            user_id=request.user.id
        )
        
        # Try to get from cache
        cached_data = CacheService.get(cache_key)
        if cached_data is not None:
            logger.info(f"Returning cached special request list: {cache_key}")
            return Response(cached_data)
        
        # Cache miss - fetch from database
        queryset = self.filter_queryset(self.get_queryset())
        
        # Apply filters
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if event_id_int:
            queryset = queryset.filter(event_id=event_id_int)
        
        page_obj = self.paginate_queryset(queryset)
        
        if page_obj is not None:
            serializer = self.get_serializer(page_obj, many=True)
            response_data = self.get_paginated_response(serializer.data).data
        else:
            serializer = self.get_serializer(queryset, many=True)
            response_data = serializer.data
        
        # Cache the response
        CacheService.set(cache_key, response_data, SpecialRequestCacheKeys.LIST_TTL)
        logger.info(f"Cached special request list: {cache_key}")
        
        return Response(response_data)
    
    def retrieve(self, request, *args, **kwargs):
        """Retrieve single special request with caching"""
        request_id = kwargs.get('pk')
        cache_key = SpecialRequestCacheKeys.request_detail(request_id)
        
        # Try to get from cache
        cached_data = CacheService.get(cache_key)
        if cached_data is not None:
            logger.info(f"Returning cached special request detail: {cache_key}")
            return Response(cached_data)
        
        # Cache miss - fetch from database
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        response_data = serializer.data
        
        # Cache the response
        CacheService.set(cache_key, response_data, SpecialRequestCacheKeys.DETAIL_TTL)
        logger.info(f"Cached special request detail: {cache_key}")
        
        return Response(response_data)
    
    def create(self, request, *args, **kwargs):
        """Create a new special request. Cache invalidation handled automatically."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Additional validation: Check if guest has a ticket for this tier
        # Note: This assumes a Ticket model exists. If not, this validation should be removed
        # or implemented when the Ticket model is created.
        
        special_request = serializer.save()
        
        # Invalidate relevant caches
        SpecialRequestCacheService.invalidate_request_lists()
        SpecialRequestCacheService.invalidate_guest_requests(special_request.guest.id)
        SpecialRequestCacheService.invalidate_event_requests(special_request.event.id)
        
        # Return detailed view
        detail_serializer = SpecialRequestDetailSerializer(
            special_request, 
            context={'request': request}
        )
        
        logger.info(
            f"Special request created: {special_request.id} by guest {request.user.email} "
            f"for event {special_request.event.title}"
        )
        
        return Response(detail_serializer.data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        """Update a special request. Cache invalidation handled automatically."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        old_assigned_to_id = instance.assigned_to.id if instance.assigned_to else None
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        updated_request = serializer.save()
        new_assigned_to_id = updated_request.assigned_to.id if updated_request.assigned_to else None
        
        # Invalidate caches
        SpecialRequestCacheService.invalidate_request(
            updated_request.id,
            guest_id=updated_request.guest.id,
            event_id=updated_request.event.id,
            assigned_to_id=old_assigned_to_id
        )
        
        # Also invalidate new assigned user's cache if assignment changed
        if new_assigned_to_id and new_assigned_to_id != old_assigned_to_id:
            SpecialRequestCacheService.invalidate_assigned_requests(new_assigned_to_id)
        
        logger.info(
            f"Special request updated: {updated_request.id} by {request.user.email}"
        )
        
        # Return detailed view
        detail_serializer = SpecialRequestDetailSerializer(
            updated_request,
            context={'request': request}
        )
        
        return Response(detail_serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        """Delete a special request. Cache invalidation handled automatically."""
        instance = self.get_object()
        guest_id = instance.guest.id
        event_id = instance.event.id
        assigned_to_id = instance.assigned_to.id if instance.assigned_to else None
        request_id = instance.id
        
        # Perform deletion
        self.perform_destroy(instance)
        
        # Invalidate caches
        SpecialRequestCacheService.invalidate_request(
            request_id,
            guest_id=guest_id,
            event_id=event_id,
            assigned_to_id=assigned_to_id
        )
        
        logger.info(f"Special request deleted: {request_id} by {request.user.email}")
        
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['get'], url_path='my-requests')
    def my_requests(self, request):
        """Get all special requests for the current user (guests only)"""
        if request.user.role != 'guest':
            return Response(
                {'detail': 'This endpoint is only available for guests.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='event/(?P<event_id>[^/.]+)')
    def event_requests(self, request, event_id=None):
        """
        Get all special requests for a specific event.
        Only accessible by event organizer or affiliated team members.
        """
        from apps.events.models import Event
        
        event = get_object_or_404(Event, pk=event_id)
        
        # Check permission: organizer or team member
        user = request.user
        if event.organizer != user:
            if user.role != 'team' or not event.team_members.filter(id=user.id).exists():
                return Response(
                    {'detail': 'You do not have permission to view requests for this event.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        queryset = self.get_queryset().filter(event=event)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='messages')
    def send_message(self, request, pk=None):
        """Send a message in a special request conversation"""
        special_request = self.get_object()
        
        # Check permission using the permission class
        permission = CanSendMessage()
        if not permission.has_object_permission(request, self, special_request):
            return Response(
                {'detail': 'You do not have permission to send messages in this request.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = SpecialRequestMessageSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        # Create message and associate with special request
        message = serializer.save(special_request=special_request)
        
        # Invalidate message and request caches
        SpecialRequestCacheService.invalidate_request_messages(special_request.id)
        CacheService.delete(SpecialRequestCacheKeys.request_detail(special_request.id))
        
        logger.info(
            f"Message sent in special request {special_request.id} "
            f"by {request.user.email}"
        )
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SpecialRequestMessageViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing messages in special requests.
    Messages can only be created through the SpecialRequest viewset.
    
    Endpoints:
    - GET /api/concierge/messages/ - List all accessible messages
    - GET /api/concierge/messages/{id}/ - Retrieve a specific message
    """
    serializer_class = SpecialRequestMessageSerializer
    permission_classes = [IsAuthenticated, CanSendMessage]
    
    def get_queryset(self):
        """
        Return messages based on user's accessible special requests
        """
        user = self.request.user
        
        if not user.is_authenticated:
            return SpecialRequestMessage.objects.none()
        
        # Get accessible special requests
        if user.role == 'guest':
            special_requests = SpecialRequest.objects.filter(guest=user)
        elif user.role == 'organizer':
            special_requests = SpecialRequest.objects.filter(event__organizer=user)
        elif user.role == 'team':
            special_requests = SpecialRequest.objects.filter(
                Q(event__team_members=user) | Q(event__organizer=user)
            ).distinct()
        else:
            return SpecialRequestMessage.objects.none()
        
        return SpecialRequestMessage.objects.filter(
            special_request__in=special_requests
        ).select_related('sender', 'special_request')
