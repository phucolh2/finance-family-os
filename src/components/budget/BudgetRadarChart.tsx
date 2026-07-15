import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { BudgetTreeNode } from '../../types/budget';

interface BudgetRadarChartProps {
  rootGroups: BudgetTreeNode[];
}

export const BudgetRadarChart: React.FC<BudgetRadarChartProps> = ({ rootGroups }) => {
  const expenseActual = rootGroups
    .filter(g => g.isActive && g.classification === 'expense')
    .reduce((sum, g) => sum + g.ratioPercent, 0);

  const savingsActual = rootGroups
    .filter(g => g.isActive && g.classification === 'savings')
    .reduce((sum, g) => sum + g.ratioPercent, 0);

  const investmentActual = rootGroups
    .filter(g => g.isActive && g.classification === 'investment')
    .reduce((sum, g) => sum + g.ratioPercent, 0);

  const data = [
    {
      subject: 'Chi phí (Needs)',
      A: Math.round(expenseActual),
      B: 50, // Benchmark
      fullMark: 100,
    },
    {
      subject: 'Tiết kiệm (Savings)',
      A: Math.round(savingsActual),
      B: 20, // Benchmark
      fullMark: 100,
    },
    {
      subject: 'Đầu tư (Wants/Invest)',
      A: Math.round(investmentActual),
      B: 30, // Benchmark
      fullMark: 100,
    }
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="rgba(226, 180, 76, 0.15)" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
        
        {/* Benchmark Area */}
        <Radar 
          name="Chuẩn 50/30/20" 
          dataKey="B" 
          stroke="#9ca3af" 
          fill="#9ca3af" 
          fillOpacity={0.2} 
          strokeDasharray="3 3"
        />
        
        {/* Actual Area */}
        <Radar 
          name="Thực tế của bạn" 
          dataKey="A" 
          stroke="#e2b44c" 
          fill="#e2b44c" 
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
