"""
URL configuration for Events app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers

from .views import (
    EventViewSet,
    EventMediaViewSet,
    TierViewSet,
    WaveViewSet,
    PrivilegeViewSet,
    AddOnViewSet,
    TableViewSet,
    PostViewSet,

    # 👇 guest-facing ticket views
    MyTicketViewSet,
    BuyTicketsView,
)

# Create main router and register top-level viewsets
router = DefaultRouter()
router.register(r'events', EventViewSet, basename='event')
router.register(r'media', EventMediaViewSet, basename='eventmedia')

# 👇 register guest ticket endpoints on main router
# /api/guest/tickets/         -> list tickets for current user
# /api/guest/tickets/{id}/    -> ticket detail (current user only)
router.register(r'guest/tickets', MyTicketViewSet, basename='guest-tickets')

# Create nested router for tiers and posts under events
# /api/events/{event_pk}/tiers/
# /api/events/{event_pk}/posts/
events_router = routers.NestedDefaultRouter(router, r'events', lookup='event')
events_router.register(r'tiers', TierViewSet, basename='event-tiers')
events_router.register(r'posts', PostViewSet, basename='event-posts')

# Create nested routers for tier sub-resources
# /api/events/{event_pk}/tiers/{tier_pk}/waves/
tiers_router = routers.NestedDefaultRouter(events_router, r'tiers', lookup='tier')
tiers_router.register(r'waves', WaveViewSet, basename='tier-waves')
tiers_router.register(r'privileges', PrivilegeViewSet, basename='tier-privileges')
tiers_router.register(r'addons', AddOnViewSet, basename='tier-addons')
tiers_router.register(r'tables', TableViewSet, basename='tier-tables')

app_name = 'events'

urlpatterns = [
    path('', include(router.urls)),
    path('', include(events_router.urls)),
    path('', include(tiers_router.urls)),

    # 👇 guest ticket purchase endpoint
    # POST /api/guest/tickets/buy/
    path('guest/tickets/buy/', BuyTicketsView.as_view(), name='guest-ticket-buy'),
]


"""
This creates the following endpoints:

=== Event Endpoints ===
- GET    /api/events/                    - List all events (paginated, with filters)
- POST   /api/events/                    - Create new event (auth required)
- GET    /api/events/{id}/               - Get event detail
- PUT    /api/events/{id}/               - Update event (auth required, organizer only)
- PATCH  /api/events/{id}/               - Partial update event (auth required, organizer only)
- DELETE /api/events/{id}/               - Delete event (auth required, organizer only)
- GET    /api/events/upcoming/           - Get upcoming events (not finished)
- GET    /api/events/finished/           - Get finished events
- GET    /api/events/my_events/          - Get current user's events (auth required)
- POST   /api/events/{id}/upload_media/  - Upload media to event (auth required, organizer only)
- GET    /api/events/{id}/media/         - Get all media for an event

=== EventMedia Endpoints ===
- GET    /api/media/                     - List user's event media (auth required)
- GET    /api/media/{id}/                - Get media detail (auth required)
- PATCH  /api/media/{id}/                - Update media metadata (auth required, organizer only)
- DELETE /api/media/{id}/                - Delete media (auth required, organizer only)

=== Post Endpoints ===
- GET    /api/events/{event_id}/posts/           - List all posts for an event
- POST   /api/events/{event_id}/posts/           - Create new post (organizer only)
- GET    /api/events/{event_id}/posts/{post_id}/ - Get post detail
- PUT    /api/events/{event_id}/posts/{post_id}/ - Update post (organizer only)
- PATCH  /api/events/{event_id}/posts/{post_id}/ - Partial update post (organizer only)
- DELETE /api/events/{event_id}/posts/{post_id}/ - Delete post (organizer only)

=== Tier Endpoints ===
- GET    /api/events/{event_id}/tiers/              - List all tiers for an event
- POST   /api/events/{event_id}/tiers/              - Create new tier (organizer only)
- GET    /api/events/{event_id}/tiers/{tier_id}/    - Get tier detail with nested data
- PUT    /api/events/{event_id}/tiers/{tier_id}/    - Update tier (organizer only)
- PATCH  /api/events/{event_id}/tiers/{tier_id}/    - Partial update tier (organizer only)
- DELETE /api/events/{event_id}/tiers/{tier_id}/    - Delete tier (organizer only)

=== Wave Endpoints (Pricing Waves) ===
- GET    /api/events/{event_id}/tiers/{tier_id}/waves/           - List all waves for a tier
- POST   /api/events/{event_id}/tiers/{tier_id}/waves/           - Create new wave (organizer only)
- GET    /api/events/{event_id}/tiers/{tier_id}/waves/{wave_id}/ - Get wave detail
- PUT    /api/events/{event_id}/tiers/{tier_id}/waves/{wave_id}/ - Update wave (organizer only)
- PATCH  /api/events/{event_id}/tiers/{tier_id}/waves/{wave_id}/ - Partial update wave (organizer only)
- DELETE /api/events/{event_id}/tiers/{tier_id}/waves/{wave_id}/ - Delete wave (organizer only)

=== Privilege Endpoints ===
- GET    /api/events/{event_id}/tiers/{tier_id}/privileges/                - List all privileges for a tier
- POST   /api/events/{event_id}/tiers/{tier_id}/privileges/                - Create new privilege (organizer only)
- GET    /api/events/{event_id}/tiers/{tier_id}/privileges/{privilege_id}/ - Get privilege detail
- PUT    /api/events/{event_id}/tiers/{tier_id}/privileges/{privilege_id}/ - Update privilege (organizer only)
- PATCH  /api/events/{event_id}/tiers/{tier_id}/privileges/{privilege_id}/ - Partial update privilege (organizer only)
- DELETE /api/events/{event_id}/tiers/{tier_id}/privileges/{privilege_id}/ - Delete privilege (organizer only)

=== AddOn Endpoints ===
- GET    /api/events/{event_id}/tiers/{tier_id}/addons/            - List all add-ons for a tier
- POST   /api/events/{event_id}/tiers/{tier_id}/addons/            - Create new add-on (organizer only)
- GET    /api/events/{event_id}/tiers/{tier_id}/addons/{addon_id}/ - Get add-on detail
- PUT    /api/events/{event_id}/tiers/{tier_id}/addons/{addon_id}/ - Update add-on (organizer only)
- PATCH  /api/events/{event_id}/tiers/{tier_id}/addons/{addon_id}/ - Partial update add-on (organizer only)
- DELETE /api/events/{event_id}/tiers/{tier_id}/addons/{addon_id}/ - Delete add-on (organizer only)

=== Table Endpoints ===
- GET    /api/events/{event_id}/tiers/{tier_id}/tables/            - List all tables for a tier
- POST   /api/events/{event_id}/tiers/{tier_id}/tables/            - Create new table (organizer only)
- GET    /api/events/{event_id}/tiers/{tier_id}/tables/{table_id}/ - Get table detail
- PUT    /api/events/{event_id}/tiers/{tier_id}/tables/{table_id}/ - Update table (organizer only)
- PATCH  /api/events/{event_id}/tiers/{tier_id}/tables/{table_id}/ - Partial update table (organizer only)
- DELETE /api/events/{event_id}/tiers/{tier_id}/tables/{table_id}/ - Delete table (organizer only)

=== Query Parameters ===
For /api/events/:
- ?page=1                    - Page number (default: 1)
- ?page_size=10              - Items per page (default: 10, max: 100)
- ?is_finished=true|false    - Filter by finished status
- ?organizer_id=123          - Filter by organizer

=== Examples ===
Events:
- GET /api/events/?page=2&page_size=20
- GET /api/events/?is_finished=false
- GET /api/events/?organizer_id=5
- GET /api/events/upcoming/?page=1
- POST /api/events/123/upload_media/

Posts:
- GET /api/events/1/posts/
- POST /api/events/1/posts/ with body: {"title": "Event Update", "text": "We're excited to announce...", "image": <file>}
- GET /api/events/1/posts/5/
- PATCH /api/events/1/posts/5/ with body: {"title": "Updated Title"}
- DELETE /api/events/1/posts/5/

Tiers and Nested Resources:
- GET /api/events/1/tiers/
- POST /api/events/1/tiers/ with body: {"name": "VIP", "icon": "crown", "gradient": "gold"}
- GET /api/events/1/tiers/2/waves/
- POST /api/events/1/tiers/2/waves/ with body: {"name": "Early Bird", "ticketCount": 100, "price": "50.00"}
- POST /api/events/1/tiers/2/privileges/ with body: {"title": "Backstage Access", "description": "..."}
- POST /api/events/1/tiers/2/addons/ with body: {"name": "T-Shirt", "price": "25.00", "quantity": 50}
- POST /api/events/1/tiers/2/tables/ with body: {"tableName": "VIP Table 1", "tableCount": 5, "numberOfSeats": 8, "minSpend": "500.00"}
"""