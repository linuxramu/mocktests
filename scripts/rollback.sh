#!/bin/bash

# Rollback Script for EAMCET Mock Test Platform
# This script handles rollback to previous deployment versions

set -e

echo "🔄 Rollback Script for EAMCET Mock Test Platform"
echo "================================================"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

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

# Check environment parameter
ENVIRONMENT=${1:-production}

if [ "$ENVIRONMENT" != "production" ] && [ "$ENVIRONMENT" != "development" ]; then
    print_error "Invalid environment. Use: production or development"
    exit 1
fi

print_warning "This will rollback the $ENVIRONMENT environment"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Rollback cancelled"
    exit 0
fi

# Set worker names based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    AUTH_WORKER="eamcet-auth-worker-prod"
    TEST_ENGINE_WORKER="eamcet-test-engine-worker-prod"
    AI_WORKER="eamcet-ai-worker-prod"
    ANALYTICS_WORKER="eamcet-analytics-worker-prod"
    PAGES_PROJECT="eamcet-platform"
else
    AUTH_WORKER="eamcet-auth-worker-dev"
    TEST_ENGINE_WORKER="eamcet-test-engine-worker-dev"
    AI_WORKER="eamcet-ai-worker-dev"
    ANALYTICS_WORKER="eamcet-analytics-worker-dev"
    PAGES_PROJECT="eamcet-platform-dev"
fi

echo ""
echo "📋 Rollback Options:"
echo "-------------------"
echo "1. Rollback all workers"
echo "2. Rollback Auth Worker only"
echo "3. Rollback Test Engine Worker only"
echo "4. Rollback AI Worker only"
echo "5. Rollback Analytics Worker only"
echo "6. Rollback Frontend only"
echo "7. Cancel"
echo ""
read -p "Select option (1-7): " -n 1 -r OPTION
echo ""

rollback_worker() {
    local worker_name=$1
    local worker_path=$2
    
    print_info "Rolling back $worker_name..."
    
    # Get list of recent deployments
    cd "$worker_path"
    
    # List recent deployments
    print_info "Recent deployments for $worker_name:"
    wrangler deployments list --name="$worker_name" | head -n 10
    
    echo ""
    read -p "Enter deployment ID to rollback to (or 'skip' to skip): " DEPLOYMENT_ID
    
    if [ "$DEPLOYMENT_ID" = "skip" ]; then
        print_info "Skipping $worker_name"
        cd ../..
        return
    fi
    
    # Rollback to specified deployment
    wrangler rollback --name="$worker_name" --deployment-id="$DEPLOYMENT_ID"
    
    print_success "$worker_name rolled back successfully"
    cd ../..
}

rollback_frontend() {
    print_info "Rolling back frontend..."
    
    # List recent deployments
    print_info "Recent deployments for $PAGES_PROJECT:"
    wrangler pages deployment list --project-name="$PAGES_PROJECT" | head -n 10
    
    echo ""
    read -p "Enter deployment ID to rollback to (or 'skip' to skip): " DEPLOYMENT_ID
    
    if [ "$DEPLOYMENT_ID" = "skip" ]; then
        print_info "Skipping frontend rollback"
        return
    fi
    
    # Rollback to specified deployment
    wrangler pages deployment rollback --project-name="$PAGES_PROJECT" --deployment-id="$DEPLOYMENT_ID"
    
    print_success "Frontend rolled back successfully"
}

case $OPTION in
    1)
        print_info "Rolling back all workers..."
        rollback_worker "$AUTH_WORKER" "packages/auth-worker"
        rollback_worker "$TEST_ENGINE_WORKER" "packages/test-engine-worker"
        rollback_worker "$AI_WORKER" "packages/ai-worker"
        rollback_worker "$ANALYTICS_WORKER" "packages/analytics-worker"
        rollback_frontend
        ;;
    2)
        rollback_worker "$AUTH_WORKER" "packages/auth-worker"
        ;;
    3)
        rollback_worker "$TEST_ENGINE_WORKER" "packages/test-engine-worker"
        ;;
    4)
        rollback_worker "$AI_WORKER" "packages/ai-worker"
        ;;
    5)
        rollback_worker "$ANALYTICS_WORKER" "packages/analytics-worker"
        ;;
    6)
        rollback_frontend
        ;;
    7)
        print_info "Rollback cancelled"
        exit 0
        ;;
    *)
        print_error "Invalid option"
        exit 1
        ;;
esac

echo ""
print_success "Rollback completed!"
echo ""
print_warning "Remember to:"
echo "  1. Verify services are working correctly"
echo "  2. Check logs for any errors"
echo "  3. Notify team about the rollback"
echo "  4. Investigate the issue that caused the rollback"
