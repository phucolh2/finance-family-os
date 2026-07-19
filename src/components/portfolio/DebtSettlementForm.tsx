import React, { useState } from 'react';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useAppContext } from '../../context/AppContext';
import type { DebtLiability } from '../../types/finance';

interface DebtSettlementFormProps {
  debt: DebtLiability;
  onCancel: () => void;
  onSuccess: () => void;
}

export const DebtSettlementForm: React.FC<DebtSettlementFormProps> = ({ debt, onCancel, onSuccess }) => {
  const { state, settleDebt, disburseSinkingFund } = useAppContext();
  const [settleForm, setSettleForm] = useState({ type: 'regular', fundId: '' });

  const handleSettleSubmit = () => {
    settleDebt(debt.id);
    if (settleForm.type === 'early' && settleForm.fundId && disburseSinkingFund) {
      const now = new Date();
      disburseSinkingFund(settleForm.fundId, now.getMonth() + 1, now.getFullYear());
    }
    onSuccess();
  };

  const debtPrepFunds = state.sinkingFunds?.filter(f => f.fundType === 'debt_prep' && f.status === 'active') || [];

  return (
    <div className="bg-family-bgDeep rounded-xl border border-emerald-500/30 p-4 max-w-3xl mx-auto shadow-sm">
      <h4 className="text-sm font-bold text-emerald-400 mb-4">Xác nhận Tất toán khoản nợ: {debt.name}</h4>
      <div className="flex flex-col md:flex-row gap-4 items-end">
         <div className="flex-1 space-y-2 w-full">
            <label className="text-xs text-family-textMuted uppercase">Phương thức Tất toán</label>
            <Select 
              value={settleForm.type}
              onChange={e => setSettleForm({...settleForm, type: e.target.value as 'regular' | 'early'})}
              options={[
                { value: 'regular', label: 'Trả hết theo tiến độ hàng tháng (Regular)' },
                { value: 'early', label: 'Tất toán sớm (Early Termination)' }
              ]}
              className="bg-family-bgDark border-emerald-500/20"
            />
         </div>
         {settleForm.type === 'early' && (
           <div className="flex-1 space-y-2 w-full">
              <label className="text-xs text-family-textMuted uppercase">Nguồn tiền tất toán</label>
              <Select
                value={settleForm.fundId}
                onChange={e => setSettleForm({...settleForm, fundId: e.target.value})}
                options={[
                   { value: '', label: '-- Chọn Quỹ chuẩn bị trả nợ --' },
                   ...debtPrepFunds.map(f => ({ value: f.id, label: `${f.name}` }))
                ]}
                className="bg-family-bgDark border-emerald-500/20"
              />
           </div>
         )}
         <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
            <Button variant="outline" className="flex-1 md:flex-none border-family-accent/20" onClick={onCancel}>Hủy</Button>
            <Button 
               disabled={settleForm.type === 'early' && !settleForm.fundId}
               className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white"
               onClick={handleSettleSubmit}
            >
              Xác nhận
            </Button>
         </div>
      </div>
    </div>
  );
};
