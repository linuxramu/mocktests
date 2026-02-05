# Testing Framework Documentation

## Overview

The EAMCET Mock Test Platform uses a comprehensive testing strategy that combines unit testing and property-based testing to ensure code correctness and reliability. The testing framework is built on Jest and Vitest with fast-check for property-based testing.

## Testing Philosophy

Our testing approach follows a dual strategy:

1. **Unit Tests**: Focus on specific examples, edge cases, and integration points
2. **Property-Based Tests**: Verify universal properties across all possible inputs using randomized testing with minimum 100 iterations

This combination ensures both specific behavior validation and comprehensive input coverage.

## Framework Components

### Core Testing Libraries

- **Jest**: Primary testing framework for unit tests
- **Vitest**: Fast testing framework for modern JavaScript/TypeScript
- **fast-check**: Property-based testing library with 100+ iterations
- **@testing-library/react**: React component testing utilities
- **@testing-library/jest-dom**: Custom Jest matchers for DOM testing

### Test Utilities

Located in `packages/shared/src/test-utils/`:

- **mock-data.ts**: Realistic mock data generators
- **test-helpers.ts**: Common testing utilities and assertions
- **property-generators.ts**: fast-check generators for property-based testing
- **matchers.ts**: Custom Jest matchers for domain-specific assertions

## Running Tests

### Command Line Interface

```bash
# Run all tests (unit + property-based)
npm test

# Run only unit tests
npm run test:unit

# Run only property-based tests
npm run test:pbt

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Package-Specific Testing

```bash
# Test specific package
npm run test --workspace=packages/shared
npm run test --workspace=packages/frontend
npm run test --workspace=packages/auth-worker

# Property-based tests for specific package
npm run test:pbt --workspace=packages/shared
```

### Using the Test Runner Script

```bash
# Use the centralized test runner
node scripts/test-runner.js all
node scripts/test-runner.js pbt
node scripts/test-runner.js coverage
```

## Writing Tests

### Unit Tests

Unit tests should focus on specific examples and edge cases:

```typescript
import { describe, it, expect } from 'vitest';
import { validateEmail } from './utils';

describe('validateEmail', () => {
  it('should accept valid email addresses', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('')).toBe(false);
    expect(validateEmail('@domain.com')).toBe(false);
  });
});
```

### Property-Based Tests

Property-based tests verify universal properties across all inputs:

```typescript
import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { runPropertyTest, arbitraryEmail } from './test-utils/property-generators';
import { validateEmail } from './utils';

describe('validateEmail - Property-Based Tests', () => {
  it('should accept all valid email formats', () => {
    runPropertyTest(
      'validateEmail accepts valid emails',
      arbitraryEmail(),
      (email) => {
        expect(validateEmail(email)).toBe(true);
        expect(email).toBeValidEmail();
      }
    );
  });
});
```

### Custom Matchers

Use domain-specific matchers for cleaner assertions:

```typescript
// Available custom matchers
expect(uuid).toBeValidUUID();
expect(email).toBeValidEmail();
expect(date).toBeValidDate();
expect(date).toBeWithinTimeRange(startDate, endDate);
expect(config).toHaveValidTestConfiguration();
expect(question).toHaveValidQuestionFormat();
expect(metrics).toHaveValidPerformanceMetrics();
```

## Test Organization

### File Naming Conventions

- `*.test.ts` - Unit tests
- `*.pbt.test.ts` - Property-based tests
- `*.integration.test.ts` - Integration tests
- `*.e2e.test.ts` - End-to-end tests

### Directory Structure

```
packages/
├── shared/
│   ├── src/
│   │   ├── utils.test.ts           # Unit tests
│   │   ├── utils.pbt.test.ts       # Property-based tests
│   │   └── test-utils/             # Shared test utilities
│   │       ├── mock-data.ts
│   │       ├── test-helpers.ts
│   │       ├── property-generators.ts
│   │       └── matchers.ts
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Button.test.tsx
│   │   └── test/
│   │       └── setup.ts
└── auth-worker/
    ├── src/
    │   ├── auth.test.ts
    │   └── auth.pbt.test.ts
    └── vitest.config.ts
```

## Coverage Requirements

### Global Coverage Thresholds

- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### Package-Specific Thresholds

- **shared**: 90% (higher due to critical utilities)
- **auth-worker**: 85% (security-critical)
- **test-engine-worker**: 85% (core functionality)
- **analytics-worker**: 85% (data processing)
- **ai-worker**: 80% (external API integration)
- **frontend**: 75% (UI components)

## Property-Based Testing Guidelines

### Configuration

All property-based tests use these settings:

- **Minimum iterations**: 100 (as specified in requirements)
- **Timeout**: 30 seconds
- **Verbose output**: Enabled for debugging

### Writing Properties

Properties should test universal characteristics:

```typescript
// Good: Tests a universal property
it('should maintain data integrity through serialization', () => {
  runPropertyTest(
    'serialize/deserialize preserves data',
    arbitraryUser(),
    (user) => {
      const serialized = JSON.stringify(user);
      const deserialized = JSON.parse(serialized);
      expect(deserialized).toEqual(user);
    }
  );
});

// Avoid: Testing specific examples (use unit tests instead)
it('should handle specific user data', () => {
  const user = { id: '123', name: 'Test User' };
  // ... specific test logic
});
```

### Generators

Use provided generators for consistent test data:

```typescript
import {
  arbitraryUser,
  arbitraryQuestion,
  arbitraryTestSession,
  arbitraryEmail,
  arbitraryUUID,
} from './test-utils/property-generators';
```

## Mock Data

### Using Mock Data Generators

```typescript
import {
  mockUser,
  mockQuestion,
  mockTestSession,
  mockCompleteTestSession,
} from '@eamcet-platform/shared/test-utils';

// Generate single mock objects
const user = mockUser();
const question = mockQuestion({ difficulty: 'hard' });

// Generate arrays of mock data
const users = mockUsers(10);
const questions = mockQuestions(50);

// Generate related mock data
const { session, questions, answers } = mockCompleteTestSession();
```

### Customizing Mock Data

```typescript
// Override specific properties
const adminUser = mockUser({
  email: 'admin@test.com',
  profileData: { targetScore: 200 }
});

// Generate with constraints
const hardQuestions = mockQuestions(20).map(q => 
  mockQuestion({ ...q, difficulty: 'hard' })
);
```

## Performance Testing

### Execution Time Assertions

```typescript
import { assertExecutionTime } from './test-utils/test-helpers';

it('should execute within time limits', async () => {
  const result = await assertExecutionTime(
    async () => await processLargeDataset(data),
    1000 // 1 second max
  );
  expect(result).toBeDefined();
});
```

### Performance Properties

```typescript
it('should scale linearly with input size', () => {
  runPropertyTest(
    'processing time scales linearly',
    fc.integer({ min: 10, max: 1000 }),
    async (size) => {
      const data = generateTestData(size);
      const { timeMs } = await measureExecutionTime(() => process(data));
      
      // Should be roughly linear (allowing for some variance)
      expect(timeMs).toBeLessThan(size * 2); // 2ms per item max
    },
    { numRuns: 25 } // Fewer runs for performance tests
  );
});
```

## Debugging Tests

### Verbose Output

Enable verbose output for property-based tests:

```bash
npm run test:pbt -- --verbose
```

### Test Isolation

Run specific test files:

```bash
# Run specific test file
npx vitest packages/shared/src/utils.test.ts

# Run tests matching pattern
npx vitest --run --reporter=verbose "**/*.pbt.test.ts"
```

### Coverage Analysis

Generate detailed coverage reports:

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Continuous Integration

### GitHub Actions Integration

Tests run automatically on:

- Pull requests
- Pushes to main branch
- Scheduled runs (daily)

### CI Configuration

```yaml
- name: Run Tests
  run: |
    npm ci
    npm run test:coverage
    
- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

## Best Practices

### Test Writing Guidelines

1. **Write tests first** (TDD approach when possible)
2. **Test behavior, not implementation**
3. **Use descriptive test names**
4. **Keep tests focused and atomic**
5. **Avoid test interdependencies**

### Property-Based Testing Best Practices

1. **Start with simple properties**
2. **Use appropriate generators**
3. **Test edge cases explicitly**
4. **Combine with unit tests**
5. **Document property meanings**

### Mock Data Guidelines

1. **Use realistic data**
2. **Avoid hardcoded values**
3. **Generate related data consistently**
4. **Clean up after tests**
5. **Use appropriate data sizes**

## Troubleshooting

### Common Issues

1. **Flaky tests**: Use retry mechanisms and proper async handling
2. **Slow tests**: Optimize generators and reduce iteration counts for performance tests
3. **Memory issues**: Clean up mock data and avoid large datasets
4. **Coverage gaps**: Identify untested code paths and add appropriate tests

### Getting Help

- Check test configuration in `test.config.js`
- Review test utilities in `packages/shared/src/test-utils/`
- Run tests with verbose output for debugging
- Use the test runner script for consistent execution

## Future Enhancements

- Integration with mutation testing
- Visual regression testing for frontend components
- Performance benchmarking and regression detection
- Automated test generation based on TypeScript types