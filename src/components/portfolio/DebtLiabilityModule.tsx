import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { HelpTooltip } from '../ui/HelpTooltip';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { AlertCircle, Plus, Trash2, CheckCircle2, DollarSign, Calendar } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { formatMoneyVNDMillion } from '../../utils/format';
import { calculatePMT } from '../../utils/math';

export const DebtLiabilityModule: React.FC = () => {
  const { state, addDebt, updateDebt, deleteDebt, settleDebt, selectedPeriodKey } = useAppContext();
  const { debts = [] } = state;
  const [isAdding, setIsAdding] = useState(false);

  React.useEffect(() => {
    setIsAdding(false);
  }, [selectedPeriodKey]);

  const [newDebt, setNewDebt] = useState({
    name: '',
    type: 'mortgage' as const,
    principal: '',
    interestRateAnnual: '',
    termMonths: '',
    startMonth: new Date().getMonth() + 1,
    startYear: new Date().getFullYear(),
  });

  const handleAdd = () => {
    if (!newDebt.name || !newDebt.principal || !newDebt.termMonths) return;
    
    addDebt({
      name: newDebt.name,
      type: newDebt.type,
      principal: Number(newDebt.principal),
      interestRateAnnual: Number(newDebt.interestRateAnnual) || 0,
      termMonths: Number(newDebt.termMonths),
      startMonth: newDebt.startMonth,
      startYear: newDebt.startYear,
      status: 'active',
    });
    
    setIsAdding(false);
    setNewDebt({
      name: '',
      type: 'mortgage',
      principal: '',
      interestRateAnnual: '',
      termMonths: '',
      startMonth: new Date().getMonth() + 1,
      startYear: new Date().getFullYear(),
    });
  };

  return (
    <Card className="border border-family-accent/20 bg-family-bgDeep overflow-hidden">
      <CardHeader className="bg-red-500/10 border-b border-red-500/20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="text-red-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Công Nợ & Nghĩa vụ (Liabilities)
              <HelpTooltip text="Theo dõi các khoản vay trả góp, áp dụng công thức dư nợ giảm dần để dự báo dòng tiền chính xác qua các năm." />
            </CardTitle>
            <CardDescription className="text-red-300/70">
              Kiểm soát các khoản vay (nhà, xe, tiêu dùng). Tiền trả nợ gốc + lãi sẽ tự động trừ vào Ngân sách hằng tháng.
            </CardDescription>
          </div>
          <Button 
            onClick={() => { setIsAdding(!isAdding); }}
            variant="outline"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            {isAdding ? 'Hủy bỏ' : <><Plus className="w-4 h-4 mr-2" /> Thêm khoản nợ</>}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isAdding && (
          <div className="p-4 bg-red-500/5 border-b border-red-500/10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-family-textMuted uppercase">Tên khoản nợ</label>
              <Input
                value={newDebt.name}
                onChange={e => { setNewDebt({...newDebt, name: e.target.value}); }}
                placeholder="Vd: Vay mua chung cư"
                className="bg-family-bgDark"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-family-textMuted uppercase">Phân loại</label>
              <Select
                value={newDebt.type}
                onChange={e => { setNewDebt({...newDebt, type: e.target.value as any}); }}
                options={[
                  { value: 'mortgage', label: 'Vay Bất Động Sản' },
                  { value: 'auto', label: 'Vay Mua Ô tô' },
                  { value: 'consumer', label: 'Vay Tiêu Dùng / Thẻ' },
                  { value: 'business', label: 'Vay Kinh Doanh' }
                ]}
                className="bg-family-bgDark"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-family-textMuted uppercase">Dư nợ Gốc (Tr VNĐ)</label>
              <Input
                type="number"
                value={newDebt.principal}
                onChange={e => { setNewDebt({...newDebt, principal: e.target.value}); }}
                placeholder="Vd: 2000"
                className="bg-family-bgDark border-red-500/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-family-textMuted uppercase">Lãi suất (%/năm)</label>
              <Input
                type="number"
                value={newDebt.interestRateAnnual}
                onChange={e => { setNewDebt({...newDebt, interestRateAnnual: e.target.value}); }}
                placeholder="Vd: 9.5"
                className="bg-family-bgDark border-red-500/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-family-textMuted uppercase">Thời hạn (Tháng)</label>
              <Input
                type="number"
                value={newDebt.termMonths}
                onChange={e => { setNewDebt({...newDebt, termMonths: e.target.value}); }}
                placeholder="Vd: 240 (20 năm)"
                className="bg-family-bgDark"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-family-textMuted uppercase">Bắt đầu từ (Tháng/Năm)</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={newDebt.startMonth}
                  placeholder="VD: 1"
                  onChange={e => { setNewDebt({...newDebt, startMonth: Number(e.target.value)}); }}
                  className="w-24 bg-family-bgDark"
                />
                <Input
                  type="number"
                  value={newDebt.startYear}
                  placeholder="VD: 2026"
                  onChange={e => { setNewDebt({...newDebt, startYear: Number(e.target.value)}); }}
                  className="w-28 bg-family-bgDark"
                />
              </div>
            </div>
            <div className="lg:col-span-4 flex justify-end items-end">
              <Button onClick={handleAdd} className="bg-red-600 hover:bg-red-700 text-white w-full md:w-auto">
                Lưu Khoản Nợ
              </Button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-family-textMuted uppercase bg-family-bgDark/40">
              <tr>
                <th className="px-4 py-3">Khoản Nợ</th>
                <th className="px-4 py-3">Dư Nợ Gốc</th>
                <th className="px-4 py-3">Lãi Suất</th>
                <th className="px-4 py-3">Thời Hạn</th>
                <th className="px-4 py-3">Trả Hàng Tháng (Gốc + Lãi)</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-family-accent/10">
              {debts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-family-textMuted">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
                    Tuyệt vời! Gia đình bạn không có khoản nợ nào.
                  </td>
                </tr>
              ) : (
                debts.map(debt => {
                  const pmt = calculatePMT(debt.principal, debt.interestRateAnnual, debt.termMonths);
                  return (
                    <tr key={debt.id} className="hover:bg-family-bgDark/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-red-200">{debt.name}</div>
                        <div className="text-xs text-family-textMuted mt-0.5">{
                          debt.type === 'mortgage' ? 'BĐS' : 
                          debt.type === 'auto' ? 'Ô tô' : 
                          debt.type === 'consumer' ? 'Tiêu dùng' : 'Kinh doanh'
                        }</div>
                      </td>
                      <td className="px-4 py-3 font-bold text-red-400">
                        {formatMoneyVNDMillion(debt.principal)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-red-300 font-medium">{debt.interestRateAnnual}%/năm</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-family-textMuted" />
                          <span>{debt.termMonths} tháng</span>
                        </div>
                        <div className="text-[10px] text-family-textMuted">
                          Bắt đầu: {debt.startMonth}/{debt.startYear}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-red-400 font-bold bg-red-500/10 w-fit px-2 py-1 rounded">
                          <DollarSign className="w-3.5 h-3.5" />
                          {formatMoneyVNDMillion(pmt)}/tháng
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {debt.status === 'active' ? (
                          <span className="px-2 py-1 bg-red-500/10 text-red-400 text-[10px] font-bold rounded-md uppercase tracking-wider">
                            Đang Trả Nợ
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-md uppercase tracking-wider">
                            Đã Tất Toán
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {debt.status === 'active' && (
                          <Button
                            onClick={() => { settleDebt(debt.id); }}
                            variant="outline"
                            className="text-xs px-2 py-1 h-auto text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 mr-2"
                            title="Đánh dấu đã thanh toán hết nợ"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Tất toán
                          </Button>
                        )}
                        <button
                          onClick={() => { deleteDebt(debt.id); }}
                          className="text-family-textMuted hover:text-red-400 transition-colors"
                          title="Xóa khoản nợ này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
