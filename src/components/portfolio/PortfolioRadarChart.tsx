import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { AssetConfig } from '../../types/portfolio';

interface PortfolioRadarChartProps {
  assets: AssetConfig[];
  chartData: { name: string; value: number; balance: number }[];
}

export const PortfolioRadarChart: React.FC<PortfolioRadarChartProps> = ({ assets, chartData }) => {
  const data = assets.map(asset => {
    // chartData contains items like "Vàng", "Cổ phiếu", etc.
    const actualItem = chartData.find(d => d.name === asset.name);
    const actualEarmarkedItem = chartData.find(d => d.name === `${asset.name} (Chờ pb)`);
    
    // Sum actual invested + earmarked for that asset to compare against target
    const actualTotal = (actualItem?.value || 0) + (actualEarmarkedItem?.value || 0);
    
    return {
      subject: asset.name,
      A: Math.round(actualTotal),
      B: asset.targetAllocationPercent || 0,
      fullMark: 100,
    };
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="rgba(226, 180, 76, 0.15)" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
        
        {/* Target Area */}
        <Radar 
          name="Mục tiêu (%)" 
          dataKey="B" 
          stroke="#9ca3af" 
          fill="#9ca3af" 
          fillOpacity={0.2} 
          strokeDasharray="3 3"
        />
        
        {/* Actual Area */}
        <Radar 
          name="Thực tế (%)" 
          dataKey="A" 
          stroke="#0ea5e9" 
          fill="#0ea5e9" 
          fillOpacity={0.5} 
        />
        
        <Tooltip
          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(226, 180, 76, 0.15)', borderRadius: '8px' }}
          itemStyle={{ fontSize: '12px' }}
        />
        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
      </RadarChart>
    </ResponsiveContainer>
  );
};
