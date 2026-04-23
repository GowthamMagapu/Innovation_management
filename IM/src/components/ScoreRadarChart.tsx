import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface ScoreRadarChartProps {
  breakdown: {
    marketDemand: number;
    competition: number;
    feasibility: number;
    revenue: number;
    innovation: number;
  };
  color?: string;
  height?: number | string;
}

export function ScoreRadarChart({ breakdown, color = "#34d399", height = 200 }: ScoreRadarChartProps) {
  const data = [
    { subject: 'Market', score: breakdown.marketDemand, fullMark: 20 },
    { subject: 'Competition', score: breakdown.competition, fullMark: 20 },
    { subject: 'Feasibility', score: breakdown.feasibility, fullMark: 20 },
    { subject: 'Revenue', score: breakdown.revenue, fullMark: 20 },
    { subject: 'Innovation', score: breakdown.innovation, fullMark: 20 },
  ];

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
          <PolarGrid stroke="#27272a" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'Inter', fontWeight: 500 }} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#f4f4f5', fontSize: '12px', borderRadius: '0.5rem', fontFamily: 'Inter' }}
            itemStyle={{ color: color }}
          />
          <Radar name="Score" dataKey="score" stroke={color} strokeWidth={2} fill={color} fillOpacity={0.3} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
