// Integration tests for cross-worker communication

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createWorkerMessage,
  createSuccessResponse,
  createErrorResponse,
  WorkerCommunicator,
  DataConsistencyValidator,
  CircuitBreaker,
} from './worker-communication';

describe('Worker Communication Integration Tests', () => {
  describe('Message Creation', () => {
    it('should create standardized worker messages', () => {
      const message = createWorkerMessage('TEST_ACTION', { data: 'test' });

      expect(message).toHaveProperty('type', 'TEST_ACTION');
      expect(message).toHaveProperty('payload', { data: 'test' });
      expect(message).toHaveProperty('timestamp');
      expect(message).toHaveProperty('requestId');
      expect(typeof message.timestamp).toBe('number');
      expect(typeof message.requestId).toBe('string');
    });

    it('should create success responses', () => {
      const response = createSuccessResponse({ result: 'success' }, 'req-123');

      expect(response.success).toBe(true);
      expect(response.data).toEqual({ result: 'success' });
      expect(response.requestId).toBe('req-123');
      expect(response.error).toBeUndefined();
    });

    it('should create error responses', () => {
      const response = createErrorResponse(
        'ERROR_CODE',
        'Error message',
        'req-123',
        { detail: 'extra info' }
      );

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe('ERROR_CODE');
      expect(response.error?.message).toBe('Error message');
      expect(response.error?.details).toEqual({ detail: 'extra info' });
      expect(response.requestId).toBe('req-123');
    });
  });

  describe('WorkerCommunicator', () => {
    let mockFetch: any;

    beforeEach(() => {
      mockFetch = vi.fn();
      global.fetch = mockFetch;
    });

    it('should send requests to worker endpoints', async () => {
      const communicator = new WorkerCommunicator('http://localhost:8788');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { result: 'test' },
          requestId: 'req-123',
        }),
      });

      const result = await communicator.sendRequest('TEST_ACTION', {
        data: 'test',
      });

      expect(result).toEqual({ result: 'test' });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8788',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle worker communication errors', async () => {
      const communicator = new WorkerCommunicator('http://localhost:8788');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: {
            code: 'WORKER_ERROR',
            message: 'Worker failed to process request',
          },
          requestId: 'req-123',
        }),
      });

      await expect(
        communicator.sendRequest('TEST_ACTION', { data: 'test' })
      ).rejects.toThrow('Worker failed to process request');
    });

    it('should handle network failures', async () => {
      const communicator = new WorkerCommunicator('http://localhost:8788');

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        communicator.sendRequest('TEST_ACTION', { data: 'test' })
      ).rejects.toThrow('Network error');
    });
  });

  describe('DataConsistencyValidator', () => {
    it('should validate consistent data across sources', async () => {
      const sources = [
        async () => ({ value: 100 }),
        async () => ({ value: 100 }),
        async () => ({ value: 100 }),
      ];

      const comparator = (a: any, b: any) => a.value === b.value;

      const result = await DataConsistencyValidator.validateConsistency(
        sources,
        comparator
      );

      expect(result.consistent).toBe(true);
      expect(result.data).toEqual({ value: 100 });
      expect(result.conflicts).toHaveLength(0);
    });

    it('should detect inconsistent data', async () => {
      const sources = [
        async () => ({ value: 100 }),
        async () => ({ value: 200 }),
        async () => ({ value: 100 }),
      ];

      const comparator = (a: any, b: any) => a.value === b.value;

      const result = await DataConsistencyValidator.validateConsistency(
        sources,
        comparator
      );

      expect(result.consistent).toBe(false);
      expect(result.data).toEqual({ value: 100 });
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0]).toEqual({ value: 200 });
    });

    it('should retry until data is consistent', async () => {
      let attempt = 0;
      const operation = async () => {
        attempt++;
        return { value: attempt >= 2 ? 100 : 50 };
      };

      const validator = (data: any) => data.value === 100;

      const result = await DataConsistencyValidator.retryUntilConsistent(
        operation,
        validator,
        3,
        10
      );

      expect(result).toEqual({ value: 100 });
      expect(attempt).toBe(2);
    });

    it('should fail after max retries', async () => {
      const operation = async () => ({ value: 50 });
      const validator = (data: any) => data.value === 100;

      await expect(
        DataConsistencyValidator.retryUntilConsistent(
          operation,
          validator,
          2,
          10
        )
      ).rejects.toThrow('Operation failed to achieve consistency');
    });
  });

  describe('CircuitBreaker', () => {
    it('should allow operations when circuit is closed', async () => {
      const breaker = new CircuitBreaker(3, 60000, 30000);
      const operation = async () => 'success';

      const result = await breaker.execute(operation);

      expect(result).toBe('success');
      expect(breaker.getState()).toBe('closed');
    });

    it('should open circuit after threshold failures', async () => {
      const breaker = new CircuitBreaker(3, 60000, 30000);
      const operation = async () => {
        throw new Error('Operation failed');
      };

      // Trigger failures
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(operation);
        } catch (error) {
          // Expected
        }
      }

      expect(breaker.getState()).toBe('open');

      // Next operation should fail immediately
      await expect(breaker.execute(operation)).rejects.toThrow(
        'Circuit breaker is open'
      );
    });

    it('should transition to half-open after reset timeout', async () => {
      const breaker = new CircuitBreaker(2, 60000, 100); // 100ms reset timeout
      const operation = async () => {
        throw new Error('Operation failed');
      };

      // Trigger failures to open circuit
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(operation);
        } catch (error) {
          // Expected
        }
      }

      expect(breaker.getState()).toBe('open');

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Next operation should attempt (half-open state)
      const successOperation = async () => 'success';
      const result = await breaker.execute(successOperation);

      expect(result).toBe('success');
      expect(breaker.getState()).toBe('closed');
    });
  });

  describe('End-to-End Worker Communication', () => {
    let mockFetch: any;

    beforeEach(() => {
      mockFetch = vi.fn();
      global.fetch = mockFetch;
    });

    it('should coordinate test submission across workers', async () => {
      // Simulate test engine worker
      const testEngineCommunicator = new WorkerCommunicator(
        'http://localhost:8788'
      );

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            sessionId: 'session-1',
            score: 85,
            completedAt: new Date().toISOString(),
          },
          requestId: 'req-1',
        }),
      });

      const testResult = await testEngineCommunicator.sendRequest(
        'SUBMIT_TEST',
        {
          sessionId: 'session-1',
        }
      );

      expect(testResult.score).toBe(85);

      // Simulate analytics worker processing
      const analyticsCommunicator = new WorkerCommunicator(
        'http://localhost:8789'
      );

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            userId: 'user-1',
            testSessionId: 'session-1',
            overallScore: 85,
            accuracy: 85,
          },
          requestId: 'req-2',
        }),
      });

      const analytics = await analyticsCommunicator.sendRequest(
        'CALCULATE_ANALYTICS',
        {
          sessionId: 'session-1',
          userId: 'user-1',
        }
      );

      expect(analytics.testSessionId).toBe('session-1');
      expect(analytics.overallScore).toBe(85);
    });

    it('should maintain data consistency across workers', async () => {
      const sessionId = 'session-1';

      // Fetch session from test engine
      const testEngineSource = async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { sessionId, status: 'completed', score: 85 },
            requestId: 'req-1',
          }),
        });

        const communicator = new WorkerCommunicator('http://localhost:8788');
        return await communicator.sendRequest('GET_SESSION', { sessionId });
      };

      // Fetch analytics from analytics worker
      const analyticsSource = async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { testSessionId: sessionId, overallScore: 85 },
            requestId: 'req-2',
          }),
        });

        const communicator = new WorkerCommunicator('http://localhost:8789');
        return await communicator.sendRequest('GET_ANALYTICS', { sessionId });
      };

      const testEngineData = await testEngineSource();
      const analyticsData = await analyticsSource();

      // Verify consistency
      expect(testEngineData.sessionId).toBe(analyticsData.testSessionId);
      expect(testEngineData.score).toBe(analyticsData.overallScore);
    });
  });
});
