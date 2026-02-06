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
} from '@eamcet-platform/shared';

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  ENVIRONMENT?: string;
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
async function handleRegister(request: Request, env: Env): Promise<Response> {
  const body = await parseJsonBody<RegisterRequest>(request);

  if (!body || !body.email || !body.password || !body.name) {
    return errorResponse(
      'INVALID_REQUEST',
      'Email, password, and name are required',
      400
    );
  }

  // Validate email
  if (!isValidEmail(body.email)) {
    return errorResponse('INVALID_EMAIL', 'Invalid email format', 400);
  }

  // Validate password
  const passwordValidation = isValidPassword(body.password);
  if (!passwordValidation.valid) {
    return errorResponse(
      'WEAK_PASSWORD',
      'Password does not meet requirements',
      400,
      passwordValidation.errors
    );
  }

  // Check if user already exists
  const existingUser = await env.DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  )
    .bind(body.email)
    .first();

  if (existingUser) {
    return errorResponse(
      'USER_EXISTS',
      'User with this email already exists',
      409
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
    email: body.email,
    name: body.name,
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
    return errorResponse('USER_CREATION_FAILED', 'Failed to create user', 500);
  }

  const user = rowToUser(createdUserRow);

  // Generate tokens
  const tokens = generateTokenPair(user.id, user.email, env.JWT_SECRET);

  const response: AuthResponse = {
    user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };

  return jsonResponse(response, 201);
}

async function handleLogin(request: Request, env: Env): Promise<Response> {
  const body = await parseJsonBody<LoginRequest>(request);

  if (!body || !body.email || !body.password) {
    return errorResponse(
      'INVALID_REQUEST',
      'Email and password are required',
      400
    );
  }

  // Find user
  const userRow = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
    .bind(body.email)
    .first();

  if (!userRow) {
    return errorResponse('INVALID_CREDENTIALS', 'Invalid credentials', 401);
  }

  // Verify password
  const passwordHash = (userRow as any).password_hash;
  const isValid = await verifyPassword(body.password, passwordHash);

  if (!isValid) {
    return errorResponse('INVALID_CREDENTIALS', 'Invalid credentials', 401);
  }

  const user = rowToUser(userRow);

  // Generate tokens
  const tokens = generateTokenPair(user.id, user.email, env.JWT_SECRET);

  const response: AuthResponse = {
    user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };

  return jsonResponse(response);
}

async function handleLogout(request: Request, env: Env): Promise<Response> {
  // In a stateless JWT system, logout is handled client-side
  // Here we just validate the token and return success
  const authHeader = request.headers.get('Authorization');
  const token = extractBearerToken(authHeader);

  if (!token) {
    return errorResponse('UNAUTHORIZED', 'No token provided', 401);
  }

  const payload = verifyToken(token, env.JWT_SECRET);
  if (!payload) {
    return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401);
  }

  return jsonResponse({ message: 'Logged out successfully' });
}

async function handleVerify(request: Request, env: Env): Promise<Response> {
  const authHeader = request.headers.get('Authorization');
  const token = extractBearerToken(authHeader);

  if (!token) {
    return errorResponse('UNAUTHORIZED', 'No token provided', 401);
  }

  const payload = verifyToken(token, env.JWT_SECRET);
  if (!payload) {
    return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401);
  }

  // Fetch user to ensure they still exist
  const userRow = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(payload.userId)
    .first();

  if (!userRow) {
    return errorResponse('USER_NOT_FOUND', 'User not found', 404);
  }

  const user = rowToUser(userRow);

  return jsonResponse({ valid: true, user });
}

async function handleRefresh(request: Request, env: Env): Promise<Response> {
  const body = await parseJsonBody<{ refreshToken: string }>(request);

  if (!body || !body.refreshToken) {
    return errorResponse('INVALID_REQUEST', 'Refresh token is required', 400);
  }

  const payload = verifyToken(body.refreshToken, env.JWT_SECRET);
  if (!payload) {
    return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401);
  }

  // Generate new token pair
  const tokens = generateTokenPair(
    payload.userId,
    payload.email,
    env.JWT_SECRET
  );

  return jsonResponse(tokens);
}

async function handleGetProfile(request: Request, env: Env): Promise<Response> {
  const authHeader = request.headers.get('Authorization');
  const token = extractBearerToken(authHeader);

  if (!token) {
    return errorResponse('UNAUTHORIZED', 'No token provided', 401);
  }

  const payload = verifyToken(token, env.JWT_SECRET);
  if (!payload) {
    return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401);
  }

  const userRow = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(payload.userId)
    .first();

  if (!userRow) {
    return errorResponse('USER_NOT_FOUND', 'User not found', 404);
  }

  const user = rowToUser(userRow);
  return jsonResponse(user);
}

async function handleUpdateProfile(
  request: Request,
  env: Env
): Promise<Response> {
  const authHeader = request.headers.get('Authorization');
  const token = extractBearerToken(authHeader);

  if (!token) {
    return errorResponse('UNAUTHORIZED', 'No token provided', 401);
  }

  const payload = verifyToken(token, env.JWT_SECRET);
  if (!payload) {
    return errorResponse('INVALID_TOKEN', 'Invalid or expired token', 401);
  }

  const body = await parseJsonBody<UpdateProfileRequest>(request);
  if (!body) {
    return errorResponse('INVALID_REQUEST', 'Invalid request body', 400);
  }

  // Fetch current user
  const userRow = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(payload.userId)
    .first();

  if (!userRow) {
    return errorResponse('USER_NOT_FOUND', 'User not found', 404);
  }

  const currentUser = rowToUser(userRow);

  // Update user
  const updatedUser: User = {
    ...currentUser,
    name: body.name || currentUser.name,
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

  return jsonResponse(updatedUser);
}

// Initialize router
const router = new Router();

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
    return router.handle(request, env, ctx);
  },
};
