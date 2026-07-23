import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { EmptyState } from '../ui/EmptyState';
import { HelpTooltip } from '../ui/HelpTooltip';
import { Target, Plus, Trash2, ArrowRightCircle, Edit } from 'lucide-react';
import { formatTableMoneyVNDMillion } from '../../utils/format';
import { safeNumber, calculateNonTermInterest } from '../../utils/math';
import { runProjection } from '../../engines/projectionEngine';
import type { AssetType } from '../../types/portfolio';
import { FUNDING_SOURCES, SCREEN_FUNDING_CONSTRAINTS } from '../../constants/fundingSources';
import type { FundingSourceId } from '../../constants/fundingSources';

interface SinkingFundModuleProps {
  filterFundType?: 'investment' | 'debt_prep';
  filterSources?: FundingSourceId[];
  title?: string;
  description?: string;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
}

export const SinkingFundModule: React.FC<SinkingFundModuleProps> = ({
  filterFundType = 'investment',
  filterSources,
  title = '🎯 Quỹ tích lũy mục tiêu (Sinking Funds)',
  description = 'Gom tiền định kỳ hàng tháng để chuẩn bị cho các thương vụ lớn. Số dư đẻ lãi theo lãi suất tiết kiệm.',
  emptyStateTitle = 'Chưa có quỹ tích lũy nào',
  emptyStateDescription = 'Hãy tạo quỹ để gom tiền dần cho các mục tiêu đầu tư lớn.'
}) => {
  const { 
    state, 
    addSinkingFund,
    updateSinkingFund,
    deleteSinkingFund,
    disburseSinkingFund,
    addInvestmentDeal,
    selectedPeriodKey,
  } = useAppContext();

  const projection = runProjection({
    profile: state.profile,
    incomeSchedule: state.incomeSchedule,
    budgetSchedule: state.budgetSchedule,
    expenseSchedule: state.expenseSchedule,
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

  const now = new Date();
  const initMonth = now.getMonth() + 1;
  const initYear = now.getFullYear();

  const activeSources = filterSources || (filterFundType === 'debt_prep' ? SCREEN_FUNDING_CONSTRAINTS.debt_prep : SCREEN_FUNDING_CONSTRAINTS.portfolio);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFundId, setEditingFundId] = useState<string | null>(null);
  const [expandedFundId, setExpandedFundId] = useState<string | null>(null);
  
  React.useEffect(() => {
    setShowAddForm(false);
    setEditingFundId(null);
    setDisbursingId(null);
  }, [selectedPeriodKey]);
  const [form, setForm] = useState({
    name: '',
    targetAssetType: 'real_estate' as AssetType,
    targetAmount: 0,
    initialDeposit: 0,
    monthlyContribution: 0,
    interestRateAnnual: 5.5,
    termMonths: 1,
    sourceOfFund: activeSources[0] as FundingSourceId,
    startMonth: initMonth,
    startYear: initYear,
  });

  const [disbursingId, setDisbursingId] = useState<string | null>(null);
  const [settleMode, setSettleMode] = useState<'full' | 'partial'>('full');
  const [partialWithdrawType, setPartialWithdrawType] = useState<'amount' | 'percentage'>('amount');
  const [partialWithdrawValue, setPartialWithdrawValue] = useState<number>(0);
  const [disburseForm, setDisburseForm] = useState({
    disbursedMonth: initMonth,
    disbursedYear: initYear,
    dealName: '',
    realizedInterest: 0,
  });

  const activeFunds = state.sinkingFunds?.filter(f => f.status === 'active' && (f.fundType || 'investment') === filterFundType) || [];

  const targetKey = `${form.startYear}-${String(form.startMonth).padStart(2, '0')}`;
  const currentRow = projection.monthlyRows.find(r => r.period.key === targetKey);
  
  const getSourceLabelWithBalance = (sourceId: string) => {
      let balance = 0;
      let prefix = '';
      if (sourceId === 'unallocated' || sourceId === 'investment') {
         if (currentRow) {
           const port = currentRow.portfolio;
           balance = port.unallocatedEndingBalance || 0;
         } else {
           balance = safeNumber(state.profile.startingCapital, 100);
         }
         
         if (filterFundType === 'investment') {
            prefix = 'Chưa có kế hoạch (Dòng tiền nhàn rỗi)';
         } else {
            prefix = 'Dòng tiền Nhàn rỗi (Chưa phân bổ)';
         }
      } else if (sourceId === 'saving') {
         balance = currentRow ? currentRow.savingBalance : 0;
         prefix = 'Số dư Quỹ Tiết Kiệm & Nợ';
      } else if (sourceId === 'debt_reserve') {
         balance = (currentRow ? currentRow.debtReserveBalance : 0) + (currentRow ? (currentRow as any)._activeSinkingFundsDebtReserve || 0 : 0);
         prefix = 'Quỹ Chuẩn bị Trả nợ';
      }
      return `${prefix} (Còn: ${formatTableMoneyVNDMillion(balance)})`;
  };

  // Helper to find latest state of a fund from projection
  const getFundBalance = (fundId: string) => {
    const now = new Date();
    const nowKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const activeRow = (projection.monthlyRows.length > 0 && selectedPeriodKey)
      ? (projection.monthlyRows.find(r => r.period.key === selectedPeriodKey) || projection.monthlyRows[0])
      : (projection.monthlyRows.find(r => r.period.key === nowKey) || projection.monthlyRows[0]);

    const currentObservedMonth = activeRow ? activeRow.period.month : initMonth;
    const currentObservedYear = activeRow ? activeRow.period.year : initYear;

    const fund = activeFunds.find(f => f.id === fundId);
    if (!fund) return { balance: 0, progress: 0, buckets: [] };
    
    let buckets: { principal: number; termStart: number; termMonths: number; interestRateAnnual: number; periodKey: string }[] = [];
    const start = fund.startYear * 12 + fund.startMonth;
    const current = currentObservedYear * 12 + currentObservedMonth;
    
    if (current >= start) {
       for (let m = start; m <= current; m++) {
          let maturingAmount = 0;
          
          const mo = ((m - 1) % 12) + 1;
          const yr = Math.floor((m - 1) / 12);
          const periodKey = `${yr}-${String(mo).padStart(2, '0')}`;
          const periodCfg = fund.periodConfigs?.[periodKey];
          const bTerm = periodCfg?.termMonths ?? (fund.termMonths || 1);
          const bRate = periodCfg?.interestRateAnnual ?? (fund.interestRateAnnual || 5.5);

          const currentWithdrawals = (fund.withdrawals || []).filter(w => w.month === mo && w.year === yr);
          if (currentWithdrawals.length > 0) {
             currentWithdrawals.forEach(w => {
                let amountToDeduct = w.amount;
                for (let i = 0; i < buckets.length && amountToDeduct > 0; i++) {
                   if (buckets[i].principal >= amountToDeduct) {
                      buckets[i].principal -= amountToDeduct;
                      amountToDeduct = 0;
                   } else {
                      amountToDeduct -= buckets[i].principal;
                      buckets[i].principal = 0;
                   }
                }
             });
             buckets = buckets.filter(b => b.principal > 0);
          }
          
          buckets = buckets.filter(b => {
             if (m - b.termStart === b.termMonths && m > b.termStart) {
                const interest = b.principal * (b.interestRateAnnual / 100 / 12) * b.termMonths;
                maturingAmount += b.principal + interest;
                return false;
             }
             return true;
          });
          
          let newContrib = 0;
          if (m === start) newContrib += fund.initialDeposit;
          if (m >= start) {
             newContrib += periodCfg?.contribution !== undefined ? periodCfg.contribution : fund.monthlyContribution;
          }
          
          if (newContrib > 0 || maturingAmount > 0) {
             buckets.push({ principal: newContrib + maturingAmount, termStart: m, termMonths: bTerm, interestRateAnnual: bRate, periodKey });
          }
       }
    }
    
    let totalNonTermInterest = 0;
    const currentMonth = currentObservedMonth;
    const currentYear = currentObservedYear;
    buckets.forEach(b => {
       const bMonth = ((b.termStart - 1) % 12) + 1;
       const bYear = Math.floor((b.termStart - 1) / 12);
       totalNonTermInterest += calculateNonTermInterest(b.principal, bMonth, bYear, currentMonth, currentYear, state.assumptions.nonTermInterestRateSchedule);
    });

    const bal = buckets.reduce((sum, b) => sum + b.principal, 0) + totalNonTermInterest;

    return { 
       balance: bal, 
       progress: fund.targetAmount > 0 ? (bal / fund.targetAmount) * 100 : 0,
       buckets // Return buckets for calculation during disbursement if needed
    };
  };

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <div className="w-full md:w-3/4">
          <h3 className="text-xl font-serif font-bold text-family-text flex items-center gap-2">
            {title}
            <HelpTooltip text="Công cụ giúp bạn lên kế hoạch góp tiền đều đặn hàng tháng để đạt được mục tiêu mua tài sản lớn (nhà, xe, mở sổ tiết kiệm lớn) trong tương lai mà không bị sốc dòng tiền." />
          </h3>
          <p className="text-sm text-family-textMuted mt-1">
            {description}
          </p>
        </div>
        <Button onClick={() => { setShowAddForm(!showAddForm); }} size="sm" className="gap-1 text-xs py-1 h-8 shrink-0">
          <Plus className="w-3.5 h-3.5" /> Tạo quỹ mới
        </Button>
      </div>

      {showAddForm && (
        <div className="mb-6 p-4 bg-orange-50/50 border border-orange-200/30 rounded-xl space-y-4">
          <h4 className="font-bold text-sm text-family-text">Khởi tạo quỹ mới</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              label="Tên mục tiêu / Quỹ"
              value={form.name}
              placeholder="VD: Quỹ mua ô tô / Trả nợ nhà"
              onChange={(e) => { setForm({ ...form, name: e.target.value }); }}
            />
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-xs font-semibold text-family-textMuted uppercase tracking-wider mb-1">Nguồn tiền</label>
              <select 
                disabled={activeSources.length === 1}
                className={`block w-full rounded-xl border border-family-accent/20 py-2.5 px-3 pr-8 text-sm text-family-text text-ellipsis overflow-hidden whitespace-nowrap focus:border-family-accent focus:outline-none focus:ring-1 focus:ring-family-accent transition-colors ${activeSources.length === 1 ? 'bg-gray-50 cursor-not-allowed opacity-80' : 'bg-white/60 focus:bg-white'}`}
                value={form.sourceOfFund}
                onChange={e => { setForm({...form, sourceOfFund: e.target.value as any}); }}
              >
                {activeSources.map(sourceId => (
                  <option key={sourceId} value={sourceId}>{getSourceLabelWithBalance(sourceId)}</option>
                ))}
              </select>
            </div>
            {filterFundType === 'investment' && (
              <div>
                <label className="block text-xs font-semibold text-family-textMuted uppercase tracking-wider mb-1">Mục tiêu tài sản</label>
                <select 
                  className="block w-full rounded-xl border border-family-accent/20 bg-white/60 py-2.5 px-3 text-sm text-family-text focus:border-family-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-family-accent transition-colors"
                  value={form.targetAssetType}
                  onChange={e => { setForm({...form, targetAssetType: e.target.value as AssetType}); }}
                >
                  <option value="real_estate">Bất động sản</option>
                  <option value="gold">Vàng</option>
                  <option value="fx_reserve_usd">Ngoại hối / USD</option>
                  <option value="stocks">Chứng khoán</option>
                  <option value="crypto">Crypto</option>
                </select>
              </div>
            )}
            <Input
              label="Số tiền cần đạt (Tr VND)"
              type="number"
              value={form.targetAmount || ''}
              placeholder="VD: 500"
              onChange={(e) => { setForm({ ...form, targetAmount: safeNumber(Number(e.target.value), 0) }); }}
            />
            <Input
              label="Số vốn góp ban đầu (Tr VND)"
              type="number"
              value={form.initialDeposit || ''}
              placeholder="VD: 50"
              onChange={(e) => { setForm({ ...form, initialDeposit: safeNumber(Number(e.target.value), 0) }); }}
            />
            <Input
              label="Định kì phân bổ hằng tháng (Tr)"
              type="number"
              value={form.monthlyContribution || ''}
              placeholder="VD: 10"
              onChange={(e) => { setForm({ ...form, monthlyContribution: safeNumber(Number(e.target.value), 0) }); }}
            />
            <Input
              label="Lãi suất dự kiến (%/năm)"
              type="number"
              value={form.interestRateAnnual || ''}
              placeholder="VD: 5.5"
              onChange={(e) => { setForm({ ...form, interestRateAnnual: safeNumber(Number(e.target.value), 0) }); }}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Tháng bắt đầu"
                type="number"
                min={1}
                max={12}
                value={form.startMonth}
                onChange={(e) => { setForm({ ...form, startMonth: Number(e.target.value) }); }}
              />
              <Input
                label="Năm bắt đầu"
                type="number"
                min={2026}
                max={2060}
                value={form.startYear}
                onChange={(e) => { setForm({ ...form, startYear: Number(e.target.value) }); }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-family-textMuted uppercase tracking-wider mb-1">Kỳ hạn (Tháng)</label>
              <select 
                className="block w-full rounded-xl border border-family-accent/20 bg-white/60 py-2.5 px-3 text-sm text-family-text focus:border-family-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-family-accent transition-colors"
                value={form.termMonths}
                onChange={e => { setForm({...form, termMonths: Number(e.target.value)}); }}
              >
                <option value={0}>Không kỳ hạn</option>
                <option value={1}>1 tháng</option>
                <option value={3}>3 tháng</option>
                <option value={6}>6 tháng</option>
                <option value={12}>12 tháng</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => {
              setShowAddForm(false);
              setEditingFundId(null);
              setForm({ ...form, name: '', initialDeposit: 0, targetAmount: 0 });
            }}>Hủy</Button>
            <Button 
              onClick={() => {
                if (editingFundId) {
                  const existing = state.sinkingFunds?.find(f => f.id === editingFundId);
                  if (existing) {
                    updateSinkingFund({
                      ...existing,
                      ...form
                    });
                  }
                } else {
                  addSinkingFund({
                    ...form,
                    fundType: filterFundType,
                    status: 'active'
                  });
                }
                setShowAddForm(false);
                setEditingFundId(null);
                setForm({ ...form, name: '', initialDeposit: 0, targetAmount: 0 });
              }}
              disabled={!form.name.trim()}
            >
              {editingFundId ? 'Cập nhật quỹ' : 'Lưu quỹ'}
            </Button>
          </div>
        </div>
      )}

      {activeFunds.length === 0 ? (
        <EmptyState 
          icon={<Target className="w-8 h-8 text-family-accent/40" />}
          title={emptyStateTitle}
          description={emptyStateDescription} 
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeFunds.map((fund) => {
            const { balance, progress } = getFundBalance(fund.id);
            const isDisbursing = disbursingId === fund.id;

            return (
              <div key={fund.id} className="border border-family-accent/20 rounded-xl p-4 bg-white/50 relative overflow-hidden group">
                <div className="absolute top-0 left-0 h-1 bg-family-accent/10 w-full">
                  <div className="h-full bg-orange-400 transition-all" style={{ width: `${Math.min(100, progress)}%` }}></div>
                </div>
                
                <div className="flex justify-between items-start mb-2 mt-1">
                  <div>
                    <h4 className="font-bold text-family-text text-base">{fund.name}</h4>
                    {filterFundType !== 'debt_prep' && (
                      <p className="text-xs text-family-textMuted uppercase tracking-wider mt-0.5">Mục tiêu: {fund.targetAssetType}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setEditingFundId(fund.id);
                        setForm({
                          name: fund.name,
                          targetAssetType: fund.targetAssetType,
                          targetAmount: fund.targetAmount,
                          initialDeposit: fund.initialDeposit,
                          monthlyContribution: fund.monthlyContribution,
                          interestRateAnnual: fund.interestRateAnnual || 5.5,
                          termMonths: fund.termMonths || 1,
                          sourceOfFund: fund.sourceOfFund || activeSources[0],
                          startMonth: fund.startMonth,
                          startYear: fund.startYear,
                        });
                        setShowAddForm(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }} 
                      className="text-amber-500 hover:text-amber-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                         if(confirm('Bạn có chắc muốn xoá quỹ này không?')) deleteSinkingFund(fund.id);
                      }} 
                      className="text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 mb-4 grid grid-cols-2 gap-y-2 gap-x-4 bg-white/40 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-family-textMuted uppercase tracking-wide">Bắt đầu</span>
                    <span className="text-xs font-medium text-family-text">{fund.startMonth}/{fund.startYear}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-family-textMuted uppercase tracking-wide">Kỳ hạn gửi</span>
                    <span className="text-xs font-medium text-family-text">{fund.termMonths === 0 ? 'Không kỳ hạn' : `${fund.termMonths} tháng`}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-family-textMuted uppercase tracking-wide">Lãi suất</span>
                    <span className="text-xs font-medium text-family-text">{fund.interestRateAnnual || 0}%/năm</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-family-textMuted uppercase tracking-wide">Nguồn tiền</span>
                    <span className="text-xs font-medium text-family-text">{FUNDING_SOURCES[fund.sourceOfFund as FundingSourceId]?.shortLabel || fund.sourceOfFund}</span>
                  </div>
                </div>

                <div className="flex justify-between items-end mt-2">
                  <div>
                    <p className="text-xs text-family-textMuted mb-1">Số dư hiện tại / Mục tiêu</p>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-bold text-family-text">{formatTableMoneyVNDMillion(balance)}</span>
                        <span className="text-sm text-family-textMuted font-medium">/ {formatTableMoneyVNDMillion(fund.targetAmount)}</span>
                      </div>
                      {fund.withdrawals && fund.withdrawals.length > 0 && (
                        <div className="flex flex-col gap-1 mt-1">
                          {fund.withdrawals.map((w, idx) => (
                            <div key={idx} className="text-[10px] text-family-textMuted bg-white border border-gray-100 px-1.5 py-0.5 rounded shadow-sm inline-flex items-center gap-1">
                              <span className="text-red-500 font-bold">- {formatTableMoneyVNDMillion(w.amount)}</span> 
                              (T{w.month}/{w.year}) 
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-family-textMuted mb-1 text-right">Vốn ban đầu / Định kỳ</p>
                    <p className="text-sm font-bold text-family-text text-right">
                      {formatTableMoneyVNDMillion(fund.initialDeposit)} / +{formatTableMoneyVNDMillion(fund.monthlyContribution)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-family-accent/10">
                   <button 
                     onClick={() => setExpandedFundId(expandedFundId === fund.id ? null : fund.id)}
                     className="text-[11px] text-family-accent hover:text-family-accent/80 font-semibold flex items-center gap-1 w-fit"
                   >
                     {expandedFundId === fund.id ? 'Thu gọn chi tiết' : 'Chi tiết dòng tiền (Cashflow)'}
                   </button>
                   
                   {expandedFundId === fund.id && (
                     <div className="bg-white/60 p-3 rounded-lg border border-family-accent/10 text-xs space-y-2 mt-1">
                        <div className="flex justify-between border-b border-gray-100 pb-1">
                           <span className="text-family-textMuted">Tổng vốn đã nộp:</span>
                           <span className="font-semibold">{formatTableMoneyVNDMillion(getFundBalance(fund.id).buckets.reduce((sum, b) => sum + b.principal, 0))} Tr</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 pb-1">
                           <span className="text-family-textMuted">Lãi cộng dồn:</span>
                           <span className="font-semibold text-emerald-600">+{formatTableMoneyVNDMillion(balance - getFundBalance(fund.id).buckets.reduce((sum, b) => sum + b.principal, 0))} Tr</span>
                        </div>
                        <div className="pt-1">
                           <span className="text-family-textMuted text-[10px] uppercase mb-1 block">Các khoản đang gửi tích lũy:</span>
                           <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                              {getFundBalance(fund.id).buckets.map((b, i) => {
                                 const bMo = ((b.termStart - 1) % 12) + 1;
                                 const bYr = Math.floor((b.termStart - 1) / 12);
                                 const pKey = b.periodKey || `${bYr}-${String(bMo).padStart(2, '0')}`;

                                 return (
                                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] bg-white p-2 rounded shadow-sm border border-gray-100 gap-2">
                                       <div className="flex items-center gap-1.5">
                                          <span className="font-semibold text-family-text">Kỳ T{bMo}/{bYr}:</span>
                                          <input
                                             type="number"
                                             step="0.1"
                                             min="0"
                                             value={fund.periodConfigs?.[pKey]?.contribution !== undefined ? fund.periodConfigs[pKey].contribution : fund.monthlyContribution}
                                             onChange={(e) => {
                                                const newContrib = safeNumber(Number(e.target.value), 0);
                                                const updatedConfigs = {
                                                   ...(fund.periodConfigs || {}),
                                                   [pKey]: {
                                                      ...(fund.periodConfigs?.[pKey] || {}),
                                                      contribution: newContrib,
                                                   }
                                                };
                                                updateSinkingFund({
                                                   ...fund,
                                                   periodConfigs: updatedConfigs,
                                                });
                                             }}
                                             className="w-14 text-right text-[11px] bg-white border border-family-accent/30 rounded px-1 py-0.5 font-bold text-family-accent focus:outline-none focus:ring-1 focus:ring-family-accent"
                                          />
                                          <span className="font-bold text-family-accent text-[11px]">Tr</span>
                                          {b.principal > (fund.periodConfigs?.[pKey]?.contribution ?? fund.monthlyContribution) + 0.01 && (
                                             <span className="text-[9px] text-family-textMuted ml-0.5 whitespace-nowrap" title={`Gồm cả vốn ban đầu hoặc gốc đáo hạn`}>
                                                (Tổng {formatTableMoneyVNDMillion(b.principal)})
                                             </span>
                                          )}
                                       </div>
                                       
                                       <div className="flex items-center gap-3 text-xs">
                                          <div className="flex items-center gap-1">
                                             <span className="text-[10px] text-family-textMuted">Kỳ hạn:</span>
                                             <select
                                                value={b.termMonths}
                                                onChange={(e) => {
                                                   const newTerm = Number(e.target.value);
                                                   const updatedConfigs = {
                                                      ...(fund.periodConfigs || {}),
                                                      [pKey]: {
                                                         ...(fund.periodConfigs?.[pKey] || {}),
                                                         termMonths: newTerm,
                                                         interestRateAnnual: b.interestRateAnnual,
                                                      }
                                                   };
                                                   updateSinkingFund({
                                                      ...fund,
                                                      periodConfigs: updatedConfigs,
                                                   });
                                                }}
                                                className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 font-medium text-family-text focus:outline-none focus:ring-1 focus:ring-family-accent"
                                             >
                                                <option value={0}>Không kỳ hạn</option>
                                                <option value={1}>1 tháng</option>
                                                <option value={3}>3 tháng</option>
                                                <option value={6}>6 tháng</option>
                                                <option value={12}>12 tháng</option>
                                                <option value={24}>24 tháng</option>
                                                <option value={36}>36 tháng</option>
                                             </select>
                                          </div>

                                          <div className="flex items-center gap-1">
                                             <span className="text-[10px] text-family-textMuted">Lãi suất:</span>
                                             <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                value={b.interestRateAnnual}
                                                onChange={(e) => {
                                                   const newRate = safeNumber(Number(e.target.value), 0);
                                                   const updatedConfigs = {
                                                      ...(fund.periodConfigs || {}),
                                                      [pKey]: {
                                                         ...(fund.periodConfigs?.[pKey] || {}),
                                                         termMonths: b.termMonths,
                                                         interestRateAnnual: newRate,
                                                      }
                                                   };
                                                   updateSinkingFund({
                                                      ...fund,
                                                      periodConfigs: updatedConfigs,
                                                   });
                                                }}
                                                className="w-12 text-center text-[10px] bg-slate-50 border border-slate-200 rounded px-1 py-0.5 font-medium text-family-text focus:outline-none focus:ring-1 focus:ring-family-accent"
                                             />
                                             <span className="text-[10px] text-family-textMuted">%/năm</span>
                                          </div>
                                       </div>
                                    </div>
                                 );
                              })}
                           </div>
                        </div>
                     </div>
                   )}
                </div>

                {isDisbursing ? (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-xs font-bold text-green-800">
                        {filterFundType === 'debt_prep' ? 'Quản lý Tất toán & Rút gốc' : 'Giải ngân thành Thương vụ mới'}
                      </h5>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input type="radio" name={`mode_${fund.id}`} checked={settleMode === 'full'} onChange={() => {
                            setSettleMode('full');
                          }} />
                          <span className="font-semibold text-family-text text-xs">Tất toán toàn bộ (Đóng quỹ)</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input type="radio" name={`mode_${fund.id}`} checked={settleMode === 'partial'} onChange={() => {
                            setSettleMode('partial');
                          }} />
                          <span className="font-semibold text-family-text text-xs">Giải ngân/Rút từng phần</span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="space-y-2 border-t border-green-200 pt-2">
                      {filterFundType !== 'debt_prep' && (
                        <Input
                          label="Tên thương vụ đầu tư"
                          value={disburseForm.dealName}
                          onChange={(e) => { setDisburseForm({ ...disburseForm, dealName: e.target.value }); }}
                          placeholder={`VD: Mua ${fund.name}`}
                        />
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-semibold text-family-text">Tháng chốt:</label>
                          <input
                            type="number" min={1} max={12}
                            value={disburseForm.disbursedMonth}
                            onChange={(e) => { setDisburseForm({ ...disburseForm, disbursedMonth: safeNumber(Number(e.target.value), 12) }); }}
                            className="w-14 text-center text-xs bg-white rounded-md border border-green-200 p-1"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-semibold text-family-text">Năm chốt:</label>
                          <input
                            type="number" min={2020} max={2060}
                            value={disburseForm.disbursedYear}
                            onChange={(e) => { setDisburseForm({ ...disburseForm, disbursedYear: safeNumber(Number(e.target.value), 2026) }); }}
                            className="w-16 text-center text-xs bg-white rounded-md border border-green-200 p-1"
                          />
                        </div>

                        {settleMode === 'partial' && (
                          <div className="flex items-center gap-2 border-l pl-4 border-green-200">
                            <label className="text-xs font-semibold text-family-text">Mức rút:</label>
                            <select
                              value={partialWithdrawType}
                              onChange={(e) => { setPartialWithdrawType(e.target.value as 'amount'|'percentage'); }}
                              className="bg-white rounded-md text-xs border border-green-200 p-1"
                            >
                              <option value="amount">Số tiền (Tr)</option>
                              <option value="percentage">% quỹ</option>
                            </select>
                            <input
                              type="number" step="0.1" min="0" max={partialWithdrawType === 'percentage' ? 100 : balance}
                              value={partialWithdrawValue}
                              onChange={(e) => { setPartialWithdrawValue(safeNumber(Number(e.target.value), 0)); }}
                              className="w-16 text-center text-xs bg-white rounded-md border border-green-200 p-1 font-bold text-green-700"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => { setDisbursingId(null); }}>Hủy</Button>
                        <Button 
                          size="sm" 
                          disabled={filterFundType !== 'debt_prep' && !disburseForm.dealName}
                          onClick={() => {
                            if (settleMode === 'full') {
                              if (filterFundType !== 'debt_prep') {
                                // 1. Create investment deal
                                addInvestmentDeal({
                                   name: disburseForm.dealName,
                                   assetType: fund.targetAssetType,
                                   capital: balance,
                                   startMonth: disburseForm.disbursedMonth,
                                   startYear: disburseForm.disbursedYear,
                                   status: 'active',
                                   notes: `Giải ngân toàn bộ từ quỹ: ${fund.name}`
                                });
                              }
                              // 2. Mark fund as disbursed
                              disburseSinkingFund(fund.id, disburseForm.disbursedMonth, disburseForm.disbursedYear);
                            } else {
                              const wAmt = partialWithdrawType === 'amount' ? partialWithdrawValue : (balance * partialWithdrawValue / 100);
                              if (wAmt <= 0 || wAmt > balance) {
                                alert('Số tiền rút không hợp lệ (Phải lớn hơn 0 và nhỏ hơn số dư quỹ hiện tại).');
                                return;
                              }
                              
                              if (filterFundType !== 'debt_prep') {
                                addInvestmentDeal({
                                   name: disburseForm.dealName,
                                   assetType: fund.targetAssetType,
                                   capital: wAmt,
                                   startMonth: disburseForm.disbursedMonth,
                                   startYear: disburseForm.disbursedYear,
                                   status: 'active',
                                   notes: `Giải ngân một phần từ quỹ: ${fund.name}`
                                });
                              }

                              const newWd = {
                                id: `wd_${Date.now()}`,
                                month: disburseForm.disbursedMonth,
                                year: disburseForm.disbursedYear,
                                amount: wAmt,
                                realizedInterest: 0 // Withdrawals from Sinking Funds don't realize interest to cash flow yet (since they go to Deal/Debt)
                              };
                              updateSinkingFund({
                                ...fund,
                                withdrawals: [...(fund.withdrawals || []), newWd]
                              });
                            }
                            setDisbursingId(null);
                          }}
                        >
                          Xác nhận {settleMode === 'full' ? 'Tất toán' : 'Giải ngân từng phần'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex gap-2">
                    <Button 
                      variant="outline" 
                      className="w-full text-xs h-8 border-green-600/30 text-green-700 hover:bg-green-50"
                      onClick={() => {
                        setDisbursingId(fund.id);
                        setSettleMode('full');
                        setPartialWithdrawType('amount');
                        setPartialWithdrawValue(0);
                        setDisburseForm({
                           disbursedMonth: initMonth,
                           disbursedYear: initYear,
                           dealName: fund.name,
                           realizedInterest: 0,
                        });
                      }}
                    >
                      <ArrowRightCircle className="w-3.5 h-3.5 mr-1" /> {filterFundType === 'debt_prep' ? 'Tất toán Quỹ' : 'Giải ngân đầu tư'}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
