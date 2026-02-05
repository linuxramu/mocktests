// AI Question Generator Cloudflare Worker
import { Question } from '@eamcet-platform/shared';

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    // Check if database and API key are available
    if (!env.DB) {
      return new Response('AI Worker - Database not configured yet', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    if (!env.AI_API_KEY) {
      return new Response('AI Worker - API key not configured yet', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    return new Response('AI Worker - Ready', {
      headers: { 'Content-Type': 'text/plain' },
    });
  },
};

export interface Env {
  // Environment variables
  DB?: D1Database; // Optional - will be undefined if not configured
  AI_API_KEY?: string; // Optional - will be undefined if not configured
  ENVIRONMENT?: string;
  QUESTION_GENERATION_TIMEOUT?: string;
  MAX_QUESTIONS_PER_BATCH?: string;
  CORS_ORIGINS?: string;
}
