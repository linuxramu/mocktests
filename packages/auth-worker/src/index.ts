// Authentication Cloudflare Worker
import { User } from '@eamcet-platform/shared';

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    // Check if database is available
    if (!env.DB) {
      return new Response('Authentication Worker - Database not configured yet', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    return new Response('Authentication Worker - Ready', {
      headers: { 'Content-Type': 'text/plain' },
    });
  },
};

export interface Env {
  // Environment variables
  DB?: D1Database; // Optional - will be undefined if not configured
  KV?: KVNamespace; // Optional - will be undefined if not configured
  ENVIRONMENT?: string;
  BCRYPT_ROUNDS?: string;
  SESSION_TIMEOUT?: string;
  CORS_ORIGINS?: string;
}
