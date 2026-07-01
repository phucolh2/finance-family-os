import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { BudgetRatioScheduleItem } from '../../types/budget';

interface BudgetVersionCompareChartProps {
  schedule: BudgetRatioScheduleItem[];
}

export const BudgetVersionCompareChart: React.FC<BudgetVersionCompareChartProps> = ({ schedule }) => {
  // 1. Sort schedule by effective date
  const sorted = [...schedule].sort((a, b) => {
    if (a.effectiveYear !== b.effectiveYear) {
      return a.effectiveYear - b.effectiveYear;
    }
    return a.effectiveMonth - b.effectiveMonth;
  });

  // 2. Map versions into Recharts data
  const data = sorted.map((version) => {
    const key = `Tháng ${version.effectiveMonth}/${version.effectiveYear}`;
    
    // Group ratio aggregations
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
      // Fallback to legacy flat ratios
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

    return {
      version: key,
      'Nhà cửa & sinh hoạt': housing,
      'Tương lai & đầu tư': future,
      'Bình an & dự phòng': safety,
      'Yêu thương & sự kiện': experience,
      'Sức khỏe & phát triển': health,
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
            <YAxis stroke="#6b7280" fontSize={11} unit="%" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(226, 180, 76, 0.15)', borderRadius: '12px' }}
              itemStyle={{ color: '#f8fafc', fontSize: 11 }}
              labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: 11 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Nhà cửa & sinh hoạt" stackId="a" fill="#d97706" />
            <Bar dataKey="Tương lai & đầu tư" stackId="a" fill="#4d7c0f" />
            <Bar dataKey="Bình an & dự phòng" stackId="a" fill="#0f766e" />
            <Bar dataKey="Yêu thương & sự kiện" stackId="a" fill="#8b5cf6" />
            <Bar dataKey="Sức khỏe & phát triển" stackId="a" fill="#2563eb" />
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
