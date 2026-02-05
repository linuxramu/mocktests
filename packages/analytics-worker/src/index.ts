// Analytics Cloudflare Worker
import { PerformanceAnalytics } from '@eamcet-platform/shared';

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    // Check if database is available
    if (!env.DB) {
      return new Response('Analytics Worker - Database not configured yet', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    return new Response('Analytics Worker - Ready', {
      headers: { 'Content-Type': 'text/plain' },
    });
  },
};

export interface Env {
  // Environment variables
  DB?: D1Database; // Optional - will be undefined if not configured
  ENVIRONMENT?: string;
  ANALYTICS_CALCULATION_TIMEOUT?: string;
  CACHE_TTL?: string;
  CORS_ORIGINS?: string;
}
