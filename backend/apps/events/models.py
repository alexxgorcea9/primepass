from django.db import models
from django.core.validators import FileExtensionValidator
from django.core.exceptions import ValidationError
from django.conf import settings

from .constants import TierIcon, TierGradient

User = settings.AUTH_USER_MODEL


# ==============================================================================
# Event Models
# ==============================================================================

class Event(models.Model):
    organizer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='events', db_column='organizerID')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    short_description = models.CharField(max_length=255, blank=True, null=True)
    location = models.CharField(max_length=255)
    date = models.DateField()
    time = models.TimeField()
    is_finished = models.BooleanField(default=False)
    access_code = models.CharField(
        max_length=8,
        unique=True,
        help_text="8-character alphanumeric access code for event team access"
    )
    team_members = models.ManyToManyField(
        User,
        related_name='team_events',
        blank=True,
        help_text="Users who are part of the event team"
    )
    hero_image = models.ImageField(
        upload_to='event_heroes/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'webp'])],
        help_text="Event hero/banner image. Uploaded to S3 in production."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['organizer'], name='event_organizer_idx'),
            models.Index(fields=['is_finished'], name='event_is_finished_idx'),
            models.Index(fields=['is_finished', '-date', '-time'], name='event_finished_date_time_idx'),
            models.Index(fields=['access_code'], name='event_access_code_idx'),
        ]
        ordering = ['-date', '-time']

    def __str__(self):
        return self.title


class EventMedia(models.Model):
    MEDIA_TYPE_CHOICES = [
        ('image', 'Image'),
        ('video', 'Video'),
    ]

    event = models.ForeignKey(
        'Event',
        on_delete=models.CASCADE,
        related_name='media'
    )
    media_type = models.CharField(
        max_length=10,
        choices=MEDIA_TYPE_CHOICES
    )
    file = models.FileField(
        upload_to='event_media/',
        validators=[FileExtensionValidator(
            allowed_extensions=['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi']
        )]
    )
    is_featured = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['event'], name='event_idx'),
        ]



# ==============================================================================
# TIER MODEL
# ==============================================================================

class Tier(models.Model):
    """
    Represents a ticket tier for an event with customizable visual properties.
    
    Icons and gradients are stored as identifiers that map to predefined
    frontend assets and styles defined in constants.py.
    """
    event = models.ForeignKey(
        Event, 
        on_delete=models.CASCADE, 
        related_name='tiers'
    )
    name = models.CharField(
        max_length=20, 
        blank=False, 
        null=False,
        help_text="Display name for the tier (max 20 characters)"
    )
    icon = models.CharField(
        max_length=20,
        choices=TierIcon.CHOICES,
        default=TierIcon.TICKET,
        help_text="Icon identifier matching frontend SVG assets"
    )
    gradient = models.CharField(
        max_length=20,
        choices=TierGradient.CHOICES,
        default=TierGradient.EMERALD,
        help_text="Gradient identifier matching frontend color definitions"
    )
    has_special_requests = models.BooleanField(
        default=False,
        help_text="Whether this tier allows special requests from attendees"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['id']
        indexes = [
            models.Index(fields=['event'], name='tier_event_idx'),
        ]

    def __str__(self):
        return f"{self.name} ({self.event.title})"



# ==============================================================================
# WAVE MODEL
# ==============================================================================

class Wave(models.Model):
    name = models.CharField(max_length=20, null=True, blank=True)
    ticket_count = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    tier = models.ForeignKey(Tier, on_delete=models.CASCADE, related_name='price_waves')

    def __str__(self):
        return f"{self.ticket_count} tickets at ${self.price} for {self.tier.name if self.tier else 'Unknown'}"



# ==============================================================================
# PRIVILEGE MODEL
# ==============================================================================

class Privilege(models.Model):
    title = models.CharField(max_length=60)
    description = models.TextField(blank=True, null=True, max_length=255)
    tier = models.ForeignKey(Tier, on_delete=models.CASCADE, related_name='privileges')

    def __str__(self):
        return self.title



# ==============================================================================
# ADD ON MODEL
# ==============================================================================

class AddOn(models.Model):
    tier = models.ForeignKey(Tier, on_delete=models.CASCADE, related_name='add_ons')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_unlimited = models.BooleanField(default=False)
    quantity = models.PositiveIntegerField()

    def clean(self):
        if self.is_unlimited and self.quantity != 0:
            raise ValidationError("Unlimited add-ons should have quantity set to 0")

    def __str__(self):
        return self.name


# ==============================================================================
# TABLE MODEL
# ==============================================================================

class Table(models.Model):
    tier = models.ForeignKey('Tier', on_delete=models.CASCADE, related_name='tables')
    table_name = models.CharField(max_length=255)
    quantity_available = models.PositiveIntegerField()
    number_of_seats = models.IntegerField()
    min_spend = models.DecimalField(max_digits=10, decimal_places=2, default=0)
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


# ==============================================================================
# POST MODEL
# ==============================================================================

class Post(models.Model):
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='posts'
    )
    title = models.CharField(max_length=200)
    text = models.TextField()
    image = models.ImageField(
        upload_to='event_posts/%Y/%m/%d/',
        blank=True,
        null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['event', '-created_at']),
        ]

    def __str__(self):
        return f"{self.event.title} - {self.title}"


# ORDER / PAYMENT / TICKET
class OrderStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    PAID = "paid", "Paid"
    CANCELED = "canceled", "Canceled"
    REfunded = "refunded", "Refunded"


class Order(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="orders",
        db_column="userID",
    )
    event = models.ForeignKey(
        Event,
        on_delete=models.PROTECT,
        related_name="orders",
        db_column="eventID",
    )
    status = models.CharField(
        max_length=20,
        choices=OrderStatus.choices,
        default=OrderStatus.PENDING,
    )
    currency = models.CharField(max_length=10, default="EUR")
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    fees = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    payment_refference = models.CharField(
        max_length=255, blank=True, null=True,
        help_text="Payment provider reference (e.g. Stripe payment_intent id)",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    paid_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user"], name="order_user_idx"),
            models.Index(fields=["event"], name="order_event_idx"),
            models.Index(fields=["status"], name="order_status_idx"),
            models.Index(fields=["created_at"], name="order_created_at_idx"),
        ]

    def __str__(self):
        return f"Order #{self.id} by {self.user} for {self.event}"

    @property
    def is_paid(self) -> bool:
        return self.status == OrderStatus.PAID

class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
    )
    tier = models.ForeignKey(
        Tier,
        on_delete=models.PROTECT,
        related_name="order_items",
    )
    wave = models.ForeignKey(
        Wave,
        on_delete=models.PROTECT,
        related_name="order_items",
        blank = True,
        null = True,
    )
    table = models.ForeignKey(
        Table,
        on_delete=models.SET_NULL,
        related_name="order_items",
        blank=True,
        null=True,
    )

    quantity = models.PositiveIntegerField(default=1)

    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        indexes = [
            models.Index(fields=["order"], name="orderitem_order_idx"),
            models.Index(fields=["tier"], name="orderitem_tier_idx"),
            models.Index(fields=["wave"], name="orderitem_wave_idx"),
        ]

    def __str__(self):
        return f"{self.quantity} x {self.tier.name} x {self.order}"

    def clean(self):
        # ensure tier belongs to the same event as the order
        if self.tier and self.order and self.tier.event_id != self.order.event_id:
            from django.core.exceptions import ValidationError
            raise ValidationError("Tier event must match order event.")

class OrderItemAddOn(models.Model):
    order_item = models.ForeignKey(
        OrderItem,
        on_delete=models.CASCADE,
        related_name="add_ons",
    )
    add_on = models.ForeignKey(
        AddOn,
        on_delete=models.PROTECT,
        related_name="order_item_add_ons",
    )

    quantity = models.PositiveIntegerField(default=1)

    # Monetary values copied from AddOn at purchase time
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        indexes = [
            models.Index(fields=["order_item"], name="orderitemaddon_item_idx"),
            models.Index(fields=["add_on"], name="orderitemaddon_addon_idx"),
        ]

    def __str__(self):
        return f"{self.quantity} x {self.add_on.name} for {self.order_item}"

class TicketStatus(models.TextChoices):
    VALID = "valid", "Valid"
    USED = "used", "Used / Checked-in"
    CANCELED = "canceled", "Canceled"


class Ticket(models.Model):
    order_item = models.ForeignKey(
        OrderItem,
        on_delete=models.PROTECT,
        related_name="tickets",
        blank=True,
        null=True,
        help_text="Order item that purchased this ticket. Null for unclaimed tickets.",
    )
    user = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="tickets",
        db_column="userID",
        blank=True,
        null=True,
    )
    event = models.ForeignKey(
        Event,
        on_delete=models.PROTECT,
        related_name="tickets",
        db_column="eventID",
    )
    tier = models.ForeignKey(
        Tier,
        on_delete=models.PROTECT,
        related_name="tickets",
    )
    wave = models.ForeignKey(
        Wave,
        on_delete=models.PROTECT,
        related_name="tickets",
        blank=True,
        null=True,
    )
    table = models.ForeignKey(
        Table,
        on_delete=models.SET_NULL,
        related_name="tickets",
        blank=True,
        null=True,
        help_text="Assigned table for this ticket if applicable.",
    )

    # Optional explicit privileges (usually implied by tier)
    privileges = models.ManyToManyField(
        Privilege,
        related_name="tickets",
        blank=True,
        help_text="Overrides or additional privileges for this ticket (optional).",
    )

    # General ticket properties
    status = models.CharField(
        max_length=20,
        choices=TicketStatus.choices,
        default=TicketStatus.VALID,
    )

    ticket_code = models.CharField(
        max_length=64,
        unique=True,
        help_text="Public identifier/QR payload for the ticket.",
    )
    holder_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Name printed on the ticket (optional, can differ from account name).",
    )

    is_claimed = models.BooleanField(
        default=False,
        help_text="Whether this pre-generated ticket has been purchased/claimed.",
    )

    qr_code_image = models.ImageField(
        upload_to='ticket_qr_codes/',
        blank=True,
        null=True,
        help_text="Generated QR code image for this ticket.",
    )

    checked_in_at = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["event", "tier", "id"]
        indexes = [
            models.Index(fields=["user"], name="ticket_user_idx"),
            models.Index(fields=["event"], name="ticket_event_idx"),
            models.Index(fields=["tier"], name="ticket_tier_idx"),
            models.Index(fields=["status"], name="ticket_status_idx"),
            models.Index(fields=["ticket_code"], name="ticket_code_idx"),
        ]

    def __str__(self):
        return f"Ticket {self.ticket_code} ({self.tier.name} - {self.event.title})"

    @property
    def is_checked_in(self) -> bool:
        return self.status == TicketStatus.USED

    def mark_checked_in(self, commit: bool = True):
        if self.status != TicketStatus.USED:
            self.status = TicketStatus.USED
            self.checked_in_at = timezone.now()
            if commit:
                self.save(update_fields=["status", "checked_in_at"])


class TicketAddOn(models.Model):
    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name="ticket_add_ons",
    )
    add_on = models.ForeignKey(
        AddOn,
        on_delete=models.PROTECT,
        related_name="ticket_add_ons",
    )

    quantity = models.PositiveIntegerField(default=1)

    # Snapshot of price at time of purchase
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        indexes = [
            models.Index(fields=["ticket"], name="ticketaddon_ticket_idx"),
            models.Index(fields=["add_on"], name="ticketaddon_addon_idx"),
        ]

    def __str__(self):
        return f"{self.quantity} x {self.add_on.name} on {self.ticket}"