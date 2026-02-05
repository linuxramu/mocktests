// AI Question Generator Cloudflare Worker
import { Question } from '@eamcet-platform/shared';

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    return new Response('AI Worker - Basic deployment successful', {
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
  QUESTION_GENERATION_TIMEOUT?: string;
  MAX_QUESTIONS_PER_BATCH?: string;
  CORS_ORIGINS?: string;
}
