from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
import uuid


# ----------------------------
# 1️⃣ USER & ORGANIZER MODELS
# ----------------------------

class UserRole(models.TextChoices):
    GUEST = 'guest', 'Guest'
    ORGANIZER = 'organizer', 'Organizer'
    VENDOR = 'vendor', 'Vendor'


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", UserRole.GUEST)
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True)

    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.GUEST,
    )

    profile_picture = models.URLField(
        max_length=5000,
        blank=True,
        null=True,
        help_text="URL to the user's profile image"
    )

    name = models.CharField()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email


class Organizer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='organizer_profile')
    organization_name = models.CharField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.email


# ----------------------------
# 2️⃣ EVENT & IMAGES
# ----------------------------

class Event(models.Model):
    organizer = models.ForeignKey(Organizer, on_delete=models.CASCADE, related_name='events', db_column='organizerID')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    short_description = models.CharField(max_length=255, blank=True, null=True)
    location = models.CharField(max_length=255)
    date = models.DateField()
    time = models.TimeField()
    is_finished = models.BooleanField(default=False)
    hero_image_url = models.URLField(max_length=50000, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['is_finished'], name='event_is_finished_idx'),
            models.Index(fields=['is_finished', '-date', '-time'], name='event_finished_date_time_idx'),
        ]
        ordering = ['-date', '-time']

    def __str__(self):
        return self.title


class EventImage(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='images')
    image_url = models.URLField(max_length=500)
    is_featured = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.event.title}"


# ----------------------------
# 3️⃣ VIP MANAGEMENT
# ----------------------------

class VIPGuest(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='vip_profile')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='vip_guests')
    special_requests = models.TextField(blank=True, null=True)
    assigned_table = models.ForeignKey('Table', on_delete=models.SET_NULL, blank=True, null=True)

    def __str__(self):
        return f"VIP {self.user.username} for {self.event.title}"


class Table(models.Model):
    tier = models.ForeignKey('Tier', on_delete=models.CASCADE, related_name='tables')
    table_name = models.CharField(max_length=255)
    number_of_seats = models.IntegerField()
    min_spend = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    requirements = models.TextField(blank=True, null=True)
    is_reserved = models.BooleanField(default=False)
    reserved_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True)
    reserved_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=['tier'], name='table_tier_idx'),
            models.Index(fields=['is_reserved'], name='table_reserved_idx'),
            models.Index(fields=['number_of_seats'], name='table_seats_idx'),
        ]
        ordering = ['table_name']

    def __str__(self):
        return f"Table {self.table_name} for {self.tier.name}"


# ----------------------------
# 4️⃣ DYNAMIC TICKETING
# ----------------------------

# Define a constant for the platinum grey color
PLATINUM_GREY = '#B4B8B3'


class Tier(models.Model):
    name = models.CharField(max_length=20, blank=False, null=False)
    price = models.DecimalField(max_digits=10, decimal_places=2, blank=False, null=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='tiers')
    color = models.CharField(max_length=20, default=PLATINUM_GREY, blank=True, null=True)

    def __str__(self):
        return self.name


class Wave(models.Model):
    name = models.CharField(max_length=20, null=True, blank=True)
    ticket_count = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    tier = models.ForeignKey(Tier, on_delete=models.CASCADE, related_name='price_waves')

    def __str__(self):
        return f"{self.ticket_count} tickets at ${self.price} for {self.tier.name if self.tier else 'Unknown'}"


class Privilege(models.Model):
    title = models.CharField(max_length=60)
    description = models.TextField(blank=True, null=True, max_length=255)
    tier = models.ForeignKey(Tier, on_delete=models.CASCADE, related_name='privileges')

    def __str__(self):
        return self.title


class AddOn(models.Model):
    tier = models.ForeignKey(Tier, on_delete=models.CASCADE, related_name='add_ons')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return self.name


class Order(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='orders')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    stripe_charge_id = models.CharField(max_length=255, blank=True, null=True)
    order_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order {self.id} for {self.user.username}"


class Ticket(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='tickets')
    tier = models.ForeignKey(Tier, on_delete=models.CASCADE)
    unique_code = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    assigned_table = models.ForeignKey(Table, on_delete=models.SET_NULL, blank=True, null=True)
    issued_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Ticket {self.unique_code} - {self.tier.name}"


# ----------------------------
# 5️⃣ VENDOR MANAGEMENT
# ----------------------------

class Vendor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='vendor_profile')
    organizer = models.ForeignKey(Organizer, on_delete=models.CASCADE, related_name='vendors')

    # From the second model
    name = models.CharField(max_length=255)
    service_type = models.CharField(max_length=255)
    contact_email = models.EmailField()
    phone_number = models.CharField(max_length=50)
    rating = models.FloatField(default=0.0)

    def __str__(self):
        return self.name


class VendorAssignment(models.Model):
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='assignments')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='vendor_assignments')
    task_description = models.TextField()
    status = models.CharField(max_length=50, choices=[('Pending', 'Pending'), ('Completed', 'Completed')],
                              default='Pending')
    payment_status = models.BooleanField(default=False)


# ----------------------------
# 6️⃣ CHECK-IN & SECURITY
# ----------------------------

class CheckIn(models.Model):
    ticket = models.OneToOneField(Ticket, on_delete=models.CASCADE, related_name='checkin')
    checkin_time = models.DateTimeField(auto_now_add=True)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True)


class ConciergeRequest(models.Model):
    vip_guest = models.ForeignKey(VIPGuest, on_delete=models.CASCADE, related_name='concierge_requests')
    request_text = models.TextField()
    status = models.CharField(max_length=50, choices=[('Pending', 'Pending'), ('Handled', 'Handled')],
                              default='Pending')
    handled_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True)


# ----------------------------
# 7️⃣ NOTIFICATION SYSTEM
# ----------------------------

class NotificationType(models.TextChoices):
    # Guest Notifications
    TICKET_PURCHASE_CONFIRMATION = 'ticket_purchase', 'Ticket Purchase Confirmation'
    TABLE_RESERVATION_CONFIRMATION = 'table_reservation', 'Table Reservation Confirmation'
    EVENT_UPDATE = 'event_update', 'Event Update/Change'
    VIP_CONCIERGE_RESPONSE = 'vip_concierge', 'VIP Concierge Response'
    EVENT_REMINDER = 'event_reminder', 'Event Reminder'
    ADDON_PURCHASE_CONFIRMATION = 'addon_purchase', 'Add-on Purchase Confirmation'

    # Team Notifications
    TASK_ASSIGNMENT = 'task_assignment', 'Task Assignment'
    GUEST_CHECKIN_ALERT = 'guest_checkin', 'Guest Check-in Alert'
    TEAM_MESSAGE_URGENT = 'team_urgent', 'Urgent Team Message'
    TASK_STATUS_UPDATE = 'task_status', 'Task Status Update'
    TEAM_MESSAGE_REGULAR = 'team_regular', 'Regular Team Message'

    # Organizer Notifications
    SALES_MILESTONE = 'sales_milestone', 'Sales Milestone'
    EVENT_PUBLISHING = 'event_publishing', 'Event Publishing'
    LOW_INVENTORY_ALERT = 'low_inventory', 'Low Inventory Alert'
    PAYMENT_ISSUE = 'payment_issue', 'Payment Issue'
    DAILY_REVENUE_UPDATE = 'daily_revenue', 'Daily Revenue Update'
    TEAM_ACTIVITY_SUMMARY = 'team_activity', 'Team Activity Summary'


class NotificationPriority(models.TextChoices):
    HIGH = 'high', 'High Priority'
    MEDIUM = 'medium', 'Medium Priority'
    LOW = 'low', 'Low Priority'


class NotificationTargetType(models.TextChoices):
    INDIVIDUAL = 'individual', 'Individual User'
    ROLE = 'role', 'User Role'
    EVENT_PARTICIPANTS = 'event_participants', 'Event Participants'
    VIP_GUESTS = 'vip_guests', 'VIP Guests'
    TEAM_MEMBERS = 'team_members', 'Team Members'
    ORGANIZERS = 'organizers', 'Organizers'


class Notification(models.Model):
    # Core notification fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type = models.CharField(
        max_length=50,
        choices=NotificationType.choices,
        help_text="Type of notification"
    )
    priority = models.CharField(
        max_length=10,
        choices=NotificationPriority.choices,
        default=NotificationPriority.MEDIUM,
        help_text="Notification priority level"
    )

    # Content fields
    title = models.CharField(max_length=255, help_text="Notification title")
    message = models.TextField(help_text="Main notification message")

    # Targeting fields
    target_type = models.CharField(
        max_length=30,
        choices=NotificationTargetType.choices,
        help_text="How this notification is targeted"
    )
    target_role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        blank=True,
        null=True,
        help_text="Target user role (if target_type is 'role')"
    )
    target_users = models.ManyToManyField(
        User,
        through='NotificationRecipient',
        related_name='notifications',
        help_text="Individual users to notify"
    )

    # Context relationships
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='notifications',
        blank=True,
        null=True,
        help_text="Related event (if applicable)"
    )
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='notifications',
        blank=True,
        null=True,
        help_text="Related order (if applicable)"
    )
    vendor_assignment = models.ForeignKey(
        VendorAssignment,
        on_delete=models.CASCADE,
        related_name='notifications',
        blank=True,
        null=True,
        help_text="Related vendor assignment (if applicable)"
    )

    # Data payload (JSON field for flexible data storage)
    data = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional notification data as JSON"
    )

    # Delivery tracking
    sent_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the notification was sent"
    )
    delivery_channels = models.JSONField(
        default=list,
        blank=True,
        help_text="List of delivery channels used (e.g., ['email', 'push', 'in_app'])"
    )

    # Soft deletion and timestamps
    is_deleted = models.BooleanField(default=False, help_text="Soft deletion flag")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Creator tracking
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name='created_notifications',
        blank=True,
        null=True,
        help_text="User who created this notification"
    )

    class Meta:
        indexes = [
            models.Index(fields=['type'], name='notification_type_idx'),
            models.Index(fields=['priority'], name='notification_priority_idx'),
            models.Index(fields=['target_type'], name='notification_target_type_idx'),
            models.Index(fields=['target_role'], name='notification_target_role_idx'),
            models.Index(fields=['event'], name='notification_event_idx'),
            models.Index(fields=['created_at'], name='notification_created_at_idx'),
            models.Index(fields=['sent_at'], name='notification_sent_at_idx'),
            models.Index(fields=['is_deleted'], name='notification_is_deleted_idx'),
            models.Index(fields=['is_deleted', '-created_at'], name='notification_active_recent_idx'),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_type_display()} - {self.title}"

    def mark_as_sent(self, channels=None):
        """Mark notification as sent with optional delivery channels."""
        from django.utils import timezone
        self.sent_at = timezone.now()
        if channels:
            self.delivery_channels = channels
        self.save(update_fields=['sent_at', 'delivery_channels'])

    def soft_delete(self):
        """Soft delete the notification."""
        self.is_deleted = True
        self.save(update_fields=['is_deleted'])

    def get_recipients_count(self):
        """Get the total number of recipients for this notification."""
        return self.recipients.filter(is_deleted=False).count()

    def get_read_count(self):
        """Get the number of recipients who have read this notification."""
        return self.recipients.filter(is_deleted=False, read_at__isnull=False).count()

    def get_delivery_status(self):
        """Get delivery status summary."""
        total = self.get_recipients_count()
        read = self.get_read_count()
        return {
            'total_recipients': total,
            'read_count': read,
            'unread_count': total - read,
            'read_percentage': (read / total * 100) if total > 0 else 0
        }


class NotificationRecipient(models.Model):
    """Through model for Notification-User relationship with read tracking."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notification = models.ForeignKey(
        Notification,
        on_delete=models.CASCADE,
        related_name='recipients'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notification_receipts'
    )

    # Read tracking
    read_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the user read this notification"
    )

    # Delivery tracking
    delivered_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the notification was delivered to this user"
    )
    delivery_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('delivered', 'Delivered'),
            ('failed', 'Failed'),
            ('bounced', 'Bounced'),
        ],
        default='pending',
        help_text="Delivery status for this recipient"
    )

    # Soft deletion and timestamps
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['notification', 'user']
        indexes = [
            models.Index(fields=['user'], name='notif_recipient_user_idx'),
            models.Index(fields=['notification'], name='notif_recipient_notif_idx'),
            models.Index(fields=['read_at'], name='notif_recipient_read_idx'),
            models.Index(fields=['delivered_at'], name='notif_recipient_deliv_idx'),
            models.Index(fields=['delivery_status'], name='notif_recipient_status_idx'),
            models.Index(fields=['is_deleted'], name='notif_recipient_del_idx'),
            models.Index(fields=['user', 'is_deleted', '-created_at'], name='notif_user_active_recent_idx'),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.notification.title} -> {self.user.email}"

    def mark_as_read(self):
        """Mark this notification as read by the user."""
        from django.utils import timezone
        if not self.read_at:
            self.read_at = timezone.now()
            self.save(update_fields=['read_at'])

    def mark_as_delivered(self, status='delivered'):
        """Mark this notification as delivered to the user."""
        from django.utils import timezone
        self.delivered_at = timezone.now()
        self.delivery_status = status
        self.save(update_fields=['delivered_at', 'delivery_status'])

    def is_read(self):
        """Check if the notification has been read."""
        return self.read_at is not None

    def is_delivered(self):
        """Check if the notification has been delivered."""
        return self.delivery_status == 'delivered'


class NotificationAction(models.Model):
    """Interactive action buttons for notifications."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notification = models.ForeignKey(
        Notification,
        on_delete=models.CASCADE,
        related_name='actions'
    )

    # Action details
    action_type = models.CharField(
        max_length=50,
        help_text="Type of action (e.g., 'view_ticket', 'accept_task', 'add_calendar')"
    )
    label = models.CharField(
        max_length=100,
        help_text="Display label for the action button"
    )
    url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text="URL to navigate to when action is clicked"
    )

    # Action data (JSON field for flexible action parameters)
    action_data = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional action data as JSON"
    )

    # Styling and ordering
    style_class = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="CSS class for styling the action button"
    )
    order = models.PositiveIntegerField(
        default=0,
        help_text="Display order of the action button"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'created_at']
        indexes = [
            models.Index(fields=['notification'], name='notif_action_notif_idx'),
            models.Index(fields=['action_type'], name='notif_action_type_idx'),
            models.Index(fields=['order'], name='notif_action_order_idx'),
        ]

    def __str__(self):
        return f"{self.label} ({self.action_type})"


# ----------------------------
# 8️⃣ NOTIFICATION ADMIN
# ----------------------------

from django.contrib import admin


class NotificationActionInline(admin.TabularInline):
    model = NotificationAction
    extra = 0
    fields = ['action_type', 'label', 'url', 'style_class', 'order']


class NotificationRecipientInline(admin.TabularInline):
    model = NotificationRecipient
    extra = 0
    readonly_fields = ['read_at', 'delivered_at', 'created_at']
    fields = ['user', 'delivery_status', 'read_at', 'delivered_at']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'type', 'priority', 'target_type', 'event',
        'get_recipients_count', 'get_read_count', 'sent_at', 'created_at'
    ]
    list_filter = [
        'type', 'priority', 'target_type', 'target_role',
        'sent_at', 'is_deleted', 'created_at'
    ]
    search_fields = ['title', 'message', 'event__title']
    readonly_fields = ['id', 'created_at', 'updated_at', 'get_delivery_status']
    inlines = [NotificationActionInline, NotificationRecipientInline]

    fieldsets = [
        ('Basic Information', {
            'fields': ['id', 'type', 'priority', 'title', 'message']
        }),
        ('Targeting', {
            'fields': ['target_type', 'target_role']
        }),
        ('Context', {
            'fields': ['event', 'order', 'vendor_assignment']
        }),
        ('Data & Delivery', {
            'fields': ['data', 'delivery_channels', 'sent_at']
        }),
        ('Metadata', {
            'fields': ['created_by', 'is_deleted', 'created_at', 'updated_at'],
            'classes': ['collapse']
        }),
        ('Statistics', {
            'fields': ['get_delivery_status'],
            'classes': ['collapse']
        })
    ]

    def get_delivery_status(self, obj):
        """Display delivery status in admin."""
        status = obj.get_delivery_status()
        return f"Total: {status['total_recipients']}, Read: {status['read_count']} ({status['read_percentage']:.1f}%)"

    get_delivery_status.short_description = 'Delivery Status'


@admin.register(NotificationRecipient)
class NotificationRecipientAdmin(admin.ModelAdmin):
    list_display = [
        'notification', 'user', 'delivery_status',
        'delivered_at', 'read_at', 'created_at'
    ]
    list_filter = [
        'delivery_status', 'read_at', 'delivered_at',
        'is_deleted', 'created_at'
    ]
    search_fields = [
        'notification__title', 'user__email',
        'notification__event__title'
    ]
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(NotificationAction)
class NotificationActionAdmin(admin.ModelAdmin):
    list_display = ['notification', 'action_type', 'label', 'order', 'created_at']
    list_filter = ['action_type', 'created_at']
    search_fields = ['notification__title', 'label', 'action_type']
    readonly_fields = ['id', 'created_at', 'updated_at']
