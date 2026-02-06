import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './ProfileManager.css';

export const ProfileManager: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [targetScore, setTargetScore] = useState<number | ''>('');
  const [preferredSubjects, setPreferredSubjects] = useState<string[]>([]);
  const [studyGoals, setStudyGoals] = useState<string[]>([]);
  const [timeZone, setTimeZone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setTargetScore(user.profileData?.targetScore || '');
      setPreferredSubjects(user.profileData?.preferredSubjects || []);
      setStudyGoals(user.profileData?.studyGoals || []);
      setTimeZone(user.profileData?.timeZone || '');
    }
  }, [user]);

  const handleSubjectToggle = (subject: string) => {
    setPreferredSubjects(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || name.length < 2) {
      setError('Name must be at least 2 characters long');
      return;
    }

    setIsLoading(true);
    try {
      await updateProfile({
        name,
        profileData: {
          targetScore: targetScore === '' ? undefined : Number(targetScore),
          preferredSubjects,
          studyGoals,
          timeZone,
        },
      });
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profile update failed');
    } finally {
      setIsLoading(false);
    }
  };

  const subjects = ['Physics', 'Chemistry', 'Mathematics'];

  return (
    <div className="profile-manager">
      <h2>Profile Settings</h2>

      <form onSubmit={handleSubmit} className="profile-form">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="form-section">
          <h3>Basic Information</h3>

          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={user?.email || ''}
              disabled
              className="disabled-input"
            />
            <small className="form-hint">Email cannot be changed</small>
          </div>
        </div>

        <div className="form-section">
          <h3>Study Preferences</h3>

          <div className="form-group">
            <label htmlFor="targetScore">Target Score</label>
            <input
              id="targetScore"
              type="number"
              value={targetScore}
              onChange={e =>
                setTargetScore(
                  e.target.value === '' ? '' : Number(e.target.value)
                )
              }
              placeholder="e.g., 150"
              min="0"
              max="200"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label>Preferred Subjects</label>
            <div className="checkbox-group">
              {subjects.map(subject => (
                <label key={subject} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={preferredSubjects.includes(subject)}
                    onChange={() => handleSubjectToggle(subject)}
                    disabled={isLoading}
                  />
                  {subject}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="timeZone">Time Zone</label>
            <input
              id="timeZone"
              type="text"
              value={timeZone}
              onChange={e => setTimeZone(e.target.value)}
              placeholder="e.g., Asia/Kolkata"
              disabled={isLoading}
            />
          </div>
        </div>

        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};
