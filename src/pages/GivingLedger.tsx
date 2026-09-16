import React, { useState, useMemo } from 'react';
import { useAppState } from '../hooks/useAppState';
import { 
  Gift, Search, ArrowUpRight, ArrowDownLeft, 
  Calendar, User, Edit2, Trash2, X, HeartHandshake,
  Baby, Home, HeartPulse, Cake, PartyPopper, Hash
} from 'lucide-react';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';

export interface GiftRecord {
  id: string;
  direction: 'give' | 'receive';
  personName: string;
  eventType: 'wedding' | 'funeral' | 'baby' | 'house' | 'illness' | 'birthday' | 'tet' | 'other';
  amount: number; // In plain VND
  date: string;
  notes: string;
}

const EVENT_TYPES = {
  wedding: { label: 'Đám cưới', icon: HeartHandshake, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  funeral: { label: 'Đám hiếu', icon: Hash, color: 'text-slate-500', bg: 'bg-slate-500/10' },
  baby: { label: 'Đầy tháng/Thôi nôi', icon: Baby, color: 'text-sky-500', bg: 'bg-sky-500/10' },
  house: { label: 'Tân gia', icon: Home, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  illness: { label: 'Thăm ốm', icon: HeartPulse, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  birthday: { label: 'Sinh nhật', icon: Cake, color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/10' },
  tet: { label: 'Lễ Tết/Mừng thọ', icon: PartyPopper, color: 'text-red-500', bg: 'bg-red-500/10' },
  other: { label: 'Khác', icon: Gift, color: 'text-gray-500', bg: 'bg-gray-500/10' },
};

export const GivingLedger: React.FC = () => {
  const { state, updateToolConfig } = useAppState();
  
  const config = state.toolConfigs?.givingLedger || { records: [] };
  const records: GiftRecord[] = config.records || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDirection, setFilterDirection] = useState<'all' | 'give' | 'receive'>('all');
  const [filterType, setFilterType] = useState<string>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<GiftRecord | null>(null);
  const [modalDirection, setModalDirection] = useState<'give' | 'receive'>('give');

  const saveConfig = (newRecords: GiftRecord[]) => {
    updateToolConfig('givingLedger', { records: newRecords });
  };

  const { totalGiven, totalReceived, netBalance } = useMemo(() => {
    let given = 0;
    let received = 0;
    records.forEach(r => {
      if (r.direction === 'give') given += r.amount;
      else received += r.amount;
    });
    return {
      totalGiven: given,
      totalReceived: received,
      netBalance: received - given
    };
  }, [records]);

  const filteredRecords = useMemo(() => {
    let result = records;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(r => 
        (r.personName || '').toLowerCase().includes(lower) || 
        (r.notes || '').toLowerCase().includes(lower)
      );
    }
    if (filterDirection !== 'all') {
      result = result.filter(r => r.direction === filterDirection);
    }
    if (filterType !== 'all') {
      result = result.filter(r => r.eventType === filterType);
    }
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, searchTerm, filterDirection, filterType]);

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xoá ghi chép này?')) {
      saveConfig(records.filter(r => r.id !== id));
    }
  };

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const openModal = (direction: 'give' | 'receive', record?: GiftRecord) => {
    setModalDirection(direction);
    setEditingRecord(record || null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amountStr = formData.get('amount') as string;
    const amount = Number(amountStr.replace(/[^0-9]/g, ''));

    const recordData: GiftRecord = {
      id: editingRecord?.id || crypto.randomUUID(),
      direction: modalDirection,
      personName: formData.get('personName') as string,
      eventType: formData.get('eventType') as any,
      amount: amount,
      date: formData.get('date') as string,
      notes: formData.get('notes') as string,
    };

    if (editingRecord) {
      saveConfig(records.map(r => r.id === editingRecord.id ? recordData : r));
    } else {
      saveConfig([...records, recordData]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-family-text font-serif">Sổ Ân Tình (Hiếu Hỷ)</h1>
            <HelpTooltip text="Công cụ ghi chép lại các khoản tiền/quà mừng cưới, thôi nôi, đám hiếu, tân gia... (Đi và Nhận). Giúp gia đình dễ dàng tra cứu lại sau này để 'trả lễ' cho phù hợp với văn hoá. Dữ liệu này hoàn toàn độc lập và không cộng trừ vào dòng tiền hay ngân sách chính." />
          </div>
          <p className="text-sm text-family-textMuted mt-1">
            Ghi chép và theo dõi các khoản "có qua có lại" trong quan hệ xã hội
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button 
            onClick={() => openModal('give')}
            className="flex-1 md:flex-none bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20"
          >
            <ArrowUpRight className="w-4 h-4 mr-1.5" />
            Ghi Khoản Đi
          </Button>
          <Button 
            onClick={() => openModal('receive')}
            className="flex-1 md:flex-none bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20"
          >
            <ArrowDownLeft className="w-4 h-4 mr-1.5" />
            Ghi Khoản Nhận
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-rose-500/5 to-transparent border-rose-500/20">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-family-textMuted">Tổng khoản Đi (Mừng/Viếng)</p>
              <p className="text-2xl font-bold text-rose-500">{formatVND(totalGiven)}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-500/5 to-transparent border-emerald-500/20">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-family-textMuted">Tổng khoản Nhận</p>
              <p className="text-2xl font-bold text-emerald-500">{formatVND(totalReceived)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-family-bgDark/40">
          <CardContent className="p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${netBalance >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-family-textMuted">Chênh lệch (Nhận - Đi)</p>
              <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {netBalance > 0 ? '+' : ''}{formatVND(netBalance)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-family-textMuted" />
          <input 
            type="text"
            placeholder="Tìm theo tên người, ghi chú..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-family-text placeholder:text-family-textMuted focus:outline-none focus:border-family-accent/50 transition-colors"
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <select 
            value={filterDirection}
            onChange={e => setFilterDirection(e.target.value as any)}
            className="bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-3 py-2.5 text-sm text-family-text focus:outline-none focus:border-family-accent/50 cursor-pointer shrink-0"
          >
            <option value="all">Tất cả giao dịch</option>
            <option value="give">Chỉ Khoản Đi</option>
            <option value="receive">Chỉ Khoản Nhận</option>
          </select>

          <select 
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-3 py-2.5 text-sm text-family-text focus:outline-none focus:border-family-accent/50 cursor-pointer shrink-0"
          >
            <option value="all">Tất cả sự kiện</option>
            {Object.entries(EVENT_TYPES).map(([key, cat]) => (
              <option key={key} value={key}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <EmptyState 
          icon={<Gift className="w-8 h-8 text-family-accent/50" />}
          title="Sổ Hiếu hỷ trống"
          description={searchTerm || filterType !== 'all' || filterDirection !== 'all' ? "Không tìm thấy ghi chép phù hợp." : "Chưa có ghi chép nào. Bắt đầu ghi lại các khoản 'có qua có lại' để dễ dàng tra cứu sau này."}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords.map(record => {
            const typeDef = EVENT_TYPES[record.eventType as keyof typeof EVENT_TYPES] || EVENT_TYPES.other;
            const isGive = record.direction === 'give';

            return (
              <Card key={record.id} className="group hover:border-family-accent/40 transition-all">
                <CardContent className="p-5 flex flex-col gap-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${typeDef.bg} ${typeDef.color}`}>
                        {React.createElement(typeDef.icon, { className: "w-5 h-5" })}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-family-text truncate" title={record.personName}>
                          {record.personName}
                        </h3>
                        <p className="text-xs text-family-textMuted flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(record.date).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => openModal(record.direction, record)} className="p-1.5 text-family-textMuted hover:text-family-accent hover:bg-family-accent/10 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(record.id)} className="p-1.5 text-family-textMuted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <span className="text-xs font-medium text-family-textMuted bg-family-bgDark/40 px-2.5 py-1 rounded-md">
                      {typeDef.label}
                    </span>
                    <div className={`flex items-center gap-1.5 font-bold ${isGive ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {isGive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                      {formatVND(record.amount)}
                    </div>
                  </div>
                  
                  {record.notes && (
                    <p className="text-sm text-family-textMuted italic bg-family-bgDark/20 p-2.5 rounded-lg">
                      "{record.notes}"
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-family-bg border border-family-accent/20 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className={`p-4 border-b flex justify-between items-center ${modalDirection === 'give' ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
              <div className="flex items-center gap-2">
                {modalDirection === 'give' ? <ArrowUpRight className="w-5 h-5 text-rose-500" /> : <ArrowDownLeft className="w-5 h-5 text-emerald-500" />}
                <h2 className="text-lg font-bold text-family-text">
                  {editingRecord 
                    ? `Sửa Khoản ${modalDirection === 'give' ? 'Đi' : 'Nhận'}` 
                    : `Ghi Khoản ${modalDirection === 'give' ? 'Đi' : 'Nhận'} Mới`}
                </h2>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-family-textMuted hover:text-family-text hover:bg-white/10 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Người / Gia đình *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-family-textMuted" />
                  <input 
                    required
                    name="personName"
                    defaultValue={editingRecord?.personName}
                    placeholder="VD: Anh Tùng bạn đại học, Cô Ba nhà ngoại..."
                    className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-family-text focus:outline-none focus:border-family-accent/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Số tiền (VNĐ) *</label>
                  <input 
                    required
                    name="amount"
                    type="text"
                    defaultValue={editingRecord ? new Intl.NumberFormat('vi-VN').format(editingRecord.amount) : ''}
                    placeholder="VD: 500.000"
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      if (val) {
                        e.target.value = new Intl.NumberFormat('vi-VN').format(Number(val));
                      }
                    }}
                    className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-4 py-2.5 text-sm font-mono text-family-text focus:outline-none focus:border-family-accent/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Ngày tháng *</label>
                  <input 
                    required
                    type="date"
                    name="date"
                    defaultValue={editingRecord?.date || new Date().toISOString().split('T')[0]}
                    className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-4 py-2.5 text-sm text-family-text focus:outline-none focus:border-family-accent/50"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Loại sự kiện *</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(EVENT_TYPES).map(([key, cat]) => (
                    <label key={key} className="flex items-center gap-2 p-2.5 rounded-xl border border-family-accent/10 bg-family-bgDark/30 cursor-pointer hover:bg-family-accent/5 transition-colors">
                      <input 
                        type="radio" 
                        name="eventType" 
                        value={key} 
                        defaultChecked={editingRecord ? editingRecord.eventType === key : key === 'wedding'}
                        className="text-family-accent focus:ring-family-accent bg-family-bgDark"
                      />
                      <div className="flex items-center gap-1.5 text-sm text-family-text">
                        {React.createElement(cat.icon, { className: `w-4 h-4 ${cat.color}` })}
                        {cat.label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Ghi chú thêm</label>
                <textarea 
                  name="notes"
                  defaultValue={editingRecord?.notes}
                  placeholder="Ghi chú thêm về món quà (VD: 1 chỉ vàng SJC, hay đi cùng nhóm bạn đại học...)"
                  rows={2}
                  className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-4 py-2.5 text-sm text-family-text focus:outline-none focus:border-family-accent/50 resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-family-accent/10">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
                <Button type="submit" className={modalDirection === 'give' ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}>
                  Lưu Ghi Chép
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
