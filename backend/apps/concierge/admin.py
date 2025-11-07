"""
Admin configuration for Concierge app (Special Requests).
"""
from django.contrib import admin
from .models import SpecialRequest, SpecialRequestMessage, SpecialRequestStatus


class SpecialRequestMessageInline(admin.TabularInline):
    """Inline admin for messages in special requests"""
    model = SpecialRequestMessage
    extra = 0
    readonly_fields = ('sender', 'created_at', 'updated_at')
    fields = ('sender', 'message', 'created_at')
    
    def has_add_permission(self, request, obj=None):
        """Allow adding messages in admin"""
        return True
    
    def has_delete_permission(self, request, obj=None):
        """Prevent deletion of messages"""
        return request.user.is_superuser


@admin.register(SpecialRequest)
class SpecialRequestAdmin(admin.ModelAdmin):
    """Admin interface for Special Requests"""
    list_display = [
        'id',
        'title',
        'guest_email',
        'event_title',
        'tier_name',
        'status',
        'assigned_to_email',
        'created_at',
        'message_count',
    ]
    list_filter = [
        'status',
        'event',
        'tier',
        'created_at',
    ]
    search_fields = [
        'title',
        'description',
        'guest__email',
        'guest__name',
        'event__title',
        'tier__name',
    ]
    readonly_fields = [
        'created_at',
        'updated_at',
        'message_count',
    ]
    fieldsets = (
        ('Request Information', {
            'fields': ('guest', 'event', 'tier', 'title', 'description')
        }),
        ('Status & Assignment', {
            'fields': ('status', 'assigned_to')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'message_count'),
            'classes': ('collapse',)
        }),
    )
    inlines = [SpecialRequestMessageInline]
    
    def guest_email(self, obj):
        """Display guest email"""
        return obj.guest.email
    guest_email.short_description = 'Guest'
    guest_email.admin_order_field = 'guest__email'
    
    def event_title(self, obj):
        """Display event title"""
        return obj.event.title
    event_title.short_description = 'Event'
    event_title.admin_order_field = 'event__title'
    
    def tier_name(self, obj):
        """Display tier name"""
        return obj.tier.name
    tier_name.short_description = 'Tier'
    tier_name.admin_order_field = 'tier__name'
    
    def assigned_to_email(self, obj):
        """Display assigned team member email"""
        return obj.assigned_to.email if obj.assigned_to else 'Unassigned'
    assigned_to_email.short_description = 'Assigned To'
    assigned_to_email.admin_order_field = 'assigned_to__email'
    
    def message_count(self, obj):
        """Display number of messages"""
        return obj.messages.count()
    message_count.short_description = 'Messages'
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        queryset = super().get_queryset(request)
        return queryset.select_related(
            'guest',
            'event',
            'tier',
            'assigned_to'
        ).prefetch_related('messages')


@admin.register(SpecialRequestMessage)
class SpecialRequestMessageAdmin(admin.ModelAdmin):
    """Admin interface for Special Request Messages"""
    list_display = [
        'id',
        'special_request_title',
        'sender_email',
        'message_preview',
        'created_at',
    ]
    list_filter = [
        'created_at',
        'special_request__status',
    ]
    search_fields = [
        'message',
        'sender__email',
        'sender__name',
        'special_request__title',
    ]
    readonly_fields = [
        'special_request',
        'sender',
        'created_at',
        'updated_at',
    ]
    fieldsets = (
        ('Message Information', {
            'fields': ('special_request', 'sender', 'message')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def special_request_title(self, obj):
        """Display special request title"""
        return obj.special_request.title
    special_request_title.short_description = 'Special Request'
    special_request_title.admin_order_field = 'special_request__title'
    
    def sender_email(self, obj):
        """Display sender email"""
        return obj.sender.email
    sender_email.short_description = 'Sender'
    sender_email.admin_order_field = 'sender__email'
    
    def message_preview(self, obj):
        """Display message preview (first 50 characters)"""
        return obj.message[:50] + '...' if len(obj.message) > 50 else obj.message
    message_preview.short_description = 'Message'
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        queryset = super().get_queryset(request)
        return queryset.select_related(
            'special_request',
            'sender'
        )
    
    def has_add_permission(self, request):
        """Prevent adding messages directly in admin"""
        return False
