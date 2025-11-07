"""
App configuration for Concierge app (Special Requests).
"""
from django.apps import AppConfig


class ConciergeConfig(AppConfig):
    """Configuration for the Concierge app"""
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.concierge'
    verbose_name = 'Concierge & Special Requests'
    
    def ready(self):
        """
        Import signal handlers when the app is ready.
        Add any signal imports here if needed in the future.
        """
        pass
