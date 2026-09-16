import React, { useState, useMemo } from 'react';
import { useAppState } from '../hooks/useAppState';
import { 
  Contact, Plus, Search, PhoneCall,
  Edit2, Trash2, X, AlertTriangle, 
  Wrench, GraduationCap, Stethoscope, Box, Copy, CheckCircle2
} from 'lucide-react';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';

export interface ContactItem {
  id: string;
  name: string;
  category: 'maintenance' | 'emergency' | 'education' | 'health' | 'other';
  phoneNumber: string;
  notes: string;
}

const CATEGORIES = {
  emergency: { label: 'Khẩn cấp (Cứu hoả, Công an...)', icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  maintenance: { label: 'Sửa chữa (Điện, Nước, Khoá...)', icon: Wrench, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  education: { label: 'Giáo dục (Cô giáo, Đưa rước...)', icon: GraduationCap, color: 'text-sky-500', bg: 'bg-sky-500/10' },
  health: { label: 'Y tế (Bác sĩ, Phòng khám...)', icon: Stethoscope, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  other: { label: 'Dịch vụ khác', icon: Box, color: 'text-gray-500', bg: 'bg-gray-500/10' },
};

export const FamilyContacts: React.FC = () => {
  const { state, updateToolConfig } = useAppState();
  
  const config = state.toolConfigs?.familyContacts || { items: [] };
  const items: ContactItem[] = config.items || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContactItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const saveConfig = (newItems: ContactItem[]) => {
    updateToolConfig('familyContacts', { items: newItems });
  };

  const filteredItems = useMemo(() => {
    let result = items;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(r => 
        (r.name || '').toLowerCase().includes(lower) || 
        (r.phoneNumber || '').toLowerCase().includes(lower) ||
        (r.notes || '').toLowerCase().includes(lower)
      );
    }
    if (filterCategory !== 'all') {
      result = result.filter(r => r.category === filterCategory);
    }
    // Sắp xếp: Khẩn cấp lên đầu, rồi theo tên
    return result.sort((a, b) => {
      if (a.category === 'emergency' && b.category !== 'emergency') return -1;
      if (b.category === 'emergency' && a.category !== 'emergency') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [items, searchTerm, filterCategory]);

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xoá liên hệ này?')) {
      saveConfig(items.filter(r => r.id !== id));
    }
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const itemData: ContactItem = {
      id: editingItem?.id || crypto.randomUUID(),
      name: formData.get('name') as string,
      category: formData.get('category') as any,
      phoneNumber: formData.get('phoneNumber') as string,
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

  const handleCopy = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-family-text font-serif">Danh Bạ Bỏ Túi</h1>
            <HelpTooltip text="Lưu trữ các số điện thoại quan trọng (Thợ sửa điện nước, bảo vệ chung cư, bác sĩ gia đình...) để vợ/chồng đều có thể nhanh chóng tra cứu khi cần, đặc biệt trong các tình huống khẩn cấp." />
          </div>
          <p className="text-sm text-family-textMuted mt-1">
            Số điện thoại thợ thầy, bác sĩ quen, cô giáo... khi cần là có ngay
          </p>
        </div>
        <Button 
          onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
          className="bg-cyan-600 text-white hover:bg-cyan-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm Liên Hệ
        </Button>
      </div>

      <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-family-textMuted" />
          <input 
            type="text"
            placeholder="Tìm theo tên người, số điện thoại, ghi chú..."
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
          icon={<Contact className="w-8 h-8 text-family-accent/50" />}
          title="Danh bạ trống"
          description={searchTerm || filterCategory !== 'all' ? "Không tìm thấy liên hệ phù hợp." : "Hãy thêm các số điện thoại dịch vụ (sửa điện, nước, bác sĩ...) để cả nhà cùng dùng."}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => {
            const typeDef = CATEGORIES[item.category as keyof typeof CATEGORIES] || CATEGORIES.other;
            const isEmergency = item.category === 'emergency';

            return (
              <Card key={item.id} className={`group hover:border-cyan-500/40 transition-all ${isEmergency ? 'border-rose-500/30 bg-rose-500/5' : 'border-white/5'}`}>
                <CardContent className="p-5 flex flex-col gap-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${typeDef.bg} ${typeDef.color} ${isEmergency ? 'animate-pulse' : ''}`}>
                        {React.createElement(typeDef.icon, { className: "w-6 h-6" })}
                      </div>
                      <div className="min-w-0">
                        <h3 className={`font-semibold truncate ${isEmergency ? 'text-rose-400' : 'text-family-text'}`}>
                          {item.name}
                        </h3>
                        <p className="text-xs font-medium text-family-textMuted mt-0.5 truncate bg-family-bgDark/40 px-2 py-0.5 rounded inline-block">
                          {typeDef.label.split(' (')[0]}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="p-1.5 text-family-textMuted hover:text-cyan-500 hover:bg-cyan-500/10 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-family-textMuted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex justify-between items-center bg-family-bgDark/40 p-3 rounded-xl border border-white/5">
                      <div className="text-lg font-mono font-bold text-family-text tracking-wide">
                        {item.phoneNumber}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleCopy(item.phoneNumber, item.id)}
                          className={`p-2 rounded-lg transition-colors ${copiedId === item.id ? 'bg-emerald-500/20 text-emerald-500' : 'bg-family-bg hover:bg-white/10 text-family-textMuted'}`}
                          title="Copy số"
                        >
                          {copiedId === item.id ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <a 
                          href={`tel:${item.phoneNumber}`}
                          className={`p-2 rounded-lg transition-colors ${isEmergency ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white'}`}
                          title="Gọi điện"
                        >
                          <PhoneCall className="w-4 h-4" />
                        </a>
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
          <div className="bg-family-bg border border-cyan-500/20 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b bg-cyan-500/10 border-cyan-500/20 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Contact className="w-5 h-5 text-cyan-500" />
                <h2 className="text-lg font-bold text-family-text">
                  {editingItem ? 'Cập nhật Liên hệ' : 'Thêm Liên hệ Mới'}
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
                <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Tên người / Dịch vụ *</label>
                <input 
                  required
                  name="name"
                  defaultValue={editingItem?.name}
                  placeholder="VD: Anh Tuấn sửa điện, Công an phường, Bác sĩ Minh..."
                  className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-4 py-2.5 text-sm text-family-text focus:outline-none focus:border-family-accent/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Số điện thoại *</label>
                <input 
                  required
                  name="phoneNumber"
                  type="tel"
                  defaultValue={editingItem?.phoneNumber}
                  placeholder="VD: 0901234567"
                  className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-4 py-2.5 text-sm font-mono tracking-wider text-family-text focus:outline-none focus:border-family-accent/50"
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
                        defaultChecked={editingItem ? editingItem.category === key : key === 'maintenance'}
                        className="text-cyan-500 focus:ring-cyan-500 bg-family-bgDark"
                      />
                      <div className="flex items-center gap-1.5 text-sm text-family-text truncate">
                        {React.createElement(cat.icon, { className: `w-4 h-4 shrink-0 ${cat.color}` })}
                        <span className="truncate">{cat.label.split(' (')[0]}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Ghi chú thêm</label>
                <textarea 
                  name="notes"
                  defaultValue={editingItem?.notes}
                  placeholder="Khu vực hoạt động, chuyên môn, hay giá tham khảo..."
                  rows={2}
                  className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-4 py-2.5 text-sm text-family-text focus:outline-none focus:border-family-accent/50 resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-family-accent/10">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
                <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white">
                  Lưu Liên Hệ
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
