from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import SpecialRequest, SpecialRequestMessage, SpecialRequestStatus
from apps.events.models import Event, Tier

User = get_user_model()


# ==============================================================================
# USER SERIALIZERS
# ==============================================================================

class GuestSerializer(serializers.ModelSerializer):
    """Serializer for guest users in special requests"""
    profilePicture = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'profilePicture', 'role']
        read_only_fields = ['id', 'email', 'name', 'profilePicture', 'role']
    
    def get_profilePicture(self, obj):
        if obj.profile_picture:
            return obj.profile_picture.url
        return None


class TeamMemberSerializer(serializers.ModelSerializer):
    """Serializer for team members in special requests"""
    profilePicture = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'profilePicture', 'role']
        read_only_fields = ['id', 'email', 'name', 'profilePicture', 'role']
    
    def get_profilePicture(self, obj):
        if obj.profile_picture:
            return obj.profile_picture.url
        return None


# ==============================================================================
# SPECIAL REQUEST MESSAGE SERIALIZER
# ==============================================================================

class SpecialRequestMessageSerializer(serializers.ModelSerializer):
    """Serializer for messages in special request conversations"""
    sender = GuestSerializer(read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    
    class Meta:
        model = SpecialRequestMessage
        fields = ['id', 'sender', 'message', 'createdAt', 'updatedAt']
        read_only_fields = ['id', 'sender', 'createdAt', 'updatedAt']
    
    def create(self, validated_data):
        """Add sender from request context"""
        request = self.context.get('request')
        validated_data['sender'] = request.user
        return super().create(validated_data)


# ==============================================================================
# SPECIAL REQUEST SERIALIZERS
# ==============================================================================

class SpecialRequestListSerializer(serializers.ModelSerializer):
    """Serializer for listing special requests (summary view)"""
    guest = GuestSerializer(read_only=True)
    assignedTo = TeamMemberSerializer(source='assigned_to', read_only=True)
    eventTitle = serializers.CharField(source='event.title', read_only=True)
    tierName = serializers.CharField(source='tier.name', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    messageCount = serializers.SerializerMethodField()
    
    class Meta:
        model = SpecialRequest
        fields = [
            'id', 'guest', 'eventTitle', 'tierName', 'title', 
            'status', 'assignedTo', 'createdAt', 'updatedAt', 'messageCount'
        ]
        read_only_fields = [
            'id', 'guest', 'eventTitle', 'tierName', 
            'createdAt', 'updatedAt', 'messageCount'
        ]
    
    def get_messageCount(self, obj):
        """Return the number of messages in this request"""
        return obj.messages.count()


class SpecialRequestDetailSerializer(serializers.ModelSerializer):
    """Serializer for special request detail view with full conversation"""
    guest = GuestSerializer(read_only=True)
    assignedTo = TeamMemberSerializer(source='assigned_to', allow_null=True)
    eventId = serializers.PrimaryKeyRelatedField(source='event', read_only=True)
    eventTitle = serializers.CharField(source='event.title', read_only=True)
    tierId = serializers.PrimaryKeyRelatedField(source='tier', read_only=True)
    tierName = serializers.CharField(source='tier.name', read_only=True)
    messages = SpecialRequestMessageSerializer(many=True, read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    
    class Meta:
        model = SpecialRequest
        fields = [
            'id', 'guest', 'eventId', 'eventTitle', 'tierId', 'tierName',
            'title', 'description', 'status', 'assignedTo', 
            'messages', 'createdAt', 'updatedAt'
        ]
        read_only_fields = [
            'id', 'guest', 'eventId', 'eventTitle', 'tierId', 'tierName',
            'messages', 'createdAt', 'updatedAt'
        ]


class SpecialRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new special requests"""
    eventId = serializers.PrimaryKeyRelatedField(
        source='event',
        queryset=Event.objects.all(),
        write_only=True
    )
    tierId = serializers.PrimaryKeyRelatedField(
        source='tier',
        queryset=Tier.objects.all(),
        write_only=True
    )
    
    class Meta:
        model = SpecialRequest
        fields = ['eventId', 'tierId', 'title', 'description']
    
    def validate(self, data):
        """Validate tier allows special requests and belongs to the event"""
        tier = data.get('tier')
        event = data.get('event')
        
        if tier and not tier.has_special_requests:
            raise serializers.ValidationError({
                'tierId': 'This tier does not allow special requests.'
            })
        
        if tier and event and tier.event != event:
            raise serializers.ValidationError({
                'tierId': 'The selected tier does not belong to this event.'
            })
        
        return data
    
    def create(self, validated_data):
        """Add guest from request context"""
        request = self.context.get('request')
        validated_data['guest'] = request.user
        return super().create(validated_data)


class SpecialRequestUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating special request status and assignment"""
    assignedToId = serializers.PrimaryKeyRelatedField(
        source='assigned_to',
        queryset=User.objects.filter(role='team'),
        allow_null=True,
        required=False
    )
    
    class Meta:
        model = SpecialRequest
        fields = ['status', 'assignedToId']
    
    def validate_status(self, value):
        """Ensure valid status transition"""
        if value not in [choice[0] for choice in SpecialRequestStatus.choices]:
            raise serializers.ValidationError('Invalid status value.')
        return value
    
    def validate_assignedToId(self, value):
        """Validate assigned team member is affiliated with the event"""
        if value:
            instance = self.instance
            if instance and instance.event:
                event = instance.event
                # Check if team member is affiliated with the event
                if not event.team_members.filter(id=value.id).exists():
                    if event.organizer != value:
                        raise serializers.ValidationError(
                            'The assigned team member must be affiliated with this event.'
                        )
        return value
