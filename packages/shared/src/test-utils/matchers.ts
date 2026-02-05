/**
 * Custom Jest matchers for domain-specific assertions
 */

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
      toBeValidEmail(): R;
      toBeValidDate(): R;
      toBeWithinTimeRange(start: Date, end: Date): R;
      toHaveValidTestConfiguration(): R;
      toHaveValidQuestionFormat(): R;
      toHaveValidPerformanceMetrics(): R;
    }
  }
}

// UUID validation matcher
expect.extend({
  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = typeof received === 'string' && uuidRegex.test(received);
    
    return {
      message: () => 
        pass 
          ? `Expected ${received} not to be a valid UUID`
          : `Expected ${received} to be a valid UUID`,
      pass,
    };
  },
});

// Email validation matcher
expect.extend({
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = typeof received === 'string' && emailRegex.test(received);
    
    return {
      message: () => 
        pass 
          ? `Expected ${received} not to be a valid email`
          : `Expected ${received} to be a valid email`,
      pass,
    };
  },
});

// Date validation matcher
expect.extend({
  toBeValidDate(received: any) {
    const pass = received instanceof Date && !isNaN(received.getTime());
    
    return {
      message: () => 
        pass 
          ? `Expected ${received} not to be a valid Date`
          : `Expected ${received} to be a valid Date`,
      pass,
    };
  },
});

// Time range validation matcher
expect.extend({
  toBeWithinTimeRange(received: Date, start: Date, end: Date) {
    const pass = received instanceof Date && 
                 received.getTime() >= start.getTime() && 
                 received.getTime() <= end.getTime();
    
    return {
      message: () => 
        pass 
          ? `Expected ${received} not to be within range ${start} - ${end}`
          : `Expected ${received} to be within range ${start} - ${end}`,
      pass,
    };
  },
});

// Test configuration validation matcher
expect.extend({
  toHaveValidTestConfiguration(received: any) {
    const isValid = received &&
      Array.isArray(received.subjects) &&
      received.subjects.length > 0 &&
      typeof received.questionsPerSubject === 'number' &&
      received.questionsPerSubject > 0 &&
      typeof received.timeLimit === 'number' &&
      received.timeLimit > 0 &&
      ['mixed', 'easy', 'medium', 'hard'].includes(received.difficulty) &&
      typeof received.randomizeQuestions === 'boolean';
    
    return {
      message: () => 
        isValid 
          ? `Expected test configuration to be invalid`
          : `Expected valid test configuration, got: ${JSON.stringify(received)}`,
      pass: isValid,
    };
  },
});

// Question format validation matcher
expect.extend({
  toHaveValidQuestionFormat(received: any) {
    const isValid = received &&
      typeof received.id === 'string' &&
      ['physics', 'chemistry', 'mathematics'].includes(received.subject) &&
      ['easy', 'medium', 'hard'].includes(received.difficulty) &&
      typeof received.questionText === 'string' &&
      received.questionText.length > 0 &&
      Array.isArray(received.options) &&
      received.options.length === 4 &&
      ['A', 'B', 'C', 'D'].includes(received.correctAnswer) &&
      typeof received.sourcePattern === 'string' &&
      received.metadata &&
      typeof received.metadata.topic === 'string';
    
    return {
      message: () => 
        isValid 
          ? `Expected question format to be invalid`
          : `Expected valid question format, got: ${JSON.stringify(received)}`,
      pass: isValid,
    };
  },
});

// Performance metrics validation matcher
expect.extend({
  toHaveValidPerformanceMetrics(received: any) {
    const isValid = received &&
      typeof received.totalQuestions === 'number' &&
      received.totalQuestions > 0 &&
      typeof received.correctAnswers === 'number' &&
      received.correctAnswers >= 0 &&
      received.correctAnswers <= received.totalQuestions &&
      typeof received.accuracyPercentage === 'number' &&
      received.accuracyPercentage >= 0 &&
      received.accuracyPercentage <= 100 &&
      typeof received.averageTimePerQuestion === 'number' &&
      received.averageTimePerQuestion > 0 &&
      Array.isArray(received.strengths) &&
      Array.isArray(received.weaknesses);
    
    return {
      message: () => 
        isValid 
          ? `Expected performance metrics to be invalid`
          : `Expected valid performance metrics, got: ${JSON.stringify(received)}`,
      pass: isValid,
    };
  },
});

export {}; // Make this a module