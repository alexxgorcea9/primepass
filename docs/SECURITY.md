# PrimePass Security Documentation

## 🔒 Security Features

PrimePass implements enterprise-grade security practices for production deployment.

---

## Authentication & Authorization

### JWT Token Management
- **Access Tokens**: 15-minute lifetime, HttpOnly cookies
- **Refresh Tokens**: 7-day lifetime with rotation enabled
- **Token Storage**: Secure HttpOnly cookies (SameSite=Lax)
- **Token Blacklisting**: Logout revokes tokens immediately

### Password Security
- **Minimum Length**: 12 characters
- **Complexity Requirements**:
  - UserAttributeSimilarityValidator
  - CommonPasswordValidator  
  - NumericPasswordValidator
- **Hashing**: Django's PBKDF2 algorithm

### OAuth Integration
- **Google Sign-In**: PKCE flow with state validation
- **Apple Sign In**: Configured (disabled by default)
- **Instagram OAuth**: Configured (disabled by default)
- **Email Verification**: OAuth providers mark emails as verified

---

## Protection Mechanisms

### Rate Limiting
- **Signup**: 3 attempts/hour per IP, 3 attempts/day per email
- **Login**: 5 attempts/minute per IP, 5 attempts/hour per email
- **Email Verification**: 3 resends/hour per IP, 3 resends/day per email

### Brute Force Protection (Django Axes)
- **Lock Threshold**: 5 failed attempts
- **Lockout Duration**: 1 hour
- **Tracking**: Combined user + IP address
- **Notification**: Email alert sent on account lockout

### CSRF Protection
- **Token-based**: Django's built-in CSRF middleware
- **Cookie Settings**: HttpOnly=False (JS needs to read), Secure in production
- **Trusted Origins**: Configured for frontend domain
- **Dedicated Endpoint**: `/api/auth/csrf/` for token retrieval

---

## Data Security

### Session Management
- **Cache Backend**: Redis-based sessions
- **Cookie Security**:
  - Secure=True (production HTTPS only)
  - HttpOnly=True (prevents XSS)
  - SameSite=Lax (CSRF protection)
- **Logout**: Single device and all-devices logout options
- **Cache Invalidation**: Automatic on logout and profile updates

### Email Verification
- **Token Generation**: `secrets.token_urlsafe(32)` (cryptographically secure)
- **Token Expiry**: 24 hours
- **One-Time Use**: Tokens deleted after verification
- **User Notifications**: Welcome email on signup, confirmation on verification

---

## Production Security Settings

### HTTPS & Headers
```python
# Enforced in production
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
```

### Cookie Security
```python
SESSION_COOKIE_SECURE = True       # HTTPS only
SESSION_COOKIE_HTTPONLY = True     # No JS access
SESSION_COOKIE_SAMESITE = 'Lax'    # CSRF protection
CSRF_COOKIE_SECURE = True          # HTTPS only
CSRF_COOKIE_HTTPONLY = False       # JS needs to read
```

### CORS Configuration
```python
CORS_ALLOW_ALL_ORIGINS = False     # Whitelist only
CORS_ALLOW_CREDENTIALS = True      # Allow cookies
# Production: Only your domain allowed
CORS_ALLOWED_ORIGINS = ['https://yourdomain.com']
```

---

## Database & Caching Security

### PostgreSQL
- **Connection Pooling**: PgBouncer (6432)
- **SSL Mode**: Required in production
- **Authentication**: Strong passwords, restricted access
- **Backup**: Automated backups recommended

### Redis
- **Authentication**: Password-protected
- **Network**: Bind to localhost or private network only
- **Persistence**: RDB snapshots enabled
- **Data Encryption**: TLS in production

---

## Sensitive Data Handling

### Environment Variables
```bash
# NEVER commit to git
SECRET_KEY=<django-secret>
JWT_SECRET_KEY=<jwt-secret>
DATABASE_PASSWORD=<db-password>
GOOGLE_CLIENT_SECRET=<oauth-secret>
SENDGRID_API_KEY=<email-api-key>
```

### .gitignore Protection
```gitignore
# Secrets
.env
backend/.env
*.key
*.pem

# Sensitive data
/media/
/logs/
*.log
```

### File Uploads
- **Storage**: AWS S3 in production (encrypted at rest)
- **Validation**: File type and size restrictions
- **Permissions**: Private by default, signed URLs for access

---

## API Security

### Authentication Required
All API endpoints (except public auth endpoints) require valid JWT token.

### CORS Restrictions
- Production: Only your domain allowed
- Development: localhost:3000 only
- No wildcard origins in production

### Input Validation
- Django REST Framework serializers validate all input
- SQL injection protection via ORM
- XSS protection via template escaping

---

## Monitoring & Logging

### Error Tracking
```python
# Sentry integration for production
SENTRY_DSN = config('SENTRY_DSN')
# Tracks:
# - Exceptions and errors
# - Performance issues
# - Security incidents
```

### Audit Logging
```python
# Structured logging for security events
logger.info(f"User logged in: {user.email}")
logger.warning(f"Failed login attempt: {email}")
logger.warning(f"Account locked: {email}")
```

### Log Levels
- **INFO**: Normal operations (login, signup)
- **WARNING**: Suspicious activity (failed logins, rate limits)
- **ERROR**: System errors
- **CRITICAL**: Security incidents

---

## Security Audit Results

### ✅ Production Ready (All Fixed)

| Security Aspect | Status | Notes |
|-----------------|--------|-------|
| Password Validation | ✅ Fixed | 12 char minimum, complexity rules |
| JWT Configuration | ✅ Fixed | 15-min access tokens, proper expiry |
| CSRF Protection | ✅ Fixed | Properly configured for cookies |
| Rate Limiting | ✅ Implemented | Comprehensive on auth endpoints |
| Brute Force Protection | ✅ Implemented | 5 attempts = 1 hour lockout |
| Token Blacklisting | ✅ Implemented | Logout revokes tokens |
| Email Verification | ✅ Implemented | 24-hour secure tokens |
| OAuth Security | ✅ Secured | PKCE, state validation |
| Session Management | ✅ Secured | Redis, secure cookies |
| Security Headers | ✅ Configured | HSTS, XSS, CSP ready |

### 🔐 Security Features Implemented
1. ✅ Password validators (12+ chars, complexity)
2. ✅ JWT token rotation with blacklisting
3. ✅ Rate limiting on sensitive endpoints
4. ✅ Account lockout with email notifications
5. ✅ CSRF protection for cookie-based auth
6. ✅ Email verification with secure tokens
7. ✅ OAuth PKCE flow with state validation
8. ✅ Secure cookie settings (HttpOnly, Secure, SameSite)
9. ✅ User cache with automatic invalidation
10. ✅ Production security headers (HSTS, etc.)

---

## Security Best Practices

### Development
- Use strong unique secrets (never use defaults)
- Keep dependencies updated (`npm audit`, `safety check`)
- Review code before committing
- Never commit `.env` files

### Production
- Use HTTPS everywhere (enforce with HSTS)
- Enable Sentry or similar monitoring
- Regular security audits
- Automated backups
- Separate OAuth credentials from development
- Strong database passwords
- Restrict network access (firewall rules)

### Team
- Code review all PRs
- Security training for developers
- Incident response plan
- Regular dependency updates
- Security patches applied immediately

---

## Incident Response

### If Credentials Leaked
1. **Immediately revoke** compromised credentials
2. **Rotate secrets**: Generate new SECRET_KEY, JWT_SECRET_KEY
3. **Check logs** for unauthorized access
4. **Notify users** if data was accessed
5. **Update** all affected systems
6. **Document** incident and response

### If Attack Detected
1. **Review logs** for attack patterns
2. **Block IPs** if necessary (firewall/Cloudflare)
3. **Check database** for unauthorized changes
4. **Rotate tokens** if compromise suspected
5. **Notify team** and affected users
6. **Patch vulnerability** immediately

---

## Compliance Considerations

### Data Protection
- **GDPR**: User data export and deletion on request
- **Password Storage**: Industry-standard hashing (PBKDF2)
- **Data Minimization**: Only collect necessary data
- **User Consent**: Clear terms and privacy policy

### Audit Trail
- Authentication events logged
- Failed login attempts tracked
- Account changes logged
- Admin actions recorded

---

## Security Checklist for Deployment

### Pre-Deployment
- [ ] All environment variables set with strong values
- [ ] OAuth credentials regenerated for production
- [ ] Database password is strong and unique
- [ ] Redis password set
- [ ] HTTPS configured with valid SSL certificate
- [ ] Security headers enabled
- [ ] Debug mode disabled (`DEBUG=False`)
- [ ] Sentry or monitoring configured
- [ ] Backup strategy in place

### Post-Deployment
- [ ] Test authentication flows
- [ ] Verify HTTPS redirect works
- [ ] Check security headers (securityheaders.com)
- [ ] Test rate limiting
- [ ] Verify CORS settings
- [ ] Test email sending
- [ ] Monitor logs for errors
- [ ] Run security scan (OWASP ZAP)

---

## Security Updates

This documentation reflects security implementations as of October 2025. Regular security audits and updates are recommended.

**For security concerns, create a private GitHub issue or contact the team directly.**
