import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { WarningBox } from '../components/ui/WarningBox';
import { EmptyState } from '../components/ui/EmptyState';
import { runProjection } from '../engines/projectionEngine';
import { formatTableMoneyVNDMillion, formatKpiMoneyVNDMillion } from '../utils/format';
import { simulateSinkingFund } from '../engines/sinkingFundEngine';
import { safeNumber } from '../utils/math';
import { ExpertPortfolioCharts } from '../components/portfolio/ExpertPortfolioCharts';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { PortfolioRadarChart } from '../components/portfolio/PortfolioRadarChart';
import { Briefcase, RotateCcw, PlusCircle, Trash2 } from 'lucide-react';
import type { AssetType } from '../types/portfolio';
import { ObservationControls } from '../components/ui/ObservationControls';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import { isWithinObservationPeriod, getPeriodGuardMessage } from '../utils/periodGuard';

import { SinkingFundModule_Portfolio } from '../components/portfolio/SinkingFundModule_Portfolio';

export const Portfolio: React.FC = () => {
  const { 
    state, 
    updateProfile,
    updateAssets, 
    selectedPeriodKey, 
    setSelectedPeriodKey,
    addInvestmentDeal,
    updateInvestmentDeal,
    deleteInvestmentDeal,
    settleInvestmentDeal,
    withdrawInvestmentDeal,
    addSavingsDeposit,
    disburseSinkingFund,
    updateSinkingFund,
    addIncomeItem,
    updateAppState
  } = useAppContext();
  
  // Run projection dynamically to get actual accumulated assets at the observed time
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
  });

  const hasData = projection.monthlyRows.length > 0;
  
  // Set up current observation period
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

  // Deals Tracking local states
  const [showAddDealForm, setShowAddDealForm] = useState(false);
  const [editDealId, setEditDealId] = useState<string | null>(null);
  const [editingDealId, setEditingDealId] = useState<string | null>(null);
  const [settlingDealId, setSettlingDealId] = useState<string | null>(null);
  
  React.useEffect(() => {
    setShowAddDealForm(false);
    setEditingDealId(null);
    setSettlingDealId(null);
  }, [selectedPeriodKey]);

  const [dealForm, setDealForm] = useState({
    name: '',
    assetType: 'stocks' as AssetType,
    capital: 0,
    startMonth: activeRow ? activeRow.period.month : 10,
    startYear: activeRow ? activeRow.period.year : 2026,
    notes: '',
    sourceFundId: 'idle',
    dealType: 'capital_gain' as 'capital_gain' | 'cash_flow',
    cashflowYieldAnnual: 5,
    createPassiveIncome: false,
    quantity: '' as number | '',
    purchasePrice: '' as number | '',
  });

  const [settleForm, setSettleForm] = useState({
    endMonth: 12,
    endYear: 2026,
    realizedProfit: 0,
    reinvestAsUnallocated: false,
    reinvestAssetType: 'stocks' as AssetType,
    settleMode: 'full' as 'full' | 'partial',
    partialWithdrawType: 'amount' as 'amount' | 'percentage',
    partialWithdrawValue: 0,
  });

  const [convertingDealId, setConvertingDealId] = useState<string | null>(null);
  const [conversionForm, setConversionForm] = useState({
    month: 10,
    year: 2026,
    realizedSavingInterest: 0,
    reinvestAsUnallocated: false,
    reinvestAssetType: 'stocks' as AssetType,
  });

  const [cashflowDealId, setCashflowDealId] = useState<string | null>(null);
  const [cashflowForm, setCashflowForm] = useState({
    month: activeRow ? activeRow.period.month : 10,
    year: activeRow ? activeRow.period.year : 2026,
    amount: 0,
    type: 'cash_dividend' as 'cash_dividend' | 'stock_dividend',
    note: ''
  });

  const [formError, setFormError] = useState<string | null>(null);

  // Smart calculation input modes & rates
  const [settleDealInputMode, setSettleDealInputMode] = useState<'amount' | 'rate'>('amount');
  const [settleDealCustomRate, setSettleDealCustomRate] = useState<number>(0);

  const [convertDealInputMode, setConvertDealInputMode] = useState<'amount' | 'rate'>('amount');
  const [convertDealCustomRate, setConvertDealCustomRate] = useState<number>(0);

  const getMonthsActive = (startMonth: number, startYear: number, endMonth: number, endYear: number) => {
    return Math.max(0, (endYear * 12 + endMonth) - (startYear * 12 + startMonth));
  };



  // Reset UI states when observation month changes
  useEffect(() => {
    setShowAddDealForm(false);
    setSettlingDealId(null);
    setConvertingDealId(null);
    setCashflowDealId(null);
    setFormError(null);
  }, [activeRow?.period.key]);

  const globalObservedDeals = state.investmentDeals?.filter((deal) => {
    if (!activeRow) return false;
    const isStarted = (deal.startYear < activeRow.period.year) || 
                      (deal.startYear === activeRow.period.year && deal.startMonth <= activeRow.period.month);
    const isNotEnded = deal.status === 'active' || 
                       (deal.endYear !== undefined && deal.endMonth !== undefined && (deal.endYear > activeRow.period.year || 
                       (deal.endYear === activeRow.period.year && deal.endMonth > activeRow.period.month)));
    return isStarted && isNotEnded;
  }) || [];

  const globalSettledDeals = state.investmentDeals?.filter((deal) => {
    if (!activeRow) return deal.status === 'settled';
    if (deal.status !== 'settled') return false;
    const isEnded = (deal.endYear! < activeRow.period.year) || 
                    (deal.endYear! === activeRow.period.year && deal.endMonth! <= activeRow.period.month);
    return isEnded;
  }) || [];

  const globalObservedSinkingFunds = state.sinkingFunds?.filter((sf) => {
    if (!activeRow) return false;
    const isStarted = (sf.startYear < activeRow.period.year) || 
                      (sf.startYear === activeRow.period.year && sf.startMonth <= activeRow.period.month);
    const isNotDisbursed = sf.status === 'active' || 
                       (sf.disbursedYear !== undefined && sf.disbursedMonth !== undefined && (sf.disbursedYear > activeRow.period.year || 
                       (sf.disbursedYear === activeRow.period.year && sf.disbursedMonth > activeRow.period.month)));
    return isStarted && isNotDisbursed;
  }) || [];

  // Recharts parameters
  const COLORS = ['#d97706', '#eab308', '#4d7c0f', '#8b5cf6', '#0f766e', '#64748b'];
  
  const totalStartingBalance = safeNumber(state.profile.startingCapital, 100);
  const rawObservedBalance = activeRow ? activeRow.portfolio.totalEndingBalance : totalStartingBalance;

  const totalActiveCapital = state.assets.reduce((sum, asset) => {
    return sum + (activeRow ? activeRow.portfolio.assets[asset.type].endingBalance : 0);
  }, 0);

  const totalObservedBalance = Math.max(rawObservedBalance, totalActiveCapital);

  const chartData = state.assets.map((asset) => {
    const assetBalance = activeRow
      ? activeRow.portfolio.assets[asset.type].endingBalance
      : 0;
    const actualPercent = totalObservedBalance > 0
      ? (assetBalance / totalObservedBalance) * 100
      : 0;
    return {
      name: asset.name,
      value: Math.round(actualPercent * 10) / 10,
      balance: assetBalance,
    };
  });

  const savBal = activeRow?.portfolio.savingsBalance || 0;

  const totalEarmarkedCapital = activeRow 
    ? (Object.values(activeRow.portfolio.assets) as any[]).reduce((sum, asset) => sum + (asset.earmarkedEndingBalance || 0), 0)
    : 0;

  state.assets.forEach((asset) => {
    const earmarkedBalance = activeRow ? (activeRow.portfolio.assets[asset.type].earmarkedEndingBalance || 0) : 0;
    if (earmarkedBalance > 0) {
      chartData.push({
        name: `${asset.name} (Chờ pb)`,
        value: Math.round((earmarkedBalance / totalObservedBalance) * 100 * 10) / 10,
        balance: earmarkedBalance,
      });
    }
  });

  if (savBal > 0) {
    chartData.push({
      name: 'Gửi tiết kiệm',
      value: Math.round((savBal / totalObservedBalance) * 100 * 10) / 10,
      balance: savBal,
    });
  }

  const genericUnallocatedBalance = Math.max(0, rawObservedBalance - totalActiveCapital - totalEarmarkedCapital - savBal);
  const genericUnallocatedPercent = totalObservedBalance > 0
    ? (genericUnallocatedBalance / totalObservedBalance) * 100
    : 100;

  // Tiền mặt nhàn rỗi chung đã được loại bỏ khỏi biểu đồ theo yêu cầu

  // Calculate unallocated capital at the deal start date for validation
  const targetMonthRow = projection.monthlyRows.find(
    (r) => r.period.month === dealForm.startMonth && r.period.year === dealForm.startYear
  );
  
  const getAvailableFundingFor = (fundId: string) => {
    if (fundId === 'idle') {
      return targetMonthRow ? (targetMonthRow.portfolio.unallocatedEndingBalance ?? 0) : totalStartingBalance;
    }
    const fund = state.sinkingFunds?.find(f => f.id === fundId);
    if (!fund) return 0;
    
    // Sử dụng simulateSinkingFund để đảm bảo logic tính toán khớp 100% với SinkingFundCard và Projection
    const simResult = simulateSinkingFund(fund, dealForm.startMonth, dealForm.startYear);
    return simResult.totalPrincipal + simResult.nonTermCash;
  };
  
  const availableFunding = getAvailableFundingFor(dealForm.sourceFundId);
  const isDealCapitalOverLimit = dealForm.capital > availableFunding;

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="w-full">
          <h1 className="text-3xl font-serif font-bold text-family-text flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-family-accent" /> Danh mục Đầu tư
            <HelpTooltip text="Bảng điều khiển trung tâm quản lý cấu trúc tài sản đầu tư, đánh giá mức độ rủi ro và hiệu suất của các thương vụ." />
          </h1>
          <p className="text-sm text-family-textMuted mt-1">
            Quản lý và trực quan hóa phân bổ tài sản thực tế dựa trên danh sách thương vụ chi tiết.
          </p>
        </div>
        <ObservationControls />
      </div>
      


      {formError && <WarningBox type="danger" message={formError} />}

      {/* 4 KPI Cards: Portfolio Breakdown */}
      {(() => {
        const totalInvestable = activeRow ? activeRow.portfolio.totalEndingBalance : totalStartingBalance;
        const investedCapital = state.assets.reduce((sum, asset) => {
          return sum + (activeRow ? activeRow.portfolio.assets[asset.type].endingBalance : 0);
        }, 0);
        const plannedCapital = totalEarmarkedCapital;
        const savBal = activeRow?.portfolio.savingsBalance || 0;
        const savInterest = activeRow?.portfolio.savingsInterestAccrued || 0;
        const idleCash = activeRow ? (activeRow.portfolio.unallocatedEndingBalance || 0) : genericUnallocatedBalance;

        const cumContribution = activeRow?.portfolio.cumulativeContribution || 0;
        const cumPnl = activeRow?.portfolio.cumulativePnl || 0;

        return (
          <div className="space-y-4">
            {/* Top overview cards: Tổng NAV & P&L */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gradient-to-r from-family-accent/5 to-sky-500/5 border-family-accent/20">
                <CardContent className="py-4 px-6 flex justify-between items-center h-full">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">💼</span>
                      <h3 className="font-bold text-base text-family-text uppercase tracking-wide font-serif">
                        TỔNG NAV DANH MỤC
                      </h3>
                    </div>
                    <p className="text-xs text-family-textMuted max-w-[200px]">
                      Quy mô tài sản đầu tư tích lũy của gia đình.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-extrabold text-family-accent block">
                      {formatKpiMoneyVNDMillion(totalInvestable)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className={`border ${cumPnl >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <CardContent className="py-4 px-6 flex justify-between items-center h-full">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{cumPnl >= 0 ? '📈' : '📉'}</span>
                      <h3 className={`font-bold text-base uppercase tracking-wide font-serif ${cumPnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        LÃI / LỖ ĐÃ CHỐT (REALIZED)
                      </h3>
                    </div>
                    <p className={`text-xs ${cumPnl >= 0 ? 'text-emerald-500/70' : 'text-red-500/70'}`}>
                      Lợi nhuận từ các thương vụ đã tất toán
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-3xl font-extrabold block ${cumPnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {cumPnl >= 0 ? '+' : ''}{formatKpiMoneyVNDMillion(cumPnl)}
                    </span>
                    {totalInvestable > 0 && (
                      <p className={`text-[11px] font-bold mt-1 ${cumPnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        ROI: {cumPnl >= 0 ? '+' : ''}{((cumPnl / (totalInvestable - cumPnl)) * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* KPI 1: Vốn gốc khởi điểm */}
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/50">
                <CardContent className="py-4 px-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">💰</span>
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Vốn gốc khởi điểm</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={state.profile.startingCapital ?? 0}
                      onChange={(e) => {
                        const val = Math.max(0, safeNumber(Number(e.target.value), 0));
                        updateProfile({ ...state.profile, startingCapital: val });
                      }}
                      className="w-24 text-lg font-bold text-amber-800 bg-white/80 rounded-lg border border-amber-200 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400 placeholder-amber-800/50"
                      placeholder="VD: 500"
                    />
                    <span className="text-xs font-semibold text-amber-600">triệu VND</span>
                  </div>
                  <p className="text-[10px] text-amber-600/70 mt-1.5">Tại mốc {state.profile.planningStartMonth}/{state.profile.planningStartYear}</p>
                </CardContent>
              </Card>

              {/* KPI 2: Đã đầu tư */}
              <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200/50">
                <CardContent className="py-4 px-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">📈</span>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Đã đầu tư</span>
                  </div>
                  <p className="text-xl font-bold text-emerald-800">{formatKpiMoneyVNDMillion(investedCapital)}</p>
                  <p className="text-[10px] text-emerald-600/70 mt-1.5">
                    {(state.investmentDeals || []).filter(d => {
                      const start = d.startYear * 12 + d.startMonth;
                      const end = d.status === 'settled' && d.endYear && d.endMonth
                        ? d.endYear * 12 + d.endMonth
                        : Infinity;
                      const current = activeRow ? activeRow.period.year * 12 + activeRow.period.month : 0;
                      return current >= start && current <= end && d.status === 'active';
                    }).length} thương vụ đang hoạt động
                  </p>
                </CardContent>
              </Card>

              {/* KPI 3: Quỹ tích lũy mục tiêu */}
              <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200/50">
                <CardContent className="py-4 px-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🎯</span>
                    <span className="text-[10px] font-bold text-violet-700 uppercase tracking-wider">Quỹ tích lũy mục tiêu</span>
                  </div>
                  <p className="text-xl font-bold text-violet-800">{formatKpiMoneyVNDMillion(plannedCapital)}</p>
                  <p className="text-[10px] text-violet-600/70 mt-1.5">
                    {(state.sinkingFunds || []).filter(f => {
                      if (f.fundType !== 'investment') return false;
                      const start = f.startYear * 12 + f.startMonth;
                      const end = f.status === 'disbursed' && f.disbursedYear && f.disbursedMonth
                        ? f.disbursedYear * 12 + f.disbursedMonth
                        : Infinity;
                      const current = activeRow ? activeRow.period.year * 12 + activeRow.period.month : 0;
                      return current >= start && current <= end && f.status === 'active';
                    }).length} quỹ đang tích lũy
                  </p>
                </CardContent>
              </Card>

              {/* KPI 4: Chưa có kế hoạch */}
              <Card className="bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200/50">
                <CardContent className="py-4 px-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🏦</span>
                    <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider">Chưa có kế hoạch</span>
                  </div>
                  <p className="text-xl font-bold text-sky-800">{formatKpiMoneyVNDMillion(idleCash)}</p>
                  <p className="text-[10px] text-sky-600/70 mt-1.5 leading-tight">
                    Nguồn vốn chính để tạo thương vụ, tự động trích lập từ Ngân sách Đầu tư hàng tháng.{savBal > 0 ? ` (Bao gồm ${formatKpiMoneyVNDMillion(savBal)} đang gửi tiết kiệm)` : ''}
                  </p>
                </CardContent>
              </Card>
            </div>

          </div>
        );
      })()}

      {/* Tổng quan nhanh + Biểu đồ */}
      <div className="space-y-6">
            <>
              {/* Assets summary table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Danh sách phân bổ các lớp tài sản
                    <HelpTooltip text="Thống kê chi tiết vốn gốc và lãi lỗ dự kiến phân bổ cho từng loại tài sản." />
                  </CardTitle>
                  <CardDescription>
                    Tổng số dư tích lũy tại mốc quan sát: <strong className="text-family-text">{formatKpiMoneyVNDMillion(totalObservedBalance)}</strong> (Vốn gốc khởi điểm: {formatKpiMoneyVNDMillion(totalStartingBalance)}).
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-family-accent/10 text-family-textMuted font-bold bg-family-bgDark/30">
                        <th className="p-3">Lớp tài sản</th>
                        <th className="p-3">Số dư tích lũy</th>
                        <th className="p-3">Tỷ trọng thực tế</th>
                        <th className="p-3">Số thương vụ chạy</th>
                        <th className="p-3">Vốn đầu tư</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.assets.map((asset) => {
                        const assetBalance = activeRow
                          ? activeRow.portfolio.assets[asset.type].endingBalance
                          : 0;
                        
                        const actualPercent = totalObservedBalance > 0
                          ? (assetBalance / totalObservedBalance) * 100
                          : 0;

                        const assetObservedDeals = globalObservedDeals.filter(d => d.assetType === asset.type);
                        const activeDealsCount = assetObservedDeals.length;
                        const activeDealsCapital = assetObservedDeals.reduce((sum, d) => sum + d.capital, 0);

                        const earmarkedBalance = activeRow
                          ? (activeRow.portfolio.assets[asset.type].earmarkedEndingBalance || 0)
                          : 0;
                        const earmarkedPercent = totalObservedBalance > 0 ? (earmarkedBalance / totalObservedBalance) * 100 : 0;
                        
                        const assetObservedSinkingFunds = globalObservedSinkingFunds.filter(sf => sf.targetAssetType === asset.type);
                        const earmarkedDealsCount = assetObservedSinkingFunds.length;
                        const earmarkedDealsCapital = 0; // The actual accumulated balance is earmarkedBalance

                        return (
                    <React.Fragment key={asset.type}>
                      <tr className="border-b border-family-accent/5 hover:bg-family-bgDark/10">
                        <td className="p-3 font-semibold text-family-text">{asset.name}</td>
                        <td className="p-3 font-medium">{formatTableMoneyVNDMillion(assetBalance)}</td>
                        <td className="p-3 font-bold text-family-accent">{actualPercent.toFixed(1)}%</td>
                        <td className="p-3 font-semibold text-family-text">{activeDealsCount} thương vụ</td>
                        <td className="p-3 font-medium text-family-textMuted">{formatTableMoneyVNDMillion(activeDealsCapital)}</td>
                      </tr>
                      {earmarkedBalance > 0 && (
                        <tr className="border-b border-family-accent/5 bg-slate-500/5 hover:bg-slate-500/10">
                          <td className="p-3 font-semibold text-slate-500 pl-8">↳ {asset.name} (Chờ pb)</td>
                          <td className="p-3 font-medium text-slate-500">{formatTableMoneyVNDMillion(earmarkedBalance)}</td>
                          <td className="p-3 font-bold text-slate-500">{earmarkedPercent.toFixed(1)}%</td>
                          <td className="p-3 text-slate-400 font-semibold">{earmarkedDealsCount} thương vụ</td>
                          <td className="p-3 text-slate-400 font-medium">{formatTableMoneyVNDMillion(earmarkedDealsCapital)}</td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {savBal > 0 && (
                  <tr className="border-b border-sky-100/50 bg-sky-50/20 hover:bg-sky-50/40">
                    <td className="p-3 font-semibold text-sky-800">Gửi tiết kiệm ngân hàng</td>
                    <td className="p-3 font-medium text-sky-800">
                      {formatTableMoneyVNDMillion(savBal)}
                    </td>
                    <td className="p-3 font-bold text-sky-600">{((savBal / totalObservedBalance) * 100).toFixed(1)}%</td>
                    <td className="p-3 text-slate-400 font-bold">---</td>
                    <td className="p-3 text-slate-400 font-medium">---</td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
            <ExpertPortfolioCharts 
              assets={state.assets}
              activeRow={activeRow}
              totalObservedBalance={totalObservedBalance}
              genericUnallocatedBalance={genericUnallocatedBalance}
              savBal={savBal}
              observedDeals={globalObservedDeals}
              observedSinkingFunds={globalObservedSinkingFunds}
            />

            {/* Charts BI Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="flex flex-col justify-between">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Biểu đồ tỷ trọng thực tế
                    <HelpTooltip text="Cơ cấu danh mục đầu tư hiện tại so với tổng tài sản quan sát được." />
                  </CardTitle>
                  <CardDescription>Cơ cấu phân bổ tài sản tại mốc quan sát.</CardDescription>
                </CardHeader>
                <CardContent className="h-64 flex items-center justify-center">
                  {totalObservedBalance > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any, name: any, props: any) => [`${value}% (${formatTableMoneyVNDMillion(props.payload.balance)})`, name]} />
                        <Legend wrapperStyle={{ fontSize: 11, paddingTop: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState title="Không có biểu đồ" description="Vui lòng thiết lập vốn khởi điểm lớn hơn 0." />
                  )}
                </CardContent>
              </Card>

              <Card className="flex flex-col justify-between border-family-accent/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Cân bằng rủi ro (Actual vs Target)
                    <HelpTooltip text="Kiểm tra xem tỷ trọng phân bổ thực tế có bám sát với cấu trúc tài chính mục tiêu hay không." />
                  </CardTitle>
                  <CardDescription>So sánh phân bổ thực tế so với Tỷ trọng kỳ vọng (Target).</CardDescription>
                </CardHeader>
                <CardContent className="h-64 flex items-center justify-center">
                  {totalObservedBalance > 0 ? (
                    <PortfolioRadarChart assets={state.assets} chartData={chartData} />
                  ) : (
                    <EmptyState title="Không có dữ liệu" description="Vui lòng cập nhật vốn khởi điểm" />
                  )}
                </CardContent>
              </Card>
            </div>
          </>
      </div>

      {/* Sinking Funds */}
      <div className="flex flex-col gap-6 mt-6">
        <SinkingFundModule_Portfolio filterFundType="investment" />
      </div>


      {/* Deals Tracking Section */}
      <Card className="border-family-accent/20 mt-6">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="w-full md:w-3/4">
            <CardTitle className="text-xl font-serif font-bold text-family-text flex items-center gap-2">
              🤝 Quản lý Thương vụ đầu tư chi tiết (Deals Tracking)
              <HelpTooltip text="Theo dõi các khoản đầu tư cụ thể (bất động sản, cổ phiếu...) với dòng tiền và lãi vốn." />
            </CardTitle>
            <div className="flex items-center justify-between">
              <p className="text-xs text-family-textMuted">
                Theo dõi chi tiết hoạt động đầu tư thực tế của vợ chồng. Lợi nhuận/Lỗ chỉ khi **Tất toán** mới được tái đầu tư vào các lớp tài sản.
              </p>
              <Button onClick={() => { 
                setEditDealId(null);
                setDealForm({ name: '', assetType: 'stocks', capital: 0, startMonth: activeRow ? activeRow.period.month : 10, startYear: activeRow ? activeRow.period.year : 2026, notes: '', sourceFundId: 'idle', dealType: 'capital_gain', cashflowYieldAnnual: 5, createPassiveIncome: false, quantity: '', purchasePrice: '' });
                setShowAddDealForm(!showAddDealForm); 
              }} size="sm" className="gap-1 text-xs py-1 h-8 shrink-0">
                <PlusCircle className="w-3.5 h-3.5" /> Thêm thương vụ
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Add Deal Form */}
          {showAddDealForm && (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (dealForm.createPassiveIncome && dealForm.dealType === 'cash_flow') {
                  addIncomeItem({
                    effectiveMonth: dealForm.startMonth,
                    effectiveYear: dealForm.startYear,
                    incomeMonthly: Math.round((dealForm.capital * (dealForm.cashflowYieldAnnual / 100) / 12) * 10) / 10,
                    incomeType: 'passive_income',
                    note: `Từ tài sản: ${dealForm.name}`,
                    status: 'active'
                  });
                }
                
                if (editDealId) {
                  const deal = state.investmentDeals?.find(d => d.id === editDealId);
                  if (deal) {
                    updateInvestmentDeal({
                      ...deal,
                      name: dealForm.name,
                      assetType: dealForm.assetType,
                      capital: dealForm.capital,
                      startMonth: dealForm.startMonth,
                      startYear: dealForm.startYear,
                      notes: dealForm.notes,
                      dealType: dealForm.dealType,
                      cashflowYieldAnnual: dealForm.dealType === 'cash_flow' ? dealForm.cashflowYieldAnnual : undefined,
                      cashflowTrackedInIncome: dealForm.createPassiveIncome && dealForm.dealType === 'cash_flow' ? true : deal.cashflowTrackedInIncome,
                      quantity: dealForm.quantity !== '' ? Number(dealForm.quantity) : undefined,
                      purchasePrice: dealForm.purchasePrice !== '' ? Number(dealForm.purchasePrice) : undefined,
                    });
                  }
                } else {
                  // Atomic state update to prevent race conditions
                  const nextState = { ...state };
                  const newDealId = `deal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                  
                  const newDeal: any = {
                    id: newDealId,
                    name: dealForm.name,
                    assetType: dealForm.assetType,
                    capital: dealForm.capital,
                    startMonth: dealForm.startMonth,
                    startYear: dealForm.startYear,
                    status: 'active',
                    notes: dealForm.notes,
                    dealType: dealForm.dealType,
                    cashflowYieldAnnual: dealForm.dealType === 'cash_flow' ? dealForm.cashflowYieldAnnual : undefined,
                    cashflowTrackedInIncome: dealForm.createPassiveIncome && dealForm.dealType === 'cash_flow' ? true : undefined,
                    quantity: dealForm.quantity !== '' ? Number(dealForm.quantity) : undefined,
                    purchasePrice: dealForm.purchasePrice !== '' ? Number(dealForm.purchasePrice) : undefined,
                  };
                  
                  nextState.investmentDeals = [...(nextState.investmentDeals || []), newDeal];

                  if (dealForm.sourceFundId !== 'idle') {
                    const fundBalance = getAvailableFundingFor(dealForm.sourceFundId);
                    
                    if (dealForm.capital < fundBalance) {
                      // Nếu số tiền đầu tư < số dư quỹ -> Rút một phần, không khóa quỹ
                      const newWithdrawal = {
                        id: `w_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                        month: dealForm.startMonth,
                        year: dealForm.startYear,
                        amount: dealForm.capital,
                        note: `Giải ngân một phần vào thương vụ: ${dealForm.name}`
                      };
                      nextState.sinkingFunds = (nextState.sinkingFunds || []).map(f => 
                        f.id === dealForm.sourceFundId 
                          ? { ...f, withdrawals: [...(f.withdrawals || []), newWithdrawal] } 
                          : f
                      );
                    } else {
                      // Nếu đầu tư >= số dư quỹ -> Tất toán (khóa) toàn bộ quỹ
                      nextState.sinkingFunds = (nextState.sinkingFunds || []).map(f => 
                        f.id === dealForm.sourceFundId 
                          ? { ...f, status: 'disbursed', disbursedMonth: dealForm.startMonth, disbursedYear: dealForm.startYear } 
                          : f
                      );
                    }
                  }
                  updateAppState(nextState);
                }
                setDealForm({ name: '', assetType: 'stocks', capital: 0, startMonth: 10, startYear: 2026, notes: '', sourceFundId: 'idle', dealType: 'capital_gain', cashflowYieldAnnual: 5, createPassiveIncome: false, quantity: '', purchasePrice: '' });
                setShowAddDealForm(false);
                setEditDealId(null);
              }}
              className="bg-family-bgDark/35 p-4 rounded-xl border border-family-accent/10 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-family-text mb-1">Tên thương vụ</label>
                  <input
                    type="text"
                    value={dealForm.name}
                    onChange={(e) => { setDealForm({ ...dealForm, name: e.target.value }); }}
                    placeholder="Ví dụ: Cổ phiếu VIX"
                    required
                    className="w-full text-xs bg-white rounded-xl border border-family-accent/15 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-family-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-family-text mb-1">Lớp tài sản</label>
                  <select
                    value={dealForm.assetType}
                    onChange={(e) => { 
                      const newAssetType = e.target.value as AssetType;
                      setDealForm({ 
                        ...dealForm, 
                        assetType: newAssetType,
                        dealType: newAssetType !== 'real_estate' ? 'capital_gain' : dealForm.dealType
                      }); 
                    }}
                    className="w-full text-xs bg-white rounded-xl border border-family-accent/15 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-family-accent"
                  >
                    <option value="stocks">Chứng Khoán</option>
                    <option value="real_estate">Bất Động Sản</option>
                    <option value="gold">Vàng</option>
                    <option value="fx_reserve_usd">Dự trữ ngoại hối (USD)</option>
                    <option value="crypto">Crypto</option>
                  </select>
                </div>
                
                {dealForm.assetType !== 'real_estate' && dealForm.assetType !== 'fx_reserve_usd' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-family-text mb-1">
                        {dealForm.assetType === 'stocks' ? 'Số lượng (Cổ phiếu)' : dealForm.assetType === 'crypto' ? 'Số lượng (Coin/Token)' : 'Số lượng (Chỉ/Lượng)'}
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={dealForm.quantity}
                        onChange={(e) => {
                          const q = e.target.value === '' ? '' : Number(e.target.value);
                          const p = dealForm.purchasePrice;
                          const newCap = (q !== '' && p !== '') ? Number(((q * Number(p)) / 1000000).toFixed(2)) : dealForm.capital;
                          setDealForm({ ...dealForm, quantity: q, capital: newCap });
                        }}
                        placeholder="VD: 1000"
                        className="w-full text-xs bg-white rounded-xl border border-family-accent/15 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-family-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-family-text mb-1">Đơn giá mua (VND)</label>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={dealForm.purchasePrice}
                        onChange={(e) => {
                          const p = e.target.value === '' ? '' : Number(e.target.value);
                          const q = dealForm.quantity;
                          const newCap = (q !== '' && p !== '') ? Number(((Number(q) * p) / 1000000).toFixed(2)) : dealForm.capital;
                          setDealForm({ ...dealForm, purchasePrice: p, capital: newCap });
                        }}
                        placeholder="VD: 25000"
                        className="w-full text-xs bg-white rounded-xl border border-family-accent/15 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-family-accent"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold text-family-text mb-1">
                    Vốn đầu tư (triệu VND)
                  </label>
                  <input
                    type="number"
                    value={dealForm.capital === 0 ? '' : dealForm.capital}
                    placeholder="VD: 500"
                    onChange={(e) => { 
                      setDealForm({ ...dealForm, capital: Math.max(0, safeNumber(Number(e.target.value), 0)) }); 
                    }}
                    required
                    readOnly={dealForm.assetType !== 'real_estate' && dealForm.assetType !== 'fx_reserve_usd' && dealForm.quantity !== '' && dealForm.purchasePrice !== ''}
                    className={`w-full text-xs bg-white rounded-xl border border-family-accent/15 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-family-accent ${
                      dealForm.assetType !== 'real_estate' && dealForm.assetType !== 'fx_reserve_usd' && dealForm.quantity !== '' && dealForm.purchasePrice !== ''
                        ? 'bg-gray-100 cursor-not-allowed text-gray-500' 
                        : ''
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-family-text mb-1">Tháng bắt đầu</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={dealForm.startMonth || ''}
                    onChange={(e) => { setDealForm({ ...dealForm, startMonth: safeNumber(Number(e.target.value), 10) }); }}
                    required
                    className="w-full text-xs bg-white rounded-xl border border-family-accent/15 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-family-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-family-text mb-1">Năm bắt đầu</label>
                  <input
                    type="number"
                    min={2020}
                    max={2060}
                    value={dealForm.startYear || ''}
                    onChange={(e) => { setDealForm({ ...dealForm, startYear: safeNumber(Number(e.target.value), 2026) }); }}
                    required
                    className="w-full text-xs bg-white rounded-xl border border-family-accent/15 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-family-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 p-3 bg-family-accent/5 rounded-xl border border-family-accent/10">
                <div>
                  <label className="block text-xs font-semibold text-family-text mb-1">Hình thức đầu tư</label>
                  <select
                    value={dealForm.dealType}
                    onChange={(e) => { setDealForm({ ...dealForm, dealType: e.target.value as 'capital_gain' | 'cash_flow' }); }}
                    className="w-full text-xs bg-white rounded-xl border border-family-accent/15 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-family-accent"
                  >
                    <option value="capital_gain">Đầu tư Giá vốn (Lãi/lỗ khi bán)</option>
                    {dealForm.assetType === 'real_estate' && (
                      <option value="cash_flow">Đầu tư Dòng tiền (Cổ tức, tiền thuê)</option>
                    )}
                  </select>
                </div>
                {dealForm.dealType === 'cash_flow' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-family-text mb-1">Tỷ suất dòng tiền hàng năm (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={dealForm.cashflowYieldAnnual || ''}
                        onChange={(e) => { setDealForm({ ...dealForm, cashflowYieldAnnual: Math.max(0, safeNumber(Number(e.target.value), 0)) }); }}
                        className="w-full text-xs bg-white rounded-xl border border-family-accent/15 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-family-accent"
                        placeholder="Không bắt buộc với Cổ phiếu"
                      />
                    </div>
                    {!editDealId && (
                      <div className="flex items-center gap-2 pt-2 md:col-span-2">
                        <input
                          type="checkbox"
                          id="createPassiveIncome"
                          checked={dealForm.createPassiveIncome}
                          onChange={(e) => { setDealForm({ ...dealForm, createPassiveIncome: e.target.checked }); }}
                          className="w-4 h-4 text-green-700 rounded border-family-accent/20 cursor-pointer"
                        />
                        <label htmlFor="createPassiveIncome" className="text-xs font-semibold text-green-700 cursor-pointer">
                          Tự động tạo Thu nhập thụ động vào Kế hoạch Thu nhập hàng tháng
                        </label>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <div className="flex flex-col gap-3 mt-2">
                <div>
                  <label className="block text-xs font-semibold text-family-text mb-1">Nguồn tiền đầu tư mặc định</label>
                  <div className="w-full text-xs bg-gray-50 rounded-xl border border-family-accent/15 px-3 py-2 text-gray-600">
                    Ngân sách Đầu tư nhàn rỗi ({formatTableMoneyVNDMillion(getAvailableFundingFor('idle'))})
                  </div>
                  <p className="text-[10px] text-family-textMuted mt-1 italic">
                    *Khoản vốn này sẽ được trích trực tiếp từ Ngân sách Đầu tư Nhàn rỗi chưa phân bổ.
                  </p>
                </div>
              </div>
              
              {isDealCapitalOverLimit && (
                <WarningBox 
                  type="danger" 
                  message={`Số vốn đầu tư vượt quá số dư của nguồn tiền đã chọn tại thời điểm tháng ${dealForm.startMonth}/${dealForm.startYear} (Số dư khả dụng: ${availableFunding.toFixed(1)} triệu VND).`} 
                />
              )}

              <div>
                <label className="block text-xs font-semibold text-family-text mb-1">Ghi chú thêm</label>
                <input
                  type="text"
                  value={dealForm.notes}
                  onChange={(e) => { setDealForm({ ...dealForm, notes: e.target.value }); }}
                  placeholder="Ghi chú về tài khoản mua, mục tiêu thương vụ..."
                  className="w-full text-xs bg-white rounded-xl border border-family-accent/15 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-family-accent"
                />
              </div>
              <div className="flex justify-end gap-2 text-xs">
                <Button variant="outline" size="sm" onClick={() => { setShowAddDealForm(false); setEditDealId(null); }}>Hủy</Button>
                <Button type="submit" size="sm" disabled={isDealCapitalOverLimit || dealForm.capital <= 0 || !dealForm.name.trim()}>
                  {editDealId ? 'Cập nhật thương vụ' : 'Tạo thương vụ mới'}
                </Button>
              </div>
            </form>
          )}

          {/* Active Deals Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-family-accent flex items-center gap-1.5">
              <span>🟢</span> Thương vụ đang hoạt động ({globalObservedDeals.length})
            </h4>
            <div className="overflow-x-auto border border-family-accent/10 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-family-accent/10 text-family-textMuted font-bold bg-family-bgDark/20">
                    <th className="p-3">Thương vụ</th>
                    <th className="p-3">Lớp tài sản</th>
                    <th className="p-3">Vốn đầu tư</th>
                    <th className="p-3">Thời điểm bắt đầu</th>
                    <th className="p-3 font-medium">Ghi chú</th>
                    <th className="p-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {(!globalObservedDeals || globalObservedDeals.length === 0) ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-family-textMuted font-medium italic bg-family-bgDark/5">
                        Không có thương vụ nào đang hoạt động. Hãy thêm thương vụ đầu tiên!
                      </td>
                    </tr>
                  ) : (
                    globalObservedDeals
                      .map((deal) => {
                        const isSettling = settlingDealId === deal.id;
                        const current = activeRow ? activeRow.period.year * 12 + activeRow.period.month : 0;
                        const isOriginallyEarmarked = deal.isEarmarked || deal.isConverted;
                        const dealStart = deal.startYear * 12 + deal.startMonth;
                        const hasStarted = current >= dealStart;

                        let latestEventYear = deal.startYear;
                        let latestEventMonth = deal.startMonth;
                        if (deal.withdrawals) {
                          deal.withdrawals.forEach(w => {
                            if (w.year > latestEventYear || (w.year === latestEventYear && w.month > latestEventMonth)) {
                              latestEventYear = w.year;
                              latestEventMonth = w.month;
                            }
                          });
                        }
                        if (deal.cashflowEvents) {
                          deal.cashflowEvents.forEach(c => {
                            if (c.year > latestEventYear || (c.year === latestEventYear && c.month > latestEventMonth)) {
                              latestEventYear = c.year;
                              latestEventMonth = c.month;
                            }
                          });
                        }
                        const latestEventAbsolute = latestEventYear * 12 + latestEventMonth;
                        const isLockedFromPastEdits = current > 0 && current < latestEventAbsolute;
                        
                        const hasTransactions = (deal.withdrawals && deal.withdrawals.length > 0) || (deal.cashflowEvents && deal.cashflowEvents.length > 0);

                        return (
                          <React.Fragment key={deal.id}>
                            <tr className="border-b border-family-accent/5 hover:bg-family-bgDark/5">
                              <td className="p-3">
                                <div className="font-semibold text-family-text">{deal.name}</div>
                                {deal.withdrawals && deal.withdrawals.length > 0 && (
                                  <div className="text-[10px] text-family-textMuted mt-1">
                                    Đã rút: {deal.withdrawals.length} lần ({deal.withdrawals.reduce((s, w) => s + w.amount, 0)}M)
                                  </div>
                                )}
                                {deal.cashflowEvents && deal.cashflowEvents.length > 0 && (
                                  <div className="text-[10px] text-green-700 mt-0.5">
                                    Đã nhận: {deal.cashflowEvents.reduce((s, e) => s + e.amount, 0)}M cổ tức
                                  </div>
                                )}
                              </td>
                              <td className="p-3 font-medium text-family-textMuted">
                                {deal.assetType === 'stocks' ? 'Chứng Khoán' :
                                 deal.assetType === 'real_estate' ? 'Bất Động Sản' :
                                 deal.assetType === 'gold' ? 'Vàng' :
                                 deal.assetType === 'crypto' ? 'Crypto' : 'USD'}
                                {(deal.dealType === 'cash_flow' || deal.realEstateType === 'cash_flow') && (
                                  <div className="text-[10px] text-green-700 bg-green-50 inline-block px-1 rounded ml-1">Dòng tiền</div>
                                )}
                              </td>
                              <td className="p-3">
                                <div className="font-bold text-family-accent">
                                  {deal.withdrawals && deal.withdrawals.length > 0 
                                    ? formatTableMoneyVNDMillion(Math.max(0, deal.capital - deal.withdrawals.reduce((s, w) => s + w.amount, 0))) 
                                    : formatTableMoneyVNDMillion(deal.capital)}
                                </div>
                                {deal.withdrawals && deal.withdrawals.length > 0 && (
                                  <div className="text-[10px] text-family-textMuted line-through">
                                    Gốc: {formatTableMoneyVNDMillion(deal.capital)}
                                  </div>
                                )}
                              </td>
                              <td className="p-3 font-semibold">{deal.startMonth < 10 ? `0${deal.startMonth}` : deal.startMonth}/{deal.startYear}</td>
                              <td className="p-3 text-family-textMuted max-w-[200px] truncate">
                                {deal.notes || '---'}
                              </td>
                              <td className="p-3 text-right space-x-2">
                                {deal.status === 'settled' ? (
                                  <span className="text-family-textMuted/50 text-[10px] font-medium italic">Đã chốt ({deal.endMonth}/{deal.endYear})</span>
                                ) : isLockedFromPastEdits ? (
                                  <span className="text-orange-500/80 text-[10px] font-medium italic">Đã có GD ở tương lai</span>
                                ) : (
                                  <>
                                    {hasStarted && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (cashflowDealId === deal.id) {
                                              setCashflowDealId(null);
                                            } else {
                                              setCashflowDealId(deal.id);
                                              setSettlingDealId(null);
                                              setCashflowForm({
                                                month: activeRow ? activeRow.period.month : deal.startMonth,
                                                year: activeRow ? activeRow.period.year : deal.startYear,
                                                amount: 0,
                                                type: 'cash_dividend',
                                                note: ''
                                              });
                                            }
                                          }}
                                          className={`text-[10px] font-bold py-1 px-2.5 rounded-lg text-white transition-all shadow-sm ${cashflowDealId === deal.id ? 'bg-slate-500' : 'bg-blue-600 hover:bg-blue-700'}`}
                                          title="Nhận cổ tức / Dòng tiền đột xuất"
                                        >
                                          {cashflowDealId === deal.id ? 'Hủy' : 'Nhận tiền'}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (isSettling) {
                                              setSettlingDealId(null);
                                            } else {
                                              setSettlingDealId(deal.id);
                                              setSettleForm({
                                                endMonth: activeRow ? activeRow.period.month : 12,
                                                endYear: activeRow ? activeRow.period.year : 2026,
                                                realizedProfit: 0,
                                                reinvestAsUnallocated: false,
                                                reinvestAssetType: deal.assetType,
                                                settleMode: 'full',
                                                partialWithdrawType: 'amount',
                                                partialWithdrawValue: 0,
                                              });
                                            }
                                          }}
                                          className={`text-[10px] font-bold py-1 px-2.5 rounded-lg text-white transition-all shadow-sm ${isSettling ? 'bg-slate-500' : 'bg-green-700 hover:bg-green-800'}`}
                                        >
                                          {isSettling ? 'Hủy' : 'Tất toán'}
                                        </button>
                                      </>
                                    )}
                                    {!hasTransactions && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => { 
                                            setEditDealId(deal.id);
                                            setDealForm({
                                              name: deal.name,
                                              assetType: deal.assetType,
                                              capital: deal.capital,
                                              startMonth: deal.startMonth,
                                              startYear: deal.startYear,
                                              notes: deal.notes || '',
                                              sourceFundId: 'idle',
                                              dealType: deal.dealType || deal.realEstateType || 'capital_gain',
                                              cashflowYieldAnnual: deal.cashflowYieldAnnual || 5,
                                              createPassiveIncome: false,
                                              quantity: deal.quantity || '',
                                              purchasePrice: deal.purchasePrice || '',
                                            });
                                            setShowAddDealForm(true);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                          }}
                                          className="text-blue-500 hover:text-blue-700 p-1 ml-1"
                                          title="Chỉnh sửa thương vụ"
                                        >
                                          Sửa
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => { deleteInvestmentDeal(deal.id); }}
                                          className="text-red-500 hover:text-red-700 p-1"
                                          title="Xóa thương vụ"
                                        >
                                          <Trash2 className="w-4 h-4 inline" />
                                        </button>
                                      </>
                                    )}
                                  </>
                                )}
                              </td>
                            </tr>
                            {isSettling && (
                              <tr className="bg-green-700/5 border-b border-family-accent/5">
                                <td colSpan={6} className="p-3">
                                  <div className="flex flex-wrap items-start gap-4 text-xs bg-white/70 p-3 rounded-xl border border-green-700/20">
                                    <div className="font-bold text-green-800 pt-2">Thông tin tất toán:</div>
                                    <div className="flex flex-col gap-3 flex-1">
                                      <div className="flex items-center gap-4 border-b border-green-700/10 pb-2">
                                        <div className="flex items-center gap-2">
                                          <label className="font-semibold text-family-text">Thời điểm:</label>
                                          <input
                                            type="number"
                                            min={1} max={12}
                                            value={settleForm.endMonth}
                                            onChange={(e) => { setSettleForm({ ...settleForm, endMonth: safeNumber(Number(e.target.value), 12) }); }}
                                            className="w-14 text-center bg-white rounded-lg border border-family-accent/15 p-1"
                                            required
                                          />
                                          <span>/</span>
                                          <input
                                            type="number"
                                            min={2020} max={2060}
                                            value={settleForm.endYear}
                                            onChange={(e) => { setSettleForm({ ...settleForm, endYear: safeNumber(Number(e.target.value), 2026) }); }}
                                            className="w-18 text-center bg-white rounded-lg border border-family-accent/15 p-1"
                                            required
                                          />
                                        </div>
                                        <div className="flex gap-3">
                                          <label className="flex items-center gap-1 cursor-pointer">
                                            <input 
                                              type="radio" name={`deal-settle-mode-${deal.id}`} value="full"
                                              checked={settleForm.settleMode === 'full'}
                                              onChange={() => { setSettleForm({ ...settleForm, settleMode: 'full' }); }}
                                            />
                                            <span className="font-semibold text-family-text">Tất toán toàn bộ</span>
                                          </label>
                                          <label className="flex items-center gap-1 cursor-pointer">
                                            <input 
                                              type="radio" name={`deal-settle-mode-${deal.id}`} value="partial"
                                              checked={settleForm.settleMode === 'partial'}
                                              onChange={() => { setSettleForm({ ...settleForm, settleMode: 'partial' }); }}
                                            />
                                            <span className="font-semibold text-family-text">Rút gốc 1 phần</span>
                                          </label>
                                        </div>
                                      </div>

                                      {settleForm.settleMode === 'partial' && (
                                        <div className="flex items-center gap-3">
                                          <select
                                            value={settleForm.partialWithdrawType}
                                            onChange={(e) => { setSettleForm({ ...settleForm, partialWithdrawType: e.target.value as 'amount' | 'percentage' }); }}
                                            className="bg-white rounded-lg border border-family-accent/15 p-1 font-semibold"
                                          >
                                            <option value="amount">Số tiền rút (triệu VND)</option>
                                            <option value="percentage">% gốc rút ra</option>
                                          </select>
                                          <input
                                            type="number" step="any" min="0"
                                            value={settleForm.partialWithdrawValue || ''}
                                            onChange={(e) => { setSettleForm({ ...settleForm, partialWithdrawValue: Math.max(0, safeNumber(Number(e.target.value), 0)) }); }}
                                            className="w-20 text-center bg-white rounded-lg border border-family-accent/15 p-1 font-bold text-green-700"
                                            placeholder="VD: 50"
                                          />
                                          {settleForm.partialWithdrawType === 'percentage' && (
                                            <span className="text-family-textMuted font-medium italic">
                                              ≈ {formatTableMoneyVNDMillion(deal.capital * (settleForm.partialWithdrawValue / 100))} VND
                                            </span>
                                          )}
                                        </div>
                                      )}

                                      <div className="flex items-center gap-2">
                                        <label className="font-semibold text-family-text">Lợi nhuận/Lỗ thực tế (triệu VND):</label>
                                        <input
                                          type="number"
                                          value={settleForm.realizedProfit}
                                          onChange={(e) => { setSettleForm({ ...settleForm, realizedProfit: safeNumber(Number(e.target.value), 0) }); }}
                                          className="w-24 text-center bg-white rounded-lg border border-family-accent/15 p-1 font-bold text-green-700"
                                          placeholder="VD: 20 hoặc -10"
                                          required
                                        />
                                        <span className="text-family-textMuted italic ml-2">
                                          {settleForm.settleMode === 'partial' ? '(Lợi nhuận của riêng phần rút)' : '(Lợi nhuận của toàn bộ thương vụ)'}
                                        </span>
                                      </div>


                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        let withdrawnCapital = 0;
                                        let currentCapital = deal.capital;
                                        if (deal.withdrawals) {
                                          currentCapital -= deal.withdrawals.reduce((sum, w) => sum + w.amount, 0);
                                        }

                                        if (settleForm.settleMode === 'partial') {
                                          withdrawnCapital = settleForm.partialWithdrawType === 'amount'
                                            ? settleForm.partialWithdrawValue
                                            : currentCapital * (settleForm.partialWithdrawValue / 100);
                                          
                                          if (withdrawnCapital > 0 && withdrawnCapital <= currentCapital) {
                                            withdrawInvestmentDeal(deal.id, withdrawnCapital, settleForm.realizedProfit, settleForm.endMonth, settleForm.endYear);
                                          } else {
                                            alert("Số tiền rút phải lớn hơn 0 và nhỏ hơn hoặc bằng số dư vốn hiện tại.");
                                            return;
                                          }
                                        } else {
                                          settleInvestmentDeal(deal.id, settleForm.endMonth, settleForm.endYear, settleForm.realizedProfit);

                                        }
                                        setSettlingDealId(null);
                                      }}
                                      disabled={!isWithinObservationPeriod(settleForm.endMonth, settleForm.endYear, selectedPeriodKey)}
                                      className="ml-auto bg-green-700 hover:bg-green-800 text-white font-bold py-1 px-4 rounded-lg shadow-sm disabled:opacity-50"
                                    >
                                      Xác nhận chốt
                                    </button>
                                  </div>
                                  {!isWithinObservationPeriod(settleForm.endMonth, settleForm.endYear, selectedPeriodKey) && (
                                    <div className="text-red-500 text-xs text-right mt-1 w-full">{getPeriodGuardMessage(selectedPeriodKey)}</div>
                                  )}
                                </td>
                              </tr>
                            )}
                            
                            {cashflowDealId === deal.id && (
                              <tr className="bg-blue-600/5 border-b border-family-accent/5">
                                <td colSpan={6} className="p-3">
                                  <div className="flex flex-wrap items-start gap-4 text-xs bg-white/70 p-3 rounded-xl border border-blue-600/20">
                                    <div className="font-bold text-blue-800 pt-2">Ghi nhận cổ tức/dòng tiền:</div>
                                    <div className="flex flex-col gap-3 flex-1">
                                      <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                          <label className="font-semibold text-family-text">Thời điểm:</label>
                                          <input
                                            type="number" min={1} max={12}
                                            value={cashflowForm.month}
                                            onChange={(e) => { setCashflowForm({ ...cashflowForm, month: safeNumber(Number(e.target.value), 12) }); }}
                                            className="w-14 text-center bg-white rounded-lg border border-family-accent/15 p-1"
                                            required
                                          />
                                          <span>/</span>
                                          <input
                                            type="number" min={2020} max={2060}
                                            value={cashflowForm.year}
                                            onChange={(e) => { setCashflowForm({ ...cashflowForm, year: safeNumber(Number(e.target.value), 2026) }); }}
                                            className="w-18 text-center bg-white rounded-lg border border-family-accent/15 p-1"
                                            required
                                          />
                                        </div>
                                        <div className="flex gap-3 ml-4">
                                          <label className="flex items-center gap-1 cursor-pointer">
                                            <input 
                                              type="radio" name={`cashflow-type-${deal.id}`} value="cash_dividend"
                                              checked={cashflowForm.type === 'cash_dividend'}
                                              onChange={() => { setCashflowForm({ ...cashflowForm, type: 'cash_dividend' }); }}
                                            />
                                            <span className="font-semibold text-family-text">Cổ tức Tiền mặt</span>
                                          </label>
                                          <label className="flex items-center gap-1 cursor-pointer">
                                            <input 
                                              type="radio" name={`cashflow-type-${deal.id}`} value="stock_dividend"
                                              checked={cashflowForm.type === 'stock_dividend'}
                                              onChange={() => { setCashflowForm({ ...cashflowForm, type: 'stock_dividend' }); }}
                                            />
                                            <span className="font-semibold text-family-text">Cổ tức Cổ phiếu</span>
                                          </label>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <label className="font-semibold text-family-text">
                                          {cashflowForm.type === 'cash_dividend' ? 'Số tiền nhận được (triệu VND):' : 'Giá trị cổ phiếu nhận được (triệu VND):'}
                                        </label>
                                        <input
                                          type="number" step="any" min="0"
                                          value={cashflowForm.amount || ''}
                                          onChange={(e) => { setCashflowForm({ ...cashflowForm, amount: Math.max(0, safeNumber(Number(e.target.value), 0)) }); }}
                                          className="w-24 text-center bg-white rounded-lg border border-family-accent/15 p-1 font-bold text-blue-700"
                                          placeholder="VD: 5"
                                          required
                                        />
                                        <span className="text-family-textMuted italic ml-2">
                                          {cashflowForm.type === 'cash_dividend' 
                                            ? '(Sẽ tự động cộng vào Ngân sách nhàn rỗi để tái đầu tư)' 
                                            : '(Sẽ tự động cộng dồn vào Vốn đầu tư của thương vụ này)'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <label className="font-semibold text-family-text">Ghi chú:</label>
                                        <input
                                          type="text"
                                          value={cashflowForm.note}
                                          onChange={(e) => { setCashflowForm({ ...cashflowForm, note: e.target.value }); }}
                                          className="flex-1 bg-white rounded-lg border border-family-accent/15 p-1"
                                          placeholder="Nhập ghi chú (nếu có)"
                                        />
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (cashflowForm.amount <= 0) {
                                          alert("Số tiền/giá trị cổ tức phải lớn hơn 0");
                                          return;
                                        }
                                        
                                        const eventId = Math.random().toString(36).substring(2, 9);
                                        const newEvent = {
                                          id: eventId,
                                          month: cashflowForm.month,
                                          year: cashflowForm.year,
                                          amount: cashflowForm.amount,
                                          type: cashflowForm.type,
                                          note: cashflowForm.note
                                        };
                                        
                                        const updatedCashflows = [...(deal.cashflowEvents || []), newEvent];
                                        updateInvestmentDeal({
                                          ...deal,
                                          cashflowEvents: updatedCashflows
                                        });
                                        
                                        setCashflowDealId(null);
                                      }}
                                      disabled={!isWithinObservationPeriod(cashflowForm.month, cashflowForm.year, selectedPeriodKey)}
                                      className="ml-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded-lg shadow-sm disabled:opacity-50"
                                    >
                                      Lưu
                                    </button>
                                  </div>
                                  {!isWithinObservationPeriod(cashflowForm.month, cashflowForm.year, selectedPeriodKey) && (
                                    <div className="text-red-500 text-xs text-right mt-1 w-full">{getPeriodGuardMessage(selectedPeriodKey)}</div>
                                  )}
                                </td>
                              </tr>
                            )}

                          </React.Fragment>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Settled Deals Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-family-textMuted flex items-center gap-1.5">
              <span>🏁</span> Nhật ký thương vụ đã tất toán ({globalSettledDeals.length})
            </h4>
            <div className="overflow-x-auto border border-family-accent/5 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-family-accent/10 text-family-textMuted font-bold bg-family-bgDark/15">
                    <th className="p-3">Thương vụ</th>
                    <th className="p-3">Lớp tài sản</th>
                    <th className="p-3">Thời điểm giữ</th>
                    <th className="p-3">Vốn đầu tư</th>
                    <th className="p-3">Lợi nhuận thực tế</th>
                    <th className="p-3">Hiệu suất (ROI)</th>
                    <th className="p-3">Return/year</th>
                    <th className="p-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {(!globalSettledDeals || globalSettledDeals.length === 0) ? (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-family-textMuted font-medium italic bg-family-bgDark/5">
                        Chưa có lịch sử thương vụ tất toán. Lợi nhuận chốt lời sẽ được tự động cộng vào tài sản lũy kế.
                      </td>
                    </tr>
                  ) : (
                    globalSettledDeals
                      .map((deal) => {
                        const roi = deal.capital > 0 ? (deal.realizedProfit ?? 0) / deal.capital * 100 : 0;
                        const holdingMonths = Math.max(1, (deal.endYear! - deal.startYear) * 12 + (deal.endMonth! - deal.startMonth) + 1);
                        const annualizedRoi = (roi / holdingMonths) * 12;

                        return (
                          <tr key={deal.id} className="border-b border-family-accent/5 hover:bg-family-bgDark/5">
                            <td className="p-3 font-semibold text-family-textMuted">{deal.name}</td>
                            <td className="p-3 font-medium text-family-textMuted">
                              {deal.assetType === 'stocks' ? 'Chứng Khoán' :
                               deal.assetType === 'real_estate' ? 'Bất Động Sản' :
                               deal.assetType === 'gold' ? 'Vàng' :
                               deal.assetType === 'crypto' ? 'Crypto' : 'USD'}
                            </td>
                            <td className="p-3 font-medium">
                              {deal.startMonth}/{deal.startYear} ➔ {deal.endMonth}/{deal.endYear}
                              <span className="block text-[10px] text-family-textMuted">{holdingMonths} tháng</span>
                            </td>
                            <td className="p-3 font-bold">{formatTableMoneyVNDMillion(deal.capital)}</td>
                            <td className={`p-3 font-bold ${deal.realizedProfit && deal.realizedProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                              {deal.realizedProfit && deal.realizedProfit >= 0 ? '+' : ''}{formatTableMoneyVNDMillion(deal.realizedProfit ?? 0)}
                            </td>
                            <td className={`p-3 font-bold ${roi >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                              {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                            </td>
                            <td className={`p-3 font-bold ${annualizedRoi >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                              {annualizedRoi >= 0 ? '+' : ''}{annualizedRoi.toFixed(1)}%/năm
                            </td>
                            <td className="p-3 text-right">
                              <span className="text-family-textMuted/50 font-normal">---</span>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};
