// CSRF token management for frontend

const CSRF_TOKEN_KEY = 'csrf_token';

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get or create CSRF token
 */
export function getCsrfToken(): string {
  let token = sessionStorage.getItem(CSRF_TOKEN_KEY);
  if (!token) {
    token = generateCsrfToken();
    sessionStorage.setItem(CSRF_TOKEN_KEY, token);
  }
  return token;
}

/**
 * Clear CSRF token
 */
export function clearCsrfToken(): void {
  sessionStorage.removeItem(CSRF_TOKEN_KEY);
}

/**
 * Add CSRF token to request headers
 */
export function addCsrfHeader(headers: HeadersInit = {}): HeadersInit {
  const token = getCsrfToken();
  return {
    ...headers,
    'X-CSRF-Token': token,
  };
}
