import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { ObservationControls } from '../components/ui/ObservationControls';
import { runProjection } from '../engines/projectionEngine';
import { calculateIncome } from '../engines/incomeEngine';
import { calculateBudget } from '../engines/budgetEngine';
import { formatTableMoneyVNDMillion } from '../utils/format';
import { safeNumber } from '../utils/math';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  ArrowRightLeft,
  Briefcase,
  Home,
  TrendingUp,
  Wallet,
  AlertTriangle,
  Info
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { HelpTooltip } from '../components/ui/HelpTooltip';

export const CashflowQuadrant: React.FC = () => {
  const { state, selectedPeriodKey } = useAppContext();

  // Run projection engine purely
  const projection = runProjection({
    profile: state.profile,
    incomeSchedule: state.incomeSchedule,
    budgetSchedule: state.budgetSchedule,
    lifeEvents: state.lifeEvents,
    assets: state.assets,
    assumptions: state.assumptions,
    investmentDeals: state.investmentDeals,
    savingsDeposits: state.savingsDeposits,
    projectionAdjustments: state.projectionAdjustments,
    lifeStages: state.lifeStages,
  });

  const hasData = projection.monthlyRows.length > 0;

  // Determine active observation snapshot row
  const now = new Date();
  const nowMonth = now.getMonth() + 1;
  const nowYear = now.getFullYear();
  const nowKey = `${nowYear}-${String(nowMonth).padStart(2, '0')}`;

  const currentPeriod = hasData
    ? (projection.monthlyRows.find(r => r.period.key === nowKey) || projection.monthlyRows[0])
    : null;

  const activeRow = (hasData && selectedPeriodKey)
    ? (projection.monthlyRows.find(r => r.period.key === selectedPeriodKey) || currentPeriod)
    : currentPeriod;

  if (!activeRow) {
    return (
      <div className="flex items-center justify-center h-64 text-family-textMuted">
        Chưa có dữ liệu tính toán.
      </div>
    );
  }

  // Calculate detailed income for the active period
  const incomeDetails = calculateIncome({
    period: activeRow.period,
    incomeSchedule: state.incomeSchedule
  });

  // Calculate detailed budget for the active period
  const budgetDetails = calculateBudget({
    period: activeRow.period,
    budgetSchedule: state.budgetSchedule,
    incomeMonthly: activeRow.incomeMonthly,
    profile: state.profile
  });

  // --- 1. INCOME QUADRANT ---
  const activeIncome = 
    (incomeDetails.breakdown['fulltime_salary'] || 0) + 
    (incomeDetails.breakdown['parttime_salary'] || 0) + 
    (incomeDetails.breakdown['self_employed'] || 0) + 
    (incomeDetails.breakdown['irregular_income'] || 0);
  
  // Passive income from Income Schedule + Investment P&L (if positive)
  const scheduledPassiveIncome = incomeDetails.breakdown['passive_income'] || 0;
  const investmentPnl = activeRow.investmentFlow?.pnl || 0;
  const realizedPassiveIncome = investmentPnl > 0 ? investmentPnl : 0;
  
  const totalPassiveIncome = scheduledPassiveIncome + realizedPassiveIncome;
  const totalIncome = activeRow.incomeMonthly + realizedPassiveIncome;

  // --- 2. EXPENSE QUADRANT ---
  const totalExpenses = activeRow.expensesMonthly;
  
  // Try to find debt/liability related expenses
  let debtExpenses = 0;
  let livingExpenses = 0;
  
  if (budgetDetails.resolvedTree && budgetDetails.resolvedTree.length > 0) {
    budgetDetails.resolvedTree.forEach(group => {
      if (group.classification === 'expense' || group.classification === 'savings') { // check savings too just in case debt is there
        group.children?.forEach(item => {
          const nameLower = item.name.toLowerCase();
          if (nameLower.includes('nợ') || nameLower.includes('debt') || nameLower.includes('vay')) {
            debtExpenses += (item.ratioPercent / 100) * activeRow.incomeMonthly;
          } else if (group.classification === 'expense') {
            livingExpenses += (item.ratioPercent / 100) * activeRow.incomeMonthly;
          }
        });
      }
    });
  } else {
    livingExpenses = totalExpenses; // Fallback
  }

  // --- 3. ASSET QUADRANT ---
  // Assets = Things that put money in your pocket (Investments, Savings, Real Estate)
  const totalAssets = activeRow.portfolio.total;
  const savingAssets = activeRow.portfolio.savingTotal;
  const investmentAssets = totalAssets - savingAssets;

  // --- 4. LIABILITY QUADRANT ---
  // Currently, the system doesn't explicitly track Debt Principal (Liabilities).
  // We use debt expenses as a proxy indicator.
  const hasLiabilities = debtExpenses > 0;

  // --- RAT RACE METRIC ---
  const ratRaceRatio = totalExpenses > 0 ? (totalPassiveIncome / totalExpenses) * 100 : 100;
  const isFinanciallyFree = ratRaceRatio >= 100;

  // --- TIMELINE CHART DATA ---
  const timelineData = projection.monthlyRows.map(row => {
    // Need to calculate income details for each row to get accurate passive income from schedule
    const rowIncDetails = calculateIncome({
      period: row.period,
      incomeSchedule: state.incomeSchedule
    });
    
    const rowSchedPassive = rowIncDetails.breakdown['passive_income'] || 0;
    const rowInvPnl = row.investmentFlow?.pnl || 0;
    const rowPassive = rowSchedPassive + (rowInvPnl > 0 ? rowInvPnl : 0);
    
    return {
      periodKey: row.period.key,
      passiveIncome: Math.round(rowPassive * 10) / 10,
      expenses: Math.round(row.expensesMonthly * 10) / 10,
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-family-text flex items-center gap-2">
            <ArrowRightLeft className="w-8 h-8 text-family-accent" /> Báo cáo Dòng tiền
          </h1>
          <p className="text-sm text-family-textMuted mt-1">
            Góc nhìn Cashflow Quadrant theo triết lý Cha Giàu Cha Nghèo (Robert Kiyosaki).
          </p>
        </div>
        <ObservationControls />
      </div>

      {/* Rat Race Meter */}
      <Card className="border border-family-accent/20 bg-gradient-to-br from-family-bgDeep to-family-bgDark shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex-1 w-full">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <h3 className="text-lg font-bold text-family-text flex items-center gap-2">
                    Tỷ lệ thoát "Bẫy Chuột" (Rat Race)
                    <HelpTooltip content="Tỷ lệ Thu nhập thụ động / Tổng chi phí sinh hoạt. Đạt 100% nghĩa là bạn đã Tự Do Tài Chính." />
                  </h3>
                  <p className="text-xs text-family-textMuted mt-0.5">
                    Mục tiêu: Thu nhập thụ động {`>=`} Tổng chi phí
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-3xl font-extrabold ${isFinanciallyFree ? 'text-emerald-500' : 'text-family-accent'}`}>
                    {ratRaceRatio.toFixed(1)}%
                  </span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="h-4 w-full bg-family-bgDark/50 rounded-full overflow-hidden border border-family-accent/10 relative">
                <div 
                  className={`h-full transition-all duration-1000 ease-out ${isFinanciallyFree ? 'bg-emerald-500' : 'bg-gradient-to-r from-orange-500 to-family-accent'}`}
                  style={{ width: `${Math.min(ratRaceRatio, 100)}%` }}
                />
                {/* 100% Marker */}
                <div className="absolute top-0 bottom-0 left-[100%] w-0.5 bg-white shadow-[0_0_5px_rgba(255,255,255,0.8)] z-10" />
              </div>
              
              <div className="flex justify-between mt-2 text-xs font-medium text-family-textMuted">
                <span>Đang cày cuốc (0%)</span>
                <span>Độc lập tài chính (50%)</span>
                <span className="text-emerald-500/80">Tự do tài chính (100%+)</span>
              </div>
            </div>
            
            <div className="w-full md:w-auto shrink-0 bg-family-bgDark/40 p-4 rounded-xl border border-family-accent/10 flex flex-col gap-2 min-w-[200px]">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-family-textMuted">Thu nhập thụ động</span>
                <span className="font-bold text-emerald-500">{formatTableMoneyVNDMillion(totalPassiveIncome)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-family-accent/10 pb-2">
                <span className="text-xs font-bold uppercase text-family-textMuted">Tổng chi phí</span>
                <span className="font-bold text-red-400">{formatTableMoneyVNDMillion(totalExpenses)}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-[10px] uppercase text-family-textMuted">Net Cashflow</span>
                <span className={`font-bold text-sm ${totalPassiveIncome - totalExpenses >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                  {totalPassiveIncome - totalExpenses >= 0 ? '+' : ''}{formatTableMoneyVNDMillion(totalPassiveIncome - totalExpenses)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* The 4 Quadrants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        {/* Visual Flow Arrows (Desktop only) */}
        <div className="hidden md:block absolute top-[50%] left-[25%] -translate-x-1/2 -translate-y-1/2 z-10">
          <ArrowUpRight className="w-12 h-12 text-emerald-500/30 rotate-[-45deg]" strokeWidth={1} />
        </div>
        <div className="hidden md:block absolute top-[50%] right-[25%] translate-x-1/2 -translate-y-1/2 z-10">
          <ArrowUpRight className="w-12 h-12 text-red-500/30 rotate-[-45deg]" strokeWidth={1} />
        </div>

        {/* Quadrant 1: INCOME */}
        <Card className="border-t-4 border-t-emerald-500 bg-family-bgDeep shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-2 border-b border-family-accent/5">
            <CardTitle className="text-emerald-500 flex items-center justify-between">
              <span className="flex items-center gap-2"><Wallet className="w-5 h-5" /> THU NHẬP (INCOME)</span>
              <span>{formatTableMoneyVNDMillion(totalIncome)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 rounded-lg bg-family-bgDark/30">
                <div>
                  <div className="text-sm font-bold text-family-text">Chủ động (Active)</div>
                  <div className="text-[10px] text-family-textMuted">Lương, kinh doanh trực tiếp</div>
                </div>
                <div className="font-bold text-family-text">{formatTableMoneyVNDMillion(activeIncome)}</div>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div>
                  <div className="text-sm font-bold text-emerald-500">Thụ động (Passive)</div>
                  <div className="text-[10px] text-emerald-600/70">Từ tài sản, đầu tư sinh lời</div>
                </div>
                <div className="font-bold text-emerald-500">{formatTableMoneyVNDMillion(totalPassiveIncome)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quadrant 2: EXPENSES */}
        <Card className="border-t-4 border-t-red-500 bg-family-bgDeep shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-2 border-b border-family-accent/5">
            <CardTitle className="text-red-400 flex items-center justify-between">
              <span className="flex items-center gap-2"><TrendingUp className="w-5 h-5 rotate-[135deg]" /> CHI PHÍ (EXPENSES)</span>
              <span>{formatTableMoneyVNDMillion(totalExpenses)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 rounded-lg bg-family-bgDark/30">
                <div>
                  <div className="text-sm font-bold text-family-text">Sinh hoạt (Living)</div>
                  <div className="text-[10px] text-family-textMuted">Nhà cửa, ăn uống, giáo dục</div>
                </div>
                <div className="font-bold text-family-text">{formatTableMoneyVNDMillion(livingExpenses)}</div>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <div>
                  <div className="text-sm font-bold text-red-400">Trả nợ (Liabilities exp.)</div>
                  <div className="text-[10px] text-red-400/70">Tiền chảy ra từ Tiêu sản</div>
                </div>
                <div className="font-bold text-red-400">{formatTableMoneyVNDMillion(debtExpenses)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quadrant 3: ASSETS */}
        <Card className="border-b-4 border-b-emerald-500 bg-family-bgDeep shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-2 border-b border-family-accent/5">
            <CardTitle className="text-emerald-500 flex items-center justify-between">
              <span className="flex items-center gap-2"><Briefcase className="w-5 h-5" /> TÀI SẢN (ASSETS)</span>
              <span>{formatTableMoneyVNDMillion(totalAssets)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-xs text-family-textMuted mb-3 italic">
              "Tài sản là những thứ bỏ tiền vào túi bạn."
            </p>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 rounded-lg bg-family-bgDark/30">
                <div>
                  <div className="text-sm font-bold text-family-text">Đầu tư dài hạn</div>
                  <div className="text-[10px] text-family-textMuted">BĐS, Cổ phiếu, Crypto...</div>
                </div>
                <div className="font-bold text-family-text">{formatTableMoneyVNDMillion(investmentAssets)}</div>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-family-bgDark/30">
                <div>
                  <div className="text-sm font-bold text-family-text">Quỹ thanh khoản</div>
                  <div className="text-[10px] text-family-textMuted">Sổ tiết kiệm, tiền mặt sinh lời</div>
                </div>
                <div className="font-bold text-family-text">{formatTableMoneyVNDMillion(savingAssets)}</div>
              </div>
            </div>
            {totalAssets > 0 && (
              <div className="mt-4 pt-3 border-t border-family-accent/10 flex items-center justify-center text-xs font-bold text-emerald-500/70 gap-1">
                Tạo ra {formatTableMoneyVNDMillion(realizedPassiveIncome)} dòng tiền <ArrowUpRight className="w-3 h-3" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quadrant 4: LIABILITIES */}
        <Card className="border-b-4 border-b-red-500 bg-family-bgDeep shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-2 border-b border-family-accent/5">
            <CardTitle className="text-red-400 flex items-center justify-between">
              <span className="flex items-center gap-2"><Home className="w-5 h-5" /> TIÊU SẢN (LIABILITIES)</span>
              <span>{hasLiabilities ? 'Đang theo dõi' : '0 Tr VND'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-xs text-family-textMuted mb-3 italic">
              "Tiêu sản là những thứ lấy tiền ra khỏi túi bạn."
            </p>
            {!hasLiabilities ? (
              <div className="flex items-center justify-center p-6 border border-dashed border-family-accent/20 rounded-xl bg-family-bgDark/20 text-family-textMuted text-xs text-center">
                Bạn chưa ghi nhận khoản vay/nợ nào trong mục Phân Bổ Ngân Sách (tên chứa chữ "nợ").
              </div>
            ) : (
              <div className="space-y-3">
                 <div className="flex justify-between items-center p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div>
                    <div className="text-sm font-bold text-red-400">Các khoản vay / Trả góp</div>
                    <div className="text-[10px] text-red-400/70">Đang trích từ chi phí ngân sách</div>
                  </div>
                  <div className="font-bold text-red-400 text-xs">Chi {formatTableMoneyVNDMillion(debtExpenses)}/tháng</div>
                </div>
              </div>
            )}
            {hasLiabilities && (
              <div className="mt-4 pt-3 border-t border-family-accent/10 flex items-center justify-center text-xs font-bold text-red-400/70 gap-1">
                Lấy đi {formatTableMoneyVNDMillion(debtExpenses)} dòng tiền <ArrowUpRight className="w-3 h-3" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cashflow Timeline Trend */}
      <Card className="border border-family-accent/10 bg-family-bgDark/5 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Xu hướng Dòng tiền thụ động vs Chi phí</CardTitle>
          <p className="text-xs text-family-textMuted">Điểm giao cắt (Crossover Point) là thời điểm Thu nhập thụ động vượt Tổng chi phí.</p>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full bg-family-bgDeep rounded-xl p-4 border border-family-accent/5">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 180, 76, 0.05)" />
                <XAxis 
                  dataKey="periodKey" 
                  stroke="#6b7280" 
                  fontSize={10} 
                  tickFormatter={(val) => {
                    const [y, m] = val.split('-');
                    return `${m}/${y}`;
                  }}
                />
                <YAxis stroke="#6b7280" fontSize={11} unit=" tr" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(226, 180, 76, 0.15)', borderRadius: '12px' }}
                  itemStyle={{ fontSize: 12, fontWeight: 'bold' }}
                  labelStyle={{ color: '#94a3b8', fontSize: 11, marginBottom: '4px' }}
                  formatter={(value: number) => [`${value} Triệu`, '']}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: '10px' }} />
                
                <Line
                  name="Tổng Chi Phí"
                  type="monotone"
                  dataKey="expenses"
                  stroke="#f87171" // red-400
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, fill: '#f87171', strokeWidth: 0 }}
                />
                <Line
                  name="Thu Nhập Thụ Động"
                  type="monotone"
                  dataKey="passiveIncome"
                  stroke="#10b981" // emerald-500
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: '#10b981', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};
