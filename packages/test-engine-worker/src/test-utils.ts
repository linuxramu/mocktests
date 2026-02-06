// Test engine utility functions
import {
  generateUUID,
  rowToTestSession,
  testSessionToRow,
  rowToQuestion,
  rowToUserAnswer,
  userAnswerToRow,
  type TestSession,
  type TestConfiguration,
  type Question,
  type UserAnswer,
} from '@eamcet-platform/shared';

/**
 * Create a new test session
 */
export async function createTestSession(
  db: D1Database,
  userId: string,
  config: TestConfiguration,
  testType: 'full' | 'subject-wise' | 'custom'
): Promise<TestSession> {
  const sessionId = generateUUID();
  const now = new Date();

  const session: TestSession = {
    id: sessionId,
    userId,
    testType,
    status: 'active',
    startedAt: now,
    totalQuestions: config.subjects.length * config.questionsPerSubject,
    configuration: config,
  };

  const row = testSessionToRow(session);

  await db
    .prepare(
      `INSERT INTO test_sessions (id, user_id, test_type, status, started_at, completed_at, duration_seconds, total_questions, configuration)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      row.id,
      row.user_id,
      row.test_type,
      row.status,
      row.started_at,
      row.completed_at,
      row.duration_seconds,
      row.total_questions,
      row.configuration
    )
    .run();

  return session;
}

/**
 * Get test session by ID
 */
export async function getTestSession(
  db: D1Database,
  sessionId: string
): Promise<TestSession | null> {
  const row = await db
    .prepare('SELECT * FROM test_sessions WHERE id = ?')
    .bind(sessionId)
    .first();

  if (!row) return null;

  return rowToTestSession(row);
}

/**
 * Update test session status
 */
export async function updateTestSessionStatus(
  db: D1Database,
  sessionId: string,
  status: 'active' | 'completed' | 'abandoned',
  durationSeconds?: number
): Promise<void> {
  const completedAt = status === 'completed' ? new Date().toISOString() : null;

  await db
    .prepare(
      `UPDATE test_sessions 
       SET status = ?, completed_at = ?, duration_seconds = ?
       WHERE id = ?`
    )
    .bind(status, completedAt, durationSeconds ?? null, sessionId)
    .run();
}

/**
 * Get questions for a test session
 */
export async function getSessionQuestions(
  db: D1Database,
  sessionId: string
): Promise<Question[]> {
  const rows = await db
    .prepare(
      `SELECT q.* FROM questions q
       INNER JOIN test_questions tq ON q.id = tq.question_id
       WHERE tq.test_session_id = ?
       ORDER BY tq.question_number`
    )
    .bind(sessionId)
    .all();

  return rows.results.map(rowToQuestion);
}

/**
 * Get a specific question for a test session
 */
export async function getSessionQuestion(
  db: D1Database,
  sessionId: string,
  questionNumber: number
): Promise<Question | null> {
  const row = await db
    .prepare(
      `SELECT q.* FROM questions q
       INNER JOIN test_questions tq ON q.id = tq.question_id
       WHERE tq.test_session_id = ? AND tq.question_number = ?`
    )
    .bind(sessionId, questionNumber)
    .first();

  if (!row) return null;

  return rowToQuestion(row);
}

/**
 * Submit an answer for a question
 */
export async function submitAnswer(
  db: D1Database,
  sessionId: string,
  questionId: string,
  selectedAnswer: string | null,
  timeSpentSeconds: number,
  isMarkedForReview: boolean = false
): Promise<UserAnswer> {
  // Get the correct answer
  const question = await db
    .prepare('SELECT correct_answer FROM questions WHERE id = ?')
    .bind(questionId)
    .first<{ correct_answer: string }>();

  if (!question) {
    throw new Error('Question not found');
  }

  const isCorrect = selectedAnswer === question.correct_answer;
  const answerId = generateUUID();
  const now = new Date();

  const answer: UserAnswer = {
    id: answerId,
    testSessionId: sessionId,
    questionId,
    selectedAnswer: selectedAnswer ?? undefined,
    isCorrect,
    timeSpentSeconds,
    answeredAt: now,
    isMarkedForReview,
  };

  const row = userAnswerToRow(answer);

  // Check if answer already exists
  const existing = await db
    .prepare(
      'SELECT id FROM user_answers WHERE test_session_id = ? AND question_id = ?'
    )
    .bind(sessionId, questionId)
    .first();

  if (existing) {
    // Update existing answer
    await db
      .prepare(
        `UPDATE user_answers 
         SET selected_answer = ?, is_correct = ?, time_spent_seconds = ?, answered_at = ?, is_marked_for_review = ?
         WHERE test_session_id = ? AND question_id = ?`
      )
      .bind(
        row.selected_answer,
        row.is_correct,
        row.time_spent_seconds,
        row.answered_at,
        row.is_marked_for_review,
        sessionId,
        questionId
      )
      .run();
  } else {
    // Insert new answer
    await db
      .prepare(
        `INSERT INTO user_answers (id, test_session_id, question_id, selected_answer, is_correct, time_spent_seconds, answered_at, is_marked_for_review)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        row.id,
        row.test_session_id,
        row.question_id,
        row.selected_answer,
        row.is_correct,
        row.time_spent_seconds,
        row.answered_at,
        row.is_marked_for_review
      )
      .run();
  }

  return answer;
}

/**
 * Get all answers for a test session
 */
export async function getSessionAnswers(
  db: D1Database,
  sessionId: string
): Promise<UserAnswer[]> {
  const rows = await db
    .prepare('SELECT * FROM user_answers WHERE test_session_id = ?')
    .bind(sessionId)
    .all();

  return rows.results.map(rowToUserAnswer);
}

/**
 * Assign questions to a test session
 */
export async function assignQuestionsToSession(
  db: D1Database,
  sessionId: string,
  config: TestConfiguration
): Promise<void> {
  const questions: Question[] = [];

  // Fetch questions for each subject
  for (const subject of config.subjects) {
    if (config.difficulty === 'mixed') {
      // For mixed difficulty, get distribution
      const distribution = getDifficultyDistribution(
        config.questionsPerSubject
      );

      // Fetch questions for each difficulty level
      for (const [difficulty, count] of Object.entries(distribution)) {
        if (count > 0) {
          const rows = await db
            .prepare(
              `SELECT * FROM questions WHERE subject = ? AND difficulty = ? ORDER BY RANDOM() LIMIT ?`
            )
            .bind(subject, difficulty, count)
            .all();

          questions.push(...rows.results.map(rowToQuestion));
        }
      }
    } else {
      // Single difficulty level
      const rows = await db
        .prepare(
          `SELECT * FROM questions WHERE subject = ? AND difficulty = ? ORDER BY RANDOM() LIMIT ?`
        )
        .bind(subject, config.difficulty, config.questionsPerSubject)
        .all();

      questions.push(...rows.results.map(rowToQuestion));
    }
  }

  // Randomize if configured
  if (config.randomizeQuestions) {
    questions.sort(() => Math.random() - 0.5);
  }

  // Insert test_questions records
  for (let i = 0; i < questions.length; i++) {
    await db
      .prepare(
        `INSERT INTO test_questions (id, test_session_id, question_id, question_number)
         VALUES (?, ?, ?, ?)`
      )
      .bind(generateUUID(), sessionId, questions[i].id, i + 1)
      .run();
  }
}

/**
 * Get difficulty distribution for mixed difficulty tests
 */
function getDifficultyDistribution(totalQuestions: number): {
  easy: number;
  medium: number;
  hard: number;
} {
  // EAMCET-like distribution: 30% easy, 50% medium, 20% hard
  const easy = Math.floor(totalQuestions * 0.3);
  const hard = Math.floor(totalQuestions * 0.2);
  const medium = totalQuestions - easy - hard;

  return { easy, medium, hard };
}

/**
 * Calculate remaining time for a test session
 */
export function calculateRemainingTime(session: TestSession): number {
  const timeLimitMs = session.configuration.timeLimit * 60 * 1000;
  const elapsedMs = Date.now() - session.startedAt.getTime();
  const remainingMs = Math.max(0, timeLimitMs - elapsedMs);
  return Math.floor(remainingMs / 1000); // Return seconds
}

/**
 * Check if test session has expired
 */
export function isSessionExpired(session: TestSession): boolean {
  return calculateRemainingTime(session) === 0;
}

/**
 * Get test session progress
 */
export async function getSessionProgress(
  db: D1Database,
  sessionId: string
): Promise<{
  totalQuestions: number;
  answeredQuestions: number;
  markedForReview: number;
  unansweredQuestions: number;
}> {
  const session = await getTestSession(db, sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  const answers = await getSessionAnswers(db, sessionId);

  const answeredQuestions = answers.filter(a => a.selectedAnswer).length;
  const markedForReview = answers.filter(a => a.isMarkedForReview).length;

  return {
    totalQuestions: session.totalQuestions,
    answeredQuestions,
    markedForReview,
    unansweredQuestions: session.totalQuestions - answeredQuestions,
  };
}
