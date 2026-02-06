import React, { useState } from 'react';
import { TestConfiguration } from '@eamcet-platform/shared';
import './TestLauncher.css';

interface TestLauncherProps {
  onStartTest: (config: TestConfiguration) => void;
}

export const TestLauncher: React.FC<TestLauncherProps> = ({ onStartTest }) => {
  const [testType, setTestType] = useState<'full' | 'subject-wise' | 'custom'>(
    'full'
  );
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([
    'physics',
    'chemistry',
    'mathematics',
  ]);
  const [questionsPerSubject, setQuestionsPerSubject] = useState<number>(40);
  const [timeLimit, setTimeLimit] = useState<number>(180);
  const [difficulty, setDifficulty] = useState<
    'mixed' | 'easy' | 'medium' | 'hard'
  >('mixed');
  const [randomizeQuestions, setRandomizeQuestions] = useState<boolean>(true);

  const handleSubjectToggle = (subject: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const handleStartTest = () => {
    const config: TestConfiguration = {
      subjects: selectedSubjects,
      questionsPerSubject,
      timeLimit,
      difficulty,
      randomizeQuestions,
    };
    onStartTest(config);
  };

  return (
    <div className="test-launcher">
      <h2>Configure Your Mock Test</h2>

      <div className="config-section">
        <label>Test Type:</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              value="full"
              checked={testType === 'full'}
              onChange={e => setTestType(e.target.value as 'full')}
            />
            Full Test (All Subjects)
          </label>
          <label>
            <input
              type="radio"
              value="subject-wise"
              checked={testType === 'subject-wise'}
              onChange={e => setTestType(e.target.value as 'subject-wise')}
            />
            Subject-wise Test
          </label>
          <label>
            <input
              type="radio"
              value="custom"
              checked={testType === 'custom'}
              onChange={e => setTestType(e.target.value as 'custom')}
            />
            Custom Test
          </label>
        </div>
      </div>

      <div className="config-section">
        <label>Select Subjects:</label>
        <div className="checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={selectedSubjects.includes('physics')}
              onChange={() => handleSubjectToggle('physics')}
            />
            Physics
          </label>
          <label>
            <input
              type="checkbox"
              checked={selectedSubjects.includes('chemistry')}
              onChange={() => handleSubjectToggle('chemistry')}
            />
            Chemistry
          </label>
          <label>
            <input
              type="checkbox"
              checked={selectedSubjects.includes('mathematics')}
              onChange={() => handleSubjectToggle('mathematics')}
            />
            Mathematics
          </label>
        </div>
      </div>

      <div className="config-section">
        <label>Questions per Subject:</label>
        <input
          type="number"
          min="1"
          max="100"
          value={questionsPerSubject}
          onChange={e => setQuestionsPerSubject(Number(e.target.value))}
        />
      </div>

      <div className="config-section">
        <label>Time Limit (minutes):</label>
        <input
          type="number"
          min="1"
          max="300"
          value={timeLimit}
          onChange={e => setTimeLimit(Number(e.target.value))}
        />
      </div>

      <div className="config-section">
        <label>Difficulty:</label>
        <select
          value={difficulty}
          onChange={e =>
            setDifficulty(
              e.target.value as 'mixed' | 'easy' | 'medium' | 'hard'
            )
          }
        >
          <option value="mixed">Mixed</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      <div className="config-section">
        <label>
          <input
            type="checkbox"
            checked={randomizeQuestions}
            onChange={e => setRandomizeQuestions(e.target.checked)}
          />
          Randomize Questions
        </label>
      </div>

      <button
        className="start-test-btn"
        onClick={handleStartTest}
        disabled={selectedSubjects.length === 0}
      >
        Start Test
      </button>
    </div>
  );
};
