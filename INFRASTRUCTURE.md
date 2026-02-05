# EAMCET Mock Test Platform - Infrastructure Overview

## Architecture Summary

The EAMCET Mock Test Platform is built on Cloudflare's serverless infrastructure, providing global performance, automatic scaling, and cost efficiency. The architecture follows a microservices pattern with separate workers for different domains.

## Infrastructure Components

### 1. Cloudflare Workers (Backend API)

#### Auth Worker (`packages/auth-worker/`)

- **Purpose**: User authentication, registration, and profile management
- **Endpoints**: `/auth/*`
- **Dependencies**: Cloudflare D1, KV storage
- **Secrets**: JWT_SECRET

#### Test Engine Worker (`packages/test-engine-worker/`)

- **Purpose**: Test session management, question delivery, answer processing
- **Endpoints**: `/tests/*`
- **Dependencies**: Cloudflare D1, KV storage
- **Features**: Real-time WebSocket support, timer management

#### AI Worker (`packages/ai-worker/`)

- **Purpose**: AI-powered question generation and validation
- **Endpoints**: `/ai/*`
- **Dependencies**: Cloudflare D1, External AI API
- **Secrets**: AI_API_KEY

#### Analytics Worker (`packages/analytics-worker/`)

- **Purpose**: Performance analytics, progress tracking, insights generation
- **Endpoints**: `/analytics/*`
- **Dependencies**: Cloudflare D1
- **Features**: Complex analytics calculations, trend analysis

### 2. Cloudflare Pages (Frontend)

#### React Application (`packages/frontend/`)

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Deployment**: Automatic from GitHub
- **Features**: SPA routing, responsive design, PWA capabilities

### 3. Cloudflare D1 (Database)

#### Database Schema

- **Engine**: SQLite-compatible
- **Tables**: users, test_sessions, questions, user_answers, performance_analytics, progress_tracking
- **Features**: ACID compliance, automatic backups, edge replication

#### Environments

- **Local**: `eamcet-platform-db-local` (development)
- **Development**: `eamcet-platform-db-dev` (staging)
- **Production**: `eamcet-platform-db` (live)

### 4. Cloudflare KV (Key-Value Storage)

#### Usage

- Session storage and management
- Caching frequently accessed data
- Rate limiting counters
- Temporary data storage

### 5. GitHub Actions (CI/CD)

#### Workflows

- **Test Suite**: Runs on all PRs and pushes
- **Deploy Workers**: Deploys backend services
- **Deploy Frontend**: Deploys React application
- **Database Migration**: Handles schema updates

## Environment Configuration

### Development Environment

- **Branch**: `develop`
- **Workers**: `*-dev` suffix
- **Database**: `eamcet-platform-db-dev`
- **Pages**: `eamcet-platform-dev`
- **Domain**: `eamcet-platform-dev.pages.dev`

### Production Environment

- **Branch**: `main`
- **Workers**: `*-prod` suffix
- **Database**: `eamcet-platform-db`
- **Pages**: `eamcet-platform`
- **Domain**: `eamcet-platform.pages.dev`

## Security Architecture

### Authentication Flow

1. User registers/logs in through Auth Worker
2. JWT token issued with appropriate claims
3. All subsequent requests validated against JWT
4. Session data stored in Cloudflare KV

### Data Protection

- All sensitive data encrypted at rest
- TLS 1.3 for data in transit
- Input validation and sanitization
- SQL injection prevention through parameterized queries

### Access Control

- Role-based access control (RBAC)
- API rate limiting
- CORS configuration
- Content Security Policy (CSP)

## Performance Characteristics

### Response Times

- **Workers**: < 50ms globally (edge execution)
- **Database**: < 100ms (edge replication)
- **Frontend**: < 3s initial load, < 1s navigation

### Scalability

- **Concurrent Users**: 10,000+ (auto-scaling)
- **Requests/Second**: 1,000+ per worker
- **Database**: 25M row reads/month (free tier)

### Caching Strategy

- Static assets: 1 year cache
- API responses: Context-dependent caching
- Database queries: KV caching for frequent reads

## Cost Optimization

### Free Tier Limits

- **Workers**: 100,000 requests/day per worker
- **D1**: 5GB storage, 25M row reads/month
- **Pages**: Unlimited static requests
- **KV**: 100,000 reads/day, 1,000 writes/day

### Optimization Strategies

- Efficient database queries with proper indexing
- KV caching for frequently accessed data
- Bundle size optimization for workers
- Image optimization and lazy loading

## Monitoring and Observability

### Metrics

- Request volume and response times
- Error rates and types
- Database query performance
- User engagement metrics

### Logging

- Structured logging in all workers
- Error tracking and alerting
- Performance monitoring
- Security event logging

### Health Checks

- `/health` endpoints on all workers
- Database connectivity checks
- External service dependency checks

## Disaster Recovery

### Backup Strategy

- Automatic D1 database backups
- Git-based infrastructure as code
- Environment configuration versioning

### Recovery Procedures

- Database restore from backups
- Worker redeployment from Git
- DNS failover capabilities

## Development Workflow

### Local Development

```bash
# Start all services locally
npm run dev

# Run database locally
wrangler d1 execute eamcet-platform-db-local --file=database/schema.sql

# Test individual workers
cd packages/auth-worker && npm run dev
```

### Deployment Process

1. Push to `develop` branch → Deploy to development
2. Create PR to `main` → Run full test suite
3. Merge to `main` → Deploy to production
4. Database migrations via GitHub Actions

### Testing Strategy

- Unit tests for all business logic
- Property-based tests for critical functions
- Integration tests for API endpoints
- End-to-end tests for user workflows

## Maintenance

### Regular Tasks

- Monitor usage against free tier limits
- Review and rotate secrets
- Update dependencies
- Performance optimization
- Security audits

### Scaling Considerations

- Monitor request patterns
- Optimize database queries
- Implement additional caching layers
- Consider paid tiers for higher limits

This infrastructure provides a robust, scalable, and cost-effective foundation for the EAMCET Mock Test Platform while maintaining high performance and security standards.
