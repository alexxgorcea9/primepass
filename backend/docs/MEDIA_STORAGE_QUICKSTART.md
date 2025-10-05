# Media Storage Quick Start Guide

## 🚀 TL;DR

Your Django project now supports **automatic switching** between local (dev) and AWS S3 (production) media storage.

---

## ⚡ Quick Setup

### Development (Local Storage)

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Ensure USE_S3=False (default in .env.example)
# USE_S3=False

# 3. Run server
python manage.py runserver

# ✅ Profile pictures saved to: backend/media/profiles/
# ✅ Accessible at: http://localhost:8000/media/profiles/filename.jpg
```

### Production (AWS S3)

```bash
# 1. Create S3 bucket and IAM user (see full docs)

# 2. Set environment variables
export USE_S3=True
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
export AWS_STORAGE_BUCKET_NAME=primepass-media
export AWS_S3_REGION_NAME=us-east-1

# 3. Deploy
gunicorn backend.wsgi:application

# ✅ Profile pictures uploaded to: s3://bucket/media/profiles/
# ✅ Accessible via signed URLs
```

---

## 📁 What Changed

### New Files Created

1. **`backend/backend/storages.py`**
   - Custom storage backends for S3
   - Separate handlers for static and media files

2. **`backend/.env.example`**
   - Comprehensive environment template
   - All AWS S3 variables documented

3. **`backend/docs/MEDIA_STORAGE_SETUP.md`**
   - Complete setup guide
   - AWS configuration instructions
   - Troubleshooting tips

### Modified Files

1. **`backend/settings/base.py`**
   - Added media file configuration
   - Set default local storage
   - Added file upload settings

2. **`backend/settings/production.py`**
   - Comprehensive S3 configuration
   - Automatic switching with USE_S3 flag
   - Security best practices

3. **`backend/settings/development.py`**
   - Explicit local storage configuration
   - Auto-create media directories

---

## 🧪 Test It Now

### Test Profile Picture Upload

```python
# Python shell: python manage.py shell
from apps.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile

# Create user
user = User.objects.create_user(
    email='test@example.com',
    password='test123'
)

# Upload image (works in both local and S3!)
with open('test.jpg', 'rb') as f:
    from django.core.files import File
    user.profile_picture.save('profile.jpg', File(f))

# Get URL
print(user.profile_picture.url)
# Local: /media/profiles/profile_xyz123.jpg
# S3: https://bucket.s3.region.amazonaws.com/media/profiles/profile_xyz123.jpg?...
```

### Test via API

```bash
# Upload
curl -X PATCH http://localhost:8000/api/v1/users/profile/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "profile_picture=@image.jpg"

# Get URL
curl http://localhost:8000/api/v1/users/profile/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔒 Security Notes

- ✅ AWS credentials via environment variables only
- ✅ Private S3 files with signed URLs
- ✅ No hardcoded secrets
- ✅ `.env` excluded from git
- ✅ Proper IAM permissions

---

## 📊 Configuration Matrix

| Feature | Development | Production |
|---------|-------------|------------|
| Storage Backend | Local Filesystem | AWS S3 |
| Environment Var | `USE_S3=False` | `USE_S3=True` |
| URL Format | `/media/profiles/file.jpg` | S3 signed URL |
| Dependencies | None (built-in) | boto3, django-storages |
| Setup Time | ✅ Instant | 10-15 min |
| Cost | Free | AWS S3 pricing |

---

## 🎯 Next Steps

1. **Development**: Just run `python manage.py runserver` - it works!
2. **Production**: Follow AWS S3 setup in `MEDIA_STORAGE_SETUP.md`
3. **Testing**: Use the test code above
4. **Deployment**: Set `USE_S3=True` and AWS credentials

---

## 📚 Full Documentation

For complete details, see:
- **Full Setup Guide**: `backend/docs/MEDIA_STORAGE_SETUP.md`
- **Environment Variables**: `backend/.env.example`
- **Storage Backends**: `backend/backend/storages.py`

---

## ❓ Common Questions

**Q: Do I need AWS for development?**  
A: No! Local storage works automatically.

**Q: How do I switch to S3?**  
A: Just set `USE_S3=True` and add AWS credentials.

**Q: Are profile pictures secure?**  
A: Yes! S3 files use signed URLs with 1-hour expiration.

**Q: What if I don't set USE_S3 in production?**  
A: You'll see a warning, and local storage will be used (not recommended).

**Q: Does the User model need changes?**  
A: No! The `ImageField` works with both storage backends automatically.

---

**Ready to go! 🚀** Your media storage is now production-ready.
