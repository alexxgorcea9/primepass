# Media Storage Configuration Guide

This guide explains how to configure PrimePass to use local filesystem storage (development) or AWS S3 (production) for media files like profile pictures.

## Table of Contents
- [Overview](#overview)
- [Local Development Setup](#local-development-setup)
- [AWS S3 Production Setup](#aws-s3-production-setup)
- [User Model Configuration](#user-model-configuration)
- [Testing the Configuration](#testing-the-configuration)
- [Troubleshooting](#troubleshooting)

---

## Overview

PrimePass uses a **dual storage strategy**:
- **Development**: Local filesystem storage (`media/` directory)
- **Production**: AWS S3 cloud storage with signed URLs for security

The system automatically switches between storage backends based on the `USE_S3` environment variable.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Django Application                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │   User Model     │         │  ImageField      │          │
│  │  profile_picture │────────▶│ upload_to='      │          │
│  │                  │         │   profiles/'     │          │
│  └──────────────────┘         └────────┬─────────┘          │
│                                         │                    │
│                                         ▼                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         DEFAULT_FILE_STORAGE Setting                 │   │
│  │  (Automatically set based on USE_S3 env variable)   │   │
│  └────────────┬───────────────────────────┬─────────────┘   │
│               │                           │                 │
└───────────────┼───────────────────────────┼─────────────────┘
                │                           │
       ┌────────▼─────────┐        ┌───────▼────────┐
       │ Local FileSystem │        │   AWS S3       │
       │   (Development)  │        │  (Production)  │
       │                  │        │                │
       │ media/profiles/  │        │ s3://bucket/   │
       │   user123.jpg    │        │ media/profiles/│
       └──────────────────┘        └────────────────┘
```

---

## Local Development Setup

### Prerequisites
- Python 3.10+
- Django 4.2+
- Pillow (already in requirements.txt)

### Configuration Steps

1. **Copy environment template**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Set local storage mode in `.env`**
   ```bash
   USE_S3=False
   MEDIA_URL=/media/
   DEBUG=True
   ```

3. **Ensure media directory exists**
   The `development.py` settings automatically create the media directory, but you can also do it manually:
   ```bash
   mkdir -p media/profiles
   ```

4. **Run migrations**
   ```bash
   python manage.py migrate
   ```

5. **Start development server**
   ```bash
   python manage.py runserver
   ```

### Accessing Media Files

In development, media files are served at `http://localhost:8000/media/`

Example: Profile picture at `http://localhost:8000/media/profiles/user_profile_abc123.jpg`

---

## AWS S3 Production Setup

### Prerequisites
- AWS Account
- IAM User with S3 permissions
- S3 Bucket created

### Step 1: Create IAM User

1. Go to AWS IAM Console → Users → Create User
2. User name: `primepass-media-user`
3. Attach policy with these permissions:

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
                "arn:aws:s3:::your-bucket-name/*",
                "arn:aws:s3:::your-bucket-name"
            ]
        }
    ]
}
```

4. Create access keys and save them securely

### Step 2: Create S3 Bucket

1. Go to S3 Console → Create Bucket
2. Bucket name: `primepass-media-production`
3. Region: Choose closest to your users (e.g., `us-east-1`)
4. **Block Public Access**: Keep enabled (we use signed URLs)
5. **Versioning**: Optional but recommended
6. **Encryption**: Enable server-side encryption

### Step 3: Configure CORS (If needed for frontend uploads)

Add CORS configuration to your S3 bucket:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "POST", "PUT"],
        "AllowedOrigins": [
            "https://yourdomain.com",
            "https://www.yourdomain.com"
        ],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
    }
]
```

### Step 4: Configure Environment Variables

Update your production `.env` file:

```bash
# Enable S3 Storage
USE_S3=True

# AWS Credentials
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_STORAGE_BUCKET_NAME=primepass-media-production
AWS_S3_REGION_NAME=us-east-1

# Optional: CloudFront CDN
AWS_S3_CUSTOM_DOMAIN=d111111abcdef8.cloudfront.net

# Production Settings
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
```

### Step 5: Set Django Settings Module

```bash
export DJANGO_SETTINGS_MODULE=backend.settings.production
```

### Step 6: Collect Static Files (Optional)

If using S3 for static files too:
```bash
python manage.py collectstatic --noinput
```

### Step 7: Deploy and Test

```bash
# Run migrations
python manage.py migrate

# Start application
gunicorn backend.wsgi:application --bind 0.0.0.0:8000
```

---

## User Model Configuration

The `User` model is already configured correctly. No changes needed!

**Location**: `backend/apps/auth/models.py`

```python
class User(AbstractUser):
    # ... other fields ...
    
    profile_picture = models.ImageField(
        upload_to='profiles/',  # ✅ Files stored in media/profiles/ or s3://bucket/media/profiles/
        blank=True,
        null=True,
        help_text="User's profile picture stored on S3."
    )
```

### How It Works

1. **File Upload**: When a user uploads a profile picture via API
2. **Storage Backend**: Django uses `DEFAULT_FILE_STORAGE` setting
3. **Local Dev**: Saves to `backend/media/profiles/filename.jpg`
4. **Production**: Uploads to `s3://bucket/media/profiles/filename.jpg`
5. **URL Generation**: 
   - Local: `http://localhost:8000/media/profiles/filename.jpg`
   - S3: `https://bucket.s3.region.amazonaws.com/media/profiles/filename.jpg?signature=...`

### Accessing Profile Pictures in Code

```python
# Get user profile picture URL
user = User.objects.get(id=1)

if user.profile_picture:
    # This works in both local and S3 environments
    picture_url = user.profile_picture.url
    print(f"Profile picture: {picture_url}")
```

---

## Testing the Configuration

### Test Local Storage

```python
# In Django shell: python manage.py shell
from apps.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile

# Create test user
user = User.objects.create_user(
    email='test@example.com',
    password='testpass123'
)

# Upload test image
test_image = SimpleUploadedFile(
    name='test_profile.jpg',
    content=open('test_image.jpg', 'rb').read(),
    content_type='image/jpeg'
)
user.profile_picture = test_image
user.save()

# Check URL
print(user.profile_picture.url)  # Should show /media/profiles/test_profile_xxx.jpg
```

### Test S3 Storage

```python
# Same code as above, but with USE_S3=True
# The URL will be an S3 URL with signature:
# https://bucket.s3.region.amazonaws.com/media/profiles/test_profile_xxx.jpg?...
```

### Test via API

**Upload Profile Picture:**

```bash
curl -X PATCH http://localhost:8000/api/v1/users/profile/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "profile_picture=@/path/to/image.jpg"
```

**Get Profile Picture URL:**

```bash
curl -X GET http://localhost:8000/api/v1/users/profile/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
{
  "email": "user@example.com",
  "profilePicture": "http://localhost:8000/media/profiles/image_abc123.jpg",
  ...
}
```

---

## Troubleshooting

### Issue: "No module named 'storages'"

**Solution:**
```bash
pip install django-storages boto3
```

### Issue: "Access Denied" errors on S3

**Solution:**
1. Check IAM user has correct permissions
2. Verify bucket name matches `AWS_STORAGE_BUCKET_NAME`
3. Ensure bucket is in the correct region
4. Check AWS credentials are correct

### Issue: Media files not serving in development

**Solution:**
1. Verify `DEBUG=True` in settings
2. Check `urls.py` has media file serving configured
3. Ensure media directory exists and has proper permissions

### Issue: Images not displaying (404 error)

**Local Development:**
```bash
# Check file exists
ls -la backend/media/profiles/

# Check Django is serving media files
# Should see media URL pattern in urls.py
```

**Production (S3):**
```bash
# Test AWS credentials
aws s3 ls s3://your-bucket-name/ --profile primepass

# Check file exists in S3
aws s3 ls s3://your-bucket-name/media/profiles/
```

### Issue: Slow S3 uploads

**Solution:**
- Enable `AWS_S3_USE_THREADS = True` (already configured)
- Use CloudFront CDN with `AWS_S3_CUSTOM_DOMAIN`
- Consider implementing direct browser-to-S3 uploads with pre-signed URLs

### Issue: Files overwriting each other

**Solution:**
The configuration already prevents this with `AWS_S3_FILE_OVERWRITE = False`. Django automatically adds unique suffixes to duplicate filenames.

---

## Security Best Practices

### ✅ DO:
- Use signed URLs for private files (already configured)
- Store AWS credentials in environment variables only
- Use IAM roles on EC2/ECS instead of access keys when possible
- Enable S3 bucket versioning
- Monitor S3 access logs
- Set proper CORS policies
- Use HTTPS only

### ❌ DON'T:
- Hardcode AWS credentials in code
- Make S3 buckets public unless absolutely necessary
- Use root AWS account credentials
- Share AWS access keys
- Commit `.env` file to git

---

## Additional Resources

- [Django File Storage Documentation](https://docs.djangoproject.com/en/4.2/topics/files/)
- [django-storages S3 Backend](https://django-storages.readthedocs.io/en/latest/backends/amazon-S3.html)
- [AWS S3 Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html)
- [CloudFront CDN Setup](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/GettingStarted.html)

---

## Quick Reference

### Environment Variables

| Variable | Development | Production |
|----------|-------------|------------|
| `USE_S3` | `False` | `True` |
| `DEBUG` | `True` | `False` |
| `AWS_ACCESS_KEY_ID` | Not needed | Required |
| `AWS_SECRET_ACCESS_KEY` | Not needed | Required |
| `AWS_STORAGE_BUCKET_NAME` | Not needed | Required |
| `AWS_S3_REGION_NAME` | Not needed | `us-east-1` |

### File Locations

| Environment | Storage Location |
|-------------|------------------|
| Development | `backend/media/profiles/` |
| Production | `s3://bucket/media/profiles/` |

### Access URLs

| Environment | URL Format |
|-------------|------------|
| Development | `http://localhost:8000/media/profiles/filename.jpg` |
| Production (Direct) | `https://bucket.s3.region.amazonaws.com/media/profiles/filename.jpg?signature=...` |
| Production (CloudFront) | `https://cdn.yourdomain.com/media/profiles/filename.jpg` |

---

**Configuration Complete! 🎉**

Your Django project now supports both local and AWS S3 media storage seamlessly.
