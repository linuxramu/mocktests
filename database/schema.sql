-- EAMCET Mock Test Platform Database Schema
-- Cloudflare D1 SQLite Database

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    profile_data TEXT -- JSON string for user profile data
);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Test sessions table
CREATE TABLE IF NOT EXISTS test_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    test_type TEXT NOT NULL CHECK (test_type IN ('full', 'subject-wise', 'custom')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    duration_seconds INTEGER,
    total_questions INTEGER NOT NULL,
    configuration TEXT NOT NULL, -- JSON string for test configuration
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for test sessions
CREATE INDEX IF NOT EXISTS idx_test_sessions_user_id ON test_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_status ON test_sessions(status);
CREATE INDEX IF NOT EXISTS idx_test_sessions_started_at ON test_sessions(started_at);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    subject TEXT NOT NULL CHECK (subject IN ('physics', 'chemistry', 'mathematics')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    question_text TEXT NOT NULL,
    options TEXT NOT NULL, -- JSON array of answer options
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    source_pattern TEXT, -- Reference to past paper pattern
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT -- JSON string for question metadata
);

-- Create indexes for questions
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at);

-- Test questions junction table
CREATE TABLE IF NOT EXISTS test_questions (
    id TEXT PRIMARY KEY,
    test_session_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    question_number INTEGER NOT NULL,
    FOREIGN KEY (test_session_id) REFERENCES test_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    UNIQUE(test_session_id, question_number)
);

-- Create indexes for test questions
CREATE INDEX IF NOT EXISTS idx_test_questions_session ON test_questions(test_session_id);
CREATE INDEX IF NOT EXISTS idx_test_questions_question ON test_questions(question_id);

-- User answers table
CREATE TABLE IF NOT EXISTS user_answers (
    id TEXT PRIMARY KEY,
    test_session_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    selected_answer TEXT,
    is_correct BOOLEAN,
    time_spent_seconds INTEGER,
    answered_at DATETIME,
    is_marked_for_review BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (test_session_id) REFERENCES test_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    UNIQUE(test_session_id, question_id)
);

-- Create indexes for user answers
CREATE INDEX IF NOT EXISTS idx_user_answers_session ON user_answers(test_session_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_question ON user_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_answered_at ON user_answers(answered_at);

-- Performance analytics table
CREATE TABLE IF NOT EXISTS performance_analytics (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    test_session_id TEXT NOT NULL,
    subject TEXT NOT NULL CHECK (subject IN ('physics', 'chemistry', 'mathematics', 'overall')),
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    accuracy_percentage REAL NOT NULL,
    average_time_per_question REAL NOT NULL,
    strengths TEXT, -- JSON array of strength areas
    weaknesses TEXT, -- JSON array of weakness areas
    calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (test_session_id) REFERENCES test_sessions(id) ON DELETE CASCADE
);

-- Create indexes for performance analytics
CREATE INDEX IF NOT EXISTS idx_performance_analytics_user ON performance_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_analytics_session ON performance_analytics(test_session_id);
CREATE INDEX IF NOT EXISTS idx_performance_analytics_subject ON performance_analytics(subject);
CREATE INDEX IF NOT EXISTS idx_performance_analytics_calculated_at ON performance_analytics(calculated_at);

-- Progress tracking table
CREATE TABLE IF NOT EXISTS progress_tracking (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    metric_name TEXT NOT NULL, -- 'overall_score', 'physics_score', 'chemistry_score', 'mathematics_score', etc.
    metric_value REAL NOT NULL,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    test_session_id TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (test_session_id) REFERENCES test_sessions(id) ON DELETE SET NULL
);

-- Create indexes for progress tracking
CREATE INDEX IF NOT EXISTS idx_progress_tracking_user ON progress_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_tracking_metric ON progress_tracking(metric_name);
CREATE INDEX IF NOT EXISTS idx_progress_tracking_recorded_at ON progress_tracking(recorded_at);

-- Database version tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- Insert initial migration record
INSERT OR IGNORE INTO schema_migrations (version, description) 
VALUES (1, 'Initial schema creation with all core tables');