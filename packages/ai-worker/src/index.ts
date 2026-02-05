// AI Question Generator Cloudflare Worker
import { Question } from '@eamcet-platform/shared';

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    return new Response('AI Worker - Placeholder', {
      headers: { 'Content-Type': 'text/plain' },
    });
  },
};

export interface Env {
  DB: D1Database;
  AI_API_KEY: string;
}
