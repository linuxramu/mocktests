// Test Engine Cloudflare Worker
import { TestSession } from '@eamcet-platform/shared';

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    return new Response('Test Engine Worker - Placeholder', {
      headers: { 'Content-Type': 'text/plain' },
    });
  },
};

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
}
