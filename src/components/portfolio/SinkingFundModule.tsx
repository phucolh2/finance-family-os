import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { EmptyState } from '../ui/EmptyState';
import { LifestyleFundCard } from './fund-cards/LifestyleFundCard';
import { PortfolioFundCard } from './fund-cards/PortfolioFundCard';
import { SavingsFundCard } from './fund-cards/SavingsFundCard';
import { ReservesFundCard } from './fund-cards/ReservesFundCard';
import { HelpTooltip } from '../ui/HelpTooltip';
import { Target, Plus, Trash2, ArrowRightCircle, Edit, CheckCircle } from 'lucide-react';
import { formatTableMoneyVNDMillion } from '../../utils/format';
import { safeNumber, calculateNonTermInterest } from '../../utils/math';
import { runProjection } from '../../engines/projectionEngine';
import { simulateSinkingFund } from '../../engines/sinkingFundEngine';
import type { AssetType } from '../../types/portfolio';
import { FUNDING_SOURCES, SCREEN_FUNDING_CONSTRAINTS } from '../../constants/fundingSources';
import type { FundingSourceId } from '../../constants/fundingSources';
import { VIETNAM_BANKS } from '../../constants/banks';

interface DynamicSource {
  id: string;
  label: string;
  balance: number;
}

interface SinkingFundModuleProps {
  filterFundType?: 'investment' | 'debt_prep' | 'lifestyle_savings' | 'expense_surplus' | 'savings';
  filterSources?: FundingSourceId[] | string[];
  dynamicSources?: DynamicSource[];
  title?: string;
  description?: string;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  variant?: 'portfolio' | 'savings' | 'reserves' | 'lifestyle';
}

export const SinkingFundModule: React.FC<SinkingFundModuleProps> = ({
  filterFundType = 'investment',
  filterSources,
  dynamicSources,
  title = '🎯 Quỹ tích lũy mục tiêu (Sinking Funds)',
  description = 'Gom tiền định kỳ hàng tháng để chuẩn bị cho các thương vụ lớn. Số dư đẻ lãi theo lãi suất tiết kiệm.',
  emptyStateTitle = 'Chưa có quỹ tích lũy nào',
  emptyStateDescription = 'Hãy tạo quỹ để gom tiền dần cho các mục tiêu đầu tư lớn.',
  variant = 'portfolio'
}) => {
  const { 
    state, 
    addSinkingFund,
    updateSinkingFund,
    deleteSinkingFund,
    disburseSinkingFund,
    addInvestmentDeal,
    selectedPeriodKey,
    setSelectedPeriodKey,
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

  const activeSources = dynamicSources ? dynamicSources.map(d => d.id) : (filterSources || (filterFundType === 'debt_prep' ? SCREEN_FUNDING_CONSTRAINTS.debt_prep : SCREEN_FUNDING_CONSTRAINTS.portfolio));

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
    fundGroup: '',
    depositBank: '',
    targetAssetType: 'real_estate' as AssetType,
    targetAmount: 0,
    initialDeposit: 0,
    monthlyContribution: 0,
    interestRateAnnual: 5.5,
    termMonths: 1,
    sourceOfFund: activeSources[0] as string,
    startMonth: initMonth,
    startYear: initYear,
    rolloverStrategy: 'principal_and_interest' as 'principal_and_interest' | 'principal_only' | 'none' | 'return_to_source',
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
  
  const existingFundGroups = Array.from(new Set(state.sinkingFunds?.map(f => f.fundGroup).filter(Boolean))) as string[];

  const targetKey = `${form.startYear}-${String(form.startMonth).padStart(2, '0')}`;
  const currentRow = projection.monthlyRows.find(r => r.period.key === targetKey);
  
  const getSourceLabelWithBalance = (sourceId: string) => {
      if (dynamicSources) {
          const dyn = dynamicSources.find(d => d.id === sourceId);
          if (dyn) {
              return `${dyn.label} (Còn: ${formatTableMoneyVNDMillion(dyn.balance)})`;
          }
      }
      
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
         prefix = 'Số dư Quỹ Tiết Kiệm & Dự phòng';
      } else if (sourceId === 'debt_reserve') {
         balance = (currentRow ? currentRow.debtReserveBalance : 0) + (currentRow ? (currentRow as any)._activeSinkingFundsDebtReserve || 0 : 0);
         prefix = 'Quỹ Dự phòng';
      } else if (sourceId.startsWith('expense_surplus')) {
         balance = currentRow ? currentRow.liquidityBalance : 0;
         prefix = 'Quỹ Sinh Hoạt dư';
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
    if (!fund) return { balance: 0, progress: 0, buckets: [], nonTermCash: 0, totalDisbursed: 0, autoRefundsByMonth: {}, totalDeposited: 0 };
    
    let buckets: { id: string; parentId?: string; principal: number; termStart: number; termMonths: number; interestRateAnnual: number; periodKey: string; contribAmount?: number }[] = [];
    let nonTermCash = 0;
    
    const start = fund.startYear * 12 + fund.startMonth;
    const current = currentObservedYear * 12 + currentObservedMonth;
    
    if (current >= start) {
       for (let m = start; m <= current; m++) {
          let maturingBuckets: { principal: number; parentId: string }[] = [];
          
          const mo = ((m - 1) % 12) + 1;
          const yr = Math.floor((m - 1) / 12);
          const periodKey = `${yr}-${String(mo).padStart(2, '0')}`;
          const periodCfg = fund.periodConfigs?.[periodKey];
          
          // Accrue non-term interest for nonTermCash this month
          const monthlyNonTermRate = [...(state.assumptions.nonTermInterestRateSchedule || [])]
            .sort((a, b) => (b.startYear * 12 + b.startMonth) - (a.startYear * 12 + a.startMonth))
            .find(s => (s.startYear * 12 + s.startMonth) <= (yr * 12 + mo))?.rateAnnual || 0.1;
          nonTermCash += nonTermCash * (monthlyNonTermRate / 100 / 12);

          const currentWithdrawals = (fund.withdrawals || []).filter(w => w.month === mo && w.year === yr);
          if (currentWithdrawals.length > 0) {
             currentWithdrawals.forEach(w => {
                let amountToDeduct = w.amount;
                
                // 1. Ưu tiên rút tiền từ nonTermCash trước
                if (nonTermCash >= amountToDeduct) {
                   nonTermCash -= amountToDeduct;
                   amountToDeduct = 0;
                } else {
                   amountToDeduct -= nonTermCash;
                   nonTermCash = 0;
                }
                
                // 2. Nếu chưa đủ, rút từ các bucket, ưu tiên bucket sắp đáo hạn nhất
                let newResidualBuckets: typeof buckets = [];
                if (amountToDeduct > 0) {
                   // Sắp xếp các bucket theo thời gian đáo hạn tăng dần (gần tới hạn nhất lên đầu)
                   buckets.sort((a, b) => (a.termStart + a.termMonths) - (b.termStart + b.termMonths));
                   
                   for (let i = 0; i < buckets.length && amountToDeduct > 0; i++) {
                      if (buckets[i].principal >= amountToDeduct) {
                         const residual = buckets[i].principal - amountToDeduct;
                         buckets[i].principal = 0; // Bucket này bị tất toán toàn bộ/phần
                         amountToDeduct = 0;
                         if (residual > 0) {
                            newResidualBuckets.push({
                               id: `residual_${buckets[i].id}_${m}`,
                               parentId: `Dôi dư từ kỳ T${((buckets[i].termStart-1)%12)+1}/${Math.floor((buckets[i].termStart-1)/12)}`,
                               principal: residual,
                               termStart: m, // Kỳ hạn bắt đầu tính lại từ tháng tất toán
                               termMonths: buckets[i].termMonths, // Giữ nguyên thời gian kỳ hạn
                               interestRateAnnual: buckets[i].interestRateAnnual,
                               periodKey, // Theo period config hiện tại
                               contribAmount: 0
                            });
                         }
                      } else {
                         amountToDeduct -= buckets[i].principal;
                         buckets[i].principal = 0;
                      }
                   }
                }
                buckets.push(...newResidualBuckets);
             });
             buckets = buckets.filter(b => b.principal > 0);
          }
          
          buckets = buckets.filter(b => {
             if (m - b.termStart === b.termMonths && m > b.termStart) {
                const interest = b.principal * (b.interestRateAnnual / 100 / 12) * b.termMonths;
                let rolloverPrincipal = 0;
                if (fund.rolloverStrategy === 'none') {
                   nonTermCash += b.principal + interest;
                } else if (fund.rolloverStrategy === 'principal_only') {
                   rolloverPrincipal = b.principal;
                   nonTermCash += interest;
                } else { // default or principal_and_interest
                   rolloverPrincipal = b.principal + interest;
                }
                
                if (rolloverPrincipal > 0) {
                   maturingBuckets.push({
                      principal: rolloverPrincipal,
                      parentId: `Tái tục từ kỳ T${((b.termStart-1)%12)+1}/${Math.floor((b.termStart-1)/12)}`
                   });
                }
                return false;
             }
             return true;
          });
          
          let newContrib = 0;
          if (m === start) newContrib += fund.initialDeposit;
          
          let periodContrib = 0;
          let bTerm = fund.termMonths || 1;
          let bRate = fund.interestRateAnnual || 5.5;

          if (m >= start) {
             const lastBucket = buckets.length > 0 ? buckets[buckets.length - 1] : null;
             const defaultContrib = lastBucket && lastBucket.contribAmount !== undefined ? lastBucket.contribAmount : fund.monthlyContribution;
             periodContrib = periodCfg?.contribution !== undefined ? periodCfg.contribution : defaultContrib;
             newContrib += periodContrib;

             const defaultTerm = lastBucket ? lastBucket.termMonths : (fund.termMonths || 1);
             const defaultRate = lastBucket ? lastBucket.interestRateAnnual : (fund.interestRateAnnual || 5.5);
             bTerm = periodCfg?.termMonths !== undefined ? periodCfg.termMonths : defaultTerm;
             bRate = periodCfg?.interestRateAnnual !== undefined ? periodCfg.interestRateAnnual : defaultRate;
          }
          
          if (bTerm > 0) {
             if (newContrib > 0) {
                buckets.push({ 
                   id: `T${mo}-${yr}_new`,
                   principal: newContrib, 
                   termStart: m, 
                   termMonths: bTerm, 
                   interestRateAnnual: bRate, 
                   periodKey, 
                   contribAmount: periodContrib 
                });
             }
             maturingBuckets.forEach((mb, idx) => {
                buckets.push({
                   id: `T${mo}-${yr}_rollover_${idx}`,
                   parentId: mb.parentId,
                   principal: mb.principal,
                   termStart: m,
                   termMonths: bTerm,
                   interestRateAnnual: bRate,
                   periodKey,
                   contribAmount: 0
                });
             });
          } else if (bTerm === 0) {
             nonTermCash += newContrib + maturingBuckets.reduce((sum, b) => sum + b.principal, 0);
          }
       }
    }
    
    let totalNonTermInterestForActiveBuckets = 0;
    const currentMonth = currentObservedMonth;
    const currentYear = currentObservedYear;
    buckets.forEach(b => {
       const bMonth = ((b.termStart - 1) % 12) + 1;
       const bYear = Math.floor((b.termStart - 1) / 12);
       // Tính lãi không kỳ hạn cho các bucket chưa đáo hạn (giả định tất toán hôm nay)
       totalNonTermInterestForActiveBuckets += calculateNonTermInterest(b.principal, bMonth, bYear, currentMonth, currentYear, state.assumptions.nonTermInterestRateSchedule);
    });

    const bal = buckets.reduce((sum, b) => sum + b.principal, 0) + nonTermCash + totalNonTermInterestForActiveBuckets;
    let totalDisbursed = fund.initialDeposit;
    buckets.forEach(b => {
      if (b.contribAmount && b.contribAmount > 0) {
        totalDisbursed += b.contribAmount;
      }
    });
    // Add contributions that went directly to nonTermCash if term == 0
    // Actually, calculating exact totalDisbursed is tricky when term is 0, but we can approximate or use periodConfigs.
    // For now, let's keep it simple.

    return { 
       balance: bal, 
       totalDisbursed,
       progress: fund.targetAmount > 0 ? (bal / fund.targetAmount) * 100 : 0,
       buckets,
       nonTermCash
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
          <datalist id="fund-groups">
            {existingFundGroups.map(group => <option key={group} value={group} />)}
          </datalist>
          <h4 className="font-bold text-sm text-family-text">Khởi tạo quỹ mới</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              label="Tên mục tiêu / Quỹ"
              value={form.name}
              placeholder="VD: Quỹ mua ô tô / Trả nợ nhà"
              onChange={(e) => { setForm({ ...form, name: e.target.value }); }}
            />
            <div className="flex flex-col">
              <label className="block text-xs font-semibold text-family-textMuted uppercase tracking-wider mb-1">Nhóm</label>
              <input
                list="fund-groups"
                className="block w-full rounded-xl border border-family-accent/20 bg-white/60 py-2.5 px-3 text-sm text-family-text focus:border-family-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-family-accent transition-colors"
                value={form.fundGroup}
                placeholder="VD: Cổ phiếu, BDS..."
                onChange={(e) => { setForm({ ...form, fundGroup: e.target.value }); }}
              />
            </div>
            <div className="sm:col-span-1 lg:col-span-1">
              <label className="block text-xs font-semibold text-family-textMuted uppercase tracking-wider mb-1">Ngân hàng</label>
              <select
                className="block w-full rounded-xl border border-family-accent/20 bg-white/60 py-2.5 px-3 text-sm text-family-text focus:border-family-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-family-accent transition-colors"
                value={form.depositBank}
                onChange={(e) => { setForm({ ...form, depositBank: e.target.value }); }}
              >
                <option value="">-- Chọn NH / Ví --</option>
                {VIETNAM_BANKS.map(bank => (
                  <option key={bank.id} value={bank.id}>{bank.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-1 lg:col-span-1">
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
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-family-textMuted uppercase tracking-wider mb-1">Phương thức tái tục</label>
              <select 
                className="block w-full rounded-xl border border-family-accent/20 bg-white/60 py-2.5 px-3 text-sm text-family-text focus:border-family-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-family-accent transition-colors"
                value={form.rolloverStrategy}
                onChange={e => { setForm({...form, rolloverStrategy: e.target.value as any}); }}
                disabled={form.termMonths === 0}
              >
                <option value="principal_and_interest">Tự động tái tục gốc và lãi</option>
                <option value="principal_only">Tự động tái tục gốc (Lãi sang không kỳ hạn)</option>
                <option value="none">Không tái tục (Gốc & Lãi sang không kỳ hạn)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => {
              setShowAddForm(false);
              setEditingFundId(null);
              setForm({ ...form, name: '', fundGroup: '',
    depositBank: '', initialDeposit: 0, targetAmount: 0 });
            }}>Hủy</Button>
            <Button 
              onClick={() => {
                if (editingFundId) {
                  const existing = state.sinkingFunds?.find(f => f.id === editingFundId);
                  if (existing) {
                    updateSinkingFund({
                      ...existing,
                      ...form,
                      targetScreen: variant === 'lifestyle' ? 'life_stages' : variant
                    });
                  }
                } else {
                  addSinkingFund({
                    ...form,
                    fundType: filterFundType,
                    status: 'active',
                    targetScreen: variant === 'lifestyle' ? 'life_stages' : variant
                  });
                  const newKey = `${form.startYear}-${String(form.startMonth).padStart(2, '0')}`;
                  setSelectedPeriodKey(newKey);
                }
                setShowAddForm(false);
                setEditingFundId(null);
                setForm({ ...form, name: '', fundGroup: '',
    depositBank: '', initialDeposit: 0, targetAmount: 0 });
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
        <div className="grid grid-cols-1 gap-4">
          {activeFunds.map((fund) => {
            const { balance, progress, totalDisbursed, totalDeposited, nonTermCash } = getFundBalance(fund.id);
            const isDisbursing = disbursingId === fund.id;

            const renderCashflowDetails = (fund: any) => (
                    <div className="bg-white/60 p-3 rounded-lg border border-family-accent/10 text-xs space-y-2 mt-1">
                         {fund.depositBank && (
                             <div className="flex justify-between border-b border-gray-100 pb-1">
                                <span className="text-family-textMuted">Ngân hàng gửi:</span>
                                <span className="font-semibold">{VIETNAM_BANKS.find(b => b.id === fund.depositBank)?.name || fund.depositBank}</span>
                             </div>
                         )}
                                                  <div className="flex justify-between border-b border-gray-100 pb-1">
                            <span className="text-family-textMuted">Tổng vốn đã nộp:</span>
                            <span className="font-semibold">{formatTableMoneyVNDMillion(totalDeposited || 0)} Tr</span>
                         </div>
                         <div className="flex justify-between border-b border-gray-100 pb-1">
                            <span className="text-family-textMuted">Lãi cộng dồn:</span>
                            <span className="font-semibold text-emerald-600">+{formatTableMoneyVNDMillion(balance - (totalDeposited || 0))} Tr</span>
                         </div>
                         {nonTermCash > 0 && (
                            <div className="flex justify-between border-b border-gray-100 pb-1 bg-yellow-50 px-1 rounded">
                               <span className="text-family-textMuted">Tiền chờ phân bổ (Không kỳ hạn):</span>
                               <span className="font-semibold text-amber-600">{formatTableMoneyVNDMillion(nonTermCash)} Tr</span>
                            </div>
                         )}
                         <div className="pt-1">
                            <span className="text-family-textMuted text-[10px] uppercase mb-1 block">Các khoản đang gửi tích lũy:</span>
                            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                               {getFundBalance(fund.id).buckets.map((b: any, i: number) => {
                                  const bMo = ((b.termStart - 1) % 12) + 1;
                                  const bYr = Math.floor((b.termStart - 1) / 12);
                                  const pKey = b.periodKey || `${bYr}-${String(bMo).padStart(2, '0')}`;

                                  return (
                                     <div key={i} className="flex flex-col bg-white p-2 rounded shadow-sm border border-gray-100 gap-2 mb-2">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] gap-2">
                                          <div className="flex items-center gap-1.5">
                                             <div className="flex flex-col">
                                               <span className="font-semibold text-family-text">Kỳ T{bMo}/{bYr}:</span>
                                               {b.parentId && <span className="text-[9px] text-blue-600 bg-blue-50 px-1 py-0.5 rounded-sm mt-0.5">{b.parentId}</span>}
                                             </div>
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
                                              {b.termMonths > 0 && b.interestRateAnnual > 0 && (
                                                 <span className="text-[10px] text-emerald-600 font-semibold ml-2">
                                                    (+ {formatTableMoneyVNDMillion(b.principal * (b.interestRateAnnual / 100 / 12) * b.termMonths)} Tr lãi)
                                                 </span>
                                              )}
                                           </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                               })}
                            </div>
                         </div>
                      </div>
            );

            const renderDisburseForm = (fund: any) => (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-xs font-bold text-green-800">
                        {filterFundType === 'debt_prep' ? 'Quản lý Tất toán & Rút gốc' : (filterFundType === 'investment' ? 'Giải ngân thành Thương vụ mới' : 'Sử dụng / Rút quỹ')}
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
                          label={filterFundType === 'investment' ? "Tên thương vụ đầu tư" : "Mục đích sử dụng quỹ"}
                          value={disburseForm.dealName}
                          onChange={(e) => { setDisburseForm({ ...disburseForm, dealName: e.target.value }); }}
                          placeholder={filterFundType === 'investment' ? `VD: Mua ${fund.name}` : `VD: Chi tiêu cho ${fund.name}`}
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
                      
                      {(() => {
                        if (settleMode === 'partial') {
                          const wAmt = partialWithdrawType === 'amount' ? partialWithdrawValue : (balance * partialWithdrawValue / 100);
                          if (wAmt > 0 && wAmt <= balance) {
                            let breakdownNonTerm = 0;
                            const breakdownBuckets: any[] = [];
                            let rem = wAmt;
                            
                            const sim = getFundBalance(fund.id);
                            let simNonTerm = sim.nonTermCash || 0;
                            if (simNonTerm >= rem) {
                               breakdownNonTerm = rem;
                               rem = 0;
                            } else {
                               breakdownNonTerm = simNonTerm;
                               rem -= simNonTerm;
                            }
                            
                            if (rem > 0) {
                               const sorted = [...sim.buckets].sort((a: any, b: any) => (a.termStart + a.termMonths) - (b.termStart + b.termMonths));
                               for (const b of sorted) {
                                  if (rem <= 0) break;
                                  const deduct = Math.min(b.principal, rem);
                                  breakdownBuckets.push({
                                     periodKey: b.periodKey || `${Math.floor((b.termStart-1)/12)}-${String(((b.termStart-1)%12)+1).padStart(2,'0')}`,
                                     deduct
                                  });
                                  rem -= deduct;
                               }
                            }
                            
                            return (
                               <div className="w-full mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                                  <p className="text-[11px] font-bold text-yellow-800 mb-1">Cơ chế tất toán thông minh sẽ tự động ưu tiên rút:</p>
                                  <ul className="list-disc pl-4 text-[10px] text-yellow-800 space-y-0.5">
                                     {breakdownNonTerm > 0 && <li>Từ phần không kỳ hạn: <strong>{formatTableMoneyVNDMillion(breakdownNonTerm)} Tr</strong></li>}
                                     {breakdownBuckets.map((b: any, i: number) => (
                                        <li key={i}>Tất toán từ kỳ hạn T{b.periodKey.split('-')[1]}/{b.periodKey.split('-')[0]}: <strong>{formatTableMoneyVNDMillion(b.deduct)} Tr</strong></li>
                                     ))}
                                     {breakdownBuckets.length > 0 && <li>Phần dôi ra của các kỳ hạn trên (nếu có) vẫn tiếp tục duy trì kỳ hạn cũ.</li>}
                                  </ul>
                               </div>
                            );
                          }
                        }
                        return null;
                      })()}


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
                                   notes: `Giải ngân từng phần từ quỹ: ${fund.name}`
                                });
                              }
                              
                              const updatedFund = JSON.parse(JSON.stringify(fund));
                              if (!updatedFund.withdrawals) updatedFund.withdrawals = [];
                              updatedFund.withdrawals.push({
                                 amount: wAmt,
                                 month: disburseForm.disbursedMonth,
                                 year: disburseForm.disbursedYear,
                              });
                              updateSinkingFund(updatedFund);
                            }
                            setDisbursingId(null);
                          }}
                        >
                          Xác nhận
                        </Button>
                      </div>
                    </div>
                  </div>
            );

            const cardProps = {
               fund: fund as any,
               balance, progress, totalDisbursed: totalDisbursed ?? 0, totalDeposited: totalDeposited ?? 0, isDisbursing,
               expandedFundId, setExpandedFundId, 
               onEdit: () => {
                   setEditingFundId(fund.id);
                   setForm({
                     name: fund.name,
                     fundGroup: fund.fundGroup || '',
                     depositBank: fund.depositBank || '',
                     targetAssetType: fund.targetAssetType,
                     targetAmount: fund.targetAmount,
                     initialDeposit: fund.initialDeposit,
                     monthlyContribution: fund.monthlyContribution,
                     interestRateAnnual: fund.interestRateAnnual || 5.5,
                     termMonths: fund.termMonths || 1,
                     sourceOfFund: (fund.sourceOfFund || activeSources[0]) as string,
                     startMonth: fund.startMonth,
                     startYear: fund.startYear,
                     rolloverStrategy: fund.rolloverStrategy || 'principal_and_interest',
                   });
                   setShowAddForm(true);
                   window.scrollTo({ top: 0, behavior: 'smooth' });
               },
               onDelete: () => { if(window.confirm('Bạn có chắc muốn xoá quỹ này không?')) deleteSinkingFund(fund.id); },
               onDisburse: () => {
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
               },
               renderDisburseForm, renderCashflowDetails,
               dynamicSources, FUNDING_SOURCES, formatMoney: formatTableMoneyVNDMillion, filterFundType
            };

            return (
              <React.Fragment key={fund.id}>
                {variant === 'lifestyle' && <LifestyleFundCard {...cardProps} />}
                {variant === 'savings' && <SavingsFundCard {...cardProps} />}
                {variant === 'reserves' && <ReservesFundCard {...cardProps} />}
                {variant === 'portfolio' && <PortfolioFundCard {...cardProps} />}
              </React.Fragment>
            );

          })}
        </div>
      )}
    </div>
  );
};
