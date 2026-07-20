import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowRightLeft, Plus, History } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { TransferForm } from '../components/transfer/TransferForm';
import { ObservationControls } from '../components/ui/ObservationControls';
import { formatMoneyVNDMillion } from '../utils/format';

export const FundTransfers: React.FC = () => {
  const { state, deleteFundTransfer } = useAppContext();
  const { fundTransfers = [] } = state;
  
  const [showTransferForm, setShowTransferForm] = useState(false);

  const getSourceLabel = (type: string, id?: string) => {
    switch (type) {
      case 'cashflow': return 'Ngân sách Dòng tiền';
      case 'life_event': return `Sự kiện: ${state.lifeEvents?.find(e => e.id === id)?.name || 'N/A'}`;
      case 'savings': return `Tiết kiệm: ${state.savingsDeposits?.find(s => s.id === id)?.name || 'N/A'}`;
      case 'investment': return `Đầu tư: ${state.investmentDeals?.find(d => d.id === id)?.name || 'N/A'}`;
      case 'sinking_fund': return `Quỹ: ${state.sinkingFunds?.find(f => f.id === id)?.name || 'N/A'}`;
      default: return type;
    }
  };

  const getDestLabel = (type: string, id?: string) => {
    switch (type) {
      case 'savings': return 'Sổ tiết kiệm mới';
      case 'investment': return `Đầu tư: ${state.investmentDeals?.find(d => d.id === id)?.name || 'N/A'}`;
      case 'sinking_fund': return `Quỹ: ${state.sinkingFunds?.find(f => f.id === id)?.name || 'N/A'}`;
      case 'debt': return `Trả nợ: ${state.debts?.find(d => d.id === id)?.name || 'N/A'}`;
      default: return type;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-family-text flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-blue-500" />
            Điều Chuyển Dòng Tiền
          </h2>
          <p className="text-family-textMuted text-sm mt-1">
            Ghi nhận và mô phỏng các nghiệp vụ chuyển tiền thực tế giữa các nguồn.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ObservationControls />
          {!showTransferForm && (
            <Button onClick={() => setShowTransferForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shrink-0">
              <Plus className="w-4 h-4" /> Thực hiện Điều chuyển
            </Button>
          )}
        </div>
      </div>

      {showTransferForm && (
         <div className="mb-8">
            <TransferForm onSuccess={() => setShowTransferForm(false)} onCancel={() => setShowTransferForm(false)} />
         </div>
      )}

      <Card className="border border-family-accent/20 bg-family-bgDeep overflow-hidden">
        <CardHeader className="border-b border-family-accent/10 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-500" /> Lịch sử Điều chuyển (Ledger)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {fundTransfers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-family-bgDark/50 border-b border-family-accent/10 text-family-textMuted text-xs uppercase">
                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Thời gian</th>
                    <th className="px-6 py-4 font-semibold">Giao dịch</th>
                    <th className="px-6 py-4 font-semibold text-right whitespace-nowrap">Số tiền (Tr VND)</th>
                    <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-family-accent/10">
                  {fundTransfers.slice().sort((a, b) => b.createdAt - a.createdAt).map(tf => (
                    <tr key={tf.id} className="hover:bg-family-bgDark/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-family-textMuted text-xs">
                        {new Date(tf.createdAt).toLocaleString('vi-VN')}
                        <div className="text-[10px] text-blue-400 font-medium">Kỳ: Tháng {tf.month}/{tf.year}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-red-400 font-medium bg-red-400/10 px-2 py-0.5 rounded text-xs">
                            {getSourceLabel(tf.sourceType, tf.sourceId)}
                          </span>
                          <span className="text-family-textMuted text-xs">➔</span>
                          <span className="text-green-400 font-medium bg-green-400/10 px-2 py-0.5 rounded text-xs">
                            {getDestLabel(tf.destinationType, tf.destinationId)}
                          </span>
                        </div>
                        {tf.note && (
                          <div className="text-xs text-family-textMuted mt-1 italic opacity-80">{tf.note}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-family-textLight whitespace-nowrap">
                        {formatMoneyVNDMillion(tf.amount)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => { if(window.confirm('Bạn có chắc muốn xóa lịch sử này? Lưu ý: Việc xóa chỉ xóa log, không tự động Rollback số dư trong phiên bản hiện tại.')) deleteFundTransfer(tf.id); }}
                          className="text-red-400 hover:text-red-300 border-red-500/20 hover:bg-red-500/10 h-7 text-xs"
                        >
                          Xóa log
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
             <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 mb-4">
                  <ArrowRightLeft className="w-6 h-6" />
                </div>
                <h3 className="text-family-text font-semibold mb-1">Chưa có giao dịch điều chuyển nào</h3>
                <p className="text-family-textMuted text-sm max-w-sm mx-auto">
                   Mô phỏng các luồng tiền thực tế của gia đình bạn bằng cách thực hiện các Lệnh điều chuyển giữa Tài sản, Dòng tiền và Công nợ.
                </p>
                <Button onClick={() => setShowTransferForm(true)} variant="outline" className="mt-4 border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                   Thực hiện lệnh đầu tiên
                </Button>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
