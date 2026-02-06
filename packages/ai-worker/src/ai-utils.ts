// AI Question Generation Utilities
import { Question, QuestionMetadata } from '@eamcet-platform/shared';
import { QuestionSchema } from '@eamcet-platform/shared/src/schemas';
import { v4 as uuidv4 } from 'uuid';

export interface GenerationParams {
  subject: 'physics' | 'chemistry' | 'mathematics';
  difficulty: 'easy' | 'medium' | 'hard';
  count: number;
  topic?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Mock AI question generation (simulates external AI API)
// In production, this would call an actual AI service
export function generateQuestions(params: GenerationParams): Question[] {
  const questions: Question[] = [];

  for (let i = 0; i < params.count; i++) {
    const question = generateSingleQuestion(
      params.subject,
      params.difficulty,
      params.topic
    );
    questions.push(question);
  }

  return questions;
}

function generateSingleQuestion(
  subject: 'physics' | 'chemistry' | 'mathematics',
  difficulty: 'easy' | 'medium' | 'hard',
  topic?: string
): Question {
  const questionTemplates = getQuestionTemplates(subject, difficulty);
  const template =
    questionTemplates[Math.floor(Math.random() * questionTemplates.length)];

  const metadata: QuestionMetadata = {
    topic: topic || template.topic,
    subtopic: template.subtopic,
    yearSource: 2020 + Math.floor(Math.random() * 5),
    estimatedTime: getEstimatedTime(difficulty),
    conceptTags: template.conceptTags,
  };

  return {
    id: uuidv4(),
    subject,
    difficulty,
    questionText: template.questionText,
    options: template.options,
    correctAnswer: template.correctAnswer,
    explanation: template.explanation,
    sourcePattern: `EAMCET-${metadata.yearSource}-${subject.toUpperCase()}`,
    metadata,
  };
}

function getEstimatedTime(difficulty: 'easy' | 'medium' | 'hard'): number {
  switch (difficulty) {
    case 'easy':
      return 60 + Math.floor(Math.random() * 30); // 60-90 seconds
    case 'medium':
      return 90 + Math.floor(Math.random() * 30); // 90-120 seconds
    case 'hard':
      return 120 + Math.floor(Math.random() * 60); // 120-180 seconds
  }
}

interface QuestionTemplate {
  topic: string;
  subtopic?: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  conceptTags: string[];
}

function getQuestionTemplates(
  subject: 'physics' | 'chemistry' | 'mathematics',
  difficulty: 'easy' | 'medium' | 'hard'
): QuestionTemplate[] {
  // Mock question templates - in production, these would come from AI generation
  const templates: Record<string, Record<string, QuestionTemplate[]>> = {
    physics: {
      easy: [
        {
          topic: 'Mechanics',
          subtopic: "Newton's Laws",
          questionText:
            'A body of mass 5 kg is moving with a velocity of 10 m/s. What is its kinetic energy?',
          options: ['250 J', '500 J', '125 J', '1000 J'],
          correctAnswer: '250 J',
          explanation: 'Kinetic Energy = (1/2)mv² = (1/2)(5)(10)² = 250 J',
          conceptTags: ['kinetic-energy', 'mechanics', 'motion'],
        },
      ],
      medium: [
        {
          topic: 'Electromagnetism',
          subtopic: 'Electric Field',
          questionText:
            'Two point charges of +3μC and -3μC are separated by 10 cm. What is the electric field at the midpoint?',
          options: [
            '5.4 × 10⁶ N/C',
            '1.08 × 10⁷ N/C',
            '2.7 × 10⁶ N/C',
            '0 N/C',
          ],
          correctAnswer: '1.08 × 10⁷ N/C',
          explanation: 'Electric field at midpoint = 2kq/r² where r = 0.05m',
          conceptTags: ['electric-field', 'electrostatics', 'coulombs-law'],
        },
      ],
      hard: [
        {
          topic: 'Modern Physics',
          subtopic: 'Quantum Mechanics',
          questionText:
            'Calculate the de Broglie wavelength of an electron moving with velocity 10⁶ m/s (mass = 9.1 × 10⁻³¹ kg, h = 6.63 × 10⁻³⁴ Js)',
          options: [
            '7.28 × 10⁻¹⁰ m',
            '7.28 × 10⁻¹¹ m',
            '7.28 × 10⁻⁹ m',
            '7.28 × 10⁻¹² m',
          ],
          correctAnswer: '7.28 × 10⁻¹⁰ m',
          explanation:
            'λ = h/mv = (6.63 × 10⁻³⁴)/(9.1 × 10⁻³¹ × 10⁶) = 7.28 × 10⁻¹⁰ m',
          conceptTags: [
            'de-broglie',
            'quantum-mechanics',
            'wave-particle-duality',
          ],
        },
      ],
    },
    chemistry: {
      easy: [
        {
          topic: 'Atomic Structure',
          subtopic: 'Electronic Configuration',
          questionText:
            'What is the electronic configuration of Sodium (Na, atomic number 11)?',
          options: [
            '1s² 2s² 2p⁶ 3s¹',
            '1s² 2s² 2p⁶ 3s²',
            '1s² 2s² 2p⁵ 3s²',
            '1s² 2s² 2p⁶ 3p¹',
          ],
          correctAnswer: '1s² 2s² 2p⁶ 3s¹',
          explanation:
            'Sodium has 11 electrons distributed as: 2 in 1s, 2 in 2s, 6 in 2p, and 1 in 3s',
          conceptTags: [
            'electronic-configuration',
            'atomic-structure',
            'periodic-table',
          ],
        },
      ],
      medium: [
        {
          topic: 'Chemical Bonding',
          subtopic: 'Molecular Geometry',
          questionText:
            'What is the shape of SF₄ molecule according to VSEPR theory?',
          options: [
            'Tetrahedral',
            'See-saw',
            'Square planar',
            'Trigonal bipyramidal',
          ],
          correctAnswer: 'See-saw',
          explanation:
            'SF₄ has 4 bonding pairs and 1 lone pair, resulting in see-saw geometry',
          conceptTags: [
            'vsepr-theory',
            'molecular-geometry',
            'chemical-bonding',
          ],
        },
      ],
      hard: [
        {
          topic: 'Chemical Kinetics',
          subtopic: 'Rate Laws',
          questionText:
            'For a reaction A + B → C, doubling [A] doubles the rate, and doubling [B] quadruples the rate. What is the rate law?',
          options: [
            'Rate = k[A][B]',
            'Rate = k[A][B]²',
            'Rate = k[A]²[B]',
            'Rate = k[A]²[B]²',
          ],
          correctAnswer: 'Rate = k[A][B]²',
          explanation:
            'Order with respect to A is 1 (rate doubles), order with respect to B is 2 (rate quadruples)',
          conceptTags: ['rate-law', 'chemical-kinetics', 'reaction-order'],
        },
      ],
    },
    mathematics: {
      easy: [
        {
          topic: 'Algebra',
          subtopic: 'Quadratic Equations',
          questionText: 'Solve for x: x² - 5x + 6 = 0',
          options: ['x = 2, 3', 'x = 1, 6', 'x = -2, -3', 'x = 2, -3'],
          correctAnswer: 'x = 2, 3',
          explanation: 'Factoring: (x-2)(x-3) = 0, so x = 2 or x = 3',
          conceptTags: ['quadratic-equations', 'algebra', 'factoring'],
        },
      ],
      medium: [
        {
          topic: 'Calculus',
          subtopic: 'Differentiation',
          questionText: 'Find dy/dx if y = x³ + 3x² - 5x + 7',
          options: [
            '3x² + 6x - 5',
            '3x² + 6x + 5',
            'x² + 6x - 5',
            '3x² - 6x - 5',
          ],
          correctAnswer: '3x² + 6x - 5',
          explanation: 'Using power rule: dy/dx = 3x² + 6x - 5',
          conceptTags: ['differentiation', 'calculus', 'power-rule'],
        },
      ],
      hard: [
        {
          topic: 'Trigonometry',
          subtopic: 'Inverse Functions',
          questionText: 'Evaluate: sin⁻¹(sin(7π/6))',
          options: ['-π/6', 'π/6', '7π/6', '-7π/6'],
          correctAnswer: '-π/6',
          explanation:
            'sin(7π/6) = -1/2, and sin⁻¹(-1/2) = -π/6 (principal value)',
          conceptTags: [
            'inverse-trigonometry',
            'trigonometry',
            'principal-values',
          ],
        },
      ],
    },
  };

  return templates[subject]?.[difficulty] || [];
}

// Validate question format against EAMCET standards
export function validateQuestion(question: Question): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate using Zod schema
  const result = QuestionSchema.safeParse(question);
  if (!result.success) {
    errors.push(
      ...result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
    );
  }

  // EAMCET-specific validations
  if (question.options.length !== 4) {
    errors.push('EAMCET questions must have exactly 4 options');
  }

  if (!question.options.includes(question.correctAnswer)) {
    errors.push('Correct answer must be one of the provided options');
  }

  if (question.questionText.length < 10) {
    warnings.push('Question text seems too short');
  }

  if (question.questionText.length > 500) {
    warnings.push('Question text is very long, consider simplifying');
  }

  if (!question.explanation || question.explanation.length < 10) {
    warnings.push('Explanation is missing or too brief');
  }

  // Check for duplicate options
  const uniqueOptions = new Set(question.options);
  if (uniqueOptions.size !== question.options.length) {
    errors.push('Options must be unique');
  }

  // Validate metadata
  if (
    question.metadata.estimatedTime < 30 ||
    question.metadata.estimatedTime > 300
  ) {
    warnings.push('Estimated time should be between 30 and 300 seconds');
  }

  if (question.metadata.conceptTags.length === 0) {
    warnings.push('Question should have at least one concept tag');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Store question in database
export async function storeQuestion(
  db: D1Database,
  question: Question
): Promise<void> {
  const validation = validateQuestion(question);
  if (!validation.isValid) {
    throw new Error(`Invalid question: ${validation.errors.join(', ')}`);
  }

  await db
    .prepare(
      `INSERT INTO questions (id, subject, difficulty, question_text, options, correct_answer, explanation, source_pattern, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      question.id,
      question.subject,
      question.difficulty,
      question.questionText,
      JSON.stringify(question.options),
      question.correctAnswer,
      question.explanation || null,
      question.sourcePattern,
      JSON.stringify(question.metadata)
    )
    .run();
}

// Retrieve questions from database
export async function getQuestions(
  db: D1Database,
  filters: {
    subject?: string;
    difficulty?: string;
    limit?: number;
  }
): Promise<Question[]> {
  let query = 'SELECT * FROM questions WHERE 1=1';
  const params: any[] = [];

  if (filters.subject) {
    query += ' AND subject = ?';
    params.push(filters.subject);
  }

  if (filters.difficulty) {
    query += ' AND difficulty = ?';
    params.push(filters.difficulty);
  }

  query += ' ORDER BY created_at DESC';

  if (filters.limit) {
    query += ' LIMIT ?';
    params.push(filters.limit);
  }

  const result = await db
    .prepare(query)
    .bind(...params)
    .all();

  return result.results.map((row: any) => ({
    id: row.id,
    subject: row.subject,
    difficulty: row.difficulty,
    questionText: row.question_text,
    options: JSON.parse(row.options),
    correctAnswer: row.correct_answer,
    explanation: row.explanation,
    sourcePattern: row.source_pattern,
    metadata: JSON.parse(row.metadata),
  }));
}

// Quality control: Assess difficulty level based on question characteristics
export function assessDifficulty(
  question: Question
): 'easy' | 'medium' | 'hard' {
  let score = 0;

  // Longer questions tend to be harder
  if (question.questionText.length > 200) score += 2;
  else if (question.questionText.length > 100) score += 1;

  // Questions with calculations are typically harder
  if (/\d+\s*[×÷+\-]\s*\d+/.test(question.questionText)) score += 1;

  // Questions with scientific notation are harder
  if (/\d+\s*×\s*10[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/.test(question.questionText)) score += 2;

  // More concept tags suggest complexity
  if (question.metadata.conceptTags.length > 3) score += 1;

  // Longer estimated time suggests difficulty
  if (question.metadata.estimatedTime > 120) score += 2;
  else if (question.metadata.estimatedTime > 90) score += 1;

  if (score >= 5) return 'hard';
  if (score >= 3) return 'medium';
  return 'easy';
}

// Subject classification based on content analysis
export function classifySubject(
  questionText: string
): 'physics' | 'chemistry' | 'mathematics' | null {
  const text = questionText.toLowerCase();

  // Physics keywords
  const physicsKeywords = [
    'force',
    'velocity',
    'acceleration',
    'energy',
    'momentum',
    'electric',
    'magnetic',
    'wave',
    'quantum',
    'mass',
    'newton',
    'joule',
  ];
  const physicsCount = physicsKeywords.filter(kw => text.includes(kw)).length;

  // Chemistry keywords
  const chemistryKeywords = [
    'atom',
    'molecule',
    'reaction',
    'bond',
    'electron',
    'element',
    'compound',
    'acid',
    'base',
    'oxidation',
    'reduction',
    'mole',
  ];
  const chemistryCount = chemistryKeywords.filter(kw =>
    text.includes(kw)
  ).length;

  // Mathematics keywords
  const mathKeywords = [
    'equation',
    'solve',
    'derivative',
    'integral',
    'matrix',
    'vector',
    'function',
    'polynomial',
    'trigonometry',
    'logarithm',
  ];
  const mathCount = mathKeywords.filter(kw => text.includes(kw)).length;

  const max = Math.max(physicsCount, chemistryCount, mathCount);
  if (max === 0) return null;

  if (physicsCount === max) return 'physics';
  if (chemistryCount === max) return 'chemistry';
  if (mathCount === max) return 'mathematics';

  return null;
}

// Topic tagging based on content analysis
export function extractTopicTags(question: Question): string[] {
  const tags = new Set<string>(question.metadata.conceptTags);
  const text = question.questionText.toLowerCase();

  // Subject-specific topic extraction
  if (question.subject === 'physics') {
    if (text.includes('force') || text.includes('newton'))
      tags.add('mechanics');
    if (text.includes('electric') || text.includes('charge'))
      tags.add('electromagnetism');
    if (text.includes('wave') || text.includes('frequency')) tags.add('waves');
    if (text.includes('quantum') || text.includes('photon'))
      tags.add('modern-physics');
    if (text.includes('heat') || text.includes('temperature'))
      tags.add('thermodynamics');
  } else if (question.subject === 'chemistry') {
    if (text.includes('atom') || text.includes('electron'))
      tags.add('atomic-structure');
    if (text.includes('bond') || text.includes('molecule'))
      tags.add('chemical-bonding');
    if (text.includes('reaction') || text.includes('rate'))
      tags.add('chemical-kinetics');
    if (text.includes('acid') || text.includes('base')) tags.add('acids-bases');
    if (text.includes('organic') || text.includes('carbon'))
      tags.add('organic-chemistry');
  } else if (question.subject === 'mathematics') {
    if (text.includes('derivative') || text.includes('differentiation'))
      tags.add('calculus');
    if (text.includes('integral') || text.includes('integration'))
      tags.add('calculus');
    if (text.includes('matrix') || text.includes('determinant'))
      tags.add('linear-algebra');
    if (text.includes('sin') || text.includes('cos') || text.includes('tan'))
      tags.add('trigonometry');
    if (text.includes('equation') || text.includes('solve'))
      tags.add('algebra');
  }

  return Array.from(tags);
}

// Validate question distribution for a test
export interface DistributionRequirements {
  totalQuestions: number;
  subjectDistribution: Record<string, number>; // e.g., { physics: 40, chemistry: 40, mathematics: 40 }
  difficultyDistribution: Record<string, number>; // e.g., { easy: 30, medium: 50, hard: 20 }
}

export function validateQuestionDistribution(
  questions: Question[],
  requirements: DistributionRequirements
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check total count
  if (questions.length !== requirements.totalQuestions) {
    errors.push(
      `Expected ${requirements.totalQuestions} questions, got ${questions.length}`
    );
  }

  // Check subject distribution
  const subjectCounts: Record<string, number> = {
    physics: 0,
    chemistry: 0,
    mathematics: 0,
  };

  questions.forEach(q => {
    subjectCounts[q.subject]++;
  });

  Object.entries(requirements.subjectDistribution).forEach(
    ([subject, expected]) => {
      const actual = subjectCounts[subject] || 0;
      const tolerance = Math.ceil(expected * 0.1); // 10% tolerance

      if (Math.abs(actual - expected) > tolerance) {
        errors.push(
          `Subject ${subject}: expected ${expected} questions (±${tolerance}), got ${actual}`
        );
      }
    }
  );

  // Check difficulty distribution
  const difficultyCounts: Record<string, number> = {
    easy: 0,
    medium: 0,
    hard: 0,
  };

  questions.forEach(q => {
    difficultyCounts[q.difficulty]++;
  });

  Object.entries(requirements.difficultyDistribution).forEach(
    ([difficulty, expected]) => {
      const actual = difficultyCounts[difficulty] || 0;
      const tolerance = Math.ceil(expected * 0.15); // 15% tolerance for difficulty

      if (Math.abs(actual - expected) > tolerance) {
        warnings.push(
          `Difficulty ${difficulty}: expected ${expected} questions (±${tolerance}), got ${actual}`
        );
      }
    }
  );

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
