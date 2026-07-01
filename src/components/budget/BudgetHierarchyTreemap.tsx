import React from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { formatTableMoneyVNDMillion } from '../../utils/format';
import type { BudgetMainGroupId } from '../../types/budget';

interface BudgetHierarchyTreemapProps {
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

// Custom Treemap Content Renderer
const CustomizedContent: React.FC<any> = (props) => {
  const { x, y, width, height, name, ratioPercent, amount, groupId } = props;

  if (width < 40 || height < 25) return null;

  const color = getGroupColor(groupId);

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: color,
          stroke: '#1e293b',
          strokeWidth: 1.5,
          strokeOpacity: 0.25,
          fillOpacity: 0.85,
        }}
      />
      {width > 80 && height > 45 ? (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#f8fafc"
          fontSize={11}
          fontWeight="bold"
          className="font-sans"
        >
          <tspan x={x + width / 2} dy="-0.45em" className="truncate">{name}</tspan>
          <tspan x={x + width / 2} dy="1.2em" fontSize={10} fill="#f1f5f9" fontWeight="normal">
            {ratioPercent}% | {formatTableMoneyVNDMillion(amount)}
          </tspan>
        </text>
      ) : (
        <text
          x={x + 4}
          y={y + 14}
          fill="#f8fafc"
          fontSize={9}
          fontWeight="bold"
          className="font-sans"
        >
          <tspan x={x + 4} dy="0">{name.slice(0, 8)}..</tspan>
          <tspan x={x + 4} dy="1.2em">{ratioPercent}%</tspan>
        </text>
      )}
    </g>
  );
};

export const BudgetHierarchyTreemap: React.FC<BudgetHierarchyTreemapProps> = ({ rootGroups, income }) => {
  // Transform rootGroups tree into flat leaf nodes with actual calculated amounts
  const treemapData = rootGroups.flatMap((group) => {
    const isGroupActive = group.isActive !== false;
    if (!isGroupActive) return [];

    const activeChildren = group.children ? group.children.filter((c: any) => c.isActive !== false) : [];

    if (activeChildren.length === 0) {
      return [{
        name: group.name,
        value: group.ratioPercent,
        ratioPercent: group.ratioPercent,
        amount: (income * group.ratioPercent) / 100,
        groupId: group.groupId,
      }];
    }

    return activeChildren.map((child: any) => ({
      name: child.name,
      value: child.ratioPercent,
      ratioPercent: child.ratioPercent,
      amount: (income * child.ratioPercent) / 100,
      groupId: group.groupId,
    }));
  });

  return (
    <div className="w-full h-full min-h-[250px] relative">
      {treemapData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={treemapData}
            dataKey="value"
            stroke="#fff"
            fill="#8884d8"
            content={<CustomizedContent />}
          >
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-family-bgDark border border-family-accent/15 px-3 py-2 rounded-xl shadow-lg text-xs font-sans">
                      <p className="font-bold text-family-text">{data.name}</p>
                      <p className="text-family-accent mt-0.5 font-semibold">Tỷ trọng: {data.value}%</p>
                      <p className="text-family-textMuted mt-0.5">Số tiền: {formatTableMoneyVNDMillion(data.amount)}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </Treemap>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full">
          <span className="text-xs text-family-textMuted font-bold">Chưa có dữ liệu phân bổ</span>
        </div>
      )}
    </div>
  );
};
