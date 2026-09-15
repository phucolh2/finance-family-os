import React, { useState, useMemo } from 'react';
import { useAppState } from '../hooks/useAppState';
import { 
  FolderOpen, Plus, Search, AlertCircle, CheckCircle2, 
  Clock, MapPin, Edit2, Trash2, X, IdCard, Home, FileSignature, 
  HeartPulse, GraduationCap, Car, FileText, User
} from 'lucide-react';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';

export interface DocumentItem {
  id: string;
  name: string;
  category: 'identity' | 'property' | 'contract' | 'medical' | 'education' | 'vehicle' | 'other';
  owner: string;
  documentNumber: string;
  issueDate: string;
  expiryDate: string;
  storageLocation: string;
  notes: string;
}

const CATEGORIES = {
  identity: { label: 'Tuỳ thân', icon: IdCard, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  property: { label: 'Tài sản', icon: Home, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  vehicle: { label: 'Xe cộ', icon: Car, color: 'text-teal-500', bg: 'bg-teal-500/10' },
  contract: { label: 'Hợp đồng', icon: FileSignature, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  medical: { label: 'Y tế', icon: HeartPulse, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  education: { label: 'Giáo dục', icon: GraduationCap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  other: { label: 'Khác', icon: FileText, color: 'text-slate-500', bg: 'bg-slate-500/10' },
};

const COMMON_LOCATIONS = [
  'Két sắt phòng ngủ',
  'Ngăn kéo bàn làm việc',
  'Túi hồ sơ A',
  'Túi hồ sơ B',
  'Trong ví chồng',
  'Trong ví vợ',
];

export const DocumentVault: React.FC = () => {
  const { state, updateToolConfig } = useAppState();
  
  const config = state.toolConfigs?.documentVault || { documents: [] };
  const documents: DocumentItem[] = config.documents || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterOwner, setFilterOwner] = useState<string>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);

  const ownersList = useMemo(() => {
    return [
      state.profile?.husbandName,
      state.profile?.wifeName,
      'Con cái',
      'Chung gia đình'
    ].filter(Boolean);
  }, [state.profile]);

  const saveConfig = (newDocs: DocumentItem[]) => {
    updateToolConfig('documentVault', { documents: newDocs });
  };

  const getExpiryStatus = (expiryDate: string) => {
    if (!expiryDate) return { status: 'none', label: 'Không thời hạn', color: 'text-slate-500', bg: 'bg-slate-500/10', icon: CheckCircle2 };
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const diffTime = expiry.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      return { status: 'expired', label: 'Đã hết hạn', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20', icon: AlertCircle, days: daysRemaining };
    }
    if (daysRemaining <= 30) {
      return { status: 'warning', label: `Hết hạn sau ${daysRemaining} ngày`, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20', icon: Clock, days: daysRemaining };
    }
    return { status: 'valid', label: `Còn ${daysRemaining} ngày`, color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2, days: daysRemaining };
  };

  const filteredDocs = useMemo(() => {
    let result = documents;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(d => 
        (d.name || '').toLowerCase().includes(lower) || 
        (d.documentNumber || '').toLowerCase().includes(lower) ||
        (d.notes || '').toLowerCase().includes(lower)
      );
    }
    if (filterCategory !== 'all') {
      result = result.filter(d => d.category === filterCategory);
    }
    if (filterOwner !== 'all') {
      result = result.filter(d => d.owner === filterOwner);
    }

    return result.sort((a, b) => {
      const statusA = getExpiryStatus(a.expiryDate);
      const statusB = getExpiryStatus(b.expiryDate);
      
      const rank: Record<string, number> = { 'expired': 0, 'warning': 1, 'valid': 2, 'none': 3 };
      if (rank[statusA.status] !== rank[statusB.status]) {
        return rank[statusA.status] - rank[statusB.status];
      }
      
      if (statusA.days !== undefined && statusB.days !== undefined) {
        return statusA.days - statusB.days;
      }
      return 0;
    });
  }, [documents, searchTerm, filterCategory, filterOwner]);

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xoá giấy tờ này?')) {
      saveConfig(documents.filter(d => d.id !== id));
    }
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const docData: DocumentItem = {
      id: editingDoc?.id || crypto.randomUUID(),
      name: formData.get('name') as string,
      category: formData.get('category') as any,
      owner: formData.get('owner') as string,
      documentNumber: formData.get('documentNumber') as string,
      issueDate: formData.get('issueDate') as string,
      expiryDate: formData.get('expiryDate') as string,
      storageLocation: formData.get('storageLocation') as string,
      notes: formData.get('notes') as string,
    };

    if (editingDoc) {
      saveConfig(documents.map(d => d.id === editingDoc.id ? docData : d));
    } else {
      saveConfig([...documents, docData]);
    }
    setIsModalOpen(false);
    setEditingDoc(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-family-text font-serif">Kho Giấy tờ Gia đình</h1>
            <HelpTooltip text="Quản lý tập trung các giấy tờ quan trọng của gia đình (CCCD, Sổ đỏ, Hộ chiếu, Khai sinh...). Không lưu trữ file thật để đảm bảo bảo mật, hệ thống chỉ giúp bạn ghi nhớ số hiệu, ngày hết hạn và nơi cất giữ vật lý trong nhà." />
          </div>
          <p className="text-sm text-family-textMuted mt-1">
            Quản lý thông tin và theo dõi thời hạn các giấy tờ quan trọng
          </p>
        </div>
        <Button 
          onClick={() => { setEditingDoc(null); setIsModalOpen(true); }}
          className="bg-family-accent text-white hover:bg-family-accentDark"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm giấy tờ
        </Button>
      </div>

      <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-family-textMuted" />
          <input 
            type="text"
            placeholder="Tìm theo tên, số hiệu..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-family-text placeholder:text-family-textMuted focus:outline-none focus:border-family-accent/50 transition-colors"
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <select 
            value={filterOwner}
            onChange={e => setFilterOwner(e.target.value)}
            className="bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-3 py-2.5 text-sm text-family-text focus:outline-none focus:border-family-accent/50 cursor-pointer shrink-0"
          >
            <option value="all">Tất cả thành viên</option>
            {ownersList.map(o => <option key={o} value={o}>{o}</option>)}
          </select>

          <select 
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-3 py-2.5 text-sm text-family-text focus:outline-none focus:border-family-accent/50 cursor-pointer shrink-0"
          >
            <option value="all">Tất cả danh mục</option>
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <option key={key} value={key}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredDocs.length === 0 ? (
        <EmptyState 
          icon={<FolderOpen className="w-8 h-8 text-family-accent/50" />}
          title="Kho giấy tờ trống"
          description={searchTerm || filterCategory !== 'all' ? "Không tìm thấy giấy tờ phù hợp với điều kiện lọc." : "Chưa có giấy tờ nào được lưu. Hãy thêm giấy tờ đầu tiên của gia đình!"}
        >
          {!(searchTerm || filterCategory !== 'all') && (
            <Button onClick={() => setIsModalOpen(true)} className="mt-4 border-family-accent text-family-accent" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Thêm ngay
            </Button>
          )}
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map(doc => {
            const categoryDef = CATEGORIES[doc.category as keyof typeof CATEGORIES] || CATEGORIES.other;
            const CatIcon = categoryDef.icon;
            const expiry = getExpiryStatus(doc.expiryDate);

            return (
              <Card key={doc.id} className={`group hover:border-family-accent/40 transition-all ${expiry.status === 'expired' ? 'border-red-500/30' : expiry.status === 'warning' ? 'border-amber-500/30' : ''}`}>
                <CardContent className="p-5 flex flex-col gap-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${categoryDef.bg} ${categoryDef.color}`}>
                        <CatIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-family-text truncate" title={doc.name}>{doc.name}</h3>
                        <p className="text-xs text-family-textMuted flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3" />
                          <span className="truncate">{doc.owner}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => { setEditingDoc(doc); setIsModalOpen(true); }} className="p-1.5 text-family-textMuted hover:text-family-accent hover:bg-family-accent/10 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-family-textMuted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {doc.documentNumber && (
                      <div className="col-span-2 bg-family-bgDark/40 rounded-lg p-2.5 border border-white/5">
                        <p className="text-[10px] text-family-textLight uppercase tracking-wider mb-1 font-semibold">Số hiệu</p>
                        <p className="font-mono text-family-text break-all">{doc.documentNumber}</p>
                      </div>
                    )}
                    
                    {doc.storageLocation && (
                      <div className="col-span-2 flex items-center gap-2 text-family-textMuted text-sm bg-family-bgDark/20 p-2 rounded-lg">
                        <MapPin className="w-4 h-4 shrink-0 text-family-accent/70" />
                        <span className="truncate" title={doc.storageLocation}>{doc.storageLocation}</span>
                      </div>
                    )}

                    <div className={`col-span-2 flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg border ${expiry.bg} ${expiry.color}`}>
                      {React.createElement(expiry.icon, { className: "w-4 h-4 shrink-0" })}
                      <span>{expiry.label}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-family-bg border border-family-accent/20 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-family-accent/10 flex justify-between items-center bg-family-bgDark/30">
              <h2 className="text-lg font-bold text-family-text">
                {editingDoc ? 'Cập nhật Giấy tờ' : 'Thêm Giấy tờ mới'}
              </h2>
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
                <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Tên giấy tờ *</label>
                <input 
                  required
                  name="name"
                  defaultValue={editingDoc?.name}
                  placeholder="VD: Căn cước công dân, Sổ đỏ..."
                  className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-4 py-2.5 text-sm text-family-text focus:outline-none focus:border-family-accent/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Phân loại *</label>
                  <select 
                    required
                    name="category"
                    defaultValue={editingDoc?.category || 'identity'}
                    className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-4 py-2.5 text-sm text-family-text focus:outline-none focus:border-family-accent/50"
                  >
                    {Object.entries(CATEGORIES).map(([key, cat]) => (
                      <option key={key} value={key}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Chủ sở hữu *</label>
                  <select 
                    required
                    name="owner"
                    defaultValue={editingDoc?.owner || ownersList[0]}
                    className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-4 py-2.5 text-sm text-family-text focus:outline-none focus:border-family-accent/50"
                  >
                    {ownersList.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Số hiệu / Mã số</label>
                <input 
                  name="documentNumber"
                  defaultValue={editingDoc?.documentNumber}
                  placeholder="VD: 079090123456"
                  className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-4 py-2.5 text-sm font-mono text-family-text focus:outline-none focus:border-family-accent/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Ngày cấp</label>
                  <input 
                    type="date"
                    name="issueDate"
                    defaultValue={editingDoc?.issueDate}
                    className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-4 py-2.5 text-sm text-family-text focus:outline-none focus:border-family-accent/50"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Ngày hết hạn</label>
                  <input 
                    type="date"
                    name="expiryDate"
                    defaultValue={editingDoc?.expiryDate}
                    className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-4 py-2.5 text-sm text-family-text focus:outline-none focus:border-family-accent/50"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Nơi cất giữ vật lý</label>
                <input 
                  name="storageLocation"
                  defaultValue={editingDoc?.storageLocation}
                  placeholder="VD: Két sắt phòng ngủ"
                  list="locations"
                  className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-4 py-2.5 text-sm text-family-text focus:outline-none focus:border-family-accent/50"
                />
                <datalist id="locations">
                  {COMMON_LOCATIONS.map(l => <option key={l} value={l} />)}
                </datalist>
                <p className="text-[10px] text-family-textMuted mt-1.5 ml-1">Giúp bạn và người thân dễ dàng tìm thấy khi cần gấp.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Ghi chú thêm</label>
                <textarea 
                  name="notes"
                  defaultValue={editingDoc?.notes}
                  rows={2}
                  className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-4 py-2.5 text-sm text-family-text focus:outline-none focus:border-family-accent/50 resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-family-accent/10">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
                <Button type="submit" className="bg-family-accent text-white hover:bg-family-accentDark">Lưu giấy tờ</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
