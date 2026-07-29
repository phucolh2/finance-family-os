import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useLiquidityBreakdown } from '../hooks/useLiquidityBreakdown';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { FundingSourceSelect } from '../components/ui/FundingSourceSelect';
import { WarningBox } from '../components/ui/WarningBox';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import { formatTableMoneyVNDMillion } from '../utils/format';
import { isWithinObservationPeriod, getPeriodGuardMessage } from '../utils/periodGuard';
import { safeNumber } from '../utils/math';
import { EmptyState } from '../components/ui/EmptyState';
import { 
  Milestone, CalendarRange, Plus, Trash2, Edit3, 
  Home, Car, Baby, HeartPulse, Gift, Briefcase, Plane, Wallet, TrendingUp, TrendingDown, AlertTriangle,
  Smartphone, Tv, BookOpen, Sparkles, Wrench, Heart, Activity
} from 'lucide-react';
import { ExpenseDashboard } from '../components/expense/ExpenseDashboard';
import { ExpenseScheduleView } from '../components/expense/ExpenseScheduleView';
import { LiquidityBreakdownTable } from '../components/expense/LiquidityBreakdownTable';
import { SavingsAndLiquidityView } from '../components/expense/SavingsAndLiquidityView';
import { ObservationControls } from '../components/ui/ObservationControls';

import type { BudgetGroup } from '../types/budget';
import type { LifeEvent } from '../types/finance';

export const LifeStages: React.FC = () => {
  const { state, addLifeEvent, updateLifeEvent, deleteLifeEvent, selectedPeriodKey } = useAppContext();
  
  // Dashboard filter state
  const [dashboardFilter, setDashboardFilter] = useState<BudgetGroup | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'timeline' | 'monthly_reconciliation' | 'savings_liquidity' | 'expense_overview'>('expense_overview');

  // Local state for event form editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [pendingEventData, setPendingEventData] = useState<any>(null);
  const [pendingWarningInfo, setPendingWarningInfo] = useState<{sourceName: string, overage: number, month: number, year: number} | null>(null);

  const [formPeriodKey, setFormPeriodKey] = useState<string>('');

  const now = new Date();
  const nowKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  let effectivePeriodKey = selectedPeriodKey || nowKey;
  if (!selectedPeriodKey && state.profile) {
    const startYear = state.profile.planningStartYear || now.getFullYear();
    const startMonth = state.profile.planningStartMonth || now.getMonth() + 1;
    if (now.getFullYear() * 12 + now.getMonth() + 1 < startYear * 12 + startMonth) {
      effectivePeriodKey = `${startYear}-${String(startMonth).padStart(2, '0')}`;
    }
  }

  const currentObservedYear = parseInt(effectivePeriodKey.split('-')[0], 10);
  const currentObservedMonth = parseInt(effectivePeriodKey.split('-')[1], 10);

  const [formData, setFormData] = useState<Omit<LifeEvent, 'id'>>({
    name: '',
    type: 'other',
    month: currentObservedMonth,
    year: currentObservedYear,
    amount: 0,
    source: 'debt',
    recurringMonthlyImpact: 0,
    affectsNetWorth: true,
    note: '',
    isMilestone: false,
    spendingCategory: '',
  });

  // Tự động cập nhật tháng/năm của form đang tạo mới nếu người dùng đổi Tháng quan sát
  React.useEffect(() => {
    if (isAdding) {
      setFormData(prev => ({
        ...prev,
        month: currentObservedMonth,
        year: currentObservedYear
      }));
    }
  }, [currentObservedMonth, currentObservedYear, isAdding]);

  React.useEffect(() => {
    if (formData.year && formData.month) {
      setFormPeriodKey(`${formData.year}-${String(formData.month).padStart(2, '0')}`);
    }
  }, [formData.month, formData.year]);

  const { liquidityBreakdownData: formPeriodBreakdown } = useLiquidityBreakdown('cumulative', formPeriodKey || undefined);

  // Generate spending category options dynamically based on the event's month and year
  const eventTime = formData.year * 12 + formData.month;
  const sortedSchedules = [...state.budgetSchedule].sort((a, b) => (a.effectiveYear * 12 + a.effectiveMonth) - (b.effectiveYear * 12 + b.effectiveMonth));
  
  let activeBudget = sortedSchedules.length > 0 ? sortedSchedules[0] : null;
  for (const b of sortedSchedules) {
    if (b.effectiveYear * 12 + b.effectiveMonth <= eventTime) {
      activeBudget = b;
    }
  }

  // Find the active expense schedule for this event's time
  const sortedExpenseSchedules = [...(state.expenseSchedule || [])].sort((a, b) => (a.effectiveYear * 12 + a.effectiveMonth) - (b.effectiveYear * 12 + b.effectiveMonth));
  let activeExpenseSchedule = sortedExpenseSchedules.length > 0 ? sortedExpenseSchedules[0] : null;
  for (const s of sortedExpenseSchedules) {
    if (s.effectiveYear * 12 + s.effectiveMonth <= eventTime) {
      activeExpenseSchedule = s;
    }
  }

  const spendingCategoryOptions = activeBudget?.rootGroups.flatMap(group => 
    (group.children || []).map(child => {
      const catKey = `${group.groupId}/${child.id}`;
      const currentAlloc = activeExpenseSchedule?.categories?.[catKey] || 0;
      const allocText = currentAlloc > 0 ? ` (Đang PB: ${currentAlloc}tr)` : '';
      return {
        value: catKey,
        label: `${group.name} - ${child.name}${allocText}`
      };
    })
  ) || [];

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
    setActiveTab('timeline');
    setIsAdding(true);
    setEditingId(null);
    setFormData({
      name: '',
      type: 'other',
      month: currentObservedMonth,
      year: currentObservedYear,
      amount: 0,
      source: activeBudget?.rootGroups.find(g => g.classification === 'expense')?.groupId || 'debt',
      recurringMonthlyImpact: 0,
      affectsNetWorth: true,
      note: '',
      isMilestone: false,
      spendingCategory: '',
    });
    setFormError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const executeSave = (formattedData: any) => {
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
    setShowWarningDialog(false);
    setPendingEventData(null);
    setPendingWarningInfo(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Vui lòng điền tên sự kiện.');
      return;
    }
    
    const oneTimeAmount = Math.abs(safeNumber(formData.amount));
    const recurringAmount = Math.abs(safeNumber(formData.recurringMonthlyImpact));

    if (oneTimeAmount === 0 && recurringAmount === 0) {
      setFormError('Vui lòng nhập ít nhất một khoản "Số tiền tác động một lần" hoặc "Tác động dòng tiền tháng" để tạo khoản chi.');
      return;
    }

    const formattedData = {
      ...formData,
      amount: -oneTimeAmount,
      recurringMonthlyImpact: -recurringAmount
    };

    // New Virtual Check for Recurring Impact Overbudget
    if (formattedData.recurringMonthlyImpact < 0 && formData.spendingCategory) {
      let targetMonth = formData.month + 1;
      let targetYear = formData.year;
      if (targetMonth > 12) {
        targetMonth = 1;
        targetYear += 1;
      }
      const targetMonthValue = targetYear * 12 + targetMonth;
      
      const parts = formData.spendingCategory.split('/');
      const categoryId = parts.length > 1 ? parts[1] : parts[0];

      const monthsToCheck = new Set<number>();
      monthsToCheck.add(targetMonthValue);
      (state.expenseSchedule || []).forEach(s => {
          const val = s.effectiveYear * 12 + s.effectiveMonth;
          if (val >= targetMonthValue) monthsToCheck.add(val);
      });

      const sortedSchedules = [...state.budgetSchedule].sort((a, b) => (a.effectiveYear * 12 + a.effectiveMonth) - (b.effectiveYear * 12 + b.effectiveMonth));
      const sortedExpenseSchedules = [...(state.expenseSchedule || [])].sort((a, b) => (a.effectiveYear * 12 + a.effectiveMonth) - (b.effectiveYear * 12 + b.effectiveMonth));
      const sortedIncomes = [...state.incomeSchedule].sort((a,b) => (a.effectiveYear * 12 + a.effectiveMonth) - (b.effectiveYear * 12 + b.effectiveMonth));

      for (const monthVal of Array.from(monthsToCheck).sort((a,b) => a-b)) {
          let activeBudgetAtTarget = null;
          for (const b of sortedSchedules) {
            if (b.effectiveYear * 12 + b.effectiveMonth <= monthVal) activeBudgetAtTarget = b;
          }

          let budgetForCategory = 0;
          let catName = 'Hạng mục';
          if (activeBudgetAtTarget) {
            for (const group of activeBudgetAtTarget.rootGroups) {
               if (group.classification === 'expense') {
                  const child = group.children?.find(c => c.id === categoryId);
                  if (child) {
                     let activeIncome = 0;
                     for (const inc of sortedIncomes) {
                         if (inc.effectiveYear * 12 + inc.effectiveMonth <= monthVal) activeIncome = inc.incomeMonthly;
                     }
                     budgetForCategory = (activeIncome * child.ratioPercent) / 100;
                     catName = child.name;
                     break;
                  }
               }
            }
          }
          
          let activeExpenseScheduleAtTarget = null;
          for (const s of sortedExpenseSchedules) {
            if (s.effectiveYear * 12 + s.effectiveMonth <= monthVal) activeExpenseScheduleAtTarget = s;
          }
          
          let priorActual = 0;
          if (activeExpenseScheduleAtTarget) {
            let val = safeNumber(activeExpenseScheduleAtTarget.categories[categoryId], 0);
            if (val === -1) val = budgetForCategory;
            priorActual = val;
          }
          
          // If editing, subtract old impact so we only check the delta effect
          if (editingId) {
            const oldEvent = state.lifeEvents.find(ev => ev.id === editingId);
            if (oldEvent && oldEvent.spendingCategory === formData.spendingCategory) {
              const oldEventMonthValue = oldEvent.year * 12 + oldEvent.month;
              // If the old event's impact was active at `monthVal`, subtract it
              if (oldEventMonthValue < monthVal) {
                priorActual -= Math.abs(safeNumber(oldEvent.recurringMonthlyImpact));
                if (priorActual < 0) priorActual = 0;
              }
            }
          }

          const newActual = priorActual + Math.abs(formattedData.recurringMonthlyImpact);
          
          if (newActual > budgetForCategory) {
             const m = monthVal % 12 === 0 ? 12 : monthVal % 12;
             const y = Math.floor((monthVal - 1) / 12);
             setFormError(`Tác động dòng tiền (${Math.abs(formattedData.recurringMonthlyImpact)}tr) sẽ làm lố ngân sách Phân bổ của "${catName}" tại mốc tương lai tháng ${m}/${y}. (Thực chi cũ: ${formatTableMoneyVNDMillion(priorActual)} + Thêm mới: ${Math.abs(formattedData.recurringMonthlyImpact)}tr > Phân bổ: ${formatTableMoneyVNDMillion(budgetForCategory)})`);
             return;
          }
      }
    }

    // Virtual Check for overbudget based on cumulative remaining balance of that group
    if (formData.source && formPeriodBreakdown.length > 0) {
      const matchedGroup = formPeriodBreakdown.find(g => g.id === formData.source);
      if (matchedGroup) {
        let availableRemaining = matchedGroup.remaining || 0;
        
        // If editing, add back the old event's impact to get the "before" balance
        if (editingId) {
          const oldEvent = state.lifeEvents.find(ev => ev.id === editingId);
          if (oldEvent && oldEvent.source === formData.source) {
            const oldEventMonthValue = oldEvent.year * 12 + oldEvent.month;
            const targetMonthValue = formData.year * 12 + formData.month;
            if (oldEventMonthValue <= targetMonthValue) {
              availableRemaining += Math.abs(safeNumber(oldEvent.amount));
            }
          }
        }
        
        const newOneTimeImpact = Math.abs(safeNumber(formData.amount));
        const newEventCost = newOneTimeImpact;
        
        if (newEventCost > availableRemaining && newEventCost > 0) {
           setPendingEventData(formattedData);
           setPendingWarningInfo({
              sourceName: matchedGroup.name,
              overage: newEventCost - availableRemaining,
              month: formData.month,
              year: formData.year
           });
           setShowWarningDialog(true);
           return; // Intercept save
        }
      }
    }

    executeSave(formattedData);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa sự kiện cuộc đời này không?')) {
      deleteLifeEvent(id);
    }
  };

    const eventTypes: { value: LifeEvent['type']; label: string }[] = [
    { value: 'buy_property', label: 'Mua / Đổi nhà, chung cư' },
    { value: 'buy_car', label: 'Mua / Đổi xe ô tô, xe máy' },
    { value: 'child_birth', label: 'Sinh con / Chăm sóc mẹ và bé' },
    { value: 'education', label: 'Nuôi con ăn học / Đóng học phí' },
    { value: 'home_renovation', label: 'Sửa chữa / Cải tạo nhà cửa' },
    { value: 'wedding', label: 'Đám cưới / Đám hỏi' },
    { value: 'large_purchase', label: 'Mua sắm lớn (Ô tô/Nhà/Đất)' },
    { value: 'tech_gadget', label: 'Thiết bị công nghệ (Điện thoại, Laptop...)' },
    { value: 'home_appliances', label: 'Thiết bị gia dụng / Điện máy lớn' },
    { value: 'personal_development', label: 'Học tập / Phát triển bản thân' },
    { value: 'networking_festivals', label: 'Hiếu hỉ, Lễ Tết & Đối ngoại' },
    { value: 'vehicle_maintenance', label: 'Đại tu / Bảo dưỡng xe cộ lớn' },
    { value: 'pet_care', label: 'Nuôi dưỡng & Chăm sóc thú cưng' },
    { value: 'hobbies_sports', label: 'Sở thích, Thể thao & Giải trí lớn' },
    { value: 'business_venture', label: 'Góp vốn làm ăn / Khởi nghiệp' },
    { value: 'travel', label: 'Du lịch nghỉ dưỡng gia đình' },
    { value: 'medical', label: 'Biến cố y tế / Chữa bệnh' },
    { value: 'family_support', label: 'Hỗ trợ tài chính người thân' },
    { value: 'other', label: 'Sự kiện khác' },
  ];

  const sourceTypes = React.useMemo(() => {
    const expenseGroups = activeBudget?.rootGroups.filter(g => g.classification === 'expense') || [];
    const groups = expenseGroups.map(g => ({
      value: g.groupId,
      label: `Quỹ dư: ${g.name}`
    }));
    return [
      ...groups,
      { value: 'debt', label: 'Vay nợ' },
      { value: 'external', label: 'Nguồn tài trợ bên ngoài' },
    ];
  }, [activeBudget]);

  const getEventLabel = (type: string) => {
    switch (type) {
      case 'buy_property': return 'Mua nhà / BĐS';
      case 'buy_car': return 'Mua Ô tô / Xe máy';
      case 'child_birth': return 'Sinh con';
      case 'education': return 'Giáo dục / Học phí';
      case 'home_renovation': return 'Sửa nhà';
      case 'wedding': return 'Đám cưới / Đám hỏi';
      case 'large_purchase': return 'Mua sắm lớn';
      case 'tech_gadget': return 'Thiết bị công nghệ';
      case 'home_appliances': return 'Thiết bị gia dụng';
      case 'personal_development': return 'Phát triển bản thân';
      case 'networking_festivals': return 'Lễ Tết / Đối ngoại';
      case 'vehicle_maintenance': return 'Bảo dưỡng xe cộ';
      case 'pet_care': return 'Chăm sóc thú cưng';
      case 'hobbies_sports': return 'Sở thích & Giải trí';
      case 'business_venture': return 'Góp vốn / Khởi nghiệp';
      case 'travel': return 'Du lịch / Trải nghiệm';
      case 'medical': return 'Sự kiện y tế';
      case 'family_support': return 'Hỗ trợ người thân';
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
      case 'education': return <Briefcase className="w-5 h-5 text-white" />;
      case 'home_renovation': return <Home className="w-5 h-5 text-white" />;
      case 'wedding': return <HeartPulse className="w-5 h-5 text-white" />;
      case 'large_purchase': return <Gift className="w-5 h-5 text-white" />;
      case 'tech_gadget': return <Smartphone className="w-5 h-5 text-white" />;
      case 'home_appliances': return <Tv className="w-5 h-5 text-white" />;
      case 'personal_development': return <BookOpen className="w-5 h-5 text-white" />;
      case 'networking_festivals': return <Sparkles className="w-5 h-5 text-white" />;
      case 'vehicle_maintenance': return <Wrench className="w-5 h-5 text-white" />;
      case 'pet_care': return <Heart className="w-5 h-5 text-white" />;
      case 'hobbies_sports': return <Activity className="w-5 h-5 text-white" />;
      case 'business_venture': return <TrendingUp className="w-5 h-5 text-white" />;
      case 'travel': return <Plane className="w-5 h-5 text-white" />;
      case 'medical': return <HeartPulse className="w-5 h-5 text-white" />;
      case 'family_support': return <Gift className="w-5 h-5 text-white" />;
      default: return <CalendarRange className="w-5 h-5 text-white" />;
    }
  };

  // Filter events based on dashboard filter
  const filteredEventsForLedger = state.lifeEvents.filter(event => {
    if (dashboardFilter === 'all') return true;
    const groupId = event.spendingCategory ? event.spendingCategory.split('/')[0] : event.source;
    return groupId === dashboardFilter;
  });

  const currentObservedValue = currentObservedYear * 12 + currentObservedMonth;

  let currentMonthEventsCount = 0;
  let cumulativeEventsCount = 0;
  let currentMonthNetOneTime = 0;
  let cumulativeNetOneTime = 0;

  filteredEventsForLedger.forEach(e => {
    const eMonthValue = e.year * 12 + e.month;
    if (eMonthValue <= currentObservedValue) {
      cumulativeEventsCount++;
      cumulativeNetOneTime += safeNumber(e.amount);
      if (eMonthValue === currentObservedValue) {
        currentMonthEventsCount++;
        currentMonthNetOneTime += safeNumber(e.amount);
      }
    }
  });
  
  const sortedEvents = [...filteredEventsForLedger].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  return (
    <div className="space-y-6 relative">
      {/* Warning Dialog Modal */}
      {showWarningDialog && pendingWarningInfo && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-xl font-bold">Cảnh báo lạm chi</h3>
            </div>
            <p className="text-family-text mb-6">
              Sự kiện <strong className="text-blue-600">"{pendingEventData?.name}"</strong> sẽ làm quỹ <strong>"{pendingWarningInfo.sourceName}"</strong> bị lạm chi <strong className="text-red-500">{formatTableMoneyVNDMillion(pendingWarningInfo.overage)}</strong> trong tháng {pendingWarningInfo.month}/{pendingWarningInfo.year}.
              <br /><br />
              Bạn có muốn điều chỉnh lại ngân sách trước khi lưu không?
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowWarningDialog(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold border border-family-accent/20 text-family-textMuted hover:bg-family-accent/5 transition-colors"
              >
                Hủy bỏ (Để sửa)
              </button>
              <button 
                onClick={() => executeSave(pendingEventData)}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 shadow-md transition-all"
              >
                Vẫn tiếp tục lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-serif font-bold text-family-text flex items-center gap-3">
            <Milestone className="w-8 h-8 text-family-accent shrink-0" /> Quản lý Chi tiêu
            <HelpTooltip text="Ghi chép các khoản chi tiêu linh hoạt phát sinh ngoài kế hoạch (mua sắm lớn, du lịch, mua xe...) và đối chiếu với ngân sách hàng tháng để kiểm soát dòng tiền." />
          </h1>
          <p className="text-sm text-family-textMuted mt-1">
            Ghi chép các khoản chi tiêu và đối chiếu với ngân sách hàng tháng để kiểm soát tài chính chính xác.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <ObservationControls />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200">
        <button
          onClick={() => { setActiveTab('expense_overview'); }}
          className={`py-2 px-4 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'expense_overview' 
              ? 'border-family-accent text-family-accent' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Tổng quan
        </button>
        <button
          onClick={() => { setActiveTab('monthly_reconciliation'); }}
          className={`py-2 px-4 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'monthly_reconciliation' 
              ? 'border-family-accent text-family-accent' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Chi tiêu thường xuyên
        </button>
        <button
          onClick={() => { setActiveTab('timeline'); }}
          className={`py-2 px-4 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'timeline' 
              ? 'border-family-accent text-family-accent' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Chi tiêu linh hoạt
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
      </div>

      {activeTab === 'timeline' && (
        <div className="space-y-6">

                {/* Dashboard Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-white/80 border-family-accent/10">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-family-textMuted uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          TỔNG KHOẢN CHI LINH HOẠT
                          <HelpTooltip text="Tổng số các sự kiện, khoản chi linh hoạt tính đến tháng quan sát hiện tại." />
                        </p>
                        <div className="flex items-end gap-3 mt-1">
                          <h3 className="text-2xl font-bold text-family-text">
                            {cumulativeEventsCount} <span className="text-sm font-normal text-family-textMuted">(Lũy kế)</span>
                          </h3>
                        </div>
                        {currentMonthEventsCount > 0 && (
                           <p className="text-xs text-blue-600 mt-2 bg-blue-50/50 inline-block px-2 py-1 rounded-md">
                             +{currentMonthEventsCount} sự kiện trong tháng {currentObservedMonth}/{currentObservedYear}
                           </p>
                        )}
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
                          TÁC ĐỘNG 1 LẦN (NET)
                          <HelpTooltip text="Tổng số tiền tác động 1 lần (chi/thu) tính đến tháng quan sát hiện tại." />
                        </p>
                        <div className="flex items-end gap-3 mt-1">
                          <h3 className={`text-2xl font-bold ${cumulativeNetOneTime < 0 ? 'text-red-500' : cumulativeNetOneTime > 0 ? 'text-emerald-500' : 'text-family-text'}`}>
                            {cumulativeNetOneTime > 0 ? '+' : ''}{formatTableMoneyVNDMillion(cumulativeNetOneTime)}
                            <span className="text-sm font-normal text-family-textMuted ml-1">(Lũy kế)</span>
                          </h3>
                        </div>
                        {currentMonthNetOneTime !== 0 && (
                          <p className={`text-xs mt-2 inline-block px-2 py-1 rounded-md ${currentMonthNetOneTime < 0 ? 'text-red-600 bg-red-50/50' : 'text-emerald-600 bg-emerald-50/50'}`}>
                            Phát sinh tháng {currentObservedMonth}/{currentObservedYear}: {currentMonthNetOneTime > 0 ? '+' : ''}{formatTableMoneyVNDMillion(currentMonthNetOneTime)}
                          </p>
                        )}
                      </div>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${cumulativeNetOneTime < 0 ? 'bg-red-100 text-red-500' : cumulativeNetOneTime > 0 ? 'bg-emerald-100 text-emerald-500' : 'bg-gray-100 text-gray-400'}`}>
                        {cumulativeNetOneTime < 0 ? <TrendingDown className="w-6 h-6" /> : cumulativeNetOneTime > 0 ? <TrendingUp className="w-6 h-6" /> : <CalendarRange className="w-6 h-6" />}
                      </div>
                    </CardContent>
                  </Card>
                </div>


        </div>
      )}

      {/* Add / Edit Form Drawer */}
      {activeTab === 'timeline' && (isAdding || editingId) && (
        <>
          {formError && <WarningBox type="danger" message={formError} />}
          <Card className="border-family-accent/30 bg-family-bgDark/20 shadow-md transform transition-all mt-6">
          <CardHeader>
            <CardTitle>{isAdding ? 'Thêm khoản chi linh hoạt mới' : 'Chỉnh sửa khoản chi linh hoạt'}</CardTitle>
            <CardDescription>
              Chi tiêu linh hoạt là các khoản chi tiêu lớn một lần hoặc tạo ra dòng tiền dài hạn nằm ngoài ngân sách sinh hoạt cố định (Ví dụ: Mua đồ điện tử, du lịch, mua xe, sinh con...).
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
                    label="Tên khoản chi / sự kiện"
                    type="text"
                    placeholder="Ví dụ: Mua chung cư Vinhomes..."
                    value={formData.name}
                    onChange={(e) => { setFormData({ ...formData, name: e.target.value }); }}
                    required
                  />
                  <Select
                    label="Phân loại"
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
                      label="Số tiền tác động một lần (triệu VND) - CHI PHÍ"
                      type="number"
                      placeholder="Ví dụ: 800 (Mua xe ô tô)"
                      value={formData.amount === 0 ? 0 : (Math.abs(safeNumber(formData.amount)) || '')}
                      onChange={(e) => { setFormData({ ...formData, amount: Number(e.target.value) }); }}
                    />
                  </div>
                  <FundingSourceSelect
                    label="Nguồn chi trả"
                    value={formData.source}
                    onChange={(value) => { setFormData({ ...formData, source: value as any }); }}
                    targetPeriodKey={`${formData.year}-${String(formData.month).padStart(2, '0')}`}
                  />
                </div>
              </div>

              {/* Block 3: Recurring Impact & Reporting */}
              <div className="bg-family-bgDeep/10 border border-family-accent/10 rounded-xl p-4 shadow-sm space-y-4">
                <div className="border-b border-family-accent/10 pb-2 mb-2">
                  <h3 className="text-sm font-bold text-family-text flex items-center gap-2">Tác động Dòng tiền Lâu dài & Báo cáo</h3>
                  <p className="text-[11px] text-family-textMuted mt-1">Chi phí phát sinh <strong>đều đặn mỗi tháng</strong> sau khoản chi này. Khoản này sẽ được tự động cộng dồn (xuyên thấu) vào bảng Chi tiêu thường xuyên hàng tháng (Bắt đầu từ tháng tiếp theo).</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Tác động dòng tiền tháng (triệu/tháng) - TĂNG CHI"
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
                      options={[{value: '', label: '-- Tự động trừ vào Dự phòng --'}, ...spendingCategoryOptions]}
                    />
                    <p className="text-[10px] text-family-accent mt-1.5 ml-1 italic font-medium leading-tight">* Tự động xuyên thấu cộng dồn số tiền này vào đúng hạng mục đã chọn trong Bảng Chi Tiêu Thường Xuyên ở tất cả các mốc tương lai.</p>
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
                          id="isMilestone"
                          checked={formData.isMilestone}
                          onChange={(e) => { setFormData({ ...formData, isMilestone: e.target.checked }); }}
                          className="w-4 h-4 text-family-accent border-gray-300 rounded focus:ring-family-accent cursor-pointer"
                        />
                        <label htmlFor="isMilestone" className="ml-2 block text-sm font-bold text-family-text cursor-pointer">
                          Đánh dấu là Cột mốc quan trọng
                        </label>
                      </div>
                      <p className="text-[10px] text-family-textMuted mt-1 ml-6 leading-tight">Khoản chi này sẽ được đánh dấu nổi bật (highlight) trên Dòng thời gian sự kiện (Timeline).</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 items-center">
                {!isWithinObservationPeriod(formData.month, formData.year, selectedPeriodKey) && (
                  <span className="text-red-500 text-xs flex-1 text-right">{getPeriodGuardMessage(selectedPeriodKey)}</span>
                )}
                <Button variant="outline" type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} className="px-6">Hủy</Button>
                <Button type="submit" className="px-6 font-bold" disabled={!isWithinObservationPeriod(formData.month, formData.year, selectedPeriodKey)}>Lưu khoản chi</Button>
              </div>
            </form>
          </CardContent>
        </Card>
        </>
      )}


      {activeTab === 'expense_overview' && (
        <div className="space-y-6">
          <ExpenseDashboard filter={dashboardFilter} setFilter={setDashboardFilter} />
          
          <div className="grid grid-cols-1 gap-6">
            <LiquidityBreakdownTable mode="monthly" />
            <LiquidityBreakdownTable mode="cumulative" />
          </div>
        </div>
      )}

      {activeTab === 'monthly_reconciliation' && (
        <div className="space-y-6">
          <ExpenseScheduleView />
        </div>
      )}
      
      {activeTab === 'savings_liquidity' && <SavingsAndLiquidityView />}

      {/* Timeline View */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 mb-1.5">
                  Dòng thời gian chi tiêu & sự kiện
                  <HelpTooltip text="Theo dõi và quản lý toàn bộ các khoản chi tiêu linh hoạt được sắp xếp theo thời gian." />
                </CardTitle>
                <CardDescription>
                  Bức tranh toàn cảnh về các khoản chi tiêu linh hoạt được sắp xếp theo thời gian.
                </CardDescription>
              </div>
              <Button onClick={handleAddClick} className="gap-2 text-xs h-9 shrink-0">
                <Plus className="w-4 h-4 shrink-0" /> Thêm khoản chi linh hoạt
              </Button>
            </div>
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
                          title="Xóa khoản chi"
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
            <EmptyState title="Chưa có khoản chi linh hoạt nào" description="Nhấn nút Thêm khoản chi linh hoạt ở trên để bắt đầu." />
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

