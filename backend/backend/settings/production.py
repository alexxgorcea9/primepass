"""
Production settings for PrimePass project.

This file contains settings specific to the production environment.
"""

from .base import *
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.celery import CeleryIntegration
from sentry_sdk.integrations.redis import RedisIntegration

# ==============================================================================
# SECURITY SETTINGS
# ==============================================================================

DEBUG = False
ALLOWED_HOSTS = config('ALLOWED_HOSTS', cast=lambda v: [s.strip() for s in v.split(',')])

# Security headers
SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=True, cast=bool)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_HSTS_SECONDS = config('SECURE_HSTS_SECONDS', default=31536000, cast=int)
SECURE_HSTS_INCLUDE_SUBDOMAINS = config('SECURE_HSTS_INCLUDE_SUBDOMAINS', default=True, cast=bool)
SECURE_HSTS_PRELOAD = config('SECURE_HSTS_PRELOAD', default=True, cast=bool)
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

# Cookie security
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Lax'

# ==============================================================================
# DATABASE CONFIGURATION
# ==============================================================================

# Use PgBouncer in production
DATABASES['default']['HOST'] = config('DATABASE_HOST')
DATABASES['default']['PORT'] = config('PGBOUNCER_PORT', default='6432')
DATABASES['default']['OPTIONS'].update({
    'sslmode': 'require',
    'connect_timeout': 10,
    'options': '-c default_transaction_isolation=read_committed'
})

# Connection pooling
DATABASES['default']['CONN_MAX_AGE'] = 60

# ==============================================================================
# CACHE CONFIGURATION
# ==============================================================================

# Production Redis configuration
CACHES['default']['OPTIONS'].update({
    'CONNECTION_POOL_KWARGS': {
        'max_connections': 100,
        'retry_on_timeout': True,
        'socket_keepalive': True,
        'socket_keepalive_options': {},
    },
    'IGNORE_EXCEPTIONS': False,
})

# ==============================================================================
# STATIC FILES AND MEDIA
# ==============================================================================

# Use cloud storage in production
if config('USE_S3', default=False, cast=bool):
    # AWS S3 Configuration
    AWS_ACCESS_KEY_ID = config('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = config('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = config('AWS_STORAGE_BUCKET_NAME')
    AWS_S3_REGION_NAME = config('AWS_S3_REGION_NAME', default='us-east-1')
    AWS_S3_CUSTOM_DOMAIN = config('AWS_S3_CUSTOM_DOMAIN', default=None)
    AWS_DEFAULT_ACL = None
    AWS_S3_OBJECT_PARAMETERS = {
        'CacheControl': 'max-age=86400',
    }
    
    # Static files
    STATICFILES_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    STATIC_URL = f'https://{AWS_S3_CUSTOM_DOMAIN or f"{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com"}/static/'
    
    # Media files
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN or f"{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com"}/media/'

# ==============================================================================
# EMAIL CONFIGURATION
# ==============================================================================

# Use SendGrid in production
EMAIL_BACKEND = 'anymail.backends.sendgrid.EmailBackend'
ANYMAIL = {
    'SENDGRID_API_KEY': config('SENDGRID_API_KEY', default=''),
}

DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@primepass.com')
SERVER_EMAIL = config('SERVER_EMAIL', default='server@primepass.com')

# ==============================================================================
# LOGGING CONFIGURATION
# ==============================================================================

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'json': {
            '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
            'format': '%(levelname)s %(asctime)s %(module)s %(process)d %(thread)d %(message)s'
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/var/log/primepass/primepass.log',
            'maxBytes': 1024*1024*50,  # 50 MB
            'backupCount': 5,
            'formatter': 'json',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'json',
        },
        'sentry': {
            'level': 'ERROR',
            'class': 'sentry_sdk.integrations.logging.SentryHandler',
        },
    },
    'root': {
        'handlers': ['console', 'file', 'sentry'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file', 'sentry'],
            'level': 'INFO',
            'propagate': False,
        },
        'primepass': {
            'handlers': ['console', 'file', 'sentry'],
            'level': 'INFO',
            'propagate': False,
        },
        'celery': {
            'handlers': ['console', 'file', 'sentry'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# ==============================================================================
# SENTRY CONFIGURATION
# ==============================================================================

SENTRY_DSN = config('SENTRY_DSN', default='')
if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[
            DjangoIntegration(
                transaction_style='url',
                middleware_spans=True,
                signals_spans=True,
            ),
            CeleryIntegration(
                monitor_beat_tasks=True,
                propagate_traces=True,
            ),
            RedisIntegration(),
        ],
        traces_sample_rate=config('SENTRY_TRACES_SAMPLE_RATE', default=0.1, cast=float),
        send_default_pii=False,
        environment=config('ENVIRONMENT', default='production'),
        release=config('RELEASE_VERSION', default='1.0.0'),
    )

# ==============================================================================
# CORS CONFIGURATION
# ==============================================================================

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    cast=lambda v: [s.strip() for s in v.split(',')]
)

# ==============================================================================
# CELERY CONFIGURATION
# ==============================================================================

# Production Celery settings
CELERY_TASK_ALWAYS_EAGER = False
CELERY_WORKER_PREFETCH_MULTIPLIER = 1
CELERY_TASK_ACKS_LATE = True
CELERY_WORKER_MAX_TASKS_PER_CHILD = 1000

# Task routing
CELERY_TASK_ROUTES = {
    'apps.notifications.tasks.*': {'queue': 'notifications'},
    'apps.events.tasks.*': {'queue': 'events'},
    'apps.analytics.tasks.*': {'queue': 'analytics'},
}

# ==============================================================================
# PERFORMANCE OPTIMIZATIONS
# ==============================================================================

# Database optimizations
DATABASES['default']['OPTIONS'].update({
    'MAX_CONNS': 20,
    'OPTIONS': {
        'MAX_CONNS': 20,
        'autocommit': True,
    }
})

# Template caching
TEMPLATES[0]['OPTIONS']['loaders'] = [
    ('django.template.loaders.cached.Loader', [
        'django.template.loaders.filesystem.Loader',
        'django.template.loaders.app_directories.Loader',
    ]),
]

# ==============================================================================
# MONITORING AND HEALTH CHECKS
# ==============================================================================

# Health check configuration
HEALTH_CHECK = {
    'DISK_USAGE_MAX': 90,  # percent
    'MEMORY_MIN': 100,     # in MB
}

# ==============================================================================
# RATE LIMITING
# ==============================================================================

# Production rate limits
RATELIMIT_ENABLE = True
RATELIMIT_USE_CACHE = 'default'

# ==============================================================================
# CUSTOM PRODUCTION SETTINGS
# ==============================================================================

# Disable browsable API in production
REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = [
    'djangorestframework_camel_case.render.CamelCaseJSONRenderer',
]

# Production-specific middleware
MIDDLEWARE.insert(1, 'django.middleware.cache.UpdateCacheMiddleware')
MIDDLEWARE.append('django.middleware.cache.FetchFromCacheMiddleware')

# Cache middleware settings
CACHE_MIDDLEWARE_ALIAS = 'default'
CACHE_MIDDLEWARE_SECONDS = 600
CACHE_MIDDLEWARE_KEY_PREFIX = 'primepass'

# ==============================================================================
# BACKUP CONFIGURATION
# ==============================================================================

# Database backup settings
DBBACKUP_STORAGE = 'django.core.files.storage.FileSystemStorage'
DBBACKUP_STORAGE_OPTIONS = {'location': '/var/backups/primepass/'}

# ==============================================================================
# ADMIN CONFIGURATION
# ==============================================================================

# Secure admin
ADMIN_URL = config('ADMIN_URL', default='admin/')
ADMIN_FORCE_ALLAUTH = True
