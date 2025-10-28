# User Name NOT NULL Constraint

## Overview
Added a database-level NOT NULL constraint to the `name` field in the User model to ensure all users have a name value.

## Changes Made

### 1. Model Update
**File:** `backend/apps/auth/models.py`

Changed from:
```python
name = models.CharField(max_length=100, blank=True, null=True)
```

To:
```python
name = models.CharField(max_length=100, blank=True, default='')
```

**Key Changes:**
- Removed `null=True` - No longer allows NULL values in the database
- Added `default=''` - New users get an empty string by default if name not provided
- Kept `blank=True` - Forms can still submit without a name (will use default)

### 2. Data Migration
**File:** `backend/apps/auth/migrations/0007_set_default_user_names.py`

**Migration Steps:**
1. **Data Population:** Sets default names for all users with NULL names using email username
2. **Schema Change:** Alters the field to NOT NULL with default value

**Data Population Logic:**
```python
def set_default_names(apps, schema_editor):
    User = apps.get_model('primepass_auth', 'User')
    users_with_null_names = User.objects.filter(name__isnull=True)
    
    for user in users_with_null_names:
        # Extract username from email (part before @)
        email_username = user.email.split('@')[0]
        user.name = email_username
        user.save(update_fields=['name'])
```

## Migration Results

### Before Migration
```
Users with null names: 12
Total users: 12
```

### After Migration
```
All users now have names:
  guest@example.com: name="guest"
  alexgorcea2004@gmail.com: name="alexgorcea2004"
  testuser@example.com: name="testuser"
  alexgorcea09@gmail.com: name="alexgorcea09"
  Gorcea.Io.Alex@student.utcluj.ro: name="Gorcea.Io.Alex"
  organizer@example.com: name="organizer"
  alexxgorcea@gmail.com: name="alexxgorcea"
  example@example.com: name="example"
  alexgorcea05@gmail.com: name="alexgorcea05"
  Gorcea.Io.aAlex@student.utcluj.ro: name="Gorcea.Io.aAlex"
  contact@softwoz.app: name="contact"
  team@example.com: name="team"

Users with null names: 0
Total users: 12
```

## Constraint Behavior

### Test Results

✅ **Test 1: User without name field**
```python
User.objects.create_user(email='test@example.com', password='pass')
# Result: User created with default name: ""
```

❌ **Test 2: User with name=None explicitly**
```python
User.objects.create_user(email='test@example.com', password='pass', name=None)
# Result: IntegrityError - NOT NULL constraint violation
```

✅ **Test 3: User with empty string name**
```python
User.objects.create_user(email='test@example.com', password='pass', name='')
# Result: User created with empty string name: ""
```

✅ **Test 4: User with proper name**
```python
User.objects.create_user(email='test@example.com', password='pass', name='John Doe')
# Result: User created with name: "John Doe"
```

## Database Schema

### PostgreSQL Constraint
```sql
ALTER TABLE "primepass_auth_user" 
ALTER COLUMN "name" SET NOT NULL;

ALTER TABLE "primepass_auth_user" 
ALTER COLUMN "name" SET DEFAULT '';
```

## API Impact

### User Creation Endpoints

**Before:** Users could be created with `name=null`
**After:** Users must have a name value (can be empty string '')

**Example API Request:**
```json
POST /api/signup/
{
  "email": "user@example.com",
  "password": "securepass123",
  "role": "guest"
  // name is optional - will default to ""
}
```

**Response:**
```json
{
  "user": {
    "id": 13,
    "email": "user@example.com",
    "role": "guest",
    "name": "",  // Default empty string
    "email_verified": false
  }
}
```

## Frontend Impact

### No Breaking Changes
- Frontend can continue to send or omit the `name` field
- If omitted, server uses default empty string
- TypeScript User interface remains unchanged:
```typescript
interface User {
  id: number;
  email: string;
  role: 'organizer' | 'team' | 'guest';
  name: string;  // Now guaranteed to be a string (never null)
  profile_picture: string;
}
```

## Benefits

1. **Data Integrity:** Eliminates NULL/undefined confusion in the database
2. **Type Safety:** Frontend can safely assume name is always a string
3. **Consistent Behavior:** All users have a name value (even if empty)
4. **Better Defaults:** New OAuth users get email username as default name
5. **Database Performance:** NOT NULL constraints allow better query optimization

## Migration for Production

```bash
# 1. Backup database
docker exec primepass_postgres pg_dump -U primepass_user primepass_db > backup.sql

# 2. Run migration
docker exec primepass_backend python manage.py migrate primepass_auth

# 3. Verify
docker exec primepass_backend python manage.py shell -c "
from apps.auth.models import User;
print(f'NULL names: {User.objects.filter(name__isnull=True).count()}')
"
# Should output: NULL names: 0
```

## Rollback (If Needed)

```bash
# Rollback the migration
docker exec primepass_backend python manage.py migrate primepass_auth 0006

# This will:
# - Remove NOT NULL constraint
# - Allow NULL values again
# - Names set by migration will remain
```

## Related Files

- **Model:** `backend/apps/auth/models.py`
- **Migration:** `backend/apps/auth/migrations/0007_set_default_user_names.py`
- **Documentation:** This file

## Summary

✅ **Completed:** NOT NULL constraint added to User.name field  
✅ **Data Migration:** All 12 existing users updated with default names  
✅ **Testing:** Constraint verified with comprehensive tests  
✅ **Backend:** Restarted and operational  
✅ **Documentation:** Complete migration guide created  

**Result:** User name field is now guaranteed to never be NULL in the database.
