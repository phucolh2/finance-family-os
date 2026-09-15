import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { analyzeExpense } from '../../engines/expenseEngine';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { HelpTooltip } from '../ui/HelpTooltip';
import { formatTableMoneyVNDMillion } from '../../utils/format';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, Bar, XAxis, YAxis, CartesianGrid, ComposedChart, Area, ReferenceLine, Scatter } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import type { BudgetGroup } from '../../types/budget';

const CustomExpenseTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const totalActual = data.actual;
    const budget = data.budget;
    const diff = budget - totalActual;
    const isOverBudget = diff < 0;

    return (
      <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl min-w-[220px]">
        <p className="font-bold text-gray-800 mb-2 border-b pb-1">{label}</p>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Ngân sách hạn mức:</span>
            <span className="font-semibold text-orange-500">{formatTableMoneyVNDMillion(budget)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Chi thường xuyên:</span>
            <span className="font-semibold text-sky-500">{formatTableMoneyVNDMillion(data.regularActual)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-500">Chi linh hoạt:</span>
            <span className="font-semibold text-rose-500">{formatTableMoneyVNDMillion(data.flexibleActual)}</span>
          </div>
          <div className="flex justify-between gap-4 pt-1.5 border-t border-dashed mt-1">
            <span className="text-gray-700 font-medium">Tổng chi thực tế:</span>
            <span className="font-bold text-gray-800">{formatTableMoneyVNDMillion(totalActual)}</span>
          </div>
          <div className={`flex justify-between gap-4 mt-2 pt-1 font-bold ${isOverBudget ? 'text-red-500' : 'text-emerald-500'}`}>
            <span>{isOverBudget ? 'Vượt ngân sách:' : 'Tiết kiệm được:'}</span>
            <span>{isOverBudget ? '-' : '+'}{formatTableMoneyVNDMillion(Math.abs(diff))}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export interface ExpenseDashboardProps {
  filter: BudgetGroup | 'all';
  setFilter: (f: BudgetGroup | 'all') => void;
}

export const ExpenseDashboard: React.FC<ExpenseDashboardProps> = ({ filter, setFilter }) => {
  const [] = useState<Record<string, boolean>>({});

  /* const toggleExpand = (id: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }; */
  const { state, selectedPeriodKey } = useAppContext();

  const activeBudget = useMemo(() => {
    let budget = state.budgetSchedule.length > 0 ? state.budgetSchedule[state.budgetSchedule.length - 1] : null;
    if (selectedPeriodKey && state.budgetSchedule.length > 0) {
      const [y, m] = selectedPeriodKey.split('-').map(Number);
      const pastOrActive = state.budgetSchedule.filter(b => b.effectiveYear < y || (b.effectiveYear === y && b.effectiveMonth <= m));
      if (pastOrActive.length > 0) {
        pastOrActive.sort((a,b) => (a.effectiveYear * 12 + a.effectiveMonth) - (b.effectiveYear * 12 + b.effectiveMonth));
        budget = pastOrActive[pastOrActive.length - 1];
      }
    }
    return budget;
  }, [state.budgetSchedule, selectedPeriodKey]);

  const FILTER_GROUPS = useMemo(() => {
    const budgetTree = activeBudget ? activeBudget.rootGroups : [];
    const expenseTree = budgetTree.filter(g => g.classification === 'expense');
    
    const groups: { value: BudgetGroup | 'all'; label: string }[] = [{ value: 'all', label: 'Tất cả' }];
    expenseTree.forEach(g => {
      groups.push({ value: g.groupId, label: `TỔNG ${g.name}` });
    });
    return groups;
  }, [activeBudget]);

  const expenseGroupIds = useMemo(() => {
    return FILTER_GROUPS.filter(f => f.value !== 'all').map(f => f.value);
  }, [FILTER_GROUPS]);

  const expenseData = useMemo(() => {
    return analyzeExpense(
      state.resolvedMonthlyDb || [], 
      state.lifeEvents, 
      selectedPeriodKey, 
      expenseGroupIds,
      state.sinkingFunds || [],
      activeBudget
    );
  }, [state.resolvedMonthlyDb, state.lifeEvents, selectedPeriodKey, expenseGroupIds, state.sinkingFunds, activeBudget]);

  const currentSummary = expenseData.summaryByGroup[filter] || { totalBudget: 0, totalActual: 0, totalRegularActual: 0 };
  const currentSeries = expenseData.monthlySeries[filter] || [];

  const percentageSpent = currentSummary.totalBudget > 0 
    ? (currentSummary.totalRegularActual / currentSummary.totalBudget) * 100 
    : 0;

  const pieData = [
    { name: 'Đã chi tiêu', value: currentSummary.totalRegularActual },
    { name: 'Còn lại', value: Math.max(0, currentSummary.totalBudget - currentSummary.totalRegularActual) },
  ];

  const pieColors = ['#3b82f6', '#f97316']; // Blue for actual, Orange for remaining budget
  
  const currentSeriesWithRemaining = currentSeries.map(s => ({
    ...s,
    remaining: Math.max(0, s.budget - s.actual)
  }));

  const remainingTotal = Math.max(0, currentSummary.totalBudget - currentSummary.totalRegularActual);

  // A nice color palette for the breakdown bars
  /* const BREAKDOWN_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']; */

  const averageActual = useMemo(() => {
    if (currentSeriesWithRemaining.length === 0) return 0;
    const sum = currentSeriesWithRemaining.reduce((acc, curr) => acc + curr.actual, 0);
    return sum / currentSeriesWithRemaining.length;
  }, [currentSeriesWithRemaining]);

  // Map to add overBudget markers for Scatter
  const seriesWithAlerts = currentSeriesWithRemaining.map(s => ({
    ...s,
    overBudgetAlert: s.actual > s.budget ? s.actual : null
  }));

  return (
    <div className="space-y-6 mb-8">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTER_GROUPS.map(f => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === f.value 
                ? 'bg-family-accent text-family-bgDeep shadow-sm' 
                : 'bg-white/50 text-family-textMuted hover:text-family-text hover:bg-family-accent/10 border border-family-accent/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Summary Sparkline-like Cards */}
        <Card className="bg-white/80 border-family-accent/10 md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-family-textMuted uppercase flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                Ngân sách vs Thực tế (Cộng dồn)
                <HelpTooltip text="Theo dõi tỷ lệ sử dụng ngân sách so với hạn mức đã phân bổ trong thời gian quan sát." />
              </span>
              <PieChartIcon className="w-4 h-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-end">
                <span className="text-xs text-family-textMuted">Ngân sách phân bổ:</span>
                <span className="font-bold text-orange-500">{formatTableMoneyVNDMillion(currentSummary.totalBudget)}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-xs text-family-textMuted">Thực tế chi tiêu thường xuyên:</span>
                <span className="font-bold text-blue-500">{formatTableMoneyVNDMillion(currentSummary.totalRegularActual)}</span>
              </div>
              <div className="flex justify-between items-end border-t border-dashed pt-1 mt-1">
                <span className="text-xs font-semibold text-family-textMuted">Số tiền chi tiêu còn lại:</span>
                <span className="font-bold text-gray-400">{formatTableMoneyVNDMillion(remainingTotal)}</span>
              </div>
              
              <div className="mt-2 h-24 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={40}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: any) => formatTableMoneyVNDMillion(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text for Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-bold text-family-textMuted">
                    {percentageSpent.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="text-center text-xs font-semibold mt-1">
                {percentageSpent > 100 ? (
                  <span className="text-red-500">Đã vượt ngân sách {Math.round(percentageSpent - 100)}%!</span>
                ) : (
                  <span>Tỷ lệ sử dụng an toàn</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Series Chart */}
        <Card className="bg-white/80 border-family-accent/10 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-family-textMuted uppercase flex items-center gap-1.5">
              Xu hướng Chi tiêu & Hạn mức Ngân sách
              <HelpTooltip text="Biểu diễn tổng chi tiêu thực tế (cột) so sánh với vùng giới hạn ngân sách (màu cam). Các tháng vượt ngân sách sẽ bị cảnh báo đỏ." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={seriesWithAlerts} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                  <XAxis dataKey="periodKey" tick={{ fontSize: 10 }} tickMargin={8} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(val) => `${val}M`} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip content={<CustomExpenseTooltip />} cursor={{fill: '#f3f4f6', opacity: 0.4}} />
                  <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                  
                  {/* Area Envelope for Budget */}
                  <Area 
                    type="stepAfter" 
                    dataKey="budget" 
                    name="Vùng Ngân sách" 
                    fill="#fed7aa" 
                    fillOpacity={0.4} 
                    stroke="#f97316" 
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    activeDot={false}
                  />

                  {/* Reference Line for Average Spending */}
                  {averageActual > 0 && (
                     <ReferenceLine 
                       y={averageActual} 
                       stroke="#9ca3af" 
                       strokeDasharray="3 3" 
                       label={{ position: 'insideTopLeft', value: 'Trung bình', fill: '#9ca3af', fontSize: 10 }} 
                     />
                  )}

                  {/* Stacked Columns for Regular and Flexible Actual */}
                  <Bar dataKey="regularActual" name="Thường xuyên" stackId="a" fill="#38bdf8" maxBarSize={32} />
                  <Bar dataKey="flexibleActual" name="Linh hoạt" stackId="a" fill="#fb7185" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  
                  {/* Alert Dots for over budget */}
                  <Scatter dataKey="overBudgetAlert" name="Vượt ngân sách" fill="#ef4444" shape="circle" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};