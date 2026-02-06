// Authentication Cloudflare Worker
import { Router } from './router';
import {
  hashPassword,
  verifyPassword,
  generateTokenPair,
  verifyToken,
  extractBearerToken,
  isValidEmail,
  isValidPassword,
  generateVerificationToken,
} from './auth-utils';
import {
  generateUUID,
  rowToUser,
  userToRow,
  type User,
  type UserProfileData,
  sanitizeInput,
  sanitizeEmail,
  getSecureHeaders,
  getContentSecurityPolicy,
  getCorsHeaders,
} from '@eamcet-platform/shared';
import {
  applyRateLimit,
  rateLimitErrorResponse,
  type RateLimiterEnv,
} from './rate-limiter';

export interface Env extends RateLimiterEnv {
  DB: D1Database;
  JWT_SECRET: string;
  ENVIRONMENT?: string;
  ALLOWED_ORIGINS?: string;
}

// Request/Response types
interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface UpdateProfileRequest {
  name?: string;
  profileData?: UserProfileData;
}

// Helper functions
function jsonResponse(data: any, status: number = 200, env?: Env): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getSecureHeaders(),
  };

  // Add CSP header
  headers['Content-Security-Policy'] = getContentSecurityPolicy();

  return new Response(JSON.stringify(data), {
    status,
    headers,
  });
}

function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: any,
  env?: Env
): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getSecureHeaders(),
  };

  return new Response(
    JSON.stringify({
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    }),
    { status, headers }
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
async function handleRegister(request: Request, env: Env): Promise<Response> {
  // Apply rate limiting
  const rateLimit = await applyRateLimit(request, env, 'register');
  if (!rateLimit.allowed) {
    return rateLimitErrorResponse(rateLimit.retryAfter!);
  }

  const body = await parseJsonBody<RegisterRequest>(request);

  if (!body || !body.email || !body.password || !body.name) {
    return errorResponse(
      'INVALID_REQUEST',
      'Email, password, and name are required',
      400,
      undefined,
      env
    );
  }

  // Sanitize inputs
  const sanitizedEmail = sanitizeEmail(body.email);
  const sanitizedName = sanitizeInput(body.name);

  // Validate email
  if (!isValidEmail(sanitizedEmail)) {
    return errorResponse(
      'INVALID_EMAIL',
      'Invalid email format',
      400,
      undefined,
      env
    );
  }

  // Validate password
  const passwordValidation = isValidPassword(body.password);
  if (!passwordValidation.valid) {
    return errorResponse(
      'WEAK_PASSWORD',
      'Password does not meet requirements',
      400,
      passwordValidation.errors,
      env
    );
  }

  // Check if user already exists
  const existingUser = await env.DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  )
    .bind(sanitizedEmail)
    .first();

  if (existingUser) {
    return errorResponse(
      'USER_EXISTS',
      'User with this email already exists',
      409,
      undefined,
      env
    );
  }

  // Hash password
  const passwordHash = await hashPassword(body.password);

  // Create user
  const userId = generateUUID();
  const now = new Date().toISOString();
  const verificationToken = generateVerificationToken();

  const userRow = userToRow({
    id: userId,
    email: sanitizedEmail,
    name: sanitizedName,
    createdAt: new Date(now),
    updatedAt: new Date(now),
    emailVerified: false,
    profileData: {},
    passwordHash,
  });

  await env.DB.prepare(
    `INSERT INTO users (id, email, password_hash, name, created_at, updated_at, email_verified, profile_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      userRow.id,
      userRow.email,
      userRow.password_hash,
      userRow.name,
      userRow.created_at,
      userRow.updated_at,
      userRow.email_verified,
      userRow.profile_data
    )
    .run();

  // Fetch created user
  const createdUserRow = await env.DB.prepare(
    'SELECT * FROM users WHERE id = ?'
  )
    .bind(userId)
    .first();

  if (!createdUserRow) {
    return errorResponse(
      'USER_CREATION_FAILED',
      'Failed to create user',
      500,
      undefined,
      env
    );
  }

  const user = rowToUser(createdUserRow);

  // Generate tokens
  const tokens = generateTokenPair(user.id, user.email, env.JWT_SECRET);

  const response: AuthResponse = {
    user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };

  return jsonResponse(response, 201, env);
}

async function handleLogin(request: Request, env: Env): Promise<Response> {
  // Apply rate limiting
  const rateLimit = await applyRateLimit(request, env, 'login');
  if (!rateLimit.allowed) {
    return rateLimitErrorResponse(rateLimit.retryAfter!);
  }

  const body = await parseJsonBody<LoginRequest>(request);

  if (!body || !body.email || !body.password) {
    return errorResponse(
      'INVALID_REQUEST',
      'Email and password are required',
      400,
      undefined,
      env
    );
  }

  // Sanitize email
  const sanitizedEmail = sanitizeEmail(body.email);

  // Find user
  const userRow = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
    .bind(sanitizedEmail)
    .first();

  if (!userRow) {
    return errorResponse(
      'INVALID_CREDENTIALS',
      'Invalid credentials',
      401,
      undefined,
      env
    );
  }

  // Verify password
  const passwordHash = (userRow as any).password_hash;
  const isValid = await verifyPassword(body.password, passwordHash);

  if (!isValid) {
    return errorResponse(
      'INVALID_CREDENTIALS',
      'Invalid credentials',
      401,
      undefined,
      env
    );
  }

  const user = rowToUser(userRow);

  // Generate tokens
  const tokens = generateTokenPair(user.id, user.email, env.JWT_SECRET);

  const response: AuthResponse = {
    user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };

  return jsonResponse(response, 200, env);
}

async function handleLogout(request: Request, env: Env): Promise<Response> {
  // In a stateless JWT system, logout is handled client-side
  // Here we just validate the token and return success
  const authHeader = request.headers.get('Authorization');
  const token = extractBearerToken(authHeader);

  if (!token) {
    return errorResponse(
      'UNAUTHORIZED',
      'No token provided',
      401,
      undefined,
      env
    );
  }

  const payload = verifyToken(token, env.JWT_SECRET);
  if (!payload) {
    return errorResponse(
      'INVALID_TOKEN',
      'Invalid or expired token',
      401,
      undefined,
      env
    );
  }

  return jsonResponse({ message: 'Logged out successfully' }, 200, env);
}

async function handleVerify(request: Request, env: Env): Promise<Response> {
  const authHeader = request.headers.get('Authorization');
  const token = extractBearerToken(authHeader);

  if (!token) {
    return errorResponse(
      'UNAUTHORIZED',
      'No token provided',
      401,
      undefined,
      env
    );
  }

  const payload = verifyToken(token, env.JWT_SECRET);
  if (!payload) {
    return errorResponse(
      'INVALID_TOKEN',
      'Invalid or expired token',
      401,
      undefined,
      env
    );
  }

  // Fetch user to ensure they still exist
  const userRow = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(payload.userId)
    .first();

  if (!userRow) {
    return errorResponse(
      'USER_NOT_FOUND',
      'User not found',
      404,
      undefined,
      env
    );
  }

  const user = rowToUser(userRow);

  return jsonResponse({ valid: true, user }, 200, env);
}

async function handleRefresh(request: Request, env: Env): Promise<Response> {
  const body = await parseJsonBody<{ refreshToken: string }>(request);

  if (!body || !body.refreshToken) {
    return errorResponse(
      'INVALID_REQUEST',
      'Refresh token is required',
      400,
      undefined,
      env
    );
  }

  const payload = verifyToken(body.refreshToken, env.JWT_SECRET);
  if (!payload) {
    return errorResponse(
      'INVALID_TOKEN',
      'Invalid or expired token',
      401,
      undefined,
      env
    );
  }

  // Generate new token pair
  const tokens = generateTokenPair(
    payload.userId,
    payload.email,
    env.JWT_SECRET
  );

  return jsonResponse(tokens, 200, env);
}

async function handleGetProfile(request: Request, env: Env): Promise<Response> {
  const authHeader = request.headers.get('Authorization');
  const token = extractBearerToken(authHeader);

  if (!token) {
    return errorResponse(
      'UNAUTHORIZED',
      'No token provided',
      401,
      undefined,
      env
    );
  }

  const payload = verifyToken(token, env.JWT_SECRET);
  if (!payload) {
    return errorResponse(
      'INVALID_TOKEN',
      'Invalid or expired token',
      401,
      undefined,
      env
    );
  }

  const userRow = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(payload.userId)
    .first();

  if (!userRow) {
    return errorResponse(
      'USER_NOT_FOUND',
      'User not found',
      404,
      undefined,
      env
    );
  }

  const user = rowToUser(userRow);
  return jsonResponse(user, 200, env);
}

async function handleUpdateProfile(
  request: Request,
  env: Env
): Promise<Response> {
  const authHeader = request.headers.get('Authorization');
  const token = extractBearerToken(authHeader);

  if (!token) {
    return errorResponse(
      'UNAUTHORIZED',
      'No token provided',
      401,
      undefined,
      env
    );
  }

  const payload = verifyToken(token, env.JWT_SECRET);
  if (!payload) {
    return errorResponse(
      'INVALID_TOKEN',
      'Invalid or expired token',
      401,
      undefined,
      env
    );
  }

  const body = await parseJsonBody<UpdateProfileRequest>(request);
  if (!body) {
    return errorResponse(
      'INVALID_REQUEST',
      'Invalid request body',
      400,
      undefined,
      env
    );
  }

  // Sanitize name if provided
  const sanitizedName = body.name ? sanitizeInput(body.name) : undefined;

  // Fetch current user
  const userRow = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(payload.userId)
    .first();

  if (!userRow) {
    return errorResponse(
      'USER_NOT_FOUND',
      'User not found',
      404,
      undefined,
      env
    );
  }

  const currentUser = rowToUser(userRow);

  // Update user
  const updatedUser: User = {
    ...currentUser,
    name: sanitizedName || currentUser.name,
    profileData: body.profileData || currentUser.profileData,
    updatedAt: new Date(),
  };

  const updatedRow = userToRow({
    ...updatedUser,
    passwordHash: (userRow as any).password_hash,
  });

  await env.DB.prepare(
    `UPDATE users 
     SET name = ?, profile_data = ?, updated_at = ?
     WHERE id = ?`
  )
    .bind(
      updatedRow.name,
      updatedRow.profile_data,
      updatedRow.updated_at,
      payload.userId
    )
    .run();

  return jsonResponse(updatedUser, 200, env);
}

// Health check handlers
async function handleHealth(request: Request, env: Env): Promise<Response> {
  return new Response(
    JSON.stringify({
      status: 'healthy',
      service: 'auth-worker',
      timestamp: new Date().toISOString(),
      environment: env.ENVIRONMENT || 'unknown',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

async function handleDetailedHealth(
  request: Request,
  env: Env
): Promise<Response> {
  const checks: Record<string, any> = {
    service: 'healthy',
    database: 'unknown',
    secrets: 'unknown',
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

  // Check if JWT secret is configured
  checks.secrets = env.JWT_SECRET ? 'configured' : 'missing';

  const isHealthy =
    checks.database === 'healthy' && checks.secrets === 'configured';

  return new Response(
    JSON.stringify({
      status: isHealthy ? 'healthy' : 'degraded',
      service: 'auth-worker',
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
}

// Initialize router
const router = new Router();

// Health check routes
router.get('/health', handleHealth);
router.get('/health/detailed', handleDetailedHealth);

// Auth routes
router.post('/auth/register', handleRegister);
router.post('/auth/login', handleLogin);
router.post('/auth/logout', handleLogout);
router.get('/auth/verify', handleVerify);
router.post('/auth/refresh', handleRefresh);
router.get('/auth/profile', handleGetProfile);
router.put('/auth/profile', handleUpdateProfile);

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      const origin = request.headers.get('Origin');
      const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:5173',
        'http://localhost:3000',
      ];
      const corsHeaders = getCorsHeaders(origin, allowedOrigins);

      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders,
          ...getSecureHeaders(),
        },
      });
    }

    // Add CORS and security headers to response
    const response = await router.handle(request, env, ctx);
    const origin = request.headers.get('Origin');
    const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:5173',
      'http://localhost:3000',
    ];
    const corsHeaders = getCorsHeaders(origin, allowedOrigins);

    // Clone response and add headers
    const newHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};
