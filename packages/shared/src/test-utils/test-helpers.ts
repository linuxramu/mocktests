/**
 * Test helper utilities for common testing patterns
 */

/**
 * Wait for a specified amount of time
 */
export const wait = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Create a mock function that tracks calls
 */
export const createMockFunction = <T extends (...args: any[]) => any>() => {
  const calls: Parameters<T>[] = [];
  const mockFn = ((...args: Parameters<T>) => {
    calls.push(args);
    return undefined;
  }) as jest.MockedFunction<T>;
  
  mockFn.mock = {
    calls: calls as any[],
    results: [],
    instances: [],
    contexts: [],
    lastCall: undefined,
  };
  
  return mockFn;
};

/**
 * Assert that a value is defined (not null or undefined)
 */
export const assertDefined = <T>(value: T | null | undefined): asserts value is T => {
  if (value === null || value === undefined) {
    throw new Error('Expected value to be defined');
  }
};

/**
 * Assert that a value is a valid date
 */
export const assertValidDate = (date: Date): void => {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Expected valid Date object');
  }
};

/**
 * Assert that a value is a valid UUID
 */
export const assertValidUUID = (uuid: string): void => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    throw new Error(`Expected valid UUID, got: ${uuid}`);
  }
};

/**
 * Assert that a value is a valid email
 */
export const assertValidEmail = (email: string): void => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error(`Expected valid email, got: ${email}`);
  }
};

/**
 * Assert that an array has a specific length
 */
export const assertArrayLength = <T>(array: T[], expectedLength: number): void => {
  if (array.length !== expectedLength) {
    throw new Error(`Expected array length ${expectedLength}, got ${array.length}`);
  }
};

/**
 * Assert that a number is within a specific range
 */
export const assertInRange = (value: number, min: number, max: number): void => {
  if (value < min || value > max) {
    throw new Error(`Expected value between ${min} and ${max}, got ${value}`);
  }
};

/**
 * Assert that a value is one of the allowed values
 */
export const assertOneOf = <T>(value: T, allowedValues: T[]): void => {
  if (!allowedValues.includes(value)) {
    throw new Error(`Expected one of [${allowedValues.join(', ')}], got ${value}`);
  }
};

/**
 * Create a test database connection mock
 */
export const createMockDatabase = () => ({
  query: jest.fn(),
  execute: jest.fn(),
  transaction: jest.fn(),
  close: jest.fn(),
});

/**
 * Create a mock HTTP request object
 */
export const createMockRequest = (overrides: Partial<Request> = {}): Request => ({
  method: 'GET',
  url: 'https://example.com/test',
  headers: new Headers(),
  body: null,
  bodyUsed: false,
  cache: 'default',
  credentials: 'same-origin',
  destination: '',
  integrity: '',
  keepalive: false,
  mode: 'cors',
  redirect: 'follow',
  referrer: '',
  referrerPolicy: '',
  signal: new AbortController().signal,
  clone: jest.fn(),
  arrayBuffer: jest.fn(),
  blob: jest.fn(),
  formData: jest.fn(),
  json: jest.fn(),
  text: jest.fn(),
  ...overrides,
} as Request);

/**
 * Create a mock HTTP response object
 */
export const createMockResponse = (
  body?: any, 
  status: number = 200, 
  headers: Record<string, string> = {}
): Response => ({
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  headers: new Headers(headers),
  body: body ? JSON.stringify(body) : null,
  bodyUsed: false,
  ok: status >= 200 && status < 300,
  redirected: false,
  type: 'basic',
  url: 'https://example.com/test',
  clone: jest.fn(),
  arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
  blob: jest.fn().mockResolvedValue(new Blob()),
  formData: jest.fn().mockResolvedValue(new FormData()),
  json: jest.fn().mockResolvedValue(body),
  text: jest.fn().mockResolvedValue(body ? JSON.stringify(body) : ''),
} as Response);

/**
 * Test environment setup helpers
 */
export const setupTestEnvironment = () => {
  // Mock global fetch if not available
  if (!global.fetch) {
    global.fetch = jest.fn();
  }
  
  // Mock console methods to reduce test noise
  const originalConsole = global.console;
  global.console = {
    ...originalConsole,
    warn: jest.fn(),
    error: jest.fn(),
  };
  
  return () => {
    // Cleanup function
    global.console = originalConsole;
    jest.clearAllMocks();
  };
};

/**
 * Performance testing helpers
 */
export const measureExecutionTime = async <T>(fn: () => Promise<T>): Promise<{ result: T; timeMs: number }> => {
  const start = performance.now();
  const result = await fn();
  const timeMs = performance.now() - start;
  return { result, timeMs };
};

export const assertExecutionTime = async <T>(
  fn: () => Promise<T>, 
  maxTimeMs: number
): Promise<T> => {
  const { result, timeMs } = await measureExecutionTime(fn);
  if (timeMs > maxTimeMs) {
    throw new Error(`Execution took ${timeMs}ms, expected less than ${maxTimeMs}ms`);
  }
  return result;
};