from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from apps.events.models import Event, Tier

User = settings.AUTH_USER_MODEL


# ==============================================================================
# SPECIAL REQUEST MODEL
# ==============================================================================

class SpecialRequestStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    IN_PROGRESS = 'in_progress', 'In Progress'
    RESOLVED = 'resolved', 'Resolved'


class SpecialRequest(models.Model):
    """
    Represents a special request made by a guest for an event.
    
    Requirements:
    - Guest must have a role of 'guest'
    - Guest must have a ticket for the event with a tier that allows special requests
    - Can be assigned to a team member or left unassigned
    - Has conversation thread for communication between guest and event team
    """
    guest = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='special_requests',
        limit_choices_to={'role': 'guest'},
        help_text="Guest user who created the special request"
    )
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='special_requests',
        help_text="Event associated with this special request"
    )
    tier = models.ForeignKey(
        Tier,
        on_delete=models.CASCADE,
        related_name='special_requests',
        help_text="Ticket tier that allows special requests"
    )
    
    title = models.CharField(
        max_length=255,
        help_text="Brief title of the special request"
    )
    description = models.TextField(
        help_text="Detailed description of the special request"
    )
    
    status = models.CharField(
        max_length=20,
        choices=SpecialRequestStatus.choices,
        default=SpecialRequestStatus.PENDING,
        help_text="Current status of the special request"
    )
    
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_special_requests',
        limit_choices_to={'role': 'team'},
        help_text="Team member assigned to handle this request (optional)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['guest'], name='sr_guest_idx'),
            models.Index(fields=['event'], name='sr_event_idx'),
            models.Index(fields=['status'], name='sr_status_idx'),
            models.Index(fields=['assigned_to'], name='sr_assigned_to_idx'),
            models.Index(fields=['event', 'status'], name='sr_event_status_idx'),
        ]
    
    def clean(self):
        """Validate that the tier allows special requests and belongs to the event"""
        super().clean()
        
        # Check if tier allows special requests
        if self.tier and not self.tier.has_special_requests:
            raise ValidationError({
                'tier': 'This tier does not allow special requests.'
            })
        
        # Check if tier belongs to the event
        if self.tier and self.event and self.tier.event != self.event:
            raise ValidationError({
                'tier': 'The selected tier does not belong to this event.'
            })
        
        # Check if assigned_to is a team member affiliated with the event
        if self.assigned_to and self.event:
            if self.assigned_to.role != 'team':
                raise ValidationError({
                    'assigned_to': 'Only team members can be assigned to special requests.'
                })
            
            # Check if team member is affiliated with the event
            if not self.event.team_members.filter(id=self.assigned_to.id).exists():
                if self.event.organizer != self.assigned_to:
                    raise ValidationError({
                        'assigned_to': 'The assigned team member must be affiliated with this event.'
                    })
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.title} - {self.guest.email} ({self.event.title})"


# ==============================================================================
# SPECIAL REQUEST MESSAGE MODEL
# ==============================================================================

class SpecialRequestMessage(models.Model):
    """
    Represents a message in the conversation thread of a special request.
    
    Messages can be sent by:
    - The guest who created the request
    - The event organizer
    - Team members affiliated with the event
    """
    special_request = models.ForeignKey(
        SpecialRequest,
        on_delete=models.CASCADE,
        related_name='messages',
        help_text="Special request this message belongs to"
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='special_request_messages',
        help_text="User who sent this message"
    )
    message = models.TextField(
        help_text="Content of the message"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['special_request'], name='srm_request_idx'),
            models.Index(fields=['sender'], name='srm_sender_idx'),
            models.Index(fields=['special_request', 'created_at'], name='srm_request_created_idx'),
        ]
    
    def clean(self):
        """Validate that sender has permission to message in this request"""
        super().clean()
        
        if not self.special_request or not self.sender:
            return
        
        request = self.special_request
        event = request.event
        sender = self.sender
        
        # Guest who created the request can message
        if sender == request.guest:
            return
        
        # Event organizer can message
        if sender == event.organizer:
            return
        
        # Team members affiliated with the event can message
        if sender.role == 'team' and event.team_members.filter(id=sender.id).exists():
            return
        
        raise ValidationError({
            'sender': 'You do not have permission to send messages in this special request.'
        })
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Message from {self.sender.email} on {self.special_request.title}"