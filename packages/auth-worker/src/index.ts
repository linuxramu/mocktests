// Authentication Cloudflare Worker
import { User } from '@eamcet-platform/shared';

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    return new Response('Authentication Worker - Basic deployment successful', {
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
      },
    });
  },
};

export interface Env {
  // Environment variables
  ENVIRONMENT?: string;
  BCRYPT_ROUNDS?: string;
  SESSION_TIMEOUT?: string;
  CORS_ORIGINS?: string;
}
