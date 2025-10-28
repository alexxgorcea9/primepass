# Role Standardization - Complete Documentation

## Overview
All user roles across the PrimePass application have been standardized to **lowercase** format.

## Standard Role Values
The application now uses exactly **three lowercase roles**:
- `guest` - Regular event attendees
- `organizer` - Event creators and managers  
- `team` - Team members working on events

## Changes Made

### 1. Backend Model Changes

#### Models Updated
- **`apps/auth/models.py`** - Updated `UserRole` choices to lowercase
- **`apps/legacy/models.py`** - Updated `UserRole` choices to lowercase

```python
class UserRole(models.TextChoices):
    GUEST = 'guest'
    ORGANIZER = 'organizer'
    TEAM = 'team'
```

### 2. Database Migration

**Migration:** `0006_normalize_user_roles_to_lowercase.py`

This data migration converted all existing user records from capitalized roles (`Guest`, `Organizer`, `Team`) to lowercase (`guest`, `organizer`, `team`).

**Verification:**
```bash
docker exec primepass_backend python manage.py shell -c "from apps.auth.models import User; User.objects.values_list('role', flat=True).distinct()"
# Returns: ['guest', 'organizer', 'team']
```

### 3. Backend API Views Updated

All view functions now return lowercase roles without transformation:

#### Files Modified:
- `apps/auth/views.py`
  - `login()` - Returns `user.role` directly
  - `SignupView.post()` - Returns `user.role` directly
  - `user_profile()` - Returns `user.role` directly
  - `update_email_for_oauth()` - Returns `user.role` directly

- `apps/auth/views_oauth.py`
  - `google_callback()` - Returns `user.role` directly

- `apps/auth/google_auth.py`
  - `google_auth()` - Returns `user.role` directly
  - Default role set to `'guest'`

- `apps/auth/apple_auth.py`
  - `apple_auth_callback()` - Returns `user.role` directly
  - Default role set to `'guest'`

- `apps/auth/instagram_auth.py`
  - `instagram_auth_callback()` - Returns `user.role` directly
  - Default role set to `'guest'`

- `apps/auth/cache.py`
  - `get_cached_user()` - Caches `user.role` directly

- `apps/auth/serializers.py`
  - Default role in `UserSerializer.create()` set to `'guest'`

### 4. Frontend Changes

#### AuthContext (`frontend/src/contexts/AuthContext.tsx`)
- Updated `signup()` function to send lowercase roles
- Removed capitalization logic: `capitalizedRole` → `normalizedRole.toLowerCase()`
- TypeScript interface already used lowercase: `role: 'organizer' | 'team' | 'guest'`

#### SelectAccountType Component
- Already stores lowercase values in state (`guest`, `organizer`, `team`)
- Displays capitalized labels for UI (`Guest`, `Organizer`, `Team`)
- Saves lowercase values to session storage

## Role Validation

### Backend
```python
# apps/auth/views.py
ROLE_CHOICES = ['guest', 'organizer', 'team']
```

### Frontend TypeScript
```typescript
// frontend/src/contexts/AuthContext.tsx
export interface User {
  id: number;
  email: string;
  role: 'organizer' | 'team' | 'guest';
  name: string;
  profile_picture: string;
}
```

## API Response Format

All API endpoints now return user data with lowercase roles:

```json
{
  "user": {
    "id": 6,
    "email": "user@example.com",
    "role": "organizer",
    "name": "John Doe",
    "email_verified": true
  }
}
```

## Routing & Authorization

### Frontend Route Protection
- **AuthGuard** checks: `user.role !== 'organizer'`
- Organizer routes: `/organizer/*` requires `role === 'organizer'`
- Team routes: `/team/*` requires `role === 'team'`
- Guest routes: All other routes

### URL Generation
```typescript
// frontend/src/utils/pathUtils.ts
getRedirectPath(role: string, name: string): string {
  const normalizedRole = role.toLowerCase(); // Already lowercase
  
  if (normalizedRole === 'organizer') {
    return `/${slug}/dashboard`;
  } else if (normalizedRole === 'team') {
    return `/${slug}/home`;
  }
  return '/events'; // guest default
}
```

## Testing Verification

### Verify Database Roles
```bash
docker exec primepass_backend python manage.py shell -c "
from apps.auth.models import User;
users = User.objects.all();
print('All users and their roles:');
[print(f'  {user.email}: {user.role}') for user in users]
"
```

### Verify API Response
```bash
# Login and check response
curl -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  -c cookies.txt

# Should return: {"user": {"role": "organizer", ...}}
```

### Verify Cache
```bash
docker exec primepass_backend python manage.py shell -c "
from apps.auth.cache import get_cached_user;
user_data = get_cached_user(6);
print(f'Cached role: {user_data[\"role\"]}')
"
```

## Migration Guide for Existing Deployments

1. **Pull latest code**
   ```bash
   git pull origin main
   ```

2. **Run migrations**
   ```bash
   docker exec primepass_backend python manage.py migrate primepass_auth
   ```

3. **Clear cache** (optional but recommended)
   ```bash
   docker exec primepass_backend python manage.py shell -c "
   from django.core.cache import cache;
   cache.clear();
   print('Cache cleared')
   "
   ```

4. **Restart backend**
   ```bash
   docker restart primepass_backend
   ```

5. **Verify roles**
   ```bash
   docker exec primepass_backend python manage.py shell -c "
   from apps.auth.models import User;
   print(list(User.objects.values_list('role', flat=True).distinct()))
   "
   # Should output: ['guest', 'organizer', 'team']
   ```

## Backwards Compatibility

⚠️ **Breaking Change**: This is a breaking change for any external systems that expect capitalized roles.

### If you need to support old API clients:
You can temporarily add a serializer field that returns both formats:
```python
# Not recommended - for legacy support only
class UserSerializer(serializers.ModelSerializer):
    role_legacy = serializers.SerializerMethodField()
    
    def get_role_legacy(self, obj):
        return obj.role.capitalize()
```

## Summary

✅ **Database**: All roles stored as lowercase  
✅ **Backend API**: All responses return lowercase roles  
✅ **Frontend**: Expects and sends lowercase roles  
✅ **Cache**: Stores lowercase roles  
✅ **Migration**: Data migration completed  
✅ **Validation**: Role choices limited to `['guest', 'organizer', 'team']`  

**Result**: Complete end-to-end consistency with lowercase role standardization.
