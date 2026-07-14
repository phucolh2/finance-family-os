import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { WarningBox } from '../components/ui/WarningBox';
import { EmptyState } from '../components/ui/EmptyState';
import { runProjection } from '../engines/projectionEngine';
import { formatTableMoneyVNDMillion, formatKpiMoneyVNDMillion } from '../utils/format';
import { safeNumber } from '../utils/math';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Briefcase, Save, RotateCcw, Edit3, Plus, Trash2, CheckCircle } from 'lucide-react';
import type { AssetConfig, AssetType } from '../types/portfolio';
import { ObservationControls } from '../components/ui/ObservationControls';

export const Portfolio: React.FC = () => {
  const { 
    state, 
    updateProfile,
    updateAssets, 
    resetToDefault, 
    selectedPeriodKey, 
    setSelectedPeriodKey,
    addInvestmentDeal,
    updateInvestmentDeal,
    deleteInvestmentDeal,
    settleInvestmentDeal,
    addSavingsDeposit,
    deleteSavingsDeposit,
    settleSavingsDepositEarly,
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
    projectionAdjustments: state.projectionAdjustments,
    lifeStages: state.lifeStages,
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
  const [dealForm, setDealForm] = useState({
    name: '',
    assetType: 'stocks' as AssetType,
    capital: 0,
    startMonth: 10,
    startYear: 2026,
    isEarmarked: false,
    expectedSavingRate: 5,
    savingTermMonths: 12,
    notes: '',
  });

  const [settlingDealId, setSettlingDealId] = useState<string | null>(null);
  const [settleForm, setSettleForm] = useState({
    endMonth: 10,
    endYear: 2027,
    realizedProfit: 0,
    reinvestAsUnallocated: false,
    reinvestAssetType: 'stocks' as AssetType,
  });

  const [convertingDealId, setConvertingDealId] = useState<string | null>(null);
  const [conversionForm, setConversionForm] = useState({
    month: 10,
    year: 2026,
    realizedSavingInterest: 0,
  });

  const [formError, setFormError] = useState<string | null>(null);

  // Savings Deposit form states
  const [settlingSavingsId, setSettlingSavingsId] = useState<string | null>(null);
  const [settleSavingsForm, setSettleSavingsForm] = useState({
    settledMonth: 10,
    settledYear: 2026,
    realizedInterest: 0,
  });
  const [showAddSavingsForm, setShowAddSavingsForm] = useState(false);
  const [savingsForm, setSavingsForm] = useState({
    name: '',
    principal: 0,
    interestRate: 5,
    termMonths: 12,
    startMonth: new Date().getMonth() + 1,
    startYear: new Date().getFullYear(),
    pool: 'idle' as 'idle' | 'planned',
  });

  const handleReset = () => {
    resetToDefault();
    setFormError(null);
  };

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

  const totalEarmarkedCapital = state.assets.reduce((sum, asset) => {
    return sum + (activeRow ? (activeRow.portfolio.assets[asset.type].earmarkedEndingBalance || 0) : 0);
  }, 0);

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

  if (genericUnallocatedPercent > 0.01) {
    chartData.push({
      name: 'Tiền nhàn rỗi (Chung)',
      value: Math.round(genericUnallocatedPercent * 10) / 10,
      balance: genericUnallocatedBalance,
    });
  }

  // Calculate unallocated capital at the deal start date for validation
  const targetMonthRow = projection.monthlyRows.find(
    (r) => r.period.month === dealForm.startMonth && r.period.year === dealForm.startYear
  );
  const unallocatedAtStart = targetMonthRow ? (targetMonthRow.portfolio.unallocatedEndingBalance ?? 0) : totalStartingBalance;
  const isDealCapitalOverLimit = dealForm.capital > unallocatedAtStart;

  // Calculate available savings pool balance for validation
  const savingsTargetMonthRow = projection.monthlyRows.find(
    (r) => r.period.month === savingsForm.startMonth && r.period.year === savingsForm.startYear
  );
  let availableSavingsPoolBalance = 0;
  if (savingsTargetMonthRow) {
    const port = savingsTargetMonthRow.portfolio;
    const invested = state.assets.reduce((sum, asset) => sum + port.assets[asset.type].endingBalance, 0);
    const planned = state.assets.reduce((sum, asset) => sum + (port.assets[asset.type].earmarkedEndingBalance || 0), 0);
    const idle = Math.max(0, port.totalEndingBalance - invested - planned);
    availableSavingsPoolBalance = savingsForm.pool === 'idle' ? idle : planned;
  } else {
    availableSavingsPoolBalance = totalStartingBalance;
  }
  const isSavingsOverLimit = savingsForm.principal > availableSavingsPoolBalance;

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="w-full">
          <h1 className="text-3xl font-serif font-bold text-family-text flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-family-accent" /> Đầu tư
          </h1>
          <p className="text-sm text-family-textMuted mt-1">
            Quản lý và trực quan hóa phân bổ tài sản thực tế dựa trên danh sách thương vụ chi tiết.
          </p>
        </div>
        <ObservationControls />
      </div>
      
      {/* Reset Actions Row */}
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" onClick={handleReset} className="gap-2">
          <RotateCcw className="w-4 h-4" /> Reset Mặc định
        </Button>
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
        const idleCash = Math.max(0, totalInvestable - investedCapital - plannedCapital - savBal);

        const cumContribution = activeRow?.portfolio.cumulativeContribution || 0;
        const cumPnl = activeRow?.portfolio.cumulativePnl || 0;

        return (
          <div className="space-y-4">
            {/* Top overview card: Tổng tiền được phân bổ đầu tư */}
            <Card className="bg-gradient-to-r from-family-accent/5 to-sky-500/5 border-family-accent/20">
              <CardContent className="py-4 px-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">💼</span>
                    <h3 className="font-bold text-base text-family-text uppercase tracking-wide font-serif">
                      TỔNG TIỀN ĐÃ PHÂN BỔ ĐẦU TƯ
                    </h3>
                  </div>
                  <p className="text-xs text-family-textMuted">
                    Tổng quy mô tài sản đầu tư tích lũy của gia đình tính đến tháng quan sát (gốc + đóng góp hàng tháng + lãi lũy kế).
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-2xl font-extrabold text-family-accent">
                    {formatKpiMoneyVNDMillion(totalInvestable)}
                  </span>
                  <p className="text-[10px] text-family-textMuted mt-0.5 font-semibold">
                    Chia thành 3 cấu phần: Đã đầu tư, Lên kế hoạch, Chưa có kế hoạch
                  </p>
                </div>
              </CardContent>
            </Card>

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
                      className="w-24 text-lg font-bold text-amber-800 bg-white/80 rounded-lg border border-amber-200 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                    <span className="text-xs font-semibold text-amber-600">Tr VND</span>
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
                      return current >= start && current <= end && d.status === 'active' && !d.isEarmarked;
                    }).length} thương vụ đang hoạt động
                  </p>
                </CardContent>
              </Card>

              {/* KPI 3: Đã lên kế hoạch */}
              <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200/50">
                <CardContent className="py-4 px-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">📋</span>
                    <span className="text-[10px] font-bold text-violet-700 uppercase tracking-wider">Đã lên kế hoạch</span>
                  </div>
                  <p className="text-xl font-bold text-violet-800">{formatKpiMoneyVNDMillion(plannedCapital)}</p>
                  <p className="text-[10px] text-violet-600/70 mt-1.5">
                    {(state.investmentDeals || []).filter(d => {
                      const start = d.startYear * 12 + d.startMonth;
                      const end = d.status === 'settled' && d.endYear && d.endMonth
                        ? d.endYear * 12 + d.endMonth
                        : Infinity;
                      const current = activeRow ? activeRow.period.year * 12 + activeRow.period.month : 0;
                      return current >= start && current <= end && d.isEarmarked && d.status === 'active';
                    }).length} khoản chờ phân bổ
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
                  <p className="text-[10px] text-sky-600/70 mt-1.5">
                    Tiền nhàn rỗi{savBal > 0 ? ` (${formatKpiMoneyVNDMillion(savBal)} đang gửi TK)` : ''}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Source of Funds Details */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 bg-family-accent/5 border border-family-accent/10 rounded-xl text-xs">
              <div className="font-semibold text-family-text flex items-center gap-1.5">
                <span>📊</span>
                Nguồn hình thành tổng tài sản tích lũy ({formatKpiMoneyVNDMillion(totalInvestable)}):
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-family-textMuted font-medium">
                <div>Vốn khởi điểm: <strong className="text-family-text">{formatKpiMoneyVNDMillion(state.profile.startingCapital ?? 0)}</strong></div>
                <div>+ Lũy kế đóng góp từ lương: <strong className="text-emerald-700">+{formatKpiMoneyVNDMillion(cumContribution)}</strong></div>
                <div>+ Lũy kế lãi/lỗ đầu tư phát sinh: <strong className={cumPnl >= 0 ? "text-emerald-700" : "text-red-600"}>{cumPnl >= 0 ? `+` : ``}{formatKpiMoneyVNDMillion(cumPnl)}</strong></div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tổng quan nhanh + Biểu đồ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assets summary table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Danh sách phân bổ các lớp tài sản</CardTitle>
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

                  // Find active deals in this asset class at the observed month
                  const observedDeals = state.investmentDeals?.filter((deal) => {
                    if (!activeRow) return false;
                    const isStarted = (deal.startYear < activeRow.period.year) || 
                                      (deal.startYear === activeRow.period.year && deal.startMonth <= activeRow.period.month);
                    const isNotEnded = deal.status === 'active' || 
                                       (deal.endYear !== undefined && deal.endMonth !== undefined && (deal.endYear > activeRow.period.year || 
                                       (deal.endYear === activeRow.period.year && deal.endMonth > activeRow.period.month)));
                    return isStarted && isNotEnded;
                  }) || [];

                  const activeDealsCount = observedDeals.filter(d => d.assetType === asset.type && !d.isEarmarked).length;
                  const activeDealsCapital = observedDeals.filter(d => d.assetType === asset.type && !d.isEarmarked).reduce((sum, d) => sum + d.capital, 0);

                  const earmarkedBalance = activeRow
                    ? (activeRow.portfolio.assets[asset.type].earmarkedEndingBalance || 0)
                    : 0;
                  const earmarkedPercent = totalObservedBalance > 0 ? (earmarkedBalance / totalObservedBalance) * 100 : 0;
                  const earmarkedDealsCount = observedDeals.filter(d => d.assetType === asset.type && d.isEarmarked).length;
                  const earmarkedDealsCapital = observedDeals.filter(d => d.assetType === asset.type && d.isEarmarked).reduce((sum, d) => sum + d.capital, 0);

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
                {genericUnallocatedPercent > 0.01 && (
                  <tr className="border-b border-family-accent/5 bg-slate-500/5 hover:bg-slate-500/10">
                    <td className="p-3 font-semibold text-slate-500">Tiền mặt nhàn rỗi (Chung)</td>
                    <td className="p-3 font-medium text-slate-500">
                      {formatTableMoneyVNDMillion(genericUnallocatedBalance)}
                    </td>
                    <td className="p-3 font-bold text-slate-500">{genericUnallocatedPercent.toFixed(1)}%</td>
                    <td className="p-3 text-slate-400 font-bold">---</td>
                    <td className="p-3 text-slate-400 font-medium">---</td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Pie Chart display */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardHeader>
              <CardTitle>Biểu đồ tỷ trọng thực tế</CardTitle>
              <CardDescription>Cơ cấu phân bổ tài sản tại mốc quan sát.</CardDescription>
            </CardHeader>
            <CardContent className="h-56 flex items-center justify-center">
              {totalObservedBalance > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name, props) => [`${value}% (${formatTableMoneyVNDMillion(props.payload.balance)})`, name]} />
                    <Legend wrapperStyle={{ fontSize: 9 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState title="Không có biểu đồ" description="Vui lòng thiết lập vốn khởi điểm lớn hơn 0." />
              )}
            </CardContent>
          </div>
        </Card>
      </div>

      {/* Savings Deposits Section */}
      <Card className="border-sky-200/30">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="w-full md:w-3/4">
            <CardTitle className="text-xl font-serif font-bold text-family-text flex items-center gap-2">
              🏦 Gửi Tiết kiệm Ngân hàng
            </CardTitle>
            <CardDescription className="w-full">
              Tạo các khoản gửi tiết kiệm từ phần tiền <strong>nhàn rỗi</strong> hoặc <strong>đã lên kế hoạch</strong>. Lãi suất tính từ thời điểm tạo khoản.
            </CardDescription>
          </div>
          <Button onClick={() => setShowAddSavingsForm(!showAddSavingsForm)} size="sm" className="gap-1 text-xs py-1 h-8 shrink-0">
            <Plus className="w-3.5 h-3.5" /> Tạo khoản tiết kiệm
          </Button>
        </CardHeader>
        <CardContent>
          {/* Add Savings Form */}
          {showAddSavingsForm && (
            <div className="mb-6 p-4 bg-sky-50/50 border border-sky-200/30 rounded-xl space-y-4">
              <h4 className="font-bold text-sm text-family-text">Tạo khoản Gửi tiết kiệm mới</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Input
                  label="Tên khoản"
                  value={savingsForm.name}
                  onChange={(e) => setSavingsForm({ ...savingsForm, name: e.target.value })}
                  placeholder="VD: Tiết kiệm VCB 12 tháng"
                />
                <Input
                  label="Số tiền gốc (Tr VND)"
                  type="number"
                  value={savingsForm.principal}
                  onChange={(e) => setSavingsForm({ ...savingsForm, principal: safeNumber(Number(e.target.value), 0) })}
                />
                <div>
                  <label className="block text-xs font-semibold text-family-textMuted uppercase tracking-wider mb-1">Kì hạn</label>
                  <select
                    className="block w-full rounded-xl border border-family-accent/20 bg-white/60 py-2.5 px-3 text-sm text-family-text focus:border-family-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-family-accent transition-colors"
                    value={savingsForm.termMonths}
                    onChange={(e) => setSavingsForm({ ...savingsForm, termMonths: Number(e.target.value) })}
                  >
                    <option value={1}>1 tháng</option>
                    <option value={3}>3 tháng</option>
                    <option value={6}>6 tháng</option>
                    <option value={9}>9 tháng</option>
                    <option value={12}>12 tháng</option>
                    <option value={18}>18 tháng</option>
                    <option value={24}>24 tháng</option>
                    <option value={36}>36 tháng</option>
                  </select>
                </div>
                <Input
                  label="Lãi suất (%/năm)"
                  type="number"
                  value={savingsForm.interestRate}
                  onChange={(e) => setSavingsForm({ ...savingsForm, interestRate: safeNumber(Number(e.target.value), 0) })}
                />
                <Input
                  label="Tháng bắt đầu"
                  type="number"
                  min={1}
                  max={12}
                  value={savingsForm.startMonth}
                  onChange={(e) => setSavingsForm({ ...savingsForm, startMonth: safeNumber(Number(e.target.value), 1) })}
                />
                <Input
                  label="Năm bắt đầu"
                  type="number"
                  min={2024}
                  max={2060}
                  value={savingsForm.startYear}
                  onChange={(e) => setSavingsForm({ ...savingsForm, startYear: safeNumber(Number(e.target.value), 2026) })}
                />
                <div>
                  <label className="block text-xs font-semibold text-family-textMuted uppercase tracking-wider mb-1">Nguồn vốn</label>
                  <select
                    className="block w-full rounded-xl border border-family-accent/20 bg-white/60 py-2.5 px-3 text-sm text-family-text focus:border-family-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-family-accent transition-colors"
                    value={savingsForm.pool}
                    onChange={(e) => setSavingsForm({ ...savingsForm, pool: e.target.value as 'idle' | 'planned' })}
                  >
                    <option value="idle">Chưa có kế hoạch</option>
                    <option value="planned">Đã lên kế hoạch</option>
                  </select>
                </div>
              </div>

              {isSavingsOverLimit && (
                <WarningBox 
                  type="danger" 
                  message={`Số tiền gửi (${savingsForm.principal} Tr VND) vượt quá số dư khả dụng của nguồn vốn "${savingsForm.pool === 'idle' ? 'Chưa có kế hoạch' : 'Đã lên kế hoạch'}" tại tháng ${savingsForm.startMonth}/${savingsForm.startYear} (Số dư khả dụng: ${availableSavingsPoolBalance.toFixed(1)} Tr VND).`} 
                />
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  className="gap-1"
                  disabled={isSavingsOverLimit || savingsForm.principal <= 0 || !savingsForm.name.trim()}
                  onClick={() => {
                    if (isSavingsOverLimit) return;
                    if (!savingsForm.name.trim()) {
                      setFormError('Vui lòng nhập tên khoản tiết kiệm.');
                      return;
                    }
                    if (savingsForm.principal <= 0) {
                      setFormError('Số tiền gốc phải lớn hơn 0.');
                      return;
                    }
                    addSavingsDeposit({
                      name: savingsForm.name.trim(),
                      principal: savingsForm.principal,
                      interestRateAnnual: savingsForm.interestRate,
                      termMonths: savingsForm.termMonths,
                      startMonth: savingsForm.startMonth,
                      startYear: savingsForm.startYear,
                      pool: savingsForm.pool,
                      status: 'active',
                    });
                    setShowAddSavingsForm(false);
                    setSavingsForm({ name: '', principal: 0, interestRate: 5, termMonths: 12, startMonth: new Date().getMonth() + 1, startYear: new Date().getFullYear(), pool: 'idle' });
                    setFormError(null);
                  }}
                >
                  <Save className="w-3.5 h-3.5" /> Lưu
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setShowAddSavingsForm(false)}>Hủy</Button>
              </div>
            </div>
          )}

          {/* Savings Deposits List */}
          {(state.savingsDeposits || []).length > 0 ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-sky-200/30 text-family-textMuted font-bold bg-sky-50/30">
                  <th className="p-3">Tên khoản</th>
                  <th className="p-3">Gốc</th>
                  <th className="p-3">Lãi suất</th>
                  <th className="p-3">Kì hạn</th>
                  <th className="p-3">Bắt đầu</th>
                  <th className="p-3">Đáo hạn</th>
                  <th className="p-3">Lãi dự kiến</th>
                  <th className="p-3">Nguồn</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {(state.savingsDeposits || []).map((dep) => {
                  const maturityMonth = ((dep.startMonth - 1 + dep.termMonths) % 12) + 1;
                  const maturityYear = dep.startYear + Math.floor((dep.startMonth - 1 + dep.termMonths) / 12);
                  
                  const current = activeRow ? activeRow.period.year * 12 + activeRow.period.month : 0;
                  const depStart = dep.startYear * 12 + dep.startMonth;
                  const depEnd = depStart + dep.termMonths;
                  
                  const isActive = current >= depStart && current < depEnd && dep.status === 'active';
                  const isSettledEarly = dep.status === 'settled_early';
                  const isSettling = settlingSavingsId === dep.id;
                  
                  // Calculate expected interest for the entire savings term
                  const expectedInterest = dep.principal * (dep.interestRateAnnual / 100 / 12) * dep.termMonths;
                  const displayInterest = isSettledEarly ? (dep.realizedInterest || 0) : expectedInterest;

                  return (
                    <React.Fragment key={dep.id}>
                      <tr className="border-b border-sky-100/50 hover:bg-sky-50/30">
                        <td className="p-3 font-semibold text-family-text">{dep.name}</td>
                        <td className="p-3 font-medium">{formatTableMoneyVNDMillion(dep.principal)}</td>
                        <td className="p-3 font-bold text-sky-600">{dep.interestRateAnnual}%/năm</td>
                        <td className="p-3">{dep.termMonths} tháng</td>
                        <td className="p-3">{dep.startMonth}/{dep.startYear}</td>
                        <td className="p-3 font-medium">
                          {isSettledEarly ? `${dep.settledMonth}/${dep.settledYear} (Tất toán)` : `${maturityMonth}/${maturityYear}`}
                        </td>
                        <td className="p-3 font-bold text-emerald-600">
                          +{formatTableMoneyVNDMillion(displayInterest)}
                          {isSettledEarly && <span className="text-[10px] text-orange-600 font-semibold block">(thực nhận)</span>}
                        </td>
                        <td className="p-3">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${dep.pool === 'idle' ? 'bg-sky-100 text-sky-700' : 'bg-violet-100 text-violet-700'}`}>
                            {dep.pool === 'idle' ? 'Nhàn rỗi' : 'Kế hoạch'}
                          </span>
                        </td>
                        <td className="p-3">
                          {isSettledEarly ? (
                            <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">Tất toán trước hạn</span>
                          ) : isActive ? (
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">Đang chạy</span>
                          ) : current >= depEnd ? (
                            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">Đã đáo hạn</span>
                          ) : (
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Chưa bắt đầu</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            {isActive && (
                              <button
                                onClick={() => {
                                  setSettlingSavingsId(dep.id);
                                  setSettleSavingsForm({
                                    settledMonth: activeRow ? activeRow.period.month : dep.startMonth,
                                    settledYear: activeRow ? activeRow.period.year : dep.startYear,
                                    realizedInterest: 0,
                                  });
                                }}
                                className="p-1 rounded-md text-sky-600 hover:text-sky-850 hover:bg-sky-50 transition-all"
                                title="Tất toán trước hạn"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteSavingsDeposit(dep.id)}
                              className="p-1 rounded-md text-family-textMuted hover:text-red-500 hover:bg-red-500/10 transition-all"
                              title="Xóa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isSettling && (
                        <tr className="bg-sky-50/50 border-b border-sky-100/50">
                          <td colSpan={10} className="p-3">
                            <div className="flex flex-wrap items-center gap-4 text-xs bg-white/80 p-3 rounded-xl border border-sky-200">
                              <div className="font-bold text-sky-800">Thông tin tất toán trước hạn:</div>
                              <div className="flex items-center gap-2">
                                <label className="font-semibold text-family-text">Tháng chốt:</label>
                                <input
                                  type="number"
                                  min={1}
                                  max={12}
                                  value={settleSavingsForm.settledMonth}
                                  onChange={(e) => setSettleSavingsForm({ ...settleSavingsForm, settledMonth: safeNumber(Number(e.target.value), 12) })}
                                  className="w-14 text-center bg-white rounded-lg border border-sky-205 p-1"
                                  required
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="font-semibold text-family-text">Năm chốt:</label>
                                <input
                                  type="number"
                                  min={2020}
                                  max={2060}
                                  value={settleSavingsForm.settledYear}
                                  onChange={(e) => setSettleSavingsForm({ ...settleSavingsForm, settledYear: safeNumber(Number(e.target.value), 2026) })}
                                  className="w-18 text-center bg-white rounded-lg border border-sky-205 p-1"
                                  required
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="font-semibold text-family-text">Lãi thực tế nhận được:</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={settleSavingsForm.realizedInterest}
                                  onChange={(e) => setSettleSavingsForm({ ...settleSavingsForm, realizedInterest: safeNumber(Number(e.target.value), 0) })}
                                  className="w-20 text-center bg-white rounded-lg border border-sky-205 p-1 font-bold text-sky-700"
                                  required
                                />
                                <span className="font-bold text-family-textMuted">Tr VND</span>
                              </div>
                              <div className="flex gap-2 ml-auto">
                                <button
                                  type="button"
                                  onClick={() => {
                                    settleSavingsDepositEarly(dep.id, settleSavingsForm.settledMonth, settleSavingsForm.settledYear, settleSavingsForm.realizedInterest);
                                    setSettlingSavingsId(null);
                                  }}
                                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold transition-all"
                                >
                                  Xác nhận tất toán
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSettlingSavingsId(null)}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-family-text rounded-lg font-semibold transition-all"
                                >
                                  Hủy
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <EmptyState 
              title="Chưa có khoản tiết kiệm nào" 
              description="Nhấn 'Tạo khoản tiết kiệm' để gửi tiết kiệm từ phần tiền chưa có kế hoạch hoặc đã lên kế hoạch."
            />
          )}
        </CardContent>
      </Card>

      {/* Deals Tracking Section */}
      <Card className="border-family-accent/20">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="w-full md:w-3/4">
            <CardTitle className="text-xl font-serif font-bold text-family-text flex items-center gap-2">
              🤝 Quản lý Thương vụ đầu tư chi tiết (Deals Tracking)
            </CardTitle>
            <CardDescription className="w-full">
              Theo dõi chi tiết hoạt động đầu tư thực tế của vợ chồng. Lợi nhuận/Lỗ chỉ khi **Tất toán** mới được tái đầu tư vào các lớp tài sản.
            </CardDescription>
          </div>
          <Button onClick={() => setShowAddDealForm(!showAddDealForm)} size="sm" className="gap-1 text-xs py-1 h-8 shrink-0">
            <Plus className="w-3.5 h-3.5" /> Thêm thương vụ
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Add Deal Form */}
          {showAddDealForm && (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (isDealCapitalOverLimit) return;
                addInvestmentDeal({
                  name: dealForm.name,
                  assetType: dealForm.assetType,
                  capital: dealForm.capital,
                  startMonth: dealForm.startMonth,
                  startYear: dealForm.startYear,
                  status: 'active',
                  isEarmarked: dealForm.isEarmarked,
                  expectedSavingRate: dealForm.isEarmarked ? dealForm.expectedSavingRate : undefined,
                  savingTermMonths: dealForm.isEarmarked ? dealForm.savingTermMonths : undefined,
                  notes: dealForm.notes,
                });
                setDealForm({ name: '', assetType: 'stocks', capital: 0, startMonth: 10, startYear: 2026, isEarmarked: false, expectedSavingRate: 5, savingTermMonths: 12, notes: '' });
                setShowAddDealForm(false);
              }}
              className="bg-family-bgDark/35 p-4 rounded-xl border border-family-accent/10 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-family-text mb-1">Tên thương vụ</label>
                  <input
                    type="text"
                    value={dealForm.name}
                    onChange={(e) => setDealForm({ ...dealForm, name: e.target.value })}
                    placeholder="Ví dụ: Cổ phiếu VIX"
                    required
                    className="w-full text-xs bg-white rounded-xl border border-family-accent/15 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-family-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-family-text mb-1">Lớp tài sản</label>
                  <select
                    value={dealForm.assetType}
                    onChange={(e) => setDealForm({ ...dealForm, assetType: e.target.value as AssetType })}
                    className="w-full text-xs bg-white rounded-xl border border-family-accent/15 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-family-accent"
                  >
                    <option value="stocks">Chứng Khoán</option>
                    <option value="real_estate">Bất Động Sản</option>
                    <option value="gold">Vàng</option>
                    <option value="fx_reserve_usd">Dự trữ ngoại hối (USD)</option>
                    <option value="crypto">Crypto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-family-text mb-1">Vốn đầu tư (Tr VND)</label>
                  <input
                    type="number"
                    value={dealForm.capital}
                    onChange={(e) => setDealForm({ ...dealForm, capital: Math.max(0, safeNumber(Number(e.target.value), 0)) })}
                    required
                    className="w-full text-xs bg-white rounded-xl border border-family-accent/15 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-family-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-family-text mb-1">Tháng bắt đầu</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={dealForm.startMonth}
                    onChange={(e) => setDealForm({ ...dealForm, startMonth: safeNumber(Number(e.target.value), 10) })}
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
                    value={dealForm.startYear}
                    onChange={(e) => setDealForm({ ...dealForm, startYear: safeNumber(Number(e.target.value), 2026) })}
                    required
                    className="w-full text-xs bg-white rounded-xl border border-family-accent/15 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-family-accent"
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-3 mt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isEarmarked"
                    checked={dealForm.isEarmarked}
                    onChange={(e) => setDealForm({ ...dealForm, isEarmarked: e.target.checked })}
                    className="w-4 h-4 text-family-accent rounded border-family-accent/20 cursor-pointer"
                  />
                  <label htmlFor="isEarmarked" className="text-xs font-semibold text-family-text cursor-pointer">
                    Đánh dấu đây là khoản Tiền nhàn rỗi chờ phân bổ (chưa đầu tư, không tính tỷ suất sinh lời ảo)
                  </label>
                </div>
                {dealForm.isEarmarked && (
                  <div className="pl-6 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-family-text">Mức lãi suất tiết kiệm kỳ vọng:</label>
                      <input
                        type="number"
                        step="0.1"
                        min={0}
                        value={dealForm.expectedSavingRate}
                        onChange={(e) => setDealForm({ ...dealForm, expectedSavingRate: safeNumber(Number(e.target.value), 0) })}
                        className="w-20 text-center text-xs bg-white rounded-lg border border-family-accent/15 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-family-accent"
                      />
                      <span className="text-xs font-bold text-family-textMuted">%/năm</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-family-text">Kì hạn gửi tiết kiệm:</label>
                      <select
                        value={dealForm.savingTermMonths}
                        onChange={(e) => setDealForm({ ...dealForm, savingTermMonths: Number(e.target.value) })}
                        className="text-xs bg-white rounded-lg border border-family-accent/15 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-family-accent"
                      >
                        <option value={1}>1 tháng</option>
                        <option value={3}>3 tháng</option>
                        <option value={6}>6 tháng</option>
                        <option value={9}>9 tháng</option>
                        <option value={12}>12 tháng</option>
                        <option value={18}>18 tháng</option>
                        <option value={24}>24 tháng</option>
                        <option value={36}>36 tháng</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
              
              {isDealCapitalOverLimit && (
                <WarningBox 
                  type="danger" 
                  message={`Số vốn đầu tư vượt quá số dư tiền mặt chưa phân bổ tại thời điểm tháng ${dealForm.startMonth}/${dealForm.startYear} (Số dư khả dụng: ${unallocatedAtStart.toFixed(1)} Tr VND).`} 
                />
              )}

              <div>
                <label className="block text-xs font-semibold text-family-text mb-1">Ghi chú thêm</label>
                <input
                  type="text"
                  value={dealForm.notes}
                  onChange={(e) => setDealForm({ ...dealForm, notes: e.target.value })}
                  placeholder="Ghi chú về tài khoản mua, mục tiêu thương vụ..."
                  className="w-full text-xs bg-white rounded-xl border border-family-accent/15 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-family-accent"
                />
              </div>
              <div className="flex justify-end gap-2 text-xs">
                <Button variant="outline" size="sm" onClick={() => setShowAddDealForm(false)}>Hủy</Button>
                <Button type="submit" size="sm" disabled={isDealCapitalOverLimit || dealForm.capital <= 0 || !dealForm.name.trim()}>
                  Tạo thương vụ mới
                </Button>
              </div>
            </form>
          )}

          {/* Active Deals Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-family-accent flex items-center gap-1.5">
              <span>🟢</span> Thương vụ đang hoạt động ({state.investmentDeals?.filter(d => d.status === 'active').length || 0})
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
                  {(!state.investmentDeals || state.investmentDeals.filter(d => d.status === 'active').length === 0) ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-family-textMuted font-medium italic bg-family-bgDark/5">
                        Không có thương vụ nào đang hoạt động. Hãy thêm thương vụ đầu tiên!
                      </td>
                    </tr>
                  ) : (
                    state.investmentDeals
                      .filter((deal) => deal.status === 'active')
                      .map((deal) => {
                        const isSettling = settlingDealId === deal.id;
                        const current = activeRow ? activeRow.period.year * 12 + activeRow.period.month : 0;
                        const isOriginallyEarmarked = deal.isEarmarked || deal.isConverted;
                        const dealStart = isOriginallyEarmarked
                          ? (state.profile.planningStartYear * 12 + state.profile.planningStartMonth)
                          : (deal.startYear * 12 + deal.startMonth);
                        const hasStarted = current >= dealStart;
                        return (
                          <React.Fragment key={deal.id}>
                            <tr className="border-b border-family-accent/5 hover:bg-family-bgDark/5">
                              <td className="p-3 font-semibold text-family-text">
                                {deal.name}
                                {deal.isEarmarked && (
                                  <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-500/10 text-slate-500 uppercase tracking-wider">
                                    Chờ phân bổ
                                  </span>
                                )}
                              </td>
                              <td className="p-3 font-medium text-family-textMuted">
                                {deal.assetType === 'stocks' ? 'Chứng Khoán' :
                                 deal.assetType === 'real_estate' ? 'Bất Động Sản' :
                                 deal.assetType === 'gold' ? 'Vàng' :
                                 deal.assetType === 'crypto' ? 'Crypto' : 'USD'}
                              </td>
                              <td className="p-3 font-bold text-family-accent">{formatTableMoneyVNDMillion(deal.capital)}</td>
                              <td className="p-3 font-semibold">{deal.startMonth < 10 ? `0${deal.startMonth}` : deal.startMonth}/{deal.startYear}</td>
                              <td className="p-3 text-family-textMuted max-w-[200px] truncate">{deal.notes || '---'}</td>
                              <td className="p-3 text-right space-x-2">
                                {hasStarted && (
                                  <>
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
                                          });
                                        }
                                      }}
                                      className={`text-[10px] font-bold py-1 px-2.5 rounded-lg text-white transition-all shadow-sm ${isSettling ? 'bg-slate-500' : (deal.isEarmarked ? 'bg-slate-500 hover:bg-slate-600' : 'bg-green-700 hover:bg-green-800')}`}
                                    >
                                      {isSettling ? 'Hủy' : (deal.isEarmarked ? 'Phân bổ / Chốt lãi' : 'Tất toán chốt sổ')}
                                    </button>
                                    {deal.isEarmarked && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const isCurrentlyConverting = convertingDealId === deal.id;
                                          if (isCurrentlyConverting) {
                                            setConvertingDealId(null);
                                          } else {
                                            setConvertingDealId(deal.id);
                                            setConversionForm({
                                              month: activeRow ? activeRow.period.month : 10,
                                              year: activeRow ? activeRow.period.year : 2026,
                                              realizedSavingInterest: 0,
                                            });
                                          }
                                        }}
                                        className={`text-[10px] font-bold py-1 px-2.5 rounded-lg text-white transition-all shadow-sm ${convertingDealId === deal.id ? 'bg-slate-500' : 'bg-blue-600 hover:bg-blue-700'}`}
                                      >
                                        {convertingDealId === deal.id ? 'Hủy' : 'Chuyển thành Đầu tư'}
                                      </button>
                                    )}
                                  </>
                                )}
                                <button
                                  type="button"
                                  onClick={() => deleteInvestmentDeal(deal.id)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                  title="Xóa thương vụ"
                                >
                                  <Trash2 className="w-4 h-4 inline" />
                                </button>
                              </td>
                            </tr>
                            {/* Settlement Inline Form */}
                            {isSettling && (
                              <tr className="bg-green-700/5 border-b border-family-accent/5">
                                <td colSpan={6} className="p-3">
                                  <div className="flex flex-wrap items-center gap-4 text-xs bg-white/70 p-3 rounded-xl border border-green-700/20">
                                    <div className="font-bold text-green-800">Thông tin tất toán:</div>
                                    <div className="flex items-center gap-2">
                                      <label className="font-semibold text-family-text">Tháng chốt:</label>
                                      <input
                                        type="number"
                                        min={1}
                                        max={12}
                                        value={settleForm.endMonth}
                                        onChange={(e) => setSettleForm({ ...settleForm, endMonth: safeNumber(Number(e.target.value), 12) })}
                                        className="w-14 text-center bg-white rounded-lg border border-family-accent/15 p-1"
                                        required
                                      />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <label className="font-semibold text-family-text">Năm chốt:</label>
                                      <input
                                        type="number"
                                        min={2020}
                                        max={2060}
                                        value={settleForm.endYear}
                                        onChange={(e) => setSettleForm({ ...settleForm, endYear: safeNumber(Number(e.target.value), 2026) })}
                                        className="w-18 text-center bg-white rounded-lg border border-family-accent/15 p-1"
                                        required
                                      />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <label className="font-semibold text-family-text">{deal.isEarmarked ? 'Tiền lãi thực nhận:' : 'Lợi nhuận/Lỗ thực tế:'}</label>
                                      <input
                                        type="number"
                                        value={settleForm.realizedProfit}
                                        onChange={(e) => setSettleForm({ ...settleForm, realizedProfit: safeNumber(Number(e.target.value), 0) })}
                                        className={`w-20 text-center bg-white rounded-lg border border-family-accent/15 p-1 font-bold ${deal.isEarmarked ? 'text-slate-600' : 'text-green-700'}`}
                                        required
                                      />
                                      <span className="font-bold text-family-textMuted">Tr VND</span>
                                    </div>
                                    <div className="flex items-center gap-2 w-full pt-2 border-t border-green-700/10">
                                      <input 
                                        type="checkbox" 
                                        id="reinvest"
                                        checked={settleForm.reinvestAsUnallocated}
                                        onChange={(e) => setSettleForm({ ...settleForm, reinvestAsUnallocated: e.target.checked })}
                                        className="w-4 h-4 text-green-700 rounded border-family-accent/20"
                                      />
                                      <label htmlFor="reinvest" className="text-xs font-semibold text-family-text">Tự động tạo thương vụ "Chờ phân bổ" với tổng tiền vốn + lời?</label>
                                      {settleForm.reinvestAsUnallocated && (
                                        <select
                                          value={settleForm.reinvestAssetType}
                                          onChange={(e) => setSettleForm({ ...settleForm, reinvestAssetType: e.target.value as AssetType })}
                                          className="text-xs bg-white rounded-lg border border-family-accent/15 px-2 py-1 ml-2"
                                        >
                                          <option value="stocks">Chứng Khoán</option>
                                          <option value="real_estate">Bất Động Sản</option>
                                          <option value="gold">Vàng</option>
                                          <option value="fx_reserve_usd">USD</option>
                                          <option value="crypto">Crypto</option>
                                        </select>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        settleInvestmentDeal(deal.id, settleForm.endMonth, settleForm.endYear, settleForm.realizedProfit);
                                        if (settleForm.reinvestAsUnallocated) {
                                          addInvestmentDeal({
                                            name: 'Tiền chờ phân bổ',
                                            assetType: settleForm.reinvestAssetType,
                                            capital: deal.capital + settleForm.realizedProfit,
                                            startMonth: settleForm.endMonth,
                                            startYear: settleForm.endYear,
                                            status: 'active',
                                            notes: `Tái đầu tư từ tất toán thương vụ ${deal.name}`,
                                          });
                                        }
                                        setSettlingDealId(null);
                                      }}
                                      className="ml-auto bg-green-700 hover:bg-green-800 text-white font-bold py-1 px-3 rounded-lg shadow-sm"
                                    >
                                      Xác nhận chốt tất toán
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )}
                            {/* Conversion Inline Form */}
                            {convertingDealId === deal.id && (
                              <tr className="bg-blue-700/5 border-b border-family-accent/5">
                                <td colSpan={6} className="p-3">
                                  <div className="flex flex-wrap items-center gap-4 text-xs bg-white/70 p-3 rounded-xl border border-blue-700/20">
                                    <div className="font-bold text-blue-800">Chuyển sang thương vụ đầu tư thực tế:</div>
                                    <div className="flex items-center gap-2">
                                      <label className="font-semibold text-family-text">Tháng chuyển:</label>
                                      <input
                                        type="number"
                                        min={1}
                                        max={12}
                                        value={conversionForm.month}
                                        onChange={(e) => setConversionForm({ ...conversionForm, month: safeNumber(Number(e.target.value), 12) })}
                                        className="w-14 text-center bg-white rounded-lg border border-family-accent/15 p-1"
                                        required
                                      />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <label className="font-semibold text-family-text">Năm chuyển:</label>
                                      <input
                                        type="number"
                                        min={2020}
                                        max={2060}
                                        value={conversionForm.year}
                                        onChange={(e) => setConversionForm({ ...conversionForm, year: safeNumber(Number(e.target.value), 2026) })}
                                        className="w-18 text-center bg-white rounded-lg border border-family-accent/15 p-1"
                                        required
                                      />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <label className="font-semibold text-family-text">Lãi tiết kiệm thực nhận:</label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={conversionForm.realizedSavingInterest}
                                        onChange={(e) => setConversionForm({ ...conversionForm, realizedSavingInterest: safeNumber(Number(e.target.value), 0) })}
                                        className="w-20 text-center bg-white rounded-lg border border-family-accent/15 p-1 font-bold text-blue-700"
                                        required
                                      />
                                      <span className="font-bold text-family-textMuted">Tr VND</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        updateInvestmentDeal({
                                          ...deal,
                                          isEarmarked: false,
                                          isConverted: true,
                                          conversionMonth: conversionForm.month,
                                          conversionYear: conversionForm.year,
                                          realizedSavingInterest: conversionForm.realizedSavingInterest,
                                        });
                                        setConvertingDealId(null);
                                      }}
                                      className="ml-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-lg shadow-sm"
                                    >
                                      Xác nhận chuyển
                                    </button>
                                  </div>
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
              <span>🏁</span> Nhật ký thương vụ đã tất toán ({state.investmentDeals?.filter(d => d.status === 'settled').length || 0})
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
                  {(!state.investmentDeals || state.investmentDeals.filter(d => d.status === 'settled').length === 0) ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-family-textMuted font-medium italic bg-family-bgDark/5">
                        Chưa có lịch sử thương vụ tất toán. Lợi nhuận chốt lời sẽ được tự động cộng vào tài sản lũy kế.
                      </td>
                    </tr>
                  ) : (
                    state.investmentDeals
                      .filter((deal) => deal.status === 'settled')
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
                              <button
                                type="button"
                                onClick={() => deleteInvestmentDeal(deal.id)}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Xóa lịch sử"
                              >
                                <Trash2 className="w-4 h-4 inline" />
                              </button>
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
