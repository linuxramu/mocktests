import React from 'react';
import './MetricsCards.css';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: string;
  color?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  color = '#1976d2',
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      default:
        return '→';
    }
  };

  const getTrendClass = () => {
    switch (trend) {
      case 'up':
        return 'trend-up';
      case 'down':
        return 'trend-down';
      default:
        return 'trend-neutral';
    }
  };

  return (
    <div className="metric-card" style={{ borderLeftColor: color }}>
      <div className="metric-header">
        <span className="metric-title">{title}</span>
        {icon && <span className="metric-icon">{icon}</span>}
      </div>
      <div className="metric-value" style={{ color }}>
        {value}
      </div>
      {subtitle && <div className="metric-subtitle">{subtitle}</div>}
      {trend && trendValue && (
        <div className={`metric-trend ${getTrendClass()}`}>
          <span className="trend-icon">{getTrendIcon()}</span>
          <span className="trend-value">{trendValue}</span>
        </div>
      )}
    </div>
  );
};

interface MetricsGridProps {
  children: React.ReactNode;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ children }) => {
  return <div className="metrics-grid">{children}</div>;
};

interface KPICardProps {
  label: string;
  value: number;
  maxValue: number;
  unit?: string;
  color?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  maxValue,
  unit = '',
  color = '#1976d2',
}) => {
  const percentage = (value / maxValue) * 100;

  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">
        {value}
        {unit}
      </div>
      <div className="kpi-progress-bar">
        <div
          className="kpi-progress-fill"
          style={{
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <div className="kpi-max">
        Max: {maxValue}
        {unit}
      </div>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  changeLabel,
}) => {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {change !== undefined && (
        <div className={`stat-change ${isPositive ? 'positive' : 'negative'}`}>
          <span className="change-icon">{isPositive ? '▲' : '▼'}</span>
          <span className="change-value">
            {Math.abs(change)}% {changeLabel || 'vs last test'}
          </span>
        </div>
      )}
    </div>
  );
};
