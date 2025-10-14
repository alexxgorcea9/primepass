# PrimePass - High-Ticket Event Management Platform

A comprehensive monorepo for managing high-ticket events with advanced features including real-time notifications, tier-based access control, and sophisticated event management capabilities.

## 🏗️ Architecture

This is a modern monorepo built with:

- **Backend**: Django REST Framework with Redis caching, JWT authentication, and PgBouncer connection pooling
- **Frontend**: React with Vite, TypeScript, React Query, Framer Motion, and Tailwind CSS
- **Database**: PostgreSQL with PgBouncer connection pooling
- **Cache**: Redis for caching and real-time features
- **Infrastructure**: Docker Compose for local development

## 📁 Project Structure

```
primepass/
├── package.json                    # Root workspace configuration
├── docker-compose.yml              # Docker services setup
├── .env                           # Environment variables
├── tsconfig.json                  # Root TypeScript config
├── .eslintrc.js                   # ESLint configuration
├── .prettierrc                    # Prettier configuration
│
├── backend/                       # Django backend
│   ├── backend/                   # Django project settings
│   │   └── settings/              # Modular settings (base, dev, prod)
│   ├── apps/                      # Django applications
│   ├── requirements.txt           # Python dependencies
│   └── Dockerfile                 # Backend container config
│
├── frontend/                      # React frontend
│   ├── src/                       # Source code
│   │   ├── components/            # Reusable components
│   │   ├── pages/                 # Page components
│   │   ├── services/              # API services
│   │   ├── store/                 # State management
│   │   └── types/                 # TypeScript types
│   ├── vite.config.ts             # Vite configuration
│   └── Dockerfile                 # Frontend container config
│
├── packages/                      # Shared packages
│   └── shared/                    # Shared types and utilities
│
├── docs/                          # Documentation
├── scripts/                       # Build and deployment scripts
└── deployment/                    # Deployment configurations
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose
- Python 3.11+ (for local development only)
- PostgreSQL 15+ (for local development only)
- Redis 7+ (for local development only)

### New Developer Setup

**Get up and running in 3 steps:**

```bash
# 1. Clone and install dependencies
git clone <repository-url>
cd primepass
npm install

# 2. Start development environment (includes database, Redis, backend, frontend)
npm run docker:up

# 3. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
```

**That's it!** For detailed setup including Google OAuth, see [docs/SETUP.md](./docs/SETUP.md).

### Development Options

**Option 1: Docker Development (Recommended)**
```bash
# Start all services (database, Redis, backend, frontend)
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

**Option 2: Local Development (Faster hot reload)**
```bash
# Start backend and frontend locally (requires local Python/Node setup)
npm run dev

# Access at:
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

### Ports Reference

- **Frontend**: http://localhost:3000 (Vite dev server)
- **Backend**: http://localhost:8000 (Django)
- **Database**: localhost:5432 (PostgreSQL)
- **PgBouncer**: localhost:6432 (Connection pooling)
- **Redis**: localhost:6379 (Cache/sessions)

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev                    # Start both backend and frontend
npm run dev:backend           # Start Django development server
npm run dev:frontend          # Start Vite development server

# Building
npm run build                 # Build all packages
npm run build:backend         # Build backend
npm run build:frontend        # Build frontend
npm run build:shared          # Build shared packages

# Testing
npm run test                  # Run all tests
npm run test:backend          # Run Django tests
npm run test:frontend         # Run React tests

# Code Quality
npm run lint                  # Lint all packages
npm run lint:fix              # Fix linting issues
npm run format                # Format code with Prettier
npm run type-check            # TypeScript type checking

# Database
npm run migrate               # Run Django migrations
npm run seed                  # Seed database with sample data

# Docker
npm run docker:up             # Start Docker services
npm run docker:down           # Stop Docker services
npm run docker:build          # Rebuild Docker images
```

### Backend Development

The Django backend uses a modular settings structure:

- `backend/settings/base.py` - Base configuration
- `backend/settings/development.py` - Development settings
- `backend/settings/production.py` - Production settings

Key features:
- JWT authentication with role-based access control
- Redis caching for events, notifications, and waves
- Real-time notifications via WebSockets
- Event management with tiers, waves, and privileges
- PgBouncer connection pooling

### Database Management

The project uses **PostgreSQL with Docker** for automated database setup and **Django ORM** for data modeling. Your database persists between development sessions via Docker volumes.

#### Database Setup

The database is **automatically created** when you start Docker:
- **Database**: `primepass_db`
- **User**: `primepass_user`
- **Password**: `primepass_password`
- **Host**: `localhost:5432`

No manual database creation needed - everything is configured in your `.env` file.

#### Django Apps Structure

Django models are organized in the `backend/apps/` directory:
```
backend/apps/
├── auth/           # User authentication and permissions
└── [your-apps]/    # Add new apps here
```

#### Creating Models and Migrations

**Option 1: Using Virtual Environment (Recommended)**
```bash
# Activate virtual environment
venv\Scripts\activate

# Navigate to backend
cd backend

# Create new Django app
python manage.py startapp your_app_name apps/your_app_name

# Edit models in apps/your_app_name/models.py
# Then create and apply migrations:
python manage.py makemigrations
python manage.py migrate
```

**Option 2: Using npm Scripts**
```bash
# Create migrations
npm run makemigrations --workspace=backend

# Apply migrations
npm run migrate --workspace=backend
```

**Option 3: Using Docker Container**
```bash
# Create migrations
docker exec -it primepass_backend python manage.py makemigrations

# Apply migrations
docker exec -it primepass_backend python manage.py migrate
```

#### Common Database Operations

**Create Superuser**
```bash
# Local venv
python manage.py createsuperuser

# Docker
docker exec -it primepass_backend python manage.py createsuperuser
```

**Access Django Shell**
```bash
# Local venv
python manage.py shell

# Docker
docker exec -it primepass_backend python manage.py shell
```

**Access PostgreSQL Directly**
```bash
# From host machine
psql -h localhost -p 5432 -U primepass_user -d primepass_db

# From Docker container
docker exec -it primepass_postgres psql -U primepass_user -d primepass_db
```

**View Migration Status**
```bash
python manage.py showmigrations
```

#### Data Persistence

- ✅ **Database data persists** between Docker restarts
- ✅ **Migrations are permanent** once applied
- ✅ **User data and uploads persist** via Docker volumes

**Reset Database (if needed)**
```bash
# Stop Docker and remove volumes (WARNING: deletes all data)
docker-compose down -v

# Start fresh
npm run docker:up
```

#### Migration Best Practices

1. **Always create migrations** after model changes
2. **Review migration files** before applying them
3. **Test migrations** on development data first
4. **Backup important data** before major schema changes
5. **Use descriptive migration names**: `python manage.py makemigrations --name add_user_profile`

### Frontend Development

The React frontend is built with modern tools:

- **Vite** for fast development and building
- **TypeScript** for type safety
- **React Query** for server state management
- **Framer Motion** for animations
- **Tailwind CSS** for styling

Path aliases are configured for clean imports:
- `@shared/*` - Shared packages
- `@components/*` - React components
- `@pages/*` - Page components
- `@services/*` - API services
- `@utils/*` - Utility functions
- `@hooks/*` - Custom hooks
- `@store/*` - State management
- `@types/*` - TypeScript types

## 🌿 Git Workflow - Feature Branching Strategy

This project uses **Feature Branching** workflow for team collaboration. Follow these guidelines strictly to maintain code quality and project stability.

### Branch Structure

- **`main`** - Production-ready code, always stable and deployable
- **`feature/*`** - New features and enhancements
- **`bugfix/*`** - Bug fixes and corrections
- **`hotfix/*`** - Critical production fixes
- **`chore/*`** - Maintenance tasks, refactoring, documentation

### Workflow Steps

#### 1. Starting New Work

```bash
# Always start from latest main
git checkout main
git pull origin main

# Create feature branch with descriptive name
git checkout -b feature/user-authentication
git checkout -b bugfix/login-validation
git checkout -b hotfix/security-patch
git checkout -b chore/update-dependencies
```

#### 2. Development Process

```bash
# Work on your feature, make regular commits
git add .
git commit -m "feat: add user login functionality"

# Push feature branch to remote
git push origin feature/user-authentication

# Keep your branch updated with main (recommended daily)
git checkout main
git pull origin main
git checkout feature/user-authentication
git merge main  # or git rebase main
```

#### 3. Code Review Process

```bash
# When feature is complete, create Pull Request (PR)
# 1. Push final changes
git push origin feature/user-authentication

# 2. Create PR on GitHub/GitLab targeting 'main' branch
# 3. Request code review from team member
# 4. Address review feedback if needed
# 5. Wait for approval before merging
```

#### 4. Merging and Cleanup

```bash
# After PR is approved and merged:
git checkout main
git pull origin main

# Delete local feature branch
git branch -d feature/user-authentication

# Delete remote feature branch (if not auto-deleted)
git push origin --delete feature/user-authentication
```

### Branch Naming Conventions

**Use clear, descriptive names with prefixes:**

```bash
# Features
feature/user-profile-page
feature/event-registration-system
feature/payment-integration

# Bug fixes
bugfix/login-redirect-issue
bugfix/event-date-validation
bugfix/email-template-formatting

# Hotfixes (urgent production issues)
hotfix/security-vulnerability
hotfix/payment-gateway-error

# Maintenance
chore/update-dependencies
chore/refactor-auth-service
chore/add-api-documentation
```

### Commit Message Guidelines

**Use conventional commit format:**

```bash
# Format: type(scope): description
feat(auth): add JWT token refresh functionality
fix(events): resolve date validation bug
docs(readme): update setup instructions
chore(deps): update React to v18
style(frontend): fix linting issues
refactor(backend): simplify user service
test(auth): add login integration tests
```

### Code Review Checklist

**Before creating PR:**
- ✅ Code follows project style guidelines
- ✅ All tests pass locally
- ✅ Feature works in both Docker and local development
- ✅ Database migrations included (if needed)
- ✅ Documentation updated (if needed)
- ✅ No sensitive data committed

**During review:**
- ✅ Code is readable and well-commented
- ✅ Follows established patterns
- ✅ No security vulnerabilities
- ✅ Performance considerations addressed
- ✅ Error handling implemented

### Emergency Hotfix Process

**For critical production issues:**

```bash
# Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-security-fix

# Make minimal changes to fix issue
git add .
git commit -m "hotfix: patch security vulnerability"
git push origin hotfix/critical-security-fix

# Create PR with "URGENT" label
# Get immediate review and merge
# Deploy to production immediately after merge
```

### Best Practices

1. **Keep branches small and focused** - One feature per branch
2. **Regular commits** - Commit early and often with clear messages
3. **Stay updated** - Merge main into your branch regularly
4. **Test before PR** - Ensure everything works locally
5. **Descriptive PRs** - Include what, why, and how in PR description
6. **Review thoroughly** - Take code reviews seriously
7. **Clean history** - Use `git rebase -i` to clean up commits before PR

### Prohibited Actions

❌ **Never commit directly to main branch**
❌ **Never force push to shared branches**
❌ **Never merge without code review**
❌ **Never commit sensitive data (.env files, keys, passwords)**
❌ **Never leave broken code in main branch**

## 🏭 Production Deployment

### Environment Variables

Key production environment variables:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://host:port/db

# Security
SECRET_KEY=your-production-secret-key
JWT_SECRET_KEY=your-jwt-secret-key
DEBUG=False
ALLOWED_HOSTS=yourdomain.com

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

### Docker Production Build

```bash
# Build production images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 📊 Features

### Event Management
- Create and manage high-ticket events
- Tier-based pricing and access control
- Wave-based registration system
- Advanced privilege management

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Social authentication support
- Multi-factor authentication ready

### Real-time Features
- WebSocket notifications
- Live event updates
- Real-time attendee management
- Event chat and messaging

### Performance
- Redis caching for frequently accessed data
- PgBouncer connection pooling
- Optimized database queries
- CDN-ready static file serving

### Developer Experience
- TypeScript throughout the stack
- Comprehensive testing setup
- Code formatting and linting
- Hot reload in development
- Docker development environment

## 🧪 Testing

```bash
# Run all tests
npm run test

# Backend tests
cd backend && python manage.py test

# Frontend tests
cd frontend && npm run test

# E2E tests
npm run test:e2e
```

## 📚 Documentation

- **[Setup Guide](./docs/SETUP.md)** - Complete setup instructions including Google OAuth
- **[Deployment Guide](./docs/deployment.md)** - Production deployment instructions
- **[Security Documentation](./docs/SECURITY.md)** - Security features and best practices
- [API Documentation](./docs/api.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Create an issue in the GitHub repository
- Check the documentation in the docs/ folder

---

Built with ❤️ by the PrimePass Team