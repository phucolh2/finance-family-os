import React, { useState, useMemo } from 'react';
import { useAppState } from '../hooks/useAppState';
import { 
  Repeat, Plus, Search, 
  Calendar, Edit2, Trash2, X,
  MonitorPlay, Zap, Laptop, Dumbbell, Box, AlertCircle
} from 'lucide-react';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';

export interface SubscriptionItem {
  id: string;
  name: string;
  category: 'entertainment' | 'utility' | 'software' | 'fitness' | 'other';
  price: number; // Plain VND
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: string;
  owner: string; // Vợ / Chồng / Gia đình
  notes: string;
}

const CATEGORIES = {
  entertainment: { label: 'Giải trí (Netflix, Spotify...)', icon: MonitorPlay, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  utility: { label: 'Tiện ích (Điện, Nước, Internet)', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  software: { label: 'Phần mềm (iCloud, Office...)', icon: Laptop, color: 'text-sky-500', bg: 'bg-sky-500/10' },
  fitness: { label: 'Sức khoẻ (Gym, Yoga)', icon: Dumbbell, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  other: { label: 'Khác', icon: Box, color: 'text-gray-500', bg: 'bg-gray-500/10' },
};

export const SubscriptionTracker: React.FC = () => {
  const { state, updateToolConfig } = useAppState();
  
  const config = state.toolConfigs?.subscriptionTracker || { items: [] };
  const items: SubscriptionItem[] = config.items || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SubscriptionItem | null>(null);

  const saveConfig = (newItems: SubscriptionItem[]) => {
    updateToolConfig('subscriptionTracker', { items: newItems });
  };

  const { totalMonthlyCost, totalYearlyCost } = useMemo(() => {
    let monthly = 0;
    let yearly = 0;
    items.forEach(item => {
      if (item.billingCycle === 'monthly') {
        monthly += item.price;
        yearly += item.price * 12;
      } else {
        monthly += item.price / 12;
        yearly += item.price;
      }
    });
    return { totalMonthlyCost: monthly, totalYearlyCost: yearly };
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = items;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(r => 
        (r.name || '').toLowerCase().includes(lower) || 
        (r.owner || '').toLowerCase().includes(lower) ||
        (r.notes || '').toLowerCase().includes(lower)
      );
    }
    if (filterCategory !== 'all') {
      result = result.filter(r => r.category === filterCategory);
    }
    return result.sort((a, b) => new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime());
  }, [items, searchTerm, filterCategory]);

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xoá thuê bao này?')) {
      saveConfig(items.filter(r => r.id !== id));
    }
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amountStr = formData.get('price') as string;
    const price = amountStr ? Number(amountStr.replace(/[^0-9]/g, '')) : 0;

    let nextDate = formData.get('nextBillingDate') as string;
    
    // Auto increment if in past
    if (editingItem && new Date(nextDate) < new Date()) {
       const cycle = formData.get('billingCycle') as string;
       const d = new Date(nextDate);
       if (cycle === 'monthly') d.setMonth(d.getMonth() + 1);
       else d.setFullYear(d.getFullYear() + 1);
       nextDate = d.toISOString().split('T')[0];
    }

    const itemData: SubscriptionItem = {
      id: editingItem?.id || crypto.randomUUID(),
      name: formData.get('name') as string,
      category: formData.get('category') as any,
      price: price,
      billingCycle: formData.get('billingCycle') as any,
      nextBillingDate: nextDate,
      owner: formData.get('owner') as string,
      notes: formData.get('notes') as string,
    };

    if (editingItem) {
      saveConfig(items.map(r => r.id === editingItem.id ? itemData : r));
    } else {
      saveConfig([...items, itemData]);
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const checkStatus = (dateStr: string) => {
    const nextDate = new Date(dateStr);
    const now = new Date();
    now.setHours(0,0,0,0);
    const daysLeft = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    return {
      daysLeft,
      isDueSoon: daysLeft >= 0 && daysLeft <= 7,
      isOverdue: daysLeft < 0
    };
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-family-text font-serif">Quản lý Thuê bao</h1>
            <HelpTooltip text="Công cụ giúp bạn quản lý các dịch vụ trả phí định kỳ như Netflix, iCloud, tiền Điện Nước... để dễ dàng theo dõi và hủy nếu không cần dùng tới. Công cụ này chỉ mang tính nhắc nhở, KHÔNG tự động trừ tiền trong dòng tiền chính của Family OS." />
          </div>
          <p className="text-sm text-family-textMuted mt-1">
            Theo dõi chi phí định kỳ và nhắc lịch gia hạn các dịch vụ
          </p>
        </div>
        <Button 
          onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
          className="bg-violet-600 text-white hover:bg-violet-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm Thuê Bao
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-violet-500/5 to-transparent border-violet-500/20">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-500">
              <Repeat className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-family-textMuted">Trung bình Hàng tháng</p>
              <p className="text-2xl font-bold text-violet-400">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalMonthlyCost)}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-family-bgDark/40">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-family-textMuted">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-family-textMuted">Quy đổi Hàng năm</p>
              <p className="text-2xl font-bold text-family-text">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalYearlyCost)}
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
            placeholder="Tìm theo tên dịch vụ, ghi chú..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-family-text placeholder:text-family-textMuted focus:outline-none focus:border-family-accent/50 transition-colors"
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <select 
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-3 py-2.5 text-sm text-family-text focus:outline-none focus:border-family-accent/50 cursor-pointer shrink-0"
          >
            <option value="all">Tất cả nhóm</option>
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <option key={key} value={key}>{cat.label.split(' (')[0]}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState 
          icon={<Repeat className="w-8 h-8 text-family-accent/50" />}
          title="Chưa có thuê bao nào"
          description={searchTerm || filterCategory !== 'all' ? "Không tìm thấy thuê bao phù hợp." : "Hãy thêm các dịch vụ trả phí định kỳ của gia đình (Netflix, Điện, Nước...) để bắt đầu theo dõi."}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => {
            const typeDef = CATEGORIES[item.category as keyof typeof CATEGORIES] || CATEGORIES.other;
            const status = checkStatus(item.nextBillingDate);

            return (
              <Card key={item.id} className="group hover:border-violet-500/40 transition-all border-white/5">
                <CardContent className="p-5 flex flex-col gap-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${typeDef.bg} ${typeDef.color}`}>
                        {React.createElement(typeDef.icon, { className: "w-6 h-6" })}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-family-text flex items-center gap-2">
                          <span className="truncate">{item.name}</span>
                        </h3>
                        <p className="text-xs text-family-textMuted mt-0.5 truncate">
                          Người trả: {item.owner}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="p-1.5 text-family-textMuted hover:text-violet-500 hover:bg-violet-500/10 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-family-textMuted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex justify-between items-center bg-family-bgDark/40 p-3 rounded-xl border border-white/5">
                      <div className="flex flex-col">
                        <span className="text-lg font-bold text-family-text">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                        </span>
                        <span className="text-xs font-medium text-family-textMuted">
                          / {item.billingCycle === 'monthly' ? 'Tháng' : 'Năm'}
                        </span>
                      </div>
                      <div className={`flex flex-col items-end text-xs font-semibold ${status.isOverdue ? 'text-rose-500' : status.isDueSoon ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {status.isOverdue ? (
                          <div className="flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Đã quá hạn</div>
                        ) : status.isDueSoon ? (
                          <div className="flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Còn {status.daysLeft} ngày</div>
                        ) : (
                          <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Còn {status.daysLeft} ngày</div>
                        )}
                        <span className="text-family-textMuted mt-0.5 font-normal">Gia hạn: {new Date(item.nextBillingDate).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                  </div>
                  
                  {item.notes && (
                    <p className="text-sm text-family-textMuted italic leading-relaxed line-clamp-2">
                      {item.notes}
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
          <div className="bg-family-bg border border-violet-500/20 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b bg-violet-500/10 border-violet-500/20 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Repeat className="w-5 h-5 text-violet-500" />
                <h2 className="text-lg font-bold text-family-text">
                  {editingItem ? 'Cập nhật Thuê bao' : 'Thêm Thuê bao Mới'}
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
                <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Tên dịch vụ *</label>
                <input 
                  required
                  name="name"
                  defaultValue={editingItem?.name}
                  placeholder="VD: Netflix Premium, Tiền điện, Internet VNPT..."
                  className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-4 py-2.5 text-sm text-family-text focus:outline-none focus:border-family-accent/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Phân loại *</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(CATEGORIES).map(([key, cat]) => (
                    <label key={key} className="flex items-center gap-2 p-2.5 rounded-xl border border-family-accent/10 bg-family-bgDark/30 cursor-pointer hover:bg-family-accent/5 transition-colors">
                      <input 
                        type="radio" 
                        name="category" 
                        value={key} 
                        defaultChecked={editingItem ? editingItem.category === key : key === 'entertainment'}
                        className="text-violet-500 focus:ring-violet-500 bg-family-bgDark"
                      />
                      <div className="flex items-center gap-1.5 text-sm text-family-text truncate">
                        {React.createElement(cat.icon, { className: `w-4 h-4 shrink-0 ${cat.color}` })}
                        <span className="truncate">{cat.label.split(' (')[0]}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Số tiền *</label>
                  <input 
                    required
                    name="price"
                    type="text"
                    defaultValue={editingItem?.price ? new Intl.NumberFormat('vi-VN').format(editingItem.price) : ''}
                    placeholder="VD: 260.000"
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
                  <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Chu kỳ thanh toán *</label>
                  <select 
                    name="billingCycle"
                    defaultValue={editingItem?.billingCycle || 'monthly'}
                    className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-4 py-2.5 text-sm text-family-text focus:outline-none focus:border-family-accent/50"
                  >
                    <option value="monthly">Hàng tháng</option>
                    <option value="yearly">Hàng năm</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                <div>
                  <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Người thanh toán *</label>
                  <input 
                    required
                    type="text"
                    name="owner"
                    defaultValue={editingItem?.owner}
                    placeholder="VD: Vợ, Chồng, Gia đình..."
                    className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-4 py-2.5 text-sm text-family-text focus:outline-none focus:border-family-accent/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Ngày gia hạn tiếp theo *</label>
                  <input 
                    required
                    type="date"
                    name="nextBillingDate"
                    defaultValue={editingItem?.nextBillingDate || new Date().toISOString().split('T')[0]}
                    className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-4 py-2.5 text-sm text-family-text focus:outline-none focus:border-family-accent/50"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Ghi chú (Tài khoản, Cách huỷ...)</label>
                <textarea 
                  name="notes"
                  defaultValue={editingItem?.notes}
                  placeholder="Ghi lại tài khoản đăng nhập hoặc mã khách hàng để tiện thanh toán..."
                  rows={2}
                  className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-4 py-2.5 text-sm text-family-text focus:outline-none focus:border-family-accent/50 resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-family-accent/10">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
                <Button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white">
                  Lưu Thuê Bao
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
