import React, { useState, useMemo } from 'react';
import { useAppState } from '../hooks/useAppState';
import { 
  Wrench, Plus, Search, 
  Calendar, Edit2, Trash2, X,
  Tv, Car, Refrigerator, Armchair, Box, ShieldCheck, ShieldAlert
} from 'lucide-react';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';

export interface InventoryItem {
  id: string;
  name: string;
  category: 'appliance' | 'vehicle' | 'electronics' | 'furniture' | 'other';
  purchaseDate: string;
  price?: number; // Plain VND
  warrantyMonths?: number;
  lastMaintenanceDate?: string;
  maintenanceCycleMonths?: number;
  notes: string;
}

const CATEGORIES = {
  appliance: { label: 'Gia dụng (Tủ lạnh, Máy giặt...)', icon: Refrigerator, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  vehicle: { label: 'Phương tiện (Ô tô, Xe máy...)', icon: Car, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  electronics: { label: 'Điện tử (TV, Laptop, Điện thoại...)', icon: Tv, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  furniture: { label: 'Nội thất (Sofa, Giường, Tủ...)', icon: Armchair, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  other: { label: 'Khác', icon: Box, color: 'text-gray-500', bg: 'bg-gray-500/10' },
};

export const HomeInventory: React.FC = () => {
  const { state, updateToolConfig } = useAppState();
  
  const config = state.toolConfigs?.homeInventory || { items: [] };
  const items: InventoryItem[] = config.items || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const saveConfig = (newItems: InventoryItem[]) => {
    updateToolConfig('homeInventory', { items: newItems });
  };

  const filteredItems = useMemo(() => {
    let result = items;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(r => 
        (r.name || '').toLowerCase().includes(lower) || 
        (r.notes || '').toLowerCase().includes(lower)
      );
    }
    if (filterCategory !== 'all') {
      result = result.filter(r => r.category === filterCategory);
    }
    return result.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
  }, [items, searchTerm, filterCategory]);

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xoá thiết bị này khỏi danh sách?')) {
      saveConfig(items.filter(r => r.id !== id));
    }
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amountStr = formData.get('price') as string;
    const price = amountStr ? Number(amountStr.replace(/[^0-9]/g, '')) : undefined;

    const itemData: InventoryItem = {
      id: editingItem?.id || crypto.randomUUID(),
      name: formData.get('name') as string,
      category: formData.get('category') as any,
      purchaseDate: formData.get('purchaseDate') as string,
      price: price,
      warrantyMonths: Number(formData.get('warrantyMonths')) || undefined,
      lastMaintenanceDate: formData.get('lastMaintenanceDate') as string || undefined,
      maintenanceCycleMonths: Number(formData.get('maintenanceCycleMonths')) || undefined,
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

  const checkWarrantyStatus = (item: InventoryItem) => {
    if (!item.warrantyMonths || !item.purchaseDate) return null;
    const purchase = new Date(item.purchaseDate);
    const expiry = new Date(purchase.setMonth(purchase.getMonth() + item.warrantyMonths));
    const now = new Date();
    const isExpired = now > expiry;
    return {
      isExpired,
      dateStr: expiry.toLocaleDateString('vi-VN'),
      daysLeft: Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24))
    };
  };

  const checkMaintenanceStatus = (item: InventoryItem) => {
    if (!item.maintenanceCycleMonths) return null;
    const lastDate = item.lastMaintenanceDate ? new Date(item.lastMaintenanceDate) : new Date(item.purchaseDate);
    const nextDate = new Date(lastDate.setMonth(lastDate.getMonth() + item.maintenanceCycleMonths));
    const now = new Date();
    const isOverdue = now > nextDate;
    return {
      isOverdue,
      dateStr: nextDate.toLocaleDateString('vi-VN'),
      daysLeft: Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 3600 * 24))
    };
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-family-text font-serif">Đồ Đạc Trong Nhà</h1>
            <HelpTooltip text="Quản lý vòng đời các tài sản/thiết bị quan trọng trong nhà (Tủ lạnh, Xe máy, Smart TV...). Công cụ giúp bạn theo dõi thời gian bảo hành còn lại và nhắc nhở lịch bảo dưỡng định kỳ, hoàn toàn không can thiệp vào dòng tiền hay ngân sách cốt lõi của gia đình." />
          </div>
          <p className="text-sm text-family-textMuted mt-1">
            Ghi nhớ lịch bảo dưỡng, thời hạn bảo hành để đồ đạc luôn bền đẹp
          </p>
        </div>
        <Button 
          onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
          className="bg-orange-600 text-white hover:bg-orange-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm Thiết Bị
        </Button>
      </div>

      <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-family-textMuted" />
          <input 
            type="text"
            placeholder="Tìm theo tên thiết bị, ghi chú..."
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
          icon={<Wrench className="w-8 h-8 text-family-accent/50" />}
          title="Chưa có thiết bị nào"
          description={searchTerm || filterCategory !== 'all' ? "Không tìm thấy thiết bị phù hợp." : "Bắt đầu thêm các tài sản, thiết bị điện máy, xe cộ để quản lý bảo hành và bảo dưỡng định kỳ."}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => {
            const typeDef = CATEGORIES[item.category as keyof typeof CATEGORIES] || CATEGORIES.other;
            const warranty = checkWarrantyStatus(item);
            const maintenance = checkMaintenanceStatus(item);

            return (
              <Card key={item.id} className="group hover:border-orange-500/40 transition-all border-white/5 relative overflow-hidden">
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
                        <p className="text-xs text-family-textMuted flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          Mua: {new Date(item.purchaseDate).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="p-1.5 text-family-textMuted hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-family-textMuted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-2">
                    {item.price && (
                      <div className="text-sm font-medium text-family-text">
                        Giá mua: <span className="font-mono text-family-textLight">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}</span>
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-2 bg-family-bgDark/40 p-3 rounded-xl border border-white/5">
                      {warranty ? (
                        <div className={`flex items-center gap-2 text-xs font-semibold ${warranty.isExpired ? 'text-red-400' : 'text-emerald-400'}`}>
                          {warranty.isExpired ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                          Bảo hành: {warranty.isExpired ? 'Đã hết hạn' : `Còn ${warranty.daysLeft} ngày (Đến ${warranty.dateStr})`}
                        </div>
                      ) : (
                        <div className="text-xs text-family-textMuted">Không theo dõi bảo hành</div>
                      )}

                      {item.maintenanceCycleMonths && maintenance ? (
                        <div className={`flex items-center gap-2 text-xs font-semibold ${maintenance.isOverdue ? 'text-orange-500' : 'text-sky-400'}`}>
                          <Wrench className="w-4 h-4" />
                          Bảo dưỡng: {maintenance.isOverdue ? 'Đã quá hạn!' : `Sắp tới: ${maintenance.dateStr}`}
                        </div>
                      ) : null}
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
          <div className="bg-family-bg border border-orange-500/20 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b bg-orange-500/10 border-orange-500/20 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-bold text-family-text">
                  {editingItem ? 'Cập nhật Thiết bị' : 'Thêm Thiết bị Mới'}
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
                <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Tên thiết bị *</label>
                <input 
                  required
                  name="name"
                  defaultValue={editingItem?.name}
                  placeholder="VD: Smart TV Sony 65 inch, Honda Vision, Điều hoà Daikin..."
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
                        defaultChecked={editingItem ? editingItem.category === key : key === 'appliance'}
                        className="text-orange-500 focus:ring-orange-500 bg-family-bgDark"
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
                  <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Giá mua (Tham khảo)</label>
                  <input 
                    name="price"
                    type="text"
                    defaultValue={editingItem?.price ? new Intl.NumberFormat('vi-VN').format(editingItem.price) : ''}
                    placeholder="VD: 15.000.000"
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
                  <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Ngày mua *</label>
                  <input 
                    required
                    type="date"
                    name="purchaseDate"
                    defaultValue={editingItem?.purchaseDate || new Date().toISOString().split('T')[0]}
                    className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-4 py-2.5 text-sm text-family-text focus:outline-none focus:border-family-accent/50"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                <div>
                  <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Bảo hành (Số tháng)</label>
                  <input 
                    type="number"
                    name="warrantyMonths"
                    defaultValue={editingItem?.warrantyMonths}
                    placeholder="VD: 12, 24..."
                    className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-4 py-2.5 text-sm text-family-text focus:outline-none focus:border-family-accent/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                <div>
                  <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Chu kỳ bảo dưỡng (Tháng)</label>
                  <input 
                    type="number"
                    name="maintenanceCycleMonths"
                    defaultValue={editingItem?.maintenanceCycleMonths}
                    placeholder="VD: 6 (Rửa máy lạnh định kỳ)"
                    className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-4 py-2.5 text-sm text-family-text focus:outline-none focus:border-family-accent/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Lần bảo dưỡng gần nhất</label>
                  <input 
                    type="date"
                    name="lastMaintenanceDate"
                    defaultValue={editingItem?.lastMaintenanceDate}
                    className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-4 py-2.5 text-sm text-family-text focus:outline-none focus:border-family-accent/50"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Ghi chú thêm</label>
                <textarea 
                  name="notes"
                  defaultValue={editingItem?.notes}
                  placeholder="Thông tin nơi mua, hotline hỗ trợ, hoặc ghi chú về lần bảo dưỡng trước..."
                  rows={2}
                  className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-4 py-2.5 text-sm text-family-text focus:outline-none focus:border-family-accent/50 resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-family-accent/10">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white">
                  Lưu Thiết Bị
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
