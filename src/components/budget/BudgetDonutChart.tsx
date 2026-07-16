import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { BudgetTreeNode } from '../../types/budget';

interface BudgetDonutChartProps {
  rootGroups: BudgetTreeNode[];
}

const COLORS = ['#f87171', '#10b981', '#3b82f6']; // Red (Expense), Green (Savings), Blue (Investment)

export const BudgetDonutChart: React.FC<BudgetDonutChartProps> = ({ rootGroups }) => {
  const data = [
    {
      name: 'Chi phí (Expense)',
      value: rootGroups
        .filter(g => g.isActive && g.classification === 'expense')
        .reduce((sum, g) => sum + g.ratioPercent, 0),
    },
    {
      name: 'Tiết kiệm (Savings)',
      value: rootGroups
        .filter(g => g.isActive && g.classification === 'savings')
        .reduce((sum, g) => sum + g.ratioPercent, 0),
    },
    {
      name: 'Đầu tư (Investment)',
      value: rootGroups
        .filter(g => g.isActive && g.classification === 'investment')
        .reduce((sum, g) => sum + g.ratioPercent, 0),
    }
  ].filter(item => item.value > 0);

  // Remap colors based on actual names if some are missing
  const getFillColor = (name: string) => {
    if (name.includes('Chi phí')) return '#f87171';
    if (name.includes('Tiết kiệm')) return '#10b981';
    if (name.includes('Đầu tư')) return '#3b82f6';
    return '#9ca3af';
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
          stroke="rgba(0,0,0,0)"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getFillColor(entry.name)} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Tỷ trọng']}
          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(226, 180, 76, 0.15)', borderRadius: '8px' }}
          itemStyle={{ color: '#e2b44c', fontWeight: 'bold' }}
        />
        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
      </PieChart>
    </ResponsiveContainer>
  );
};
