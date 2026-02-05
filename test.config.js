/**
 * Centralized test configuration for EAMCET Mock Test Platform
 * This file defines testing standards and configurations across all packages
 */

module.exports = {
  // Property-based testing configuration
  propertyTesting: {
    // Minimum iterations as specified in requirements
    minIterations: 100,
    timeout: 30000, // 30 seconds
    verbose: true,
    
    // Test categories and their specific configurations
    categories: {
      unit: {
        numRuns: 100,
        timeout: 5000,
      },
      integration: {
        numRuns: 50,
        timeout: 15000,
      },
      performance: {
        numRuns: 25,
        timeout: 10000,
      },
      security: {
        numRuns: 200, // More iterations for security-critical tests
        timeout: 30000,
      },
    },
  },

  // Coverage thresholds
  coverage: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Package-specific thresholds
    packages: {
      shared: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      },
      'auth-worker': {
        branches: 85,
        functions: 85,
        lines: 85,
        statements: 85,
      },
      'test-engine-worker': {
        branches: 85,
        functions: 85,
        lines: 85,
        statements: 85,
      },
      'ai-worker': {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
      'analytics-worker': {
        branches: 85,
        functions: 85,
        lines: 85,
        statements: 85,
      },
      frontend: {
        branches: 75,
        functions: 75,
        lines: 75,
        statements: 75,
      },
    },
  },

  // Test patterns and naming conventions
  patterns: {
    unit: '**/*.test.{js,ts,tsx}',
    integration: '**/*.integration.test.{js,ts,tsx}',
    propertyBased: '**/*.pbt.test.{js,ts,tsx}',
    e2e: '**/*.e2e.test.{js,ts,tsx}',
  },

  // Mock data configuration
  mockData: {
    // Seed for reproducible random data in tests
    seed: 12345,
    
    // Default sizes for generated arrays
    defaultArraySizes: {
      small: { min: 1, max: 5 },
      medium: { min: 5, max: 20 },
      large: { min: 20, max: 100 },
    },
    
    // Test user configurations
    testUsers: {
      count: 10,
      emailDomains: ['test.com', 'example.org', 'mock.edu'],
    },
  },

  // Environment-specific configurations
  environments: {
    development: {
      verbose: true,
      bail: false,
      collectCoverage: true,
    },
    ci: {
      verbose: false,
      bail: true,
      collectCoverage: true,
      coverageReporters: ['text', 'lcov'],
    },
    production: {
      verbose: false,
      bail: true,
      collectCoverage: false,
    },
  },

  // Test utilities configuration
  utilities: {
    // Timeout for async operations
    asyncTimeout: 10000,
    
    // Retry configuration for flaky tests
    retry: {
      attempts: 3,
      delay: 1000,
    },
    
    // Performance benchmarks
    performance: {
      maxExecutionTime: {
        unit: 100, // 100ms
        integration: 5000, // 5s
        e2e: 30000, // 30s
      },
    },
  },
};