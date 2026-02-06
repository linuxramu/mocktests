import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricCard, MetricsGrid, KPICard, StatCard } from './MetricsCards';

describe('MetricsCards', () => {
  describe('MetricCard', () => {
    it('renders metric card with basic props', () => {
      render(<MetricCard title="Test Metric" value="100" />);

      expect(screen.getByText('Test Metric')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('renders metric card with subtitle', () => {
      render(<MetricCard title="Score" value="85" subtitle="Out of 100" />);

      expect(screen.getByText('Score')).toBeInTheDocument();
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('Out of 100')).toBeInTheDocument();
    });

    it('renders metric card with trend', () => {
      render(
        <MetricCard title="Accuracy" value="75%" trend="up" trendValue="+5%" />
      );

      expect(screen.getByText('Accuracy')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('+5%')).toBeInTheDocument();
    });

    it('renders metric card with icon', () => {
      render(<MetricCard title="Tests" value="10" icon="📊" />);

      expect(screen.getByText('Tests')).toBeInTheDocument();
      expect(screen.getByText('📊')).toBeInTheDocument();
    });
  });

  describe('MetricsGrid', () => {
    it('renders children in grid layout', () => {
      render(
        <MetricsGrid>
          <MetricCard title="Metric 1" value="100" />
          <MetricCard title="Metric 2" value="200" />
        </MetricsGrid>
      );

      expect(screen.getByText('Metric 1')).toBeInTheDocument();
      expect(screen.getByText('Metric 2')).toBeInTheDocument();
    });
  });

  describe('KPICard', () => {
    it('renders KPI card with progress bar', () => {
      render(<KPICard label="Score" value={75} maxValue={100} unit="%" />);

      expect(screen.getByText('Score')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('Max: 100%')).toBeInTheDocument();
    });

    it('calculates progress percentage correctly', () => {
      const { container } = render(
        <KPICard label="Progress" value={50} maxValue={100} />
      );

      const progressFill = container.querySelector('.kpi-progress-fill');
      expect(progressFill).toHaveStyle({ width: '50%' });
    });
  });

  describe('StatCard', () => {
    it('renders stat card with basic props', () => {
      render(<StatCard label="Total Tests" value="15" />);

      expect(screen.getByText('Total Tests')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('renders stat card with positive change', () => {
      render(<StatCard label="Accuracy" value="80%" change={10} />);

      expect(screen.getByText('Accuracy')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();
      expect(screen.getByText(/10%/)).toBeInTheDocument();
    });

    it('renders stat card with negative change', () => {
      render(<StatCard label="Time" value="90s" change={-5} />);

      expect(screen.getByText('Time')).toBeInTheDocument();
      expect(screen.getByText('90s')).toBeInTheDocument();
      expect(screen.getByText(/5%/)).toBeInTheDocument();
    });
  });
});
