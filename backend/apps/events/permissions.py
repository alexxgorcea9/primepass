"""
Custom permissions for Events app.
"""
from rest_framework import permissions


class IsOrganizerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow organizers of an event to edit it.
    Read permissions are allowed to any request.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request (GET, HEAD, OPTIONS)
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the organizer
        return obj.organizer == request.user


class IsEventOrganizerOrReadOnly(permissions.BasePermission):
    """
    Custom permission for EventMedia to check if user is the event organizer.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the event organizer
        return obj.event.organizer == request.user


class IsAuthenticatedOrReadOnly(permissions.BasePermission):
    """
    Custom permission to allow read access to anyone,
    but require authentication for write operations.
    """

    def has_permission(self, request, view):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions require authentication
        return request.user and request.user.is_authenticated


class IsEventOrganizer(permissions.BasePermission):
    """
    Permission to check if user is the organizer of the event.
    Used for tier-related models (Tier, Wave, Privilege, AddOn, Table).
    Allows read-only access to authenticated users, write access only to organizers.
    """

    def has_permission(self, request, view):
        """Allow authenticated users to read, but require organizer for write"""
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        """
        Allow read access to authenticated users.
        Check if user is the organizer for write operations.
        Works for models with 'event' or 'tier.event' relationship.
        """
        # Read permissions for all authenticated users
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions only for event organizer
        # For Tier model (has direct event relationship)
        if hasattr(obj, 'event'):
            return obj.event.organizer == request.user
        
        # For Wave, Privilege, AddOn, Table (have tier.event relationship)
        if hasattr(obj, 'tier') and hasattr(obj.tier, 'event'):
            return obj.tier.event.organizer == request.user
        
        return False