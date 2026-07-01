import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { WarningBox } from '../components/ui/WarningBox';
import { formatTableMoneyVNDMillion } from '../utils/format';
import { safeNumber, safeArray } from '../utils/math';
import { EmptyState } from '../components/ui/EmptyState';
import { Milestone, CalendarRange, Plus, Trash2, Edit3, Save, RotateCcw, AlertTriangle } from 'lucide-react';
import type { LifeEvent } from '../types/finance';

export const LifeStages: React.FC = () => {
  const { state, addLifeEvent, updateLifeEvent, deleteLifeEvent, resetToDefault } = useAppContext();

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
    source: 'investment',
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
      source: 'investment',
      recurringMonthlyImpact: 0,
      affectsNetWorth: true,
      note: '',
    });
    setFormError(null);
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
    { value: 'cash', label: 'Dòng tiền mặt (Tiền tiêu dùng)' },
    { value: 'investment', label: 'Danh mục chứng khoán' },
    { value: 'saving', label: 'Quỹ tiết kiệm/Bình an' },
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
    switch (source?.toLowerCase()) {
      case 'cash': return 'Tiền mặt';
      case 'investment': return 'Đầu tư';
      case 'saving': return 'Tiết kiệm';
      case 'debt': return 'Vay nợ';
      case 'external': return 'Tài trợ';
      default: return source;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-family-text flex items-center gap-3">
            <Milestone className="w-8 h-8 text-family-accent" /> Giai đoạn & Sự kiện cuộc đời
          </h1>
          <p className="text-sm text-family-textMuted mt-1">
            Hiểu rõ các giai đoạn linh hoạt của gia đình và tùy chỉnh các cột mốc sự kiện lớn trên dòng thời gian.
          </p>
        </div>
        <Button onClick={handleAddClick} className="gap-2 self-start md:self-auto text-xs">
          <Plus className="w-4 h-4" /> Thêm sự kiện mới
        </Button>
      </div>

      {formError && <WarningBox type="danger" message={formError} />}

      {/* Add / Edit Form Drawer */}
      {(isAdding || editingId) && (
        <Card className="border-family-accent/30 bg-family-bgDark/20">
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

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setIsAdding(false); setEditingId(null); }}>Hủy</Button>
                <Button type="submit">Lưu sự kiện</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Explain Flexible Stages */}
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

      {/* Life Events Management Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Danh sách Sự kiện lớn trong đời (Life Events)</span>
          </CardTitle>
          <CardDescription>
            Tùy chọn thêm bớt các sự kiện tác động trực tiếp tới tài sản ròng danh nghĩa và dòng tiền ròng của tháng.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {state.lifeEvents.length > 0 ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-family-accent/10 text-family-textMuted font-bold bg-family-bgDark/30">
                  <th className="p-3">Tên sự kiện</th>
                  <th className="p-3">Loại</th>
                  <th className="p-3">Mốc thời gian</th>
                  <th className="p-3 text-right">Tác động một lần</th>
                  <th className="p-3 text-right">Tác động hàng tháng</th>
                  <th className="p-3">Nguồn phân phối</th>
                  <th className="p-3">Ghi chú</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {state.lifeEvents.map((event) => (
                  <tr key={event.id} className="border-b border-family-accent/5 hover:bg-family-bgDark/10">
                    <td className="p-3 font-semibold text-family-text">{event.name}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-family-bgDark/60 text-family-textLight">
                        {getEventLabel(event.type)}
                      </span>
                    </td>
                    <td className="p-3 font-medium">Tháng {event.month}/{event.year}</td>
                    <td className={`p-3 text-right font-bold ${event.amount < 0 ? 'text-red-700' : 'text-green-700'}`}>
                      {event.amount > 0 ? '+' : ''}{formatTableMoneyVNDMillion(event.amount)}
                    </td>
                    <td className={`p-3 text-right font-semibold ${safeNumber(event.recurringMonthlyImpact) < 0 ? 'text-red-700' : 'text-green-700'}`}>
                      {safeNumber(event.recurringMonthlyImpact) !== 0 
                      ? `${safeNumber(event.recurringMonthlyImpact) > 0 ? '+' : ''}${event.recurringMonthlyImpact} tr/tháng` 
                      : '---'}
                    </td>
                    <td className="p-3 font-medium text-family-textLight">{getSourceLabel(event.source)}</td>
                    <td className="p-3 text-family-textMuted max-w-[120px] truncate">{event.note || '---'}</td>
                    <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleEditClick(event)}
                        className="p-1.5 rounded-lg text-family-accent hover:bg-family-bgDeep/40 transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        title="Xóa sự kiện"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState title="Chưa có sự kiện nào" description="Nhấn nút Thêm sự kiện mới ở trên để bắt đầu." />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
