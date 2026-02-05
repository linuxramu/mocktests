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
  // Environment variables will be defined here
  // AI_API_KEY will be added as a secret later
  // DB bindings will be added later when databases are configured
}
