// Comprehensive API integration layer with error handling and retry mechanisms

import { addCsrfHeader } from './csrf';

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  requestId?: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
}

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryableStatuses: number[];
  exponentialBackoff: boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  exponentialBackoff: true,
};

export class ApiClient {
  private baseUrl: string;
  private retryConfig: RetryConfig;
  private getAccessToken: () => string | null;
  private onTokenExpired: () => Promise<void>;

  constructor(
    baseUrl: string,
    getAccessToken: () => string | null,
    onTokenExpired: () => Promise<void>,
    retryConfig: Partial<RetryConfig> = {}
  ) {
    this.baseUrl = baseUrl;
    this.getAccessToken = getAccessToken;
    this.onTokenExpired = onTokenExpired;
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getRetryDelay(attempt: number): number {
    if (this.retryConfig.exponentialBackoff) {
      return this.retryConfig.retryDelay * Math.pow(2, attempt);
    }
    return this.retryConfig.retryDelay;
  }

  private shouldRetry(status: number, attempt: number): boolean {
    return (
      attempt < this.retryConfig.maxRetries &&
      this.retryConfig.retryableStatuses.includes(status)
    );
  }

  private async handleTokenExpiration(): Promise<void> {
    try {
      await this.onTokenExpired();
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw new Error('Authentication failed. Please log in again.');
    }
  }

  async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    skipRetry = false
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getAccessToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    // Add CSRF protection
    const finalHeaders = addCsrfHeader(headers);

    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= this.retryConfig.maxRetries) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: finalHeaders,
        });

        // Handle token expiration
        if (response.status === 401 && token) {
          await this.handleTokenExpiration();
          // Retry the request with new token
          return this.request<T>(endpoint, options, true);
        }

        // Check if we should retry
        if (!skipRetry && this.shouldRetry(response.status, attempt)) {
          attempt++;
          const delay = this.getRetryDelay(attempt - 1);
          console.warn(
            `Request failed with status ${response.status}. Retrying in ${delay}ms (attempt ${attempt}/${this.retryConfig.maxRetries})...`
          );
          await this.delay(delay);
          continue;
        }

        // Parse response
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error?.message ||
              `Request failed with status ${response.status}`
          );
        }

        return data as T;
      } catch (error) {
        lastError = error as Error;

        // Network errors are retryable
        if (
          !skipRetry &&
          attempt < this.retryConfig.maxRetries &&
          (error instanceof TypeError || (error as any).name === 'NetworkError')
        ) {
          attempt++;
          const delay = this.getRetryDelay(attempt - 1);
          console.warn(
            `Network error occurred. Retrying in ${delay}ms (attempt ${attempt}/${this.retryConfig.maxRetries})...`
          );
          await this.delay(delay);
          continue;
        }

        throw lastError;
      }
    }

    throw lastError || new Error('Request failed after maximum retries');
  }

  async get<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = any>(
    endpoint: string,
    body?: any,
    options: RequestInit = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T = any>(
    endpoint: string,
    body?: any,
    options: RequestInit = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Service-specific API clients
export class AuthApiClient extends ApiClient {
  constructor(
    getAccessToken: () => string | null,
    onTokenExpired: () => Promise<void>
  ) {
    const baseUrl =
      import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8787';
    super(baseUrl, getAccessToken, onTokenExpired);
  }
}

export class TestEngineApiClient extends ApiClient {
  constructor(
    getAccessToken: () => string | null,
    onTokenExpired: () => Promise<void>
  ) {
    const baseUrl =
      import.meta.env.VITE_TEST_ENGINE_API_URL || 'http://localhost:8788';
    super(baseUrl, getAccessToken, onTokenExpired);
  }
}

export class AnalyticsApiClient extends ApiClient {
  constructor(
    getAccessToken: () => string | null,
    onTokenExpired: () => Promise<void>
  ) {
    const baseUrl =
      import.meta.env.VITE_ANALYTICS_API_URL || 'http://localhost:8789';
    super(baseUrl, getAccessToken, onTokenExpired);
  }
}

export class AIApiClient extends ApiClient {
  constructor(
    getAccessToken: () => string | null,
    onTokenExpired: () => Promise<void>
  ) {
    const baseUrl = import.meta.env.VITE_AI_API_URL || 'http://localhost:8790';
    super(baseUrl, getAccessToken, onTokenExpired);
  }
}

// Graceful degradation handler
export class ServiceHealthMonitor {
  private healthStatus: Map<string, boolean> = new Map();
  private checkInterval: number = 30000; // 30 seconds
  private intervalId: NodeJS.Timeout | null = null;

  constructor(private services: { name: string; healthEndpoint: string }[]) {
    this.services.forEach(service => {
      this.healthStatus.set(service.name, true);
    });
  }

  async checkHealth(service: {
    name: string;
    healthEndpoint: string;
  }): Promise<boolean> {
    try {
      const response = await fetch(service.healthEndpoint, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      const isHealthy = response.ok;
      this.healthStatus.set(service.name, isHealthy);
      return isHealthy;
    } catch (error) {
      console.error(`Health check failed for ${service.name}:`, error);
      this.healthStatus.set(service.name, false);
      return false;
    }
  }

  startMonitoring(): void {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.services.forEach(service => {
        this.checkHealth(service);
      });
    }, this.checkInterval);

    // Initial check
    this.services.forEach(service => {
      this.checkHealth(service);
    });
  }

  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  isServiceHealthy(serviceName: string): boolean {
    return this.healthStatus.get(serviceName) ?? false;
  }

  getAllHealthStatus(): Record<string, boolean> {
    return Object.fromEntries(this.healthStatus);
  }
}
