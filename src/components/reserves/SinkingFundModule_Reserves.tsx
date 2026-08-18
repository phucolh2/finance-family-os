import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { EmptyState } from '../ui/EmptyState';
import { LifestyleFundCard } from '../portfolio/fund-cards/LifestyleFundCard';
import { PortfolioFundCard } from '../portfolio/fund-cards/PortfolioFundCard';
import { SavingsFundCard } from '../portfolio/fund-cards/SavingsFundCard';
import { ReservesFundCard } from '../portfolio/fund-cards/ReservesFundCard';
import { HelpTooltip } from '../ui/HelpTooltip';
import { Target, Plus, CheckCircle, RotateCcw, AlertCircle } from 'lucide-react';
import { formatTableMoneyVNDMillion, formatKpiMoneyVNDMillion } from '../../utils/format';
import { safeNumber, calculateNonTermInterest } from '../../utils/math';
import { runProjection } from '../../engines/projectionEngine';
import type { AssetType } from '../../types/portfolio';
import { FUNDING_SOURCES, SCREEN_FUNDING_CONSTRAINTS } from '../../constants/fundingSources';
import type { FundingSourceId } from '../../constants/fundingSources';
import { VIETNAM_BANKS } from '../../constants/banks';
import { isWithinObservationPeriod, getPeriodGuardMessage } from '../../utils/periodGuard';

interface DynamicSource {
  id: string;
  label: string;
  balance: number;
}

interface SinkingFundModule_ReservesProps {
  filterFundType?: 'investment' | 'debt_prep' | 'lifestyle_savings' | 'expense_surplus' | 'savings';
  filterSources?: FundingSourceId[] | string[];
  dynamicSources?: DynamicSource[];
  title?: string;
  description?: string;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  variant?: 'portfolio' | 'savings' | 'reserves' | 'lifestyle';
}

export const SinkingFundModule_Reserves: React.FC<SinkingFundModule_ReservesProps> = ({
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
    disburseSinkingFundWithEvent,
    updateSinkingFundWithEvent,
    undoSinkingFundDisbursement,
    addInvestmentDeal,
    addLifeEvent,
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

  const activeSources = dynamicSources ? dynamicSources.map(d => d.id) : (filterSources || (filterFundType === 'debt_prep' ? SCREEN_FUNDING_CONSTRAINTS.debt_prep : filterFundType === 'savings' ? SCREEN_FUNDING_CONSTRAINTS.savings_deposit : SCREEN_FUNDING_CONSTRAINTS.portfolio));

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFundId, setEditingFundId] = useState<string | null>(null);
  const [expandedFundId, setExpandedFundId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  React.useEffect(() => {
    setShowAddForm(false);
    setEditingFundId(null);
    setFormError(null);
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
    sourceOfFund: activeSources[0],
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
    disburseDestination: variant === 'portfolio' ? 'none' : 'life_event',
    disburseSource: '',
  });

  const activeFunds = state.sinkingFunds?.filter(f => f.status === 'active' && (f.fundType || 'investment') === filterFundType) || [];
  
  const existingFundGroups = Array.from(new Set(state.sinkingFunds?.map(f => f.fundGroup).filter(Boolean))) as string[];

  const targetKey = `${form.startYear}-${String(form.startMonth).padStart(2, '0')}`;
  const currentRow = projection.monthlyRows.find(r => r.period.key === targetKey);
  
  const getSourceLabelWithBalance = (sourceId: string) => {
      if (dynamicSources) {
          const dyn = dynamicSources.find(d => d.id === sourceId);
          if (dyn) {
              return `${dyn.label} (Còn: ${formatKpiMoneyVNDMillion(dyn.balance)})`;
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
            prefix = 'Ngân sách Đầu tư (Chưa phân bổ)';
         } else {
            prefix = 'Tiền nhàn rỗi (Chưa có kế hoạch)';
         }
      } else if (sourceId === 'saving') {
         balance = currentRow ? currentRow.savingBalance : 0;
         prefix = 'Số dư Quỹ Tiết Kiệm & Dự phòng';
      } else if (sourceId === 'debt_reserve') {
         balance = (currentRow ? currentRow.debtReserveBalance : 0) + (currentRow ? (currentRow as any)._activeSinkingFundsDebtReserve || 0 : 0);
         prefix = 'Số dư Dự phòng';
      } else if (sourceId.startsWith('expense_surplus')) {
         balance = currentRow ? currentRow.liquidityBalance : 0;
         prefix = 'Quỹ Sinh Hoạt dư';
      }
      return `${prefix} (Còn: ${formatKpiMoneyVNDMillion(balance)})`;
  };

  const nowKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const activeRow = (projection.monthlyRows.length > 0 && selectedPeriodKey)
    ? (projection.monthlyRows.find(r => r.period.key === selectedPeriodKey) || projection.monthlyRows[0])
    : (projection.monthlyRows.find(r => r.period.key === nowKey) || projection.monthlyRows[0]);
  const currentObservedMonth = activeRow ? activeRow.period.month : initMonth;
  const currentObservedYear = activeRow ? activeRow.period.year : initYear;

  // Helper to find latest state of a fund from projection
  const getFundBalance = (fundId: string) => {

    const fund = activeFunds.find(f => f.id === fundId);
    if (!fund) return { balance: 0, progress: 0, buckets: [], nonTermCash: 0, totalDisbursed: 0, autoRefundsByMonth: {}, totalDeposited: 0 };
    
    let buckets: { id: string; parentId?: string; principal: number; termStart: number; termMonths: number; interestRateAnnual: number; periodKey: string; contribAmount?: number; rolledOverPrincipal?: number; rolledOverInterest?: number }[] = [];
    let nonTermCash = 0;
    
    const start = fund.startYear * 12 + fund.startMonth;
    const current = currentObservedYear * 12 + currentObservedMonth;
    
    let totalDeposited = 0;
    let totalDisbursed = 0;
    
    if (current >= start) {
       for (let m = start; m <= current; m++) {
          const maturingBuckets: { principal: number; parentId: string; rolledOverPrincipal?: number; rolledOverInterest?: number }[] = [];
          
          const mo = ((m - 1) % 12) + 1;
          const yr = Math.floor((m - 1) / 12);
          const periodKey = `${yr}-${String(mo).padStart(2, '0')}`;
          const periodCfg = fund.periodConfigs?.[periodKey];
          
          // Accrue non-term interest for nonTermCash this month
          const monthlyNonTermRate = [...(state.assumptions.nonTermInterestRateSchedule || [])]
            .sort((a, b) => (b.startYear * 12 + b.startMonth) - (a.startYear * 12 + a.startMonth))
            .find(s => (s.startYear * 12 + s.startMonth) <= (yr * 12 + mo))?.rateAnnual || 0.1;
          nonTermCash += nonTermCash * (monthlyNonTermRate / 100 / 12);

          const maturedCashPool: { 
             id: string; 
             principal: number; 
             interestAccrued: number; 
             maturedTotal: number; 
             termStart: number; 
             termMonths: number; 
             interestRateAnnual: number; 
             periodKey: string;
          }[] = [];

          // 1. Kiểm tra đáo hạn trước khi rút tiền
          buckets = buckets.filter(b => {
             if (m - b.termStart === b.termMonths && m > b.termStart) {
                const interest = b.principal * (b.interestRateAnnual / 100 / 12) * b.termMonths;
                maturedCashPool.push({
                   id: b.id,
                   principal: b.principal,
                   interestAccrued: interest,
                   maturedTotal: b.principal + interest,
                   termStart: b.termStart,
                   termMonths: b.termMonths,
                   interestRateAnnual: b.interestRateAnnual,
                   periodKey: b.periodKey
                });
                return false;
             }
             return true;
          });

          // 2. Xử lý rút tiền
          const currentWithdrawals = (fund.withdrawals || []).filter(w => w.month === mo && w.year === yr);
          if (currentWithdrawals.length > 0) {
             currentWithdrawals.forEach(w => {
                totalDisbursed += w.amount;
                let amountToDeduct = w.amount;
                
                // 2.1 Rút từ nonTermCash trước
                if (nonTermCash >= amountToDeduct) {
                   nonTermCash -= amountToDeduct;
                   amountToDeduct = 0;
                } else {
                   amountToDeduct -= nonTermCash;
                   nonTermCash = 0;
                }
                
                // 2.2 Rút từ maturedCashPool (sổ đã đáo hạn hưởng trọn lãi suất)
                if (amountToDeduct > 0 && maturedCashPool.length > 0) {
                   for (let i = 0; i < maturedCashPool.length && amountToDeduct > 0; i++) {
                      const item = maturedCashPool[i];
                      if (item.maturedTotal >= amountToDeduct) {
                         item.maturedTotal -= amountToDeduct;
                         amountToDeduct = 0;
                      } else {
                         amountToDeduct -= item.maturedTotal;
                         item.maturedTotal = 0;
                      }
                   }
                }
                
                // 2.3 Rút từ các sổ đang gửi chưa đáo hạn, ưu tiên sổ mới gửi nhất (termStart lớn nhất)
                if (amountToDeduct > 0) {
                   buckets.sort((a, b) => b.termStart - a.termStart);
                   const newResidualBuckets: typeof buckets = [];
                   for (let i = 0; i < buckets.length && amountToDeduct > 0; i++) {
                      if (buckets[i].principal >= amountToDeduct) {
                         const residual = buckets[i].principal - amountToDeduct;
                         buckets[i].principal = 0;
                         amountToDeduct = 0;
                         if (residual > 0) {
                            newResidualBuckets.push({
                               id: `residual_${buckets[i].id}_${m}`,
                               parentId: `Dôi dư từ kỳ T${((buckets[i].termStart-1)%12)+1}/${Math.floor((buckets[i].termStart-1)/12)}`,
                               principal: residual,
                               termStart: m,
                               termMonths: buckets[i].termMonths,
                               interestRateAnnual: buckets[i].interestRateAnnual,
                               periodKey,
                               contribAmount: 0
                            });
                         }
                      } else {
                         amountToDeduct -= buckets[i].principal;
                         buckets[i].principal = 0;
                      }
                   }
                   buckets.push(...newResidualBuckets);
                   buckets = buckets.filter(b => b.principal > 0);
                }
             });
          }

          // 3. Xử lý tái tục cho phần dư còn lại của các sổ đáo hạn
          maturedCashPool.forEach(item => {
             if (item.maturedTotal > 0) {
                let rolloverPrincipal = 0;
                const strat = fund.rolloverStrategy;
                
                const totalMaturedBeforeWithdrawal = item.principal + item.interestAccrued;
                const principalRatio = totalMaturedBeforeWithdrawal > 0 ? (item.principal / totalMaturedBeforeWithdrawal) : 1;
                const remainingPrincipal = item.maturedTotal * principalRatio;
                const remainingInterest = item.maturedTotal - remainingPrincipal;

                if (strat === 'none') {
                   nonTermCash += item.maturedTotal;
                } else if (strat === 'principal_only') {
                   rolloverPrincipal = remainingPrincipal;
                   nonTermCash += remainingInterest;
                } else { // default or principal_and_interest
                   rolloverPrincipal = item.maturedTotal;
                }
                
                if (rolloverPrincipal > 0) {
                   const pId = `Tái tục từ kỳ T${((item.termStart-1)%12)+1}/${Math.floor((item.termStart-1)/12)}`;
                   const existing = maturingBuckets.find(x => x.parentId === pId);
                   if (existing) {
                      existing.principal += rolloverPrincipal;
                      existing.rolledOverPrincipal = (existing.rolledOverPrincipal || 0) + remainingPrincipal;
                      existing.rolledOverInterest = (existing.rolledOverInterest || 0) + remainingInterest;
                   } else {
                      maturingBuckets.push({
                         principal: rolloverPrincipal,
                         parentId: pId,
                         rolledOverPrincipal: remainingPrincipal,
                         rolledOverInterest: remainingInterest
                      });
                   }
                }
             }
          });
          
          let newContrib = 0;
          if (m === start) newContrib += fund.initialDeposit;
          
          let periodContrib = 0;
          let bTerm = fund.termMonths || 1;
          let bRate = fund.interestRateAnnual || 5.5;

          if (m >= start) {
             periodContrib = periodCfg?.contribution !== undefined ? periodCfg.contribution : (fund.monthlyContribution || 0);
             newContrib += periodContrib;

             bTerm = periodCfg?.termMonths !== undefined ? periodCfg.termMonths : (fund.termMonths || 1);
             bRate = periodCfg?.interestRateAnnual !== undefined ? periodCfg.interestRateAnnual : (fund.interestRateAnnual || 5.5);
          }
          
          if (bTerm > 0) {
             let combinedPrincipal = newContrib;
             let totalRolledOverPrincipal = 0;
             let totalRolledOverInterest = 0;
             let hasRollover = false;
             const parentIds: string[] = [];

             maturingBuckets.forEach((mb) => {
                 combinedPrincipal += mb.principal;
                 totalRolledOverPrincipal += (mb.rolledOverPrincipal || 0);
                 totalRolledOverInterest += (mb.rolledOverInterest || 0);
                 if (mb.parentId && !parentIds.includes(mb.parentId)) {
                     parentIds.push(mb.parentId);
                 }
                 hasRollover = true;
             });

             if (combinedPrincipal > 0) {
                 buckets.push({
                     id: `T${mo}-${yr}_combined`,
                     parentId: hasRollover ? (parentIds.length > 0 ? parentIds.join(', ') : `Tái tục kỳ trước`) : undefined,
                     principal: combinedPrincipal,
                     termStart: m,
                     termMonths: bTerm,
                     interestRateAnnual: bRate,
                     periodKey,
                     contribAmount: periodContrib,
                     rolledOverPrincipal: hasRollover ? totalRolledOverPrincipal : undefined,
                     rolledOverInterest: hasRollover ? totalRolledOverInterest : undefined
                 });
             }
          } else if (bTerm === 0) {
              let maturingSum = 0;
              maturingBuckets.forEach(mb => maturingSum += mb.principal);
              nonTermCash += newContrib + maturingSum;
           }
           totalDeposited += newContrib;
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
     // totalDeposited and totalDisbursed are accumulated accurately during the simulation loop.

    return { 
       balance: bal, 
       totalDisbursed,
       totalDeposited,
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
            <HelpTooltip text={variant === 'reserves' 
              ? "Công cụ giúp bạn lên kế hoạch góp tiền đều đặn hàng tháng để chuẩn bị tài chính cho các sự kiện rủi ro (y tế, thất nghiệp) hoặc mục tiêu phòng thủ. Gợi ý: Bạn nên dự phòng tối thiểu từ 3 đến 6 tháng chi phí sinh hoạt thiết yếu của gia đình để đảm bảo an toàn tài chính."
              : variant === 'savings'
              ? "Công cụ giúp bạn lên kế hoạch góp tiền đều đặn hàng tháng để đạt được mục tiêu tích lũy hoặc mua sắm (hưu trí, học vấn, mua xe) trong tương lai."
              : "Công cụ giúp bạn lên kế hoạch góp tiền đều đặn hàng tháng để đạt được mục tiêu mua tài sản lớn (nhà, xe, mở sổ tiết kiệm lớn) trong tương lai mà không bị sốc dòng tiền."} />
          </h3>
          <p className="text-sm text-family-textMuted mt-1">
            {description}
          </p>
        </div>
        <Button onClick={() => { 
          if (!showAddForm) {
            setForm({ ...form, startMonth: currentObservedMonth, startYear: currentObservedYear, name: '', fundGroup: '', depositBank: '', initialDeposit: 0, targetAmount: 0 });
          }
          setShowAddForm(!showAddForm); 
        }} size="sm" className="gap-1 text-xs py-1 h-8 shrink-0">
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
              placeholder={variant === 'reserves' ? "VD: Quỹ y tế / Dự phòng thất nghiệp" : variant === 'savings' ? "VD: Quỹ học vấn / Hưu trí" : "VD: Quỹ mua ô tô / Trả nợ nhà"}
              onChange={(e) => { setForm({ ...form, name: e.target.value }); }}
            />
            <div className="flex flex-col">
              <label className="block text-xs font-semibold text-family-textMuted uppercase tracking-wider mb-1">Nhóm</label>
              <input
                list="fund-groups"
                className="block w-full rounded-xl border border-family-accent/20 bg-white/60 py-2.5 px-3 text-sm text-family-text focus:border-family-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-family-accent transition-colors"
                value={form.fundGroup}
                placeholder={variant === 'reserves' ? "VD: Sức khỏe, Khẩn cấp..." : variant === 'savings' ? "VD: Tiết kiệm dài hạn..." : "VD: Cổ phiếu, BDS..."}
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
                onChange={e => { setForm({...form, sourceOfFund: e.target.value}); }}
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
              label="Số tiền cần đạt (triệu VND)"
              type="number"
              value={form.targetAmount || ''}
              placeholder="VD: 500"
              onChange={(e) => { setForm({ ...form, targetAmount: safeNumber(Number(e.target.value), 0) }); }}
            />
            <Input
              label="Số vốn góp ban đầu (triệu VND)"
              type="number"
              value={form.initialDeposit || ''}
              placeholder="VD: 50"
              onChange={(e) => { setForm({ ...form, initialDeposit: safeNumber(Number(e.target.value), 0) }); }}
            />
            <Input
              label="Định kì phân bổ hằng tháng (triệu)"
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
          {formError && (
            <div className="text-red-500 text-sm font-semibold bg-red-50 p-2 rounded-lg border border-red-200">
              Lỗi: {formError}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2 items-center">
            {!isWithinObservationPeriod(form.startMonth, form.startYear, selectedPeriodKey) && (
              <span className="text-red-500 text-[10px] flex-1 pr-2">{getPeriodGuardMessage(selectedPeriodKey)}</span>
            )}
            <Button variant="outline" onClick={() => {
              setShowAddForm(false);
              setEditingFundId(null);
              setFormError(null);
              setForm({ ...form, name: '', fundGroup: '',
    depositBank: '', initialDeposit: 0, targetAmount: 0 });
            }}>Hủy</Button>
            <Button 
              onClick={() => {
                const firstMonthDeduction = form.initialDeposit + (form.monthlyContribution || 0);
                const source = dynamicSources?.find(s => s.id === form.sourceOfFund);
                
                if (!editingFundId && source && firstMonthDeduction > source.balance) {
                   setFormError(`Tổng vốn tháng đầu (${firstMonthDeduction}tr) vượt quá số dư khả dụng (${source.balance}tr) của ${source.label}.`);
                   return;
                }
                setFormError(null);

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
              disabled={!form.name.trim() || !isWithinObservationPeriod(form.startMonth, form.startYear, selectedPeriodKey)}
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
                            <span className="font-semibold">{formatTableMoneyVNDMillion(totalDeposited || 0)}</span>
                         </div>
                         <div className="flex justify-between border-b border-gray-100 pb-1">
                            <span className="text-family-textMuted">Lãi cộng dồn:</span>
                             <span className="font-semibold text-emerald-600">{(balance + (totalDisbursed || 0) - (totalDeposited || 0)) >= 0 ? '+' : ''}{formatTableMoneyVNDMillion(balance + (totalDisbursed || 0) - (totalDeposited || 0))}</span>
                         </div>
                         {fund.withdrawals && fund.withdrawals.length > 0 && (
                            <div className="pt-2 border-b border-gray-100 pb-2">
                              <span className="text-family-textMuted text-[10px] uppercase mb-1 block">Lịch sử rút tiền / Giải ngân:</span>
                              <div className="space-y-1 max-h-[200px] overflow-y-auto">
                                {fund.withdrawals.map((w: any, idx: number) => {
                                  let fallbackNote = 'Giải ngân';
                                  if (variant === 'reserves') fallbackNote = 'Sự kiện chi tiêu';
                                  else if (variant === 'portfolio') fallbackNote = 'Chuyển sang đầu tư';
                                  
                                  // Kiểm tra xem LifeEvent tương ứng có tồn tại không
                                  const hasLinkedEvent = w.eventId && state.lifeEvents.some(e => e.id === w.eventId);
                                  const isOrphanedExpense = !w.eventId && w.note && (w.note.includes('chi tiêu') || w.note.includes('Chi tiêu') || w.note.includes('sự kiện') || w.note.includes('Sự kiện'));
                                  
                                  return (
                                    <div key={w.id || idx} className="text-[11px] bg-red-50 p-1.5 rounded border border-red-100 group">
                                      <div className="flex justify-between items-center">
                                        <span className="text-gray-700 line-clamp-1 flex-1 pr-2 font-medium">Kỳ T{w.month}/{w.year}: {w.note || fallbackNote}</span>
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-bold text-red-600 shrink-0">-{formatTableMoneyVNDMillion(w.amount)}</span>
                                          {w.id && (
                                              <button 
                                                  onClick={() => {
                                                      if (window.confirm('Bạn có chắc muốn hoàn tác (undo) khoản rút này? Mọi sự kiện chi tiêu tự động đi kèm cũng sẽ bị xoá khỏi dòng thời gian.')) {
                                                          undoSinkingFundDisbursement(fund.id, w.id);
                                                      }
                                                  }}
                                                  className="text-red-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                                  title="Hoàn tác khoản rút này"
                                              >
                                                  <RotateCcw className="w-3.5 h-3.5" />
                                              </button>
                                          )}
                                        </div>
                                      </div>
                                      {/* Trạng thái liên kết sự kiện */}
                                      {hasLinkedEvent && (
                                        <div className="mt-1 text-[10px] text-green-600 flex items-center gap-1">
                                          <CheckCircle className="w-3 h-3" /> Đã ghi nhận trên dòng thời gian chi tiêu
                                        </div>
                                      )}
                                      {w.eventId && !hasLinkedEvent && (
                                        <div className="mt-1 text-[10px] text-amber-600 flex items-center gap-1">
                                          <AlertCircle className="w-3 h-3" /> Sự kiện đã bị xoá khỏi dòng thời gian
                                        </div>
                                      )}
                                      {isOrphanedExpense && (
                                        <div className="mt-1 flex items-center gap-2">
                                          <span className="text-[10px] text-amber-600 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> Chưa liên kết sự kiện chi tiêu
                                          </span>
                                          <button 
                                            onClick={() => {
                                              const evId = `event_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                                              const wId = w.id || `w_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                                              const ev = {
                                                id: evId,
                                                name: w.note || `Rút quỹ: ${fund.name}`,
                                                month: w.month,
                                                year: w.year,
                                                amount: -(w.amount),
                                                recurringMonthlyImpact: 0,
                                                source: fund.sourceOfFund || 'expense_surplus',
                                                type: 'other' as const,
                                                affectsNetWorth: true
                                              };
                                              // Cập nhật withdrawal với eventId + id mới, đồng thời tạo LifeEvent
                                              const updatedFund = JSON.parse(JSON.stringify(fund));
                                              updatedFund.withdrawals[idx] = { ...w, id: wId, eventId: evId };
                                              updateSinkingFundWithEvent(updatedFund, ev);
                                            }}
                                            className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold underline transition-colors"
                                          >
                                            Tạo lại sự kiện
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                         )}
                         {nonTermCash > 0 && (
                            <div className="flex justify-between border-b border-gray-100 pb-1 bg-yellow-50 px-1 rounded">
                               <span className="text-family-textMuted">Tiền chờ phân bổ (Không kỳ hạn):</span>
                               <span className="font-semibold text-amber-600">{formatTableMoneyVNDMillion(nonTermCash)}</span>
                            </div>
                         )}
                         <div className="pt-1">
                            <span className="text-family-textMuted text-[10px] uppercase mb-1 block">Các khoản đang gửi tích lũy:</span>
                            <div className="space-y-1.5 max-h-[800px] overflow-y-auto pr-1">
                               {(() => {
                                   const actualBuckets = getFundBalance(fund.id).buckets;
                                   const displayBuckets = [...actualBuckets];
                                   const bucketPeriods = new Set(actualBuckets.map((b: any) => b.periodKey || `${Math.floor((b.termStart - 1) / 12)}-${String(((b.termStart - 1) % 12) + 1).padStart(2, '0')}`));

                                   if (fund.periodConfigs) {
                                      Object.keys(fund.periodConfigs).forEach(pKey => {
                                         if (!bucketPeriods.has(pKey)) {
                                            const parts = pKey.split('-');
                                            if (parts.length === 2) {
                                               const y = Number(parts[0]);
                                               const m = Number(parts[1]);
                                               const termStart = y * 12 + m;
                                               const termMonths = fund.periodConfigs[pKey].termMonths ?? 6;
                                               const obsIdx = currentObservedYear * 12 + currentObservedMonth;
                                               
                                               // Only show dummy bucket if it has already started (termStart <= obsIdx) 
                                               // AND it hasn't matured yet relative to the observed month
                                               if (termStart <= obsIdx && obsIdx < termStart + termMonths) {
                                                   displayBuckets.push({
                                                      id: `dummy_${pKey}`,
                                                      principal: 0,
                                                      termStart: termStart,
                                                      termMonths: termMonths,
                                                      interestRateAnnual: fund.periodConfigs[pKey].interestRateAnnual ?? fund.interestRateAnnual ?? 0,
                                                      periodKey: pKey,
                                                      contribAmount: fund.periodConfigs[pKey].contribution ?? 0
                                                   });
                                               }
                                            }
                                         }
                                      });
                                   }

                                   const obsPeriodKey = `${currentObservedYear}-${String(currentObservedMonth).padStart(2, '0')}`;
                                   if (!bucketPeriods.has(obsPeriodKey) && !fund.periodConfigs?.[obsPeriodKey]) {
                                       const obsIdx = currentObservedYear * 12 + currentObservedMonth;
                                       const startIdx = fund.startYear * 12 + fund.startMonth;
                                       if (obsIdx >= startIdx) {
                                           displayBuckets.push({
                                              id: `dummy_current_${obsPeriodKey}`,
                                              principal: 0,
                                              termStart: obsIdx,
                                              termMonths: 6,
                                              interestRateAnnual: fund.interestRateAnnual ?? 0,
                                              periodKey: obsPeriodKey,
                                              contribAmount: fund.monthlyContribution ?? 0
                                           });
                                       }
                                   }

                                   displayBuckets.sort((a, b) => a.termStart - b.termStart);

                                   return displayBuckets.map((b: any, i: number) => {
                                      const bMo = ((b.termStart - 1) % 12) + 1;
                                      const bYr = Math.floor((b.termStart - 1) / 12);
                                      const pKey = b.periodKey || `${bYr}-${String(bMo).padStart(2, '0')}`;
                                      const isPast = b.termStart < currentObservedYear * 12 + currentObservedMonth;

                                  return (
                                     <div key={i} className="flex flex-col bg-white p-2 rounded shadow-sm border border-gray-100 gap-2 mb-2">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] gap-2">
                                          <div className="flex items-center gap-1.5">
                                             <div className="flex flex-col">
                                               <span className="font-semibold text-family-text">Kỳ T{bMo}/{bYr}:</span>
                                               {b.parentId && <span className="text-[9px] text-blue-600 bg-blue-50 px-1 py-0.5 rounded-sm mt-0.5">{b.parentId}</span>}
                                             </div>
                                             {b.parentId && b.rolledOverPrincipal === undefined ? (
                                                 <div className="flex items-center">
                                                    <span className="font-bold text-family-accent text-[12px] bg-orange-50/50 px-2 py-0.5 rounded border border-orange-100">{formatTableMoneyVNDMillion(b.principal)}</span>
                                                 </div>
                                              ) : (
                                                 <div className="flex items-center flex-wrap gap-1.5">
                                                    {(b.rolledOverPrincipal !== undefined || b.principal > (fund.periodConfigs?.[pKey]?.contribution ?? fund.monthlyContribution) + 0.01) && (
                                                       <div className="flex items-center mr-1">
                                                          <span className="font-bold text-family-accent text-[12px] bg-orange-50 px-2 py-0.5 rounded border border-orange-100">{formatTableMoneyVNDMillion(b.principal)}</span>
                                                       </div>
                                                    )}
                                                    {(b.rolledOverPrincipal !== undefined || b.principal > (fund.periodConfigs?.[pKey]?.contribution ?? fund.monthlyContribution) + 0.01) ? (
                                                       <div className="text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 flex items-center gap-1 flex-wrap">
                                                          <span className="text-gray-400">Cấu phần:</span>
                                                          {b.rolledOverPrincipal !== undefined ? (
                                                             <>
                                                                <span className="font-bold text-slate-700">{formatTableMoneyVNDMillion(b.rolledOverPrincipal)}</span>
                                                                <span className="text-gray-400">gốc cũ</span>
                                                                <span className="text-gray-300 font-light">+</span>
                                                                <span className="font-bold text-emerald-600">{formatTableMoneyVNDMillion(b.rolledOverInterest)}</span>
                                                                <span className="text-emerald-500 font-medium">lãi</span>
                                                             </>
                                                          ) : (
                                                             <>
                                                                <span className="font-bold text-slate-700">{formatTableMoneyVNDMillion(fund.initialDeposit)}</span>
                                                                <span className="text-gray-400">gốc ban đầu</span>
                                                             </>
                                                          )}
                                                          <span className="text-gray-300 font-light">+</span>
                                                          <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm">
                                                             <input type="number" step="0.1" min="0" disabled={isPast}
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
                                                                className="w-10 text-right text-[11px] font-bold text-family-accent bg-transparent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                                             />
                                                             <span className="text-family-accent font-bold text-[11px]">triệu định kỳ</span>
                                                          </div>
                                                       </div>
                                                    ) : (
                                                       <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                                          <input type="number" step="0.1" min="0" disabled={isPast}
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
                                                             className="w-14 text-right text-[11px] bg-white border border-family-accent/30 rounded px-1.5 py-0.5 font-bold text-family-accent focus:outline-none focus:ring-1 focus:ring-family-accent disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                                                          />
                                                          <span className="font-bold text-family-accent text-[11px]">triệu định kỳ</span>
                                                       </div>
                                                    )}
                                                 </div>
                                              )}
                                        </div>
                                        
                                        <div className="flex items-center gap-3 text-xs">
                                           <div className="flex items-center gap-1">
                                              <span className="text-[10px] text-family-textMuted">Kỳ hạn:</span>
                                              <select value={b.termMonths} disabled={isPast}
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
                                                 className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 font-medium text-family-text focus:outline-none focus:ring-1 focus:ring-family-accent disabled:opacity-50 disabled:cursor-not-allowed"
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
                                              <input type="number" step="0.1" min="0" disabled={isPast}
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
                                                 className="w-12 text-center text-[10px] bg-slate-50 border border-slate-200 rounded px-1 py-0.5 font-medium text-family-text focus:outline-none focus:ring-1 focus:ring-family-accent disabled:opacity-50 disabled:cursor-not-allowed"
                                              />
                                              <span className="text-[10px] text-family-textMuted">%/năm</span>
                                              {b.termMonths > 0 && b.interestRateAnnual > 0 && (
                                                 <span className="text-[10px] text-emerald-600 font-semibold ml-2">
                                                    (Dự kiến lãi: +{formatTableMoneyVNDMillion(b.principal * (b.interestRateAnnual / 100 / 12) * b.termMonths)})
                                                 </span>
                                              )}
                                           </div>
                                        </div>
                                      </div>
                                    </div>
                                   );
                                })})()}
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
                          <span className="font-semibold text-family-text text-xs">Rút từng phần</span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="space-y-2 border-t border-green-200 pt-2">
                      {filterFundType !== 'debt_prep' && (
                        <div className="space-y-2">
                            <div>
                                <label className="text-xs font-semibold text-family-text mb-1 block">Ghi nhận số tiền rút ra thành:</label>
                                <div className="w-full bg-gray-50 rounded-md border border-gray-200 p-2 text-xs mb-2 text-gray-500">
                                  {variant === 'lifestyle' ? 'Hoàn tiền về Quỹ sinh hoạt nguồn (Không tạo sự kiện)' : 'Hoàn tiền về nguồn (Không tạo sự kiện chi tiêu)'}
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-xs font-semibold text-family-text mb-1 flex items-center gap-1">
                                    {variant === 'lifestyle' ? 'Số tiền sẽ tự động hoàn về Quỹ sinh hoạt nguồn:' : 'Số tiền sẽ tự động hoàn về quỹ:'}
                                </label>
                                <div className="w-full bg-gray-50 rounded-md border border-gray-200 p-2 text-xs text-gray-500">
                                    {getSourceLabelWithBalance(disburseForm.disburseSource || fund.sourceOfFund || 'idle')}
                                </div>
                            </div>
                        </div>
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
                              <option value="amount">Số tiền (triệu)</option>
                              <option value="percentage">% quỹ</option>
                            </select>
                            <input type="number" step="0.1" min="0" max={partialWithdrawType === 'percentage' ? 100 : balance}
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
                             const sim = getFundBalance(fund.id);
                             const targetM = disburseForm.disbursedYear * 12 + disburseForm.disbursedMonth;

                             const simNonTerm = sim.nonTermCash || 0;
                             
                             // 1. Phân loại các bucket tại tháng chốt
                             const maturedBuckets: any[] = [];
                             const unmaturedBuckets: any[] = [];
                             
                             sim.buckets.forEach((b: any) => {
                                const bEnd = b.termStart + b.termMonths;
                                if (targetM === bEnd) {
                                   maturedBuckets.push(b);
                                } else {
                                   unmaturedBuckets.push(b);
                                }
                             });

                             let breakdownNonTerm = 0;
                             const breakdownMaturedBuckets: any[] = [];
                             const breakdownUnmaturedBuckets: any[] = [];
                             let rem = wAmt;

                             // 2.1 Rút từ nonTermCash trước
                             if (simNonTerm >= rem) {
                                breakdownNonTerm = rem;
                                rem = 0;
                             } else {
                                breakdownNonTerm = simNonTerm;
                                rem -= simNonTerm;
                             }

                             // 2.2 Rút từ các sổ đã đáo hạn (maturedBuckets) - được nhận trọn lãi
                             if (rem > 0 && maturedBuckets.length > 0) {
                                for (const b of maturedBuckets) {
                                   if (rem <= 0) break;
                                   const interest = b.principal * (b.interestRateAnnual / 100 / 12) * b.termMonths;
                                   const maturedTotal = b.principal + interest;
                                   const deduct = Math.min(maturedTotal, rem);
                                   breakdownMaturedBuckets.push({
                                      periodKey: b.periodKey || `${Math.floor((b.termStart-1)/12)}-${String(((b.termStart-1)%12)+1).padStart(2,'0')}`,
                                      deduct,
                                      leftover: maturedTotal - deduct,
                                      termMonths: b.termMonths,
                                      interestRateAnnual: b.interestRateAnnual
                                   });
                                   rem -= deduct;
                                }
                             }

                             // 2.3 Rút từ các sổ chưa đáo hạn (unmaturedBuckets) - ưu tiên sổ mới gửi nhất (termStart lớn nhất)
                             if (rem > 0 && unmaturedBuckets.length > 0) {
                                // Sắp xếp sổ mới gửi nhất lên đầu
                                const sortedUnmatured = [...unmaturedBuckets].sort((a: any, b: any) => b.termStart - a.termStart);
                                for (const b of sortedUnmatured) {
                                   if (rem <= 0) break;
                                   const deduct = Math.min(b.principal, rem);
                                   breakdownUnmaturedBuckets.push({
                                      periodKey: b.periodKey || `${Math.floor((b.termStart-1)/12)}-${String(((b.termStart-1)%12)+1).padStart(2,'0')}`,
                                      deduct,
                                      leftover: b.principal - deduct,
                                      termMonths: b.termMonths,
                                      interestRateAnnual: b.interestRateAnnual
                                   });
                                   rem -= deduct;
                                }
                             }
                             
                             const hasLeftovers = breakdownMaturedBuckets.some((b: any) => b.leftover > 0) || breakdownUnmaturedBuckets.some((b: any) => b.leftover > 0);
                             
                             return (
                                <div className="w-full mt-3 p-3 bg-yellow-50/70 border border-yellow-200/50 rounded-xl text-xs space-y-2">
                                   <div className="flex items-center gap-1 text-yellow-800 font-bold text-[11px] mb-1">
                                      <span>💡</span>
                                      <span>Cơ chế tất toán thông minh sẽ tự động ưu tiên rút theo thứ tự:</span>
                                   </div>
                                   
                                   <ul className="list-none pl-1 text-[11px] text-yellow-900 space-y-1">
                                      {breakdownNonTerm > 0 && (
                                         <li className="flex items-center gap-1.5">
                                            <span className="text-yellow-600">✔</span>
                                            <span>Rút từ tiền không kỳ hạn: <strong>{formatTableMoneyVNDMillion(breakdownNonTerm)}</strong></span>
                                            <span className="text-[10px] text-gray-500 font-normal bg-gray-100 px-1 py-0.5 rounded">(Không ảnh hưởng đến lãi các sổ khác)</span>
                                         </li>
                                      )}
                                      {breakdownMaturedBuckets.map((b: any, i: number) => (
                                         <li key={i} className="flex items-center gap-1.5">
                                            <span className="text-emerald-600">✔</span>
                                            <span>Tất toán từ kỳ hạn T{b.periodKey.split('-')[1]}/{b.periodKey.split('-')[0]}: <strong>{formatTableMoneyVNDMillion(b.deduct)}</strong></span>
                                            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100">Đã đáo hạn - Nhận trọn lãi</span>
                                         </li>
                                      ))}
                                      {breakdownUnmaturedBuckets.map((b: any, i: number) => (
                                         <li key={i} className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-amber-600">⚠</span>
                                            <span>Tất toán trước hạn kỳ T{b.periodKey.split('-')[1]}/{b.periodKey.split('-')[0]}: <strong>{formatTableMoneyVNDMillion(b.deduct)}</strong></span>
                                            <span className="text-[10px] text-amber-700 font-medium bg-amber-50 px-1 py-0.5 rounded border border-amber-100">Mới gửi nhất - Rút trước để giảm thiểu mất lãi tích lũy</span>
                                         </li>
                                      ))}
                                      {hasLeftovers ? (
                                         <li className="text-[10px] text-slate-600 font-normal pt-1 border-t border-yellow-200/40 space-y-1">
                                            <span className="italic block mb-0.5">* Chi tiết phần dôi ra sẽ được tái tục:</span>
                                            {breakdownMaturedBuckets.filter((b: any) => b.leftover > 0).map((b: any, i: number) => (
                                                <div key={`mat-left-${i}`} className="pl-3 flex items-center gap-1">
                                                   <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                                                   <span>Kỳ T{b.periodKey.split('-')[1]}/{b.periodKey.split('-')[0]}: dư <strong>{formatTableMoneyVNDMillion(b.leftover)}</strong> (Tiếp tục gửi {b.termMonths} tháng, lãi {b.interestRateAnnual}%/năm)</span>
                                                </div>
                                            ))}
                                            {breakdownUnmaturedBuckets.filter((b: any) => b.leftover > 0).map((b: any, i: number) => (
                                                <div key={`unmat-left-${i}`} className="pl-3 flex items-center gap-1">
                                                   <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                                                   <span>Kỳ T{b.periodKey.split('-')[1]}/{b.periodKey.split('-')[0]}: dư <strong>{formatTableMoneyVNDMillion(b.leftover)}</strong> (Tiếp tục gửi {b.termMonths} tháng, lãi {b.interestRateAnnual}%/năm)</span>
                                                </div>
                                            ))}
                                         </li>
                                      ) : (
                                         (breakdownMaturedBuckets.length > 0 || breakdownUnmaturedBuckets.length > 0) && (
                                            <li className="text-[10px] text-slate-500 font-normal italic pt-1 border-t border-yellow-200/40">
                                               * Không có phần dôi ra (Toàn bộ các khoản gửi bị tác động đã được rút hết).
                                            </li>
                                         )
                                      )}
                                   </ul>
                                </div>
                             );
                           }
                        }
                        return null;
                      })()}


                      <div className="flex justify-end gap-2 pt-2 items-center">
                        {!isWithinObservationPeriod(disburseForm.disbursedMonth, disburseForm.disbursedYear, selectedPeriodKey) && (
                          <span className="text-red-500 text-[10px] flex-1 text-right pr-2">{getPeriodGuardMessage(selectedPeriodKey)}</span>
                        )}
                        <Button variant="outline" size="sm" onClick={() => { setDisbursingId(null); }}>Hủy</Button>
                        <Button 
                          size="sm" 
                          disabled={!isWithinObservationPeriod(disburseForm.disbursedMonth, disburseForm.disbursedYear, selectedPeriodKey)}
                          onClick={() => {
                            if (settleMode === 'full') {
                              if (filterFundType !== 'debt_prep') {
                                let ev: any = undefined;
                                if (disburseForm.disburseDestination === 'life_event') {
                                    ev = {
                                        name: disburseForm.dealName || `Giải ngân quỹ: ${fund.name}`,
                                        month: disburseForm.disbursedMonth,
                                        year: disburseForm.disbursedYear,
                                        amount: -balance,
                                        recurringMonthlyImpact: 0,
                                        source: disburseForm.disburseSource || fund.sourceOfFund || 'expense_surplus',
                                        type: 'other',
                                        affectsNetWorth: true
                                    };
                                }
                                disburseSinkingFundWithEvent(fund.id, disburseForm.disbursedMonth, disburseForm.disbursedYear, ev);
                              } else {
                                disburseSinkingFund(fund.id, disburseForm.disbursedMonth, disburseForm.disbursedYear);
                              }
                            } else {
                              const wAmt = partialWithdrawType === 'amount' ? partialWithdrawValue : (balance * partialWithdrawValue / 100);
                              if (wAmt <= 0 || wAmt > balance) {
                                alert('Số tiền rút không hợp lệ (Phải lớn hơn 0 và nhỏ hơn số dư quỹ hiện tại).');
                                return;
                              }
                              
                              let ev: any = undefined;
                              let evId: string | undefined = undefined;
                              
                              if (filterFundType !== 'debt_prep') {
                                if (disburseForm.disburseDestination === 'life_event') {
                                    evId = `event_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                                    ev = {
                                        id: evId,
                                        name: disburseForm.dealName || `Rút từng phần quỹ: ${fund.name}`,
                                        month: disburseForm.disbursedMonth,
                                        year: disburseForm.disbursedYear,
                                        amount: -wAmt,
                                        recurringMonthlyImpact: 0,
                                        source: disburseForm.disburseSource || fund.sourceOfFund || 'expense_surplus',
                                        type: 'other',
                                        affectsNetWorth: true
                                    };
                                }
                              }
                              
                              const updatedFund = JSON.parse(JSON.stringify(fund));
                              if (!updatedFund.withdrawals) updatedFund.withdrawals = [];
                              updatedFund.withdrawals.push({
                                 id: `w_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                                 amount: wAmt,
                                 month: disburseForm.disbursedMonth,
                                 year: disburseForm.disbursedYear,
                                 note: disburseForm.dealName || (disburseForm.disburseDestination === 'life_event' ? 'Chi tiêu sự kiện' : 'Hoàn tiền về nguồn'),
                                 eventId: evId
                              });
                              updateSinkingFundWithEvent(updatedFund, ev);
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
               currentObservedMonth, currentObservedYear,
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
                     sourceOfFund: (fund.sourceOfFund || activeSources[0]),
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
                     disbursedMonth: currentObservedMonth,
                     disbursedYear: currentObservedYear,
                     dealName: fund.name,
                     realizedInterest: 0,
                     disburseDestination: variant === 'portfolio' ? 'none' : 'life_event',
                     disburseSource: fund.sourceOfFund || (activeSources.length > 0 ? activeSources[0] : 'idle'),
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
