import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useAppContext } from '../../context/AppContext';
import { HelpTooltip } from '../ui/HelpTooltip';

interface TransferFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const TransferForm: React.FC<TransferFormProps> = ({ onSuccess, onCancel }) => {
  const { state, addFundTransfer, selectedPeriodKey } = useAppContext();
  
  const [sourceType, setSourceType] = useState<string>('cashflow');
  const [sourceId, setSourceId] = useState<string>('');
  
  const [destinationType, setDestinationType] = useState<string>('savings');
  const [destinationId, setDestinationId] = useState<string>('');
  
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const [currentYear, currentMonth] = (selectedPeriodKey || `${new Date().getFullYear()}-${new Date().getMonth() + 1}`).split('-').map(Number);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    addFundTransfer({
      month: currentMonth,
      year: currentYear,
      amount: Number(amount),
      sourceType: sourceType as any,
      sourceId,
      destinationType: destinationType as any,
      destinationId,
      note,
    });
    
    onSuccess();
  };

  const renderSourceOptions = () => {
    switch(sourceType) {
      case 'savings':
        return (
          <Select 
            value={sourceId} 
            onChange={e => setSourceId(e.target.value)} 
            options={[
              { value: '', label: '-- Chọn Sổ tiết kiệm --' },
              ...(state.savingsDeposits?.filter(s => s.status === 'active').map(s => ({ value: s.id, label: `${s.name} (${s.principal} Tr)` })) || [])
            ]}
          />
        );
      case 'investment':
        return (
          <Select 
            value={sourceId} 
            onChange={e => setSourceId(e.target.value)} 
            options={[
              { value: '', label: '-- Chọn Thương vụ đầu tư --' },
              ...(state.investmentDeals?.filter(d => d.status === 'active').map(d => ({ value: d.id, label: `${d.name} (${d.capital} Tr)` })) || [])
            ]}
          />
        );
      case 'sinking_fund':
        return (
          <Select 
            value={sourceId} 
            onChange={e => setSourceId(e.target.value)} 
            options={[
              { value: '', label: '-- Chọn Quỹ mục tiêu --' },
              ...(state.sinkingFunds?.filter(f => f.status === 'active').map(f => ({ value: f.id, label: `${f.name}` })) || [])
            ]}
          />
        );
      case 'life_event':
        return (
          <Select 
            value={sourceId} 
            onChange={e => setSourceId(e.target.value)} 
            options={[
              { value: '', label: '-- Chọn Sự kiện cuộc đời --' },
              ...(state.lifeEvents?.map(e => ({ value: e.id, label: `${e.name} (${e.amount > 0 ? '+' : ''}${e.amount} Tr)` })) || [])
            ]}
          />
        );
      case 'cashflow':
      default:
        return <div className="text-sm text-family-textMuted p-2 bg-family-bgDark/30 rounded border border-family-accent/10">Trực tiếp từ số dư ngân sách tháng</div>;
    }
  };

  const renderDestinationOptions = () => {
    switch(destinationType) {
      case 'investment':
        return (
          <Select 
            value={destinationId} 
            onChange={e => setDestinationId(e.target.value)} 
            options={[
              { value: '', label: '-- Chọn Thương vụ đầu tư --' },
              ...(state.investmentDeals?.filter(d => d.status === 'active').map(d => ({ value: d.id, label: `${d.name}` })) || [])
            ]}
          />
        );
      case 'sinking_fund':
        return (
          <Select 
            value={destinationId} 
            onChange={e => setDestinationId(e.target.value)} 
            options={[
              { value: '', label: '-- Chọn Quỹ mục tiêu --' },
              ...(state.sinkingFunds?.filter(f => f.status === 'active').map(f => ({ value: f.id, label: `${f.name}` })) || [])
            ]}
          />
        );
      case 'debt':
        return (
           <Select 
            value={destinationId} 
            onChange={e => setDestinationId(e.target.value)} 
            options={[
              { value: '', label: '-- Chọn Khoản Nợ --' },
              ...(state.debts?.filter(d => d.status === 'active').map(d => ({ value: d.id, label: `${d.name}` })) || [])
            ]}
          />
        );
      case 'savings':
      default:
        return <div className="text-sm text-family-textMuted p-2 bg-family-bgDark/30 rounded border border-family-accent/10">Mở sổ Tiết kiệm mới</div>;
    }
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
                    <label className="text-xs text-family-textMuted mb-1 block">Loại nguồn tiền</label>
                    <Select 
                      value={sourceType} 
                      onChange={e => { setSourceType(e.target.value); setSourceId(''); }}
                      options={[
                        { value: 'cashflow', label: 'Ngân sách Dòng tiền' },
                        { value: 'life_event', label: 'Sự kiện cuộc đời' },
                        { value: 'savings', label: 'Rút từ Sổ Tiết Kiệm' },
                        { value: 'investment', label: 'Rút vốn Đầu tư' },
                        { value: 'sinking_fund', label: 'Rút từ Quỹ mục tiêu' },
                      ]}
                    />
                 </div>
                 <div>
                    <label className="text-xs text-family-textMuted mb-1 block">Chi tiết nguồn</label>
                    {renderSourceOptions()}
                 </div>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-family-bgDeep border border-family-accent/30 rounded-full items-center justify-center text-blue-400">
                 ➔
              </div>

              <div className="space-y-4 bg-family-bgDark/30 p-4 rounded-xl border border-family-accent/10">
                 <h4 className="font-bold text-sm text-family-textLight uppercase tracking-wider mb-2">ĐẾN (Đích)</h4>
                 <div>
                    <label className="text-xs text-family-textMuted mb-1 block">Loại đích đến</label>
                    <Select 
                      value={destinationType} 
                      onChange={e => { setDestinationType(e.target.value); setDestinationId(''); }}
                      options={[
                        { value: 'savings', label: 'Chuyển vào Tiết Kiệm (Mở sổ mới)' },
                        { value: 'investment', label: 'Bơm vốn Đầu tư' },
                        { value: 'sinking_fund', label: 'Bơm vốn Quỹ mục tiêu' },
                        { value: 'debt', label: 'Trả nợ sớm' },
                      ]}
                    />
                 </div>
                 <div>
                    <label className="text-xs text-family-textMuted mb-1 block">Chi tiết đích</label>
                    {renderDestinationOptions()}
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

           <div className="flex justify-end gap-3 pt-4 border-t border-family-accent/10">
              <Button type="button" variant="outline" onClick={onCancel}>Hủy</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Xác nhận Điều chuyển</Button>
           </div>
        </form>
      </CardContent>
    </Card>
  );
};
