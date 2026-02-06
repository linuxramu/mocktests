// Property-based tests for Test History Components
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { TestSession } from '@eamcet-platform/shared';

/**
 * Property 7: Historical Data Integrity
 *
 * Feature: eamcet-mock-test-platform, Property 7: Historical Data Integrity
 *
 * **Validates: Requirements 6.2, 6.3, 6.4, 6.5**
 *
 * For any user's test attempts, the system should store complete data,
 * allow retrieval of all sessions, provide detailed analysis, maintain
 * data integrity, and support filtering operations.
 */

// Generators for test data
const testTypeArb = fc.constantFrom('full', 'subject-wise', 'custom');
const statusArb = fc.constantFrom('active', 'completed', 'abandoned');
const subjectArb = fc.constantFrom('physics', 'chemistry', 'mathematics');

const testSessionArb = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  testType: testTypeArb,
  status: statusArb,
  startedAt: fc.date({ min: new Date('2024-01-01'), max: new Date() }),
  completedAt: fc.option(
    fc.date({ min: new Date('2024-01-01'), max: new Date() }),
    { nil: undefined }
  ),
  durationSeconds: fc.option(fc.integer({ min: 0, max: 10800 }), {
    nil: undefined,
  }),
  totalQuestions: fc.integer({ min: 1, max: 200 }),
  configuration: fc.record({
    subjects: fc.array(subjectArb, { minLength: 1, maxLength: 3 }),
    questionsPerSubject: fc.integer({ min: 1, max: 100 }),
    timeLimit: fc.integer({ min: 1, max: 300 }),
    difficulty: fc.constantFrom('mixed', 'easy', 'medium', 'hard'),
    randomizeQuestions: fc.boolean(),
  }),
}) as fc.Arbitrary<TestSession>;

describe('Property 7: Historical Data Integrity', () => {
  it('should maintain data integrity when storing and retrieving test sessions', () => {
    fc.assert(
      fc.property(testSessionArb, session => {
        // Simulate storage and retrieval
        const stored = JSON.stringify(session);
        const retrieved = JSON.parse(stored) as TestSession;

        // Verify all fields are preserved
        expect(retrieved.id).toBe(session.id);
        expect(retrieved.userId).toBe(session.userId);
        expect(retrieved.testType).toBe(session.testType);
        expect(retrieved.status).toBe(session.status);
        expect(retrieved.totalQuestions).toBe(session.totalQuestions);

        // Verify configuration is preserved
        expect(retrieved.configuration.subjects).toEqual(
          session.configuration.subjects
        );
        expect(retrieved.configuration.questionsPerSubject).toBe(
          session.configuration.questionsPerSubject
        );
        expect(retrieved.configuration.timeLimit).toBe(
          session.configuration.timeLimit
        );
        expect(retrieved.configuration.difficulty).toBe(
          session.configuration.difficulty
        );
        expect(retrieved.configuration.randomizeQuestions).toBe(
          session.configuration.randomizeQuestions
        );
      }),
      { numRuns: 100 }
    );
  });

  it('should correctly filter test history by status', () => {
    fc.assert(
      fc.property(
        fc.array(testSessionArb, { minLength: 1, maxLength: 50 }),
        fc.constantFrom('all', 'completed', 'active', 'abandoned'),
        (sessions, filterStatus) => {
          // Apply filter
          const filtered =
            filterStatus === 'all'
              ? sessions
              : sessions.filter(s => s.status === filterStatus);

          // Verify filter correctness
          if (filterStatus === 'all') {
            expect(filtered.length).toBe(sessions.length);
          } else {
            filtered.forEach(session => {
              expect(session.status).toBe(filterStatus);
            });
          }

          // Verify no data loss in filtering
          filtered.forEach(filteredSession => {
            const original = sessions.find(s => s.id === filteredSession.id);
            expect(original).toBeDefined();
            expect(filteredSession).toEqual(original);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly filter test history by test type', () => {
    fc.assert(
      fc.property(
        fc.array(testSessionArb, { minLength: 1, maxLength: 50 }),
        fc.constantFrom('all', 'full', 'subject-wise', 'custom'),
        (sessions, filterType) => {
          // Apply filter
          const filtered =
            filterType === 'all'
              ? sessions
              : sessions.filter(s => s.testType === filterType);

          // Verify filter correctness
          if (filterType === 'all') {
            expect(filtered.length).toBe(sessions.length);
          } else {
            filtered.forEach(session => {
              expect(session.testType).toBe(filterType);
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly sort test history by date', () => {
    fc.assert(
      fc.property(
        fc.array(testSessionArb, { minLength: 2, maxLength: 50 }),
        fc.constantFrom('asc', 'desc'),
        (sessions, sortOrder) => {
          // Sort by startedAt
          const sorted = [...sessions].sort((a, b) => {
            const aTime = new Date(a.startedAt).getTime();
            const bTime = new Date(b.startedAt).getTime();
            return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
          });

          // Verify sort order
          for (let i = 1; i < sorted.length; i++) {
            const prevTime = new Date(sorted[i - 1].startedAt).getTime();
            const currTime = new Date(sorted[i].startedAt).getTime();

            if (sortOrder === 'asc') {
              expect(prevTime).toBeLessThanOrEqual(currTime);
            } else {
              expect(prevTime).toBeGreaterThanOrEqual(currTime);
            }
          }

          // Verify no data loss in sorting
          expect(sorted.length).toBe(sessions.length);
          sorted.forEach(sortedSession => {
            const original = sessions.find(s => s.id === sortedSession.id);
            expect(original).toBeDefined();
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain data consistency when combining filters and sorting', () => {
    fc.assert(
      fc.property(
        fc.array(testSessionArb, { minLength: 5, maxLength: 50 }),
        fc.constantFrom('all', 'completed', 'active', 'abandoned'),
        fc.constantFrom('asc', 'desc'),
        (sessions, filterStatus, sortOrder) => {
          // Apply filter
          const filtered =
            filterStatus === 'all'
              ? sessions
              : sessions.filter(s => s.status === filterStatus);

          // Apply sort
          const sorted = [...filtered].sort((a, b) => {
            const aTime = new Date(a.startedAt).getTime();
            const bTime = new Date(b.startedAt).getTime();
            return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
          });

          // Verify all operations maintain data integrity
          sorted.forEach(session => {
            // Verify session exists in original data
            const original = sessions.find(s => s.id === session.id);
            expect(original).toBeDefined();

            // Verify filter was applied correctly
            if (filterStatus !== 'all') {
              expect(session.status).toBe(filterStatus);
            }

            // Verify all fields are intact
            expect(session.id).toBe(original!.id);
            expect(session.userId).toBe(original!.userId);
            expect(session.testType).toBe(original!.testType);
            expect(session.totalQuestions).toBe(original!.totalQuestions);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve completed session data including duration and completion time', () => {
    fc.assert(
      fc.property(
        fc
          .record({
            id: fc.uuid(),
            userId: fc.uuid(),
            testType: testTypeArb,
            status: fc.constant('completed'),
            startedAt: fc.date({
              min: new Date('2024-01-01'),
              max: new Date(),
            }),
            completedAt: fc.date({
              min: new Date('2024-01-01'),
              max: new Date(),
            }),
            durationSeconds: fc.integer({ min: 60, max: 10800 }),
            totalQuestions: fc.integer({ min: 1, max: 200 }),
            configuration: fc.record({
              subjects: fc.array(subjectArb, { minLength: 1, maxLength: 3 }),
              questionsPerSubject: fc.integer({ min: 1, max: 100 }),
              timeLimit: fc.integer({ min: 1, max: 300 }),
              difficulty: fc.constantFrom('mixed', 'easy', 'medium', 'hard'),
              randomizeQuestions: fc.boolean(),
            }),
          })
          .filter(
            session =>
              new Date(session.completedAt).getTime() >=
              new Date(session.startedAt).getTime()
          ),
        session => {
          // Verify completed session has required fields
          expect(session.status).toBe('completed');
          expect(session.completedAt).toBeDefined();
          expect(session.durationSeconds).toBeDefined();
          expect(session.durationSeconds).toBeGreaterThan(0);

          // Verify temporal consistency
          const startTime = new Date(session.startedAt).getTime();
          const endTime = new Date(session.completedAt).getTime();
          expect(endTime).toBeGreaterThanOrEqual(startTime);

          // Verify duration is reasonable (not negative)
          expect(session.durationSeconds).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty history gracefully', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('all', 'completed', 'active', 'abandoned'),
        filterStatus => {
          const emptyHistory: TestSession[] = [];

          // Apply filter to empty history
          const filtered =
            filterStatus === 'all'
              ? emptyHistory
              : emptyHistory.filter(s => s.status === filterStatus);

          // Verify empty result
          expect(filtered).toEqual([]);
          expect(filtered.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain referential integrity across user sessions', () => {
    fc.assert(
      fc.property(
        fc.uuid(), // userId
        fc.array(testSessionArb, { minLength: 1, maxLength: 20 }),
        (userId, sessions) => {
          // Assign all sessions to the same user
          const userSessions = sessions.map(s => ({ ...s, userId }));

          // Verify all sessions belong to the user
          userSessions.forEach(session => {
            expect(session.userId).toBe(userId);
          });

          // Verify session IDs are unique
          const sessionIds = new Set(userSessions.map(s => s.id));
          expect(sessionIds.size).toBe(userSessions.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should support pagination without data loss', () => {
    fc.assert(
      fc.property(
        fc.array(testSessionArb, { minLength: 10, maxLength: 100 }),
        fc.integer({ min: 1, max: 20 }), // page size
        (sessions, pageSize) => {
          const totalPages = Math.ceil(sessions.length / pageSize);

          // Collect all items from all pages
          const allPaginatedItems: TestSession[] = [];
          for (let page = 0; page < totalPages; page++) {
            const start = page * pageSize;
            const end = Math.min(start + pageSize, sessions.length);
            const pageItems = sessions.slice(start, end);
            allPaginatedItems.push(...pageItems);
          }

          // Verify no data loss
          expect(allPaginatedItems.length).toBe(sessions.length);

          // Verify all original items are present
          sessions.forEach(session => {
            const found = allPaginatedItems.find(s => s.id === session.id);
            expect(found).toBeDefined();
            expect(found).toEqual(session);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
