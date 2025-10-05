"""
Custom storage backends for PrimePass project.

This module provides custom storage classes for handling static and media files
with AWS S3. The custom classes allow for different storage locations within
the same S3 bucket.
"""

from django.conf import settings
from storages.backends.s3boto3 import S3Boto3Storage


class StaticStorage(S3Boto3Storage):
    """
    Custom storage for static files in S3.
    Stores files in the 'static/' prefix within the bucket.
    """
    location = 'static'
    default_acl = 'public-read'
    file_overwrite = True


class MediaStorage(S3Boto3Storage):
    """
    Custom storage for media files (user uploads) in S3.
    Stores files in the 'media/' prefix within the bucket.
    """
    location = 'media'
    default_acl = 'private'  # Profile pictures should be private by default
    file_overwrite = False
    custom_domain = False  # Use pre-signed URLs for private files
