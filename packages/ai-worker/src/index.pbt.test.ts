// Property-Based Tests for AI Question Generation System
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  generateQuestions,
  validateQuestion,
  assessDifficulty,
  classifySubject,
  extractTopicTags,
  validateQuestionDistribution,
  GenerationParams,
  DistributionRequirements,
} from './ai-utils';
import { Question } from '@eamcet-platform/shared';

/**
 * **Feature: eamcet-mock-test-platform, Property 3: Question Generation Compliance**
 *
 * For any test configuration, generated questions should:
 * 1. Cover all required subjects
 * 2. Maintain proper difficulty distribution
 * 3. Follow EAMCET format (exactly 4 options)
 * 4. Include complete metadata
 *
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
 */

describe('Property 3: Question Generation Compliance', () => {
  it('should generate valid questions for any valid generation parameters', () => {
    fc.assert(
      fc.property(
        fc.record({
          subject: fc.constantFrom('physics', 'chemistry', 'mathematics'),
          difficulty: fc.constantFrom('easy', 'medium', 'hard'),
          count: fc.integer({ min: 1, max: 10 }),
          topic: fc.option(fc.string({ minLength: 3, maxLength: 20 }), {
            nil: undefined,
          }),
        }),
        (params: GenerationParams) => {
          const questions = generateQuestions(params);

          // Property 1: Should generate exactly the requested count
          expect(questions).toHaveLength(params.count);

          // Property 2: All questions should be valid
          questions.forEach(question => {
            const validation = validateQuestion(question);
            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
          });

          // Property 3: All questions should match requested subject
          questions.forEach(question => {
            expect(question.subject).toBe(params.subject);
          });

          // Property 4: All questions should match requested difficulty
          questions.forEach(question => {
            expect(question.difficulty).toBe(params.difficulty);
          });

          // Property 5: All questions must have exactly 4 options (EAMCET format)
          questions.forEach(question => {
            expect(question.options).toHaveLength(4);
          });

          // Property 6: Correct answer must be one of the options
          questions.forEach(question => {
            expect(question.options).toContain(question.correctAnswer);
          });

          // Property 7: All questions must have complete metadata
          questions.forEach(question => {
            expect(question.metadata).toBeDefined();
            expect(question.metadata.topic).toBeTruthy();
            expect(question.metadata.estimatedTime).toBeGreaterThan(0);
            expect(question.metadata.conceptTags).toBeInstanceOf(Array);
            expect(question.metadata.conceptTags.length).toBeGreaterThan(0);
          });

          // Property 8: All questions must have unique IDs
          const ids = questions.map(q => q.id);
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBe(questions.length);

          // Property 9: Source pattern should follow EAMCET format
          questions.forEach(question => {
            expect(question.sourcePattern).toMatch(/^EAMCET-\d{4}-[A-Z]+$/);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate questions correctly for any question structure', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          subject: fc.constantFrom('physics', 'chemistry', 'mathematics'),
          difficulty: fc.constantFrom('easy', 'medium', 'hard'),
          questionText: fc.string({ minLength: 10, maxLength: 500 }),
          options: fc.array(fc.string({ minLength: 1, maxLength: 100 }), {
            minLength: 4,
            maxLength: 4,
          }),
          correctAnswer: fc.string({ minLength: 1, maxLength: 100 }),
          explanation: fc.option(fc.string({ minLength: 10, maxLength: 200 }), {
            nil: undefined,
          }),
          sourcePattern: fc.string({ minLength: 5, maxLength: 50 }),
          metadata: fc.record({
            topic: fc.string({ minLength: 3, maxLength: 50 }),
            subtopic: fc.option(fc.string({ minLength: 3, maxLength: 50 }), {
              nil: undefined,
            }),
            yearSource: fc.option(fc.integer({ min: 2000, max: 2030 }), {
              nil: undefined,
            }),
            estimatedTime: fc.integer({ min: 30, max: 300 }),
            conceptTags: fc.array(fc.string({ minLength: 3, maxLength: 20 }), {
              minLength: 1,
              maxLength: 5,
            }),
          }),
        }),
        (question: Question) => {
          // Ensure correct answer is in options for valid test
          question.options[0] = question.correctAnswer;

          const validation = validateQuestion(question);

          // Property 1: Validation should always return a result
          expect(validation).toBeDefined();
          expect(validation).toHaveProperty('isValid');
          expect(validation).toHaveProperty('errors');
          expect(validation).toHaveProperty('warnings');

          // Property 2: If valid, should have no errors
          if (validation.isValid) {
            expect(validation.errors).toHaveLength(0);
          }

          // Property 3: Errors and warnings should be arrays
          expect(Array.isArray(validation.errors)).toBe(true);
          expect(Array.isArray(validation.warnings)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should assess difficulty consistently for any question', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          subject: fc.constantFrom('physics', 'chemistry', 'mathematics'),
          difficulty: fc.constantFrom('easy', 'medium', 'hard'),
          questionText: fc.string({ minLength: 10, maxLength: 500 }),
          options: fc.array(fc.string({ minLength: 1, maxLength: 100 }), {
            minLength: 4,
            maxLength: 4,
          }),
          correctAnswer: fc.string({ minLength: 1, maxLength: 100 }),
          explanation: fc.option(fc.string({ minLength: 10, maxLength: 200 }), {
            nil: undefined,
          }),
          sourcePattern: fc.string({ minLength: 5, maxLength: 50 }),
          metadata: fc.record({
            topic: fc.string({ minLength: 3, maxLength: 50 }),
            subtopic: fc.option(fc.string({ minLength: 3, maxLength: 50 }), {
              nil: undefined,
            }),
            yearSource: fc.option(fc.integer({ min: 2000, max: 2030 }), {
              nil: undefined,
            }),
            estimatedTime: fc.integer({ min: 30, max: 300 }),
            conceptTags: fc.array(fc.string({ minLength: 3, maxLength: 20 }), {
              minLength: 1,
              maxLength: 5,
            }),
          }),
        }),
        (question: Question) => {
          const assessed = assessDifficulty(question);

          // Property 1: Should always return a valid difficulty level
          expect(['easy', 'medium', 'hard']).toContain(assessed);

          // Property 2: Assessment should be deterministic (same input = same output)
          const assessed2 = assessDifficulty(question);
          expect(assessed).toBe(assessed2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should classify subjects correctly or return null', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 500 }),
        (questionText: string) => {
          const subject = classifySubject(questionText);

          // Property 1: Should return valid subject or null
          if (subject !== null) {
            expect(['physics', 'chemistry', 'mathematics']).toContain(subject);
          }

          // Property 2: Classification should be deterministic
          const subject2 = classifySubject(questionText);
          expect(subject).toBe(subject2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should extract topic tags consistently', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          subject: fc.constantFrom('physics', 'chemistry', 'mathematics'),
          difficulty: fc.constantFrom('easy', 'medium', 'hard'),
          questionText: fc.string({ minLength: 10, maxLength: 500 }),
          options: fc.array(fc.string({ minLength: 1, maxLength: 100 }), {
            minLength: 4,
            maxLength: 4,
          }),
          correctAnswer: fc.string({ minLength: 1, maxLength: 100 }),
          explanation: fc.option(fc.string({ minLength: 10, maxLength: 200 }), {
            nil: undefined,
          }),
          sourcePattern: fc.string({ minLength: 5, maxLength: 50 }),
          metadata: fc.record({
            topic: fc.string({ minLength: 3, maxLength: 50 }),
            subtopic: fc.option(fc.string({ minLength: 3, maxLength: 50 }), {
              nil: undefined,
            }),
            yearSource: fc.option(fc.integer({ min: 2000, max: 2030 }), {
              nil: undefined,
            }),
            estimatedTime: fc.integer({ min: 30, max: 300 }),
            conceptTags: fc.array(fc.string({ minLength: 3, maxLength: 20 }), {
              minLength: 1,
              maxLength: 5,
            }),
          }),
        }),
        (question: Question) => {
          const tags = extractTopicTags(question);

          // Property 1: Should always return an array
          expect(Array.isArray(tags)).toBe(true);

          // Property 2: Should include original concept tags
          question.metadata.conceptTags.forEach(tag => {
            expect(tags).toContain(tag);
          });

          // Property 3: Tags should be unique
          const uniqueTags = new Set(tags);
          expect(uniqueTags.size).toBe(tags.length);

          // Property 4: Extraction should be deterministic
          const tags2 = extractTopicTags(question);
          expect(tags).toEqual(tags2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate question distribution correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          physicsCount: fc.integer({ min: 1, max: 20 }),
          chemistryCount: fc.integer({ min: 1, max: 20 }),
          mathematicsCount: fc.integer({ min: 1, max: 20 }),
          easyCount: fc.integer({ min: 1, max: 20 }),
          mediumCount: fc.integer({ min: 1, max: 20 }),
          hardCount: fc.integer({ min: 1, max: 20 }),
        }),
        config => {
          // Generate questions matching the distribution
          const questions: Question[] = [];

          // Generate physics questions
          for (let i = 0; i < config.physicsCount; i++) {
            const difficulty =
              i < config.easyCount
                ? 'easy'
                : i < config.easyCount + config.mediumCount
                  ? 'medium'
                  : 'hard';
            questions.push(
              ...generateQuestions({ subject: 'physics', difficulty, count: 1 })
            );
          }

          // Generate chemistry questions
          for (let i = 0; i < config.chemistryCount; i++) {
            const difficulty =
              i < config.easyCount
                ? 'easy'
                : i < config.easyCount + config.mediumCount
                  ? 'medium'
                  : 'hard';
            questions.push(
              ...generateQuestions({
                subject: 'chemistry',
                difficulty,
                count: 1,
              })
            );
          }

          // Generate mathematics questions
          for (let i = 0; i < config.mathematicsCount; i++) {
            const difficulty =
              i < config.easyCount
                ? 'easy'
                : i < config.easyCount + config.mediumCount
                  ? 'medium'
                  : 'hard';
            questions.push(
              ...generateQuestions({
                subject: 'mathematics',
                difficulty,
                count: 1,
              })
            );
          }

          const totalQuestions =
            config.physicsCount +
            config.chemistryCount +
            config.mathematicsCount;

          const requirements: DistributionRequirements = {
            totalQuestions,
            subjectDistribution: {
              physics: config.physicsCount,
              chemistry: config.chemistryCount,
              mathematics: config.mathematicsCount,
            },
            difficultyDistribution: {
              easy: config.easyCount,
              medium: config.mediumCount,
              hard: config.hardCount,
            },
          };

          const validation = validateQuestionDistribution(
            questions,
            requirements
          );

          // Property 1: Validation should always return a result
          expect(validation).toBeDefined();
          expect(validation).toHaveProperty('isValid');
          expect(validation).toHaveProperty('errors');
          expect(validation).toHaveProperty('warnings');

          // Property 2: Should validate total count correctly
          if (questions.length === totalQuestions) {
            // Total count check should pass
            const totalError = validation.errors.find(e =>
              e.includes('Expected')
            );
            expect(totalError).toBeUndefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
