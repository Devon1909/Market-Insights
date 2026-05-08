import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { SnowflakeData } from '../types.ts';

interface SnowflakeChartProps {
  data: SnowflakeData;
  size?: number;
  showLabels?: boolean;
}

export const SnowflakeChart: React.FC<SnowflakeChartProps> = ({ data, size = 150, showLabels = false }) => {
  const chartData = [
    { subject: 'Value', A: data.value, fullMark: 20 },
    { subject: 'Future', A: data.future, fullMark: 20 },
    { subject: 'Past', A: data.past, fullMark: 20 },
    { subject: 'Health', A: data.health, fullMark: 20 },
    { subject: 'Dividend', A: data.dividend, fullMark: 20 },
  ];

  return (
    <div style={{ width: '100%', height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart 
          cx="50%" 
          cy="50%" 
          outerRadius={size * 0.35} 
          data={chartData}
          margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
        >
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={showLabels ? { fontSize: 10, fill: '#64748b' } : false} 
          />
          <Radar
            name="Snowflake"
            dataKey="A"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
