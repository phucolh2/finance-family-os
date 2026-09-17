import React, { useState, useMemo } from 'react';
import { useAppState } from '../hooks/useAppState';
import { 
  Activity, Plus, Search, 
  Calendar, User, Edit2, Trash2, X,
  HeartPulse, Syringe, Stethoscope, Scale, MapPin, ArrowRight
} from 'lucide-react';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

export interface HealthRecord {
  id: string;
  member: string;
  date: string;
  type: 'checkup' | 'vaccine' | 'illness' | 'metric';
  hospitalOrClinic: string;
  diagnosisOrNotes: string;
  cost?: number; // Optional, plain VND
  nextAppointment?: string;
}

const RECORD_TYPES = {
  illness: { label: 'Khám bệnh (Ốm đau)', icon: Stethoscope, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  checkup: { label: 'Khám tổng quát', icon: HeartPulse, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  vaccine: { label: 'Tiêm phòng', icon: Syringe, color: 'text-sky-500', bg: 'bg-sky-500/10' },
  metric: { label: 'Đo chỉ số (Cân nặng, HA...)', icon: Scale, color: 'text-amber-500', bg: 'bg-amber-500/10' },
};

export const HealthTracker: React.FC = () => {
  const { state, updateToolConfig } = useAppState();
  
  const config = state.toolConfigs?.healthTracker || { records: [] };
  const records: HealthRecord[] = config.records || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMember, setFilterMember] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  useBodyScrollLock(isModalOpen);
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);

  const membersList = useMemo(() => {
    return [
      state.profile?.husbandName,
      state.profile?.wifeName,
      'Con cái',
      'Ông bà'
    ].filter(Boolean);
  }, [state.profile]);

  const saveConfig = (newRecords: HealthRecord[]) => {
    updateToolConfig('healthTracker', { records: newRecords });
  };

  const filteredRecords = useMemo(() => {
    let result = records;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(r => 
        (r.hospitalOrClinic || '').toLowerCase().includes(lower) || 
        (r.diagnosisOrNotes || '').toLowerCase().includes(lower)
      );
    }
    if (filterMember !== 'all') {
      result = result.filter(r => r.member === filterMember);
    }
    if (filterType !== 'all') {
      result = result.filter(r => r.type === filterType);
    }
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, searchTerm, filterMember, filterType]);

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xoá hồ sơ này?')) {
      saveConfig(records.filter(r => r.id !== id));
    }
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amountStr = formData.get('cost') as string;
    const cost = amountStr ? Number(amountStr.replace(/[^0-9]/g, '')) : undefined;

    const recordData: HealthRecord = {
      id: editingRecord?.id || crypto.randomUUID(),
      member: formData.get('member') as string,
      type: formData.get('type') as any,
      date: formData.get('date') as string,
      hospitalOrClinic: formData.get('hospitalOrClinic') as string,
      diagnosisOrNotes: formData.get('diagnosisOrNotes') as string,
      cost: cost,
      nextAppointment: formData.get('nextAppointment') as string || undefined,
    };

    if (editingRecord) {
      saveConfig(records.map(r => r.id === editingRecord.id ? recordData : r));
    } else {
      saveConfig([...records, recordData]);
    }
    setIsModalOpen(false);
    setEditingRecord(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-family-text font-serif">Nhật Ký Khỏe Mạnh</h1>
            <HelpTooltip text="Ghi chép và theo dõi lịch sử khám chữa bệnh, tiêm phòng của các thành viên trong gia đình. Giúp bạn nhớ lại liều thuốc, bác sĩ điều trị và lịch hẹn khám lại. Dữ liệu này hoạt động độc lập với ngân sách chính." />
          </div>
          <p className="text-sm text-family-textMuted mt-1">
            Theo dõi tình trạng sức khoẻ, bệnh án và lịch tiêm phòng gia đình
          </p>
        </div>
        <Button 
          onClick={() => { setEditingRecord(null); setIsModalOpen(true); }}
          className="bg-emerald-600 text-white hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm Hồ sơ Mới
        </Button>
      </div>

      <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-family-textMuted" />
          <input 
            type="text"
            placeholder="Tìm theo bệnh viện, triệu chứng, ghi chú..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-family-text placeholder:text-family-textMuted focus:outline-none focus:border-family-accent/50 transition-colors"
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <select 
            value={filterMember}
            onChange={e => setFilterMember(e.target.value)}
            className="bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-3 py-2.5 text-sm text-family-text focus:outline-none focus:border-family-accent/50 cursor-pointer shrink-0"
          >
            <option value="all">Tất cả thành viên</option>
            {membersList.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <select 
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-3 py-2.5 text-sm text-family-text focus:outline-none focus:border-family-accent/50 cursor-pointer shrink-0"
          >
            <option value="all">Tất cả phân loại</option>
            {Object.entries(RECORD_TYPES).map(([key, cat]) => (
              <option key={key} value={key}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <EmptyState 
          icon={<Activity className="w-8 h-8 text-family-accent/50" />}
          title="Chưa có hồ sơ sức khoẻ"
          description={searchTerm || filterType !== 'all' || filterMember !== 'all' ? "Không tìm thấy hồ sơ phù hợp." : "Chưa có ghi chép nào. Bắt đầu ghi lại lịch sử sức khoẻ của gia đình!"}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords.map(record => {
            const typeDef = RECORD_TYPES[record.type as keyof typeof RECORD_TYPES];

            return (
              <Card key={record.id} className="group hover:border-emerald-500/40 transition-all border-white/5">
                <CardContent className="p-5 flex flex-col gap-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${typeDef.bg} ${typeDef.color}`}>
                        {React.createElement(typeDef.icon, { className: "w-5 h-5" })}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-family-text flex items-center gap-2">
                          <span className="truncate">{record.member}</span>
                        </h3>
                        <p className="text-xs text-family-textMuted flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(record.date).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => { setEditingRecord(record); setIsModalOpen(true); }} className="p-1.5 text-family-textMuted hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(record.id)} className="p-1.5 text-family-textMuted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-medium text-family-textMuted bg-family-bgDark/40 px-2.5 py-1 rounded-md self-start">
                      {typeDef.label}
                    </span>
                    <div className="flex items-start gap-2 text-sm text-family-text bg-family-bgDark/20 p-2.5 rounded-lg border border-white/5">
                      <MapPin className="w-4 h-4 shrink-0 text-family-textMuted mt-0.5" />
                      <span className="leading-snug">{record.hospitalOrClinic}</span>
                    </div>
                    <p className="text-sm text-family-text leading-relaxed">
                      {record.diagnosisOrNotes}
                    </p>
                  </div>
                  
                  {record.nextAppointment && (
                    <div className="mt-auto pt-3 border-t border-emerald-500/10">
                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-3 py-2 rounded-lg">
                        <ArrowRight className="w-4 h-4" />
                        Lịch hẹn khám lại: {new Date(record.nextAppointment).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
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
          <div className="bg-family-bg border border-emerald-500/20 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b bg-emerald-500/10 border-emerald-500/20 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" />
                <h2 className="text-lg font-bold text-family-text">
                  {editingRecord ? 'Cập nhật Hồ sơ' : 'Thêm Hồ sơ Mới'}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Thành viên *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-family-textMuted" />
                    <select 
                      required
                      name="member"
                      defaultValue={editingRecord?.member || membersList[0]}
                      className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-family-text focus:outline-none focus:border-family-accent/50"
                    >
                      {membersList.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Ngày khám / Đo *</label>
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
                <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Phân loại *</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(RECORD_TYPES).map(([key, cat]) => (
                    <label key={key} className="flex items-center gap-2 p-2.5 rounded-xl border border-family-accent/10 bg-family-bgDark/30 cursor-pointer hover:bg-family-accent/5 transition-colors">
                      <input 
                        type="radio" 
                        name="type" 
                        value={key} 
                        defaultChecked={editingRecord ? editingRecord.type === key : key === 'illness'}
                        className="text-emerald-500 focus:ring-emerald-500 bg-family-bgDark"
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
                <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Bệnh viện / Phòng khám / Tại nhà *</label>
                <input 
                  required
                  name="hospitalOrClinic"
                  defaultValue={editingRecord?.hospitalOrClinic}
                  placeholder="VD: BV Nhi Đồng, Trạm Y tế, Tại nhà..."
                  className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-4 py-2.5 text-sm text-family-text focus:outline-none focus:border-family-accent/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Chẩn đoán / Đơn thuốc / Chỉ số *</label>
                <textarea 
                  required
                  name="diagnosisOrNotes"
                  defaultValue={editingRecord?.diagnosisOrNotes}
                  placeholder="Triệu chứng, kết luận của bác sĩ, tên các loại thuốc, hoặc các chỉ số đo được (Cân nặng, HA...)"
                  rows={3}
                  className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-4 py-2.5 text-sm text-family-text focus:outline-none focus:border-family-accent/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Chi phí (Tham khảo)</label>
                  <input 
                    name="cost"
                    type="text"
                    defaultValue={editingRecord?.cost ? new Intl.NumberFormat('vi-VN').format(editingRecord.cost) : ''}
                    placeholder="VD: 1.500.000"
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
                  <label className="block text-xs font-semibold text-family-textLight uppercase tracking-wider mb-2">Lịch hẹn khám lại (Nếu có)</label>
                  <input 
                    type="date"
                    name="nextAppointment"
                    defaultValue={editingRecord?.nextAppointment}
                    className="w-full bg-family-bgDark/50 border border-family-accent/20 rounded-xl px-4 py-2.5 text-sm text-family-text focus:outline-none focus:border-family-accent/50"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-family-accent/10">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Lưu Hồ sơ
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
