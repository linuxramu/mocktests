// Global Jest setup for all packages
// This file is run before each test file

// Set up global test timeout
jest.setTimeout(30000);

// Mock console methods in test environment to reduce noise
global.console = {
  ...console,
  // Uncomment to ignore specific console methods during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test utilities
global.testUtils = {
  // Add any global test utilities here
};
