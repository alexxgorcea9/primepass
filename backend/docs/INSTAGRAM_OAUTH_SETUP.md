# Instagram OAuth Setup Guide

This guide walks you through setting up Instagram Basic Display API for PrimePass authentication.

## Important Notes

⚠️ **Instagram Basic Display API Limitations**:
- **No Email Access**: Instagram Basic Display API doesn't provide user email addresses
- **Personal Use**: Best for personal projects; for production apps consider Instagram Graph API
- **Deprecated**: Facebook is deprecating Basic Display API. Consider alternative authentication methods for new projects.

For production apps, we recommend:
1. Using Google or Apple Sign In (which provide emails)
2. Collecting email separately during onboarding
3. Or using Instagram as a social link (not primary auth)

## Prerequisites

- A [Facebook Developer Account](https://developers.facebook.com/)
- An Instagram account (for testing)
- Access to [Facebook App Dashboard](https://developers.facebook.com/apps/)

## Step 1: Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Select **Consumer** as the app type
4. Fill in app details:
   - **App Name**: PrimePass
   - **App Contact Email**: your@email.com
5. Click **Create App**

## Step 2: Add Instagram Basic Display Product

1. In your app dashboard, scroll to **Add Products**
2. Find **Instagram Basic Display** and click **Set Up**
3. Scroll down to **Basic Display** section
4. Click **Create New App** button
5. Accept the terms and click **Create App**

## Step 3: Configure OAuth Settings

1. In Instagram Basic Display settings, scroll to **User Token Generator**
2. Click **Add or Remove Instagram Testers**
3. Add your Instagram username as a tester
4. Go to your Instagram account and accept the tester invitation

5. Back in the app dashboard, configure OAuth:
   - **Valid OAuth Redirect URIs**:
     - Development: `http://localhost:5173/oauth/instagram/callback`
     - Production: `https://yourdomain.com/oauth/instagram/callback`
   - **Deauthorize Callback URL**: Leave empty for now
   - **Data Deletion Request URL**: Leave empty for now
6. Click **Save Changes**

## Step 4: Get Your Credentials

1. In the Instagram Basic Display settings, find:
   - **Instagram App ID** (this is your `INSTAGRAM_APP_ID`)
   - **Instagram App Secret** (click "Show" to reveal it)
2. Copy both values

## Step 5: Configure Backend Environment

Update your `.env` file with the Instagram credentials:

```bash
# ==============================================================================
# INSTAGRAM BASIC DISPLAY API CONFIGURATION
# ==============================================================================

# Instagram App ID (from Step 4)
INSTAGRAM_APP_ID=123456789012345

# Instagram App Secret (from Step 4)
INSTAGRAM_APP_SECRET=abc123def456ghi789jkl

# Redirect URI (must match what you configured in Step 3)
INSTAGRAM_REDIRECT_URI=http://localhost:5173/oauth/instagram/callback
```

**Security Note**: Never commit your App Secret to version control!

## Step 6: Test the Integration

### Development Testing

1. Restart your backend server:
   ```bash
   docker restart primepass_backend
   # or if running locally:
   python manage.py runserver
   ```

2. Open your frontend at `http://localhost:5173`

3. Navigate to Login or Signup page

4. Click the **Instagram** button

5. You should be redirected to Instagram's authorization page

6. Click **Authorize** to grant permissions

7. You'll be redirected back and logged in

### Important Limitations

**⚠️ No Email Address**
- Instagram doesn't provide email, so the app creates a synthetic email: `username@instagram.primepass.local`
- For production, you should:
  - Collect real email during profile setup
  - Or use Instagram as a secondary auth method only
  - Or require users to link another OAuth provider that provides email

**👥 Testing Accounts Only**
- During development, only Instagram accounts added as testers can authenticate
- To add testers:
  1. Go to **Roles** → **Instagram Testers** in Facebook App Dashboard
  2. Add Instagram usernames
  3. Users must accept the invitation in their Instagram app

### Troubleshooting

**Error: "Invalid redirect URI"**
- Check that `INSTAGRAM_REDIRECT_URI` exactly matches what's in Facebook App Dashboard
- Ensure there are no trailing slashes or typos
- Protocol must match (http:// for local, https:// for production)

**Error: "User not authorized as tester"**
- Add the Instagram account as a tester in Facebook App Dashboard
- User must accept the tester invitation in Instagram app
- Only works for accounts with tester access during development

**Error: "Failed to get user information"**
- Verify `INSTAGRAM_APP_ID` and `INSTAGRAM_APP_SECRET` are correct
- Check that the app is not in Development Mode restrictions
- Ensure the user granted permissions

**Backend logs location**
```bash
docker logs primepass_backend
```

## Production Deployment

⚠️ **Important Considerations for Production**:

### 1. App Review (Required for Public Access)

If you want non-tester accounts to use Instagram auth:
1. Submit your app for **App Review** in Facebook Dashboard
2. Provide:
   - Privacy Policy URL
   - Terms of Service URL
   - App description and usage details
3. Complete the review process (can take several days)

### 2. Update Configuration

When deploying to production:

1. **Update Facebook App Settings**:
   - Add production domain to Valid OAuth Redirect URIs
   - Example: `https://yourdomain.com/oauth/instagram/callback`
   - Update App Domains in Settings → Basic

2. **Update Environment Variables**:
   ```bash
   INSTAGRAM_REDIRECT_URI=https://yourdomain.com/oauth/instagram/callback
   ```

3. **Use HTTPS**:
   - Instagram OAuth requires HTTPS in production
   - Obtain SSL certificate for your domain

### 3. Handle Email Collection

Since Instagram doesn't provide emails, implement one of these strategies:

**Option A**: Collect email during onboarding
```python
# After Instagram auth, redirect to email collection page
if user.email.endswith('@instagram.primepass.local'):
    # Show email collection form
    # Update user.email with real email
```

**Option B**: Require alternate sign-in method
```
- "Sign in with Instagram"
- Then: "Please also connect Google/Apple to complete your account"
```

**Option C**: Make Instagram optional
```
- Primary auth: Google, Apple, Email/Password
- Instagram: Link account for social features only
```

## How Instagram OAuth Works

### Flow Overview

```
┌─────────┐            ┌──────────┐            ┌─────────┐            ┌───────────┐
│ Browser │            │ Frontend │            │ Backend │            │ Instagram │
└────┬────┘            └────┬─────┘            └────┬────┘            └─────┬─────┘
     │                      │                       │                       │
     │  Click "Instagram"   │                       │                       │
     ├─────────────────────>│                       │                       │
     │                      │  GET /api/auth/instagram/                     │
     │                      ├──────────────────────>│                       │
     │                      │  Returns auth_url     │                       │
     │                      │<──────────────────────┤                       │
     │  Redirect to Instagram                       │                       │
     │<─────────────────────┤                       │                       │
     │                      │                       │                       │
     │  User authorizes app                         │                       │
     ├──────────────────────────────────────────────┴──────────────────────>│
     │                      │                       │                       │
     │  Redirect with code                          │                       │
     │<─────────────────────────────────────────────┴───────────────────────┤
     │                      │                       │                       │
     │  /oauth/instagram/callback                   │                       │
     ├─────────────────────>│                       │                       │
     │                      │  POST /api/auth/instagram/callback/           │
     │                      │  { code, state }      │                       │
     │                      ├──────────────────────>│                       │
     │                      │                       │  Exchange code        │
     │                      │                       ├──────────────────────>│
     │                      │                       │  Returns access_token │
     │                      │                       │<──────────────────────┤
     │                      │                       │  Fetch profile        │
     │                      │                       ├──────────────────────>│
     │                      │                       │  Returns username, id │
     │                      │                       │<──────────────────────┤
     │                      │  Returns user + tokens│                       │
     │                      │<──────────────────────┤                       │
     │  Authenticated!      │                       │                       │
     │<─────────────────────┤                       │                       │
```

### Available User Data

Instagram Basic Display API provides:
- ✅ **id**: Instagram user ID
- ✅ **username**: Instagram username
- ✅ **account_type**: PERSONAL, BUSINESS, or CREATOR
- ✅ **media_count**: Number of media items
- ❌ **email**: Not available
- ❌ **name**: Not available
- ❌ **profile_picture**: Not available in Basic Display (use Graph API)

## Alternative: Instagram Graph API

For production apps with business accounts, consider Instagram Graph API:

**Pros**:
- Access to more data (profile pictures, insights)
- Better for business/creator accounts
- More stable API

**Cons**:
- Requires Facebook Business account
- More complex setup
- Requires App Review
- Still no email access

## Migration from Basic Display

If you're currently using Basic Display and want to migrate:

1. Instagram Basic Display is being deprecated
2. Migrate to alternative auth methods:
   - Google Sign In (provides email)
   - Apple Sign In (provides email)
   - Email/Password (native auth)
3. Keep Instagram as optional social connection only

## Security Best Practices

1. **Validate State Parameter**: Always verify state to prevent CSRF
2. **Secure Credentials**: Store App Secret in environment variables
3. **Use HTTPS**: Required for production
4. **Handle Email Collection**: Implement proper email collection flow
5. **Rate Limiting**: Already implemented in backend
6. **Token Storage**: HTTP-only cookies for session tokens

## Resources

- [Instagram Basic Display API Documentation](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Facebook App Dashboard](https://developers.facebook.com/apps/)
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api) (Alternative)

## Recommendation

For new implementations, we recommend:

1. **Primary Auth**: Use Google or Apple Sign In (they provide emails)
2. **Instagram**: Use as social connection/link only, not primary auth
3. **Email Collection**: Always collect and verify user emails

Instagram OAuth is best suited for social features rather than primary authentication due to lack of email access.

## Support

If you encounter issues:

1. Check backend logs: `docker logs primepass_backend`
2. Verify credentials in Facebook App Dashboard
3. Ensure user is added as tester (for development)
4. Check redirect URI matches exactly
5. Review Facebook App status (not restricted/disabled)
