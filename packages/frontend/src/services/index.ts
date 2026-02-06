// Service integration layer connecting all backend workers

import {
  AuthApiClient,
  TestEngineApiClient,
  AnalyticsApiClient,
  AIApiClient,
  ServiceHealthMonitor,
} from '../utils/api';

export interface TestConfiguration {
  subjects: string[];
  questionsPerSubject: number;
  timeLimit: number;
  difficulty: 'mixed' | 'easy' | 'medium' | 'hard';
  randomizeQuestions: boolean;
}

export interface TestSession {
  id: string;
  userId: string;
  testType: 'full' | 'subject-wise' | 'custom';
  status: 'active' | 'completed' | 'abandoned';
  startedAt: string;
  completedAt?: string;
  durationSeconds?: number;
  totalQuestions: number;
  configuration: TestConfiguration;
}

export interface Question {
  id: string;
  subject: 'physics' | 'chemistry' | 'mathematics';
  difficulty: 'easy' | 'medium' | 'hard';
  questionText: string;
  options: string[];
  correctAnswer?: string;
  explanation?: string;
  metadata: {
    topic: string;
    subtopic?: string;
    estimatedTime: number;
  };
}

export interface AnswerSubmission {
  questionId: string;
  selectedAnswer: string;
  timeSpentSeconds: number;
  isMarkedForReview: boolean;
}

export interface PerformanceMetrics {
  userId: string;
  testSessionId: string;
  overallScore: number;
  accuracy: number;
  subjectBreakdown: {
    subject: string;
    score: number;
    accuracy: number;
    strengths: string[];
    weaknesses: string[];
  }[];
  timeManagement: {
    averageTimePerQuestion: number;
    fastestQuestion: number;
    slowestQuestion: number;
  };
}

export interface ProgressData {
  userId: string;
  overallTrend: {
    date: string;
    score: number;
  }[];
  subjectTrends: {
    subject: string;
    trend: { date: string; score: number }[];
  }[];
  recommendations: string[];
}

export class IntegratedServices {
  private authClient: AuthApiClient;
  private testEngineClient: TestEngineApiClient;
  private analyticsClient: AnalyticsApiClient;
  private aiClient: AIApiClient;
  private healthMonitor: ServiceHealthMonitor;

  constructor(
    getAccessToken: () => string | null,
    onTokenExpired: () => Promise<void>
  ) {
    this.authClient = new AuthApiClient(getAccessToken, onTokenExpired);
    this.testEngineClient = new TestEngineApiClient(
      getAccessToken,
      onTokenExpired
    );
    this.analyticsClient = new AnalyticsApiClient(
      getAccessToken,
      onTokenExpired
    );
    this.aiClient = new AIApiClient(getAccessToken, onTokenExpired);

    this.healthMonitor = new ServiceHealthMonitor([
      {
        name: 'auth',
        healthEndpoint: `${import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8787'}/health`,
      },
      {
        name: 'test-engine',
        healthEndpoint: `${import.meta.env.VITE_TEST_ENGINE_API_URL || 'http://localhost:8788'}/health`,
      },
      {
        name: 'analytics',
        healthEndpoint: `${import.meta.env.VITE_ANALYTICS_API_URL || 'http://localhost:8789'}/health`,
      },
      {
        name: 'ai',
        healthEndpoint: `${import.meta.env.VITE_AI_API_URL || 'http://localhost:8790'}/health`,
      },
    ]);
  }

  // Start health monitoring
  startHealthMonitoring(): void {
    this.healthMonitor.startMonitoring();
  }

  // Stop health monitoring
  stopHealthMonitoring(): void {
    this.healthMonitor.stopMonitoring();
  }

  // Get service health status
  getServiceHealth(): Record<string, boolean> {
    return this.healthMonitor.getAllHealthStatus();
  }

  // Test Engine Services
  async getAvailableTests(): Promise<any[]> {
    try {
      return await this.testEngineClient.get('/tests/available');
    } catch (error) {
      console.error('Failed to fetch available tests:', error);
      if (!this.healthMonitor.isServiceHealthy('test-engine')) {
        throw new Error('Test Engine service is currently unavailable');
      }
      throw error;
    }
  }

  async startTest(config: TestConfiguration): Promise<TestSession> {
    try {
      return await this.testEngineClient.post('/tests/start', config);
    } catch (error) {
      console.error('Failed to start test:', error);
      throw error;
    }
  }

  async getTestSession(sessionId: string): Promise<TestSession> {
    try {
      return await this.testEngineClient.get(`/tests/session/${sessionId}`);
    } catch (error) {
      console.error('Failed to fetch test session:', error);
      throw error;
    }
  }

  async getQuestion(
    sessionId: string,
    questionNumber: number
  ): Promise<Question> {
    try {
      return await this.testEngineClient.get(
        `/tests/session/${sessionId}/question/${questionNumber}`
      );
    } catch (error) {
      console.error('Failed to fetch question:', error);
      throw error;
    }
  }

  async submitAnswer(
    sessionId: string,
    answer: AnswerSubmission
  ): Promise<{ success: boolean }> {
    try {
      return await this.testEngineClient.post(
        `/tests/session/${sessionId}/answer`,
        answer
      );
    } catch (error) {
      console.error('Failed to submit answer:', error);
      throw error;
    }
  }

  async submitTest(sessionId: string): Promise<any> {
    try {
      return await this.testEngineClient.post(
        `/tests/session/${sessionId}/submit`
      );
    } catch (error) {
      console.error('Failed to submit test:', error);
      throw error;
    }
  }

  async getTestHistory(): Promise<TestSession[]> {
    try {
      return await this.testEngineClient.get('/tests/history');
    } catch (error) {
      console.error('Failed to fetch test history:', error);
      throw error;
    }
  }

  // Analytics Services
  async getPerformanceMetrics(userId: string): Promise<PerformanceMetrics> {
    try {
      return await this.analyticsClient.get(`/analytics/performance/${userId}`);
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
      if (!this.healthMonitor.isServiceHealthy('analytics')) {
        // Graceful degradation: return cached or default data
        console.warn(
          'Analytics service unavailable, returning default metrics'
        );
        return this.getDefaultMetrics(userId);
      }
      throw error;
    }
  }

  async getSubjectAnalysis(userId: string): Promise<any> {
    try {
      return await this.analyticsClient.get(
        `/analytics/subject-analysis/${userId}`
      );
    } catch (error) {
      console.error('Failed to fetch subject analysis:', error);
      throw error;
    }
  }

  async getProgressData(userId: string): Promise<ProgressData> {
    try {
      return await this.analyticsClient.get(`/analytics/progress/${userId}`);
    } catch (error) {
      console.error('Failed to fetch progress data:', error);
      throw error;
    }
  }

  async compareTests(userId: string, testIds: string[]): Promise<any> {
    try {
      return await this.analyticsClient.get(
        `/analytics/compare/${userId}?testIds=${testIds.join(',')}`
      );
    } catch (error) {
      console.error('Failed to compare tests:', error);
      throw error;
    }
  }

  async getTrends(userId: string): Promise<any> {
    try {
      return await this.analyticsClient.get(`/analytics/trends/${userId}`);
    } catch (error) {
      console.error('Failed to fetch trends:', error);
      throw error;
    }
  }

  // AI Services
  async generateQuestions(params: {
    subject: string;
    difficulty: string;
    count: number;
  }): Promise<Question[]> {
    try {
      return await this.aiClient.post('/ai/generate-questions', params);
    } catch (error) {
      console.error('Failed to generate questions:', error);
      if (!this.healthMonitor.isServiceHealthy('ai')) {
        throw new Error('AI service is currently unavailable');
      }
      throw error;
    }
  }

  async validateQuestion(
    question: Question
  ): Promise<{ valid: boolean; issues: string[] }> {
    try {
      return await this.aiClient.post('/ai/validate-question', question);
    } catch (error) {
      console.error('Failed to validate question:', error);
      throw error;
    }
  }

  async analyzePerformance(testData: any): Promise<any> {
    try {
      return await this.aiClient.post('/ai/analyze-performance', testData);
    } catch (error) {
      console.error('Failed to analyze performance:', error);
      throw error;
    }
  }

  async generateRecommendations(userHistory: TestSession[]): Promise<string[]> {
    try {
      return await this.aiClient.post(
        '/ai/generate-recommendations',
        userHistory
      );
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      return []; // Graceful degradation
    }
  }

  // Helper method for graceful degradation
  private getDefaultMetrics(userId: string): PerformanceMetrics {
    return {
      userId,
      testSessionId: '',
      overallScore: 0,
      accuracy: 0,
      subjectBreakdown: [],
      timeManagement: {
        averageTimePerQuestion: 0,
        fastestQuestion: 0,
        slowestQuestion: 0,
      },
    };
  }
}

// Create a singleton instance
let servicesInstance: IntegratedServices | null = null;

export const initializeServices = (
  getAccessToken: () => string | null,
  onTokenExpired: () => Promise<void>
): IntegratedServices => {
  if (!servicesInstance) {
    servicesInstance = new IntegratedServices(getAccessToken, onTokenExpired);
    servicesInstance.startHealthMonitoring();
  }
  return servicesInstance;
};

export const getServices = (): IntegratedServices => {
  if (!servicesInstance) {
    throw new Error('Services not initialized. Call initializeServices first.');
  }
  return servicesInstance;
};
