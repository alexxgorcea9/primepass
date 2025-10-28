# Local Network Access Configuration

This document explains how to access PrimePass from devices on your local network (e.g., iPhone, iPad).

## Configuration Summary

Your local network IP: **192.168.100.133**

### Backend Configuration

**File**: `backend/backend/settings/development.py`

- **ALLOWED_HOSTS**: Includes `192.168.100.133`
- **CORS_ALLOWED_ORIGINS**: Includes `http://192.168.100.133:3000` and `http://192.168.100.133:5173`
- **CSRF_TRUSTED_ORIGINS**: Includes all local network URLs
- **Cookie Settings**: Configured for cross-device access on same network

### Frontend Configuration

**File**: `frontend/vite.config.ts`

- **HMR Host**: Set to `192.168.100.133` for Hot Module Replacement
- **Proxy Target**: Points to `http://192.168.100.133:8000` for API requests

### Docker Configuration

**File**: `docker-compose.yml`

- Backend and frontend services are configured to accept connections from `0.0.0.0`
- Environment variables include the local network IP

## Accessing from iPhone

### Option 1: Direct Access (Recommended for Testing)
1. Ensure your iPhone is on the same WiFi network as your development machine
2. Open Safari on your iPhone
3. Navigate to: `http://192.168.100.133:3000`

### Option 2: Via Docker
If running with Docker:
```bash
npm run docker:up
```
Then access `http://192.168.100.133:3000` from your iPhone

### Option 3: Local Development
If running locally without Docker:

**Terminal 1 - Backend:**
```bash
cd backend
python manage.py runserver 0.0.0.0:8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Then access `http://192.168.100.133:3000` from your iPhone

## Troubleshooting

### Login Fails from iPhone

**Symptoms:**
- Login works on desktop but fails on iPhone
- CSRF errors in console
- 403 Forbidden responses

**Solutions:**

1. **Clear Browser Cache on iPhone**
   - Settings → Safari → Clear History and Website Data

2. **Check Network Connection**
   - Ensure iPhone and dev machine are on same WiFi
   - Verify you can ping `192.168.100.133` from iPhone (use network utility apps)

3. **Restart Development Servers**
   ```bash
   # If using Docker
   npm run docker:down
   npm run docker:up
   
   # If running locally
   # Stop both backend and frontend, then restart
   ```

4. **Check Firewall Settings**
   - Windows Firewall may block incoming connections
   - Allow Python and Node.js through firewall
   - Temporarily disable firewall to test

5. **Verify IP Address**
   - Your local IP may change if using DHCP
   - Check current IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
   - Update configuration files if IP changed

### CORS Errors

If you see CORS errors in the browser console:

1. Check that `CORS_ALLOW_ALL_ORIGINS = True` in `development.py`
2. Verify the origin is listed in `CORS_ALLOWED_ORIGINS`
3. Ensure `CORS_ALLOW_CREDENTIALS = True` is set

### Cookie Issues

If authentication cookies aren't being set:

1. Check browser console for cookie warnings
2. Verify `CSRF_COOKIE_SAMESITE = 'Lax'` in `development.py`
3. Ensure `CSRF_COOKIE_SECURE = False` for HTTP (development)
4. Check that `withCredentials: true` is set in axios config

## Security Notes

⚠️ **These settings are for DEVELOPMENT ONLY**

- `CORS_ALLOW_ALL_ORIGINS = True` should NEVER be used in production
- `CSRF_COOKIE_SECURE = False` should be `True` in production (HTTPS)
- Local network IPs should be removed from production configuration
- Always use environment variables for production settings

## Network Configuration

### Port Forwarding (Optional)
If you need to access from outside your local network:

1. Configure router port forwarding:
   - Forward external port 3000 → 192.168.100.133:3000 (Frontend)
   - Forward external port 8000 → 192.168.100.133:8000 (Backend)

2. Update configuration with your public IP

⚠️ **Warning**: Only do this in a secure, controlled environment. Never expose development servers to the public internet.

## Testing Checklist

- [ ] Can access frontend from iPhone: `http://192.168.100.133:3000`
- [ ] Can access backend health check: `http://192.168.100.133:8000/health/`
- [ ] Login works from iPhone
- [ ] CSRF token is properly set in cookies
- [ ] API requests work (check Network tab in Safari)
- [ ] WebSocket connections work (if using real-time features)
- [ ] Hot Module Replacement (HMR) works when editing files

## Hot Reloading Configuration

The Vite HMR is configured to work across your local network:

**Configuration in `vite.config.ts`:**
```javascript
hmr: {
  host: '192.168.100.133',  // Your network IP
  clientPort: 3000,
  protocol: 'ws',
}
```

**Testing HMR:**
1. Open the app in browser: `http://192.168.100.133:3000`
2. Edit any React component file
3. Save the file
4. Browser should update automatically without full refresh

**If HMR stops working:**
1. Check browser console for WebSocket connection errors
2. Verify the IP hasn't changed: `ipconfig`
3. Restart frontend container: `docker-compose restart frontend`
4. Check frontend logs: `docker-compose logs -f frontend`

## Additional Resources

- [Django CORS Headers Documentation](https://github.com/adamchainz/django-cors-headers)
- [Vite Server Options](https://vitejs.dev/config/server-options.html)
- [Django CSRF Protection](https://docs.djangoproject.com/en/stable/ref/csrf/)
