// Test Engine Cloudflare Worker
import { Router } from './router';
import {
  TestConfigurationSchema,
  type TestConfiguration,
  type TestSession,
  type Question,
  type UserAnswer,
} from '@eamcet-platform/shared';
import {
  createTestSession,
  getTestSession,
  updateTestSessionStatus,
  getSessionQuestions,
  getSessionQuestion,
  submitAnswer,
  getSessionAnswers,
  assignQuestionsToSession,
  calculateRemainingTime,
  isSessionExpired,
  getSessionProgress,
} from './test-utils';

export interface Env {
  DB: D1Database;
  ENVIRONMENT?: string;
  TEST_DURATION_LIMIT?: string;
  MAX_QUESTIONS_PER_TEST?: string;
  WEBSOCKET_TIMEOUT?: string;
  CORS_ORIGINS?: string;
}

// Request/Response types
interface StartTestRequest {
  userId: string;
  testType: 'full' | 'subject-wise' | 'custom';
  configuration: TestConfiguration;
}

interface SubmitAnswerRequest {
  questionId: string;
  selectedAnswer: string | null;
  timeSpentSeconds: number;
  isMarkedForReview?: boolean;
}

interface TestResults {
  sessionId: string;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  accuracy: number;
  totalTimeSeconds: number;
}

// Helper functions
function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: any
): Response {
  return jsonResponse(
    {
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    },
    status
  );
}

async function parseJsonBody<T>(request: Request): Promise<T | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// Route handlers
async function handleGetAvailableTests(
  request: Request,
  env: Env
): Promise<Response> {
  // Return available test configurations
  const availableTests = [
    {
      id: 'full-test',
      name: 'Full EAMCET Mock Test',
      testType: 'full',
      description: 'Complete mock test with all subjects',
      configuration: {
        subjects: ['physics', 'chemistry', 'mathematics'],
        questionsPerSubject: 40,
        timeLimit: 180,
        difficulty: 'mixed',
        randomizeQuestions: true,
      },
    },
    {
      id: 'physics-test',
      name: 'Physics Subject Test',
      testType: 'subject-wise',
      description: 'Physics only mock test',
      configuration: {
        subjects: ['physics'],
        questionsPerSubject: 40,
        timeLimit: 60,
        difficulty: 'mixed',
        randomizeQuestions: true,
      },
    },
    {
      id: 'chemistry-test',
      name: 'Chemistry Subject Test',
      testType: 'subject-wise',
      description: 'Chemistry only mock test',
      configuration: {
        subjects: ['chemistry'],
        questionsPerSubject: 40,
        timeLimit: 60,
        difficulty: 'mixed',
        randomizeQuestions: true,
      },
    },
    {
      id: 'mathematics-test',
      name: 'Mathematics Subject Test',
      testType: 'subject-wise',
      description: 'Mathematics only mock test',
      configuration: {
        subjects: ['mathematics'],
        questionsPerSubject: 40,
        timeLimit: 60,
        difficulty: 'mixed',
        randomizeQuestions: true,
      },
    },
  ];

  return jsonResponse(availableTests);
}

async function handleStartTest(request: Request, env: Env): Promise<Response> {
  const body = await parseJsonBody<StartTestRequest>(request);

  if (!body || !body.userId || !body.testType || !body.configuration) {
    return errorResponse(
      'INVALID_REQUEST',
      'userId, testType, and configuration are required',
      400
    );
  }

  // Validate configuration
  const configValidation = TestConfigurationSchema.safeParse(
    body.configuration
  );
  if (!configValidation.success) {
    return errorResponse(
      'INVALID_CONFIGURATION',
      'Invalid test configuration',
      400,
      configValidation.error.errors
    );
  }

  try {
    // Create test session
    const session = await createTestSession(
      env.DB,
      body.userId,
      body.configuration,
      body.testType
    );

    // Assign questions to session
    await assignQuestionsToSession(env.DB, session.id, body.configuration);

    return jsonResponse(session, 201);
  } catch (error: any) {
    return errorResponse(
      'TEST_CREATION_FAILED',
      'Failed to create test session',
      500,
      error.message
    );
  }
}

async function handleGetSession(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  params?: Record<string, string>
): Promise<Response> {
  const sessionId = params?.id;
  if (!sessionId) {
    return errorResponse('INVALID_REQUEST', 'Session ID is required', 400);
  }

  const session = await getTestSession(env.DB, sessionId);
  if (!session) {
    return errorResponse('SESSION_NOT_FOUND', 'Test session not found', 404);
  }

  // Check if session has expired
  if (session.status === 'active' && isSessionExpired(session)) {
    // Auto-submit expired session
    const elapsedSeconds = Math.floor(
      (Date.now() - session.startedAt.getTime()) / 1000
    );
    await updateTestSessionStatus(
      env.DB,
      sessionId,
      'completed',
      elapsedSeconds
    );
    session.status = 'completed';
    session.completedAt = new Date();
    session.durationSeconds = elapsedSeconds;
  }

  // Get progress
  const progress = await getSessionProgress(env.DB, sessionId);

  return jsonResponse({
    session,
    progress,
    remainingTimeSeconds:
      session.status === 'active' ? calculateRemainingTime(session) : 0,
  });
}

async function handleGetQuestion(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  params?: Record<string, string>
): Promise<Response> {
  const sessionId = params?.id;
  const questionNum = params?.num ? parseInt(params.num) : null;

  if (!sessionId || questionNum === null) {
    return errorResponse(
      'INVALID_REQUEST',
      'Session ID and question number are required',
      400
    );
  }

  const session = await getTestSession(env.DB, sessionId);
  if (!session) {
    return errorResponse('SESSION_NOT_FOUND', 'Test session not found', 404);
  }

  if (session.status !== 'active') {
    return errorResponse(
      'SESSION_NOT_ACTIVE',
      'Test session is not active',
      400
    );
  }

  // Check if session has expired
  if (isSessionExpired(session)) {
    const elapsedSeconds = Math.floor(
      (Date.now() - session.startedAt.getTime()) / 1000
    );
    await updateTestSessionStatus(
      env.DB,
      sessionId,
      'completed',
      elapsedSeconds
    );
    return errorResponse('SESSION_EXPIRED', 'Test session has expired', 400);
  }

  const question = await getSessionQuestion(env.DB, sessionId, questionNum);
  if (!question) {
    return errorResponse('QUESTION_NOT_FOUND', 'Question not found', 404);
  }

  // Get existing answer if any
  const answers = await getSessionAnswers(env.DB, sessionId);
  const existingAnswer = answers.find(a => a.questionId === question.id);

  return jsonResponse({
    question: {
      ...question,
      correctAnswer: undefined, // Don't send correct answer to client
    },
    questionNumber: questionNum,
    totalQuestions: session.totalQuestions,
    existingAnswer: existingAnswer
      ? {
          selectedAnswer: existingAnswer.selectedAnswer,
          isMarkedForReview: existingAnswer.isMarkedForReview,
        }
      : null,
    remainingTimeSeconds: calculateRemainingTime(session),
  });
}

async function handleSubmitAnswer(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  params?: Record<string, string>
): Promise<Response> {
  const sessionId = params?.id;
  if (!sessionId) {
    return errorResponse('INVALID_REQUEST', 'Session ID is required', 400);
  }

  const body = await parseJsonBody<SubmitAnswerRequest>(request);
  if (!body || !body.questionId) {
    return errorResponse(
      'INVALID_REQUEST',
      'questionId and answer data are required',
      400
    );
  }

  const session = await getTestSession(env.DB, sessionId);
  if (!session) {
    return errorResponse('SESSION_NOT_FOUND', 'Test session not found', 404);
  }

  if (session.status !== 'active') {
    return errorResponse(
      'SESSION_NOT_ACTIVE',
      'Test session is not active',
      400
    );
  }

  // Check if session has expired
  if (isSessionExpired(session)) {
    const elapsedSeconds = Math.floor(
      (Date.now() - session.startedAt.getTime()) / 1000
    );
    await updateTestSessionStatus(
      env.DB,
      sessionId,
      'completed',
      elapsedSeconds
    );
    return errorResponse('SESSION_EXPIRED', 'Test session has expired', 400);
  }

  try {
    const answer = await submitAnswer(
      env.DB,
      sessionId,
      body.questionId,
      body.selectedAnswer ?? null,
      body.timeSpentSeconds,
      body.isMarkedForReview ?? false
    );

    return jsonResponse({
      success: true,
      answerId: answer.id,
    });
  } catch (error: any) {
    return errorResponse(
      'ANSWER_SUBMISSION_FAILED',
      'Failed to submit answer',
      500,
      error.message
    );
  }
}

async function handleSubmitTest(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  params?: Record<string, string>
): Promise<Response> {
  const sessionId = params?.id;
  if (!sessionId) {
    return errorResponse('INVALID_REQUEST', 'Session ID is required', 400);
  }

  const session = await getTestSession(env.DB, sessionId);
  if (!session) {
    return errorResponse('SESSION_NOT_FOUND', 'Test session not found', 404);
  }

  if (session.status !== 'active') {
    return errorResponse(
      'SESSION_NOT_ACTIVE',
      'Test session is not active',
      400
    );
  }

  // Calculate duration
  const durationSeconds = Math.floor(
    (Date.now() - session.startedAt.getTime()) / 1000
  );

  // Update session status
  await updateTestSessionStatus(
    env.DB,
    sessionId,
    'completed',
    durationSeconds
  );

  // Calculate results
  const answers = await getSessionAnswers(env.DB, sessionId);
  const answeredQuestions = answers.filter(a => a.selectedAnswer).length;
  const correctAnswers = answers.filter(a => a.isCorrect).length;
  const accuracy =
    answeredQuestions > 0 ? (correctAnswers / answeredQuestions) * 100 : 0;

  const results: TestResults = {
    sessionId,
    totalQuestions: session.totalQuestions,
    answeredQuestions,
    correctAnswers,
    accuracy,
    totalTimeSeconds: durationSeconds,
  };

  return jsonResponse(results);
}

async function handleGetHistory(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return errorResponse('INVALID_REQUEST', 'userId is required', 400);
  }

  const rows = await env.DB.prepare(
    'SELECT * FROM test_sessions WHERE user_id = ? ORDER BY started_at DESC'
  )
    .bind(userId)
    .all();

  const sessions = rows.results.map(row => {
    const session = {
      id: (row as any).id,
      userId: (row as any).user_id,
      testType: (row as any).test_type,
      status: (row as any).status,
      startedAt: (row as any).started_at,
      completedAt: (row as any).completed_at,
      durationSeconds: (row as any).duration_seconds,
      totalQuestions: (row as any).total_questions,
    };
    return session;
  });

  return jsonResponse(sessions);
}

// Initialize router
const router = new Router();

router.get('/tests/available', handleGetAvailableTests);
router.post('/tests/start', handleStartTest);
router.get('/tests/session/:id', handleGetSession);
router.get('/tests/session/:id/question/:num', handleGetQuestion);
router.post('/tests/session/:id/answer', handleSubmitAnswer);
router.post('/tests/session/:id/submit', handleSubmitTest);
router.get('/tests/history', handleGetHistory);

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    return router.handle(request, env, ctx);
  },
};
