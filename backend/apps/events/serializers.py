import logging
from rest_framework import serializers

from .models import Tier, EventMedia, Event, Wave, Privilege, AddOn, Table

logger = logging.getLogger(__name__)


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
    mediaCount = serializers.IntegerField(source='media.count', read_only=True)
    
    def get_heroImageUrl(self, obj):
        """Return relative URL for hero image (for frontend proxy)"""
        if obj.hero_image:
            return obj.hero_image.url
        return None

    class Meta:
        model = Event
        fields = [
            'id',
            'organizer',
            'title',
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
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    organizer = serializers.SerializerMethodField()
    media = EventMediaSerializer(many=True, read_only=True)
    
    def get_heroImageUrl(self, obj):
        """Return relative URL for hero image (for frontend proxy)"""
        if obj.hero_image:
            return obj.hero_image.url
        return None

    class Meta:
        model = Event
        fields = [
            'id',
            'organizer',
            'title',
            'description',
            'shortDescription',
            'location',
            'heroImageUrl',
            'date',
            'time',
            'isFinished',
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
            # 1. Create the event
            event = Event.objects.create(
                organizer=organizer,
                **validated_data
            )
            
            logger.info(f"Event created - ID: {event.id}, hero_image: {event.hero_image}")


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
                for wave_data in waves_data:
                    Wave.objects.create(
                        tier=tier,
                        name=wave_data.get('name', ''),
                        ticket_count=wave_data.get('ticketCount', 0),
                        price=wave_data.get('price', 0)
                    )

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