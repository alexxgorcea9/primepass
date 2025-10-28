#!/usr/bin/env python
"""Test script for bulk_create endpoint debugging"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings.development')
django.setup()

from apps.events.serializers import BulkEventCreateSerializer
from apps.auth.models import User
from django.test import RequestFactory
from rest_framework.test import force_authenticate
import traceback

# Get user
user = User.objects.get(id=6)

# Test data
data = {
    'title': 'Test Event',
    'description': 'Test',
    'shortDescription': 'Test',
    'location': 'Test Location',
    'date': '2025-10-29',
    'time': '14:00:00',
    'heroImageUrl': 'https://example.com/image.jpg',
    'tiers': [{
        'name': 'VIP',
        'icon': 'ticket',
        'gradientId': 'emerald',
        'specialRequests': False,
        'waves': [{
            'name': 'Early Bird',
            'ticketCount': 100,
            'price': 50
        }],
        'privileges': [],
        'addOns': [],
        'tables': []
    }],
    'media': []
}

# Create request
factory = RequestFactory()
request = factory.post('/api/events/bulk_create/')
force_authenticate(request, user=user)

# Test serializer
serializer = BulkEventCreateSerializer(data=data, context={'request': request})
print('Validating...')
is_valid = serializer.is_valid()
print(f'Valid: {is_valid}')

if not is_valid:
    print(f'Errors: {serializer.errors}')
else:
    print('Creating event...')
    try:
        event = serializer.save()
        print(f'✓ Event created: ID={event.id}, Title={event.title}')
    except Exception as e:
        print(f'✗ Error: {str(e)}')
        traceback.print_exc()
