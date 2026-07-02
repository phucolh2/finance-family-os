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
    projectionAdjustments: state.projectionAdjustments,
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

  const [formError, setFormError] = useState<string | null>(null);

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

  // Only show unallocated if it's positive and there is no deficit
  const unallocatedBalance = Math.max(0, rawObservedBalance - totalActiveCapital);
  const unallocatedPercent = totalObservedBalance > 0
    ? (unallocatedBalance / totalObservedBalance) * 100
    : 100;

  if (unallocatedPercent > 0.01) {
    chartData.push({
      name: 'Tiền chờ phân bổ / Chưa đầu tư',
      value: Math.round(unallocatedPercent * 10) / 10,
      balance: unallocatedBalance,
    });
  }

  // Calculate unallocated capital at the deal start date for validation
  const targetMonthRow = projection.monthlyRows.find(
    (r) => r.period.month === dealForm.startMonth && r.period.year === dealForm.startYear
  );
  const unallocatedAtStart = targetMonthRow ? (targetMonthRow.portfolio.unallocatedEndingBalance ?? 0) : totalStartingBalance;
  const isDealCapitalOverLimit = dealForm.capital > unallocatedAtStart;

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

      {/* Starting Capital Configuration Card */}
      <Card className="bg-family-accent/5 border-family-accent/20">
        <CardContent className="py-4 px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-family-text flex items-center gap-2">
              💼 Cấu hình Vốn gốc khởi điểm
            </h3>
            <p className="text-xs text-family-textMuted">
              Vốn khởi điểm ban đầu của hai vợ chồng tại mốc quan sát bắt đầu kế hoạch ({state.profile.planningStartMonth}/{state.profile.planningStartYear}).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-family-text shrink-0">Tổng vốn khởi điểm:</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={state.profile.startingCapital ?? 100}
                onChange={(e) => {
                  const val = Math.max(0, safeNumber(Number(e.target.value), 0));
                  updateProfile({
                    ...state.profile,
                    startingCapital: val,
                  });
                }}
                className="w-28 text-center text-xs font-bold text-family-accent bg-white rounded-xl border border-family-accent/15 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-family-accent"
              />
              <span className="text-xs font-bold text-family-textMuted">Tr VND</span>
            </div>
          </div>
        </CardContent>
      </Card>

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

                  const activeDealsCount = observedDeals.filter(d => d.assetType === asset.type).length;
                  const activeDealsCapital = observedDeals.filter(d => d.assetType === asset.type).reduce((sum, d) => sum + d.capital, 0);

                  return (
                    <tr key={asset.type} className="border-b border-family-accent/5 hover:bg-family-bgDark/10">
                      <td className="p-3 font-semibold text-family-text">{asset.name}</td>
                      <td className="p-3 font-medium">{formatTableMoneyVNDMillion(assetBalance)}</td>
                      <td className="p-3 font-bold text-family-accent">{actualPercent.toFixed(1)}%</td>
                      <td className="p-3 font-semibold text-family-text">{activeDealsCount} thương vụ</td>
                      <td className="p-3 font-medium text-family-textMuted">{formatTableMoneyVNDMillion(activeDealsCapital)}</td>
                    </tr>
                  );
                })}
                {unallocatedPercent > 0.01 && (
                  <tr className="border-b border-family-accent/5 bg-slate-500/5 hover:bg-slate-500/10">
                    <td className="p-3 font-semibold text-slate-500">Tiền chờ phân bổ / Chưa đầu tư</td>
                    <td className="p-3 font-medium text-slate-500">
                      {formatTableMoneyVNDMillion(unallocatedBalance)}
                    </td>
                    <td className="p-3 font-bold text-slate-500">{unallocatedPercent.toFixed(1)}%</td>
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
                  notes: dealForm.notes,
                });
                setDealForm({ name: '', assetType: 'stocks', capital: 0, startMonth: 10, startYear: 2026, isEarmarked: false, notes: '' });
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
              
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="isEarmarked"
                  checked={dealForm.isEarmarked}
                  onChange={(e) => setDealForm({ ...dealForm, isEarmarked: e.target.checked })}
                  className="w-4 h-4 text-family-accent rounded border-family-accent/20 cursor-pointer"
                />
                <label htmlFor="isEarmarked" className="text-xs font-semibold text-family-text cursor-pointer">
                  Đánh dấu đây là khoản Tiền nhàn rỗi chờ phân bổ (chưa đầu tư, không tính tỷ suất sinh lời)
                </label>
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
                                {!deal.isEarmarked && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (isSettling) {
                                        setSettlingDealId(null);
                                      } else {
                                        setSettlingDealId(deal.id);
                                        setSettleForm({
                                          endMonth: 12,
                                          endYear: 2026,
                                          realizedProfit: 0,
                                          reinvestAsUnallocated: false,
                                          reinvestAssetType: deal.assetType,
                                        });
                                      }
                                    }}
                                    className="text-[10px] font-bold py-1 px-2.5 rounded-lg bg-green-700 text-white hover:bg-green-800 transition-all shadow-sm"
                                  >
                                    {isSettling ? 'Hủy' : 'Tất toán chốt sổ'}
                                  </button>
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
                                      <label className="font-semibold text-family-text">Lợi nhuận/Lỗ thực tế:</label>
                                      <input
                                        type="number"
                                        value={settleForm.realizedProfit}
                                        onChange={(e) => setSettleForm({ ...settleForm, realizedProfit: safeNumber(Number(e.target.value), 0) })}
                                        className="w-20 text-center bg-white rounded-lg border border-family-accent/15 p-1 font-bold text-green-700"
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
