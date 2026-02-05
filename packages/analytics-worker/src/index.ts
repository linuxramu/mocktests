// Analytics Cloudflare Worker
import { PerformanceAnalytics } from '@eamcet-platform/shared';

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    return new Response('Analytics Worker - Placeholder', {
      headers: { 'Content-Type': 'text/plain' },
    });
  },
};

export interface Env {
  // Environment variables will be defined here
  // DB bindings will be added later when databases are configured
}
