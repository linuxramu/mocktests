// Rate limiting middleware for Cloudflare Workers using KV
import {
  checkRateLimit,
  type RateLimitConfig,
  type RateLimitState,
} from '@eamcet-platform/shared';

export interface RateLimiterEnv {
  RATE_LIMIT_KV?: KVNamespace;
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  login: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 minutes
  register: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 requests per hour
  default: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 requests per minute
};

/**
 * Get rate limit key for a request
 */
function getRateLimitKey(identifier: string, endpoint: string): string {
  return `ratelimit:${endpoint}:${identifier}`;
}

/**
 * Get identifier from request (IP address or user ID)
 */
function getIdentifier(request: Request, userId?: string): string {
  if (userId) return userId;

  // Try to get IP from Cloudflare headers
  const cfConnectingIp = request.headers.get('CF-Connecting-IP');
  if (cfConnectingIp) return cfConnectingIp;

  // Fallback to X-Forwarded-For
  const xForwardedFor = request.headers.get('X-Forwarded-For');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }

  return 'unknown';
}

/**
 * Apply rate limiting to a request
 */
export async function applyRateLimit(
  request: Request,
  env: RateLimiterEnv,
  endpoint: string,
  userId?: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  // If KV is not configured, allow all requests (development mode)
  if (!env.RATE_LIMIT_KV) {
    return { allowed: true };
  }

  const identifier = getIdentifier(request, userId);
  const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default;
  const key = getRateLimitKey(identifier, endpoint);

  // Get current state from KV
  const stateJson = await env.RATE_LIMIT_KV.get(key);
  const state: RateLimitState | null = stateJson ? JSON.parse(stateJson) : null;

  // Check rate limit
  const result = checkRateLimit(state, config);

  // Store new state in KV
  if (result.allowed) {
    const ttl = Math.ceil(config.windowMs / 1000);
    await env.RATE_LIMIT_KV.put(key, JSON.stringify(result.newState), {
      expirationTtl: ttl,
    });
  }

  return {
    allowed: result.allowed,
    retryAfter: result.retryAfter,
  };
}

/**
 * Create rate limit error response
 */
export function rateLimitErrorResponse(retryAfter: number): Response {
  return new Response(
    JSON.stringify({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        retryAfter,
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
      },
    }
  );
}
