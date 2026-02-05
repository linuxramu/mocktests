// Test Engine Cloudflare Worker
import { TestSession } from '@eamcet-platform/shared';

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    return new Response('Test Engine Worker - Basic deployment successful', {
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
  TEST_DURATION_LIMIT?: string;
  MAX_QUESTIONS_PER_TEST?: string;
  WEBSOCKET_TIMEOUT?: string;
  CORS_ORIGINS?: string;
}
