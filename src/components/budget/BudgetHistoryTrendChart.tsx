import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { BudgetRatioScheduleItem } from '../../types/budget';
import type { ResolvedMonthlyDbItem } from '../../types/finance';

interface BudgetHistoryTrendChartProps {
  schedule: BudgetRatioScheduleItem[];
  resolvedMonthlyDb: ResolvedMonthlyDbItem[];
}

export const BudgetHistoryTrendChart: React.FC<BudgetHistoryTrendChartProps> = ({ schedule, resolvedMonthlyDb }) => {
  // Sort schedule by effective date
  const sorted = [...schedule].sort((a, b) => {
    if (a.effectiveYear !== b.effectiveYear) {
      return a.effectiveYear - b.effectiveYear;
    }
    return a.effectiveMonth - b.effectiveMonth;
  });

  // Collect display names and build unique group mapping from the latest schedule
  const latestSchedule = sorted.length > 0 ? sorted[sorted.length - 1] : null;
  const groupDisplayNames: Record<string, string> = {
    housing_basic: 'Nhà cửa & sinh hoạt',
    future_investing: 'Tương lai & đầu tư',
    safety_reserve: 'Bình an & dự phòng',
    family_experience: 'Yêu thương & sự kiện',
    health_growth: 'Sức khỏe & phát triển'
  };

  if (latestSchedule?.rootGroups && latestSchedule.rootGroups.length > 0) {
    latestSchedule.rootGroups.forEach(group => {
      const stableKey = group.groupId || group.id;
      groupDisplayNames[stableKey] = group.name;
    });
  }

  // Pre-define colors for legacy/known groups, and a fallback palette for custom groups
  const knownColors: Record<string, string> = {
    housing_basic: '#d97706',
    future_investing: '#4d7c0f',
    safety_reserve: '#0f766e',
    family_experience: '#8b5cf6',
    health_growth: '#2563eb'
  };
  const fallbackColors = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#6366f1', '#3b82f6', '#0ea5e9'];

  const activeSeriesNames = new Set<string>();

  const data = sorted.map((version) => {
    const key = `Tháng ${version.effectiveMonth}/${version.effectiveYear}`;

    // Find the real resolved income at this specific milestone month
    const dbItem = resolvedMonthlyDb?.find(
      (item) => item.year === version.effectiveYear && item.month === version.effectiveMonth
    );
    const income = dbItem ? dbItem.income : 80;

    const dataRow: any = { version: key };

    if (version.rootGroups && version.rootGroups.length > 0) {
      version.rootGroups.forEach((group) => {
        const isGroupActive = group.isActive !== false;
        const val = isGroupActive ? group.ratioPercent : 0;
        const stableKey = group.groupId || group.id;
        const dispName = groupDisplayNames[stableKey] || group.name;
        activeSeriesNames.add(dispName);

        // item.ratioPercent is absolute % of income — compute absolute amount
        dataRow[dispName] = (dataRow[dispName] || 0) + Math.round((income * val / 100) * 10) / 10;
      });
    } else if (version.ratios && version.ratios.length > 0) {
      // Legacy flat ratios
      version.ratios.forEach((ratio) => {
        const isRatioActive = ratio.isActive !== false;
        const val = isRatioActive ? ratio.ratioPercent : 0;
        const dispName = groupDisplayNames[ratio.group] || ratio.categoryName || ratio.group;
        activeSeriesNames.add(dispName);
        dataRow[dispName] = (dataRow[dispName] || 0) + Math.round((income * val / 100) * 10) / 10;
      });
    }

    return dataRow;
  });

  // Extract unique series names in order
  const seriesArray = Array.from(activeSeriesNames);

  return (
    <div className="w-full h-full min-h-[250px]">
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 180, 76, 0.05)" />
            <XAxis dataKey="version" stroke="#6b7280" fontSize={11} />
            <YAxis stroke="#6b7280" fontSize={11} unit=" tr" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(226, 180, 76, 0.15)', borderRadius: '12px' }}
              itemStyle={{ color: '#f8fafc', fontSize: 11 }}
              labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: 11 }}
              formatter={(value: number) => [`${value} tr`, '']}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {seriesArray.map((name, index) => {
              // Try to find the original group key by matching display name
              const originalKeyEntry = Object.entries(groupDisplayNames).find(([_, val]) => val === name);
              const originalKey = originalKeyEntry ? originalKeyEntry[0] : '';
              const lineColor = knownColors[originalKey] || fallbackColors[index % fallbackColors.length];

              return (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={lineColor}
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: lineColor, strokeWidth: 2, stroke: '#1e293b' }}
                  activeDot={{ r: 7 }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full">
          <span className="text-xs text-family-textMuted font-bold">Chưa có dữ liệu lịch sử</span>
        </div>
      )}
    </div>
  );
};
export default BudgetHistoryTrendChart;
