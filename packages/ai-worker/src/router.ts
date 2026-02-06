// AI Worker Router
import {
  generateQuestions,
  validateQuestion,
  storeQuestion,
  getQuestions,
  GenerationParams,
  assessDifficulty,
  classifySubject,
  extractTopicTags,
  validateQuestionDistribution,
  DistributionRequirements,
} from './ai-utils';
import { Question } from '@eamcet-platform/shared';

export interface Env {
  DB: D1Database;
  ENVIRONMENT?: string;
  QUESTION_GENERATION_TIMEOUT?: string;
  MAX_QUESTIONS_PER_BATCH?: string;
  CORS_ORIGINS?: string;
}

// CORS headers helper
function getCorsHeaders(
  origin: string | null,
  allowedOrigins: string
): Headers {
  const headers = new Headers();

  if (origin && allowedOrigins.split(',').includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  } else {
    headers.set('Access-Control-Allow-Origin', '*');
  }

  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Max-Age', '86400');

  return headers;
}

// Handle CORS preflight
function handleOptions(request: Request, env: Env): Response {
  const origin = request.headers.get('Origin');
  const corsOrigins = env.CORS_ORIGINS || '*';
  const headers = getCorsHeaders(origin, corsOrigins);

  return new Response(null, { status: 204, headers });
}

// Error response helper
function errorResponse(
  message: string,
  status: number,
  corsHeaders: Headers
): Response {
  const error = {
    error: {
      code: `AI_ERROR_${status}`,
      message,
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    },
  };

  const headers = new Headers(corsHeaders);
  headers.set('Content-Type', 'application/json');

  return new Response(JSON.stringify(error), { status, headers });
}

// Success response helper
function successResponse(data: any, corsHeaders: Headers): Response {
  const headers = new Headers(corsHeaders);
  headers.set('Content-Type', 'application/json');

  return new Response(JSON.stringify(data), { status: 200, headers });
}

// Route handlers
export async function handleGenerateQuestions(
  request: Request,
  env: Env
): Promise<Response> {
  const origin = request.headers.get('Origin');
  const corsOrigins = env.CORS_ORIGINS || '*';
  const corsHeaders = getCorsHeaders(origin, corsOrigins);

  try {
    const body = (await request.json()) as GenerationParams;

    // Validate input
    if (
      !body.subject ||
      !['physics', 'chemistry', 'mathematics'].includes(body.subject)
    ) {
      return errorResponse(
        'Invalid subject. Must be physics, chemistry, or mathematics',
        400,
        corsHeaders
      );
    }

    if (
      !body.difficulty ||
      !['easy', 'medium', 'hard'].includes(body.difficulty)
    ) {
      return errorResponse(
        'Invalid difficulty. Must be easy, medium, or hard',
        400,
        corsHeaders
      );
    }

    const maxBatch = parseInt(env.MAX_QUESTIONS_PER_BATCH || '50');
    if (!body.count || body.count < 1 || body.count > maxBatch) {
      return errorResponse(
        `Invalid count. Must be between 1 and ${maxBatch}`,
        400,
        corsHeaders
      );
    }

    // Generate questions
    const questions = generateQuestions(body);

    // Store questions in database
    for (const question of questions) {
      await storeQuestion(env.DB, question);
    }

    return successResponse(
      {
        success: true,
        count: questions.length,
        questions,
      },
      corsHeaders
    );
  } catch (error: any) {
    console.error('Error generating questions:', error);
    return errorResponse(
      error.message || 'Failed to generate questions',
      500,
      corsHeaders
    );
  }
}

export async function handleValidateQuestion(
  request: Request,
  env: Env
): Promise<Response> {
  const origin = request.headers.get('Origin');
  const corsOrigins = env.CORS_ORIGINS || '*';
  const corsHeaders = getCorsHeaders(origin, corsOrigins);

  try {
    const question = (await request.json()) as Question;

    const validation = validateQuestion(question);

    return successResponse(
      {
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
      },
      corsHeaders
    );
  } catch (error: any) {
    console.error('Error validating question:', error);
    return errorResponse(
      error.message || 'Failed to validate question',
      500,
      corsHeaders
    );
  }
}

export async function handleGetQuestions(
  request: Request,
  env: Env
): Promise<Response> {
  const origin = request.headers.get('Origin');
  const corsOrigins = env.CORS_ORIGINS || '*';
  const corsHeaders = getCorsHeaders(origin, corsOrigins);

  try {
    const url = new URL(request.url);
    const subject = url.searchParams.get('subject') || undefined;
    const difficulty = url.searchParams.get('difficulty') || undefined;
    const limit = url.searchParams.get('limit')
      ? parseInt(url.searchParams.get('limit')!)
      : 50;

    const questions = await getQuestions(env.DB, {
      subject,
      difficulty,
      limit,
    });

    return successResponse(
      {
        success: true,
        count: questions.length,
        questions,
      },
      corsHeaders
    );
  } catch (error: any) {
    console.error('Error retrieving questions:', error);
    return errorResponse(
      error.message || 'Failed to retrieve questions',
      500,
      corsHeaders
    );
  }
}

export async function handleGetQuestion(
  request: Request,
  env: Env,
  questionId: string
): Promise<Response> {
  const origin = request.headers.get('Origin');
  const corsOrigins = env.CORS_ORIGINS || '*';
  const corsHeaders = getCorsHeaders(origin, corsOrigins);

  try {
    const result = await env.DB.prepare('SELECT * FROM questions WHERE id = ?')
      .bind(questionId)
      .first();

    if (!result) {
      return errorResponse('Question not found', 404, corsHeaders);
    }

    const question: Question = {
      id: result.id as string,
      subject: result.subject as any,
      difficulty: result.difficulty as any,
      questionText: result.question_text as string,
      options: JSON.parse(result.options as string),
      correctAnswer: result.correct_answer as string,
      explanation: result.explanation as string,
      sourcePattern: result.source_pattern as string,
      metadata: JSON.parse(result.metadata as string),
    };

    return successResponse({ success: true, question }, corsHeaders);
  } catch (error: any) {
    console.error('Error retrieving question:', error);
    return errorResponse(
      error.message || 'Failed to retrieve question',
      500,
      corsHeaders
    );
  }
}

// Main router
export async function router(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return handleOptions(request, env);
  }

  // Route matching
  if (path === '/ai/generate-questions' && method === 'POST') {
    return handleGenerateQuestions(request, env);
  }

  if (path === '/ai/validate-question' && method === 'POST') {
    return handleValidateQuestion(request, env);
  }

  if (path === '/ai/questions' && method === 'GET') {
    return handleGetQuestions(request, env);
  }

  // Match /ai/questions/:id
  const questionMatch = path.match(/^\/ai\/questions\/([a-f0-9-]+)$/);
  if (questionMatch && method === 'GET') {
    return handleGetQuestion(request, env, questionMatch[1]);
  }

  // Health check
  if (path === '/ai/health' && method === 'GET') {
    const origin = request.headers.get('Origin');
    const corsOrigins = env.CORS_ORIGINS || '*';
    const corsHeaders = getCorsHeaders(origin, corsOrigins);
    return successResponse(
      { status: 'healthy', service: 'ai-worker' },
      corsHeaders
    );
  }

  // Assess difficulty
  if (path === '/ai/assess-difficulty' && method === 'POST') {
    const origin = request.headers.get('Origin');
    const corsOrigins = env.CORS_ORIGINS || '*';
    const corsHeaders = getCorsHeaders(origin, corsOrigins);

    try {
      const question = (await request.json()) as Question;
      const difficulty = assessDifficulty(question);
      return successResponse({ difficulty }, corsHeaders);
    } catch (error: any) {
      return errorResponse(
        error.message || 'Failed to assess difficulty',
        500,
        corsHeaders
      );
    }
  }

  // Classify subject
  if (path === '/ai/classify-subject' && method === 'POST') {
    const origin = request.headers.get('Origin');
    const corsOrigins = env.CORS_ORIGINS || '*';
    const corsHeaders = getCorsHeaders(origin, corsOrigins);

    try {
      const body = (await request.json()) as { questionText: string };
      const subject = classifySubject(body.questionText);
      return successResponse({ subject }, corsHeaders);
    } catch (error: any) {
      return errorResponse(
        error.message || 'Failed to classify subject',
        500,
        corsHeaders
      );
    }
  }

  // Extract topic tags
  if (path === '/ai/extract-tags' && method === 'POST') {
    const origin = request.headers.get('Origin');
    const corsOrigins = env.CORS_ORIGINS || '*';
    const corsHeaders = getCorsHeaders(origin, corsOrigins);

    try {
      const question = (await request.json()) as Question;
      const tags = extractTopicTags(question);
      return successResponse({ tags }, corsHeaders);
    } catch (error: any) {
      return errorResponse(
        error.message || 'Failed to extract tags',
        500,
        corsHeaders
      );
    }
  }

  // Validate distribution
  if (path === '/ai/validate-distribution' && method === 'POST') {
    const origin = request.headers.get('Origin');
    const corsOrigins = env.CORS_ORIGINS || '*';
    const corsHeaders = getCorsHeaders(origin, corsOrigins);

    try {
      const body = (await request.json()) as {
        questions: Question[];
        requirements: DistributionRequirements;
      };
      const validation = validateQuestionDistribution(
        body.questions,
        body.requirements
      );
      return successResponse(validation, corsHeaders);
    } catch (error: any) {
      return errorResponse(
        error.message || 'Failed to validate distribution',
        500,
        corsHeaders
      );
    }
  }

  // 404 Not Found
  const origin = request.headers.get('Origin');
  const corsOrigins = env.CORS_ORIGINS || '*';
  const corsHeaders = getCorsHeaders(origin, corsOrigins);
  return errorResponse('Not Found', 404, corsHeaders);
}
