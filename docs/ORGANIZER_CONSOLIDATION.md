# Organizer Model Consolidation

## Overview
Consolidated the separate `Organizer` model into the `User` model for simpler data management and better performance.

## Changes Made

### 1. Database Schema Changes
- **Added field**: `User.organizer_bio` (TextField, nullable)
- **Removed model**: `Organizer` model completely removed
- **Migration**: `0008_consolidate_organizer_into_user.py` handles data migration automatically

### 2. Backend Code Updates

#### `models.py`
- Added `organizer_bio` field to User model (line 58)
- Removed entire `Organizer` model class

#### `serializers.py`
- Removed `OrganizerSerializer` 
- Updated `UserSerializer` to include `organizer_bio` field
- Made `organizer_bio` optional in `extra_kwargs`

#### `views.py`
- Removed `Organizer` and `OrganizerSerializer` imports
- Updated `user_profile` endpoint to return `organizer_bio`

#### `cache.py`
- Added `organizer_bio` to cached user data dictionary

## API Response Changes

### User Profile Endpoint (`/api/user-profile/`)
Now includes:
```json
{
  "id": 1,
  "email": "organizer@example.com",
  "role": "organizer",
  "name": "John Doe",
  "profile_picture": "url...",
  "email_verified": true,
  "organizer_bio": "Bio text here"
}
```

### Signup Response
The signup endpoint now accepts and returns `organizer_bio`:
```json
{
  "email": "new@example.com",
  "password": "secure_password",
  "role": "organizer",
  "organizer_bio": "Optional bio text"
}
```

## Migration Process

The migration `0008_consolidate_organizer_into_user.py` performs:
1. Adds `organizer_bio` field to User table
2. Migrates all `Organizer.bio` data to `User.organizer_bio`
3. Drops the `Organizer` table

### Running the Migration

```bash
# In Docker
docker-compose exec backend python manage.py migrate

# Locally
python manage.py migrate
```

## Frontend Impact

### Required Changes
The frontend currently expects organizer data from a separate endpoint. After this change:

1. **Remove separate organizer fetching** - organizer data is now part of user object
2. **Update TypeScript interfaces**:
   ```typescript
   interface User {
     id: number;
     email: string;
     role: 'guest' | 'organizer' | 'team';
     name: string;
     profile_picture?: string;
     email_verified: boolean;
     organizer_bio?: string;  // NEW
   }
   ```

3. **Remove `organizerService.ts`** or update it to fetch from user endpoint
4. **Update components** that display organizer bio to use `user.organizer_bio`

### Breaking Changes
- `/api/organizers/user/{userId}/` endpoint will no longer exist (if it was implemented)
- Organizer-specific serializer responses are now part of user responses

## Benefits

1. **Simpler Schema**: One table instead of two with 1:1 relationship
2. **Better Performance**: No joins needed to fetch user+organizer data
3. **Easier Caching**: All user data in single cache entry
4. **Cleaner Code**: No need to check `hasattr(user, 'organizer_profile')`
5. **Atomic Updates**: Profile updates are single-table transactions

## Rollback

If needed, the migration can be reversed:
```bash
python manage.py migrate primepass_auth 0007_set_default_user_names
```

This will:
- Recreate Organizer table
- Restore organizer records from `user.organizer_bio`
- Remove `organizer_bio` field from User

## Testing

After migration, verify:
- [ ] Existing organizer users still have their bio data
- [ ] New signups with role='organizer' can set bio
- [ ] User profile endpoint returns organizer_bio
- [ ] Cache includes organizer_bio
- [ ] Frontend displays organizer bio correctly
