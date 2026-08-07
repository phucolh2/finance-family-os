import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useAppContext } from '../../context/AppContext';
import { HelpTooltip } from '../ui/HelpTooltip';
import { runProjection } from '../../engines/projectionEngine';
import { formatMoneyVNDMillion } from '../../utils/format';
import { WarningBox } from '../ui/WarningBox';
import { useLiquidityBreakdown } from '../../hooks/useLiquidityBreakdown';
import { Sparkles } from 'lucide-react';

interface TransferFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const TransferForm: React.FC<TransferFormProps> = ({ onSuccess, onCancel }) => {
  const { state, addFundTransfer, selectedPeriodKey } = useAppContext();
  const [sourceValue, setSourceValue] = useState<string>('cashflow:unallocated');
  const [destinationValue, setDestinationValue] = useState<string>('cashflow:investable');
  
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  const { liquidityBreakdownData, totalRemainingSum } = useLiquidityBreakdown('cumulative', selectedPeriodKey);

  // Run projection dynamically to get actual idle cashflow for the selected period
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
  });

  const hasData = projection.monthlyRows.length > 0;
  const now = new Date();
  const nowKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentPeriod = hasData
    ? (projection.monthlyRows.find(r => r.period.key === nowKey) || projection.monthlyRows[0])
    : null;

  const currentRow = (hasData && selectedPeriodKey)
    ? (projection.monthlyRows.find(r => r.period.key === selectedPeriodKey) || currentPeriod)
    : currentPeriod;

  const currentMonth = currentRow ? currentRow.period.month : (now.getMonth() + 1);
  const currentYear = currentRow ? currentRow.period.year : now.getFullYear();

  let idleCashflow = 0;
  let unallocatedCashBalance = 0;
  let savingBalance = 0;
  let debtReserveBalance = 0;
  if (currentRow) {
    const port = currentRow.portfolio;
    const savBal = currentRow.portfolio.savingsBalance || 0;
    const totalActiveCapital = state.assets.reduce((sum, asset) => sum + (currentRow ? currentRow.portfolio.assets[asset.type].endingBalance : 0), 0);
    const totalEarmarkedCapital = (state.sinkingFunds || [])
      .filter(f => f.fundType === 'investment' && f.status === 'active')
      .reduce((sum, f) => sum + f.initialDeposit, 0);
    const genericUnallocatedBalance = Math.max(0, currentRow.portfolio.totalEndingBalance - totalActiveCapital - totalEarmarkedCapital - savBal);
    
    idleCashflow = port.unallocatedEndingBalance ?? genericUnallocatedBalance;
    unallocatedCashBalance = currentRow.unallocatedCashBalance || 0;
    savingBalance = currentRow.savingBalance || 0;
    debtReserveBalance = currentRow.debtReserveBalance || 0;
  }
  
  const [srcType, srcId] = sourceValue.split(':');
  const [destType, destId] = destinationValue.split(':');

  let availableBalance = 0;
  if (srcType === 'cashflow') {
    if (srcId === 'investable') {
      availableBalance = idleCashflow;
    } else if (srcId === 'liquidity') {
      availableBalance = totalRemainingSum;
    } else if (srcId?.startsWith('liquidity_group_')) {
      const groupId = srcId.replace('liquidity_group_', '');
      const groupData = liquidityBreakdownData.find(g => g.id === groupId);
      availableBalance = groupData?.remaining || 0;
    } else if (srcId === 'unallocated') {
      availableBalance = unallocatedCashBalance;
    }
  } else if (srcType === 'pool' && srcId === 'saving') {
    availableBalance = savingBalance;
  } else if (srcType === 'pool' && srcId === 'debt_reserve') {
    availableBalance = debtReserveBalance;
  } else if (srcType === 'life_event') {
    availableBalance = state.lifeEvents?.find(e => e.id === srcId)?.amount || 0;
  } else if (srcType === 'savings') {
    availableBalance = state.savingsDeposits?.find(s => s.id === srcId)?.principal || 0;
  }

  let destCurrentBalance = 0;
  if (destType === 'cashflow') {
    if (destId === 'investable') {
      destCurrentBalance = idleCashflow;
    } else if (destId === 'liquidity') {
      destCurrentBalance = totalRemainingSum;
    } else if (destId?.startsWith('liquidity_group_')) {
      const groupId = destId.replace('liquidity_group_', '');
      const groupData = liquidityBreakdownData.find(g => g.id === groupId);
      destCurrentBalance = groupData?.remaining || 0;
    } else if (destId === 'unallocated') {
      destCurrentBalance = unallocatedCashBalance;
    }
  } else if (destType === 'pool' && destId === 'saving') {
    destCurrentBalance = savingBalance;
  } else if (destType === 'pool' && destId === 'debt_reserve') {
    destCurrentBalance = debtReserveBalance;
  } else if (destType === 'life_event') {
    destCurrentBalance = state.lifeEvents?.find(e => e.id === destId)?.amount || 0;
  } else if (destType === 'savings') {
    destCurrentBalance = state.savingsDeposits?.find(s => s.id === destId)?.principal || 0;
  }

  const getItemLabel = (val: string) => {
    const [t, id] = val.split(':');
    if (t === 'cashflow') {
      if (id === 'investable') return 'Quỹ Đầu tư Nhàn rỗi / Chưa có kế hoạch';
      if (id === 'unallocated') return 'Nguồn tiền dôi ra khi phân bổ ngân sách';
      if (id?.startsWith('liquidity_group_')) {
        const groupId = id.replace('liquidity_group_', '');
        const g = liquidityBreakdownData.find(x => x.id === groupId);
        return `Quỹ Sinh hoạt: ${g?.name || groupId}`;
      }
    }
    if (t === 'pool' && id === 'saving') return 'Quỹ Tiết kiệm tích lũy';
    if (t === 'pool' && id === 'debt_reserve') return 'Quỹ Dự phòng tích lũy';
    if (t === 'life_event') return state.lifeEvents?.find(e => e.id === id)?.name || 'Sự kiện cuộc đời';
    return val;
  };

  const numAmount = Number(amount) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (sourceValue === destinationValue) {
      setFormError('Không thể điều chuyển tiền vào chính nguồn đó. Vui lòng chọn nguồn hoặc đích khác.');
      return;
    }
    if (!amount || numAmount <= 0) {
      setFormError('Số tiền điều chuyển phải lớn hơn 0.');
      return;
    }
    if (numAmount > availableBalance) {
      setFormError(`Số tiền điều chuyển (${numAmount} triệu) vượt quá số dư khả dụng của nguồn (${formatMoneyVNDMillion(availableBalance)}).`);
      return;
    }

    setFormError('');

    addFundTransfer({
      month: currentMonth,
      year: currentYear,
      amount: numAmount,
      sourceType: srcType as any,
      sourceId: srcId || undefined,
      destinationType: destType as any,
      destinationId: destId || undefined,
      note,
    });

    onSuccess();
  };

  return (
    <Card className="bg-family-bg border-family-accent/20">
      <CardHeader>
        <CardTitle className="text-xl font-serif text-family-text flex items-center justify-between">
          <span>Lệnh Điều Chuyển Dòng Tiền</span>
          <HelpTooltip text="Điều chuyển dòng tiền giữa các quỹ/tài khoản. Ví dụ: Chuyển tiền từ thu nhập dôi dư sang Quỹ Đầu tư hoặc Quỹ Tiết kiệm." />
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
              <div className="space-y-4 bg-family-bgDark/30 p-4 rounded-xl border border-family-accent/10">
                 <h4 className="font-bold text-sm text-family-textLight uppercase tracking-wider mb-2">TỪ (Nguồn)</h4>
                 <div>
                    <label className="text-xs text-family-textMuted mb-1 block">Tài sản / Khoản mục Nguồn</label>
                    <select 
                      value={sourceValue}
                      onChange={e => setSourceValue(e.target.value)}
                      className="w-full bg-family-bg border border-family-accent/20 rounded p-2 text-sm text-family-text focus:outline-none focus:border-blue-500"
                    >
                      <optgroup label="💵 Dôi dư Ngân sách">
                        <option value="cashflow:unallocated">Nguồn tiền dôi ra khi phân bổ ngân sách ({formatMoneyVNDMillion(unallocatedCashBalance)})</option>
                      </optgroup>
                      <optgroup label="📈 Danh mục đầu tư">
                        <option value="cashflow:investable">Quỹ Đầu tư Nhàn rỗi / Chưa có kế hoạch ({formatMoneyVNDMillion(idleCashflow)})</option>
                      </optgroup>
                      <optgroup label="🎯 Quản lý chi tiêu">
                        {liquidityBreakdownData.map(group => (
                          <option key={group.id} value={`cashflow:liquidity_group_${group.id}`}>Quỹ Sinh hoạt: {group.name} ({formatMoneyVNDMillion(group.remaining)})</option>
                        ))}
                        {state.lifeEvents?.filter(e => e.amount > 0).map(e => (
                          <option key={e.id} value={`life_event:${e.id}`}>{e.name} ({formatMoneyVNDMillion(e.amount)})</option>
                        ))}
                      </optgroup>
                      <optgroup label="🏦 Tiết kiệm">
                        <option value="pool:saving">Quỹ Tiết kiệm tích lũy ({formatMoneyVNDMillion(savingBalance)})</option>
                      </optgroup>
                      <optgroup label="🛡️ Dự phòng">
                        <option value="pool:debt_reserve">Quỹ Dự phòng tích lũy ({formatMoneyVNDMillion(debtReserveBalance)})</option>
                      </optgroup>
                    </select>
                 </div>
              </div>

              <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-family-bgDeep border border-family-accent/30 rounded-full items-center justify-center text-blue-400 shadow-md">
                 ➔
              </div>

              <div className="space-y-4 bg-family-bgDark/30 p-4 rounded-xl border border-family-accent/10">
                 <h4 className="font-bold text-sm text-family-textLight uppercase tracking-wider mb-2">ĐẾN (Đích)</h4>
                 <div>
                    <label className="text-xs text-family-textMuted mb-1 block">Tài sản / Khoản mục Đích</label>
                    <select 
                      value={destinationValue}
                      onChange={e => setDestinationValue(e.target.value)}
                      className="w-full bg-family-bg border border-family-accent/20 rounded p-2 text-sm text-family-text focus:outline-none focus:border-blue-500"
                    >
                      <optgroup label="💵 Dôi dư Ngân sách">
                        <option value="cashflow:unallocated">Nguồn tiền dôi ra khi phân bổ ngân sách ({formatMoneyVNDMillion(unallocatedCashBalance)})</option>
                      </optgroup>
                      <optgroup label="📈 Danh mục đầu tư">
                        <option value="cashflow:investable">Quỹ Đầu tư Nhàn rỗi / Chưa có kế hoạch ({formatMoneyVNDMillion(idleCashflow)})</option>
                      </optgroup>
                      <optgroup label="🎯 Quản lý chi tiêu">
                        {liquidityBreakdownData.map(group => (
                          <option key={group.id} value={`cashflow:liquidity_group_${group.id}`}>Quỹ Sinh hoạt: {group.name} ({formatMoneyVNDMillion(group.remaining)})</option>
                        ))}
                        {state.lifeEvents?.filter(e => e.amount > 0).map(e => (
                          <option key={e.id} value={`life_event:${e.id}`}>{e.name} ({formatMoneyVNDMillion(e.amount)})</option>
                        ))}
                      </optgroup>
                      <optgroup label="🏦 Tiết kiệm">
                        <option value="pool:saving">Quỹ Tiết kiệm tích lũy ({formatMoneyVNDMillion(savingBalance)})</option>
                      </optgroup>
                      <optgroup label="🛡️ Dự phòng">
                        <option value="pool:debt_reserve">Quỹ Dự phòng tích lũy ({formatMoneyVNDMillion(debtReserveBalance)})</option>
                      </optgroup>
                    </select>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Input label="Số tiền điều chuyển (triệu VND)" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="VD: 50" required />
              <Input label="Ghi chú giao dịch" value={note} onChange={e => setNote(e.target.value)} placeholder="VD: Chuyển tiền tiết kiệm sang mua chứng khoán" />
           </div>

           {/* Live Interactive Simulation Banner */}
           {numAmount > 0 && sourceValue !== destinationValue && (
             <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-family-bgDark to-emerald-500/10 border border-amber-500/30 shadow-lg space-y-3 animate-fadeIn">
               <div className="flex items-center justify-between border-b border-family-accent/10 pb-2">
                 <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                   <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" /> Mô Phỏng Tác Động Dòng Tiền Trực Tiếp
                 </span>
                 <span className="text-xs font-mono font-bold text-amber-300">Chuyển {formatMoneyVNDMillion(numAmount)}</span>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                 <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex flex-col justify-between space-y-2">
                   <div className="flex items-center justify-between">
                     <span className="text-xs font-semibold text-red-300">TỪ (Nguồn giảm):</span>
                     <span className="text-xs font-bold text-red-400 bg-red-500/20 px-2 py-0.5 rounded-full">-{formatMoneyVNDMillion(numAmount)}</span>
                   </div>
                   <div className="text-sm font-bold text-family-text">{getItemLabel(sourceValue)}</div>
                   <div className="flex items-center justify-between pt-1 text-xs border-t border-red-500/10">
                     <span className="text-family-textMuted">Số dư:</span>
                     <div className="flex items-center gap-2">
                       <span className="text-family-textMuted line-through">{formatMoneyVNDMillion(availableBalance)}</span>
                       <span className="font-bold text-red-400">➔ {formatMoneyVNDMillion(Math.max(0, availableBalance - numAmount))}</span>
                     </div>
                   </div>
                 </div>
                 <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-between space-y-2">
                   <div className="flex items-center justify-between">
                     <span className="text-xs font-semibold text-emerald-300">ĐẾN (Đích tăng):</span>
                     <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">+{formatMoneyVNDMillion(numAmount)}</span>
                   </div>
                   <div className="text-sm font-bold text-family-text">{getItemLabel(destinationValue)}</div>
                   <div className="flex items-center justify-between pt-1 text-xs border-t border-emerald-500/10">
                     <span className="text-family-textMuted">Số dư:</span>
                     <div className="flex items-center gap-2">
                       <span className="text-family-textMuted line-through">{formatMoneyVNDMillion(destCurrentBalance)}</span>
                       <span className="font-bold text-emerald-400">➔ {formatMoneyVNDMillion(destCurrentBalance + numAmount)}</span>
                     </div>
                   </div>
                 </div>
               </div>
               <div className="text-xs text-family-textMuted bg-family-bg/60 p-2.5 rounded-lg text-center border border-family-accent/10 flex items-center justify-center gap-2">
                 <span>💡</span>
                 <span>Rút <strong className="text-red-400">{formatMoneyVNDMillion(numAmount)}</strong> từ <span className="text-family-textLight font-medium">{getItemLabel(sourceValue)}</span> để nạp vào <span className="text-emerald-400 font-medium">{getItemLabel(destinationValue)}</span>.</span>
               </div>
             </div>
           )}

           {formError && <WarningBox type="danger" message={formError} />}

           <div className="flex justify-end gap-3 pt-4 border-t border-family-accent/10">
              <Button type="button" variant="outline" onClick={onCancel}>Hủy</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Xác nhận Điều chuyển</Button>
           </div>
        </form>
      </CardContent>
    </Card>
  );
};
