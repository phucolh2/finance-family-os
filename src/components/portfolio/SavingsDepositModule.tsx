import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { WarningBox } from '../ui/WarningBox';
import { EmptyState } from '../ui/EmptyState';
import { HelpTooltip } from '../ui/HelpTooltip';
import { Plus, Trash2, CheckCircle, Save, Edit } from 'lucide-react';
import { formatTableMoneyVNDMillion } from '../../utils/format';
import { safeNumber, calculateNonTermInterest } from '../../utils/math';
import { runProjection } from '../../engines/projectionEngine';

interface SavingsDepositModuleProps {
  defaultStartMonth?: number;
  defaultStartYear?: number;
  filterCurrentMonthOnly?: boolean;
  filterPools?: ('idle' | 'planned' | 'saving')[];
  title?: string;
  description?: React.ReactNode;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
}

export const SavingsDepositModule: React.FC<SavingsDepositModuleProps> = ({
  defaultStartMonth,
  defaultStartYear,
  filterCurrentMonthOnly = false,
  filterPools = ['idle'],
  title = '🏦 Gửi Tiết kiệm Ngân hàng',
  description = (
    <>Tạo các khoản gửi tiết kiệm từ phần <strong>Ngân sách Đầu tư (Chưa có kế hoạch)</strong>.</>
  ),
  emptyStateTitle = 'Chưa có khoản tiết kiệm nào',
  emptyStateDescription = "Nhấn 'Tạo khoản tiết kiệm' để gửi tiết kiệm từ phần Ngân sách Đầu tư (Chưa có kế hoạch)."
}) => {
  const { 
    state, 
    addSavingsDeposit,
    updateSavingsDeposit,
    deleteSavingsDeposit,
    settleSavingsDepositEarly,
    selectedPeriodKey,
  } = useAppContext();

  // Run projection dynamically to calculate available balance for savings
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
    fundTransfers: state.fundTransfers,
  });

  const now = new Date();
  const initMonth = defaultStartMonth || now.getMonth() + 1;
  const initYear = defaultStartYear || now.getFullYear();

  const [showAddSavingsForm, setShowAddSavingsForm] = useState(false);
  const [editingSavingsId, setEditingSavingsId] = useState<string | null>(null);
  
  React.useEffect(() => {
    setShowAddSavingsForm(false);
    setEditingSavingsId(null);
    setSettlingSavingsId(null);
  }, [defaultStartMonth, defaultStartYear, selectedPeriodKey]);

  const [savingsForm, setSavingsForm] = useState({
    name: '',
    principal: 0,
    monthlyContribution: 0,
    interestRate: 5,
    termMonths: 12,
    startMonth: initMonth,
    startYear: initYear,
    pool: filterPools[0],
  });

  const [settlingSavingsId, setSettlingSavingsId] = useState<string | null>(null);
  const [settleSavingsForm, setSettleSavingsForm] = useState({
    settledMonth: initMonth,
    settledYear: initYear,
    realizedInterest: 0,
  });
  
  const [settleMode, setSettleMode] = useState<'full' | 'partial'>('full');
  const [partialWithdrawType, setPartialWithdrawType] = useState<'amount' | 'percentage'>('amount');
  const [partialWithdrawValue, setPartialWithdrawValue] = useState<number>(0);

  const [formError, setFormError] = useState<string | null>(null);

  const getMonthsActive = (startMonth: number, startYear: number, endMonth: number, endYear: number) => {
    return Math.max(0, (endYear * 12 + endMonth) - (startYear * 12 + startMonth));
  };

  // Calculate available savings pool balance for validation
  const savingsTargetMonthRow = projection.monthlyRows.find(
    (r) => r.period.month === savingsForm.startMonth && r.period.year === savingsForm.startYear
  );
  
  let availableSavingsPoolBalance = 0;
  if (savingsTargetMonthRow) {
    if (savingsForm.pool === 'saving') {
      availableSavingsPoolBalance = savingsTargetMonthRow.savingBalance;
    } else {
      const port = savingsTargetMonthRow.portfolio;
      const planned = state.assets.reduce((sum, asset) => sum + (port.assets[asset.type].earmarkedEndingBalance || 0), 0);
      const idle = port.unallocatedEndingBalance || 0;
      availableSavingsPoolBalance = savingsForm.pool === 'idle' ? idle : planned;
    }
  } else {
    availableSavingsPoolBalance = safeNumber(state.profile.startingCapital, 100);
  }
  const isSavingsOverLimit = savingsForm.principal > availableSavingsPoolBalance;

  const getPoolLabelWithBalance = (poolId: string) => {
    let balance = 0;
    let prefix = '';
    
    if (savingsTargetMonthRow) {
      if (poolId === 'saving') {
        balance = savingsTargetMonthRow.savingBalance;
        prefix = 'Số dư Quỹ Tiết Kiệm & Nợ';
      } else {
        const port = savingsTargetMonthRow.portfolio;
        const planned = state.assets.reduce((sum, asset) => sum + (port.assets[asset.type].earmarkedEndingBalance || 0), 0);
        const idle = port.unallocatedEndingBalance || 0;
        
        if (poolId === 'idle') {
          balance = idle;
          prefix = 'Ngân sách Đầu tư (Chưa có kế hoạch)';
        } else if (poolId === 'planned') {
          balance = planned;
          prefix = 'Quỹ tích lũy mục tiêu (Chờ phân bổ)';
        }
      }
    } else {
      balance = safeNumber(state.profile.startingCapital, 100);
      prefix = poolId === 'saving' ? 'Số dư Quỹ Tiết Kiệm & Nợ' : poolId === 'idle' ? 'Dòng tiền Nhàn rỗi' : 'Quỹ tích lũy mục tiêu';
    }
    
    return `${prefix} (Còn: ${formatTableMoneyVNDMillion(balance)})`;
  };

  let displayDeposits = state.savingsDeposits || [];
  displayDeposits = displayDeposits.filter(d => filterPools.includes(d.pool as any));

  if (filterCurrentMonthOnly && defaultStartMonth && defaultStartYear) {
    displayDeposits = displayDeposits.filter(d => d.startMonth === defaultStartMonth && d.startYear === defaultStartYear);
  }

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <div className="w-full md:w-3/4">
          <h3 className="text-xl font-serif font-bold text-family-text flex items-center gap-2">
            {title}
            <HelpTooltip text="Công cụ giả lập gửi tiết kiệm sinh lời an toàn từ dòng tiền rảnh rỗi hoặc chờ phân bổ đầu tư." />
          </h3>
          <p className="text-sm text-family-textMuted mt-1">
            {description}
          </p>
        </div>
        <Button onClick={() => { setShowAddSavingsForm(!showAddSavingsForm); }} size="sm" className="gap-1 text-xs py-1 h-8 shrink-0">
          <Plus className="w-3.5 h-3.5" /> Tạo khoản tiết kiệm
        </Button>
      </div>

      {showAddSavingsForm && (
        <div className="mb-6 p-4 bg-sky-50/50 border border-sky-200/30 rounded-xl space-y-4">
          <h4 className="font-bold text-sm text-family-text">Tạo khoản Gửi tiết kiệm mới</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              label="Tên khoản"
              value={savingsForm.name}
              onChange={(e) => { setSavingsForm({ ...savingsForm, name: e.target.value }); }}
              placeholder="VD: Tiết kiệm VCB 12 tháng"
            />
            <Input
              label="Số tiền gốc (Tr VND)"
              type="number"
              value={savingsForm.principal || ''}
              placeholder="VD: 50"
              onChange={(e) => { setSavingsForm({ ...savingsForm, principal: safeNumber(Number(e.target.value), 0) }); }}
            />
            <Input
              label="Định kì phân bổ thêm hằng tháng (Tr)"
              type="number"
              value={savingsForm.monthlyContribution || ''}
              placeholder="VD: 5"
              onChange={(e) => { setSavingsForm({ ...savingsForm, monthlyContribution: safeNumber(Number(e.target.value), 0) }); }}
            />
            <div>
              <label className="block text-xs font-semibold text-family-textMuted uppercase tracking-wider mb-1">Kì hạn</label>
              <select
                className="block w-full rounded-xl border border-family-accent/20 bg-white/60 py-2.5 px-3 text-sm text-family-text focus:border-family-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-family-accent transition-colors"
                value={savingsForm.termMonths}
                onChange={(e) => { setSavingsForm({ ...savingsForm, termMonths: Number(e.target.value) }); }}
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
              value={savingsForm.interestRate || ''}
              placeholder="VD: 5.5"
              onChange={(e) => { setSavingsForm({ ...savingsForm, interestRate: safeNumber(Number(e.target.value), 0) }); }}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Tháng bắt đầu"
                placeholder="VD: 1"
                type="number"
                min={1}
                max={12}
                value={savingsForm.startMonth}
                onChange={(e) => { setSavingsForm({ ...savingsForm, startMonth: safeNumber(Number(e.target.value), 1) }); }}
              />
              <Input
                label="Năm bắt đầu"
                placeholder="VD: 2026"
                type="number"
                min={2024}
                max={2060}
                value={savingsForm.startYear}
                onChange={(e) => { setSavingsForm({ ...savingsForm, startYear: safeNumber(Number(e.target.value), 2026) }); }}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-family-textMuted uppercase tracking-wider mb-1">Nguồn tiền</label>
              <select
                disabled={filterPools.length === 1}
                className={`block w-full rounded-xl border border-family-accent/20 py-2.5 px-3 pr-8 text-sm text-family-text text-ellipsis overflow-hidden whitespace-nowrap focus:border-family-accent focus:outline-none focus:ring-1 focus:ring-family-accent transition-colors ${filterPools.length === 1 ? 'bg-gray-50 cursor-not-allowed opacity-80' : 'bg-white/60 focus:bg-white'}`}
                value={savingsForm.pool}
                onChange={(e) => { setSavingsForm({ ...savingsForm, pool: e.target.value as 'idle' | 'planned' | 'saving' }); }}
              >
                {filterPools.includes('idle') && <option value="idle">{getPoolLabelWithBalance('idle')}</option>}
                {filterPools.includes('planned') && <option value="planned">{getPoolLabelWithBalance('planned')}</option>}
                {filterPools.includes('saving') && <option value="saving">{getPoolLabelWithBalance('saving')}</option>}
              </select>
            </div>
          </div>

          {isSavingsOverLimit && (
            <WarningBox 
              type="danger" 
              message={`Số tiền gửi (${savingsForm.principal} Tr VND) vượt quá số dư khả dụng của nguồn vốn "${savingsForm.pool === 'idle' ? 'Ngân sách Đầu tư (Chưa có kế hoạch)' : savingsForm.pool === 'planned' ? 'Quỹ tích lũy mục tiêu' : 'Số dư Quỹ Tiết Kiệm & Nợ'}" tại tháng ${savingsForm.startMonth}/${savingsForm.startYear} (Số dư khả dụng: ${availableSavingsPoolBalance.toFixed(1)} Tr VND).`} 
            />
          )}
          {formError && (
            <WarningBox type="danger" message={formError} />
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
                if (editingSavingsId) {
                  const existingDep = state.savingsDeposits?.find(d => d.id === editingSavingsId);
                  if (existingDep) {
                    updateSavingsDeposit({
                      ...existingDep,
                      name: savingsForm.name.trim(),
                      principal: savingsForm.principal,
                      monthlyContribution: savingsForm.monthlyContribution,
                      interestRateAnnual: savingsForm.interestRate,
                      termMonths: savingsForm.termMonths,
                      startMonth: savingsForm.startMonth,
                      startYear: savingsForm.startYear,
                      pool: savingsForm.pool,
                    });
                  }
                } else {
                  addSavingsDeposit({
                    name: savingsForm.name.trim(),
                    principal: savingsForm.principal,
                    monthlyContribution: savingsForm.monthlyContribution,
                    interestRateAnnual: savingsForm.interestRate,
                    termMonths: savingsForm.termMonths,
                    startMonth: savingsForm.startMonth,
                    startYear: savingsForm.startYear,
                    pool: savingsForm.pool,
                    status: 'active',
                  });
                }
                setShowAddSavingsForm(false);
                setEditingSavingsId(null);
                setSavingsForm({ name: '', principal: 0, monthlyContribution: 0, interestRate: 5, termMonths: 12, startMonth: initMonth, startYear: initYear, pool: 'idle' });
                setFormError(null);
              }}
            >
              <Save className="w-3.5 h-3.5" /> {editingSavingsId ? 'Cập nhật' : 'Lưu'}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => { 
              setShowAddSavingsForm(false); 
              setEditingSavingsId(null);
              setSavingsForm({ name: '', principal: 0, monthlyContribution: 0, interestRate: 5, termMonths: 12, startMonth: initMonth, startYear: initYear, pool: 'idle' });
            }}>Hủy</Button>
          </div>
        </div>
      )}

      {displayDeposits.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-sky-200/30 text-family-textMuted font-bold bg-sky-50/30">
                <th className="p-3">Tên khoản</th>
                <th className="p-3 text-right">Gốc (Tr)</th>
                <th className="p-3 text-right">Góp H.Tháng</th>
                <th className="p-3 text-right">Lãi suất</th>
                <th className="p-3 text-right">Kì hạn</th>
                <th className="p-3 text-center">Bắt đầu</th>
                <th className="p-3 text-center">Đáo hạn</th>
                <th className="p-3 text-right">Lãi dự kiến</th>
                <th className="p-3 text-center">Nguồn</th>
                <th className="p-3 text-center">Trạng thái</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {displayDeposits.map((dep) => {
                const maturityMonth = ((dep.startMonth - 1 + dep.termMonths) % 12) + 1;
                const maturityYear = dep.startYear + Math.floor((dep.startMonth - 1 + dep.termMonths) / 12);
                
                const current = defaultStartYear && defaultStartMonth ? defaultStartYear * 12 + defaultStartMonth : now.getFullYear() * 12 + now.getMonth() + 1;
                const depStart = dep.startYear * 12 + dep.startMonth;
                const depEnd = depStart + dep.termMonths;
                
                const isActive = current >= depStart && current < depEnd && dep.status === 'active';
                const isSettledEarly = dep.status === 'settled_early';
                const isSettling = settlingSavingsId === dep.id;
                
                const currentPrincipal = dep.principal - (dep.withdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0);
                const expectedInterest = currentPrincipal * (dep.interestRateAnnual / 100 / 12) * dep.termMonths;
                const displayInterest = isSettledEarly ? (dep.realizedInterest || 0) : expectedInterest;

                return (
                  <React.Fragment key={dep.id}>
                    <tr className="border-b border-sky-100/50 hover:bg-sky-50/30">
                      <td className="p-3 font-semibold text-family-text">
                        {dep.name}
                        {dep.withdrawals && dep.withdrawals.length > 0 && (
                          <div className="mt-1 flex flex-col gap-1">
                            {dep.withdrawals.map((w, idx) => (
                              <div key={idx} className="text-[10px] text-family-textMuted bg-white border border-gray-100 px-1.5 py-0.5 rounded shadow-sm inline-flex items-center gap-1">
                                <span className="text-red-500 font-bold">- {formatTableMoneyVNDMillion(w.amount)}</span> 
                                (T{w.month}/{w.year}) 
                                <span className="text-emerald-600">Lãi: +{formatTableMoneyVNDMillion(w.realizedInterest)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-3 font-medium text-right">
                        {formatTableMoneyVNDMillion(currentPrincipal)}
                        {dep.withdrawals && dep.withdrawals.length > 0 && (
                          <div className="text-[10px] text-gray-400 line-through mt-0.5" title="Gốc ban đầu">
                            {formatTableMoneyVNDMillion(dep.principal)}
                          </div>
                        )}
                      </td>
                      <td className="p-3 font-medium text-right">{dep.monthlyContribution ? formatTableMoneyVNDMillion(dep.monthlyContribution) : '-'}</td>
                      <td className="p-3 font-bold text-sky-600 text-right">{dep.interestRateAnnual}%/năm</td>
                      <td className="p-3 text-right">{dep.termMonths} tháng</td>
                      <td className="p-3 text-center">{dep.startMonth}/{dep.startYear}</td>
                      <td className="p-3 font-medium text-center">
                        {isSettledEarly ? `${dep.settledMonth}/${dep.settledYear} (Tất toán)` : `${maturityMonth}/${maturityYear}`}
                      </td>
                      <td className="p-3 font-bold text-emerald-600 text-right">
                        +{formatTableMoneyVNDMillion(displayInterest)}
                        {isSettledEarly && <span className="text-[10px] text-orange-600 font-semibold block">(thực nhận)</span>}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${dep.pool === 'idle' ? 'bg-sky-100 text-sky-700' : dep.pool === 'planned' ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {dep.pool === 'idle' ? 'Chưa có KH' : dep.pool === 'planned' ? 'Quỹ mục tiêu' : 'Quỹ Tiết Kiệm & Nợ'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
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
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => {
                              setEditingSavingsId(dep.id);
                              setSavingsForm({
                                name: dep.name,
                                principal: dep.principal,
                                monthlyContribution: dep.monthlyContribution || 0,
                                interestRate: dep.interestRateAnnual,
                                termMonths: dep.termMonths,
                                startMonth: dep.startMonth,
                                startYear: dep.startYear,
                                pool: dep.pool,
                              });
                              setShowAddSavingsForm(true);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="p-1 rounded-md text-family-textMuted hover:text-amber-600 hover:bg-amber-50 transition-all"
                            title="Sửa"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {isActive && (
                            <button
                              onClick={() => {
                                const sm = defaultStartMonth || dep.startMonth;
                                const sy = defaultStartYear || dep.startYear;
                                const nonTermInterest = calculateNonTermInterest(
                                  dep.principal, 
                                  dep.startMonth, dep.startYear, 
                                  sm, sy, 
                                  state.assumptions.nonTermInterestRateSchedule
                                );
                                setSettlingSavingsId(dep.id);
                                setSettleMode('full');
                                setPartialWithdrawType('amount');
                                setPartialWithdrawValue(0);
                                setSettleSavingsForm({
                                  settledMonth: sm,
                                  settledYear: sy,
                                  realizedInterest: Math.round(nonTermInterest * 100) / 100,
                                });
                              }}
                              className="p-1 rounded-md text-sky-600 hover:text-sky-850 hover:bg-sky-50 transition-all"
                              title="Tất toán & Rút gốc"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => { deleteSavingsDeposit(dep.id); }}
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
                          <div className="flex flex-col gap-4 text-xs bg-white/80 p-4 rounded-xl border border-sky-200">
                            <div className="flex items-center justify-between">
                              <div className="font-bold text-sky-800 text-sm">Quản lý Tất toán & Rút gốc</div>
                              <div className="flex gap-4">
                                <label className="flex items-center gap-1 cursor-pointer">
                                  <input type="radio" name={`mode_${dep.id}`} checked={settleMode === 'full'} onChange={() => {
                                    setSettleMode('full');
                                    const sm = defaultStartMonth || dep.startMonth;
                                    const sy = defaultStartYear || dep.startYear;
                                    const nonTerm = calculateNonTermInterest(currentPrincipal, dep.startMonth, dep.startYear, sm, sy, state.assumptions.nonTermInterestRateSchedule);
                                    setSettleSavingsForm(prev => ({...prev, settledMonth: sm, settledYear: sy, realizedInterest: Math.round(nonTerm * 100) / 100}));
                                  }} />
                                  <span className="font-semibold text-family-text">Tất toán toàn bộ (Đóng sổ)</span>
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer">
                                  <input type="radio" name={`mode_${dep.id}`} checked={settleMode === 'partial'} onChange={() => {
                                    setSettleMode('partial');
                                    const sm = defaultStartMonth || dep.startMonth;
                                    const sy = defaultStartYear || dep.startYear;
                                    const withdrawVal = partialWithdrawType === 'amount' ? partialWithdrawValue : (currentPrincipal * partialWithdrawValue / 100);
                                    const nonTerm = calculateNonTermInterest(withdrawVal, dep.startMonth, dep.startYear, sm, sy, state.assumptions.nonTermInterestRateSchedule);
                                    setSettleSavingsForm(prev => ({...prev, settledMonth: sm, settledYear: sy, realizedInterest: Math.round(nonTerm * 100) / 100}));
                                  }} />
                                  <span className="font-semibold text-family-text">Rút gốc từng phần</span>
                                </label>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-4 border-t border-sky-100 pt-3">
                              <div className="flex items-center gap-2">
                                <label className="font-semibold text-family-text">Tháng rút/chốt:</label>
                                <input
                                  type="number" min={1} max={12}
                                  value={settleSavingsForm.settledMonth}
                                  onChange={(e) => {
                                    const m = safeNumber(Number(e.target.value), 12);
                                    const withdrawVal = settleMode === 'full' ? currentPrincipal : (partialWithdrawType === 'amount' ? partialWithdrawValue : (currentPrincipal * partialWithdrawValue / 100));
                                    const nonTerm = calculateNonTermInterest(withdrawVal, dep.startMonth, dep.startYear, m, settleSavingsForm.settledYear, state.assumptions.nonTermInterestRateSchedule);
                                    setSettleSavingsForm({ ...settleSavingsForm, settledMonth: m, realizedInterest: Math.round(nonTerm * 100) / 100 });
                                  }}
                                  className="w-14 text-center bg-white rounded-lg border border-sky-200 p-1"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="font-semibold text-family-text">Năm rút/chốt:</label>
                                <input
                                  type="number" min={2020} max={2060}
                                  value={settleSavingsForm.settledYear}
                                  onChange={(e) => {
                                    const y = safeNumber(Number(e.target.value), 2026);
                                    const withdrawVal = settleMode === 'full' ? currentPrincipal : (partialWithdrawType === 'amount' ? partialWithdrawValue : (currentPrincipal * partialWithdrawValue / 100));
                                    const nonTerm = calculateNonTermInterest(withdrawVal, dep.startMonth, dep.startYear, settleSavingsForm.settledMonth, y, state.assumptions.nonTermInterestRateSchedule);
                                    setSettleSavingsForm({ ...settleSavingsForm, settledYear: y, realizedInterest: Math.round(nonTerm * 100) / 100 });
                                  }}
                                  className="w-20 text-center bg-white rounded-lg border border-sky-200 p-1"
                                />
                              </div>

                              {settleMode === 'partial' && (
                                <div className="flex items-center gap-2 border-l pl-4 border-sky-100">
                                  <label className="font-semibold text-family-text">Mức rút:</label>
                                  <select
                                    value={partialWithdrawType}
                                    onChange={(e) => { setPartialWithdrawType(e.target.value as 'amount'|'percentage'); }}
                                    className="bg-white rounded-lg border border-sky-200 p-1"
                                  >
                                    <option value="amount">Số tiền (Tr)</option>
                                    <option value="percentage">% gốc</option>
                                  </select>
                                  <input
                                    type="number" step="0.1" min="0" max={partialWithdrawType === 'percentage' ? 100 : currentPrincipal}
                                    value={partialWithdrawValue}
                                    onChange={(e) => {
                                      const val = safeNumber(Number(e.target.value), 0);
                                      setPartialWithdrawValue(val);
                                      const withdrawVal = partialWithdrawType === 'amount' ? val : (currentPrincipal * val / 100);
                                      const nonTerm = calculateNonTermInterest(withdrawVal, dep.startMonth, dep.startYear, settleSavingsForm.settledMonth, settleSavingsForm.settledYear, state.assumptions.nonTermInterestRateSchedule);
                                      setSettleSavingsForm(prev => ({...prev, realizedInterest: Math.round(nonTerm * 100) / 100}));
                                    }}
                                    className="w-20 text-center bg-white rounded-lg border border-sky-200 p-1 font-bold text-sky-700"
                                  />
                                </div>
                              )}

                              <div className="flex items-center gap-2 border-l pl-4 border-sky-100">
                                <label className="font-semibold text-family-text">Tiền lãi thực nhận:</label>
                                <input
                                  type="number" step="0.01"
                                  value={settleSavingsForm.realizedInterest}
                                  onChange={(e) => { setSettleSavingsForm({ ...settleSavingsForm, realizedInterest: safeNumber(Number(e.target.value), 0) }); }}
                                  className="w-20 text-center bg-white rounded-lg border border-sky-200 p-1 font-bold text-sky-700"
                                />
                                <span className="font-semibold text-family-textMuted">Tr VND</span>
                                <HelpTooltip text="Hệ thống đã tự động tính số lãi không kỳ hạn dựa trên thời gian và cấu hình lãi suất. Bạn có thể tự sửa số này để khớp với sao kê ngân hàng." />
                              </div>
                              
                              <div className="flex gap-2 ml-auto">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (settleMode === 'full') {
                                      updateSavingsDeposit({
                                        ...dep,
                                        status: 'settled_early',
                                        settledMonth: settleSavingsForm.settledMonth,
                                        settledYear: settleSavingsForm.settledYear,
                                        realizedInterest: settleSavingsForm.realizedInterest
                                      });
                                    } else {
                                      const wAmt = partialWithdrawType === 'amount' ? partialWithdrawValue : (currentPrincipal * partialWithdrawValue / 100);
                                      if (wAmt <= 0 || wAmt > currentPrincipal) {
                                        alert('Số tiền rút không hợp lệ (Phải lớn hơn 0 và nhỏ hơn số gốc hiện tại).');
                                        return;
                                      }
                                      const newWd = {
                                        id: `wd_${Date.now()}`,
                                        month: settleSavingsForm.settledMonth,
                                        year: settleSavingsForm.settledYear,
                                        amount: wAmt,
                                        realizedInterest: settleSavingsForm.realizedInterest
                                      };
                                      updateSavingsDeposit({
                                        ...dep,
                                        withdrawals: [...(dep.withdrawals || []), newWd]
                                      });
                                    }
                                    setSettlingSavingsId(null);
                                  }}
                                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold transition-all"
                                >
                                  Xác nhận {settleMode === 'full' ? 'Tất toán' : 'Rút'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setSettlingSavingsId(null); }}
                                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-family-text rounded-lg font-semibold transition-all"
                                >
                                  Hủy
                                </button>
                              </div>
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
        </div>
      ) : (
        <EmptyState 
          title={filterCurrentMonthOnly ? `${emptyStateTitle} trong tháng này` : emptyStateTitle}
          description={emptyStateDescription}
        />
      )}
    </div>
  );
};
