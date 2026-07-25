import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { BudgetTreeNode } from '../../types/budget';
import { BUDGET_PILLARS } from '../../constants/pillars';

export interface BudgetDonutChartProps {
  rootGroups: BudgetTreeNode[];
}

export const BudgetDonutChart: React.FC<BudgetDonutChartProps> = ({ rootGroups }) => {
  const data = [
    {
      name: BUDGET_PILLARS.expense.label,
      key: BUDGET_PILLARS.expense.id,
      value: rootGroups
        .filter(g => g.isActive && g.classification === 'expense')
        .reduce((sum, g) => sum + g.ratioPercent, 0),
    },
    {
      name: BUDGET_PILLARS.savings.label,
      key: BUDGET_PILLARS.savings.id,
      value: rootGroups
        .filter(g => g.isActive && g.classification === 'savings')
        .reduce((sum, g) => sum + g.ratioPercent, 0),
    },
    {
      name: BUDGET_PILLARS.investment.label,
      key: BUDGET_PILLARS.investment.id,
      value: rootGroups
        .filter(g => g.isActive && g.classification === 'investment')
        .reduce((sum, g) => sum + g.ratioPercent, 0),
    },
    {
      name: BUDGET_PILLARS.debt_reserve.label,
      key: BUDGET_PILLARS.debt_reserve.id,
      value: rootGroups
        .filter(g => g.isActive && (g.classification === 'debt_reserve' || !g.classification))
        .reduce((sum, g) => sum + g.ratioPercent, 0),
    }
  ].filter(item => item.value > 0);

  const getFillColor = (key: string) => {
    if (key === BUDGET_PILLARS.expense.id) return BUDGET_PILLARS.expense.colorHex;
    if (key === BUDGET_PILLARS.savings.id) return BUDGET_PILLARS.savings.colorHex;
    if (key === BUDGET_PILLARS.investment.id) return BUDGET_PILLARS.investment.colorHex;
    if (key === BUDGET_PILLARS.debt_reserve.id) return BUDGET_PILLARS.debt_reserve.colorHex;
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
            <Cell key={`cell-${index}`} fill={getFillColor(entry.key)} />
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
