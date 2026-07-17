import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChevronLeft } from 'lucide-react';
import type { BudgetRatioScheduleItem } from '../../types/budget';
import type { ResolvedMonthlyDbItem } from '../../types/finance';

interface BudgetHistoryTrendChartProps {
  schedule: BudgetRatioScheduleItem[];
  resolvedMonthlyDb: ResolvedMonthlyDbItem[];
}

export const BudgetHistoryTrendChart: React.FC<BudgetHistoryTrendChartProps> = ({ schedule, resolvedMonthlyDb }) => {
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);

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

  // Pre-define colors
  const knownColors: Record<string, string> = {
    housing_basic: '#d97706',
    future_investing: '#4d7c0f',
    safety_reserve: '#0f766e',
    family_experience: '#8b5cf6',
    health_growth: '#2563eb'
  };
  const fallbackColors = [
    '#e11d48', // rose
    '#d97706', // amber
    '#65a30d', // lime
    '#059669', // emerald
    '#0891b2', // cyan
    '#2563eb', // blue
    '#7c3aed', // violet
    '#c026d3', // fuchsia
    '#fb7185', // rose-400
    '#fbbf24', // amber-400
    '#34d399', // emerald-400
    '#38bdf8', // light blue
  ];

  const activeSeriesNames = new Set<string>();

  // Map over resolvedMonthlyDb to plot time-series.
  // We sample every 12 months (January) plus the very first and last month to prevent too many points.
  const data = resolvedMonthlyDb.filter((item, index) => {
    return index === 0 || item.month === 1 || index === resolvedMonthlyDb.length - 1;
  }).map((dbItem) => {
    const key = `${dbItem.month}/${dbItem.year}`;
    const income = dbItem.income;
    const dataRow: any = { version: key };

    // Find the applicable schedule version
    const dbTime = dbItem.year * 12 + dbItem.month;
    let activeVersion = sorted[0];
    for (const v of sorted) {
      if ((v.effectiveYear * 12 + v.effectiveMonth) <= dbTime) {
        activeVersion = v;
      }
    }

    if (!activeVersion) return dataRow;

    if (selectedGroupKey) {
      // Drill-down mode
      const parentGroup = activeVersion.rootGroups?.find(g => (g.groupId || g.id) === selectedGroupKey);
      if (parentGroup?.children) {
        parentGroup.children.forEach(child => {
          if (!child.isActive) return;
          const val = child.ratioPercent;
          const dispName = child.name;
          activeSeriesNames.add(dispName);
          dataRow[dispName] = (dataRow[dispName] || 0) + Math.round((income * val / 100) * 10) / 10;
        });
      }
    } else {
      // Top-level mode
      if (activeVersion.rootGroups && activeVersion.rootGroups.length > 0) {
        activeVersion.rootGroups.forEach((group) => {
          if (!group.isActive) return;
          const stableKey = group.groupId || group.id;
          const dispName = groupDisplayNames[stableKey] || group.name;
          activeSeriesNames.add(dispName);
          dataRow[dispName] = (dataRow[dispName] || 0) + Math.round((income * group.ratioPercent / 100) * 10) / 10;
        });
      } else if (activeVersion.ratios && activeVersion.ratios.length > 0) {
        activeVersion.ratios.forEach((ratio) => {
          if (!ratio.isActive) return;
          const dispName = groupDisplayNames[ratio.group] || ratio.categoryName || ratio.group;
          activeSeriesNames.add(dispName);
          dataRow[dispName] = (dataRow[dispName] || 0) + Math.round((income * ratio.ratioPercent / 100) * 10) / 10;
        });
      }
    }

    return dataRow;
  });

  const seriesArray = Array.from(activeSeriesNames);

  const handleLegendClick = (e: any) => {
    if (selectedGroupKey) return; // if already drilled down, don't drill down further
    const clickedName = e.dataKey;
    const originalKeyEntry = Object.entries(groupDisplayNames).find(([_, val]) => val === clickedName);
    if (originalKeyEntry) {
      setSelectedGroupKey(originalKeyEntry[0]);
    }
  };

  return (
    <div className="w-full h-full min-h-[250px] relative">
      {selectedGroupKey && (
        <>
          <button
            onClick={() => { setSelectedGroupKey(null); }}
            className="absolute top-0 left-2 z-10 flex items-center gap-1 bg-family-bgDark/40 hover:bg-family-primary text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all"
          >
            <ChevronLeft className="w-3 h-3" />
            Về tổng quan
          </button>
          <div className="absolute top-0 right-2 z-10 bg-family-accent/10 border border-family-accent/20 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-family-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-family-accent"></span>
            </span>
            <span className="text-[10px] font-bold text-family-text">
              Chế độ xem chi tiết: <span className="text-family-accent">{groupDisplayNames[selectedGroupKey]}</span>
            </span>
          </div>
        </>
      )}
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 35, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 180, 76, 0.05)" />
            <XAxis dataKey="version" stroke="#6b7280" fontSize={11} tickMargin={10} />
            <YAxis stroke="#6b7280" fontSize={11} unit=" tr" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(226, 180, 76, 0.15)', borderRadius: '12px' }}
              itemStyle={{ color: '#f8fafc', fontSize: 11 }}
              labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: 11 }}
              formatter={(value: any) => [`${value} tr`, '']}
            />
            <Legend 
              wrapperStyle={{ fontSize: 11, cursor: selectedGroupKey ? 'default' : 'pointer' }}
              onClick={handleLegendClick}
            />
            {seriesArray.map((name, index) => {
              const originalKeyEntry = Object.entries(groupDisplayNames).find(([_, val]) => val === name);
              const originalKey = originalKeyEntry ? originalKeyEntry[0] : name;
              const lineColor = !selectedGroupKey && knownColors[originalKey] 
                ? knownColors[originalKey] 
                : fallbackColors[index % fallbackColors.length];

              return (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={lineColor}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: lineColor, strokeWidth: 1.5, stroke: '#1e293b' }}
                  activeDot={{ r: 6 }}
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
