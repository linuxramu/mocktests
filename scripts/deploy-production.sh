#!/bin/bash

# Production Deployment Script for EAMCET Mock Test Platform
# This script handles the complete production deployment process

set -e  # Exit on error

echo "🚀 Starting Production Deployment..."
echo "=================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo "ℹ️  $1"
}

# Check if we're on the main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    print_error "Not on main branch. Current branch: $CURRENT_BRANCH"
    print_info "Production deployments should only be done from the main branch."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    print_warning "You have uncommitted changes"
    git status -s
    read -p "Continue with deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Pre-deployment checks
echo ""
echo "📋 Running Pre-Deployment Checks..."
echo "-----------------------------------"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    print_error "Wrangler CLI not found. Please install it: npm install -g wrangler"
    exit 1
fi
print_success "Wrangler CLI found"

# Check if authenticated with Cloudflare
if ! wrangler whoami &> /dev/null; then
    print_error "Not authenticated with Cloudflare. Run: wrangler auth login"
    exit 1
fi
print_success "Cloudflare authentication verified"

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    print_error "Node.js version 20 or higher required. Current: $(node -v)"
    exit 1
fi
print_success "Node.js version check passed"

# Install dependencies
echo ""
echo "📦 Installing Dependencies..."
echo "----------------------------"
npm ci
print_success "Dependencies installed"

# Build shared package
echo ""
echo "🔨 Building Shared Package..."
echo "-----------------------------"
npm run build:shared
print_success "Shared package built"

# Run tests
echo ""
echo "🧪 Running Test Suite..."
echo "------------------------"
npm run test:unit
print_success "Unit tests passed"

npm run test:pbt
print_success "Property-based tests passed"

# Run linting
echo ""
echo "🔍 Running Linting..."
echo "--------------------"
npm run lint
print_success "Linting passed"

# Type checking
echo ""
echo "📝 Running Type Checks..."
echo "-------------------------"
npm run type-check
print_success "Type checking passed"

# Deploy workers
echo ""
echo "🚀 Deploying Cloudflare Workers..."
echo "----------------------------------"

# Deploy Auth Worker
print_info "Deploying Auth Worker..."
cd packages/auth-worker
npm run build
wrangler deploy --env production
cd ../..
print_success "Auth Worker deployed"

# Deploy Test Engine Worker
print_info "Deploying Test Engine Worker..."
cd packages/test-engine-worker
npm run build
wrangler deploy --env production
cd ../..
print_success "Test Engine Worker deployed"

# Deploy AI Worker
print_info "Deploying AI Worker..."
cd packages/ai-worker
npm run build
wrangler deploy --env production
cd ../..
print_success "AI Worker deployed"

# Deploy Analytics Worker
print_info "Deploying Analytics Worker..."
cd packages/analytics-worker
npm run build
wrangler deploy --env production
cd ../..
print_success "Analytics Worker deployed"

# Build and deploy frontend
echo ""
echo "🎨 Building and Deploying Frontend..."
echo "-------------------------------------"
npm run build:frontend
print_success "Frontend built"

cd packages/frontend
wrangler pages deploy dist --project-name=eamcet-platform
cd ../..
print_success "Frontend deployed"

# Post-deployment verification
echo ""
echo "✅ Running Post-Deployment Verification..."
echo "------------------------------------------"

# Health check for workers
WORKERS=(
    "https://eamcet-auth-worker-prod.workers.dev/health"
    "https://eamcet-test-engine-worker-prod.workers.dev/health"
    "https://eamcet-ai-worker-prod.workers.dev/health"
    "https://eamcet-analytics-worker-prod.workers.dev/health"
)

for worker_url in "${WORKERS[@]}"; do
    print_info "Checking: $worker_url"
    if curl -f -s "$worker_url" > /dev/null; then
        print_success "Health check passed"
    else
        print_warning "Health check failed or endpoint not available"
    fi
done

# Deployment summary
echo ""
echo "🎉 Deployment Complete!"
echo "======================="
echo ""
echo "📊 Deployment Summary:"
echo "  • Auth Worker: https://eamcet-auth-worker-prod.workers.dev"
echo "  • Test Engine Worker: https://eamcet-test-engine-worker-prod.workers.dev"
echo "  • AI Worker: https://eamcet-ai-worker-prod.workers.dev"
echo "  • Analytics Worker: https://eamcet-analytics-worker-prod.workers.dev"
echo "  • Frontend: https://eamcet-platform.pages.dev"
echo ""
echo "🔍 Next Steps:"
echo "  1. Verify all services are responding correctly"
echo "  2. Run smoke tests on production environment"
echo "  3. Monitor logs for any errors"
echo "  4. Update documentation if needed"
echo ""
print_success "Production deployment completed successfully!"
