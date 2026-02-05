// Test Engine Cloudflare Worker
import { TestSession } from '@eamcet-platform/shared';

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    // Check if database is available
    if (!env.DB) {
      return new Response('Test Engine Worker - Database not configured yet', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    return new Response('Test Engine Worker - Ready', {
      headers: { 'Content-Type': 'text/plain' },
    });
  },
};

export interface Env {
  // Environment variables
  DB?: D1Database; // Optional - will be undefined if not configured
  KV?: KVNamespace; // Optional - will be undefined if not configured
  ENVIRONMENT?: string;
  TEST_DURATION_LIMIT?: string;
  MAX_QUESTIONS_PER_TEST?: string;
  WEBSOCKET_TIMEOUT?: string;
  CORS_ORIGINS?: string;
}
