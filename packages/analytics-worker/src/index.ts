// Analytics Cloudflare Worker
import { Router } from './router';
import {
  calculatePerformanceMetrics,
  storePerformanceAnalytics,
  getUserPerformanceAnalytics,
  getSubjectWiseBreakdown,
  type PerformanceMetrics,
} from './analytics-utils';
import {
  calculateProgressData,
  compareTestSessions,
  calculateTrends,
  generateRecommendations,
  type ProgressData,
  type ComparisonData,
  type TrendAnalysis,
  type Recommendation,
} from './progress-utils';

export interface Env {
  DB: D1Database;
  ENVIRONMENT?: string;
  ANALYTICS_CALCULATION_TIMEOUT?: string;
  CACHE_TTL?: string;
  CORS_ORIGINS?: string;
}

const router = new Router();

/**
 * GET /analytics/performance/:userId
 * Get performance metrics for a user
 */
router.get(
  '/analytics/performance/:userId',
  async (request, env, ctx, params) => {
    const userId = params?.userId;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const analytics = await getUserPerformanceAnalytics(env.DB, userId);

      return new Response(JSON.stringify({ analytics }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'ANALYTICS_ERROR',
            message: 'Failed to retrieve performance analytics',
            details: error instanceof Error ? error.message : String(error),
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
);

/**
 * GET /analytics/subject-analysis/:userId
 * Get subject-wise breakdown for a user
 */
router.get(
  '/analytics/subject-analysis/:userId',
  async (request, env, ctx, params) => {
    const userId = params?.userId;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const subjectAnalysis = await getSubjectWiseBreakdown(env.DB, userId);

      return new Response(JSON.stringify({ subjectAnalysis }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'ANALYTICS_ERROR',
            message: 'Failed to retrieve subject analysis',
            details: error instanceof Error ? error.message : String(error),
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
);

/**
 * POST /analytics/calculate/:sessionId
 * Calculate and store performance metrics for a completed test session
 */
router.post(
  '/analytics/calculate/:sessionId',
  async (request, env, ctx, params) => {
    const sessionId = params?.sessionId;
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Session ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const startTime = Date.now();

      // Calculate performance metrics
      const metrics = await calculatePerformanceMetrics(env.DB, sessionId);

      // Store analytics in database
      await storePerformanceAnalytics(env.DB, metrics);

      const calculationTime = Date.now() - startTime;

      // Check if calculation time exceeds timeout (30 seconds requirement)
      const timeout =
        parseInt(env.ANALYTICS_CALCULATION_TIMEOUT || '30', 10) * 1000;
      if (calculationTime > timeout) {
        console.warn(
          `Analytics calculation took ${calculationTime}ms, exceeding ${timeout}ms timeout`
        );
      }

      return new Response(
        JSON.stringify({
          metrics,
          calculationTime,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'CALCULATION_ERROR',
            message: 'Failed to calculate performance metrics',
            details: error instanceof Error ? error.message : String(error),
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
);

/**
 * GET /analytics/progress/:userId
 * Get progress tracking data for a user
 */
router.get('/analytics/progress/:userId', async (request, env, ctx, params) => {
  const userId = params?.userId;
  if (!userId) {
    return new Response(JSON.stringify({ error: 'User ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const progressData = await calculateProgressData(env.DB, userId);

    return new Response(JSON.stringify({ progressData }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'PROGRESS_ERROR',
          message: 'Failed to retrieve progress data',
          details: error instanceof Error ? error.message : String(error),
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * POST /analytics/compare/:userId
 * Compare multiple test sessions
 */
router.post('/analytics/compare/:userId', async (request, env, ctx, params) => {
  const userId = params?.userId;
  if (!userId) {
    return new Response(JSON.stringify({ error: 'User ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await request.json()) as { testSessionIds: string[] };
    const { testSessionIds } = body;

    if (
      !testSessionIds ||
      !Array.isArray(testSessionIds) ||
      testSessionIds.length < 2
    ) {
      return new Response(
        JSON.stringify({ error: 'At least 2 test session IDs are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const comparisonData = await compareTestSessions(
      env.DB,
      userId,
      testSessionIds
    );

    return new Response(JSON.stringify({ comparisonData }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'COMPARISON_ERROR',
          message: 'Failed to compare test sessions',
          details: error instanceof Error ? error.message : String(error),
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * GET /analytics/trends/:userId
 * Get trend analysis for a user
 */
router.get('/analytics/trends/:userId', async (request, env, ctx, params) => {
  const userId = params?.userId;
  if (!userId) {
    return new Response(JSON.stringify({ error: 'User ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const trends = await calculateTrends(env.DB, userId);

    return new Response(JSON.stringify({ trends }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'TRENDS_ERROR',
          message: 'Failed to calculate trends',
          details: error instanceof Error ? error.message : String(error),
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * GET /analytics/recommendations/:userId
 * Get personalized recommendations for a user
 */
router.get(
  '/analytics/recommendations/:userId',
  async (request, env, ctx, params) => {
    const userId = params?.userId;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const recommendations = await generateRecommendations(env.DB, userId);

      return new Response(JSON.stringify({ recommendations }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'RECOMMENDATIONS_ERROR',
            message: 'Failed to generate recommendations',
            details: error instanceof Error ? error.message : String(error),
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
);

/**
 * Health check endpoint
 */
router.get('/health', async (request, env, ctx) => {
  return new Response(
    JSON.stringify({
      status: 'healthy',
      service: 'analytics-worker',
      timestamp: new Date().toISOString(),
      environment: env.ENVIRONMENT || 'unknown',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
});

/**
 * Detailed health check endpoint
 */
router.get('/health/detailed', async (request, env, ctx) => {
  const checks: Record<string, any> = {
    service: 'healthy',
    database: 'unknown',
  };

  // Check database connectivity
  try {
    await env.DB.prepare('SELECT 1').first();
    checks.database = 'healthy';
  } catch (error) {
    checks.database = 'unhealthy';
    checks.databaseError =
      error instanceof Error ? error.message : 'Unknown error';
  }

  const isHealthy = checks.database === 'healthy';

  return new Response(
    JSON.stringify({
      status: isHealthy ? 'healthy' : 'degraded',
      service: 'analytics-worker',
      timestamp: new Date().toISOString(),
      environment: env.ENVIRONMENT || 'unknown',
      checks,
      uptime: Date.now(),
    }),
    {
      status: isHealthy ? 200 : 503,
      headers: { 'Content-Type': 'application/json' },
    }
  );
});

// Legacy health endpoint for backwards compatibility
router.get('/analytics/health', async (request, env, ctx) => {
  return new Response(
    JSON.stringify({
      status: 'healthy',
      service: 'analytics-worker',
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
});

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    return router.handle(request, env, ctx);
  },
};
