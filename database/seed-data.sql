-- Seed data for EAMCET Mock Test Platform
-- Development and testing data

-- Sample questions for testing
INSERT OR IGNORE INTO questions (id, subject, difficulty, question_text, options, correct_answer, explanation, source_pattern, metadata) VALUES
-- Physics Questions
('q_phy_001', 'physics', 'medium', 'A particle moves in a circle of radius 20 cm with constant speed. If it completes 10 revolutions in 5 seconds, what is its angular velocity?', 
 '["2π rad/s", "4π rad/s", "10π rad/s", "20π rad/s"]', 
 '4π rad/s', 
 'Angular velocity = 2π × frequency = 2π × (10/5) = 4π rad/s',
 'EAMCET-2023-Physics-Circular-Motion',
 '{"topic": "Circular Motion", "subtopic": "Angular Velocity", "estimatedTime": 120, "conceptTags": ["angular velocity", "circular motion", "frequency"]}'),

('q_phy_002', 'physics', 'hard', 'Two blocks of masses 2 kg and 3 kg are connected by a string passing over a pulley. If the system is released from rest, what is the acceleration of the system? (g = 10 m/s²)', 
 '["2 m/s²", "4 m/s²", "6 m/s²", "8 m/s²"]', 
 '4 m/s²', 
 'For connected masses: a = (m₂ - m₁)g/(m₁ + m₂) = (3-2)×10/(2+3) = 2 m/s²',
 'EAMCET-2022-Physics-Mechanics',
 '{"topic": "Mechanics", "subtopic": "Connected Bodies", "estimatedTime": 180, "conceptTags": ["pulley system", "acceleration", "connected masses"]}'),

-- Chemistry Questions  
('q_chem_001', 'chemistry', 'easy', 'What is the molecular formula of glucose?', 
 '["C₆H₁₂O₆", "C₆H₁₀O₅", "C₁₂H₂₂O₁₁", "C₅H₁₀O₅"]', 
 'C₆H₁₂O₆', 
 'Glucose is a simple sugar with the molecular formula C₆H₁₂O₆',
 'EAMCET-2023-Chemistry-Organic',
 '{"topic": "Organic Chemistry", "subtopic": "Carbohydrates", "estimatedTime": 60, "conceptTags": ["glucose", "molecular formula", "carbohydrates"]}'),

('q_chem_002', 'chemistry', 'medium', 'Which of the following has the highest boiling point?', 
 '["HF", "HCl", "HBr", "HI"]', 
 'HF', 
 'HF has the highest boiling point due to strong hydrogen bonding',
 'EAMCET-2022-Chemistry-Physical',
 '{"topic": "Physical Chemistry", "subtopic": "Hydrogen Bonding", "estimatedTime": 90, "conceptTags": ["boiling point", "hydrogen bonding", "halogens"]}'),

-- Mathematics Questions
('q_math_001', 'mathematics', 'medium', 'If log₂(x) = 3, then x equals:', 
 '["6", "8", "9", "12"]', 
 '8', 
 'log₂(x) = 3 means 2³ = x, therefore x = 8',
 'EAMCET-2023-Mathematics-Algebra',
 '{"topic": "Algebra", "subtopic": "Logarithms", "estimatedTime": 90, "conceptTags": ["logarithms", "exponentials", "algebra"]}'),

('q_math_002', 'mathematics', 'hard', 'The derivative of sin(x²) with respect to x is:', 
 '["cos(x²)", "2x cos(x²)", "2x sin(x²)", "x² cos(x²)"]', 
 '2x cos(x²)', 
 'Using chain rule: d/dx[sin(x²)] = cos(x²) × d/dx[x²] = cos(x²) × 2x = 2x cos(x²)',
 'EAMCET-2022-Mathematics-Calculus',
 '{"topic": "Calculus", "subtopic": "Differentiation", "estimatedTime": 120, "conceptTags": ["chain rule", "differentiation", "trigonometry"]}');

-- Sample test configuration data for development
-- This would typically be created by the application, but useful for testing
INSERT OR IGNORE INTO schema_migrations (version, description) VALUES 
(2, 'Seed data insertion for development and testing');