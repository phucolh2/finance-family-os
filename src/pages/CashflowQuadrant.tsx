import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { ObservationControls } from '../components/ui/ObservationControls';
import { runProjection } from '../engines/projectionEngine';
import { calculateIncome } from '../engines/incomeEngine';
import { calculateBudget } from '../engines/budgetEngine';
import { formatTableMoneyVNDMillion } from '../utils/format';
import { BUDGET_PILLARS } from '../constants/pillars';
import { 
  ArrowUpRight, 
  ArrowRightLeft,
  Briefcase,
  Home,
  TrendingUp,
  Wallet
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
  AreaChart,
  Area,
  ComposedChart,
  BarChart,
  Bar
} from 'recharts';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import { useLiquidityBreakdown } from '../hooks/useLiquidityBreakdown';
import { simulateSinkingFund } from '../engines/sinkingFundEngine';

export const CashflowQuadrant: React.FC = () => {
  const { state, selectedPeriodKey } = useAppContext();
  const [activeChartTab, setActiveChartTab] = React.useState<'fire' | 'wealth' | 'outflow'>('fire');
  const [wealthViewMode, setWealthViewMode] = React.useState<'value' | 'percent'>('percent');

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
    sinkingFunds: state.sinkingFunds,
    debts: state.debts,
    projectionAdjustments: state.projectionAdjustments,
    lifeStages: state.lifeStages,
    fundTransfers: state.fundTransfers,
    expenseSchedule: state.expenseSchedule,
    observationPeriodKey: selectedPeriodKey || undefined,
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
    incomeMonthly: activeRow.incomeMonthly
  });

  // --- 1. INCOME QUADRANT ---
  const incomeCategories = state.incomeCategories || [];
  let activeIncome = 0;
  let scheduledPassiveIncome = 0;

  Object.entries(incomeDetails.breakdown).forEach(([catId, amount]) => {
    const category = incomeCategories.find(c => c.id === catId);
    if (category?.type === 'passive') {
      scheduledPassiveIncome += amount;
    } else {
      // Default to active if not found or explicitly active
      activeIncome += amount;
    }
  });
  const investmentPnl = activeRow.portfolio?.totalPnl || 0;
  const realizedPassiveIncome = investmentPnl > 0 ? investmentPnl : 0;
  
  const totalPassiveIncome = scheduledPassiveIncome + realizedPassiveIncome;
  const totalIncome = activeRow.incomeMonthly + realizedPassiveIncome;

  // --- 2. EXPENSE QUADRANT ---
  // Trả nợ thực tế trong tháng
  const debtExpenses = activeRow.debtPaymentMonthly || 0;
  
  // Chi phí sinh hoạt thực tế trong tháng
  let livingExpenses = 0;
  // Sử dụng ngân sách kế hoạch (budget) thay vì thực tế (actual) để Bức tranh Tài chính luôn phản ánh đúng hệ thống mục tiêu.
  livingExpenses = activeRow.budgetedExpensesMonthly ?? activeRow.expensesMonthly;

  // Tổng chi phí = Sinh hoạt + Trả nợ
  const totalExpenses = livingExpenses + debtExpenses;

  // --- 3. ASSET QUADRANT ---
  // Use the exact UI hook to match "Dự phòng / Sự kiện" screen
  const { totalRemainingSum } = useLiquidityBreakdown('cumulative', activeRow?.period.key);
  let displayLiquidityBalance = totalRemainingSum;

  // Compute exact breakdown of sinking funds for UI
  const sinkingFundBreakdown: Record<string, number> = {};
  if (state.sinkingFunds) {
    state.sinkingFunds.forEach(sf => {
      if (sf.status === 'active' || (sf.status === 'disbursed' && sf.disbursedYear && sf.disbursedMonth && (sf.disbursedYear * 12 + sf.disbursedMonth >= activeRow.period.year * 12 + activeRow.period.month))) {
        const { totalPrincipal, nonTermCash } = simulateSinkingFund(sf, activeRow.period.month, activeRow.period.year);
        const bal = totalPrincipal + nonTermCash;
        if (bal > 0) {
          sinkingFundBreakdown[sf.name] = bal;
        }
      }
    });
  }

  // Đầu tư dài hạn = Tổng số dư các tài sản thực tế (BĐS, Cổ phiếu, Crypto, Vàng, Ngoại tệ)
  const investmentAssets = activeRow.portfolio?.assets
    ? Object.values(activeRow.portfolio.assets).reduce((sum, a) => sum + a.endingBalance, 0)
    : 0;

  // Tính chi tiết Quỹ thanh khoản
  const savingBalance = activeRow.savingBalance || 0;
  const debtReserveBalance = activeRow.debtReserveBalance || 0;
  const portfolioSavingsBalance = activeRow.portfolio?.savingsBalance || 0;
  const activeSinkingFundsCash = Object.values(sinkingFundBreakdown).reduce((sum, v) => sum + v, 0);

  const portfolioUnallocatedBase = activeRow.portfolio?.unallocatedEndingBalance || 0;
  const actualUnallocatedIncome = activeRow.unallocatedCashBalance || 0;

  // Compute real dynamic totalAssets to match Dashboard and prevent negative cash components
  const totalAssets = 
    investmentAssets +
    (portfolioUnallocatedBase + actualUnallocatedIncome) +
    (portfolioSavingsBalance + savingBalance) +
    (displayLiquidityBalance) +
    (debtReserveBalance) +
    (activeSinkingFundsCash);
    
  // Quỹ thanh khoản = Phần còn lại (bao gồm mọi Sinking Funds active, Tiền mặt, Sổ tiết kiệm, Quỹ dự phòng)
  const savingAssets = Math.max(0, totalAssets - investmentAssets);

  const totalAllocatedFunds = savingBalance + displayLiquidityBalance + debtReserveBalance + activeSinkingFundsCash + portfolioSavingsBalance;
  const totalCashBalance = Math.max(0, savingAssets - totalAllocatedFunds);
  const freeCash = Math.max(0, totalCashBalance - portfolioUnallocatedBase - actualUnallocatedIncome);

  // --- 4. LIABILITY QUADRANT ---
  // Currently, the system doesn't explicitly track Debt Principal (Liabilities).
  // We use debt expenses as a proxy indicator.
  const hasLiabilities = debtExpenses > 0;

  // --- RAT RACE METRIC ---
  const ratRaceRatio = totalExpenses > 0 ? (totalPassiveIncome / totalExpenses) * 100 : 100;
  const isFinanciallyFree = ratRaceRatio >= 100;

  // --- TIMELINE CHART DATA ---
  const timelineData = projection.monthlyRows.map(row => {
    // 1. Income calculation
    const rowIncDetails = calculateIncome({
      period: row.period,
      incomeSchedule: state.incomeSchedule
    });
    
    let activeIncome = 0;
    let scheduledPassiveIncome = 0;
    Object.entries(rowIncDetails.breakdown).forEach(([catId, amount]) => {
      const category = state.incomeCategories?.find(c => c.id === catId);
      if (category?.type === 'passive') {
        scheduledPassiveIncome += amount;
      } else {
        activeIncome += amount;
      }
    });

    const rowInvPnl = row.portfolio?.totalPnl || 0;
    const passiveIncome = scheduledPassiveIncome + (rowInvPnl > 0 ? rowInvPnl : 0);
    const totalIncome = activeIncome + passiveIncome;
    
    // 2. Expenses calculation
    const debtExpenses = row.debtPaymentMonthly || 0;
    let livingExpenses = 0;
    if (row._monthlyActual && Object.keys(row._monthlyActual).length > 0) {
      Object.entries(row._monthlyActual).forEach(([groupId, amount]) => {
        if (groupId !== 'safety_reserve' && groupId !== 'future_investing' && groupId !== 'debt_optim') {
          livingExpenses += amount;
        }
      });
    } else {
      livingExpenses = row.expensesMonthly;
    }
    const totalExpenses = livingExpenses + debtExpenses;

    // 3. Asset Classification
    const netWorth = row.nominalNetWorth || 0;
    const investmentAssets = row.portfolio?.assets
      ? Object.values(row.portfolio.assets).reduce((sum, a) => sum + a.endingBalance, 0)
      : 0;
    const liquidityAssets = (row.portfolio?.unallocatedEndingBalance || 0) + (row.liquidityBalance || 0) + (row.debtReserveBalance || 0) + (row.portfolio?.savingsBalance || 0);
    const sinkingFundAssets = (row.savingBalance || 0) + Math.max(0, netWorth - investmentAssets - liquidityAssets - (row.savingBalance || 0));

    // 4. Outflow Contributions
    const investmentContrib = row.investmentMonthly || 0;
    const savingContrib = row.savingMonthly || 0;
    
    return {
      periodKey: row.period.key,
      activeIncome: Math.round(activeIncome * 10) / 10,
      passiveIncome: Math.round(passiveIncome * 10) / 10,
      totalIncome: Math.round(totalIncome * 10) / 10,
      livingExpenses: Math.round(livingExpenses * 10) / 10,
      debtExpenses: Math.round(debtExpenses * 10) / 10,
      totalExpenses: Math.round(totalExpenses * 10) / 10,
      investmentContrib: Math.round(investmentContrib * 10) / 10,
      savingContrib: Math.round(savingContrib * 10) / 10,
      liquidityAssets: Math.round(liquidityAssets * 10) / 10,
      sinkingFundAssets: Math.round(sinkingFundAssets * 10) / 10,
      investmentAssets: Math.round(investmentAssets * 10) / 10,
      netWorth: Math.round(netWorth * 10) / 10,
    };
  });

  const lastRow = timelineData[timelineData.length - 1];
  const finalLiquidity = lastRow?.liquidityAssets || 0;
  const finalInvestment = lastRow?.investmentAssets || 0;
  const finalTotal = finalLiquidity + finalInvestment + (lastRow?.sinkingFundAssets || 0);
  const investmentRatio = finalTotal > 0 ? (finalInvestment / finalTotal) : 0;
  const wealthInsightText = investmentRatio < 0.25
    ? "* Tiền mặt và Tiết kiệm (cam) đang chiếm tỷ trọng áp đảo. Để tối ưu hóa lãi kép, bạn có thể cân nhắc nâng tỷ lệ phân bổ vào Đầu tư dài hạn (tím)."
    : "* Sự chuyển dịch tỷ trọng lớn sang Đầu tư dài hạn (tím) cho thấy chiến lược nhân giống tài sản đang được phát huy hiệu quả.";

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-family-text flex items-center gap-2">
            <ArrowRightLeft className="w-8 h-8 text-family-accent" /> Bức tranh Tài chính
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
                    <HelpTooltip text="Tỷ lệ Thu nhập thụ động / Tổng chi phí sinh hoạt. Đạt 100% nghĩa là bạn đã Tự Do Tài Chính." />
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
              <div className="flex justify-between items-center gap-4">
                <span className="text-xs font-bold uppercase text-family-textMuted">Thu nhập thụ động</span>
                <span className="font-bold text-emerald-500 whitespace-nowrap">{formatTableMoneyVNDMillion(totalPassiveIncome)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-family-accent/10 pb-2 gap-4">
                <span className="text-xs font-bold uppercase text-family-textMuted">Tổng chi phí</span>
                <span className="font-bold text-red-400 whitespace-nowrap">{formatTableMoneyVNDMillion(totalExpenses)}</span>
              </div>
              <div className="flex justify-between items-center pt-1 gap-4">
                <span className="text-[10px] uppercase text-family-textMuted">Khoảng cách FIRE</span>
                <span className={`font-bold text-sm whitespace-nowrap ${totalPassiveIncome - totalExpenses >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
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
              <div className="flex flex-col gap-0.5">
                <span className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" /> THU NHẬP (INCOME)
                </span>
                <span className="text-[10px] font-normal text-family-textMuted normal-case tracking-wide">
                  Tổng phát sinh trong tháng
                </span>
              </div>
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
              <div className="flex flex-col gap-0.5">
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 rotate-[135deg]" /> CHI PHÍ (EXPENSES)
                </span>
                <span className="text-[10px] font-normal text-family-textMuted normal-case tracking-wide">
                  Tổng phát sinh trong tháng
                </span>
              </div>
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
              <div className="flex flex-col gap-0.5">
                <span className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" /> TÀI SẢN (ASSETS)
                </span>
                <span className="text-[10px] font-normal text-family-textMuted normal-case tracking-wide">
                  Lũy kế đến cuối tháng
                </span>
              </div>
              <span>{formatTableMoneyVNDMillion(totalAssets)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-xs text-family-textMuted mb-3 italic">
              "Tài sản là những thứ bỏ tiền vào túi bạn."
            </p>
            <div className="space-y-3">
              <div className="p-2 rounded-lg bg-family-bgDark/30 space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-bold text-family-text">Đầu tư dài hạn</div>
                    <div className="text-[10px] text-family-textMuted">BĐS, Cổ phiếu, Crypto...</div>
                  </div>
                  <div className="font-bold text-family-text">{formatTableMoneyVNDMillion(investmentAssets)}</div>
                </div>
                
                {investmentAssets > 0 && activeRow.portfolio?.assets && (
                  <div className="pt-2 border-t border-family-accent/10">
                    <ul className="space-y-1 text-[11px] text-family-textMuted">
                      {Object.entries(activeRow.portfolio.assets).map(([key, asset]) => {
                        if (asset.endingBalance <= 0) return null;
                        const labels: Record<string, string> = { real_estate: 'Bất động sản', stocks: 'Cổ phiếu', crypto: 'Crypto', gold: 'Vàng', fx_reserve_usd: 'Ngoại tệ' };
                        const percent = ((asset.endingBalance / investmentAssets) * 100).toFixed(1);
                        return (
                          <li key={key} className="flex justify-between items-center">
                            <span>{labels[key] || key}</span>
                            <span className="font-semibold text-emerald-500/80">{percent}% ({formatTableMoneyVNDMillion(asset.endingBalance)})</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="p-2 rounded-lg bg-family-bgDark/30 space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-bold text-family-text">Quỹ thanh khoản</div>
                    <div className="text-[10px] text-family-textMuted">Sổ tiết kiệm, tiền mặt sinh lời</div>
                  </div>
                  <div className="font-bold text-family-text">{formatTableMoneyVNDMillion(savingAssets)}</div>
                </div>

                {savingAssets > 0 && (
                  <div className="pt-2 border-t border-family-accent/10">
                    <ul className="space-y-1 text-[11px] text-family-textMuted">
                      {(activeRow.savingBalance || 0) > 0 && (
                        <li className="flex justify-between items-center"><span>Tiết kiệm mục tiêu</span> <span className="font-semibold">{formatTableMoneyVNDMillion(activeRow.savingBalance || 0)}</span></li>
                      )}
                      {displayLiquidityBalance > 0 && (
                        <li className="flex justify-between items-center"><span>Quỹ sinh hoạt / Dư thừa</span> <span className="font-semibold">{formatTableMoneyVNDMillion(displayLiquidityBalance)}</span></li>
                      )}
                      {(activeRow.debtReserveBalance || 0) > 0 && (
                        <li className="flex justify-between items-center"><span>Dự phòng trả nợ</span> <span className="font-semibold">{formatTableMoneyVNDMillion(activeRow.debtReserveBalance || 0)}</span></li>
                      )}
                      {totalCashBalance > 0 && (
                        <li className="flex flex-col gap-1">
                          <div className="flex justify-between items-center">
                            <span>Tiền mặt</span> 
                            <span className="font-semibold">{formatTableMoneyVNDMillion(totalCashBalance)}</span>
                          </div>
                          {(portfolioUnallocatedBase > 0 || actualUnallocatedIncome > 0 || freeCash > 0) && (
                            <ul className="pl-4 border-l border-zinc-200/20 text-[10px] opacity-70 space-y-1">
                              {portfolioUnallocatedBase > 0 && (
                                <li className="flex justify-between items-center">
                                  <span>Vốn gốc chờ đầu tư</span>
                                  <span>{formatTableMoneyVNDMillion(portfolioUnallocatedBase)}</span>
                                </li>
                              )}
                              {actualUnallocatedIncome > 0 && (
                                <li className="flex justify-between items-center">
                                  <span>Tiền dôi ra (chưa phân bổ)</span>
                                  <span>{formatTableMoneyVNDMillion(actualUnallocatedIncome)}</span>
                                </li>
                              )}
                              {freeCash > 0 && (
                                <li className="flex justify-between items-center">
                                  <span>Tiền mặt tự do</span>
                                  <span>{formatTableMoneyVNDMillion(freeCash)}</span>
                                </li>
                              )}
                            </ul>
                          )}
                        </li>
                      )}
                      {(activeRow.portfolio?.savingsBalance || 0) > 0 && (
                        <li className="flex justify-between items-center"><span>Sổ tiết kiệm (Portfolio)</span> <span className="font-semibold">{formatTableMoneyVNDMillion(activeRow.portfolio?.savingsBalance || 0)}</span></li>
                      )}
                        <li className="flex justify-between items-center text-emerald-400/90 pt-1">
                          <span className="flex items-center gap-1">
                            Đang tích lũy trong các Quỹ
                            <HelpTooltip 
                              position="top"
                              text={
                                <div className="space-y-2 min-w-[200px]">
                                  <div className="font-semibold text-family-text border-b border-zinc-200/20 pb-1 mb-2">Chi tiết các quỹ (Sinking Funds)</div>
                                  {Object.keys(sinkingFundBreakdown).length > 0 ? (
                                    <ul className="space-y-1">
                                      {Object.entries(sinkingFundBreakdown).map(([name, balance]) => (
                                        <li key={name} className="flex justify-between items-center text-xs">
                                          <span>{name}</span>
                                          <span className="font-medium text-emerald-400">{formatTableMoneyVNDMillion(balance)}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <div className="text-xs opacity-70 italic">Chưa có quỹ nào phát sinh số dư.</div>
                                  )}
                                </div>
                              }
                            />
                          </span>
                          <span className="font-semibold">{formatTableMoneyVNDMillion(activeSinkingFundsCash)}</span>
                        </li>
                    </ul>
                  </div>
                )}
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
              <div className="flex flex-col gap-0.5">
                <span className="flex items-center gap-2">
                  <Home className="w-5 h-5" /> TIÊU SẢN (LIABILITIES)
                </span>
                <span className="text-[10px] font-normal text-family-textMuted normal-case tracking-wide">
                  Lũy kế đến cuối tháng
                </span>
              </div>
              <span>{hasLiabilities ? 'Đang theo dõi' : '0 triệu VND'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-xs text-family-textMuted mb-3 italic">
              "Tiêu sản là những thứ lấy tiền ra khỏi túi bạn."
            </p>
            {!hasLiabilities ? (
              <div className="flex items-center justify-center p-6 border border-dashed border-family-accent/20 rounded-xl bg-family-bgDark/20 text-family-textMuted text-xs text-center">
                Bạn chưa ghi nhận khoản vay/nợ nào trong màn hình "Quản lý Công nợ".
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

      {/* Cashflow Financial Insights */}
      <Card className="border border-family-accent/10 bg-family-bgDark/5 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <CardTitle className="text-lg text-emerald-400">Phân tích Dòng tiền & Tài sản (Insights)</CardTitle>
              <p className="text-xs text-family-textMuted mt-1">Góc nhìn chuyên sâu về hành trình xây dựng tài sản và tự do tài chính.</p>
            </div>
            
            <div className="flex bg-family-bgDeep p-1 rounded-lg border border-family-accent/10 w-fit">
              <button 
                onClick={() => setActiveChartTab('fire')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeChartTab === 'fire' ? 'bg-emerald-500/20 text-emerald-400 shadow-sm' : 'text-family-textMuted hover:text-family-text hover:bg-family-bgDark/50'}`}
              >
                Hành trình FIRE
              </button>
              <button 
                onClick={() => setActiveChartTab('wealth')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeChartTab === 'wealth' ? 'bg-amber-500/20 text-amber-400 shadow-sm' : 'text-family-textMuted hover:text-family-text hover:bg-family-bgDark/50'}`}
              >
                Cơ cấu Tài sản
              </button>
              <button 
                onClick={() => setActiveChartTab('outflow')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${activeChartTab === 'outflow' ? 'bg-rose-500/20 text-rose-400 shadow-sm' : 'text-family-textMuted hover:text-family-text hover:bg-family-bgDark/50'}`}
              >
                Phân bổ Chi tiêu
              </button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="h-[380px] w-full bg-family-bgDeep/50 rounded-xl p-4 border border-family-accent/5 relative overflow-hidden">
            
            {activeChartTab === 'fire' && (
              <div className="absolute inset-0 flex flex-col animation-fade-in p-4 gap-2">
                <div className="flex justify-between items-start gap-4">
                  <div className="text-xs text-family-textMuted italic bg-family-bgDark/40 px-3 py-2 rounded-lg border-l-2 border-emerald-500/50 flex-1">
                    * Lưu ý: Biểu đồ dùng 2 trục Y (trục phải cho Thu nhập thụ động). Khoảng cách giữa các đường chỉ mang tính tương đối, không phải thời điểm tự do tài chính tuyệt đối.
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={timelineData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorActiveIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
                    <XAxis dataKey="periodKey" stroke="#6b7280" fontSize={10} tickFormatter={(v) => { const [y,m] = v.split('-'); return `${m}/${y}`; }} dy={10} />
                    <YAxis yAxisId="left" stroke="#6b7280" fontSize={10} width={65} tickFormatter={(v) => formatTableMoneyVNDMillion(v)} />
                    <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={10} width={65} tickFormatter={(v) => formatTableMoneyVNDMillion(v)} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                      itemStyle={{ fontSize: 12, fontWeight: 'bold' }}
                      labelStyle={{ color: '#94a3b8', fontSize: 11, marginBottom: '6px' }}
                      formatter={(value: any, name: any) => [formatTableMoneyVNDMillion(value), name]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, bottom: 0 }} />
                    
                    <Area yAxisId="left" type="monotone" name="Thu nhập chủ động" dataKey="activeIncome" fill="url(#colorActiveIncome)" stroke="#3b82f6" strokeWidth={1} strokeOpacity={0.5} />
                    <Bar yAxisId="left" name="Tổng Chi phí" dataKey="totalExpenses" fill="#ef4444" opacity={0.7} barSize={20} radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" name="Thu nhập thụ động" dataKey="passiveIncome" stroke="#10b981" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 6, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }} />
                  </ComposedChart>
                </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeChartTab === 'wealth' && (
              <div className="absolute inset-0 flex flex-col animation-fade-in p-4 gap-2">
                <div className="flex justify-between items-start gap-4">
                  <div className="text-xs text-family-textMuted italic bg-family-bgDark/40 px-3 py-2 rounded-lg border-l-2 border-amber-500/50 flex-1">
                    {wealthInsightText}
                  </div>
                  <div className="flex bg-family-bgDeep p-1 rounded-lg border border-family-accent/10 shrink-0">
                    <button 
                      onClick={() => setWealthViewMode('percent')}
                      className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${wealthViewMode === 'percent' ? 'bg-amber-500/20 text-amber-400' : 'text-family-textMuted hover:text-family-text'}`}
                    >
                      Tỷ trọng (%)
                    </button>
                    <button 
                      onClick={() => setWealthViewMode('value')}
                      className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${wealthViewMode === 'value' ? 'bg-amber-500/20 text-amber-400' : 'text-family-textMuted hover:text-family-text'}`}
                    >
                      Giá trị thực
                    </button>
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }} stackOffset={wealthViewMode === 'percent' ? 'expand' : 'none'}>
                    <defs>
                      <linearGradient id="colorInvest" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05}/>
                      </linearGradient>
                      <linearGradient id="colorSinking" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.05}/>
                      </linearGradient>
                      <linearGradient id="colorLiquid" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
                    <XAxis dataKey="periodKey" stroke="#6b7280" fontSize={10} tickFormatter={(v) => { const [y,m] = v.split('-'); return `${m}/${y}`; }} dy={10} />
                    <YAxis stroke="#6b7280" fontSize={10} width={65} tickFormatter={(v) => wealthViewMode === 'percent' ? `${(v * 100).toFixed(0)}%` : formatTableMoneyVNDMillion(v)} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                      itemStyle={{ fontSize: 12, fontWeight: 'bold' }}
                      labelStyle={{ color: '#94a3b8', fontSize: 11, marginBottom: '6px' }}
                      formatter={(value: any, name: any) => [formatTableMoneyVNDMillion(value), name]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, bottom: 0 }} />
                    
                    <Area type="monotone" name="Đầu tư dài hạn" dataKey="investmentAssets" stackId="1" stroke="#8b5cf6" fill="url(#colorInvest)" strokeWidth={2} />
                    <Area type="monotone" name="Các Quỹ mục tiêu (Sinking Funds)" dataKey="sinkingFundAssets" stackId="1" stroke="#0ea5e9" fill="url(#colorSinking)" strokeWidth={2} />
                    <Area type="monotone" name="Quỹ thanh khoản & Tiền mặt" dataKey="liquidityAssets" stackId="1" stroke="#f59e0b" fill="url(#colorLiquid)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeChartTab === 'outflow' && (
              <div className="absolute inset-0 flex flex-col animation-fade-in p-4 gap-2">
                <div className="text-xs text-family-textMuted italic bg-family-bgDark/40 px-3 py-2 rounded-lg border-l-2 border-rose-500/50">
                  * Tỷ trọng xanh lá/xanh dương càng lớn, tốc độ làm giàu của bạn càng nhanh. (Savings Rate)
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timelineData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.05)" />
                    <XAxis dataKey="periodKey" stroke="#6b7280" fontSize={10} tickFormatter={(v) => { const [y,m] = v.split('-'); return `${m}/${y}`; }} dy={10} />
                    <YAxis stroke="#6b7280" fontSize={10} width={65} tickFormatter={(v) => formatTableMoneyVNDMillion(v)} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                      itemStyle={{ fontSize: 12, fontWeight: 'bold' }}
                      labelStyle={{ color: '#94a3b8', fontSize: 11, marginBottom: '6px' }}
                      formatter={(value: any, name: any) => [formatTableMoneyVNDMillion(value), name]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, bottom: 0 }} />
                    
                    <Bar name="Đầu tư sinh lời" dataKey="investmentContrib" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                    <Bar name="Tiết kiệm mục tiêu" dataKey="savingContrib" stackId="a" fill="#0ea5e9" radius={[0, 0, 0, 0]} />
                    <Bar name="Trả nợ" dataKey="debtExpenses" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                    <Bar name="Chi phí sinh hoạt" dataKey="livingExpenses" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                </div>
              </div>
            )}

          </div>
        </CardContent>
      </Card>

    </div>
  );
};
