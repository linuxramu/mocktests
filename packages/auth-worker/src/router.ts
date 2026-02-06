// Request router for authentication endpoints
import type { Env } from './index';

export type RouteHandler = (
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  params?: Record<string, string>
) => Promise<Response>;

interface Route {
  method: string;
  pattern: RegExp;
  handler: RouteHandler;
  paramNames: string[];
}

export class Router {
  private routes: Route[] = [];

  /**
   * Register a route
   */
  private addRoute(method: string, path: string, handler: RouteHandler): void {
    // Convert path pattern to regex and extract param names
    const paramNames: string[] = [];
    const pattern = new RegExp(
      '^' +
        path.replace(/\//g, '\\/').replace(/:([^/]+)/g, (_, paramName) => {
          paramNames.push(paramName);
          return '([^/]+)';
        }) +
        '$'
    );

    this.routes.push({ method, pattern, handler, paramNames });
  }

  get(path: string, handler: RouteHandler): void {
    this.addRoute('GET', path, handler);
  }

  post(path: string, handler: RouteHandler): void {
    this.addRoute('POST', path, handler);
  }

  put(path: string, handler: RouteHandler): void {
    this.addRoute('PUT', path, handler);
  }

  delete(path: string, handler: RouteHandler): void {
    this.addRoute('DELETE', path, handler);
  }

  /**
   * Handle incoming request
   */
  async handle(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return this.corsResponse();
    }

    // Find matching route
    for (const route of this.routes) {
      if (route.method !== method) continue;

      const match = url.pathname.match(route.pattern);
      if (match) {
        const params: Record<string, string> = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        try {
          const response = await route.handler(request, env, ctx, params);
          return this.addCorsHeaders(response);
        } catch (error) {
          return this.errorResponse(
            'INTERNAL_ERROR',
            'Internal server error',
            500,
            error
          );
        }
      }
    }

    return this.errorResponse('NOT_FOUND', 'Route not found', 404);
  }

  /**
   * Create CORS preflight response
   */
  private corsResponse(): Response {
    return new Response(null, {
      status: 204,
      headers: this.getCorsHeaders(),
    });
  }

  /**
   * Get CORS headers
   */
  private getCorsHeaders(): HeadersInit {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };
  }

  /**
   * Add CORS headers to response
   */
  private addCorsHeaders(response: Response): Response {
    const newHeaders = new Headers(response.headers);
    Object.entries(this.getCorsHeaders()).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }

  /**
   * Create error response
   */
  private errorResponse(
    code: string,
    message: string,
    status: number,
    details?: any
  ): Response {
    return new Response(
      JSON.stringify({
        error: {
          code,
          message,
          details: details?.message || details,
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      }),
      {
        status,
        headers: {
          'Content-Type': 'application/json',
          ...this.getCorsHeaders(),
        },
      }
    );
  }
}
