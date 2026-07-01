import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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

  const data = sorted.map((version) => {
    const key = `Tháng ${version.effectiveMonth}/${version.effectiveYear}`;
    
    // Find the real resolved income at this specific milestone month
    const dbItem = resolvedMonthlyDb?.find(
      (item) => item.year === version.effectiveYear && item.month === version.effectiveMonth
    );
    const income = dbItem ? dbItem.income : 80;

    let housing = 0;
    let future = 0;
    let safety = 0;
    let experience = 0;
    let health = 0;

    if (version.rootGroups && version.rootGroups.length > 0) {
      version.rootGroups.forEach((group) => {
        const isGroupActive = group.isActive !== false;
        const val = isGroupActive ? group.ratioPercent : 0;
        
        if (group.groupId === 'housing_basic') housing = val;
        else if (group.groupId === 'future_investing') future = val;
        else if (group.groupId === 'safety_reserve') safety = val;
        else if (group.groupId === 'family_experience') experience = val;
        else if (group.groupId === 'health_growth') health = val;
      });
    } else if (version.ratios && version.ratios.length > 0) {
      version.ratios.forEach((ratio) => {
        const isRatioActive = ratio.isActive !== false;
        const val = isRatioActive ? ratio.ratioPercent : 0;
        
        if (ratio.group === 'housing_basic') housing = val;
        else if (ratio.group === 'future_investing') future = val;
        else if (ratio.group === 'safety_reserve') safety = val;
        else if (ratio.group === 'family_experience') experience = val;
        else if (ratio.group === 'health_growth') health = val;
      });
    }

    // Convert percentages to absolute money amounts based on the real milestone income
    return {
      version: key,
      'Nhà cửa & sinh hoạt': Math.round((income * housing / 100) * 10) / 10,
      'Tương lai & đầu tư': Math.round((income * future / 100) * 10) / 10,
      'Bình an & dự phòng': Math.round((income * safety / 100) * 10) / 10,
      'Yêu thương & sự kiện': Math.round((income * experience / 100) * 10) / 10,
      'Sức khỏe & phát triển': Math.round((income * health / 100) * 10) / 10,
    };
  });

  return (
    <div className="w-full h-full min-h-[250px]">
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(var(--color-accent-rgb), 0.05)" />
            <XAxis dataKey="version" stroke="#6b7280" fontSize={11} />
            <YAxis stroke="#6b7280" fontSize={11} unit=" tr" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(226, 180, 76, 0.15)', borderRadius: '12px' }}
              itemStyle={{ color: '#f8fafc', fontSize: 11 }}
              labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: 11 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Nhà cửa & sinh hoạt" fill="#d97706" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Tương lai & đầu tư" fill="#4d7c0f" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Bình an & dự phòng" fill="#0f766e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Yêu thương & sự kiện" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Sức khỏe & phát triển" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
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
