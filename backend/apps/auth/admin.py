from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Admin configuration for custom User model.
    """
    list_display = ['email', 'name', 'role', 'is_active', 'email_verified', 'date_joined']
    list_filter = ['role', 'is_active', 'is_staff', 'email_verified', 'date_joined']
    search_fields = ['email', 'name', 'google_id', 'apple_id', 'instagram_id']
    ordering = ['-date_joined']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal Info'), {'fields': ('name', 'phone_number', 'birth_date', 'profile_picture')}),
        (_('Role & Permissions'), {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        (_('OAuth Providers'), {'fields': ('google_id', 'apple_id', 'instagram_id')}),
        (_('Email Verification'), {'fields': ('email_verified', 'email_verification_token', 'email_verification_token_created')}),
        (_('Organizer Info'), {'fields': ('organizer_bio',)}),
        (_('Important Dates'), {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'role'),
        }),
    )
    
    readonly_fields = ['date_joined', 'last_login']
