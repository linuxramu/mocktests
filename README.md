# EAMCET Mock Test Platform

[![Tests](https://github.com/linuxramu/mocktests/workflows/test/badge.svg)](https://github.com/linuxramu/mocktests/actions/workflows/test.yml)
[![Deploy Workers](https://github.com/linuxramu/mocktests/workflows/deploy-workers/badge.svg)](https://github.com/linuxramu/mocktests/actions/workflows/deploy-workers.yml)
[![Deploy Frontend](https://github.com/linuxramu/mocktests/workflows/deploy-frontend/badge.svg)](https://github.com/linuxramu/mocktests/actions/workflows/deploy-frontend.yml)

A comprehensive full-stack application designed to help students prepare for the Engineering, Agriculture and Medical Common Entrance Test (EAMCET). Built with TypeScript, React, and Cloudflare's serverless infrastructure.

## Architecture

- **Frontend**: React application deployed on Cloudflare Pages
- **Backend**: Multiple Cloudflare Workers for different services
- **Database**: Cloudflare D1 (SQLite-compatible)
- **Caching**: Cloudflare KV for session management

## Project Structure

```
eamcet-mock-test-platform/
├── packages/
│   ├── frontend/           # React frontend application
│   ├── auth-worker/        # Authentication Cloudflare Worker
│   ├── test-engine-worker/ # Test management Cloudflare Worker
│   ├── ai-worker/          # AI question generation Cloudflare Worker
│   ├── analytics-worker/   # Analytics Cloudflare Worker
│   └── shared/             # Shared types and utilities
├── .kiro/specs/           # Project specifications
└── package.json           # Root package.json with workspaces
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Cloudflare account (for deployment)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Build shared package:

```bash
npm run build -w @eamcet-platform/shared
```

3. Start development servers:

```bash
# Frontend
npm run dev -w @eamcet-platform/frontend

# Workers (in separate terminals)
npm run dev -w @eamcet-platform/auth-worker
npm run dev -w @eamcet-platform/test-engine-worker
npm run dev -w @eamcet-platform/ai-worker
npm run dev -w @eamcet-platform/analytics-worker
```

### Testing

Run tests for all packages:

```bash
npm test
```

Run tests for specific package:

```bash
npm test -w @eamcet-platform/frontend
```

### Code Quality

Format code:

```bash
npm run format
```

Lint code:

```bash
npm run lint
```

## Features

- AI-powered question generation based on EAMCET patterns
- Real-time test taking interface with timer
- Comprehensive performance analytics
- Progress tracking and comparison
- Secure user authentication
- Responsive design for all devices

## Deployment

The application is designed to be deployed on Cloudflare infrastructure:

1. Frontend: Cloudflare Pages with automatic GitHub integration
2. Workers: Deployed using Wrangler CLI
3. Database: Cloudflare D1 with edge replication

## Contributing

1. Follow the existing code style and formatting
2. Write tests for new features
3. Update documentation as needed
4. Submit pull requests for review

## License

This project is private and proprietary.
