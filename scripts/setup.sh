#!/bin/bash

# PrimePass Monorepo Setup Script
# This script sets up the development environment for the PrimePass monorepo

set -e

echo "🚀 Setting up PrimePass development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if running on Windows (Git Bash/WSL)
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    print_warning "Detected Windows environment. Some commands may need adjustment."
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_status "Checking prerequisites..."

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
    
    # Check if version is >= 18
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 18 ]; then
        print_error "Node.js version 18 or higher is required. Current version: $NODE_VERSION"
        exit 1
    fi
else
    print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_success "npm found: $NPM_VERSION"
else
    print_error "npm is not installed. Please install npm."
    exit 1
fi

# Check Python
if command_exists python3; then
    PYTHON_VERSION=$(python3 --version)
    print_success "Python found: $PYTHON_VERSION"
else
    print_error "Python 3 is not installed. Please install Python 3.11+ from https://python.org/"
    exit 1
fi

# Check Docker
if command_exists docker; then
    DOCKER_VERSION=$(docker --version)
    print_success "Docker found: $DOCKER_VERSION"
else
    print_warning "Docker is not installed. You can still run the project manually, but Docker is recommended for development."
fi

# Check Docker Compose
if command_exists docker-compose; then
    DOCKER_COMPOSE_VERSION=$(docker-compose --version)
    print_success "Docker Compose found: $DOCKER_COMPOSE_VERSION"
elif command_exists docker && docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE_VERSION=$(docker compose version)
    print_success "Docker Compose (plugin) found: $DOCKER_COMPOSE_VERSION"
else
    print_warning "Docker Compose is not installed. You can still run the project manually."
fi

# Install Node.js dependencies
print_status "Installing Node.js dependencies..."
npm install

if [ $? -eq 0 ]; then
    print_success "Node.js dependencies installed successfully"
else
    print_error "Failed to install Node.js dependencies"
    exit 1
fi

# Setup Python virtual environment for backend
print_status "Setting up Python virtual environment..."
cd backend

if command_exists python3; then
    python3 -m venv venv
    
    # Activate virtual environment
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        source venv/Scripts/activate
    else
        source venv/bin/activate
    fi
    
    print_success "Python virtual environment created and activated"
    
    # Install Python dependencies
    print_status "Installing Python dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
    
    if [ $? -eq 0 ]; then
        print_success "Python dependencies installed successfully"
    else
        print_error "Failed to install Python dependencies"
        exit 1
    fi
else
    print_error "Python 3 is required for backend setup"
    exit 1
fi

cd ..

# Build shared packages
print_status "Building shared packages..."
npm run build:shared

if [ $? -eq 0 ]; then
    print_success "Shared packages built successfully"
else
    print_error "Failed to build shared packages"
    exit 1
fi

# Setup environment files
print_status "Setting up environment files..."

if [ ! -f .env.local ]; then
    cp .env .env.local
    print_success "Created .env.local from template"
    print_warning "Please update .env.local with your configuration"
else
    print_warning ".env.local already exists, skipping creation"
fi

if [ ! -f frontend/.env ]; then
    cat > frontend/.env << EOF
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_APP_NAME=PrimePass
VITE_APP_VERSION=1.0.0
EOF
    print_success "Created frontend/.env"
else
    print_warning "frontend/.env already exists, skipping creation"
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p backend/logs
mkdir -p backend/media
mkdir -p backend/staticfiles
mkdir -p deployment/ssl
mkdir -p deployment/backups

print_success "Directories created successfully"

# Setup Git hooks (if .git exists)
if [ -d .git ]; then
    print_status "Setting up Git hooks..."
    
    # Pre-commit hook
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Pre-commit hook for PrimePass

echo "Running pre-commit checks..."

# Check for merge conflict markers
if grep -r "<<<<<<< HEAD" --exclude-dir=node_modules --exclude-dir=.git .; then
    echo "Error: Merge conflict markers found"
    exit 1
fi

# Run linting
npm run lint:check
if [ $? -ne 0 ]; then
    echo "Error: Linting failed"
    exit 1
fi

# Run type checking
npm run type-check
if [ $? -ne 0 ]; then
    echo "Error: Type checking failed"
    exit 1
fi

echo "Pre-commit checks passed"
EOF

    chmod +x .git/hooks/pre-commit
    print_success "Git hooks setup successfully"
fi

# Database setup (if Docker is available)
if command_exists docker && command_exists docker-compose; then
    print_status "Starting database services with Docker..."
    docker-compose up -d postgres redis
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 10
    
    # Run migrations
    print_status "Running database migrations..."
    cd backend
    source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
    python manage.py migrate
    
    if [ $? -eq 0 ]; then
        print_success "Database migrations completed successfully"
    else
        print_warning "Database migrations failed. You may need to run them manually."
    fi
    
    cd ..
else
    print_warning "Docker not available. Please setup PostgreSQL and Redis manually."
    print_warning "Then run: cd backend && python manage.py migrate"
fi

# Final setup verification
print_status "Verifying setup..."

# Check if all workspaces are properly configured
npm run type-check --workspaces --if-present
if [ $? -eq 0 ]; then
    print_success "All workspaces configured correctly"
else
    print_warning "Some workspaces may have configuration issues"
fi

# Print next steps
echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your configuration"
echo "2. Start the development servers:"
echo "   - Full stack: npm run dev"
echo "   - Backend only: npm run dev:backend"
echo "   - Frontend only: npm run dev:frontend"
echo "   - With Docker: npm run docker:up"
echo ""
echo "3. Create a superuser for Django admin:"
echo "   cd backend && python manage.py createsuperuser"
echo ""
echo "4. Visit the application:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:8000/api/v1/"
echo "   - Django Admin: http://localhost:8000/admin/"
echo ""
echo "For more information, see README.md and docs/"
echo ""

print_success "Happy coding! 🚀"
