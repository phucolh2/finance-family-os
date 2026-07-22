import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useAppContext } from '../../context/AppContext';
import { HelpTooltip } from '../ui/HelpTooltip';
import { runProjection } from '../../engines/projectionEngine';
import { formatMoneyVNDMillion } from '../../utils/format';
import { WarningBox } from '../ui/WarningBox';

interface TransferFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const TransferForm: React.FC<TransferFormProps> = ({ onSuccess, onCancel }) => {
  const { state, addFundTransfer, selectedPeriodKey } = useAppContext();
  const [sourceValue, setSourceValue] = useState<string>('cashflow:investable');
  const [destinationValue, setDestinationValue] = useState<string>('savings:new');
  
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  const [currentYear, currentMonth] = (selectedPeriodKey || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`).split('-').map(Number);

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
    projectionAdjustments: state.projectionAdjustments,
    lifeStages: state.lifeStages,
    fundTransfers: state.fundTransfers,
    expenseSchedule: state.expenseSchedule,
    sinkingFunds: state.sinkingFunds,
    debts: state.debts,
  });

  const currentKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const currentRow = projection.monthlyRows.find(r => r.period.key === currentKey);
  let idleCashflow = 0;
  let liquidityBalance = 0;
  let unallocatedCashBalance = 0;
  if (currentRow) {
    const port = currentRow.portfolio;
    idleCashflow = port.unallocatedEndingBalance || 0;
    liquidityBalance = currentRow.liquidityBalance || 0;
    unallocatedCashBalance = currentRow.unallocatedCashBalance || 0;
  }
  
  const savingBalance = currentRow?.savingBalance || 0;
  const debtReserveBalance = (currentRow?.debtReserveBalance || 0) + (currentRow?._activeSinkingFundsDebtReserve || 0);

  const totalLifeEventsMoney = state.lifeEvents?.reduce((sum, e) => sum + Math.max(0, e.amount), 0) || 0;
  const hasActiveInvestments = (state.investmentDeals?.filter(d => d.status === 'active').length ?? 0) > 0 || 
                               (state.sinkingFunds?.filter(f => f.status === 'active').length ?? 0) > 0;

  const [srcType, srcId] = sourceValue.split(':');
  const [destType, destId] = destinationValue.split(':');

  let availableBalance = 0;
  if (srcType === 'cashflow') {
    availableBalance = idleCashflow;
  } else if (srcType === 'life_event') {
    availableBalance = state.lifeEvents?.find(e => e.id === srcId)?.amount || 0;
  } else if (srcType === 'investment') {
    availableBalance = state.investmentDeals?.find(d => d.id === srcId)?.capital || 0;
  } else if (srcType === 'sinking_fund') {
    availableBalance = state.sinkingFunds?.find(f => f.id === srcId)?.initialDeposit || 0;
  } else if (srcType === 'savings') {
    availableBalance = state.savingsDeposits?.find(s => s.id === srcId)?.principal || 0;
  } else if (srcType === 'pool' && srcId === 'saving') {
    availableBalance = savingBalance;
  } else if (srcType === 'pool' && srcId === 'debt_reserve') {
    availableBalance = debtReserveBalance;
  }

  let maxDebtPayment = 0;
  if (destType === 'debt') {
    maxDebtPayment = state.debts?.find(d => d.id === destId)?.principal || 0;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    
    if (!amount || numAmount <= 0) {
      setFormError('Số tiền điều chuyển phải lớn hơn 0.');
      return;
    }
    if (numAmount > availableBalance) {
      setFormError(`Số tiền điều chuyển (${numAmount} Tr) vượt quá số dư khả dụng của nguồn (${formatMoneyVNDMillion(availableBalance)} Tr).`);
      return;
    }
    if (destType === 'debt' && numAmount > maxDebtPayment) {
      setFormError(`Số tiền trả nợ (${numAmount} Tr) vượt quá dư nợ gốc hiện tại (${formatMoneyVNDMillion(maxDebtPayment)} Tr).`);
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
      destinationId: destId === 'new' ? undefined : destId,
      note,
    });
    
    onSuccess();
  };

  return (
    <Card className="border border-family-accent/20 bg-family-bgDeep overflow-hidden">
      <CardHeader className="bg-blue-500/10 border-b border-blue-500/20 flex flex-row items-center justify-between pb-4">
        <div>
           <CardTitle className="text-blue-400 text-lg flex items-center gap-2">
              Lệnh Điều Chuyển Dòng Tiền 
              <HelpTooltip text="Sử dụng công cụ này để chuyển tiền qua lại giữa các nguồn (Tiết kiệm, Đầu tư, Quỹ...) nhằm mô phỏng dòng tiền thực tế." />
           </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
              <div className="space-y-4 bg-family-bgDark/30 p-4 rounded-xl border border-family-accent/10">
                 <h4 className="font-bold text-sm text-family-textLight uppercase tracking-wider mb-2">TỪ (Nguồn)</h4>
                 <div>
                    <label className="text-xs text-family-textMuted mb-1 block">Tài sản / Khoản mục Nguồn</label>
                    <select 
                      value={sourceValue}
                      onChange={e => setSourceValue(e.target.value)}
                      className="w-full bg-family-bg border border-family-accent/20 rounded p-2 text-sm text-family-text focus:outline-none focus:border-blue-500"
                    >
                      <optgroup label="💵 Dòng tiền">
                        <option value="cashflow:investable">Quỹ Đầu tư Nhàn rỗi ({formatMoneyVNDMillion(idleCashflow)})</option>
                        <option value="cashflow:liquidity">Quỹ Thanh khoản Sinh hoạt ({formatMoneyVNDMillion(liquidityBalance)})</option>
                        <option value="cashflow:unallocated">Dòng tiền chưa phân bổ ({formatMoneyVNDMillion(unallocatedCashBalance)})</option>
                      </optgroup>
                      
                      <optgroup label="🎯 Sự kiện cuộc đời">
                        {(state.lifeEvents?.filter(e => e.amount > 0).length ?? 0) === 0 && (
                          <option disabled>(Không có sự kiện nào có tiền dôi dư)</option>
                        )}
                        {state.lifeEvents?.filter(e => e.amount > 0).map(e => (
                          <option key={e.id} value={`life_event:${e.id}`}>{e.name} (+{formatMoneyVNDMillion(e.amount)})</option>
                        ))}
                      </optgroup>

                      <optgroup label="📈 Danh mục đầu tư">
                        {!hasActiveInvestments && <option disabled>(Không có Thương vụ / Quỹ đang hoạt động)</option>}
                        {state.investmentDeals?.filter(d => d.status === 'active').map(d => (
                          <option key={d.id} value={`investment:${d.id}`}>Thương vụ: {d.name} (Rút vốn, {formatMoneyVNDMillion(d.capital)})</option>
                        ))}
                        {state.sinkingFunds?.filter(f => f.status === 'active').map(f => (
                          <option key={f.id} value={`sinking_fund:${f.id}`}>Quỹ: {f.name} (Tất toán, {formatMoneyVNDMillion(f.initialDeposit)})</option>
                        ))}
                      </optgroup>

                      <optgroup label="🏦 Tiết kiệm & Nợ">
                        <option value="pool:saving" disabled>Quỹ Tiết Kiệm ({formatMoneyVNDMillion(savingBalance)} — khóa)</option>
                        <option value="pool:debt_reserve" disabled>Quỹ Trả nợ ({formatMoneyVNDMillion(debtReserveBalance)} — khóa)</option>
                        {state.savingsDeposits?.filter(s => s.status === 'active').map(s => (
                          <option key={s.id} value={`savings:${s.id}`}>Sổ TK: {s.name} (Tất toán, {formatMoneyVNDMillion(s.principal)})</option>
                        ))}
                      </optgroup>
                    </select>
                 </div>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-family-bgDeep border border-family-accent/30 rounded-full items-center justify-center text-blue-400">
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
                      <optgroup label="💵 Dòng tiền">
                        <option value="cashflow:investable">Quỹ Đầu tư Nhàn rỗi (Bổ sung vào)</option>
                        <option value="cashflow:liquidity">Quỹ Thanh khoản Sinh hoạt (Bổ sung vào)</option>
                        <option value="cashflow:unallocated">Dòng tiền chưa phân bổ (Bổ sung vào)</option>
                      </optgroup>

                      <optgroup label="🎯 Sự kiện cuộc đời">
                        <option disabled>(Không thể chuyển tiền vào sự kiện)</option>
                      </optgroup>

                      <optgroup label="📈 Danh mục đầu tư">
                        {!hasActiveInvestments && <option disabled>(Không có Thương vụ / Quỹ đang hoạt động)</option>}
                        {state.investmentDeals?.filter(d => d.status === 'active').map(d => (
                          <option key={d.id} value={`investment:${d.id}`}>Thương vụ: {d.name} (Bơm vốn)</option>
                        ))}
                        {state.sinkingFunds?.filter(f => f.status === 'active').map(f => (
                          <option key={f.id} value={`sinking_fund:${f.id}`}>Quỹ: {f.name} (Bơm vốn)</option>
                        ))}
                      </optgroup>

                      <optgroup label="🏦 Tiết kiệm & Nợ">
                        <option value="savings:new">Sổ TK: Mở sổ mới</option>
                        {state.debts?.filter(d => d.status === 'active').map(d => (
                          <option key={d.id} value={`debt:${d.id}`}>Khoản nợ: {d.name} (Trả sớm, {formatMoneyVNDMillion(d.principal)})</option>
                        ))}
                      </optgroup>
                    </select>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                 <Input 
                   label="Số tiền điều chuyển (Tr VND)" 
                   type="number" 
                   value={amount} 
                   onChange={e => setAmount(e.target.value)} 
                   placeholder="VD: 50" 
                   required 
                 />
              </div>
              <div>
                 <Input 
                   label="Ghi chú giao dịch" 
                   value={note} 
                   onChange={e => setNote(e.target.value)} 
                   placeholder="VD: Chuyển tiền tiết kiệm sang mua chứng khoán" 
                 />
              </div>
           </div>

           {formError && (
             <WarningBox type="danger" message={formError} />
           )}

           <div className="flex justify-end gap-3 pt-4 border-t border-family-accent/10">
              <Button type="button" variant="outline" onClick={onCancel}>Hủy</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Xác nhận Điều chuyển</Button>
           </div>
        </form>
      </CardContent>
    </Card>
  );
};
