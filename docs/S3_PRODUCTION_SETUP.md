# AWS S3 Production Setup Guide

This guide explains how to configure AWS S3 for production-ready file storage with atomic event creation including hero image uploads.

## Overview

The PrimePass application uses **AWS S3** for storing media files (event hero images, profile pictures, etc.) in production. The implementation ensures:

- ✅ **Atomic Operations**: Event creation with image upload happens in a single database transaction
- ✅ **S3 Integration**: Images are uploaded to S3 automatically (or local storage in development)
- ✅ **Production Ready**: Proper error handling, file validation, and rollback on failure
- ✅ **Security**: Images are private by default with signed URLs for access

## Architecture

### File Upload Flow

```
Frontend (CreateEvent.tsx)
    ↓ (FormData with File)
Backend (BulkEventCreateSerializer)
    ↓ (Validation)
Django Model (Event.hero_image)
    ↓ (Storage Backend)
AWS S3 / Local Filesystem
    ↓ (URL Generation)
Response (with S3 URL)
```

### Atomic Transaction

The entire event creation process (including S3 upload) happens within a `transaction.atomic()` block:

1. File validation (size, format)
2. S3 upload (via Django storage backend)
3. Event record creation
4. Tier/Wave/Privilege/AddOn/Table creation

If **any step fails**, the entire transaction rolls back, including the S3 upload.

## AWS S3 Configuration

### Step 1: Create an S3 Bucket

1. Log in to [AWS Console](https://console.aws.amazon.com/)
2. Navigate to **S3**
3. Click **Create Bucket**
   - **Bucket name**: `primepass-media-production` (must be globally unique)
   - **Region**: Select closest to your users (e.g., `us-east-1`)
   - **Block all public access**: ✅ ENABLED (we use signed URLs for private access)
   - **Versioning**: Optional (recommended for backup)
   - **Encryption**: ✅ ENABLED (use SSE-S3)

### Step 2: Create IAM User with S3 Permissions

1. Navigate to **IAM** → **Users** → **Create User**
2. **User name**: `primepass-s3-uploader`
3. **Permissions**: Attach inline policy with these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::primepass-media-production",
        "arn:aws:s3:::primepass-media-production/*"
      ]
    }
  ]
}
```

4. **Create access keys** for this user
   - Save `AWS_ACCESS_KEY_ID`
   - Save `AWS_SECRET_ACCESS_KEY`

### Step 3: Configure CORS (Optional - for direct browser uploads)

Add CORS configuration to your S3 bucket:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://yourdomain.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### Step 4: Configure Lifecycle Rules (Optional - for cost optimization)

1. Navigate to your bucket → **Management** → **Lifecycle rules**
2. Create rule to transition old files to cheaper storage:
   - Move to **Intelligent-Tiering** after 30 days
   - Move to **Glacier** after 90 days
   - Delete after 1 year (if needed)

## Backend Configuration

### Environment Variables

Update your `.env` file in production:

```bash
# Enable S3 in production
USE_S3=True

# AWS Credentials
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# S3 Bucket Configuration
AWS_STORAGE_BUCKET_NAME=primepass-media-production
AWS_S3_REGION_NAME=us-east-1

# Optional: CloudFront CDN for faster delivery
# AWS_S3_CUSTOM_DOMAIN=d111111abcdef8.cloudfront.net
```

### Storage Backend

The application uses `django-storages` with the following configuration (already set up in `backend/backend/storages.py`):

```python
class MediaStorage(S3Boto3Storage):
    """Custom storage for media files (user uploads) in S3."""
    location = 'media'
    default_acl = 'private'  # Images are private by default
    file_overwrite = False   # Don't overwrite existing files
    custom_domain = False    # Use pre-signed URLs
```

### File Paths

Files are automatically organized in S3:

```
primepass-media-production/
├── media/
│   ├── event_heroes/
│   │   ├── event_1_hero_abc123.jpg
│   │   └── event_2_hero_def456.png
│   ├── event_media/
│   │   └── event_1_gallery_image1.jpg
│   └── profiles/
│       └── user_123_profile.jpg
└── static/  (CSS, JS - if using S3 for static files)
```

## Frontend Integration

### FormData Upload

The frontend sends multipart/form-data with the actual file:

```typescript
const formData = new FormData();
formData.append('title', eventData.title);
formData.append('location', eventData.location);
formData.append('date', eventData.date);
formData.append('time', eventData.time);

// Add hero image file
if (eventData.heroImage) {
  formData.append('heroImage', eventData.heroImage);  // File object
}

// Add nested data as JSON strings
formData.append('tiers', JSON.stringify(eventData.tiers));

// Send with proper headers
const response = await axios.post('/api/events/bulk_create/', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});
```

### File Validation

Frontend should validate files before upload:

```typescript
const validateFile = (file: File) => {
  // Max 10MB
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File too large. Maximum 10MB.');
  }
  
  // Valid formats
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid format. Use JPEG, PNG, or WebP.');
  }
};
```

## Security Best Practices

### 1. Private Files with Signed URLs

By default, all media files are private. Access is granted through pre-signed URLs that expire after 1 hour:

```python
# Automatically handled by Django storage backend
AWS_QUERYSTRING_AUTH = True
AWS_QUERYSTRING_EXPIRE = 3600  # 1 hour
```

### 2. IAM Permissions (Principle of Least Privilege)

The IAM user has **only** the permissions needed:
- `s3:PutObject` - Upload files
- `s3:GetObject` - Read files  
- `s3:DeleteObject` - Delete files
- `s3:ListBucket` - List bucket contents

### 3. Encryption at Rest

S3 Server-Side Encryption (SSE-S3) is enabled by default for all uploads.

### 4. HTTPS Only

All S3 URLs use HTTPS. Never expose `AWS_SECRET_ACCESS_KEY` in frontend code.

## CloudFront CDN (Optional)

For faster global delivery, you can add CloudFront in front of S3:

### Step 1: Create CloudFront Distribution

1. Navigate to **CloudFront** → **Create Distribution**
2. **Origin**: Select your S3 bucket
3. **Origin Access**: Use **Origin Access Control (OAC)**
4. **Viewer Protocol Policy**: **Redirect HTTP to HTTPS**
5. **Allowed HTTP Methods**: GET, HEAD, OPTIONS
6. **Cache Policy**: CachingOptimized
7. **Price Class**: Use all edge locations (or select based on your regions)

### Step 2: Update S3 Bucket Policy

CloudFront needs permission to read from S3:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::primepass-media-production/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::123456789012:distribution/EXAMPLEDISTRIBUTION"
        }
      }
    }
  ]
}
```

### Step 3: Update Environment Variables

```bash
# Add CloudFront domain
AWS_S3_CUSTOM_DOMAIN=d111111abcdef8.cloudfront.net
```

## Local Development

In development, files are stored locally (not in S3):

```bash
# .env for development
USE_S3=False
MEDIA_URL=/media/
```

Files are saved to `backend/media/` directory. The backend serves them automatically.

## Monitoring and Costs

### S3 Costs

Typical costs for a medium-sized event platform:

- **Storage**: ~$0.023/GB/month
- **PUT/POST Requests**: $0.005 per 1,000 requests
- **GET Requests**: $0.0004 per 1,000 requests
- **Data Transfer Out**: $0.09/GB (first 10TB)

**Example**: 10,000 events with 5MB average hero image = 50GB storage ≈ **$1.15/month**

### CloudFront Costs

- **Data Transfer Out**: $0.085/GB (cheaper than S3 direct)
- **Requests**: $0.0075 per 10,000 HTTPS requests

**Example**: 1 million page views with images ≈ **$10-20/month**

### Monitoring

Enable **S3 Storage Lens** for insights:
- Storage trends
- Cost optimization recommendations
- Access patterns

## Troubleshooting

### Issue: "Access Denied" Errors

**Cause**: IAM permissions not set correctly

**Solution**: 
1. Verify IAM user has correct permissions
2. Check bucket policy allows the IAM user
3. Ensure `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are correct in `.env`

### Issue: Files Not Uploading

**Cause**: Transaction rollback due to validation error

**Solution**:
1. Check backend logs for detailed error
2. Verify file size < 10MB
3. Verify file format (JPEG, PNG, WebP only)

### Issue: Slow Upload Times

**Cause**: Large file size or slow network

**Solution**:
1. Implement frontend compression before upload
2. Use CloudFront for faster delivery
3. Consider multiple upload regions

### Issue: Old Files Not Deleted

**Cause**: Django doesn't auto-delete S3 files when records are deleted

**Solution**: Install `django-cleanup`:

```bash
pip install django-cleanup
```

Add to `INSTALLED_APPS`:
```python
INSTALLED_APPS = [
    'django_cleanup.apps.CleanupConfig',  # Should be at the top
    ...
]
```

## Backup and Disaster Recovery

### Versioning

Enable S3 versioning to protect against accidental deletions:

1. Bucket → **Properties** → **Versioning** → **Enable**
2. Set lifecycle rule to delete old versions after 30 days

### Cross-Region Replication

For mission-critical data, enable cross-region replication:

1. Create destination bucket in different region
2. Enable versioning on both buckets
3. Configure replication rule

### Backup to Glacier

For long-term backups, use lifecycle policies to transition to Glacier:

```json
{
  "Rules": [
    {
      "Id": "Archive old files",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
```

## Testing

### Test S3 Upload Locally

You can test S3 uploads in development:

```bash
# .env.local for testing S3
USE_S3=True
AWS_ACCESS_KEY_ID=your_test_key
AWS_SECRET_ACCESS_KEY=your_test_secret
AWS_STORAGE_BUCKET_NAME=primepass-media-dev
AWS_S3_REGION_NAME=us-east-1
```

### Integration Tests

Test the full event creation flow:

```python
# tests/test_event_creation.py
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile

class EventCreationTest(TestCase):
    def test_create_event_with_hero_image(self):
        image = SimpleUploadedFile(
            "test_hero.jpg",
            b"file_content",
            content_type="image/jpeg"
        )
        
        response = self.client.post('/api/events/bulk_create/', {
            'title': 'Test Event',
            'location': 'Test Location',
            'date': '2025-12-31',
            'time': '20:00:00',
            'heroImage': image,
            'tiers': '[]',
        })
        
        self.assertEqual(response.status_code, 201)
        self.assertTrue(Event.objects.filter(title='Test Event').exists())
```

## Summary

You now have a production-ready implementation with:

✅ **Atomic event creation** - All-or-nothing database transactions  
✅ **S3 file upload** - Automatic upload to AWS S3 in production  
✅ **Local development** - Files stored locally for easy testing  
✅ **Security** - Private files with signed URLs  
✅ **Validation** - File size and format validation  
✅ **Error handling** - Proper rollback on failures  
✅ **Scalability** - CloudFront CDN ready  
✅ **Cost optimization** - Lifecycle policies for old files  

For questions or issues, refer to the [django-storages documentation](https://django-storages.readthedocs.io/).
