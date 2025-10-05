# conversie din model data in JSON
from rest_framework import serializers
from .models import Event, EventImage, Order, Wave, User, Organizer, Tier, AddOn, Ticket, Table


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'password', 'role', 'profile_picture']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        # Create a new user with the given validated data
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)  # Set the password properly
        user.save()
        return user


class OrganizerSerializer(serializers.ModelSerializer):
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = Organizer
        fields = ['id', 'organization_name', 'phone', 'bio', 'created_at', 'profile_picture']

    def get_profile_picture(self, obj):
        return obj.user.profile_picture


from rest_framework import serializers
from .models import Event


class EventSerializer(serializers.ModelSerializer):
    heroImageUrl = serializers.URLField(source='hero_image_url')
    shortDescription = serializers.CharField(source='short_description')
    isFinished = serializers.BooleanField(source='is_finished')
    organizer = serializers.SerializerMethodField()

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
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_organizer(self, obj):
        # Return the organizer's id inside an object
        return {'id': obj.organizer.id}


class EventImageSerializer(serializers.ModelSerializer):
    imageUrl = serializers.URLField(source='image_url')


class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = '__all__'  # Serialize all fields


class PriceWaveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wave
        fields = ['ticket_count', 'price']


class TierSerializer(serializers.ModelSerializer):
    price = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    availableCount = serializers.SerializerMethodField()

    class Meta:
        model = Tier
        fields = ['id', 'name', 'event', 'price', 'description', 'availableCount', 'color']

    def get_price(self, instance):
        # Get price waves for this tier to calculate price
        price_waves = instance.price_waves.all().order_by('price')

        # Get the cheapest price if available, otherwise default to 49.99
        if price_waves.exists():
            return float(price_waves.first().price)
        return 49.99  # Default price if no waves exist

    def get_description(self, instance):
        # Generate a description based on tier name and event title
        return f"{instance.name} ticket for {instance.event.title}"

    def get_availableCount(self, instance):
        # Calculate available tickets from price waves
        price_waves = instance.price_waves.all()
        if price_waves.exists():
            return sum(wave.ticket_count for wave in price_waves)
        return 100  # Default available count if no waves exist


class TableSerializer(serializers.ModelSerializer):
    tableName = serializers.CharField(source='table_name', read_only=True)
    numberOfSeats = serializers.IntegerField(source='number_of_seats', read_only=True)
    minSpend = serializers.DecimalField(source='min_spend', max_digits=10, decimal_places=2, read_only=True)
    isReserved = serializers.BooleanField(source='is_reserved', read_only=True)
    reservedBy = serializers.CharField(source='reserved_by.username', read_only=True)
    reservedAt = serializers.DateTimeField(source='reserved_at', read_only=True)

    class Meta:
        model = Table
        fields = ['id', 'tableName', 'numberOfSeats', 'minSpend', 'isReserved', 'reservedBy', 'reservedAt']


class AddOnSerializer(serializers.ModelSerializer):
    class Meta:
        model = AddOn
        fields = ['id', 'tier', 'name', 'description', 'price']

    def validate(self, data):
        # Ensure tier exists
        if 'tier' not in data:
            raise serializers.ValidationError("Tier is required.")
        return data


class TicketSerializer(serializers.ModelSerializer):
    tier_name = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = ['id', 'order', 'tier', 'tier_name', 'unique_code', 'assigned_table', 'issued_at']

    def get_tier_name(self, obj):
        return obj.tier.name if obj.tier else ""
