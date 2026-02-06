#!/bin/bash

# Log Monitoring Script for EAMCET Mock Test Platform
# Monitors real-time logs from all Cloudflare Workers

set -e

echo "📊 Log Monitor for EAMCET Mock Test Platform"
echo "============================================"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check environment parameter
ENVIRONMENT=${1:-production}

if [ "$ENVIRONMENT" != "production" ] && [ "$ENVIRONMENT" != "development" ]; then
    echo "Invalid environment. Use: production or development"
    exit 1
fi

# Set worker names based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    AUTH_WORKER="eamcet-auth-worker-prod"
    TEST_ENGINE_WORKER="eamcet-test-engine-worker-prod"
    AI_WORKER="eamcet-ai-worker-prod"
    ANALYTICS_WORKER="eamcet-analytics-worker-prod"
else
    AUTH_WORKER="eamcet-auth-worker-dev"
    TEST_ENGINE_WORKER="eamcet-test-engine-worker-dev"
    AI_WORKER="eamcet-ai-worker-dev"
    ANALYTICS_WORKER="eamcet-analytics-worker-dev"
fi

print_info "Monitoring $ENVIRONMENT environment logs..."
echo ""
echo "Select worker to monitor:"
echo "1. Auth Worker"
echo "2. Test Engine Worker"
echo "3. AI Worker"
echo "4. Analytics Worker"
echo "5. All Workers (split view)"
echo ""
read -p "Select option (1-5): " -n 1 -r OPTION
echo ""

case $OPTION in
    1)
        print_info "Monitoring Auth Worker logs..."
        wrangler tail "$AUTH_WORKER" --format=pretty
        ;;
    2)
        print_info "Monitoring Test Engine Worker logs..."
        wrangler tail "$TEST_ENGINE_WORKER" --format=pretty
        ;;
    3)
        print_info "Monitoring AI Worker logs..."
        wrangler tail "$AI_WORKER" --format=pretty
        ;;
    4)
        print_info "Monitoring Analytics Worker logs..."
        wrangler tail "$ANALYTICS_WORKER" --format=pretty
        ;;
    5)
        print_info "Monitoring all workers..."
        echo "Opening logs in separate terminal windows..."
        
        # Check if tmux is available
        if command -v tmux &> /dev/null; then
            # Use tmux for split view
            tmux new-session -d -s eamcet-logs
            tmux split-window -h
            tmux split-window -v
            tmux select-pane -t 0
            tmux split-window -v
            
            tmux select-pane -t 0
            tmux send-keys "wrangler tail $AUTH_WORKER --format=pretty" C-m
            
            tmux select-pane -t 1
            tmux send-keys "wrangler tail $TEST_ENGINE_WORKER --format=pretty" C-m
            
            tmux select-pane -t 2
            tmux send-keys "wrangler tail $AI_WORKER --format=pretty" C-m
            
            tmux select-pane -t 3
            tmux send-keys "wrangler tail $ANALYTICS_WORKER --format=pretty" C-m
            
            tmux attach-session -t eamcet-logs
        else
            echo "tmux not found. Install tmux for split view or monitor workers individually."
            echo ""
            echo "To monitor individually, run:"
            echo "  wrangler tail $AUTH_WORKER --format=pretty"
            echo "  wrangler tail $TEST_ENGINE_WORKER --format=pretty"
            echo "  wrangler tail $AI_WORKER --format=pretty"
            echo "  wrangler tail $ANALYTICS_WORKER --format=pretty"
        fi
        ;;
    *)
        echo "Invalid option"
        exit 1
        ;;
esac
