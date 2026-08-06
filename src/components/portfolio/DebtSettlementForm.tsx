import React from 'react';
import { Button } from '../ui/Button';
import { useAppContext } from '../../context/AppContext';
import type { DebtLiability } from '../../types/finance';

interface DebtSettlementFormProps {
  debt: DebtLiability;
  onCancel: () => void;
  onSuccess: () => void;
}

export const DebtSettlementForm: React.FC<DebtSettlementFormProps> = ({ debt, onCancel, onSuccess }) => {
  const { settleDebt } = useAppContext();

  const handleSettleSubmit = () => {
    settleDebt(debt.id);
    onSuccess();
  };

  return (
    <div className="bg-family-bgDeep rounded-xl border border-emerald-500/30 p-4 max-w-3xl mx-auto shadow-sm">
      <h4 className="text-sm font-bold text-emerald-400 mb-2">Xác nhận Tất toán khoản nợ: {debt.name}</h4>
      <p className="text-sm text-family-textMuted mb-4">
        Hành động này sẽ đánh dấu khoản nợ là đã được tất toán (dư nợ bằng 0). Việc này chỉ dùng để ghi nhận trên sổ nợ và không làm thay đổi các quỹ khác của bạn.
      </p>
      <div className="flex justify-end gap-2">
         <Button variant="outline" className="border-family-accent/20" onClick={onCancel}>Hủy</Button>
         <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleSettleSubmit}
         >
           Xác nhận Tất toán
         </Button>
      </div>
    </div>
  );
};
