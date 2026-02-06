// Unit Tests for AI Question Generation System
import { describe, it, expect, beforeEach } from 'vitest';
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

describe('AI Question Generation', () => {
  describe('generateQuestions', () => {
    it('should generate the correct number of questions', () => {
      const params: GenerationParams = {
        subject: 'physics',
        difficulty: 'easy',
        count: 5,
      };

      const questions = generateQuestions(params);
      expect(questions).toHaveLength(5);
    });

    it('should generate questions with correct subject', () => {
      const params: GenerationParams = {
        subject: 'chemistry',
        difficulty: 'medium',
        count: 3,
      };

      const questions = generateQuestions(params);
      questions.forEach(q => {
        expect(q.subject).toBe('chemistry');
      });
    });

    it('should generate questions with correct difficulty', () => {
      const params: GenerationParams = {
        subject: 'mathematics',
        difficulty: 'hard',
        count: 2,
      };

      const questions = generateQuestions(params);
      questions.forEach(q => {
        expect(q.difficulty).toBe('hard');
      });
    });

    it('should generate questions with unique IDs', () => {
      const params: GenerationParams = {
        subject: 'physics',
        difficulty: 'easy',
        count: 10,
      };

      const questions = generateQuestions(params);
      const ids = questions.map(q => q.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(10);
    });

    it('should generate questions with EAMCET format (4 options)', () => {
      const params: GenerationParams = {
        subject: 'physics',
        difficulty: 'easy',
        count: 5,
      };

      const questions = generateQuestions(params);
      questions.forEach(q => {
        expect(q.options).toHaveLength(4);
      });
    });

    it('should include correct answer in options', () => {
      const params: GenerationParams = {
        subject: 'chemistry',
        difficulty: 'medium',
        count: 3,
      };

      const questions = generateQuestions(params);
      questions.forEach(q => {
        expect(q.options).toContain(q.correctAnswer);
      });
    });

    it('should include complete metadata', () => {
      const params: GenerationParams = {
        subject: 'mathematics',
        difficulty: 'hard',
        count: 2,
      };

      const questions = generateQuestions(params);
      questions.forEach(q => {
        expect(q.metadata).toBeDefined();
        expect(q.metadata.topic).toBeTruthy();
        expect(q.metadata.estimatedTime).toBeGreaterThan(0);
        expect(q.metadata.conceptTags).toBeInstanceOf(Array);
        expect(q.metadata.conceptTags.length).toBeGreaterThan(0);
      });
    });
  });

  describe('validateQuestion', () => {
    it('should validate a correct question', () => {
      const question: Question = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        subject: 'physics',
        difficulty: 'easy',
        questionText: 'What is the speed of light in vacuum?',
        options: ['3 × 10⁸ m/s', '3 × 10⁶ m/s', '3 × 10⁷ m/s', '3 × 10⁹ m/s'],
        correctAnswer: '3 × 10⁸ m/s',
        explanation:
          'The speed of light in vacuum is approximately 3 × 10⁸ m/s',
        sourcePattern: 'EAMCET-2023-PHYSICS',
        metadata: {
          topic: 'Optics',
          estimatedTime: 60,
          conceptTags: ['light', 'speed', 'constants'],
        },
      };

      const validation = validateQuestion(question);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject question with wrong number of options', () => {
      const question: Question = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        subject: 'physics',
        difficulty: 'easy',
        questionText: 'What is the speed of light?',
        options: ['3 × 10⁸ m/s', '3 × 10⁶ m/s'],
        correctAnswer: '3 × 10⁸ m/s',
        explanation: 'Speed of light',
        sourcePattern: 'EAMCET-2023-PHYSICS',
        metadata: {
          topic: 'Optics',
          estimatedTime: 60,
          conceptTags: ['light'],
        },
      };

      const validation = validateQuestion(question);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('4 options'))).toBe(true);
    });

    it('should reject question with correct answer not in options', () => {
      const question: Question = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        subject: 'physics',
        difficulty: 'easy',
        questionText: 'What is the speed of light?',
        options: ['3 × 10⁶ m/s', '3 × 10⁷ m/s', '3 × 10⁹ m/s', '3 × 10¹⁰ m/s'],
        correctAnswer: '3 × 10⁸ m/s',
        explanation: 'Speed of light',
        sourcePattern: 'EAMCET-2023-PHYSICS',
        metadata: {
          topic: 'Optics',
          estimatedTime: 60,
          conceptTags: ['light'],
        },
      };

      const validation = validateQuestion(question);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('Correct answer'))).toBe(
        true
      );
    });

    it('should warn about short question text', () => {
      const question: Question = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        subject: 'physics',
        difficulty: 'easy',
        questionText: 'Speed?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 'A',
        explanation: 'Explanation here',
        sourcePattern: 'EAMCET-2023-PHYSICS',
        metadata: {
          topic: 'Mechanics',
          estimatedTime: 60,
          conceptTags: ['speed'],
        },
      };

      const validation = validateQuestion(question);
      expect(validation.warnings.some(w => w.includes('too short'))).toBe(true);
    });

    it('should reject question with duplicate options', () => {
      const question: Question = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        subject: 'physics',
        difficulty: 'easy',
        questionText: 'What is the speed of light in vacuum?',
        options: ['3 × 10⁸ m/s', '3 × 10⁸ m/s', '3 × 10⁷ m/s', '3 × 10⁹ m/s'],
        correctAnswer: '3 × 10⁸ m/s',
        explanation: 'Speed of light',
        sourcePattern: 'EAMCET-2023-PHYSICS',
        metadata: {
          topic: 'Optics',
          estimatedTime: 60,
          conceptTags: ['light'],
        },
      };

      const validation = validateQuestion(question);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('unique'))).toBe(true);
    });
  });

  describe('assessDifficulty', () => {
    it('should assess easy questions correctly', () => {
      const question: Question = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        subject: 'physics',
        difficulty: 'easy',
        questionText: 'What is force?',
        options: ['Push or pull', 'Energy', 'Power', 'Work'],
        correctAnswer: 'Push or pull',
        explanation: 'Force is a push or pull',
        sourcePattern: 'EAMCET-2023-PHYSICS',
        metadata: {
          topic: 'Mechanics',
          estimatedTime: 45,
          conceptTags: ['force'],
        },
      };

      const difficulty = assessDifficulty(question);
      expect(['easy', 'medium']).toContain(difficulty);
    });

    it('should assess hard questions with long text and calculations', () => {
      const question: Question = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        subject: 'physics',
        difficulty: 'hard',
        questionText:
          'Calculate the de Broglie wavelength of an electron moving with velocity 10⁶ m/s. Given: mass = 9.1 × 10⁻³¹ kg, h = 6.63 × 10⁻³⁴ Js. Use the formula λ = h/mv and show all steps in your calculation.',
        options: [
          '7.28 × 10⁻¹⁰ m',
          '7.28 × 10⁻¹¹ m',
          '7.28 × 10⁻⁹ m',
          '7.28 × 10⁻¹² m',
        ],
        correctAnswer: '7.28 × 10⁻¹⁰ m',
        explanation: 'Using de Broglie equation',
        sourcePattern: 'EAMCET-2023-PHYSICS',
        metadata: {
          topic: 'Quantum Mechanics',
          estimatedTime: 180,
          conceptTags: ['de-broglie', 'quantum', 'wavelength', 'calculations'],
        },
      };

      const difficulty = assessDifficulty(question);
      expect(['medium', 'hard']).toContain(difficulty);
    });
  });

  describe('classifySubject', () => {
    it('should classify physics questions', () => {
      const text =
        'Calculate the force acting on a body with mass 5 kg and acceleration 2 m/s²';
      const subject = classifySubject(text);
      expect(subject).toBe('physics');
    });

    it('should classify chemistry questions', () => {
      const text = 'What is the electronic configuration of the oxygen atom?';
      const subject = classifySubject(text);
      expect(subject).toBe('chemistry');
    });

    it('should classify mathematics questions', () => {
      const text = 'Solve the quadratic equation x² - 5x + 6 = 0';
      const subject = classifySubject(text);
      expect(subject).toBe('mathematics');
    });

    it('should return null for ambiguous text', () => {
      const text = 'This is a random text without any subject keywords';
      const subject = classifySubject(text);
      expect(subject).toBeNull();
    });
  });

  describe('extractTopicTags', () => {
    it('should extract physics topic tags', () => {
      const question: Question = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        subject: 'physics',
        difficulty: 'medium',
        questionText: 'Calculate the electric force between two charges',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 'A',
        explanation: "Using Coulomb's law",
        sourcePattern: 'EAMCET-2023-PHYSICS',
        metadata: {
          topic: 'Electromagnetism',
          estimatedTime: 90,
          conceptTags: ['coulombs-law'],
        },
      };

      const tags = extractTopicTags(question);
      expect(tags).toContain('coulombs-law');
      expect(tags).toContain('electromagnetism');
    });

    it('should extract chemistry topic tags', () => {
      const question: Question = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        subject: 'chemistry',
        difficulty: 'medium',
        questionText: 'What is the bond angle in a water molecule?',
        options: ['104.5°', '109.5°', '120°', '180°'],
        correctAnswer: '104.5°',
        explanation: 'Water has bent geometry',
        sourcePattern: 'EAMCET-2023-CHEMISTRY',
        metadata: {
          topic: 'Chemical Bonding',
          estimatedTime: 60,
          conceptTags: ['molecular-geometry'],
        },
      };

      const tags = extractTopicTags(question);
      expect(tags).toContain('molecular-geometry');
      expect(tags).toContain('chemical-bonding');
    });

    it('should not duplicate tags', () => {
      const question: Question = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        subject: 'mathematics',
        difficulty: 'easy',
        questionText: 'Solve the equation',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 'A',
        explanation: 'Solution',
        sourcePattern: 'EAMCET-2023-MATH',
        metadata: {
          topic: 'Algebra',
          estimatedTime: 60,
          conceptTags: ['algebra', 'equations'],
        },
      };

      const tags = extractTopicTags(question);
      const uniqueTags = new Set(tags);
      expect(tags.length).toBe(uniqueTags.size);
    });
  });

  describe('validateQuestionDistribution', () => {
    it('should validate correct distribution', () => {
      const questions: Question[] = [
        ...generateQuestions({
          subject: 'physics',
          difficulty: 'easy',
          count: 10,
        }),
        ...generateQuestions({
          subject: 'chemistry',
          difficulty: 'medium',
          count: 10,
        }),
        ...generateQuestions({
          subject: 'mathematics',
          difficulty: 'hard',
          count: 10,
        }),
      ];

      const requirements: DistributionRequirements = {
        totalQuestions: 30,
        subjectDistribution: {
          physics: 10,
          chemistry: 10,
          mathematics: 10,
        },
        difficultyDistribution: {
          easy: 10,
          medium: 10,
          hard: 10,
        },
      };

      const validation = validateQuestionDistribution(questions, requirements);
      expect(validation.isValid).toBe(true);
    });

    it('should detect incorrect total count', () => {
      const questions: Question[] = generateQuestions({
        subject: 'physics',
        difficulty: 'easy',
        count: 5,
      });

      const requirements: DistributionRequirements = {
        totalQuestions: 10,
        subjectDistribution: {
          physics: 10,
          chemistry: 0,
          mathematics: 0,
        },
        difficultyDistribution: {
          easy: 10,
          medium: 0,
          hard: 0,
        },
      };

      const validation = validateQuestionDistribution(questions, requirements);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('Expected'))).toBe(true);
    });

    it('should detect incorrect subject distribution', () => {
      const questions: Question[] = [
        ...generateQuestions({
          subject: 'physics',
          difficulty: 'easy',
          count: 20,
        }),
        ...generateQuestions({
          subject: 'chemistry',
          difficulty: 'easy',
          count: 5,
        }),
        ...generateQuestions({
          subject: 'mathematics',
          difficulty: 'easy',
          count: 5,
        }),
      ];

      const requirements: DistributionRequirements = {
        totalQuestions: 30,
        subjectDistribution: {
          physics: 10,
          chemistry: 10,
          mathematics: 10,
        },
        difficultyDistribution: {
          easy: 30,
          medium: 0,
          hard: 0,
        },
      };

      const validation = validateQuestionDistribution(questions, requirements);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('physics'))).toBe(true);
    });
  });
});
