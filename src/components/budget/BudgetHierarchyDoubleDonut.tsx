import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatTableMoneyVNDMillion } from '../../utils/format';
import type { BudgetMainGroupId } from '../../types/budget';

interface BudgetHierarchyDoubleDonutProps {
  rootGroups: any[];
  income: number;
}

const getGroupColor = (groupId: BudgetMainGroupId): string => {
  switch (groupId) {
    case 'housing_basic': return '#d97706'; // Amber
    case 'future_investing': return '#4d7c0f'; // Green
    case 'safety_reserve': return '#0f766e'; // Teal
    case 'family_experience': return '#8b5cf6'; // Purple
    case 'health_growth': return '#2563eb'; // Blue
    default: return '#6b7280';
  }
};

const getChildColor = (groupId: BudgetMainGroupId, index: number): string => {
  const shades: Record<string, string[]> = {
    housing_basic: ['#f59e0b', '#fbbf24', '#fcd34d', '#fef3c7', '#b45309'],
    future_investing: ['#65a30d', '#84cc16', '#a3e635', '#ecfccb', '#3f6212'],
    safety_reserve: ['#14b8a6', '#2dd4bf', '#5eead4', '#ccfbf1', '#0d9488'],
    family_experience: ['#a78bfa', '#c4b5fd', '#ddd6fe', '#f5f3ff', '#7c3aed'],
    health_growth: ['#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe', '#1d4ed8'],
  };
  const list = shades[groupId] || ['#9ca3af'];
  return list[index % list.length];
};

export const BudgetHierarchyDoubleDonut: React.FC<BudgetHierarchyDoubleDonutProps> = ({ rootGroups, income }) => {
  // 1. Inner Ring Data (5 Main Groups)
  const innerData = rootGroups.flatMap((group) => {
    if (group.isActive === false) return [];
    return [{
      name: group.name,
      value: group.ratioPercent,
      groupId: group.groupId,
      amount: (income * group.ratioPercent) / 100,
    }];
  });

  // 2. Outer Ring Data (Sub-items)
  const outerData = rootGroups.flatMap((group) => {
    if (group.isActive === false) return [];
    const activeChildren = group.children ? group.children.filter((c: any) => c.isActive !== false) : [];
    
    if (activeChildren.length === 0) {
      // Align Outer Ring slice with Inner Ring if no child categories exist
      return [{
        name: group.name,
        value: group.ratioPercent,
        groupId: group.groupId,
        amount: (income * group.ratioPercent) / 100,
        isParentFallback: true,
      }];
    }
    
    return activeChildren.map((child: any, index: number) => ({
      name: child.name,
      value: child.ratioPercent,
      groupId: group.groupId,
      amount: (income * child.ratioPercent) / 100,
      index,
    }));
  });

  const hasData = innerData.length > 0;

  return (
    <div className="w-full h-full min-h-[260px] relative flex items-center justify-center">
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-family-bgDark border border-family-accent/15 px-3.5 py-2.5 rounded-2xl shadow-xl text-xs font-sans">
                      <p className="font-bold text-family-text">{data.name}</p>
                      <p className="text-family-accent mt-1 font-extrabold">Tỷ trọng: {data.value}%</p>
                      <p className="text-family-textMuted mt-0.5 font-semibold">
                        Số tiền: {formatTableMoneyVNDMillion(data.amount)} / tháng
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Inner Ring: Main Groups */}
            <Pie
              data={innerData}
              dataKey="value"
              cx="50%"
              cy="50%"
              outerRadius={55}
              fill="#8884d8"
            >
              {innerData.map((entry, index) => (
                <Cell key={`cell-inner-${index}`} fill={getGroupColor(entry.groupId)} />
              ))}
            </Pie>

            {/* Outer Ring: Sub-items */}
            <Pie
              data={outerData}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={85}
              fill="#82ca9d"
              label={false}
              labelLine={false}
            >
              {outerData.map((entry, index) => {
                const color = entry.isParentFallback
                  ? getGroupColor(entry.groupId)
                  : getChildColor(entry.groupId, entry.index || 0);
                return <Cell key={`cell-outer-${index}`} fill={color} />;
              })}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-xs text-family-textMuted font-bold">Chưa có dữ liệu cấu trúc</div>
      )}
    </div>
  );
};
