# PrimePass Authentication System

**Complete authentication documentation for the PrimePass platform.**

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [API Endpoints](#api-endpoints)
- [User Model](#user-model)
- [Authentication Flow](#authentication-flow)
- [OAuth Integration](#oauth-integration)
- [Security Features](#security-features)
- [Usage Examples](#usage-examples)

---

## Overview

PrimePass uses a modern, secure authentication system built on:
- **JWT tokens** (via `djangorestframework-simplejwt`)
- **HTTP-only cookies** for token storage (XSS protection)
- **Role-based access control** (Guest, Organizer, Team)
- **OAuth 2.0** support (Google, Apple, Instagram)
- **Email verification** system
- **Rate limiting** and brute-force protection

## Features

### ✅ Core Authentication
- Email/password signup and login
- Secure JWT token generation with cookie storage
- Access token (15 min) + Refresh token (7 days)
- Token refresh mechanism
- Logout (single device & all devices)
- Email verification with secure tokens

### ✅ OAuth Providers
- **Google OAuth** - Full support with PKCE
- **Apple Sign In** - Secure JWT verification *(disabled by default)*
- **Instagram OAuth** - With email collection flow *(disabled by default)*

### ✅ Security
- Django Axes: Brute-force protection (5 attempts → 1 hour lockout)
- Rate limiting on sensitive endpoints
- CSRF protection with cookie-based tokens
- Password validation (min 12 chars, complexity requirements)
- Email verification tokens (24-hour expiry)

### ✅ User Management
- Custom User model (no username, email-based)
- User roles: `guest`, `organizer`, `team`
- Profile fields: name, phone, birth date, profile picture
- Organizer-specific field: `organizer_bio`
- OAuth provider IDs stored per user

---

## Architecture

```
apps/auth/
├── models.py           # User model with roles & OAuth fields
├── serializers.py      # UserSerializer for API
├── views.py            # Core auth endpoints (signup, login, logout)
├── views_auth.py       # Token refresh endpoint
├── views_oauth.py      # Google OAuth implementation
├── apple_auth.py       # Apple Sign In (disabled)
├── instagram_auth.py   # Instagram OAuth (disabled)
├── authentication.py   # CookieJWTAuthentication class
├── cache.py            # User caching with auto-invalidation
├── emails.py           # Email verification system
├── csrf.py             # CSRF token endpoint
├── tasks.py            # Celery tasks for email sending
├── admin.py            # Django admin configuration
└── urls.py             # URL routing
```

### Authentication Class
```python
# apps/auth/authentication.py
class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that reads tokens from HTTP-only cookies.
    Automatically falls back to Authorization header if cookie not present.
    """
```

---

## API Endpoints

### Core Authentication

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/signup/` | POST | No | Create new user account |
| `/api/login/` | POST | No | Authenticate user |
| `/api/logout/` | POST | Yes | Logout (current device) |
| `/api/logout-all/` | POST | Yes | Logout from all devices |
| `/api/user-profile/` | GET | Yes | Get current user data |
| `/api/token/refresh/` | POST | No | Refresh access token |

### Email Verification

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/verify-email/` | POST | No | Verify email with token |
| `/api/resend-verification/` | POST | No | Resend verification email |

### OAuth (Google - Active)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/google/` | GET | No | Initiate Google OAuth flow |
| `/api/auth/google/callback/` | POST | No | Handle Google OAuth callback |

### CSRF Protection

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/csrf/` | GET | No | Get CSRF token |

---

## User Model

### Fields

```python
class User(AbstractUser):
    # Core fields
    email = EmailField(unique=True)  # USERNAME_FIELD
    role = CharField(choices=['guest', 'organizer', 'team'])
    
    # Profile fields
    name = CharField(max_length=100)
    phone_number = CharField(max_length=20, blank=True, null=True)
    birth_date = DateField(blank=True, null=True)
    profile_picture = ImageField(upload_to='profiles/', blank=True, null=True)
    
    # Organizer-specific
    organizer_bio = TextField(blank=True, null=True)
    
    # OAuth provider IDs
    google_id = CharField(max_length=255, unique=True, blank=True, null=True)
    apple_id = CharField(max_length=255, unique=True, blank=True, null=True)
    instagram_id = CharField(max_length=255, unique=True, blank=True, null=True)
    
    # Email verification
    email_verified = BooleanField(default=False)
    email_verification_token = CharField(max_length=64, blank=True, null=True)
    email_verification_token_created = DateTimeField(blank=True, null=True)
```

### User Roles

- **`guest`**: Default role for attendees
- **`organizer`**: Event organizers with management capabilities
- **`team`**: Team members working for organizers

---

## Authentication Flow

### 1. Signup Flow

```
1. POST /api/signup/
   Body: { email, password, role }
   
2. Server creates user + sends verification email
   
3. Response includes:
   - User data
   - JWT tokens (in cookies)
   - email_sent: true/false
   
4. User clicks email link
   
5. POST /api/verify-email/
   Body: { email, token }
   
6. Email marked as verified
```

### 2. Login Flow

```
1. POST /api/login/
   Body: { email, password, remember_me }
   
2. Server validates credentials
   
3. On success:
   - Generates JWT tokens
   - Sets HTTP-only cookies:
     * access_token (15 min)
     * refresh_token (7 days or session)
   - Returns user data
   
4. Client receives user data (no tokens in response body)
```

### 3. Token Refresh Flow

```
1. Access token expires (after 15 min)
   
2. POST /api/token/refresh/
   - Cookie: refresh_token (sent automatically)
   
3. Server validates refresh token
   
4. On success:
   - Generates new access token
   - Sets new access_token cookie
   - Optionally rotates refresh token
```

### 4. Google OAuth Flow

```
1. GET /api/auth/google/
   Returns: { auth_url }
   
2. Redirect user to auth_url
   
3. User authorizes on Google
   
4. Google redirects to frontend with code & state
   
5. POST /api/auth/google/callback/
   Body: { code, state }
   
6. Server:
   - Validates state
   - Exchanges code for Google tokens
   - Fetches user info from Google
   - Creates/updates user
   - Generates JWT tokens
   
7. Response includes user data + tokens in cookies
```

---

## OAuth Integration

### Google OAuth (Active)

**Requirements:**
- `GOOGLE_CLIENT_ID` in environment
- `GOOGLE_CLIENT_SECRET` in environment
- `GOOGLE_REDIRECT_URI` configured

**Features:**
- PKCE (Proof Key for Code Exchange)
- State parameter validation (10-min expiry)
- Automatic email verification
- User creation or linking

**Setup Guide:** See `backend/docs/`

### Apple Sign In (Disabled)

**Requirements:**
- Apple Developer account
- Service ID, Team ID, Key ID
- Private key (.p8 file)

**Setup Guide:** `backend/docs/APPLE_SIGNIN_SETUP.md`

**To enable:** Uncomment routes in `urls.py`

### Instagram OAuth (Disabled)

**Note:** Instagram Basic Display API doesn't provide email addresses.

**Features:**
- Creates synthetic email (`username@instagram.primepass.internal`)
- User marked as inactive until real email provided
- Dedicated endpoint for email collection

**Setup Guide:** `backend/docs/INSTAGRAM_OAUTH_SETUP.md`

**To enable:** Uncomment routes in `urls.py`

---

## Security Features

### 1. Brute-Force Protection (Django Axes)

```python
AXES_FAILURE_LIMIT = 5
AXES_COOLOFF_TIME = 1  # hour
AXES_LOCK_OUT_BY_COMBINATION_USER_AND_IP = True
```

- 5 failed login attempts → 1-hour lockout
- Email sent to user on lockout
- Lockout by IP + username combination

### 2. Rate Limiting

```python
# Signup: 20/hour per IP, 10/day per email
@ratelimit(key='ip', rate='20/h', method='POST')
@ratelimit(key='post:email', rate='10/d', method='POST')

# Login: 100/min per IP, 20/hour per email
@ratelimit(key='ip', rate='100/m', method='POST')
@ratelimit(key='post:email', rate='20/h', method='POST')

# Email verification: 10/hour per IP, 5/day per email
@ratelimit(key='ip', rate='10/h', method='POST')
@ratelimit(key='post:email', rate='5/d', method='POST')
```

### 3. Password Validation

```python
AUTH_PASSWORD_VALIDATORS = [
    'UserAttributeSimilarityValidator',  # Not similar to username/email
    'MinimumLengthValidator',            # Min 12 characters
    'CommonPasswordValidator',           # Not in common password list
    'NumericPasswordValidator',          # Not entirely numeric
]
```

### 4. Token Security

- **Access tokens:** Short-lived (15 min)
- **Refresh tokens:** Longer-lived (7 days), blacklisted on logout
- **HTTP-only cookies:** Prevents XSS attacks
- **Secure flag:** HTTPS-only in production
- **SameSite=Lax:** CSRF protection

### 5. Email Verification

- Tokens: 32-byte URL-safe random strings
- Expiry: 24 hours
- One-time use (deleted after verification)

---

## Usage Examples

### Frontend (React/TypeScript)

#### Signup
```typescript
const response = await api.post('/api/signup/', {
  email: 'user@example.com',
  password: 'SecurePassword123!',
  role: 'guest',
  remember_me: true
});

// Tokens automatically stored in cookies
const user = response.data.user;
```

#### Login
```typescript
const response = await api.post('/api/login/', {
  email: 'user@example.com',
  password: 'SecurePassword123!',
  remember_me: true
});

const user = response.data.user;
// Access token in cookie, auto-sent with requests
```

#### Get User Profile
```typescript
// Cookies sent automatically
const response = await api.get('/api/user-profile/');
const user = response.data;
```

#### Token Refresh
```typescript
// Handled automatically by axios interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      await api.post('/api/token/refresh/');
      // Retry original request
      return api.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

#### Logout
```typescript
await api.post('/api/logout/');
// Cookies cleared, user logged out
```

### Backend (Django)

#### Create User
```python
from apps.auth.models import User

user = User.objects.create_user(
    email='user@example.com',
    password='SecurePassword123!',
    role='guest',
    name='John Doe'
)
```

#### Check Authentication
```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def protected_view(request):
    user = request.user  # Authenticated user
    return Response({'user_id': user.id})
```

#### Role-Based Access
```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def organizer_only_view(request):
    if request.user.role != 'organizer':
        return Response(
            {'error': 'Organizer role required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Organizer-specific logic
    return Response({'message': 'Success'})
```

---

## Environment Variables

### Required
```bash
SECRET_KEY=your-django-secret-key
JWT_SECRET_KEY=your-jwt-secret-key
DATABASE_URL=postgresql://user:pass@localhost/db
REDIS_URL=redis://localhost:6379/0
```

### Optional (OAuth)
```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth/google/callback

# Apple Sign In
APPLE_CLIENT_ID=your-apple-service-id
APPLE_TEAM_ID=your-team-id
APPLE_KEY_ID=your-key-id
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...

# Instagram
INSTAGRAM_APP_ID=your-instagram-app-id
INSTAGRAM_APP_SECRET=your-instagram-app-secret
INSTAGRAM_REDIRECT_URI=http://localhost:3000/oauth/instagram/callback
```

### Email (for verification)
```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

---

## Migration History

- `0001_initial.py` - Initial User model and Organizer model
- `0002_replace_age_with_birth_date.py` - Changed age to birth_date
- `0003_add_oauth_provider_ids.py` - Added Google/Apple/Instagram IDs
- `0004_user_email_verification_token_and_more.py` - Email verification
- `0005_add_performance_indexes.py` - Database indexes
- `0006_normalize_user_roles_to_lowercase.py` - Role lowercase migration
- `0007_set_default_user_names.py` - Set default names from emails
- `0008_consolidate_organizer_into_user.py` - **Merged Organizer model into User**

**Important:** Migration 0008 consolidates the separate Organizer model into User.  
See `ORGANIZER_CONSOLIDATION.md` for details.

---

## Admin Interface

Access Django admin at `/admin/` with superuser credentials.

**User Management:**
- View all users with filtering by role, status, verification
- Search by email, name, OAuth IDs
- Edit user profiles, roles, permissions
- View OAuth provider connections
- Manage email verification status

**Create Superuser:**
```bash
python manage.py createsuperuser
```

---

## Testing

### Manual Testing
```bash
# Signup
curl -X POST http://localhost:8000/api/signup/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePassword123!","role":"guest"}'

# Login
curl -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@example.com","password":"SecurePassword123!"}'

# Get Profile (with cookies)
curl -X GET http://localhost:8000/api/user-profile/ \
  -b cookies.txt
```

### Unit Tests
```bash
python manage.py test apps.auth
```

---

## Troubleshooting

### Token Expired
**Problem:** 401 Unauthorized after 15 minutes  
**Solution:** Implement token refresh in frontend interceptor

### CORS Issues
**Problem:** Cookies not being sent cross-origin  
**Solution:** Check `CORS_ALLOW_CREDENTIALS=True` and `withCredentials: true` in frontend

### Email Not Sending
**Problem:** Verification emails not received  
**Solution:** Check EMAIL_* settings, use Celery for async sending

### OAuth Callback Fails
**Problem:** Invalid state or expired state  
**Solution:** State expires in 10 min, restart OAuth flow

---

## Related Documentation

- **Setup Guide:** `docs/SETUP.md`
- **Security:** `docs/SECURITY.md`
- **Role Standardization:** `docs/ROLE_STANDARDIZATION.md`
- **Organizer Consolidation:** `docs/ORGANIZER_CONSOLIDATION.md`
- **Apple OAuth:** `backend/docs/APPLE_SIGNIN_SETUP.md`
- **Instagram OAuth:** `backend/docs/INSTAGRAM_OAUTH_SETUP.md`
- **High Concurrency:** `backend/docs/HIGH_CONCURRENCY_SETUP.md`

---

## Support

For issues or questions:
1. Check existing documentation
2. Review Django logs at `backend/logs/primepass.log`
3. Enable debug toolbar in development
4. Check Silk profiler for performance issues

**Last Updated:** 2025-10-14
