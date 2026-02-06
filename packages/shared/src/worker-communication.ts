// Cross-worker communication utilities for Cloudflare Workers

export interface WorkerMessage {
  type: string;
  payload: any;
  timestamp: number;
  requestId: string;
}

export interface WorkerResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  requestId: string;
}

/**
 * Create a standardized worker message
 */
export function createWorkerMessage(type: string, payload: any): WorkerMessage {
  return {
    type,
    payload,
    timestamp: Date.now(),
    requestId: generateRequestId(),
  };
}

/**
 * Create a success response
 */
export function createSuccessResponse<T>(
  data: T,
  requestId: string
): WorkerResponse<T> {
  return {
    success: true,
    data,
    requestId,
  };
}

/**
 * Create an error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  requestId: string,
  details?: any
): WorkerResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    requestId,
  };
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Worker-to-worker communication helper
 */
export class WorkerCommunicator {
  constructor(private workerUrl: string) {}

  async sendRequest<T = any>(
    type: string,
    payload: any,
    options: RequestInit = {}
  ): Promise<T> {
    const message = createWorkerMessage(type, payload);

    try {
      const response = await fetch(this.workerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: JSON.stringify(message),
        ...options,
      });

      if (!response.ok) {
        throw new Error(`Worker request failed with status ${response.status}`);
      }

      const result: WorkerResponse<T> = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Worker request failed');
      }

      return result.data as T;
    } catch (error) {
      console.error(
        `Failed to communicate with worker at ${this.workerUrl}:`,
        error
      );
      throw error;
    }
  }
}

/**
 * Data consistency validator for cross-worker operations
 */
export class DataConsistencyValidator {
  /**
   * Validate that data is consistent across multiple sources
   */
  static async validateConsistency<T>(
    sources: (() => Promise<T>)[],
    comparator: (a: T, b: T) => boolean
  ): Promise<{ consistent: boolean; data: T | null; conflicts: T[] }> {
    try {
      const results = await Promise.all(sources.map(source => source()));

      if (results.length === 0) {
        return { consistent: true, data: null, conflicts: [] };
      }

      const firstResult = results[0];
      const conflicts: T[] = [];

      for (let i = 1; i < results.length; i++) {
        if (!comparator(firstResult, results[i])) {
          conflicts.push(results[i]);
        }
      }

      return {
        consistent: conflicts.length === 0,
        data: firstResult,
        conflicts,
      };
    } catch (error) {
      console.error('Data consistency validation failed:', error);
      throw error;
    }
  }

  /**
   * Retry operation until data is consistent
   */
  static async retryUntilConsistent<T>(
    operation: () => Promise<T>,
    validator: (data: T) => boolean,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<T> {
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const result = await operation();

        if (validator(result)) {
          return result;
        }

        attempt++;
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      } catch (error) {
        attempt++;
        if (attempt >= maxRetries) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    throw new Error(
      'Operation failed to achieve consistency after maximum retries'
    );
  }
}

/**
 * Circuit breaker for worker communication
 */
export class CircuitBreaker {
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000,
    private resetTimeout: number = 30000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'half-open';
      } else {
        throw new Error(
          'Circuit breaker is open. Service temporarily unavailable.'
        );
      }
    }

    try {
      const result = await operation();

      if (this.state === 'half-open') {
        this.reset();
      }

      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      this.state = 'open';
      console.warn('Circuit breaker opened due to repeated failures');
    }
  }

  private reset(): void {
    this.failureCount = 0;
    this.state = 'closed';
    console.log('Circuit breaker reset to closed state');
  }

  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }
}
