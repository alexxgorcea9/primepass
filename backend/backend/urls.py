"""
URL configuration for PrimePass project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

# API URL patterns
api_v1_patterns = [
    # Auth JWT (DRF SimpleJWT)
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh_jwt'),  # renamed to avoid name clash
    path('auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    # Our app endpoints (signup/login/logout/user-profile/token/refresh/oauth…)
    # NOTE: empty prefix here so they live at /api/v1/<route> (e.g., /api/v1/signup/)
    path('', include('apps.auth.urls')),
]

# Main URL patterns
urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API
    path('api/v1/', include(api_v1_patterns)),
    path('api/', include('apps.auth.urls')),

    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # Django Allauth
    # path('accounts/', include('allauth.urls')),  # Commented out - allauth not configured

    # Events API
    path('api/', include('apps.events.urls')),
]

# Development URLs
if settings.DEBUG:
    import debug_toolbar
    
    urlpatterns += [
        path('__debug__/', include(debug_toolbar.urls)),
        path('silk/', include('silk.urls', namespace='silk')),
    ]
    
    # Serve media files in development
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Custom error handlers (commented out until core app is created)
# handler400 = 'apps.core.views.bad_request'
# handler403 = 'apps.core.views.permission_denied'
# handler404 = 'apps.core.views.page_not_found'
# handler500 = 'apps.core.views.server_error'
