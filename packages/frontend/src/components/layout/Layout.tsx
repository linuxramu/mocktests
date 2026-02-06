import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';

export const Layout: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <Link to="/" className="logo">
            <h1>EAMCET Mock Test Platform</h1>
          </Link>
          <nav className="nav">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="nav-link">
                  Dashboard
                </Link>
                <Link to="/tests" className="nav-link">
                  Tests
                </Link>
                <Link to="/history" className="nav-link">
                  History
                </Link>
                <Link to="/analytics" className="nav-link">
                  Analytics
                </Link>
                <Link to="/profile" className="nav-link">
                  Profile
                </Link>
                <button onClick={handleLogout} className="nav-button">
                  Logout ({user?.name})
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">
                  Login
                </Link>
                <Link to="/register" className="nav-link">
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="footer">
        <p>&copy; 2026 EAMCET Mock Test Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};
