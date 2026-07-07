import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { WarningBox } from '../components/ui/WarningBox';
import { formatTableMoneyVNDMillion } from '../utils/format';
import { safeNumber } from '../utils/math';
import { EmptyState } from '../components/ui/EmptyState';
import { 
  Milestone, CalendarRange, Plus, Trash2, Edit3, 
  Home, Car, Baby, HeartPulse, Gift, Briefcase, Plane, Wallet, TrendingUp, TrendingDown 
} from 'lucide-react';
import type { LifeEvent } from '../types/finance';

export const LifeStages: React.FC = () => {
  const { state, addLifeEvent, updateLifeEvent, deleteLifeEvent } = useAppContext();

  // Local state for event form editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<LifeEvent, 'id'>>({
    name: '',
    type: 'other',
    month: 1,
    year: 2030,
    amount: 0,
    source: 'safety_reserve',
    recurringMonthlyImpact: 0,
    affectsNetWorth: true,
    note: '',
  });

  const handleEditClick = (event: LifeEvent) => {
    setEditingId(event.id);
    setIsAdding(false);
    setFormData({
      name: event.name,
      type: event.type,
      month: event.month,
      year: event.year,
      amount: event.amount,
      source: event.source,
      recurringMonthlyImpact: event.recurringMonthlyImpact || 0,
      affectsNetWorth: event.affectsNetWorth,
      note: event.note || '',
    });
    setFormError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddClick = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({
      name: '',
      type: 'other',
      month: 1,
      year: 2030,
      amount: 0,
      source: 'safety_reserve',
      recurringMonthlyImpact: 0,
      affectsNetWorth: true,
      note: '',
    });
    setFormError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Vui lòng điền tên sự kiện.');
      return;
    }

    if (isAdding) {
      addLifeEvent(formData);
      setIsAdding(false);
    } else if (editingId) {
      updateLifeEvent({
        ...formData,
        id: editingId,
      });
      setEditingId(null);
    }
    setFormError(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa sự kiện cuộc đời này không?')) {
      deleteLifeEvent(id);
    }
  };

  const eventTypes: { value: LifeEvent['type']; label: string }[] = [
    { value: 'buy_property', label: 'Mua bất động sản' },
    { value: 'buy_car', label: 'Mua xe ô tô' },
    { value: 'child_birth', label: 'Sinh con' },
    { value: 'medical', label: 'Sự kiện y tế hiểm nghèo' },
    { value: 'job_loss', label: 'Mất việc làm tạm thời' },
    { value: 'bonus', label: 'Khoản thưởng đột xuất' },
    { value: 'inheritance', label: 'Nhận thừa kế' },
    { value: 'retirement', label: 'Nghỉ hưu' },
    { value: 'travel', label: 'Du lịch trải nghiệm lớn' },
    { value: 'other', label: 'Sự kiện khác' },
  ];

  const sourceTypes: { value: LifeEvent['source']; label: string }[] = [
    { value: 'housing_basic', label: 'Sinh hoạt & Cố định' },
    { value: 'future_investing', label: 'Tương lai & Đầu tư' },
    { value: 'safety_reserve', label: 'Bình an & Dự phòng' },
    { value: 'family_experience', label: 'Yêu thương & Sự kiện' },
    { value: 'health_growth', label: 'Sức khỏe & Phát triển' },
    { value: 'debt', label: 'Vay nợ' },
    { value: 'external', label: 'Nguồn tài trợ bên ngoài' },
  ];

  const getEventLabel = (type: string) => {
    switch (type) {
      case 'buy_property': return 'Mua nhà / BĐS';
      case 'buy_car': return 'Mua xe';
      case 'child_birth': return 'Sinh con';
      case 'medical': return 'Y tế hiểm nghèo';
      case 'job_loss': return 'Mất việc làm';
      case 'bonus': return 'Thưởng đột xuất';
      case 'inheritance': return 'Nhận thừa kế';
      case 'retirement': return 'Nghỉ hưu';
      case 'travel': return 'Du lịch lớn';
      default: return 'Khác';
    }
  };

  const getSourceLabel = (source: string) => {
    return sourceTypes.find(t => t.value === source)?.label || source;
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'buy_property': return <Home className="w-5 h-5 text-white" />;
      case 'buy_car': return <Car className="w-5 h-5 text-white" />;
      case 'child_birth': return <Baby className="w-5 h-5 text-white" />;
      case 'medical': return <HeartPulse className="w-5 h-5 text-white" />;
      case 'job_loss': return <Briefcase className="w-5 h-5 text-white" />;
      case 'bonus': return <Gift className="w-5 h-5 text-white" />;
      case 'inheritance': return <Wallet className="w-5 h-5 text-white" />;
      case 'retirement': return <Milestone className="w-5 h-5 text-white" />;
      case 'travel': return <Plane className="w-5 h-5 text-white" />;
      default: return <CalendarRange className="w-5 h-5 text-white" />;
    }
  };

  // Dashboard calculations
  const totalEvents = state.lifeEvents.length;
  const netOneTime = state.lifeEvents.reduce((sum, e) => sum + safeNumber(e.amount), 0);
  const netRecurring = state.lifeEvents.reduce((sum, e) => sum + safeNumber(e.recurringMonthlyImpact), 0);
  
  const sortedEvents = [...state.lifeEvents].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-family-text flex items-center gap-3">
            <Milestone className="w-8 h-8 text-family-accent" /> Sự kiện cuộc đời
          </h1>
          <p className="text-sm text-family-textMuted mt-1">
            Hiểu rõ các giai đoạn linh hoạt của gia đình và tùy chỉnh các cột mốc sự kiện lớn trên dòng thời gian.
          </p>
        </div>
        <Button onClick={handleAddClick} className="gap-2 self-start md:self-auto text-xs">
          <Plus className="w-4 h-4" /> Thêm sự kiện mới
        </Button>
      </div>

      {/* Dashboard Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/80 border-family-accent/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-family-textMuted uppercase tracking-wider mb-1">Tổng sự kiện</p>
              <h3 className="text-2xl font-bold text-family-text">{totalEvents}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <CalendarRange className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/80 border-family-accent/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-family-textMuted uppercase tracking-wider mb-1">Tác động 1 lần (Net)</p>
              <h3 className={`text-2xl font-bold ${netOneTime >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netOneTime > 0 ? '+' : ''}{formatTableMoneyVNDMillion(netOneTime)}
              </h3>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${netOneTime >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {netOneTime >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/80 border-family-accent/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-family-textMuted uppercase tracking-wider mb-1">Tác động dòng tiền (Net)</p>
              <h3 className={`text-2xl font-bold ${netRecurring >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netRecurring > 0 ? '+' : ''}{formatTableMoneyVNDMillion(netRecurring)}<span className="text-sm font-medium">/tháng</span>
              </h3>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${netRecurring >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {netRecurring >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
            </div>
          </CardContent>
        </Card>
      </div>

      {formError && <WarningBox type="danger" message={formError} />}

      {/* Add / Edit Form Drawer */}
      {(isAdding || editingId) && (
        <Card className="border-family-accent/30 bg-family-bgDark/20 shadow-md transform transition-all">
          <CardHeader>
            <CardTitle>{isAdding ? 'Thêm sự kiện mới' : 'Chỉnh sửa sự kiện'}</CardTitle>
            <CardDescription>
              Thiết lập thông số tác động tài chính. Nhập số tiền âm cho các chi phí chi tiêu lớn (Ví dụ: -3500 cho mua nhà).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  label="Tên sự kiện"
                  type="text"
                  placeholder="Ví dụ: Mua chung cư Vinhomes..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Select
                  label="Loại sự kiện"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  options={eventTypes}
                />
                <Input
                  label="Tháng diễn ra"
                  type="number"
                  min={1}
                  max={12}
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: safeNumber(Number(e.target.value)) })}
                  required
                />
                <Input
                  label="Năm diễn ra"
                  type="number"
                  min={2026}
                  max={2060}
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: safeNumber(Number(e.target.value)) })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Số tiền tác động một lần (Tr VND)"
                  type="number"
                  placeholder="Nhập âm nếu chi tiền, dương nếu nhận tiền"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: safeNumber(Number(e.target.value)) })}
                  required
                />
                <Input
                  label="Tác động dòng tiền tháng (Tr/tháng)"
                  type="number"
                  placeholder="Ví dụ: -2 Tr/tháng vận hành xe"
                  value={formData.recurringMonthlyImpact}
                  onChange={(e) => setFormData({ ...formData, recurringMonthlyImpact: safeNumber(Number(e.target.value)) })}
                />
                <Select
                  label="Nguồn trừ/Cộng tài sản"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value as any })}
                  options={sourceTypes}
                />
              </div>

              <Input
                label="Ghi chú thêm"
                type="text"
                placeholder="Lưu lại chi tiết kịch bản..."
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => { setIsAdding(false); setEditingId(null); }}>Hủy</Button>
                <Button type="submit">Lưu sự kiện</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Timeline View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Dòng thời gian sự kiện (Timeline)</span>
          </CardTitle>
          <CardDescription>
            Bức tranh toàn cảnh về các biến cố và cột mốc tài chính được sắp xếp theo thời gian.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedEvents.length > 0 ? (
            <div className="relative border-l-2 border-family-accent/20 ml-4 md:ml-6 space-y-6 py-4">
              {sortedEvents.map((event, index) => {
                const isIncome = event.amount >= 0;
                const isRecurringIncome = safeNumber(event.recurringMonthlyImpact) >= 0;
                
                return (
                  <div key={event.id} className="relative pl-8 md:pl-10">
                    {/* Icon Node */}
                    <div className={`absolute -left-[21px] top-1 w-10 h-10 rounded-full border-4 border-white flex items-center justify-center shadow-md ${isIncome ? 'bg-green-500' : 'bg-orange-500'}`}>
                      {getEventIcon(event.type)}
                    </div>
                    
                    {/* Content Card */}
                    <div className="bg-white rounded-xl border border-family-accent/10 p-5 shadow-sm hover:shadow-md transition-shadow group relative">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-family-accent bg-family-bgDeep/30 px-2.5 py-0.5 rounded-full">
                              Tháng {event.month}/{event.year}
                            </span>
                            <span className="text-xs font-semibold text-family-textLight border border-family-textLight/20 px-2 py-0.5 rounded-full">
                              {getEventLabel(event.type)}
                            </span>
                            <span className="text-xs font-semibold text-family-textMuted bg-gray-100 px-2 py-0.5 rounded-full">
                              {getSourceLabel(event.source)}
                            </span>
                          </div>
                          <h4 className="text-lg font-bold text-family-text">{event.name}</h4>
                          {event.note && <p className="text-sm text-family-textMuted mt-1">{event.note}</p>}
                        </div>
                        
                        {/* Impacts */}
                        <div className="flex flex-col gap-2 items-start md:items-end min-w-[140px] pt-1">
                          <div className={`px-3 py-1.5 rounded-lg text-sm font-bold w-full md:w-auto text-center ${isIncome ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {isIncome ? '+' : ''}{formatTableMoneyVNDMillion(event.amount)}
                          </div>
                          {safeNumber(event.recurringMonthlyImpact) !== 0 && (
                            <div className={`px-3 py-1 rounded-lg text-xs font-semibold w-full md:w-auto text-center ${isRecurringIncome ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                              Dòng tiền: {isRecurringIncome ? '+' : ''}{event.recurringMonthlyImpact} tr/tháng
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Hover Actions */}
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white shadow-sm border border-gray-100 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleEditClick(event)}
                          className="p-2 text-family-textLight hover:text-family-accent hover:bg-gray-50 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(event.id)}
                          className="p-2 text-family-textLight hover:text-red-500 hover:bg-gray-50 transition-colors"
                          title="Xóa sự kiện"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="Chưa có sự kiện nào" description="Nhấn nút Thêm sự kiện mới ở trên để bắt đầu." />
          )}
        </CardContent>
      </Card>
      
      {/* Explain Flexible Stages (moved to bottom) */}
      <Card className="bg-gradient-to-r from-family-bgDark/30 to-family-bgDeep/15 border-family-accent/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            🧬 Giai đoạn linh hoạt (Life Stages) là gì?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-family-textMuted leading-relaxed space-y-2">
          <p>
            **Giai đoạn linh hoạt** đại diện cho những phân kỳ dài hạn khác nhau của cuộc đời hộ gia đình. Từng giai đoạn có các ưu tiên tài chính khác biệt:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1.5">
            <div className="p-3 bg-white/70 rounded-xl border border-family-accent/5">
              <strong className="text-family-text block font-bold mb-0.5">1. Giai đoạn tích lũy (Accumulation)</strong>
              Vợ chồng trẻ tập trung gia tăng thu nhập, phân bổ ngân sách kỷ luật (40% đầu tư) để tích lũy lãi kép.
            </div>
            <div className="p-3 bg-white/70 rounded-xl border border-family-accent/5">
              <strong className="text-family-text block font-bold mb-0.5">2. Giai đoạn nuôi con nhỏ (Child raising)</strong>
              Sinh con kích hoạt thêm danh mục *"Chi phí nuôi con"*, gây thâm hụt nếu không giảm bớt chi phí cá nhân.
            </div>
            <div className="p-3 bg-white/70 rounded-xl border border-family-accent/5">
              <strong className="text-family-text block font-bold mb-0.5">3. Giai đoạn tự do (FIRE / Retirement)</strong>
              Tài sản tích lũy tạo thu nhập thụ động đủ nuôi sống gia đình, vợ chồng tuyên bố tự do tài chính dài hạn.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
