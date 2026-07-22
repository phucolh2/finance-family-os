import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { WarningBox } from '../components/ui/WarningBox';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import { formatTableMoneyVNDMillion } from '../utils/format';
import { safeNumber } from '../utils/math';
import { EmptyState } from '../components/ui/EmptyState';
import { 
  Milestone, CalendarRange, Plus, Trash2, Edit3, 
  Home, Car, Baby, HeartPulse, Gift, Briefcase, Plane, Wallet, TrendingUp, TrendingDown 
} from 'lucide-react';
import { ExpenseDashboard } from '../components/expense/ExpenseDashboard';
import { ExpenseScheduleView } from '../components/expense/ExpenseScheduleView';
import { SavingsAndLiquidityView } from '../components/expense/SavingsAndLiquidityView';
import { ObservationControls } from '../components/ui/ObservationControls';

import type { BudgetGroup } from '../types/budget';
import type { LifeEvent } from '../types/finance';

export const LifeStages: React.FC = () => {
  const { state, addLifeEvent, updateLifeEvent, deleteLifeEvent } = useAppContext();
  
  // Dashboard filter state
  const [dashboardFilter, setDashboardFilter] = useState<BudgetGroup | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'timeline' | 'monthly_reconciliation' | 'savings_liquidity'>('monthly_reconciliation');

  // Generate spending category options from the latest budget schedule
  const activeBudget = state.budgetSchedule.length > 0 ? state.budgetSchedule[state.budgetSchedule.length - 1] : null;
  const spendingCategoryOptions = activeBudget?.rootGroups.flatMap(group => 
    (group.children || []).map(child => ({
      value: `${group.groupId}/${child.id}`,
      label: `${group.name} - ${child.name}`
    }))
  ) || [];

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
    isMilestone: false,
    spendingCategory: '',
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
      isMilestone: event.isMilestone || false,
      spendingCategory: event.spendingCategory || '',
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
      isMilestone: false,
      spendingCategory: '',
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
    const formattedData = {
      ...formData,
      amount: -Math.abs(safeNumber(formData.amount)),
      recurringMonthlyImpact: -Math.abs(safeNumber(formData.recurringMonthlyImpact))
    };

    if (isAdding) {
      addLifeEvent(formattedData);
      setIsAdding(false);
    } else if (editingId) {
      updateLifeEvent({
        ...formattedData,
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
      case 'buy_car': return 'Mua Ô tô';
      case 'child_birth': return 'Sinh con';
      case 'medical': return 'Sự kiện y tế';
      case 'job_loss': return 'Mất việc / Giảm thu nhập';
      case 'retirement': return 'Nghỉ hưu';
      case 'travel': return 'Du lịch / Trải nghiệm';
      case 'other': return 'Sự kiện khác';
      default: return 'Sự kiện';
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
      case 'retirement': return <Milestone className="w-5 h-5 text-white" />;
      case 'travel': return <Plane className="w-5 h-5 text-white" />;
      default: return <CalendarRange className="w-5 h-5 text-white" />;
    }
  };

  // Filter events based on dashboard filter
  const filteredEventsForLedger = state.lifeEvents.filter(event => {
    if (dashboardFilter === 'all') return true;
    const groupId = event.spendingCategory ? event.spendingCategory.split('/')[0] : event.source;
    return groupId === dashboardFilter;
  });

  // Dashboard calculations
  const totalEvents = filteredEventsForLedger.length;
  const netOneTime = filteredEventsForLedger.reduce((sum, e) => sum + safeNumber(e.amount), 0);
  const netRecurring = filteredEventsForLedger.reduce((sum, e) => sum + safeNumber(e.recurringMonthlyImpact), 0);
  
  const sortedEvents = [...filteredEventsForLedger].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-serif font-bold text-family-text flex items-center gap-3">
            <Milestone className="w-8 h-8 text-family-accent shrink-0" /> Sự kiện cuộc đời & Quản lý Chi tiêu
            <HelpTooltip text="Ghi chép các sự kiện dòng tiền không thường xuyên (mua xe, đám cưới, sinh con) để đánh giá tác động lên dòng tiền và đối chiếu với ngân sách." />
          </h1>
          <p className="text-sm text-family-textMuted mt-1">
            Ghi chép các sự kiện dòng tiền và đối chiếu với ngân sách hàng tháng để kiểm soát tài chính chính xác.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <ObservationControls />
          <Button onClick={handleAddClick} className="gap-2 text-xs h-9 shrink-0">
            <Plus className="w-4 h-4 shrink-0" /> Thêm sự kiện
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200">
        <button
          onClick={() => { setActiveTab('monthly_reconciliation'); }}
          className={`py-2 px-4 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'monthly_reconciliation' 
              ? 'border-family-accent text-family-accent' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Thực tế chi tiêu
        </button>
        <button
          onClick={() => { setActiveTab('savings_liquidity'); }}
          className={`py-2 px-4 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'savings_liquidity' 
              ? 'border-family-accent text-family-accent' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Tiết kiệm & Thanh khoản
        </button>
        <button
          onClick={() => { setActiveTab('timeline'); }}
          className={`py-2 px-4 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'timeline' 
              ? 'border-family-accent text-family-accent' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Dòng thời gian Sự kiện
        </button>
      </div>

      {activeTab === 'timeline' && (
        <div className="space-y-6">

                {/* Dashboard Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-white/80 border-family-accent/10">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-family-textMuted uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          Tổng sự kiện
                          <HelpTooltip text="Tổng số sự kiện tài chính (cột mốc, biến cố) đã được ghi nhận." />
                        </p>
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
                        <p className="text-xs font-semibold text-family-textMuted uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          Tác động 1 lần (Net)
                          <HelpTooltip text="Tổng giá trị tác động tài chính ngay lập tức (thu nhập trừ đi chi phí) của tất cả các sự kiện." />
                        </p>
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
                        <p className="text-xs font-semibold text-family-textMuted uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          Tác động dòng tiền (Net)
                          <HelpTooltip text="Tổng sự thay đổi ròng trên dòng tiền hàng tháng do các sự kiện mang lại." />
                        </p>
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


        </div>
      )}

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
            <form onSubmit={handleSave} className="space-y-6">
              {/* Block 1: Basic Info */}
              <div className="bg-white border border-family-accent/10 rounded-xl p-4 shadow-sm space-y-4">
                <div className="border-b border-family-accent/10 pb-2 mb-2">
                  <h3 className="text-sm font-bold text-family-text">Thông tin cơ bản</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Input
                    label="Tên sự kiện"
                    type="text"
                    placeholder="Ví dụ: Mua chung cư Vinhomes..."
                    value={formData.name}
                    onChange={(e) => { setFormData({ ...formData, name: e.target.value }); }}
                    required
                  />
                  <Select
                    label="Loại sự kiện"
                    value={formData.type}
                    onChange={(e) => { setFormData({ ...formData, type: e.target.value as any }); }}
                    options={eventTypes}
                  />
                  <Input
                    label="Tháng diễn ra"
                    type="number"
                    min={1}
                    max={12}
                    value={formData.month}
                    onChange={(e) => { setFormData({ ...formData, month: safeNumber(Number(e.target.value)) }); }}
                    required
                  />
                  <Input
                    label="Năm diễn ra"
                    type="number"
                    min={2026}
                    max={2060}
                    value={formData.year}
                    onChange={(e) => { setFormData({ ...formData, year: safeNumber(Number(e.target.value)) }); }}
                    required
                  />
                </div>
              </div>

              {/* Block 2: Financial Impact (One-time) */}
              <div className="bg-family-bgDark/5 border border-family-accent/10 rounded-xl p-4 shadow-sm space-y-4">
                <div className="border-b border-family-accent/10 pb-2 mb-2">
                  <h3 className="text-sm font-bold text-family-text flex items-center gap-2">Tác động Tài chính Một lần</h3>
                  <p className="text-[11px] text-family-textMuted mt-1">Là số tiền chi trả ngay lập tức tại thời điểm xảy ra sự kiện. Hệ thống sẽ rút số tiền này trực tiếp từ Quỹ/Nguồn tài sản mà bạn chọn.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Input
                      label="Số tiền tác động một lần (Tr VND) - CHI PHÍ"
                      type="number"
                      placeholder="Ví dụ: 800 (Mua xe ô tô)"
                      value={Math.abs(safeNumber(formData.amount)) || ''}
                      onChange={(e) => { setFormData({ ...formData, amount: Number(e.target.value) }); }}
                      required
                    />
                  </div>
                  <Select
                    label="Nguồn trừ/Cộng tài sản"
                    value={formData.source}
                    onChange={(e) => { setFormData({ ...formData, source: e.target.value as any }); }}
                    options={sourceTypes}
                  />
                </div>
              </div>

              {/* Block 3: Recurring Impact & Reporting */}
              <div className="bg-family-bgDeep/10 border border-family-accent/10 rounded-xl p-4 shadow-sm space-y-4">
                <div className="border-b border-family-accent/10 pb-2 mb-2">
                  <h3 className="text-sm font-bold text-family-text flex items-center gap-2">Tác động Dòng tiền Lâu dài & Báo cáo</h3>
                  <p className="text-[11px] text-family-textMuted mt-1">Chi phí (hoặc thu nhập) phát sinh <strong>đều đặn mỗi tháng</strong> sau sự kiện này. Khoản này sẽ trừ thẳng vào Dòng tiền ròng tổng của gia đình thay vì nằm trong hạn mức Thực tế chi tiêu hàng ngày.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Tác động dòng tiền tháng (Tr/tháng) - TĂNG CHI"
                    type="number"
                    placeholder="Ví dụ: 4 (Chi phí vận hành nuôi xe)"
                    value={Math.abs(safeNumber(formData.recurringMonthlyImpact)) || ''}
                    onChange={(e) => { setFormData({ ...formData, recurringMonthlyImpact: Number(e.target.value) }); }}
                  />
                  <div>
                    <Select
                      label="Lớp Tiêu sản (Ánh xạ Ngân sách)"
                      value={formData.spendingCategory || ''}
                      onChange={(e) => { setFormData({ ...formData, spendingCategory: e.target.value }); }}
                      options={[{value: '', label: '-- Không phân loại --'}, ...spendingCategoryOptions]}
                    />
                    <p className="text-[10px] text-family-accent mt-1.5 ml-1 italic font-medium leading-tight">* Ánh xạ này chỉ dùng để gom nhóm trên Báo cáo vòng đời, hoàn toàn không tự động ghi đè vào bảng "Thực tế chi tiêu".</p>
                  </div>
                </div>
              </div>

              {/* Block 4: Misc */}
              <div className="bg-white border border-family-accent/10 rounded-xl p-4 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Ghi chú thêm"
                    type="text"
                    placeholder="Lưu lại chi tiết kịch bản (VD: Mua ô tô che mưa che nắng...)"
                    value={formData.note}
                    onChange={(e) => { setFormData({ ...formData, note: e.target.value }); }}
                  />
                  <div className="flex flex-col justify-center md:pl-6 md:mt-4 space-y-3">
                    <div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="affectsNetWorth"
                          checked={formData.affectsNetWorth}
                          onChange={(e) => { setFormData({ ...formData, affectsNetWorth: e.target.checked }); }}
                          className="w-4 h-4 text-family-accent border-gray-300 rounded focus:ring-family-accent cursor-pointer"
                        />
                        <label htmlFor="affectsNetWorth" className="ml-2 block text-sm font-bold text-family-text cursor-pointer">
                          Ảnh hưởng Tài sản ròng (Net Worth)
                        </label>
                      </div>
                      <p className="text-[10px] text-family-textMuted mt-1 ml-6 leading-tight">Bật nếu sự kiện này làm thay đổi tổng giá trị tài sản ròng của gia đình (VD: mua nhà, bán đất). Tắt nếu chỉ là chi phí tiêu dùng (VD: du lịch, tiệc).</p>
                    </div>
                    <div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isMilestone"
                          checked={formData.isMilestone}
                          onChange={(e) => { setFormData({ ...formData, isMilestone: e.target.checked }); }}
                          className="w-4 h-4 text-family-accent border-gray-300 rounded focus:ring-family-accent cursor-pointer"
                        />
                        <label htmlFor="isMilestone" className="ml-2 block text-sm font-bold text-family-text cursor-pointer">
                          Đánh dấu là Cột mốc Sự kiện
                        </label>
                      </div>
                      <p className="text-[10px] text-family-textMuted mt-1 ml-6 leading-tight">Sự kiện này sẽ được đánh dấu nổi bật (highlight) trên Dòng thời gian sự kiện (Timeline).</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} className="px-6">Hủy</Button>
                <Button type="submit" className="px-6 font-bold">Lưu sự kiện</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}


      {activeTab === 'monthly_reconciliation' && (
        <div className="space-y-6">
          <ExpenseDashboard filter={dashboardFilter} setFilter={setDashboardFilter} />
          <ExpenseScheduleView />
        </div>
      )}
      
      {activeTab === 'savings_liquidity' && <SavingsAndLiquidityView />}

      {/* Timeline View */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                Dòng thời gian sự kiện (Timeline)
                <HelpTooltip text="Theo dõi và quản lý toàn bộ các biến cố, sự kiện tài chính được sắp xếp theo thời gian." />
              </span>
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
                          onClick={() => { handleEditClick(event); }}
                          className="p-2 text-family-textLight hover:text-family-accent hover:bg-gray-50 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => { handleDelete(event.id); }}
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
            <strong>Giai đoạn linh hoạt</strong> đại diện cho những phân kỳ dài hạn khác nhau của cuộc đời hộ gia đình. Từng giai đoạn có các ưu tiên tài chính khác biệt:
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
      )}
    </div>
  );
};

