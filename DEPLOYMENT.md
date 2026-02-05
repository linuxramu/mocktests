# EAMCET Mock Test Platform - Deployment Guide

This guide covers the complete deployment setup for the EAMCET Mock Test Platform on Cloudflare infrastructure.

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Install globally with `npm install -g wrangler`
3. **GitHub Account**: For CI/CD pipeline
4. **Node.js 18+**: For local development and building

## Initial Setup

### 1. Cloudflare Authentication

```bash
# Login to Cloudflare
wrangler auth login

# Verify authentication
wrangler whoami
```

### 2. Database Setup

```bash
# Run the database setup script
./scripts/setup-database.sh

# Get database IDs for configuration
wrangler d1 list
```

### 3. Update Configuration Files

After running the database setup, update the `database_id` values in all `wrangler.toml` files:

- `packages/auth-worker/wrangler.toml`
- `packages/test-engine-worker/wrangler.toml`
- `packages/ai-worker/wrangler.toml`
- `packages/analytics-worker/wrangler.toml`

### 4. Environment Variables

Set up the following secrets for each worker:

```bash
# Auth Worker secrets
wrangler secret put JWT_SECRET --env production
wrangler secret put JWT_SECRET --env development

# AI Worker secrets
wrangler secret put AI_API_KEY --env production
wrangler secret put AI_API_KEY --env development
```

## GitHub Actions Setup

### Required Secrets

Add these secrets to your GitHub repository settings:

- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token with appropriate permissions
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
- `JWT_SECRET`: Secret key for JWT token signing
- `AI_API_KEY`: API key for external AI service

### Permissions Required

Your Cloudflare API token needs these permissions:

- Zone:Zone Settings:Edit
- Zone:Zone:Read
- Account:Cloudflare Workers:Edit
- Account:Cloudflare Pages:Edit
- Account:D1:Edit

## Deployment Environments

### Development Environment

- **Branch**: `develop`
- **Workers**: `*-dev` suffix
- **Database**: `eamcet-platform-db-dev`
- **Pages**: `eamcet-platform-dev`

### Production Environment

- **Branch**: `main`
- **Workers**: `*-prod` suffix
- **Database**: `eamcet-platform-db`
- **Pages**: `eamcet-platform`

## Manual Deployment

### Deploy Workers

```bash
# Deploy all workers to development
npm run deploy:workers:dev

# Deploy all workers to production
npm run deploy:workers:prod

# Deploy specific worker
cd packages/auth-worker
wrangler deploy --env production
```

### Deploy Frontend

```bash
# Build and deploy frontend
cd packages/frontend
npm run build
wrangler pages deploy dist --project-name=eamcet-platform
```

### Database Migrations

```bash
# Apply migrations to development
wrangler d1 execute eamcet-platform-db-dev --file=database/schema.sql

# Apply migrations to production
wrangler d1 execute eamcet-platform-db --file=database/schema.sql
```

## Monitoring and Maintenance

### Health Checks

Each worker includes health check endpoints:

- `GET /health` - Basic health status
- `GET /health/detailed` - Detailed system status

### Logging

View logs for deployed workers:

```bash
# View real-time logs
wrangler tail eamcet-auth-worker-prod

# View logs for specific time period
wrangler tail eamcet-auth-worker-prod --since 1h
```

### Database Queries

```bash
# Query production database
wrangler d1 execute eamcet-platform-db --command="SELECT COUNT(*) FROM users"

# Export data
wrangler d1 export eamcet-platform-db --output=backup.sql
```

## Troubleshooting

### Common Issues

1. **Database ID not found**
   - Run `wrangler d1 list` to get correct database IDs
   - Update all `wrangler.toml` files with correct IDs

2. **Worker deployment fails**
   - Check that all required secrets are set
   - Verify API token permissions
   - Check worker size limits (1MB compressed)

3. **Pages deployment fails**
   - Ensure build command succeeds locally
   - Check environment variables are set correctly
   - Verify `_redirects` and `_headers` files are in place

4. **CORS errors**
   - Update `CORS_ORIGINS` environment variable
   - Check that frontend URLs match worker configurations

### Performance Optimization

1. **Enable caching**
   - Use Cloudflare KV for session storage
   - Implement proper cache headers
   - Use edge caching for static assets

2. **Database optimization**
   - Use prepared statements
   - Implement connection pooling
   - Add appropriate indexes

3. **Worker optimization**
   - Minimize bundle size
   - Use tree shaking
   - Implement lazy loading

## Security Considerations

1. **API Security**
   - All secrets stored in Cloudflare Workers secrets
   - JWT tokens with appropriate expiration
   - Rate limiting on all endpoints

2. **Database Security**
   - Parameterized queries to prevent SQL injection
   - Proper access controls
   - Regular security audits

3. **Frontend Security**
   - Content Security Policy headers
   - XSS protection
   - Secure cookie settings

## Cost Optimization

The platform is designed to stay within Cloudflare's free tier limits:

- **Workers**: 100,000 requests/day per worker
- **D1**: 5GB storage, 25M row reads/month
- **Pages**: Unlimited static requests
- **KV**: 100,000 reads/day, 1,000 writes/day

Monitor usage through the Cloudflare dashboard and implement appropriate caching strategies to stay within limits.

## Support

For deployment issues:

1. Check the GitHub Actions logs
2. Review Cloudflare Workers logs
3. Verify all configuration files
4. Test locally with `wrangler dev`

For more information, see the [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/).
