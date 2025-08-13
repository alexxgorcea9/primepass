#!/bin/bash

# PrimePass Build Script
# This script builds all components of the monorepo for production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Parse command line arguments
ENVIRONMENT="production"
SKIP_TESTS=false
SKIP_LINT=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-lint)
            SKIP_LINT=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --env <environment>    Set environment (default: production)"
            echo "  --skip-tests          Skip running tests"
            echo "  --skip-lint           Skip linting"
            echo "  -h, --help            Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo "🏗️  Building PrimePass for $ENVIRONMENT environment..."

# Clean previous builds
print_status "Cleaning previous builds..."
npm run clean
rm -rf backend/staticfiles/*
rm -rf frontend/dist/*

# Install dependencies
print_status "Installing dependencies..."
npm ci

# Type checking
if [ "$SKIP_LINT" = false ]; then
    print_status "Running type checks..."
    npm run type-check
    
    if [ $? -eq 0 ]; then
        print_success "Type checking passed"
    else
        print_error "Type checking failed"
        exit 1
    fi
fi

# Linting
if [ "$SKIP_LINT" = false ]; then
    print_status "Running linting..."
    npm run lint
    
    if [ $? -eq 0 ]; then
        print_success "Linting passed"
    else
        print_error "Linting failed"
        exit 1
    fi
fi

# Run tests
if [ "$SKIP_TESTS" = false ]; then
    print_status "Running tests..."
    npm run test
    
    if [ $? -eq 0 ]; then
        print_success "All tests passed"
    else
        print_error "Tests failed"
        exit 1
    fi
fi

# Build shared packages first
print_status "Building shared packages..."
npm run build:shared

if [ $? -eq 0 ]; then
    print_success "Shared packages built successfully"
else
    print_error "Failed to build shared packages"
    exit 1
fi

# Build frontend
print_status "Building frontend..."
cd frontend

# Set environment variables for build
export NODE_ENV=$ENVIRONMENT
if [ "$ENVIRONMENT" = "production" ]; then
    export VITE_API_URL="https://api.primepass.com"
    export VITE_WS_URL="wss://api.primepass.com"
else
    export VITE_API_URL="http://localhost:8000"
    export VITE_WS_URL="ws://localhost:8000"
fi

npm run build

if [ $? -eq 0 ]; then
    print_success "Frontend built successfully"
    
    # Show build stats
    if [ -f dist/stats.html ]; then
        print_status "Build stats available at frontend/dist/stats.html"
    fi
    
    # Show build size
    BUILD_SIZE=$(du -sh dist/ | cut -f1)
    print_status "Frontend build size: $BUILD_SIZE"
else
    print_error "Failed to build frontend"
    exit 1
fi

cd ..

# Build backend
print_status "Building backend..."
cd backend

# Activate virtual environment
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Set Django settings
if [ "$ENVIRONMENT" = "production" ]; then
    export DJANGO_SETTINGS_MODULE=backend.settings.production
else
    export DJANGO_SETTINGS_MODULE=backend.settings.development
fi

# Collect static files
print_status "Collecting static files..."
python manage.py collectstatic --noinput

if [ $? -eq 0 ]; then
    print_success "Static files collected successfully"
else
    print_error "Failed to collect static files"
    exit 1
fi

# Check for migrations
print_status "Checking for pending migrations..."
python manage.py makemigrations --dry-run --check

if [ $? -eq 0 ]; then
    print_success "No pending migrations"
else
    print_warning "There are pending migrations. Run 'python manage.py makemigrations' to create them."
fi

cd ..

# Generate build info
print_status "Generating build information..."
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
BUILD_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")

cat > build-info.json << EOF
{
  "buildTime": "$BUILD_TIME",
  "gitHash": "$BUILD_HASH",
  "gitBranch": "$BUILD_BRANCH",
  "environment": "$ENVIRONMENT",
  "version": "1.0.0"
}
EOF

print_success "Build information generated"

# Create deployment package
if [ "$ENVIRONMENT" = "production" ]; then
    print_status "Creating deployment package..."
    
    # Create deployment directory
    mkdir -p dist/deployment
    
    # Copy necessary files
    cp -r backend/staticfiles dist/deployment/
    cp -r frontend/dist dist/deployment/frontend
    cp -r deployment dist/deployment/config
    cp build-info.json dist/deployment/
    cp docker-compose.yml dist/deployment/
    cp .env dist/deployment/.env.example
    
    # Create deployment archive
    tar -czf primepass-$ENVIRONMENT-$BUILD_HASH.tar.gz -C dist deployment/
    
    print_success "Deployment package created: primepass-$ENVIRONMENT-$BUILD_HASH.tar.gz"
fi

# Build summary
echo ""
echo "🎉 Build completed successfully!"
echo ""
echo "Build Summary:"
echo "  Environment: $ENVIRONMENT"
echo "  Build Time: $BUILD_TIME"
echo "  Git Hash: $BUILD_HASH"
echo "  Git Branch: $BUILD_BRANCH"
echo ""

if [ "$ENVIRONMENT" = "production" ]; then
    echo "Production artifacts:"
    echo "  Frontend: frontend/dist/"
    echo "  Backend static: backend/staticfiles/"
    echo "  Deployment package: primepass-$ENVIRONMENT-$BUILD_HASH.tar.gz"
    echo ""
    echo "Next steps for deployment:"
    echo "1. Upload deployment package to server"
    echo "2. Extract and configure environment variables"
    echo "3. Run database migrations"
    echo "4. Restart services"
else
    echo "Development build completed. You can now:"
    echo "1. Start the development servers: npm run dev"
    echo "2. Or use Docker: npm run docker:up"
fi

echo ""
print_success "Build process completed! 🚀"
