// Analytics Cloudflare Worker
import { PerformanceAnalytics } from '@eamcet-platform/shared';

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    return new Response('Analytics Worker - Basic deployment successful', {
      headers: { 
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*'
      },
    });
  },
};

export interface Env {
  // Environment variables
  ENVIRONMENT?: string;
  ANALYTICS_CALCULATION_TIMEOUT?: string;
  CACHE_TTL?: string;
  CORS_ORIGINS?: string;
}
