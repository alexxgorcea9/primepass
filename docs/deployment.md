# Deployment Guide

This guide covers deploying PrimePass to various environments including development, staging, and production.

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ and npm 9+
- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Domain name and SSL certificates (for production)

## Environment Setup

### 1. Environment Variables

Copy the environment template and configure for your environment:

```bash
cp .env .env.production
```

Key production variables to configure:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://host:port/db

# Security
SECRET_KEY=your-production-secret-key-min-50-chars
JWT_SECRET_KEY=your-jwt-secret-key-min-50-chars
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Email
EMAIL_BACKEND=anymail.backends.sendgrid.EmailBackend
SENDGRID_API_KEY=your-sendgrid-api-key
DEFAULT_FROM_EMAIL=noreply@yourdomain.com

# Storage (if using AWS S3)
USE_S3=True
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_STORAGE_BUCKET_NAME=your-bucket-name
AWS_S3_REGION_NAME=us-east-1

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

## Docker Deployment

### Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production

1. Create production Docker Compose file:

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: production
    environment:
      - DJANGO_SETTINGS_MODULE=backend.settings.production
    volumes:
      - static_volume:/app/staticfiles
      - media_volume:/app/media

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: production
    volumes:
      - frontend_build:/app/dist

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./deployment/nginx/nginx.prod.conf:/etc/nginx/nginx.conf
      - ./deployment/ssl:/etc/ssl/certs
      - static_volume:/var/www/static
      - media_volume:/var/www/media
      - frontend_build:/var/www/html

volumes:
  static_volume:
  media_volume:
  frontend_build:
```

2. Deploy:

```bash
# Build and start production services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Run migrations
docker-compose exec backend python manage.py migrate

# Collect static files
docker-compose exec backend python manage.py collectstatic --noinput

# Create superuser
docker-compose exec backend python manage.py createsuperuser
```

## Manual Deployment

### Backend Deployment

1. **Prepare the server:**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y python3.11 python3.11-venv python3-pip postgresql-client redis-tools nginx

# Create application user
sudo useradd -m -s /bin/bash primepass
sudo mkdir -p /var/www/primepass
sudo chown primepass:primepass /var/www/primepass
```

2. **Deploy backend:**

```bash
# Switch to app user
sudo su - primepass

# Clone repository
git clone <repository-url> /var/www/primepass
cd /var/www/primepass

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
cd backend
pip install -r requirements.txt

# Configure environment
cp ../.env.production .env

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Create superuser
python manage.py createsuperuser
```

3. **Setup Gunicorn:**

```bash
# Create Gunicorn configuration
cat > /var/www/primepass/backend/gunicorn.conf.py << EOF
bind = "127.0.0.1:8000"
workers = 4
worker_class = "gevent"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
timeout = 30
keepalive = 2
preload_app = True
EOF

# Create systemd service
sudo tee /etc/systemd/system/primepass-backend.service << EOF
[Unit]
Description=PrimePass Backend
After=network.target

[Service]
User=primepass
Group=primepass
WorkingDirectory=/var/www/primepass/backend
Environment=PATH=/var/www/primepass/venv/bin
ExecStart=/var/www/primepass/venv/bin/gunicorn --config gunicorn.conf.py backend.wsgi:application
ExecReload=/bin/kill -s HUP \$MAINPID
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl enable primepass-backend
sudo systemctl start primepass-backend
```

### Frontend Deployment

1. **Build frontend:**

```bash
cd /var/www/primepass/frontend

# Install dependencies
npm ci

# Build for production
npm run build
```

2. **Configure Nginx:**

```bash
# Create Nginx configuration
sudo tee /etc/nginx/sites-available/primepass << EOF
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/ssl/certs/yourdomain.com.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Frontend
    location / {
        root /var/www/primepass/frontend/dist;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Backend Admin
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Static files
    location /static/ {
        alias /var/www/primepass/backend/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Media files
    location /media/ {
        alias /var/www/primepass/backend/media/;
        expires 1y;
        add_header Cache-Control "public";
    }
    
    # WebSocket
    location /ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/primepass /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Cloud Deployment

### AWS Deployment

1. **Setup RDS (PostgreSQL):**
   - Create RDS PostgreSQL instance
   - Configure security groups
   - Update DATABASE_URL in environment

2. **Setup ElastiCache (Redis):**
   - Create Redis cluster
   - Configure security groups
   - Update REDIS_URL in environment

3. **Setup S3 for static/media files:**
   - Create S3 bucket
   - Configure CORS and bucket policy
   - Update AWS credentials in environment

4. **Deploy with ECS or EC2:**
   - Use provided Docker configurations
   - Setup load balancer
   - Configure auto-scaling

### Heroku Deployment

1. **Prepare for Heroku:**

```bash
# Create Procfile
echo "web: gunicorn --chdir backend backend.wsgi:application" > Procfile
echo "worker: celery -A backend worker -l info" >> Procfile
echo "beat: celery -A backend beat -l info" >> Procfile

# Create runtime.txt
echo "python-3.11.0" > runtime.txt
```

2. **Deploy:**

```bash
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Add buildpacks
heroku buildpacks:add heroku/nodejs
heroku buildpacks:add heroku/python

# Add addons
heroku addons:create heroku-postgresql:hobby-dev
heroku addons:create heroku-redis:hobby-dev

# Set environment variables
heroku config:set DJANGO_SETTINGS_MODULE=backend.settings.production
heroku config:set SECRET_KEY=your-secret-key

# Deploy
git push heroku main

# Run migrations
heroku run python backend/manage.py migrate
```

## Database Migrations

### Production Migration Strategy

1. **Backup database:**

```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

2. **Run migrations:**

```bash
# Test migrations on staging first
python manage.py migrate --dry-run

# Run migrations
python manage.py migrate

# Verify migration
python manage.py showmigrations
```

3. **Rollback if needed:**

```bash
# Rollback to specific migration
python manage.py migrate app_name 0001

# Restore from backup if necessary
psql $DATABASE_URL < backup_file.sql
```

## Monitoring and Logging

### Setup Monitoring

1. **Application Performance Monitoring:**
   - Configure Sentry for error tracking
   - Setup New Relic or DataDog for performance monitoring
   - Configure health checks

2. **Infrastructure Monitoring:**
   - Setup CloudWatch (AWS) or equivalent
   - Monitor CPU, memory, disk usage
   - Setup alerts for critical metrics

3. **Log Management:**
   - Centralize logs with ELK stack or similar
   - Configure log rotation
   - Setup log alerts

### Health Checks

The application includes health check endpoints:

```bash
# Check application health
curl https://yourdomain.com/api/v1/health/

# Check database connectivity
curl https://yourdomain.com/api/v1/health/db/

# Check cache connectivity
curl https://yourdomain.com/api/v1/health/cache/
```

## SSL/TLS Configuration

### Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Backup and Recovery

### Automated Backups

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/primepass"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump $DATABASE_URL > $BACKUP_DIR/db_backup_$DATE.sql

# Backup media files
tar -czf $BACKUP_DIR/media_backup_$DATE.tar.gz /var/www/primepass/backend/media/

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/db_backup_$DATE.sql s3://your-backup-bucket/
aws s3 cp $BACKUP_DIR/media_backup_$DATE.tar.gz s3://your-backup-bucket/

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

### Recovery Process

```bash
# Restore database
psql $DATABASE_URL < backup_file.sql

# Restore media files
tar -xzf media_backup.tar.gz -C /var/www/primepass/backend/

# Restart services
sudo systemctl restart primepass-backend
sudo systemctl restart nginx
```

## Troubleshooting

### Common Issues

1. **Static files not loading:**
   - Check STATIC_ROOT and STATIC_URL settings
   - Run `python manage.py collectstatic`
   - Verify Nginx configuration

2. **Database connection errors:**
   - Check DATABASE_URL format
   - Verify database server is running
   - Check firewall rules

3. **Redis connection errors:**
   - Verify REDIS_URL format
   - Check Redis server status
   - Verify network connectivity

4. **SSL certificate issues:**
   - Check certificate expiration
   - Verify certificate chain
   - Check Nginx SSL configuration

### Log Locations

```bash
# Application logs
/var/log/primepass/

# Nginx logs
/var/log/nginx/access.log
/var/log/nginx/error.log

# System logs
journalctl -u primepass-backend
journalctl -u nginx
```

## Performance Optimization

### Database Optimization

- Enable connection pooling with PgBouncer
- Configure appropriate database indexes
- Monitor slow queries
- Setup read replicas for high traffic

### Caching Strategy

- Use Redis for session storage
- Implement page caching for static content
- Cache API responses with appropriate TTL
- Use CDN for static assets

### Frontend Optimization

- Enable gzip compression
- Optimize images and assets
- Implement lazy loading
- Use service workers for caching

## Security Checklist

- [ ] Use HTTPS everywhere
- [ ] Configure security headers
- [ ] Enable CSRF protection
- [ ] Setup rate limiting
- [ ] Regular security updates
- [ ] Monitor for vulnerabilities
- [ ] Backup encryption
- [ ] Access logging
- [ ] Firewall configuration
- [ ] Database security
