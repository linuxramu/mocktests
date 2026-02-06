import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import './ChartComponents.css';

interface LineChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface BarChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface RadarChartData {
  subject: string;
  value: number;
  fullMark: number;
}

export const PerformanceLineChart: React.FC<{
  data: LineChartData[];
  dataKey?: string;
}> = ({ data, dataKey = 'value' }) => {
  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke="#1976d2"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const SubjectBarChart: React.FC<{ data: BarChartData[] }> = ({
  data,
}) => {
  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#1976d2" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const SubjectRadarChart: React.FC<{ data: RadarChartData[] }> = ({
  data,
}) => {
  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis angle={90} domain={[0, 100]} />
          <Radar
            name="Performance"
            dataKey="value"
            stroke="#1976d2"
            fill="#1976d2"
            fillOpacity={0.6}
          />
          <Tooltip />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const MultiLineChart: React.FC<{
  data: LineChartData[];
  lines: { dataKey: string; color: string; name: string }[];
}> = ({ data, lines }) => {
  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          {lines.map(line => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.color}
              strokeWidth={2}
              name={line.name}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const StackedBarChart: React.FC<{
  data: BarChartData[];
  bars: { dataKey: string; color: string; name: string }[];
}> = ({ data, bars }) => {
  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          {bars.map(bar => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              fill={bar.color}
              name={bar.name}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
