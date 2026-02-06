#!/bin/bash

# Health Check Script for EAMCET Mock Test Platform
# Monitors the health of all deployed services

set -e

echo "🏥 Health Check for EAMCET Mock Test Platform"
echo "=============================================="

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

print_info "Checking $ENVIRONMENT environment..."
echo ""

# Set URLs based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    AUTH_URL="https://eamcet-auth-worker-prod.workers.dev"
    TEST_ENGINE_URL="https://eamcet-test-engine-worker-prod.workers.dev"
    AI_URL="https://eamcet-ai-worker-prod.workers.dev"
    ANALYTICS_URL="https://eamcet-analytics-worker-prod.workers.dev"
    FRONTEND_URL="https://eamcet-platform.pages.dev"
else
    AUTH_URL="https://eamcet-auth-worker-dev.workers.dev"
    TEST_ENGINE_URL="https://eamcet-test-engine-worker-dev.workers.dev"
    AI_URL="https://eamcet-ai-worker-dev.workers.dev"
    ANALYTICS_URL="https://eamcet-analytics-worker-dev.workers.dev"
    FRONTEND_URL="https://eamcet-platform-dev.pages.dev"
fi

# Function to check service health
check_service() {
    local service_name=$1
    local url=$2
    local timeout=${3:-5}
    
    print_info "Checking $service_name..."
    
    # Check if service responds
    if response=$(curl -s -w "\n%{http_code}" --max-time "$timeout" "$url" 2>&1); then
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | head -n-1)
        
        if [ "$http_code" = "200" ]; then
            print_success "$service_name is healthy (HTTP $http_code)"
            
            # Try to parse JSON response if available
            if echo "$body" | jq . > /dev/null 2>&1; then
                echo "$body" | jq -C '.' | head -n 5
            fi
            return 0
        else
            print_warning "$service_name returned HTTP $http_code"
            return 1
        fi
    else
        print_error "$service_name is unreachable or timed out"
        return 1
    fi
    echo ""
}

# Function to check detailed health
check_detailed_health() {
    local service_name=$1
    local url=$2
    
    print_info "Checking detailed health for $service_name..."
    
    if response=$(curl -s "$url/health/detailed" 2>&1); then
        if echo "$response" | jq . > /dev/null 2>&1; then
            echo "$response" | jq -C '.'
            print_success "Detailed health check passed"
        else
            print_warning "Detailed health endpoint not available or returned non-JSON"
        fi
    else
        print_warning "Could not fetch detailed health"
    fi
    echo ""
}

# Track overall health
FAILED_SERVICES=0
TOTAL_SERVICES=5

echo "🔍 Basic Health Checks"
echo "---------------------"

# Check Auth Worker
if ! check_service "Auth Worker" "$AUTH_URL/health"; then
    ((FAILED_SERVICES++))
fi

# Check Test Engine Worker
if ! check_service "Test Engine Worker" "$TEST_ENGINE_URL/health"; then
    ((FAILED_SERVICES++))
fi

# Check AI Worker
if ! check_service "AI Worker" "$AI_URL/health"; then
    ((FAILED_SERVICES++))
fi

# Check Analytics Worker
if ! check_service "Analytics Worker" "$ANALYTICS_URL/health"; then
    ((FAILED_SERVICES++))
fi

# Check Frontend
if ! check_service "Frontend" "$FRONTEND_URL" 10; then
    ((FAILED_SERVICES++))
fi

# Detailed health checks
echo ""
echo "📊 Detailed Health Checks"
echo "------------------------"

check_detailed_health "Auth Worker" "$AUTH_URL"
check_detailed_health "Test Engine Worker" "$TEST_ENGINE_URL"
check_detailed_health "AI Worker" "$AI_URL"
check_detailed_health "Analytics Worker" "$ANALYTICS_URL"

# Response time checks
echo ""
echo "⏱️  Response Time Checks"
echo "-----------------------"

check_response_time() {
    local service_name=$1
    local url=$2
    
    print_info "Measuring response time for $service_name..."
    
    time_total=$(curl -o /dev/null -s -w '%{time_total}' "$url")
    time_ms=$(echo "$time_total * 1000" | bc)
    
    if (( $(echo "$time_total < 1.0" | bc -l) )); then
        print_success "$service_name: ${time_ms}ms"
    elif (( $(echo "$time_total < 3.0" | bc -l) )); then
        print_warning "$service_name: ${time_ms}ms (slower than expected)"
    else
        print_error "$service_name: ${time_ms}ms (too slow)"
    fi
}

check_response_time "Auth Worker" "$AUTH_URL/health"
check_response_time "Test Engine Worker" "$TEST_ENGINE_URL/health"
check_response_time "AI Worker" "$AI_URL/health"
check_response_time "Analytics Worker" "$ANALYTICS_URL/health"

# Summary
echo ""
echo "📈 Health Check Summary"
echo "----------------------"

HEALTHY_SERVICES=$((TOTAL_SERVICES - FAILED_SERVICES))

echo "Healthy Services: $HEALTHY_SERVICES/$TOTAL_SERVICES"

if [ $FAILED_SERVICES -eq 0 ]; then
    print_success "All services are healthy! 🎉"
    exit 0
elif [ $FAILED_SERVICES -lt $TOTAL_SERVICES ]; then
    print_warning "Some services are unhealthy"
    exit 1
else
    print_error "All services are down!"
    exit 2
fi
