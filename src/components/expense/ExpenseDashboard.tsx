import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { analyzeExpense } from '../../engines/expenseEngine';
import { rebuildTreeFromFlatRatios } from '../../engines/budgetEngine';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatTableMoneyVNDMillion } from '../../utils/format';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ComposedChart } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import type { BudgetGroup } from '../../types/budget';

export interface ExpenseDashboardProps {
  filter: BudgetGroup | 'all';
  setFilter: (f: BudgetGroup | 'all') => void;
}

export const ExpenseDashboard: React.FC<ExpenseDashboardProps> = ({ filter, setFilter }) => {
  const { state, selectedPeriodKey } = useAppContext();

  const FILTER_GROUPS = useMemo(() => {
    const activeBudget = state.budgetSchedule.length > 0 ? state.budgetSchedule[state.budgetSchedule.length - 1] : null;
    const budgetTree = activeBudget ? activeBudget.rootGroups : [];
    const expenseTree = budgetTree.filter(g => g.classification === 'expense');
    
    const groups: { value: BudgetGroup | 'all'; label: string }[] = [
      { value: 'all', label: 'Tất cả' }
    ];
    
    expenseTree.forEach(g => {
      groups.push({
        value: g.groupId as BudgetGroup,
        label: `TỔNG ${g.name}`
      });
    });
    
    return groups;
  }, [state.budgetSchedule]);

  const expenseData = useMemo(() => {
    return analyzeExpense(state.resolvedMonthlyDb || [], state.lifeEvents, selectedPeriodKey);
  }, [state.resolvedMonthlyDb, state.lifeEvents, selectedPeriodKey]);

  const currentSummary = expenseData.summaryByGroup[filter] || { totalBudget: 0, totalActual: 0 };
  const currentSeries = expenseData.monthlySeries[filter] || [];

  const percentageSpent = currentSummary.totalBudget > 0 
    ? (currentSummary.totalActual / currentSummary.totalBudget) * 100 
    : 0;

  const pieData = [
    { name: 'Đã chi tiêu', value: currentSummary.totalActual },
    { name: 'Còn lại', value: Math.max(0, currentSummary.totalBudget - currentSummary.totalActual) },
  ];

  const pieColors = ['#3b82f6', '#f97316']; // Blue for actual, Orange for remaining budget
  
  const currentSeriesWithRemaining = currentSeries.map(s => ({
    ...s,
    remaining: Math.max(0, s.budget - s.actual)
  }));

  const remainingTotal = Math.max(0, currentSummary.totalBudget - currentSummary.totalActual);

  return (
    <div className="space-y-6 mb-8">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTER_GROUPS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
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
            <CardTitle className="text-sm font-semibold text-family-textMuted uppercase flex justify-between">
              <span>Ngân sách vs Thực tế (Cộng dồn)</span>
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
                <span className="text-xs text-family-textMuted">Thực tế sử dụng:</span>
                <span className="font-bold text-blue-500">{formatTableMoneyVNDMillion(currentSummary.totalActual)}</span>
              </div>
              <div className="flex justify-between items-end border-t border-dashed pt-1 mt-1">
                <span className="text-xs font-semibold text-family-textMuted">Còn lại (Chưa dùng):</span>
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
                      {pieData.map((entry, index) => (
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
            <CardTitle className="text-sm font-semibold text-family-textMuted uppercase">
              Biến động chi tiêu theo tháng (Column & Line)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={currentSeriesWithRemaining} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="periodKey" tick={{ fontSize: 10 }} tickMargin={5} />
                  <YAxis tickFormatter={(val) => `${val}M`} tick={{ fontSize: 10 }} />
                  <RechartsTooltip 
                    formatter={(value: any) => formatTableMoneyVNDMillion(value as number)}
                    labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {/* Stacked Columns for Actual and Remaining */}
                  <Bar dataKey="actual" name="Thực tế (Cột)" stackId="a" fill="#3b82f6" maxBarSize={40} />
                  <Bar dataKey="remaining" name="Còn lại chưa dùng (Cột)" stackId="a" fill="#e2e8f0" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  {/* Line for Budget */}
                  <Line type="monotone" dataKey="budget" name="Ngân sách (Đường)" stroke="#f97316" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};