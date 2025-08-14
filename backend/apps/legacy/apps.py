from django.apps import AppConfig

class LegacyConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.legacy"     # python import path
    label = "backend"        # app label: keeps AUTH_USER_MODEL = "backend.User"