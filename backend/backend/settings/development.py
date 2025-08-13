"""
Development settings for PrimePass project.

This file contains settings specific to the development environment.
"""

import sys
from .base import *

# ==============================================================================
# DEBUG SETTINGS
# ==============================================================================

DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', 'backend']

# ==============================================================================
# DEVELOPMENT APPS
# ==============================================================================

INSTALLED_APPS += [
    'django_extensions',
    'debug_toolbar',
    'silk',
]

# ==============================================================================
# DEVELOPMENT MIDDLEWARE
# ==============================================================================

MIDDLEWARE = [
    'debug_toolbar.middleware.DebugToolbarMiddleware',
    'silk.middleware.SilkyMiddleware',
] + MIDDLEWARE

# ==============================================================================
# DEBUG TOOLBAR CONFIGURATION
# ==============================================================================

INTERNAL_IPS = [
    '127.0.0.1',
    'localhost',
]

DEBUG_TOOLBAR_CONFIG = {
    'SHOW_TOOLBAR_CALLBACK': lambda request: DEBUG,
    'SHOW_COLLAPSED': True,
}

# ==============================================================================
# SILK PROFILING CONFIGURATION
# ==============================================================================

SILKY_PYTHON_PROFILER = config('ENABLE_SILK_PROFILING', default=False, cast=bool)
SILKY_PYTHON_PROFILER_BINARY = True
SILKY_AUTHENTICATION = True
SILKY_AUTHORISATION = True

# ==============================================================================
# DATABASE CONFIGURATION
# ==============================================================================

# Use PgBouncer in development for testing
if config('USE_PGBOUNCER', default=False, cast=bool):
    DATABASES['default']['HOST'] = config('DATABASE_HOST', default='pgbouncer')
    DATABASES['default']['PORT'] = config('PGBOUNCER_PORT', default='5432')

# Docker environment detection - use pgbouncer if running in Docker
import os
if os.path.exists('/.dockerenv') or config('DOCKER_ENV', default=False, cast=bool):
    DATABASES['default']['HOST'] = 'pgbouncer'
    DATABASES['default']['PORT'] = '6432'  # pgbouncer actually listens on 6432

# ==============================================================================
# CACHE CONFIGURATION
# ==============================================================================

# Enable cache debugging in development
CACHES['default']['OPTIONS']['IGNORE_EXCEPTIONS'] = True

# ==============================================================================
# EMAIL CONFIGURATION
# ==============================================================================

# Use console backend for development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# ==============================================================================
# CORS CONFIGURATION
# ==============================================================================

# Allow all origins in development
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',  # Vite default port
    'http://127.0.0.1:5173',
]

# ==============================================================================
# LOGGING CONFIGURATION
# ==============================================================================

LOGGING['handlers']['console']['level'] = 'DEBUG'
LOGGING['loggers']['django.db.backends'] = {
    'handlers': ['console'],
    'level': 'DEBUG',
    'propagate': False,
}

# ==============================================================================
# DEVELOPMENT UTILITIES
# ==============================================================================

# Django Extensions
SHELL_PLUS_PRINT_SQL = True
SHELL_PLUS_PRINT_SQL_TRUNCATE = 1000

# ==============================================================================
# SECURITY SETTINGS (RELAXED FOR DEVELOPMENT)
# ==============================================================================

# Disable HTTPS redirects in development
SECURE_SSL_REDIRECT = False
SECURE_PROXY_SSL_HEADER = None
SECURE_HSTS_SECONDS = 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False

# ==============================================================================
# CELERY CONFIGURATION
# ==============================================================================

# Use eager execution in development for easier debugging
CELERY_TASK_ALWAYS_EAGER = config('CELERY_EAGER', default=False, cast=bool)
CELERY_TASK_EAGER_PROPAGATES = True

# ==============================================================================
# CUSTOM DEVELOPMENT SETTINGS
# ==============================================================================

# Enable query counting
QUERYCOUNT = {
    'THRESHOLDS': {
        'MEDIUM': 50,
        'HIGH': 200,
        'MIN_TIME_TO_LOG': 0,
        'MIN_QUERY_COUNT_TO_LOG': 5,
    },
    'IGNORE_REQUEST_PATTERNS': [
        r'^/admin/',
        r'^/static/',
        r'^/media/',
    ],
    'IGNORE_SQL_PATTERNS': [],
    'DISPLAY_DUPLICATES': 10,
}

# Disable template caching
TEMPLATES[0]['OPTIONS']['debug'] = True
if 'loaders' in TEMPLATES[0]['OPTIONS']:
    TEMPLATES[0]['OPTIONS']['loaders'] = [
        'django.template.loaders.filesystem.Loader',
        'django.template.loaders.app_directories.Loader',
    ]

# ==============================================================================
# TESTING OVERRIDES
# ==============================================================================

if 'test' in sys.argv or 'pytest' in sys.modules:
    # Use in-memory database for tests
    DATABASES['default'] = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
    
    # Disable migrations for faster tests
    class DisableMigrations:
        def __contains__(self, item):
            return True
        
        def __getitem__(self, item):
            return None
    
    MIGRATION_MODULES = DisableMigrations()
    
    # Use dummy cache for tests
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
        }
    }
    
    # Disable Celery in tests
    CELERY_TASK_ALWAYS_EAGER = True
    CELERY_TASK_EAGER_PROPAGATES = True
