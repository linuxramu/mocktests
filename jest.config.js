module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/packages'],
  testMatch: [
    '**/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '**/src/**/*.(test|spec).{js,jsx,ts,tsx}'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: [
    'packages/*/src/**/*.{ts,tsx}',
    '!packages/*/src/**/*.d.ts',
    '!packages/*/src/**/__tests__/**',
    '!packages/*/src/**/*.test.{ts,tsx}',
    '!packages/*/src/**/*.spec.{ts,tsx}',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@eamcet-platform/shared$': '<rootDir>/packages/shared/src/index.ts',
  },
  projects: [
    {
      displayName: 'shared',
      testMatch: ['<rootDir>/packages/shared/src/**/*.{test,spec}.{js,ts}'],
      preset: 'ts-jest',
      testEnvironment: 'node',
    },
    {
      displayName: 'auth-worker',
      testMatch: ['<rootDir>/packages/auth-worker/src/**/*.{test,spec}.{js,ts}'],
      preset: 'ts-jest',
      testEnvironment: 'node',
    },
    {
      displayName: 'test-engine-worker',
      testMatch: ['<rootDir>/packages/test-engine-worker/src/**/*.{test,spec}.{js,ts}'],
      preset: 'ts-jest',
      testEnvironment: 'node',
    },
    {
      displayName: 'ai-worker',
      testMatch: ['<rootDir>/packages/ai-worker/src/**/*.{test,spec}.{js,ts}'],
      preset: 'ts-jest',
      testEnvironment: 'node',
    },
    {
      displayName: 'analytics-worker',
      testMatch: ['<rootDir>/packages/analytics-worker/src/**/*.{test,spec}.{js,ts}'],
      preset: 'ts-jest',
      testEnvironment: 'node',
    },
    {
      displayName: 'frontend',
      testMatch: ['<rootDir>/packages/frontend/src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/packages/frontend/src/test/setup.ts'],
      moduleNameMapping: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      },
    },
  ],
};