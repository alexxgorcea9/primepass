# PyCharm Configuration for PrimePass

## Import Resolution Issue - SOLVED ✅

### The Problem
PyCharm was flagging imports like `from apps.events.models import ...` as unresolved references, suggesting to use `from backend.apps.events.models import ...` instead. However, the latter breaks Django runtime.

### Why This Happens
- **Docker/Django Runtime**: Runs from `/app` (the `backend` folder), so imports are `from apps.events...`
- **PyCharm**: Opens project from monorepo root, treats `backend` as a package, expects `from backend.apps...`

### The Solution
The `backend` folder has been marked as a **Sources Root** in PyCharm configuration.

**File Updated:** `.idea/primepass.iml`
- Added: `<sourceFolder url="file://$MODULE_DIR$/backend" isTestSource="false" />`

### After Restart
1. **Close PyCharm completely**
2. **Reopen the project**
3. PyCharm will now recognize imports correctly:
   - ✅ `from apps.events.models import Event`
   - ✅ `from apps.events.serializers import EventSerializer`
   - ❌ ~~`from backend.apps.events.models import Event`~~ (wrong)

### Manual Alternative (if needed)
If the automatic configuration doesn't work:
1. Right-click on `backend` folder in Project view
2. Select **"Mark Directory as"** → **"Sources Root"**
3. The folder icon will turn blue/highlighted

### Verify It's Working
Open `backend/apps/events/views.py` and check that these imports show **no errors**:
```python
from apps.events.models import EventMedia, Tier, Wave, Privilege, AddOn, Table, Event
from apps.events.serializers import EventListSerializer, EventDetailSerializer
from apps.events.cache.service import CacheService, EventCacheService
```

## Python Interpreter Setup
Make sure your PyCharm Python interpreter points to:
- **Docker**: Use the Docker Compose interpreter (recommended)
- **Local**: Use a virtual environment in `backend/venv` with Django installed

### Configure Docker Interpreter (Recommended)
1. **File** → **Settings** → **Project: primepass** → **Python Interpreter**
2. Click the gear icon → **Add...**
3. Select **Docker Compose**
4. Choose service: `backend`
5. Click **OK**

This ensures PyCharm uses the same Python environment as your running containers.

## Additional Optimizations Applied
The following folders are now excluded from indexing for better performance:
- `backend/venv` and `backend/.venv` (Python virtual environments)
- `frontend/node_modules` (Node.js dependencies)
- `packages/shared/node_modules` (Shared package dependencies)
