import logging
import string
import secrets
from rest_framework import serializers
from django.contrib.auth import get_user_model
from decimal import Decimal
from uuid import uuid4
from django.shortcuts import get_object_or_404
from django.db import transaction
from .models import Tier, EventMedia, Event, Wave, Privilege, AddOn, Table, Post,Order, OrderItem, OrderItemAddOn, Ticket, TicketAddOn, OrderStatus, TicketStatus

User = get_user_model()
logger = logging.getLogger(__name__)


def generate_access_code():
    """Generate a unique 8-character alphanumeric access code"""
    characters = string.ascii_uppercase + string.digits
    while True:
        code = ''.join(secrets.choice(characters) for _ in range(8))
        # Check if code already exists
        if not Event.objects.filter(access_code=code).exists():
            return code


class TeamMemberSerializer(serializers.ModelSerializer):
    """Serializer for team members"""
    profilePicture = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'profilePicture', 'role']
        read_only_fields = ['id', 'email', 'name', 'profilePicture', 'role']
    
    def get_profilePicture(self, obj):
        """Return profile picture URL if exists"""
        if obj.profile_picture:
            return obj.profile_picture.url
        return None


class EventMediaSerializer(serializers.ModelSerializer):
    """Serializer for event media (images/videos)"""
    mediaType = serializers.CharField(source='media_type')
    isFeatured = serializers.BooleanField(source='is_featured')
    uploadedAt = serializers.DateTimeField(source='uploaded_at', read_only=True)

    class Meta:
        model = EventMedia
        fields = ['id', 'mediaType', 'file', 'isFeatured', 'uploadedAt']
        read_only_fields = ['id', 'uploadedAt']


class EventListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for event lists - optimized for caching"""
    heroImageUrl = serializers.SerializerMethodField()
    shortDescription = serializers.CharField(source='short_description')
    isFinished = serializers.BooleanField(source='is_finished')
    organizer = serializers.SerializerMethodField()
    organizerProfilePicture = serializers.SerializerMethodField()
    mediaCount = serializers.IntegerField(source='media.count', read_only=True)
    
    def get_heroImageUrl(self, obj):
        """Return relative URL for hero image (for frontend proxy)"""
        if obj.hero_image:
            return obj.hero_image.url
        return None
    
    def get_organizerProfilePicture(self, obj):
        """Return organizer's profile picture URL if exists"""
        if obj.organizer and obj.organizer.profile_picture:
            return obj.organizer.profile_picture.url
        return None

    class Meta:
        model = Event
        fields = [
            'id',
            'organizer',
            'organizerProfilePicture',
            'title',
            'description',
            'shortDescription',
            'location',
            'heroImageUrl',
            'date',
            'time',
            'isFinished',
            'mediaCount',
        ]

    def get_organizer(self, obj):
        """Return organizer id in an object"""
        return {'id': obj.organizer.id}


class EventDetailSerializer(serializers.ModelSerializer):
    """Full serializer for event detail view - includes all related data"""
    heroImageUrl = serializers.SerializerMethodField()
    shortDescription = serializers.CharField(source='short_description')
    isFinished = serializers.BooleanField(source='is_finished')
    accessCode = serializers.CharField(source='access_code', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    organizer = serializers.SerializerMethodField()
    organizerProfilePicture = serializers.SerializerMethodField()
    media = EventMediaSerializer(many=True, read_only=True)
    teamMembers = TeamMemberSerializer(source='team_members', many=True, read_only=True)
    
    def get_heroImageUrl(self, obj):
        """Return relative URL for hero image (for frontend proxy)"""
        if obj.hero_image:
            return obj.hero_image.url
        return None
    
    def get_organizerProfilePicture(self, obj):
        """Return organizer's profile picture URL if exists"""
        if obj.organizer and obj.organizer.profile_picture:
            return obj.organizer.profile_picture.url
        return None

    class Meta:
        model = Event
        fields = [
            'id',
            'organizer',
            'organizerProfilePicture',
            'title',
            'description',
            'shortDescription',
            'location',
            'heroImageUrl',
            'date',
            'time',
            'isFinished',
            'accessCode',
            'teamMembers',
            'media',
            'createdAt',
            'updatedAt',
        ]

    def get_organizer(self, obj):
        """Return organizer id in an object"""
        return {'id': obj.organizer.id}


class EventCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating events"""
    heroImage = serializers.ImageField(source='hero_image', required=False, allow_null=True)
    shortDescription = serializers.CharField(source='short_description', required=False)
    isFinished = serializers.BooleanField(source='is_finished', default=False)

    class Meta:
        model = Event
        fields = [
            'title',
            'description',
            'shortDescription',
            'location',
            'heroImage',
            'date',
            'time',
            'isFinished',
        ]

    def validate_date(self, value):
        """Ensure date is not in the past for new events"""
        from datetime import date

        # Only validate for creation, not updates
        if not self.instance and value < date.today():
            raise serializers.ValidationError("Event date cannot be in the past")
        return value

    def create(self, validated_data):
        """Create event with organizer from request context"""
        validated_data['organizer'] = self.context['request'].user
        validated_data['access_code'] = generate_access_code()
        return super().create(validated_data)


class EventMediaUploadSerializer(serializers.ModelSerializer):
    """Serializer for uploading media to an event"""
    mediaType = serializers.CharField(source='media_type')
    isFeatured = serializers.BooleanField(source='is_featured', default=False)

    class Meta:
        model = EventMedia
        fields = ['mediaType', 'file', 'isFeatured']

    def validate_file(self, value):
        """Validate file size (max 50MB)"""
        max_size = 50 * 1024 * 1024  # 50MB
        if value.size > max_size:
            raise serializers.ValidationError("File size cannot exceed 50MB")
        return value

    def create(self, validated_data):
        """Attach media to event from context"""
        validated_data['event'] = self.context['event']
        return super().create(validated_data)


# ==============================================================================
# Wave Serializers
# ==============================================================================

class WaveSerializer(serializers.ModelSerializer):
    """Serializer for pricing waves within a tier"""
    ticketCount = serializers.IntegerField(source='ticket_count')

    class Meta:
        model = Wave
        fields = ['id', 'name', 'ticketCount', 'price']
        read_only_fields = ['id']


class WaveCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating waves"""
    ticketCount = serializers.IntegerField(source='ticket_count')

    class Meta:
        model = Wave
        fields = ['name', 'ticketCount', 'price']

    def create(self, validated_data):
        """Attach wave to tier from context"""
        validated_data['tier'] = self.context['tier']
        return super().create(validated_data)


# ==============================================================================
# Privilege Serializers
# ==============================================================================

class PrivilegeSerializer(serializers.ModelSerializer):
    """Serializer for tier privileges"""

    class Meta:
        model = Privilege
        fields = ['id', 'title', 'description']
        read_only_fields = ['id']


class PrivilegeCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating privileges"""

    class Meta:
        model = Privilege
        fields = ['title', 'description']

    def create(self, validated_data):
        """Attach privilege to tier from context"""
        validated_data['tier'] = self.context['tier']
        return super().create(validated_data)


# ==============================================================================
# AddOn Serializers
# ==============================================================================

class AddOnSerializer(serializers.ModelSerializer):
    """Serializer for tier add-ons"""
    isUnlimited = serializers.BooleanField(source='is_unlimited')

    class Meta:
        model = AddOn
        fields = ['id', 'name', 'description', 'price', 'isUnlimited', 'quantity']
        read_only_fields = ['id']


class AddOnCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating add-ons"""
    isUnlimited = serializers.BooleanField(source='is_unlimited', default=False)

    class Meta:
        model = AddOn
        fields = ['name', 'description', 'price', 'isUnlimited', 'quantity']

    def validate(self, data):
        """Validate that unlimited add-ons have quantity set to 0"""
        is_unlimited = data.get('is_unlimited', False)
        quantity = data.get('quantity', 0)

        if is_unlimited and quantity != 0:
            raise serializers.ValidationError({
                'quantity': 'Unlimited add-ons should have quantity set to 0'
            })

        return data

    def create(self, validated_data):
        """Attach add-on to tier from context"""
        validated_data['tier'] = self.context['tier']
        return super().create(validated_data)


# ==============================================================================
# Table Serializers
# ==============================================================================

class TableSerializer(serializers.ModelSerializer):
    """Serializer for tier tables"""
    tableName = serializers.CharField(source='table_name')
    quantityAvailable = serializers.IntegerField(source='quantity_available')
    numberOfSeats = serializers.IntegerField(source='number_of_seats')
    minSpend = serializers.DecimalField(source='min_spend', max_digits=10, decimal_places=2)
    isReserved = serializers.BooleanField(source='is_reserved')
    reservedBy = serializers.SerializerMethodField()
    reservedAt = serializers.DateTimeField(source='reserved_at', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)

    class Meta:
        model = Table
        fields = [
            'id', 'tableName', 'quantityAvailable', 'numberOfSeats',
            'minSpend', 'isReserved', 'reservedBy', 'reservedAt',
            'createdAt', 'updatedAt'
        ]
        read_only_fields = ['id', 'isReserved', 'reservedBy', 'reservedAt', 'createdAt', 'updatedAt']

    def get_reservedBy(self, obj):
        """Return reserved_by user id if exists"""
        if obj.reserved_by:
            return {'id': obj.reserved_by.id}
        return None


class TableCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating tables"""
    tableName = serializers.CharField(source='table_name')
    tableCount = serializers.IntegerField(source='table_count')
    numberOfSeats = serializers.IntegerField(source='number_of_seats')
    minSpend = serializers.DecimalField(source='min_spend', max_digits=10, decimal_places=2, default=0)

    class Meta:
        model = Table
        fields = ['tableName', 'tableCount', 'numberOfSeats', 'minSpend']

    def create(self, validated_data):
        """Attach table to tier from context"""
        validated_data['tier'] = self.context['tier']
        return super().create(validated_data)


# ==============================================================================
# Tier Serializers
# ==============================================================================

class TierListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for tier lists"""
    hasSpecialRequests = serializers.BooleanField(source='has_special_requests')
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)

    class Meta:
        model = Tier
        fields = ['id', 'name', 'icon', 'gradient', 'hasSpecialRequests', 'createdAt', 'updatedAt']
        read_only_fields = ['id', 'createdAt', 'updatedAt']


class TierDetailSerializer(serializers.ModelSerializer):
    """Full serializer for tier detail view - includes all nested data"""
    hasSpecialRequests = serializers.BooleanField(source='has_special_requests')
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    waves = WaveSerializer(source='price_waves', many=True, read_only=True)
    privileges = PrivilegeSerializer(many=True, read_only=True)
    addOns = AddOnSerializer(source='add_ons', many=True, read_only=True)
    tables = TableSerializer(many=True, read_only=True)

    class Meta:
        model = Tier
        fields = [
            'id', 'name', 'icon', 'gradient', 'hasSpecialRequests',
            'waves', 'privileges', 'addOns', 'tables',
            'createdAt', 'updatedAt'
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']


class TierCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating tiers"""
    hasSpecialRequests = serializers.BooleanField(source='has_special_requests', default=False)

    class Meta:
        model = Tier
        fields = ['name', 'icon', 'gradient', 'hasSpecialRequests']

    def create(self, validated_data):
        """Attach tier to event from context"""
        validated_data['event'] = self.context['event']
        return super().create(validated_data)


# ==============================================================================
# Post Serializers
# ==============================================================================

class PostSerializer(serializers.ModelSerializer):
    """Serializer for reading posts"""
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    imageUrl = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'title', 'text', 'imageUrl', 'createdAt', 'updatedAt']
        read_only_fields = ['id', 'createdAt', 'updatedAt']

    def get_imageUrl(self, obj):
        """Return relative URL for image (for frontend proxy)"""
        if obj.image:
            return obj.image.url
        return None


class PostCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating posts"""

    class Meta:
        model = Post
        fields = ['title', 'text', 'image']

    def validate_title(self, value):
        """Ensure title is not empty"""
        if not value or not value.strip():
            raise serializers.ValidationError("Title cannot be empty")
        return value.strip()

    def validate_image(self, value):
        """Validate image file if provided"""
        if value:
            # Validate file size (max 10MB)
            max_size = 10 * 1024 * 1024  # 10MB
            if value.size > max_size:
                raise serializers.ValidationError(
                    f"Image file too large. Maximum size is 10MB. Got {value.size / 1024 / 1024:.2f}MB"
                )

            # Validate image format
            valid_formats = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
            if value.content_type not in valid_formats:
                raise serializers.ValidationError(
                    f"Invalid image format. Supported formats: JPEG, PNG, WebP. Got {value.content_type}"
                )

        return value

    def create(self, validated_data):
        """Attach post to event from context"""
        validated_data['event'] = self.context['event']
        return super().create(validated_data)



class JSONStringField(serializers.Field):
    """
    Custom field that accepts a JSON string from FormData and deserializes it to Python objects.
    Used for handling nested data structures sent via multipart/form-data.
    """
    def to_internal_value(self, data):
        import json
        if isinstance(data, str):
            try:
                return json.loads(data)
            except (json.JSONDecodeError, ValueError) as e:
                raise serializers.ValidationError(f'Invalid JSON format: {str(e)}')
        # If already parsed (e.g., in tests), return as-is
        return data
    
    def to_representation(self, value):
        return value


class BulkEventCreateSerializer(serializers.Serializer):
    """
    Comprehensive serializer for creating an event with all related data in one request.
    Handles event, tiers, waves, privileges, add-ons, tables, and media.
    Atomic operation with S3 upload support.
    """
    # Event basic data
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(allow_blank=True, required=False)
    shortDescription = serializers.CharField(
        source='short_description',
        max_length=255,
        allow_blank=True,
        required=False
    )
    location = serializers.CharField(max_length=255)
    date = serializers.DateField()
    time = serializers.TimeField()
    
    # Hero image as actual file upload
    heroImage = serializers.ImageField(
        source='hero_image',
        required=False,
        allow_null=True,
        help_text="Hero banner image file (JPEG, PNG, WebP). Uploaded to S3 in production."
    )
    
    # Nested data as JSON strings (from FormData)
    tiers = JSONStringField(required=False, default=list)
    media = JSONStringField(required=False, default=list)

    def validate_date(self, value):
        """Ensure date is not in the past"""
        from datetime import date
        if value < date.today():
            raise serializers.ValidationError("Event date cannot be in the past")
        return value

    def validate_heroImage(self, value):
        """Validate hero image file"""
        if value:
            # Validate file size (max 10MB)
            max_size = 10 * 1024 * 1024  # 10MB
            if value.size > max_size:
                raise serializers.ValidationError(
                    f"Image file too large. Maximum size is 10MB. Got {value.size / 1024 / 1024:.2f}MB"
                )
            
            # Validate image format
            valid_formats = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
            if value.content_type not in valid_formats:
                raise serializers.ValidationError(
                    f"Invalid image format. Supported formats: JPEG, PNG, WebP. Got {value.content_type}"
                )
        
        return value

    def validate_tiers(self, value):
        """Validate tier structure"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Tiers must be a list")
            
        for idx, tier_data in enumerate(value):
            if not isinstance(tier_data, dict):
                raise serializers.ValidationError(f"Tier {idx} must be a dictionary")
            if 'name' not in tier_data:
                raise serializers.ValidationError("Each tier must have a name")
        return value

    def create(self, validated_data):
        """
        Create event with all related data atomically.
        Uses database transaction to ensure all-or-nothing creation.
        """
        from django.db import transaction

        tiers_data = validated_data.pop('tiers', [])
        media_data = validated_data.pop('media', [])

        # Get organizer from request context
        organizer = self.context['request'].user

        with transaction.atomic():
            # Generate unique access code
            access_code = generate_access_code()
            
            # 1. Create the event
            event = Event.objects.create(
                organizer=organizer,
                access_code=access_code,
                **validated_data
            )
            
            logger.info(f"Event created - ID: {event.id}, access_code: {access_code}, hero_image: {event.hero_image}")


            # 2. Create tiers and their nested data
            for tier_data in tiers_data:
                # Make a copy to avoid mutating the original data
                tier_data = dict(tier_data)
                # Extract nested data from tier
                waves_data = tier_data.pop('waves', [])
                privileges_data = tier_data.pop('privileges', [])
                addons_data = tier_data.pop('addOns', [])
                tables_data = tier_data.pop('tables', [])

                # Map frontend field names to backend
                tier_create_data = {
                    'event': event,
                    'name': tier_data.get('name'),
                    'icon': tier_data.get('icon', 'ticket'),
                    'gradient': tier_data.get('gradientId', 'emerald'),
                    'has_special_requests': tier_data.get('specialRequests', False)
                }

                tier = Tier.objects.create(**tier_create_data)

                # 3. Create waves for this tier
                created_waves = []
                for wave_data in waves_data:
                    wave = Wave.objects.create(
                        tier=tier,
                        name=wave_data.get('name', ''),
                        ticket_count=wave_data.get('ticketCount', 0),
                        price=wave_data.get('price', 0)
                    )
                    created_waves.append(wave)

                # 3.5 Pre-generate tickets for each wave
                from .utils import generate_unique_ticket_code, generate_qr_code_image
                
                for wave in created_waves:
                    for _ in range(wave.ticket_count):
                        ticket_code = generate_unique_ticket_code()
                        qr_image = generate_qr_code_image(ticket_code)
                        
                        Ticket.objects.create(
                            order_item=None,
                            user=None,
                            event=event,
                            tier=tier,
                            wave=wave,
                            table=None,
                            ticket_code=ticket_code,
                            qr_code_image=qr_image,
                            is_claimed=False,
                            status=TicketStatus.VALID
                        )
                    
                    logger.info(f"Pre-generated {wave.ticket_count} tickets for wave {wave.id} ({wave.name})")

                # 4. Create privileges for this tier
                for privilege_data in privileges_data:
                    Privilege.objects.create(
                        tier=tier,
                        title=privilege_data.get('name', ''),
                        description=privilege_data.get('description', '')
                    )

                # 5. Create add-ons for this tier
                for addon_data in addons_data:
                    availability = addon_data.get('availability')
                    is_unlimited = availability == 'Unlimited' or availability == 'unlimited'
                    quantity = 0 if is_unlimited else (availability if isinstance(availability, int) else 0)

                    AddOn.objects.create(
                        tier=tier,
                        name=addon_data.get('name', ''),
                        description=addon_data.get('description', ''),
                        price=addon_data.get('price', 0),
                        is_unlimited=is_unlimited,
                        quantity=quantity
                    )

                # 6. Create tables for this tier
                for table_data in tables_data:
                    Table.objects.create(
                        tier=tier,
                        table_name=table_data.get('name', ''),
                        quantity_available=table_data.get('count', 0),
                        number_of_seats=table_data.get('seats', 0),
                        min_spend=table_data.get('minimumSpend', 0)
                    )

            # 7. Handle media - just store URLs for now
            # Note: Actual file upload should be handled separately via the upload_media endpoint
            for media_item in media_data:
                if media_item.get('url'):
                    EventMedia.objects.create(
                        event=event,
                        media_type=media_item.get('type', 'image'),
                        file=media_item.get('url'),  # This assumes URL storage
                        is_featured=media_item.get('isFeatured', False)
                    )

            return event


# ==============================================================================
# Team Management Serializers
# ==============================================================================

class JoinTeamSerializer(serializers.Serializer):
    """Serializer for joining an event team with access code"""
    accessCode = serializers.CharField(
        source='access_code',
        max_length=8,
        help_text="8-character access code for the event"
    )

    def validate_accessCode(self, value):
        """Validate that the access code exists"""
        try:
            event = Event.objects.get(access_code=value)
            self.context['event'] = event
            return value
        except Event.DoesNotExist:
            raise serializers.ValidationError("Invalid access code")

    def save(self):
        """Add the user to the event's team"""
        user = self.context['request'].user
        event = self.context['event']
        
        # Check if user is already a team member
        if event.team_members.filter(id=user.id).exists():
            raise serializers.ValidationError("You are already a member of this team")
        
        # Check if user is the organizer
        if event.organizer == user:
            raise serializers.ValidationError("You are the organizer of this event")
        
        # Add user to team members
        event.team_members.add(user)
        
        # Update user role to team if not already
        if user.role != 'team':
            user.role = 'team'
            user.save(update_fields=['role'])
        
        return event

### TICKET VIEWS
class TicketAddOnSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="add_on.id", read_only=True)
    title = serializers.CharField(source="add_on.name", read_only=True)
    description = serializers.CharField(
        source="add_on.description", allow_null=True, read_only=True
    )
    # use the snapshot price stored on TicketAddOn
    price = serializers.DecimalField(
        source="unit_price", max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model = TicketAddOn
        fields = ["id", "title", "description", "price"]

class TicketListSerializer(serializers.ModelSerializer):
    # Expose camelCase for frontend
    ticketCode = serializers.CharField(source="ticket_code", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    # Event fields
    eventTitle = serializers.CharField(source="event.title", read_only=True)
    eventShortDescription = serializers.CharField(
        source="event.short_description", read_only=True, allow_null=True
    )
    eventLocation = serializers.CharField(source="event.location", read_only=True)
    eventDate = serializers.DateField(source="event.date", read_only=True)
    eventTime = serializers.TimeField(source="event.time", read_only=True)
    heroImageUrl = serializers.SerializerMethodField()

    # Organizer fields
    organizerName = serializers.CharField(
        source="event.organizer.name", read_only=True
    )
    organizerProfilePicture = serializers.SerializerMethodField()

    # Tier fields
    tierName = serializers.CharField(source="tier.name", read_only=True)
    perks = serializers.SerializerMethodField()

    # Add-ons (only "available" for now, per Tier)
    availableAddOns = serializers.SerializerMethodField()
    purchasedAddOns = serializers.SerializerMethodField()

    ownerEmail = serializers.EmailField(source="user.email", read_only=True, allow_null=True)
    
    # QR code
    qrCodeUrl = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = [
            "id",
            "ticketCode",
            "status",
            "createdAt",

            #user
            "ownerEmail",

            # event
            "event",
            "eventTitle",
            "eventShortDescription",
            "eventLocation",
            "eventDate",
            "eventTime",
            "heroImageUrl",

            # organizer
            "organizerName",
            "organizerProfilePicture",

            # tier
            "tier",
            "tierName",
            "perks",

            # add-ons
            "availableAddOns",
            "purchasedAddOns",
            "qrCodeUrl",
        ]

    def get_purchasedAddOns(self, obj: Ticket):
        # use prefetch_related('ticket_add_ons__add_on') in the view for perf if needed
        add_ons = obj.ticket_add_ons.select_related("add_on").all()
        return TicketAddOnSerializer(add_ons, many=True).data

    def get_heroImageUrl(self, obj):
        hero = getattr(obj.event, "hero_image", None)
        return hero.url if hero else ""

    def get_organizerProfilePicture(self, obj):
        organizer = obj.event.organizer
        pic = getattr(organizer, "profile_picture", None)
        return pic.url if pic else ""

    def get_perks(self, obj):
        # Tier → Privileges
        privileges = obj.tier.privileges.all()
        return [
            {
                "id": p.id,
                "title": p.title,
                "description": p.description,
            }
            for p in privileges
        ]

    def get_availableAddOns(self, obj):
        # Tier → AddOns
        addons = obj.tier.add_ons.all()
        return [
            {
                "id": a.id,
                "title": a.name,
                "description": a.description,
                "price": a.price,
            }
            for a in addons
        ]
    
    def get_qrCodeUrl(self, obj):
        """Return QR code image URL"""
        if obj.qr_code_image:
            return obj.qr_code_image.url
        return None



class TicketDetailSerializer(TicketListSerializer):
    wave_name = serializers.SerializerMethodField()
    table_name = serializers.SerializerMethodField()

    class Meta(TicketListSerializer.Meta):
        fields = TicketListSerializer.Meta.fields + [
            "wave",
            "wave_name",
            "table",
            "table_name",
            "checked_in_at",
        ]

    def get_wave_name(self, obj):
        return getattr(obj.wave, "name", None)

    def get_table_name(self, obj):
        return getattr(obj.table, "table_name", None)



# ================================================
# BUY TICKETS (Order creation input)
# ================================================

class BuyAddOnSerializer(serializers.Serializer):
    add_on_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class BuyItemSerializer(serializers.Serializer):
    tier_id = serializers.IntegerField()
    wave_id = serializers.IntegerField(required=False, allow_null=True)
    table_id = serializers.IntegerField(required=False, allow_null=True)
    quantity = serializers.IntegerField(min_value=1)
    add_ons = BuyAddOnSerializer(many=True, required=False)


class BuyTicketsSerializer(serializers.Serializer):
    """
    Payload the frontend sends when a guest buys tickets.

    Example:
    {
      "event_id": 1,
      "items": [
        {
          "tier_id": 10,
          "wave_id": 3,
          "quantity": 2,
          "add_ons": [
            {"add_on_id": 5, "quantity": 1}
          ]
        },
        {
          "tier_id": 11,
          "quantity": 1,
          "table_id": 2
        }
      ]
    }
    """
    event_id = serializers.IntegerField()
    items = BuyItemSerializer(many=True)

    def validate(self, data):
        event = get_object_or_404(Event, pk=data["event_id"])
        data["event"] = event

        # Attach real model instances for tiers/waves/tables/addons
        for item in data["items"]:
            tier = get_object_or_404(Tier, pk=item["tier_id"])
            if tier.event_id != event.id:
                raise serializers.ValidationError("Tier does not belong to this event.")
            item["tier"] = tier

            wave_id = item.get("wave_id")
            if wave_id is not None:
                wave = get_object_or_404(Wave, pk=wave_id)
                if wave.tier_id != tier.id:
                    raise serializers.ValidationError("Wave does not belong to this tier.")
                item["wave"] = wave
            else:
                item["wave"] = None

            table_id = item.get("table_id")
            if table_id is not None:
                table = get_object_or_404(Table, pk=table_id)
                if table.tier_id != tier.id:
                    raise serializers.ValidationError("Table does not belong to this tier.")
                item["table"] = table
            else:
                item["table"] = None

            for addon in item.get("add_ons", []):
                add_on = get_object_or_404(AddOn, pk=addon["add_on_id"])
                if add_on.tier_id != tier.id:
                    raise serializers.ValidationError("Add-on does not belong to this tier.")
                addon["add_on"] = add_on

        return data

    @transaction.atomic
    def create(self, validated_data):
        """
        Create Order, OrderItems, Add-ons and Tickets in one go.

        For now, we mark the order as PAID (no PSP integration).
        """
        request = self.context["request"]
        user = request.user
        event = validated_data["event"]
        items_data = validated_data["items"]

        order = Order.objects.create(
            user=user,
            event=event,
            status=OrderStatus.PAID,  # or PENDING if you integrate payments
            currency="EUR",
        )

        subtotal = Decimal("0.00")

        for item_data in items_data:
            tier = item_data["tier"]
            wave = item_data["wave"]
            table = item_data["table"]
            quantity = item_data["quantity"]

            # base price from wave (or 0 fallback)
            unit_price = wave.price if wave is not None else Decimal("0.00")
            total_price = unit_price * quantity
            subtotal += total_price

            order_item = OrderItem.objects.create(
                order=order,
                tier=tier,
                wave=wave,
                table=table,
                quantity=quantity,
                unit_price=unit_price,
                total_price=total_price,
            )

            # Add-ons at order_item level
            for addon_data in item_data.get("add_ons", []):
                add_on = addon_data["add_on"]
                addon_qty = addon_data["quantity"]

                addon_unit_price = add_on.price
                addon_total_price = addon_unit_price * addon_qty
                subtotal += addon_total_price

                OrderItemAddOn.objects.create(
                    order_item=order_item,
                    add_on=add_on,
                    quantity=addon_qty,
                    unit_price=addon_unit_price,
                    total_price=addon_total_price,
                )

            # Claim pre-generated tickets
            available_tickets = Ticket.objects.filter(
                event=event,
                tier=tier,
                wave=wave,
                is_claimed=False,
                order_item__isnull=True,
                user__isnull=True,
                status=TicketStatus.VALID
            ).order_by('created_at')[:quantity]

            if available_tickets.count() < quantity:
                raise serializers.ValidationError(
                    f"Only {available_tickets.count()} tickets available for this wave. "
                    f"Requested {quantity}."
                )

            # Claim the tickets by updating them
            ticket_ids = list(available_tickets.values_list('id', flat=True))
            Ticket.objects.filter(id__in=ticket_ids).update(
                order_item=order_item,
                user=user,
                is_claimed=True
            )
            
            logger.info(f"Claimed {quantity} tickets for order_item {order_item.id}")

        # simple fee example: 0 for now
        order.subtotal = subtotal
        order.fees = Decimal("0.00")
        order.total = subtotal
        order.save(update_fields=["subtotal", "fees", "total"])

        return order