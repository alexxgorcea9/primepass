"""
Celery configuration for PrimePass project.
"""

import os
from celery import Celery
from django.conf import settings

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings.development')

app = Celery('primepass')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Celery beat schedule
app.conf.beat_schedule = {
    'cleanup-expired-tokens': {
        # 'task': 'apps.accounts.tasks.cleanup_expired_tokens',  # Commented out - accounts app removed
        'schedule': 3600.0,  # Run every hour
    },
    'send-event-reminders': {
        'task': 'apps.events.tasks.send_event_reminders',
        'schedule': 1800.0,  # Run every 30 minutes
    },
    'update-event-analytics': {
        'task': 'apps.analytics.tasks.update_event_analytics',
        'schedule': 900.0,   # Run every 15 minutes
    },
    'cleanup-old-notifications': {
        'task': 'apps.notifications.tasks.cleanup_old_notifications',
        'schedule': 86400.0,  # Run daily
    },
}

app.conf.timezone = 'UTC'

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
