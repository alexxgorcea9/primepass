"""
URL configuration for Concierge app (Special Requests).
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SpecialRequestViewSet, SpecialRequestMessageViewSet

# Create router for viewsets
router = DefaultRouter()
router.register(r'special-requests', SpecialRequestViewSet, basename='special-request')
router.register(r'messages', SpecialRequestMessageViewSet, basename='special-request-message')

urlpatterns = [
    path('', include(router.urls)),
]
