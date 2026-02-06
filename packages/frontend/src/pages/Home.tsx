import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Home.css';

export const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home">
      <section className="hero">
        <h2>Prepare for EAMCET with AI-Powered Mock Tests</h2>
        <p>
          Practice with realistic mock tests, get detailed analytics, and track
          your progress towards EAMCET success.
        </p>
        {!isAuthenticated ? (
          <div className="cta-buttons">
            <Link to="/register" className="btn btn-primary">
              Get Started
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Login
            </Link>
          </div>
        ) : (
          <div className="cta-buttons">
            <Link to="/tests" className="btn btn-primary">
              Start a Test
            </Link>
            <Link to="/dashboard" className="btn btn-secondary">
              View Dashboard
            </Link>
          </div>
        )}
      </section>

      <section className="features">
        <h3>Features</h3>
        <div className="feature-grid">
          <div className="feature-card">
            <h4>AI-Generated Questions</h4>
            <p>
              Practice with questions generated from past EAMCET papers using AI
              technology.
            </p>
          </div>
          <div className="feature-card">
            <h4>Real-Time Testing</h4>
            <p>
              Experience realistic exam conditions with timed tests and
              automatic submission.
            </p>
          </div>
          <div className="feature-card">
            <h4>Detailed Analytics</h4>
            <p>
              Get comprehensive performance insights and identify your strengths
              and weaknesses.
            </p>
          </div>
          <div className="feature-card">
            <h4>Progress Tracking</h4>
            <p>
              Monitor your improvement over time with detailed progress reports
              and trends.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
