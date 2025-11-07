"""
Custom permissions for Concierge app (Special Requests).
"""
from rest_framework import permissions


class IsGuestOrEventTeam(permissions.BasePermission):
    """
    Permission for special requests:
    - Guests can only access their own requests
    - Event organizers and team members can access requests for their events
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated"""
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user has permission to access this special request.
        obj is a SpecialRequest instance.
        """
        user = request.user
        
        # Guest who created the request can access it
        if obj.guest == user:
            return True
        
        # Event organizer can access all requests for their events
        if obj.event.organizer == user:
            return True
        
        # Team members affiliated with the event can access requests
        if user.role == 'team' and obj.event.team_members.filter(id=user.id).exists():
            return True
        
        return False


class CanCreateSpecialRequest(permissions.BasePermission):
    """
    Permission to check if a guest can create a special request.
    Only guests with the 'guest' role can create requests.
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated and has guest role"""
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'guest'
        )


class CanUpdateSpecialRequest(permissions.BasePermission):
    """
    Permission to check who can update a special request:
    - Guests can only update their own requests (limited fields)
    - Event organizers and team members can update status and assignment
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated"""
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user has permission to update this special request.
        obj is a SpecialRequest instance.
        """
        user = request.user
        
        # Guests can only update their own requests (description/title)
        if obj.guest == user:
            # Guests cannot change status or assignment
            if 'status' in request.data or 'assignedToId' in request.data:
                return False
            return True
        
        # Event organizer can update all fields
        if obj.event.organizer == user:
            return True
        
        # Team members affiliated with the event can update all fields
        if user.role == 'team' and obj.event.team_members.filter(id=user.id).exists():
            return True
        
        return False


class CanSendMessage(permissions.BasePermission):
    """
    Permission to check who can send messages in a special request:
    - The guest who created the request
    - The event organizer
    - Team members affiliated with the event
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated"""
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user has permission to send messages.
        For create action, obj is the SpecialRequest.
        For view action, obj is the SpecialRequestMessage.
        """
        user = request.user
        
        # Get the special request (obj could be SpecialRequest or SpecialRequestMessage)
        special_request = obj if hasattr(obj, 'guest') else obj.special_request
        
        # Guest who created the request can message
        if special_request.guest == user:
            return True
        
        # Event organizer can message
        if special_request.event.organizer == user:
            return True
        
        # Team members affiliated with the event can message
        if user.role == 'team' and special_request.event.team_members.filter(id=user.id).exists():
            return True
        
        return False
