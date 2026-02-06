import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  it('should render the main heading', () => {
    render(<App />);
    expect(screen.getByText('EAMCET Mock Test Platform')).toBeDefined();
  });

  it('should render the home page content', () => {
    render(<App />);
    expect(
      screen.getByText('Prepare for EAMCET with AI-Powered Mock Tests')
    ).toBeDefined();
  });
});
