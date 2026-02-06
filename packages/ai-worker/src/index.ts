// AI Question Generator Cloudflare Worker
import { router, Env } from './router';

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    try {
      return await router(request, env);
    } catch (error: any) {
      console.error('Unhandled error in AI worker:', error);

      return new Response(
        JSON.stringify({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
  },
};

export type { Env };
