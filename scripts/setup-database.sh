#!/bin/bash

# EAMCET Mock Test Platform - Database Setup Script
# This script sets up Cloudflare D1 databases for all environments

set -e

echo "🚀 Setting up Cloudflare D1 databases..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if wrangler is installed
check_wrangler() {
    if ! command -v wrangler &> /dev/null; then
        echo -e "${RED}❌ Wrangler CLI is not installed. Please install it first:${NC}"
        echo "npm install -g wrangler"
        exit 1
    fi
}

# Function to create database if it doesn't exist
create_database() {
    local db_name=$1
    local env_suffix=$2
    
    echo -e "${YELLOW}📊 Creating database: ${db_name}${env_suffix}${NC}"
    
    # Check if database already exists
    if wrangler d1 list | grep -q "${db_name}${env_suffix}"; then
        echo -e "${GREEN}✅ Database ${db_name}${env_suffix} already exists${NC}"
    else
        wrangler d1 create "${db_name}${env_suffix}"
        echo -e "${GREEN}✅ Created database: ${db_name}${env_suffix}${NC}"
    fi
}

# Function to apply schema to database
apply_schema() {
    local db_name=$1
    local env_suffix=$2
    
    echo -e "${YELLOW}📋 Applying schema to: ${db_name}${env_suffix}${NC}"
    
    # Apply main schema
    wrangler d1 execute "${db_name}${env_suffix}" --file=database/schema.sql
    echo -e "${GREEN}✅ Schema applied to: ${db_name}${env_suffix}${NC}"
    
    # Apply seed data for development databases
    if [[ "$env_suffix" == "-dev" || "$env_suffix" == "-local" ]]; then
        echo -e "${YELLOW}🌱 Applying seed data to: ${db_name}${env_suffix}${NC}"
        wrangler d1 execute "${db_name}${env_suffix}" --file=database/seed-data.sql
        echo -e "${GREEN}✅ Seed data applied to: ${db_name}${env_suffix}${NC}"
    fi
}

# Main execution
main() {
    echo -e "${GREEN}🎯 EAMCET Mock Test Platform - Database Setup${NC}"
    echo "=================================================="
    
    # Check prerequisites
    check_wrangler
    
    # Database name
    DB_NAME="eamcet-platform-db"
    
    # Create databases for different environments
    echo -e "\n${YELLOW}Creating databases...${NC}"
    create_database "$DB_NAME" "-local"
    create_database "$DB_NAME" "-dev" 
    create_database "$DB_NAME" ""  # Production database
    
    # Apply schemas
    echo -e "\n${YELLOW}Applying database schemas...${NC}"
    apply_schema "$DB_NAME" "-local"
    apply_schema "$DB_NAME" "-dev"
    apply_schema "$DB_NAME" ""  # Production database
    
    echo -e "\n${GREEN}🎉 Database setup completed successfully!${NC}"
    echo -e "${YELLOW}📝 Next steps:${NC}"
    echo "1. Update the database_id values in your wrangler.toml files"
    echo "2. Run 'wrangler d1 list' to get the database IDs"
    echo "3. Update the wrangler.toml files with the correct database IDs"
    echo -e "\n${YELLOW}💡 Useful commands:${NC}"
    echo "- List databases: wrangler d1 list"
    echo "- Query database: wrangler d1 execute <db-name> --command='SELECT * FROM users LIMIT 5'"
    echo "- Apply migration: wrangler d1 execute <db-name> --file=database/migrations/xxx.sql"
}

# Run main function
main "$@"