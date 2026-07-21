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
  
  const [sourceValue, setSourceValue] = useState<string>('cashflow:');
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
  });

  const currentKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const currentRow = projection.monthlyRows.find(r => r.period.key === currentKey);
  const idleCashflow = currentRow ? currentRow.netCashflowMonthly : 0;

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
                      <optgroup label="Màn hình: Kế hoạch Thu nhập (Dòng tiền)">
                        <option value="cashflow:">Ngân sách Dòng tiền (Chưa phân bổ: {formatMoneyVNDMillion(idleCashflow)})</option>
                      </optgroup>
                      
                      {state.lifeEvents && state.lifeEvents.filter(e => e.amount > 0).length > 0 && (
                        <optgroup label="Màn hình: Sự kiện cuộc đời">
                          {state.lifeEvents.filter(e => e.amount > 0).map(e => (
                            <option key={e.id} value={`life_event:${e.id}`}>Tiền dôi dư: {e.name} (+{e.amount} Tr)</option>
                          ))}
                        </optgroup>
                      )}

                      {((state.investmentDeals?.filter(d => d.status === 'active').length ?? 0) > 0 || 
                        (state.sinkingFunds?.filter(f => f.status === 'active').length ?? 0) > 0) && (
                        <optgroup label="Màn hình: Danh mục đầu tư">
                          {state.investmentDeals?.filter(d => d.status === 'active').map(d => (
                            <option key={d.id} value={`investment:${d.id}`}>Rút vốn Thương vụ: {d.name} ({d.capital} Tr)</option>
                          ))}
                          {state.sinkingFunds?.filter(f => f.status === 'active').map(f => (
                            <option key={f.id} value={`sinking_fund:${f.id}`}>Tất toán Quỹ: {f.name} ({f.initialDeposit} Tr gốc)</option>
                          ))}
                        </optgroup>
                      )}

                      {state.savingsDeposits && state.savingsDeposits.filter(s => s.status === 'active').length > 0 && (
                        <optgroup label="Màn hình: Tiết kiệm & Nợ">
                          {state.savingsDeposits.filter(s => s.status === 'active').map(s => (
                            <option key={s.id} value={`savings:${s.id}`}>Tất toán Sổ tiết kiệm: {s.name} ({s.principal} Tr)</option>
                          ))}
                        </optgroup>
                      )}
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
                      <optgroup label="Màn hình: Kế hoạch Thu nhập (Dòng tiền)">
                        <option value="cashflow:">Bổ sung vào Ngân sách Dòng tiền</option>
                      </optgroup>
                      
                      {((state.investmentDeals?.filter(d => d.status === 'active').length ?? 0) > 0 || 
                        (state.sinkingFunds?.filter(f => f.status === 'active').length ?? 0) > 0) && (
                        <optgroup label="Màn hình: Danh mục đầu tư">
                          {state.investmentDeals?.filter(d => d.status === 'active').map(d => (
                            <option key={d.id} value={`investment:${d.id}`}>Bơm vốn Thương vụ: {d.name}</option>
                          ))}
                          {state.sinkingFunds?.filter(f => f.status === 'active').map(f => (
                            <option key={f.id} value={`sinking_fund:${f.id}`}>Bơm tiền Quỹ: {f.name}</option>
                          ))}
                        </optgroup>
                      )}

                      <optgroup label="Màn hình: Tiết kiệm & Nợ">
                        <option value="savings:new">Mở Sổ tiết kiệm mới</option>
                        {state.debts?.filter(d => d.status === 'active').map(d => (
                          <option key={d.id} value={`debt:${d.id}`}>Trả nợ sớm: {d.name} (Dư nợ: {d.principal} Tr)</option>
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
