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
import { useAppState } from '../hooks/useAppState';
import { analyzeExpense } from '../engines/expenseEngine';
import { EmptyState } from '../components/ui/EmptyState';
import { 
  Milestone, CalendarRange, Plus, Trash2, Edit3, 
  Home, Car, Baby, HeartPulse, Gift, Briefcase, Plane, Wallet, TrendingUp, TrendingDown, AlertTriangle,
  Smartphone, Tv, BookOpen, Sparkles, Wrench, Heart, Activity, PiggyBank, CreditCard, ArrowDownRight, ArrowUpRight, Receipt, Landmark, Filter, Banknote, BrainCircuit
} from 'lucide-react';
import { ExpenseDashboard } from '../components/expense/ExpenseDashboard';
import { ExpenseScheduleView } from '../components/expense/ExpenseScheduleView';
import { LiquidityBreakdownTable } from '../components/expense/LiquidityBreakdownTable';
import { SavingsAndLiquidityView } from '../components/expense/SavingsAndLiquidityView';
import { ObservationControls } from '../components/ui/ObservationControls';

import type { BudgetGroup } from '../types/budget';
import type { LifeEvent } from '../types/finance';
import { SmartAllocationAdvisorModal } from '../components/ui/SmartAllocationAdvisorModal';
import { runProjection } from '../engines/projectionEngine';
import type { AllocationSnapshot } from '../engines/SmartAllocationAdvisor';

export const LifeStages: React.FC = () => {
  const { state, addLifeEvent, updateLifeEvent, deleteLifeEvent, selectedPeriodKey } = useAppContext();
  
  // Dashboard filter state
  const [dashboardFilter, setDashboardFilter] = useState<BudgetGroup | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'timeline' | 'monthly_reconciliation' | 'savings_liquidity' | 'expense_overview'>('expense_overview');
  
  // Timeline filter state
  const [timelineFilterType, setTimelineFilterType] = useState<string>('all');
  const [timelineFilterSource, setTimelineFilterSource] = useState<string>('all');

  // Local state for event form editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [pendingEventData, setPendingEventData] = useState<any>(null);
  const [pendingWarningInfo, setPendingWarningInfo] = useState<{sourceName: string, overage: number, month: number, year: number} | null>(null);

  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [advisorSnapshot, setAdvisorSnapshot] = useState<AllocationSnapshot | null>(null);


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
    recurringMonthlyImpactFund: 0,
    recurringDurationMonthsFund: 0,
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

  const computedFormPeriodKey = `${formData.year}-${String(formData.month).padStart(2, '0')}`;
  const { liquidityBreakdownData: formPeriodBreakdown } = useLiquidityBreakdown('cumulative', computedFormPeriodKey);

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
      recurringMonthlyImpactFund: event.recurringMonthlyImpactFund || 0,
      recurringDurationMonthsFund: event.recurringDurationMonthsFund || 0,
      recurringDurationMonths: event.recurringDurationMonths || 0,
      recurringFundingSource: event.recurringFundingSource || '',
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
      recurringDurationMonths: 0,
      recurringMonthlyImpactFund: 0,
      recurringDurationMonthsFund: 0,
      recurringFundingSource: '',
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
    
    if (!isWithinObservationPeriod(formData.month, formData.year, effectivePeriodKey)) {
      setFormError(getPeriodGuardMessage(effectivePeriodKey));
      return;
    }
    
    const oneTimeAmount = Math.abs(safeNumber(formData.amount));
    const recurringAmount = Math.abs(safeNumber(formData.recurringMonthlyImpact));
    const recurringAmountFund = Math.abs(safeNumber(formData.recurringMonthlyImpactFund));

    if (oneTimeAmount === 0 && recurringAmount === 0 && recurringAmountFund === 0) {
      setFormError('Vui lòng nhập ít nhất một khoản tác động dòng tiền (Một lần / Ngân sách / Quỹ dư) để tạo khoản chi.');
      return;
    }

    const formattedData = {
      ...formData,
      amount: -oneTimeAmount,
      recurringMonthlyImpact: -recurringAmount,
      recurringMonthlyImpactFund: -recurringAmountFund
    };

    let targetMonth = formData.month + 1;
    let targetYear = formData.year;
    if (targetMonth > 12) {
      targetMonth = 1;
      targetYear += 1;
    }
    const targetMonthValue = targetYear * 12 + targetMonth;

    // --- ONE-TIME AMOUNT VALIDATION ---
    if (oneTimeAmount > 0 && formData.source) {
      const sourceGroup = formPeriodBreakdown.find(g => g.id === formData.source);
      if (sourceGroup) {
        let availableRemaining = sourceGroup.remaining || 0;
        if (editingId) {
          const oldEvent = state.lifeEvents.find(ev => ev.id === editingId);
          if (oldEvent && oldEvent.source === formData.source) {
            availableRemaining += Math.abs(safeNumber(oldEvent.amount));
          }
        }
        if (oneTimeAmount > availableRemaining) {
          setFormError(`Tác động một lần (${formatTableMoneyVNDMillion(oneTimeAmount)}) vượt quá số dư khả dụng hiện tại của Nguồn chi trả (${formatTableMoneyVNDMillion(availableRemaining)}). Vui lòng điều chỉnh số tiền tác động hoặc chọn quỹ khác có nhiều tiền hơn.`);
          return;
        }
      }
    }

    // --- TRACK A: Budget Deduction Validation ---
    if (formattedData.recurringMonthlyImpact < 0 && recurringAmount > 0) {
      const duration = safeNumber(formData.recurringDurationMonths, 0);
      if (duration <= 0) {
        setFormError('Vui lòng nhập "Số kỳ tác động" (phải lớn hơn 0) cho khoản chi Ngân sách.');
        return;
      }
      
      if (formData.spendingCategory) {
        const endMonthValue = targetMonthValue + duration;
        const parts = formData.spendingCategory.split('/');
        const categoryId = parts.length > 1 ? parts[1] : parts[0];

        const monthsToCheck = new Set<number>();
        monthsToCheck.add(targetMonthValue);
        (state.expenseSchedule || []).forEach(s => {
            const val = s.effectiveYear * 12 + s.effectiveMonth;
            if (val >= targetMonthValue && val < endMonthValue) monthsToCheck.add(val);
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
            
            // Add impact of ALL OTHER active life events on this category
            state.lifeEvents.forEach(ev => {
              if (ev.id === editingId) return;
              if (ev.spendingCategory === formData.spendingCategory && ev.recurringMonthlyImpact) {
                let evStartMonth = ev.month + 1;
                let evStartYear = ev.year;
                if (evStartMonth > 12) { evStartMonth = 1; evStartYear += 1; }
                const evStartVal = evStartYear * 12 + evStartMonth;
                const dur = safeNumber(ev.recurringDurationMonths) || 1200;
                const evEndVal = evStartVal + dur - 1;
                
                if (monthVal >= evStartVal && monthVal <= evEndVal) {
                  priorActual += Math.abs(safeNumber(ev.recurringMonthlyImpact));
                }
              }
            });

            const newActual = priorActual + Math.abs(formattedData.recurringMonthlyImpact);
            
            if (newActual > budgetForCategory) {
               const m = monthVal % 12 === 0 ? 12 : monthVal % 12;
               const y = Math.floor((monthVal - 1) / 12);
               setFormError(`Tác động Ngân sách (${Math.abs(formattedData.recurringMonthlyImpact)}tr) sẽ làm lố phân bổ của "${catName}" tại mốc tháng ${m}/${y}. (Thực chi cũ: ${formatTableMoneyVNDMillion(priorActual)} + Thêm mới: ${Math.abs(formattedData.recurringMonthlyImpact)}tr > Phân bổ: ${formatTableMoneyVNDMillion(budgetForCategory)})`);
               return;
            }
        }
      }
    }

    // --- TRACK B: Fund Deduction Validation ---
    if (formattedData.recurringMonthlyImpactFund < 0 && recurringAmountFund > 0) {
      const durationFund = safeNumber(formData.recurringDurationMonthsFund, 0);
      if (durationFund <= 0) {
        setFormError('Vui lòng nhập "Số kỳ tác động" (phải lớn hơn 0) cho khoản chi từ Quỹ dư.');
        return;
      }
      if (!formData.recurringFundingSource) {
        setFormError('Vui lòng chọn Nguồn chi trả cho khoản chi từ Quỹ dư.');
        return;
      }
      
      const endMonthValueFund = targetMonthValue + durationFund;
      const matchedGroup = formPeriodBreakdown.find(g => g.id === formData.recurringFundingSource);
      
      if (matchedGroup) {
        let availableRemaining = matchedGroup.remaining || 0;
        if (editingId) {
          const oldEvent = state.lifeEvents.find(ev => ev.id === editingId);
          if (oldEvent) {
            if (oldEvent.source === formData.recurringFundingSource) {
              availableRemaining += Math.abs(safeNumber(oldEvent.amount));
            }
            if (oldEvent.recurringFundingSource === formData.recurringFundingSource) {
              const oldAmount = Math.abs(safeNumber(oldEvent.recurringMonthlyImpactFund));
              const oldDuration = safeNumber(oldEvent.recurringDurationMonthsFund);
              if (oldDuration > 0) {
                availableRemaining += oldAmount * oldDuration;
              }
            }
          }
        }

        const isSameSource = formData.source === formData.recurringFundingSource;
        let cashAfterOneTime = availableRemaining;
        if (isSameSource && oneTimeAmount > 0) {
          cashAfterOneTime = Math.max(0, availableRemaining - oneTimeAmount);
        }
        
        const trackAImpact = recurringAmount;
        const lookupGroupId = formData.recurringFundingSource.replace('group_', '');
        const isSameCategoryGroup = formData.spendingCategory?.split('/')[0] === lookupGroupId;

        let simulatedCash = cashAfterOneTime;
        let didRunOut = false;
        let breakingMonthStr = '';

        for (let i = 1; i <= durationFund; i++) {
            let m = formData.month + i;
            let y = formData.year;
            while (m > 12) {
                m -= 12;
                y += 1;
            }
            const pKey = `${y}-${String(m).padStart(2, '0')}`;
            const dbRow = state.resolvedMonthlyDb?.find(r => r.periodKey === pKey);
            let periodSurplus = 0;
            if (dbRow) {
                const budget = dbRow.budgetAmounts?.[lookupGroupId] || 0;
                const actual = dbRow.actualExpenseByGroup?.[lookupGroupId] || 0;
                periodSurplus = Math.max(0, budget - actual);
                if (isSameCategoryGroup && trackAImpact > 0) {
                    periodSurplus = Math.max(0, periodSurplus - trackAImpact);
                }
            }
            
            if (!didRunOut) {
                simulatedCash += periodSurplus;
                if (simulatedCash >= recurringAmountFund) {
                    simulatedCash -= recurringAmountFund;
                } else {
                    didRunOut = true;
                    breakingMonthStr = `${String(m).padStart(2, '0')}/${y}`;
                }
            }
        }

        if (didRunOut) {
          setFormError(`Thanh khoản gãy! Phương án rủi ro cao. Quỹ "${matchedGroup.name}" không đủ sức gánh vác chi phí và sẽ bắt đầu âm tiền từ tháng ${breakingMonthStr}. Vui lòng kéo dài số kỳ tác động, chọn quỹ khác, hoặc giảm số tiền tác động.`);
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

  const getCategoryLabel = (catKey: string) => {
    if (!catKey) return '';
    const parts = catKey.split('/');
    const groupId = parts[0];
    const childId = parts.length > 1 ? parts[1] : parts[0];
    
    const group = activeBudget?.rootGroups.find(g => g.groupId === groupId);
    if (!group) return catKey;
    const child = group.children?.find(c => c.id === childId);
    return `${group.name} / ${child ? child.name : childId}`;
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
                        <div className="text-xs font-semibold text-family-textMuted uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          TỔNG KHOẢN CHI LINH HOẠT
                          <HelpTooltip text="Tổng số các sự kiện, khoản chi linh hoạt tính đến tháng quan sát hiện tại." />
                        </div>
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
                        <div className="text-xs font-semibold text-family-textMuted uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          TÁC ĐỘNG 1 LẦN (NET)
                          <HelpTooltip text="Tổng số tiền tác động 1 lần (chi/thu) tính đến tháng quan sát hiện tại." />
                        </div>
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

              {/* Block 3: Recurring Impact & Reporting (Dual-Track) */}
              <div className="bg-family-bgDeep/10 border border-family-accent/10 rounded-xl p-4 shadow-sm space-y-6">
                <div className="border-b border-family-accent/10 pb-2">
                  <h3 className="text-sm font-bold text-family-text flex items-center gap-2">Tác động dòng tiền hằng tháng (Sau tháng diễn ra)</h3>
                  <p className="text-[11px] text-family-textMuted mt-1">Hệ thống hỗ trợ nhập độc lập 2 luồng chi trả. Nếu không nhập số tiền hoặc = 0, luồng đó sẽ bị bỏ qua.</p>
                </div>
                
                {/* Track A: Budget */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-family-accent rounded-full"></div>
                    <h4 className="text-sm font-bold text-family-text flex items-center gap-2">
                      A. Trừ từ Ngân sách Phân bổ
                      <HelpTooltip text={
                        <div className="space-y-2">
                          <p><strong>Cấp độ cảnh báo Ngân sách:</strong></p>
                          <ul className="list-disc pl-4 space-y-1 text-[11px]">
                            <li><span className="text-emerald-600 font-bold">🟢 Cấp 1 (&lt; 80%)</span>: Ngân sách dư dả, chi tiêu an toàn.</li>
                            <li><span className="text-yellow-600 font-bold">🟡 Cấp 2 (80% - 100%)</span>: Ngân sách sát nút, cần thắt chặt chi tiêu khác.</li>
                            <li><span className="text-red-600 font-bold">❌ Cấp 3 (&gt; 100%)</span>: Vỡ kế hoạch, hệ thống sẽ chặn không cho lưu.</li>
                          </ul>
                        </div>
                      } />
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Số tiền (triệu/tháng)"
                      type="number"
                      placeholder="VD: 4 (Tăng chi)"
                      value={Math.abs(safeNumber(formData.recurringMonthlyImpact)) || ''}
                      onChange={(e) => { setFormData({ ...formData, recurringMonthlyImpact: Number(e.target.value) }); }}
                    />
                    <Input
                      label="Số kỳ tác động *"
                      type="number"
                      min={0}
                      placeholder="VD: 12"
                      value={safeNumber(formData.recurringDurationMonths) || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setFormData({ ...formData, recurringDurationMonths: val < 0 ? 0 : val });
                      }}
                    />
                    <div>
                      <Select
                        label="Lớp Tiêu sản"
                        value={formData.spendingCategory || ''}
                        onChange={(e) => { setFormData({ ...formData, spendingCategory: e.target.value }); }}
                        options={[{value: '', label: '-- Tự động trừ vào Dự phòng --'}, ...spendingCategoryOptions]}
                      />
                    </div>
                  </div>
                  {/* Track A warnings */}
                  {(() => {
                    const impact = Math.abs(safeNumber(formData.recurringMonthlyImpact));
                    const duration = safeNumber(formData.recurringDurationMonths);
                    if (impact > 0 && duration > 0) {
                      let trackAAdvice: React.ReactNode = null;
                      
                      let targetMonth = formData.month + 1;
                      let targetYear = formData.year;
                      if (targetMonth > 12) {
                        targetMonth = 1;
                        targetYear += 1;
                      }
                      
                      if (formData.spendingCategory) {
                        const targetMonthValue = targetYear * 12 + targetMonth;
                        const parts = formData.spendingCategory.split('/');
                        const categoryId = parts.length > 1 ? parts[1] : parts[0];
                        
                        const sortedSchedules = [...state.budgetSchedule].sort((a, b) => (a.effectiveYear * 12 + a.effectiveMonth) - (b.effectiveYear * 12 + b.effectiveMonth));
                        const sortedExpenseSchedules = [...(state.expenseSchedule || [])].sort((a, b) => (a.effectiveYear * 12 + a.effectiveMonth) - (b.effectiveYear * 12 + b.effectiveMonth));
                        const sortedIncomes = [...state.incomeSchedule].sort((a,b) => (a.effectiveYear * 12 + a.effectiveMonth) - (b.effectiveYear * 12 + b.effectiveMonth));
                        
                        let activeBudgetAtTarget = null;
                        for (const b of sortedSchedules) {
                          if (b.effectiveYear * 12 + b.effectiveMonth <= targetMonthValue) activeBudgetAtTarget = b;
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
                                       if (inc.effectiveYear * 12 + inc.effectiveMonth <= targetMonthValue) activeIncome = inc.incomeMonthly;
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
                          if (s.effectiveYear * 12 + s.effectiveMonth <= targetMonthValue) activeExpenseScheduleAtTarget = s;
                        }
                        
                        let priorActual = 0;
                        if (activeExpenseScheduleAtTarget) {
                          let val = safeNumber(activeExpenseScheduleAtTarget.categories[categoryId], 0);
                          if (val === -1) val = budgetForCategory;
                          priorActual = val;
                        }
                        
                        // Add impact of ALL OTHER active life events on this category
                        state.lifeEvents.forEach(ev => {
                          if (ev.id === editingId) return;
                          if (ev.spendingCategory === formData.spendingCategory && ev.recurringMonthlyImpact) {
                            let evStartMonth = ev.month + 1;
                            let evStartYear = ev.year;
                            if (evStartMonth > 12) { evStartMonth = 1; evStartYear += 1; }
                            const evStartVal = evStartYear * 12 + evStartMonth;
                            const dur = safeNumber(ev.recurringDurationMonths) || 1200;
                            const evEndVal = evStartVal + dur - 1;
                            
                            if (targetMonthValue >= evStartVal && targetMonthValue <= evEndVal) {
                              priorActual += Math.abs(safeNumber(ev.recurringMonthlyImpact));
                            }
                          }
                        });
                        
                        const newActual = priorActual + impact;
                        const fillRatio = budgetForCategory > 0 ? (newActual / budgetForCategory) * 100 : (newActual > 0 ? Infinity : 0);
                        const isOverBudget = newActual > budgetForCategory;
                        
                        let trackAType: 'safe' | 'warning' | 'error' = 'safe';
                        let trackATitle = '';
                        let trackAAdviceText = '';
                        
                        if (fillRatio < 80) {
                            trackAType = 'safe';
                            trackATitle = `🟢 Cấp độ 1 (Tối ưu): Ngân sách dư dả`;
                            trackAAdviceText = `Giai đoạn an toàn. Khoản chi này đẩy mức tiêu thụ ngân sách lên ${fillRatio.toFixed(1)}%, hoàn toàn nằm trong kiểm soát.`;
                        } else if (fillRatio <= 100) {
                            trackAType = 'warning';
                            trackATitle = `🟡 Cấp độ 2 (Chú ý): Sát nút giới hạn`;
                            trackAAdviceText = `Khoản chi này đẩy ngân sách lên mức ${fillRatio.toFixed(1)}%. Bạn cần thắt lưng buộc bụng các khoản ăn uống/sinh hoạt khác để không bị lố.`;
                        } else {
                            trackAType = 'error';
                            trackATitle = `❌ Cấp độ 3 (Vỡ kế hoạch): Đã lố ngân sách!`;
                            trackAAdviceText = `Rủi ro vỡ Kế hoạch Ngân sách! Khoản chi đẩy mức tiêu thụ lên tới ${fillRatio.toFixed(1)}%. 👉 Lời khuyên: Giảm tiền tác động ngân sách, chọn lớp tiêu sản khác, hoặc chia nhỏ số kỳ.`;
                        }
                        
                        trackAAdvice = (
                          <div className={`mt-2 border rounded-lg px-3 py-2 ${
                            trackAType === 'safe' ? 'bg-emerald-50/50 border-emerald-200' : 
                            trackAType === 'warning' ? 'bg-yellow-50/80 border-yellow-200' : 
                            'bg-red-50/80 border-red-200'
                          }`}>
                            <p className={`text-xs font-bold mb-1 ${
                              trackAType === 'safe' ? 'text-emerald-700' : 
                              trackAType === 'warning' ? 'text-yellow-700' : 
                              'text-red-700'
                            }`}>
                              {trackATitle}
                            </p>
                            <p className={`text-[11px] leading-relaxed ${
                              trackAType === 'safe' ? 'text-emerald-600/90' : 
                              trackAType === 'warning' ? 'text-yellow-700/90' : 
                              'text-red-600/90'
                            }`}>
                              Phân tích từ <strong>Tháng {targetMonth}/{targetYear}</strong> đối với "{catName}":
                              <br/>• Ngân sách phân bổ: <strong>{formatTableMoneyVNDMillion(budgetForCategory)}</strong>
                              <br/>• Đang thực chi hiện tại: <strong>{formatTableMoneyVNDMillion(priorActual)}</strong>
                              <br/>• Cộng thêm khoản mới ({formatTableMoneyVNDMillion(impact)}) ➔ Tổng thực chi dự kiến: <strong>{formatTableMoneyVNDMillion(newActual)}</strong>.
                              <span className="block mt-1.5 font-medium">
                                {trackAAdviceText}
                              </span>
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="flex flex-col gap-1">
                          <div className="bg-blue-50/50 border border-blue-200/50 rounded-lg px-3 py-2">
                            <p className="text-xs text-blue-700 font-medium">
                              📊 Tổng chi phí Ngân sách: <strong>{formatTableMoneyVNDMillion(impact * duration)}</strong> 
                              {' '}(= {impact}tr × {duration} kỳ)
                            </p>
                          </div>
                          {trackAAdvice}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="border-t border-family-accent/10"></div>

                {/* Track B: Fund */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                    <h4 className="text-sm font-bold text-family-text flex items-center gap-2">
                      B. Tác động Quỹ thanh khoản sinh hoạt
                      <HelpTooltip text={
                        <div className="space-y-2">
                          <p><strong>Cấp độ cảnh báo Dòng tiền:</strong></p>
                          <ul className="list-disc pl-4 space-y-1 text-[11px]">
                            <li><span className="text-emerald-600 font-bold">🟢 Cấp 1 (&lt; 30%)</span>: An toàn tuyệt đối, không ảnh hưởng quỹ.</li>
                            <li><span className="text-yellow-600 font-bold">🟡 Cấp 2 (30% - 70%)</span>: Đáng cân nhắc, làm giảm tốc độ tích luỹ quỹ.</li>
                            <li><span className="text-orange-600 font-bold">🟠 Cấp 3 (70% - 100%)</span>: Báo động đỏ, vét gần sạch quỹ, rủi ro cao.</li>
                            <li><span className="text-red-600 font-bold">❌ Cấp 4 (&gt; 100%)</span>: Gãy thanh khoản, dòng tiền âm, hệ thống chặn lưu.</li>
                          </ul>
                        </div>
                      } />
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Số tiền (triệu/tháng)"
                      type="number"
                      placeholder="VD: 10 (Trả góp)"
                      value={Math.abs(safeNumber(formData.recurringMonthlyImpactFund)) || ''}
                      onChange={(e) => { setFormData({ ...formData, recurringMonthlyImpactFund: Number(e.target.value) }); }}
                    />
                    <Input
                      label="Số kỳ tác động *"
                      type="number"
                      min={0}
                      placeholder="VD: 24"
                      value={safeNumber(formData.recurringDurationMonthsFund) || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setFormData({ ...formData, recurringDurationMonthsFund: val < 0 ? 0 : val });
                      }}
                    />
                    <div>
                      <FundingSourceSelect
                        label="Nguồn Quỹ dư"
                        value={formData.recurringFundingSource || ''}
                        onChange={(value) => { setFormData({ ...formData, recurringFundingSource: value as any }); }}
                        targetPeriodKey={`${formData.year}-${String(formData.month).padStart(2, '0')}`}
                        allowEmpty={true}
                        emptyLabel="-- Chọn quỹ --"
                      />
                    </div>
                  </div>
                  {/* Track B warnings */}
                  {(() => {
                    const impact = Math.abs(safeNumber(formData.recurringMonthlyImpactFund));
                    const duration = safeNumber(formData.recurringDurationMonthsFund);
                    if (impact > 0 && duration > 0) {
                      const totalCost = impact * duration;
                      let expertAdvice: { content: React.ReactNode, type: 'safe' | 'warning' | 'critical' | 'error' } | null = null;
                      if (formData.recurringFundingSource) {
                        const matchedGroup = formPeriodBreakdown.find(g => g.id === formData.recurringFundingSource);
                        if (matchedGroup) {
                          let availableRemaining = matchedGroup.remaining || 0;
                          if (editingId) {
                            const oldEvent = state.lifeEvents.find(ev => ev.id === editingId);
                            if (oldEvent) {
                              const selMonthValue = formData.year * 12 + formData.month;
                              
                              // Refund recurring impact
                              if (oldEvent.recurringFundingSource === formData.recurringFundingSource && oldEvent.recurringMonthlyImpactFund) {
                                let startMonth = oldEvent.month + 1;
                                let startYear = oldEvent.year;
                                if (startMonth > 12) { startMonth = 1; startYear += 1; }
                                const startMonthValue = startYear * 12 + startMonth;
                                const durationEvt = oldEvent.recurringDurationMonthsFund || 0;
                                const endMonthValue = durationEvt > 0 ? startMonthValue + durationEvt : Infinity;
                                
                                const effectiveEnd = Math.min(selMonthValue + 1, endMonthValue);
                                const activeMonths = Math.max(0, effectiveEnd - startMonthValue);
                                if (activeMonths > 0) {
                                  availableRemaining -= (oldEvent.recurringMonthlyImpactFund * activeMonths);
                                }
                              }
                              
                              // Refund one-time impact
                              if (oldEvent.source === formData.recurringFundingSource && oldEvent.amount) {
                                const eMonthValue = oldEvent.year * 12 + oldEvent.month;
                                if (eMonthValue <= selMonthValue) {
                                  availableRemaining -= oldEvent.amount;
                                }
                              }
                            }
                          }

                          // Expert Financial Analysis: Calculate Runway at Track B start
                          const oneTimeAmount = Math.abs(safeNumber(formData.amount));
                          const isSameSource = formData.source === formData.recurringFundingSource;
                          
                          let cashAfterOneTime = availableRemaining;
                          let upfrontShortfall = 0;
                          let didRunOut = false;
                          
                          if (isSameSource && oneTimeAmount > 0) {
                            cashAfterOneTime = availableRemaining - oneTimeAmount;
                            if (cashAfterOneTime < 0) {
                                upfrontShortfall = Math.abs(cashAfterOneTime);
                                cashAfterOneTime = 0;
                                didRunOut = true;
                            }
                          }
                          
                          const trackAImpact = Math.abs(safeNumber(formData.recurringMonthlyImpact));
                          const lookupGroupId = formData.recurringFundingSource?.replace('group_', '') || '';
                          const isSameCategoryGroup = formData.spendingCategory?.split('/')[0] === lookupGroupId;

                          // True Liquidity Simulation over `duration` periods
                          let simulatedCash = cashAfterOneTime;
                          let coveredPeriods = 0;
                          let totalSurplusOverDuration = 0;
                          let traceLines: string[] = [];

                          for (let i = 1; i <= duration; i++) {
                              let m = formData.month + i;
                              let y = formData.year;
                              while (m > 12) {
                                  m -= 12;
                                  y += 1;
                              }
                              const pKey = `${y}-${String(m).padStart(2, '0')}`;
                              const dbRow = state.resolvedMonthlyDb?.find(r => r.periodKey === pKey);
                              let periodSurplus = 0;
                              let budget = 0;
                              let actual = 0;
                              if (dbRow) {
                                  budget = dbRow.budgetAmounts?.[lookupGroupId] || 0;
                                  actual = dbRow.actualExpenseByGroup?.[lookupGroupId] || 0;
                                  
                                  let oldTrackAImpact = 0;
                                  if (editingId) {
                                      const oldEvent = state.lifeEvents.find(ev => ev.id === editingId);
                                      if (oldEvent && oldEvent.spendingCategory && oldEvent.recurringMonthlyImpact) {
                                          const oldGroup = oldEvent.spendingCategory.split('/')[0];
                                          if (oldGroup === lookupGroupId) {
                                              let evStartMonth = oldEvent.month + 1;
                                              let evStartYear = oldEvent.year;
                                              if (evStartMonth > 12) { evStartMonth = 1; evStartYear += 1; }
                                              const evStartVal = evStartYear * 12 + evStartMonth;
                                              const dur = safeNumber(oldEvent.recurringDurationMonths) || 1200;
                                              const evEndVal = evStartVal + dur - 1;
                                              const currentVal = y * 12 + m;
                                              if (currentVal >= evStartVal && currentVal <= evEndVal) {
                                                  oldTrackAImpact = Math.abs(safeNumber(oldEvent.recurringMonthlyImpact));
                                              }
                                          }
                                      }
                                  }
                                  actual -= oldTrackAImpact;
                                  
                                  periodSurplus = budget - actual;
                                  if (isSameCategoryGroup && trackAImpact > 0) {
                                      periodSurplus = periodSurplus - trackAImpact;
                                  }
                              }
                              
                              // Subtract Sinking Fund deductions
                              let sinkingFundImpact = 0;
                              (state.sinkingFunds || []).forEach(fund => {
                                  if (fund.status !== 'active') return;
                                  if (fund.sourceOfFund === `expense_surplus_${formData.recurringFundingSource}`) {
                                      const startMonthValue = fund.startYear * 12 + fund.startMonth;
                                      const currentMonthValue = y * 12 + m;
                                      if (currentMonthValue >= startMonthValue) {
                                          if (currentMonthValue === startMonthValue) {
                                              sinkingFundImpact -= fund.initialDeposit || 0;
                                          }
                                          const contrib = fund.periodConfigs?.[pKey]?.contribution !== undefined ? fund.periodConfigs[pKey].contribution : fund.monthlyContribution;
                                          sinkingFundImpact -= contrib || 0;
                                      }
                                  }
                              });
                              
                              periodSurplus += sinkingFundImpact;
                              totalSurplusOverDuration += periodSurplus;
                              
                              if (!didRunOut) {
                                  const oldCash = simulatedCash;
                                  simulatedCash += periodSurplus;
                                  if (simulatedCash >= impact) {
                                      simulatedCash -= impact;
                                      coveredPeriods++;
                                      if (i <= 3 || i === duration) {
                                          traceLines.push(`- Kỳ ${i} (Tháng ${m}/${y}): Vốn đệm (${formatTableMoneyVNDMillion(oldCash)}) + Thực dư (${formatTableMoneyVNDMillion(periodSurplus)}) - Trừ tiền (${formatTableMoneyVNDMillion(impact)}) ➔ Còn dư: ${formatTableMoneyVNDMillion(simulatedCash)}`);
                                      } else if (i === 4) {
                                          traceLines.push(`- ... (Các kỳ ${i} đến ${duration - 1} dòng tiền vẫn đủ chi trả) ...`);
                                      }
                                  } else {
                                      didRunOut = true;
                                      traceLines.push(`- ⚠️ Kỳ ${i} (Tháng ${m}/${y}): Vốn đệm (${formatTableMoneyVNDMillion(oldCash)}) + Thực dư (${formatTableMoneyVNDMillion(periodSurplus)}) = ${formatTableMoneyVNDMillion(simulatedCash)} ➔ BÙM! Quỹ cạn kiệt, không đủ trừ ${formatTableMoneyVNDMillion(impact)}.`);
                                  }
                              }
                          }

                          let text1 = `**1. Khởi điểm (Vốn đệm):**\nTính đến Tháng ${formData.month}/${formData.year}, Quỹ [${matchedGroup.name}] đang có **${formatTableMoneyVNDMillion(availableRemaining)}** làm vốn đệm. `;
                          if (isSameSource && oneTimeAmount > 0) {
                              if (upfrontShortfall > 0) {
                                  text1 += `Tuy nhiên, quỹ KHÔNG ĐỦ để trả trước 1 lần ${formatTableMoneyVNDMillion(oneTimeAmount)} (Thiếu ${formatTableMoneyVNDMillion(upfrontShortfall)}). Phần trả trước ngốn sạch số dư hiện có, quỹ về 0.\n`;
                              } else {
                                  text1 += `Sau khi trích ${formatTableMoneyVNDMillion(oneTimeAmount)} để "trả trước 1 lần", quỹ còn lại ${formatTableMoneyVNDMillion(cashAfterOneTime)} làm vốn phòng hờ.\n`;
                              }
                          } else {
                              text1 += `Số tiền này sẽ được dùng làm vốn phòng hờ.\n`;
                          }

                          let sampleBudget = 0;
                          let sampleActual = 0;
                          let sampleSinking = 0;
                          const firstDbRow = state.resolvedMonthlyDb?.find(r => {
                              let m = formData.month + 1;
                              let y = formData.year;
                              while (m > 12) { m -= 12; y += 1; }
                              return r.periodKey === `${y}-${String(m).padStart(2, '0')}`;
                          });
                          if (firstDbRow) {
                              sampleBudget = firstDbRow.budgetAmounts?.[lookupGroupId] || 0;
                              sampleActual = firstDbRow.actualExpenseByGroup?.[lookupGroupId] || 0;
                              
                              let oldTrackAImpact = 0;
                              if (editingId) {
                                  const oldEvent = state.lifeEvents.find(ev => ev.id === editingId);
                                  if (oldEvent && oldEvent.spendingCategory && oldEvent.recurringMonthlyImpact) {
                                      const oldGroup = oldEvent.spendingCategory.split('/')[0];
                                      if (oldGroup === lookupGroupId) {
                                          let evStartMonth = oldEvent.month + 1;
                                          let evStartYear = oldEvent.year;
                                          if (evStartMonth > 12) { evStartMonth = 1; evStartYear += 1; }
                                          const evStartVal = evStartYear * 12 + evStartMonth;
                                          const dur = safeNumber(oldEvent.recurringDurationMonths) || 1200;
                                          const evEndVal = evStartVal + dur - 1;
                                          
                                          let currentM = formData.month + 1;
                                          let currentY = formData.year;
                                          while (currentM > 12) { currentM -= 12; currentY += 1; }
                                          const currentVal = currentY * 12 + currentM;
                                          
                                          if (currentVal >= evStartVal && currentVal <= evEndVal) {
                                              oldTrackAImpact = Math.abs(safeNumber(oldEvent.recurringMonthlyImpact));
                                          }
                                      }
                                  }
                              }
                              sampleActual -= oldTrackAImpact;
                          }
                          const nextM = formData.month + 1 > 12 ? 1 : formData.month + 1;
                          const nextY = formData.month + 1 > 12 ? formData.year + 1 : formData.year;
                          const nextPKey = `${nextY}-${String(nextM).padStart(2, '0')}`;
                          let hasInitialDepositImpact = false;
                          (state.sinkingFunds || []).forEach(fund => {
                              if (fund.status !== 'active') return;
                              if (fund.sourceOfFund === `expense_surplus_${formData.recurringFundingSource}`) {
                                  const startMonthValue = fund.startYear * 12 + fund.startMonth;
                                  const currentMonthValue = nextY * 12 + nextM;
                                  if (currentMonthValue >= startMonthValue) {
                                      if (currentMonthValue === startMonthValue && (fund.initialDeposit || 0) > 0) {
                                          hasInitialDepositImpact = true;
                                      }
                                      const contrib = fund.periodConfigs?.[nextPKey]?.contribution !== undefined ? fund.periodConfigs[nextPKey].contribution : fund.monthlyContribution;
                                      sampleSinking += contrib || 0;
                                  }
                              }
                          });
                          
                          const sampleBaseSurplus = (sampleBudget - sampleActual) - sampleSinking;
                          const sampleFinalSurplus = (isSameCategoryGroup && trackAImpact > 0) ? (sampleBaseSurplus - trackAImpact) : sampleBaseSurplus;

                          text1 += `\n**2. Khả năng chi tiêu thường xuyên dư (Thực dư):**\nBình thường quỹ này dư ${formatTableMoneyVNDMillion(sampleBaseSurplus)}/tháng (Ngân sách ${formatTableMoneyVNDMillion(sampleBudget)} - Thực chi ${formatTableMoneyVNDMillion(sampleActual)}${sampleSinking > 0 ? ` - Trích Sinking Fund định kỳ ${formatTableMoneyVNDMillion(sampleSinking)}` : ''}). `;
                          if (isSameCategoryGroup && trackAImpact > 0) {
                              text1 += `Tuy nhiên, quỹ đang phải cõng thêm khoản chi ${formatTableMoneyVNDMillion(trackAImpact)}/tháng từ phần "Trừ từ Ngân sách" ➔ Thực tế mỗi tháng quỹ chỉ dư ra được ${formatTableMoneyVNDMillion(sampleFinalSurplus)}.\n`;
                          } else {
                              text1 += `\n`;
                          }
                          if (hasInitialDepositImpact) {
                              text1 += `*(Lưu ý: Trong các kỳ đầu, quỹ có thể dư ít hơn do phải trích thêm Vốn ban đầu (1 lần) cho các Quỹ Sinking Fund mới tạo. Xem chi tiết ở phần Diễn biến).* \n`;
                          }

                          text1 += `\n**3. Đánh giá sơ bộ:**\nĐể gánh được toàn bộ chi phí ${formatTableMoneyVNDMillion(totalCost)} trong ${duration} kỳ tới, tổng tiền bạn có (gồm ${formatTableMoneyVNDMillion(cashAfterOneTime)} vốn đệm + ${formatTableMoneyVNDMillion(totalSurplusOverDuration)} sinh thêm) phải lớn hơn mức này.\n`;

                          text1 += `\n**4. Diễn biến chi trả từng tháng (Vốn đầu kỳ + Thực dư - Trừ tiền = Còn lại):**\n`;
                          if (upfrontShortfall > 0) {
                              text1 += `- ⚠️ Ngay từ lúc Khởi điểm, quỹ đã cạn kiệt vì không đủ trả Tác động 1 lần (Thiếu ${formatTableMoneyVNDMillion(upfrontShortfall)}). Các kỳ sau không thể chi trả.\n`;
                          }
                          text1 += traceLines.join('\n');

                          let text2 = '';
                          let adviceType: 'safe' | 'warning' | 'critical' | 'error' = 'safe';
                          const totalCashPool = availableRemaining + totalSurplusOverDuration;
                          const trueTotalCost = totalCost + (isSameSource ? oneTimeAmount : 0);
                          const impactRatio = totalCashPool > 0 ? (trueTotalCost / totalCashPool) * 100 : 100;

                          let conclusionTitle = '';
                          let conclusionText = '';
                          if (coveredPeriods >= duration) {
                              let survivalText = `Nguồn tiền kết hợp (Vốn đệm + Thực dư) dư sức gánh trọn vẹn đủ ${duration} kỳ.`;
                              if (impactRatio < 30) {
                                  adviceType = 'safe';
                                  conclusionTitle = 'Cấp độ 1 (An toàn tuyệt đối)';
                                  conclusionText = `${survivalText} Khoản chi này chỉ ngốn ${impactRatio.toFixed(1)}% tổng thực dư & vốn đệm tương lai của quỹ. Hoàn toàn không làm suy yếu hàng phòng ngự tài chính. 👉 Chi tiêu thông minh! Bạn có thể tự tin duyệt phương án này.`;
                              } else if (impactRatio <= 70) {
                                  adviceType = 'warning';
                                  conclusionTitle = 'Cấp độ 2 (Đáng cân nhắc)';
                                  conclusionText = `${survivalText} Tuy nhiên, khoản chi này sẽ ngốn tới ${impactRatio.toFixed(1)}% tổng thặng dư & vốn đệm tương lai của quỹ. Nó bắt đầu làm giảm đáng kể tốc độ tích lũy. 👉 Hãy tự hỏi đây là Khoản chi thực sự cần thiết (Need) hay Sở thích (Want)?`;
                              } else {
                                  adviceType = 'critical';
                                  conclusionTitle = 'Cấp độ 3 (Báo động đỏ)';
                                  conclusionText = `${survivalText} Nhưng hãy cẩn thận! Khoản chi này sẽ "đốt" tới ${impactRatio.toFixed(1)}% tổng lực lượng của quỹ, vét gần sạch tiền và khiến gia đình mong manh trước các biến cố. 👉 Khuyến nghị lùi thời điểm chi tiêu lại 3-6 tháng để tích lũy thêm vốn đệm.`;
                              }
                          } else {
                              adviceType = 'error';
                              conclusionTitle = 'Cấp độ 4 (Gãy thanh khoản - Rủi ro cao)';
                              conclusionText = `Nguồn tiền kết hợp chỉ cầm cự được ${coveredPeriods}/${duration} kỳ rồi BÙM hết tiền! Từ kỳ thứ ${coveredPeriods + 1}, quỹ sẽ chính thức âm. 👉 Lời khuyên: 1) Kéo dài số kỳ, 2) Chuyển bớt sang Quỹ khác, 3) Giảm số tiền trả 1 lần.`;
                          }

                          const isSafe = adviceType === 'safe';
                          const isWarn = adviceType === 'warning';
                          const isCrit = adviceType === 'critical';
                          
                          const bgClass = isSafe ? 'bg-emerald-50/50 border-emerald-200' : isWarn ? 'bg-yellow-50/80 border-yellow-200' : isCrit ? 'bg-orange-50/80 border-orange-300' : 'bg-red-50/80 border-red-200';
                          const titleClass = isSafe ? 'text-emerald-700' : isWarn ? 'text-yellow-700' : isCrit ? 'text-orange-700' : 'text-red-700';
                          const textClass = isSafe ? 'text-emerald-800' : isWarn ? 'text-yellow-800' : isCrit ? 'text-orange-800' : 'text-red-800';
                          const subduedClass = isSafe ? 'text-emerald-600/90' : isWarn ? 'text-yellow-700/90' : isCrit ? 'text-orange-700/90' : 'text-red-700/90';

                          expertAdvice = {
                              type: adviceType as any,
                              content: (
                                  <div className={`mt-2 border rounded-lg px-3 py-3 ${bgClass}`}>
                                      <p className={`text-xs font-bold mb-2 flex items-center gap-1.5 ${titleClass}`}>
                                          <Sparkles className="w-3.5 h-3.5" /> Mô phỏng Dòng tiền (Khả năng chi trả)
                                      </p>
                                      
                                      <div className={`space-y-2.5 ml-5 text-[11px] leading-relaxed ${textClass}`}>
                                          <div>
                                              <span className="font-semibold block opacity-90 mb-0.5">1. Khởi điểm (Vốn đệm):</span>
                                              Tính đến Tháng <strong>{formData.month}/{formData.year}</strong>, Quỹ [{matchedGroup.name}] đang có <strong>{formatTableMoneyVNDMillion(availableRemaining)}</strong> làm vốn đệm.
                                              {isSameSource && oneTimeAmount > 0 ? (
                                                  upfrontShortfall > 0 
                                                      ? <span> Tuy nhiên, quỹ <strong>KHÔNG ĐỦ</strong> để trả trước 1 lần {formatTableMoneyVNDMillion(oneTimeAmount)} (Thiếu {formatTableMoneyVNDMillion(upfrontShortfall)}). Phần trả trước ngốn sạch số dư hiện có, quỹ về 0.</span>
                                                      : <span> Sau khi trích {formatTableMoneyVNDMillion(oneTimeAmount)} để "trả trước 1 lần", quỹ còn lại <strong>{formatTableMoneyVNDMillion(cashAfterOneTime)}</strong> làm vốn phòng hờ.</span>
                                              ) : <span> Số tiền này sẽ được dùng làm vốn phòng hờ.</span>}
                                          </div>
                                          
                                          <div>
                                              <span className="font-semibold block opacity-90 mb-0.5">2. Khả năng chi tiêu thường xuyên dư (Thực dư):</span>
                                              Bình thường quỹ này dư <strong>{formatTableMoneyVNDMillion(sampleBaseSurplus)}/tháng</strong> (Ngân sách {formatTableMoneyVNDMillion(sampleBudget)} - Thực chi {formatTableMoneyVNDMillion(sampleActual)}{sampleSinking > 0 ? ` - Trích Sinking Fund định kỳ ${formatTableMoneyVNDMillion(sampleSinking)}` : ''}).
                                              {isSameCategoryGroup && trackAImpact > 0 && <span> Tuy nhiên, quỹ đang phải cõng thêm khoản chi {formatTableMoneyVNDMillion(trackAImpact)}/tháng từ phần "Trừ từ Ngân sách" ➔ Thực tế mỗi tháng quỹ chỉ dư ra được <strong>{formatTableMoneyVNDMillion(sampleFinalSurplus)}</strong>.</span>}
                                              {hasInitialDepositImpact && <span className={`block mt-1 italic ${subduedClass}`}>* (Lưu ý: Trong các kỳ đầu, quỹ có thể dư ít hơn do phải trích thêm Vốn ban đầu (1 lần) cho Sinking Fund).</span>}
                                          </div>

                                          <div>
                                              <span className="font-semibold block opacity-90 mb-0.5">3. Đánh giá sơ bộ:</span>
                                              Để gánh được toàn bộ chi phí <strong>{formatTableMoneyVNDMillion(totalCost)}</strong> trong {duration} kỳ tới, tổng tiền bạn có (gồm {formatTableMoneyVNDMillion(cashAfterOneTime)} vốn đệm + {formatTableMoneyVNDMillion(totalSurplusOverDuration)} sinh thêm) phải lớn hơn mức này.
                                          </div>

                                          <div>
                                              <span className="font-semibold block opacity-90 mb-0.5">4. Diễn biến chi trả từng tháng (Vốn đầu kỳ + Thực dư - Trừ tiền = Còn lại):</span>
                                              <div className="space-y-0.5 mt-1 ml-1 opacity-90">
                                                  {upfrontShortfall > 0 && (
                                                      <div className="flex gap-1.5"><AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-500 mt-0.5"/> Ngay từ lúc Khởi điểm, quỹ đã cạn kiệt vì không đủ trả Tác động 1 lần (Thiếu {formatTableMoneyVNDMillion(upfrontShortfall)}). Các kỳ sau không thể chi trả.</div>
                                                  )}
                                                  {traceLines.map((line, idx) => (
                                                      <div key={idx} className="flex gap-1.5 font-mono tracking-tight">
                                                          {line.startsWith('- ⚠️') ? <AlertTriangle className="w-3 h-3 shrink-0 text-red-500 mt-0.5"/> : <span className="text-[10px] mt-0.5 opacity-60">■</span>}
                                                          <span>{line.replace('- ⚠️ ', '').replace('- ', '')}</span>
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>

                                          <div className={`mt-3 pt-2.5 border-t border-dashed ${isSafe ? 'border-emerald-300' : isWarn ? 'border-yellow-300' : isCrit ? 'border-orange-300' : 'border-red-300'}`}>
                                              <span className="font-bold block mb-0.5">{conclusionTitle}</span>
                                              <span>{conclusionText}</span>
                                          </div>
                                      </div>
                                  </div>
                              )
                          };
                        }
                      }
                      return (
                        <div className="space-y-2">
                          <div className="bg-emerald-50/50 border border-emerald-200/50 rounded-lg px-3 py-2">
                            <p className="text-xs text-emerald-700 font-medium">
                              💰 Tổng chi phí Quỹ dư: <strong>{formatTableMoneyVNDMillion(totalCost)}</strong> 
                              {' '}(= {impact}tr × {duration} kỳ)
                            </p>
                          </div>
                          {expertAdvice?.content}
                        </div>
                      );
                    }
                    return null;
                  })()}
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
                  Dòng thời gian chi tiêu linh hoạt
                  <HelpTooltip text="Theo dõi và quản lý toàn bộ các khoản chi tiêu linh hoạt được sắp xếp theo thời gian." />
                </CardTitle>
                <CardDescription>
                  Bức tranh toàn cảnh về các khoản chi tiêu linh hoạt được sắp xếp theo thời gian.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => {
                  const projection = runProjection({
                    profile: state.profile,
                    incomeSchedule: state.incomeSchedule,
                    budgetSchedule: state.budgetSchedule,
                    expenseSchedule: state.expenseSchedule,
                    lifeEvents: state.lifeEvents,
                    assets: state.assets,
                    assumptions: state.assumptions,
                    investmentDeals: state.investmentDeals,
                    savingsDeposits: state.savingsDeposits,
                    sinkingFunds: state.sinkingFunds,
                    debts: state.debts,
                    projectionAdjustments: state.projectionAdjustments,
                    lifeStages: state.lifeStages,
                    fundTransfers: state.fundTransfers,
                  });
                  const currentPeriodValue = parseInt(effectivePeriodKey.split('-')[0], 10) * 12 + parseInt(effectivePeriodKey.split('-')[1], 10);
                  const projData = projection.monthlyRows.find((r: any) => r.period.key === effectivePeriodKey);
                  
                  const activeBudget = state.budgetSchedule.filter(
                    (b) => b.effectiveYear * 12 + b.effectiveMonth <= currentPeriodValue
                  ).sort((a,b) => (b.effectiveYear * 12 + b.effectiveMonth) - (a.effectiveYear * 12 + a.effectiveMonth))[0];
                  
                  let housingBasicBudget = 0;
                  if (activeBudget && state.resolvedMonthlyDbMap && state.resolvedMonthlyDbMap[effectivePeriodKey]) {
                    housingBasicBudget = state.resolvedMonthlyDbMap[effectivePeriodKey].budgetAmounts?.['housing_basic'] || 0;
                  }
                  
                  setAdvisorSnapshot({
                    appState: state,
                    projection,
                    currentPeriodKey: effectivePeriodKey,
                    housingBasicAvgExpense: housingBasicBudget,
                    currentLiquidityBalance: projData ? projData.liquidityBalance : 0
                  });
                  setIsAdvisorOpen(true);
                }} className="gap-2 text-xs h-9 shrink-0 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200" variant="outline">
                  <BrainCircuit className="w-4 h-4 shrink-0 text-pink-500" /> Phân bổ thông minh
                </Button>
                <Button onClick={handleAddClick} className="gap-2 text-xs h-9 shrink-0">
                  <Plus className="w-4 h-4 shrink-0" /> Thêm khoản chi linh hoạt
                </Button>
              </div>
            </div>
          </CardHeader>
        <CardContent>
          {(() => {
            const uniqueTypes = Array.from(new Set(sortedEvents.map(e => e.type)));
            const uniqueSources = Array.from(new Set(sortedEvents.map(e => e.recurringFundingSource || e.source).filter(Boolean)));
            
            const filteredTimelineEvents = sortedEvents.filter(event => {
              if (timelineFilterType !== 'all' && event.type !== timelineFilterType) return false;
              const source = event.recurringFundingSource || event.source || 'unknown';
              if (timelineFilterSource !== 'all' && source !== timelineFilterSource && event.source !== timelineFilterSource) return false;
              return true;
            });

            const getEventTheme = (type: string, isIncome: boolean) => {
              if (isIncome) return { bg: 'bg-emerald-50/40', border: 'border-emerald-400', borderLight: 'border-emerald-100', text: 'text-emerald-800', icon: 'bg-emerald-500 text-white', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
              
              switch (type) {
                case 'health': 
                case 'medical': return { bg: 'bg-blue-50/40', border: 'border-blue-400', borderLight: 'border-blue-100', text: 'text-blue-800', icon: 'bg-blue-500 text-white', badge: 'bg-blue-100 text-blue-800 border-blue-200' };
                case 'education': 
                case 'personal_development': return { bg: 'bg-indigo-50/40', border: 'border-indigo-400', borderLight: 'border-indigo-100', text: 'text-indigo-800', icon: 'bg-indigo-500 text-white', badge: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
                case 'buy_property':
                case 'home_renovation':
                case 'home_appliances': return { bg: 'bg-amber-50/40', border: 'border-amber-400', borderLight: 'border-amber-100', text: 'text-amber-800', icon: 'bg-amber-500 text-white', badge: 'bg-amber-100 text-amber-800 border-amber-200' };
                case 'buy_car':
                case 'vehicle_maintenance': return { bg: 'bg-slate-50/40', border: 'border-slate-400', borderLight: 'border-slate-100', text: 'text-slate-800', icon: 'bg-slate-500 text-white', badge: 'bg-slate-100 text-slate-800 border-slate-200' };
                case 'wedding':
                case 'child_birth':
                case 'family_support': return { bg: 'bg-pink-50/40', border: 'border-pink-400', borderLight: 'border-pink-100', text: 'text-pink-800', icon: 'bg-pink-500 text-white', badge: 'bg-pink-100 text-pink-800 border-pink-200' };
                case 'travel':
                case 'hobbies_sports':
                case 'networking_festivals': return { bg: 'bg-violet-50/40', border: 'border-violet-400', borderLight: 'border-violet-100', text: 'text-violet-800', icon: 'bg-violet-500 text-white', badge: 'bg-violet-100 text-violet-800 border-violet-200' };
                case 'tech_gadget': return { bg: 'bg-cyan-50/40', border: 'border-cyan-400', borderLight: 'border-cyan-100', text: 'text-cyan-800', icon: 'bg-cyan-500 text-white', badge: 'bg-cyan-100 text-cyan-800 border-cyan-200' };
                case 'business_venture': return { bg: 'bg-rose-50/40', border: 'border-rose-400', borderLight: 'border-rose-100', text: 'text-rose-800', icon: 'bg-rose-500 text-white', badge: 'bg-rose-100 text-rose-800 border-rose-200' };
                default: return { bg: 'bg-orange-50/40', border: 'border-orange-400', borderLight: 'border-orange-100', text: 'text-orange-800', icon: 'bg-orange-500 text-white', badge: 'bg-orange-100 text-orange-800 border-orange-200' };
              }
            };
            
            const getEventWarnings = (event: LifeEvent) => {
              let hasFundWarning = false;
              let hasBudgetWarning = false;
              
              if (state.resolvedMonthlyDb) {
                let sM = event.month; let sY = event.year;
                
                if (event.recurringFundingSource && safeNumber(event.recurringMonthlyImpactFund) !== 0) {
                  const fundId = event.recurringFundingSource;
                  const dur = safeNumber(event.recurringDurationMonthsFund) || 1200;
                  let checkM = sM; let checkY = sY;
                  for (let i = 0; i < dur; i++) {
                    const pKey = `${checkY}-${String(checkM).padStart(2, '0')}`;
                    const row = state.resolvedMonthlyDb.find(r => r.periodKey === pKey);
                    if (row && (row as any)._groupBalances && (row as any)._groupBalances[fundId] < 0) {
                      hasFundWarning = true; break;
                    }
                    checkM++; if (checkM > 12) { checkM = 1; checkY++; }
                    if (!row) break;
                  }
                }
                
                if (event.spendingCategory && safeNumber(event.recurringMonthlyImpact) > 0) {
                  const parts = event.spendingCategory.split('/');
                  const categoryId = parts.length > 1 ? parts[1] : parts[0];
                  const dur = safeNumber(event.recurringDurationMonths) || 1200;
                  let checkM = sM; let checkY = sY;
                  for (let i = 0; i < dur; i++) {
                    const pKey = `${checkY}-${String(checkM).padStart(2, '0')}`;
                    const row = state.resolvedMonthlyDb.find(r => r.periodKey === pKey);
                    if (row && (row as any)._monthlyBudget && (row as any)._monthlyActual) {
                      const budget = (row as any)._monthlyBudget[categoryId] || 0;
                      const actual = (row as any)._monthlyActual[categoryId] || 0;
                      if (actual > budget) {
                        hasBudgetWarning = true; break;
                      }
                    }
                    checkM++; if (checkM > 12) { checkM = 1; checkY++; }
                    if (!row) break;
                  }
                }
              }
              return { hasFundWarning, hasBudgetWarning };
            };

            return (
              <>
                {sortedEvents.length > 0 && (
                  <div className="flex flex-wrap items-center gap-3 mb-6 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                    <span className="text-sm font-semibold text-gray-500 mr-2 flex items-center gap-1.5"><Filter className="w-4 h-4"/> Lọc hiển thị:</span>
                    <Select 
                      value={timelineFilterType} 
                      onChange={e => setTimelineFilterType(e.target.value)} 
                      className="w-full sm:w-[220px] h-9 text-sm"
                      options={[
                        {value: 'all', label: 'Tất cả phân loại'},
                        ...uniqueTypes.map(type => ({value: type, label: getEventLabel(type)}))
                      ]}
                    />
                    <Select 
                      value={timelineFilterSource} 
                      onChange={e => setTimelineFilterSource(e.target.value)} 
                      className="w-full sm:w-[260px] h-9 text-sm"
                      options={[
                        {value: 'all', label: 'Tất cả Nguồn tiền / Quỹ'},
                        ...uniqueSources.map(source => ({value: source, label: formPeriodBreakdown.find((g: any) => g.id === source)?.name || getSourceLabel(source)}))
                      ]}
                    />
                  </div>
                )}
                
                {filteredTimelineEvents.length > 0 ? (
                  <div className="relative border-l-2 border-family-accent/20 ml-4 md:ml-6 space-y-6 py-4">
                    {filteredTimelineEvents.map((event, index) => {
                      const isIncome = event.amount >= 0;
                      const isRecurringIncome = safeNumber(event.recurringMonthlyImpact) >= 0;
                      const theme = getEventTheme(event.type, isIncome);
                      const warnings = getEventWarnings(event);
                      
                      const oneTimeCost = Math.abs(safeNumber(event.amount));
                      const recurringCost = Math.abs(safeNumber(event.recurringMonthlyImpact)) * (safeNumber(event.recurringDurationMonths) || 12); // rough estimate if infinity
                      const fundCost = Math.abs(safeNumber(event.recurringMonthlyImpactFund)) * (safeNumber(event.recurringDurationMonthsFund) || 12);
                      const totalEstimated = oneTimeCost + recurringCost + fundCost;
                      const isOngoing = !event.recurringDurationMonths && !event.recurringDurationMonthsFund && (safeNumber(event.recurringMonthlyImpact) !== 0 || safeNumber(event.recurringMonthlyImpactFund) !== 0);
                return (
                  <div key={event.id} className="relative pl-8 md:pl-10">
                    {/* Icon Node */}
                    <div className={`absolute -left-[21px] top-1 w-10 h-10 rounded-full border-4 border-white flex items-center justify-center shadow-md ${theme.icon} transition-transform hover:scale-110`}>
                      {getEventIcon(event.type)}
                    </div>
                    
                    {/* Content Card */}
                    <div className={`bg-white rounded-xl border border-gray-100 border-l-4 ${theme.border} p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden`}>
                      <div className="flex flex-col lg:flex-row lg:items-stretch justify-between gap-6">
                        {/* Left: Info & Visual Summary */}
                        <div className="flex flex-col justify-between flex-1 lg:pr-6 relative">
                          <div className="space-y-3 relative z-10">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full border ${theme.badge}`}>
                                Tháng {event.month}/{event.year}
                              </span>
                              <span className="text-xs font-semibold text-family-textLight border border-family-textLight/20 px-2 py-0.5 rounded-full bg-white/60">
                                {getEventLabel(event.type)}
                              </span>
                              {event.spendingCategory && (
                                <span className="text-xs font-semibold text-family-textMuted bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                                  {event.spendingCategory.split('/')[1] || event.spendingCategory.split('/')[0]}
                                </span>
                              )}
                            </div>
                            <div>
                              <h4 className="text-2xl font-black text-family-text leading-tight mb-2">{event.name}</h4>
                              {event.note && <p className="text-sm text-family-textMuted/90 leading-relaxed max-w-2xl">{event.note}</p>}
                            </div>
                          </div>
                          
                          {/* Aesthetic Visual Decor for empty space */}
                          {totalEstimated > 0 && (
                             <div className="mt-6 flex items-end gap-4 relative z-10">
                                <div className={`px-4 py-2.5 rounded-xl border ${theme.borderLight} ${theme.bg} inline-flex flex-col shadow-inner backdrop-blur-sm`}>
                                   <span className="text-[10px] uppercase tracking-wider font-bold opacity-60 mb-0.5 {theme.text}">Ước tính quy mô</span>
                                   <div className={`text-xl font-black ${theme.text}`}>
                                     {isOngoing ? '>' : ''}{formatTableMoneyVNDMillion(totalEstimated)} {isOngoing && <span className="text-xs font-medium opacity-70">/năm đầu</span>}
                                   </div>
                                </div>
                             </div>
                          )}
                          
                          {/* Huge Watermark Icon */}
                          <div className={`absolute -left-12 -bottom-10 opacity-[0.03] pointer-events-none transform -rotate-12 scale-150 ${theme.text}`}>
                             {getEventIcon(event.type)}
                          </div>
                        </div>
                        
                        {/* Right: Cashflow Details */}
                        <div className="w-full lg:w-[45%] flex flex-col gap-2 relative border-t lg:border-t-0 lg:border-l border-gray-100 pt-5 lg:pt-0 lg:pl-6">
                          <div className="absolute inset-0 bg-gradient-to-l from-white/40 to-transparent pointer-events-none rounded-r-xl"></div>
                          
                          <div className="text-[10px] font-bold text-gray-400 mb-1 flex items-center gap-1.5 uppercase tracking-wider relative z-10">
                            <Banknote className="w-3.5 h-3.5" /> Chi tiết dòng tiền
                          </div>
                          
                          {/* One-time impact */}
                          {safeNumber(event.amount) !== 0 && (
                            <div className="flex items-start gap-2.5 relative z-10 bg-white/60 p-3 rounded-xl border border-gray-100/50">
                              <div className={`mt-0.5 p-1 rounded-md ${isIncome ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                {isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                              </div>
                              <div className="flex flex-col">
                                <div className={`text-sm font-bold ${isIncome ? 'text-emerald-700' : 'text-red-700'}`}>
                                  {isIncome ? 'Thu 1 lần:' : 'Trừ 1 lần:'} {isIncome ? '+' : ''}{formatTableMoneyVNDMillion(event.amount)}
                                </div>
                                <div className="text-[10px] text-gray-500 font-medium">
                                  {event.source ? `Từ Quỹ/Nguồn: ${formPeriodBreakdown.find((g: any) => g.id === event.source)?.name || getSourceLabel(event.source)}` : 'Không xác định'}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Recurring Track A (Budget) */}
                          {safeNumber(event.recurringMonthlyImpact) !== 0 && (() => {
                            const obsMonthValue = currentObservedYear * 12 + currentObservedMonth;
                            const getTrackStatus = (m: number, y: number, d: number | undefined) => {
                              let sM = safeNumber(m) + 1; let sY = safeNumber(y);
                              if (sM > 12) { sM = 1; sY += 1; }
                              const startVal = sY * 12 + sM;
                              const endVal = safeNumber(d) > 0 ? startVal + safeNumber(d) : Infinity;
                              if (obsMonthValue < startVal) return 'pending';
                              if (obsMonthValue >= endVal) return 'expired';
                              return 'active';
                            };
                            const status = getTrackStatus(event.month, event.year, event.recurringDurationMonths);
                            const boxClasses = status === 'expired' ? 'opacity-60 grayscale-[0.8] bg-gray-50 border-gray-200' : status === 'pending' ? 'bg-gray-50/50 border-gray-100 opacity-80' : warnings.hasBudgetWarning ? 'bg-red-50 border-red-300 animate-pulse' : 'bg-white/60 border-gray-100/50';

                            return (
                              <div className={`flex items-start gap-2.5 relative z-10 p-3 rounded-xl border transition-all ${boxClasses} ${safeNumber(event.amount) !== 0 ? 'mt-1' : ''}`}>
                                <div className={`mt-0.5 p-1 rounded-md ${isRecurringIncome ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                  {warnings.hasBudgetWarning && status === 'active' ? <AlertTriangle className="w-4 h-4 text-red-600" /> : <CreditCard className="w-4 h-4" />}
                                </div>
                                <div className="flex flex-col w-full">
                                  <div className="flex flex-wrap justify-between items-start gap-2">
                                    <div className={`text-sm font-bold ${isRecurringIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                                      Ngân sách: {isRecurringIncome ? '+' : ''}{event.recurringMonthlyImpact} tr/tháng
                                    </div>
                                    {status === 'expired' && <span className="text-[9px] font-bold text-gray-500 bg-gray-200/50 px-1.5 py-0.5 rounded border border-gray-200 uppercase whitespace-nowrap shrink-0">Đã kết thúc</span>}
                                    {status === 'pending' && <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase whitespace-nowrap shrink-0">Chưa bắt đầu</span>}
                                    {status === 'active' && <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 uppercase whitespace-nowrap shrink-0 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Đang tác động</span>}
                                  </div>
                                  <div className="text-[10px] text-gray-500 font-medium mt-0.5">
                                    <span className="flex items-center gap-1 mb-0.5">
                                      <Filter className="w-3 h-3 inline" />
                                      {event.spendingCategory ? `Phân bổ vào: ${getCategoryLabel(event.spendingCategory)}` : 'Không xác định'}
                                    </span>
                                    {(() => {
                                      const dur = safeNumber(event.recurringDurationMonths);
                                      if (!dur) return 'Vô thời hạn';
                                      let sM = event.month + 1; let sY = event.year;
                                      if (sM > 12) { sM = 1; sY += 1; }
                                      const sM0 = sM - 1;
                                      const endTotal = sY * 12 + sM0 + dur - 1;
                                      const eY = Math.floor(endTotal / 12);
                                      const eM = (endTotal % 12) + 1;
                                      return (
                                        <span className="flex items-center gap-1">
                                          <CalendarRange className="w-3 h-3 inline" />
                                          Trong {dur} kỳ (Từ tháng {sM}/{sY} đến tháng {eM}/{eY})
                                        </span>
                                      );
                                    })()}
                                    
                                    {warnings.hasBudgetWarning && status === 'active' && (
                                      <div className="text-red-600 text-[10.5px] font-bold mt-1.5 flex items-start gap-1 bg-red-100/50 p-1 rounded">
                                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                        Cảnh báo: Khoản chi này làm vượt ngân sách phân bổ trong ít nhất 1 kỳ tương lai.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Recurring Track B (Fund) */}
                          {safeNumber(event.recurringMonthlyImpactFund) !== 0 && (() => {
                            const obsMonthValue = currentObservedYear * 12 + currentObservedMonth;
                            const getTrackStatus = (m: number, y: number, d: number | undefined) => {
                              let sM = safeNumber(m) + 1; let sY = safeNumber(y);
                              if (sM > 12) { sM = 1; sY += 1; }
                              const startVal = sY * 12 + sM;
                              const endVal = safeNumber(d) > 0 ? startVal + safeNumber(d) : Infinity;
                              if (obsMonthValue < startVal) return 'pending';
                              if (obsMonthValue >= endVal) return 'expired';
                              return 'active';
                            };
                            const status = getTrackStatus(event.month, event.year, event.recurringDurationMonthsFund);
                            const boxClasses = status === 'expired' ? 'opacity-60 grayscale-[0.8] bg-gray-50 border-gray-200' : status === 'pending' ? 'bg-gray-50/50 border-gray-100 opacity-80' : warnings.hasFundWarning ? 'bg-orange-50 border-orange-300 animate-pulse' : 'bg-white/60 border-gray-100/50';

                            return (
                              <div className={`flex items-start gap-2.5 relative z-10 p-3 rounded-xl border transition-all ${boxClasses} ${(safeNumber(event.amount) !== 0 || safeNumber(event.recurringMonthlyImpact) !== 0) ? 'mt-1' : ''}`}>
                                <div className="mt-0.5 p-1 rounded-md bg-teal-100 text-teal-600">
                                  {warnings.hasFundWarning && status === 'active' ? <AlertTriangle className="w-4 h-4 text-orange-600" /> : <PiggyBank className="w-4 h-4" />}
                                </div>
                                <div className="flex flex-col w-full">
                                  <div className="flex flex-wrap justify-between items-start gap-2">
                                    <div className="text-sm font-bold text-teal-700">
                                      Quỹ dự phòng: {event.recurringMonthlyImpactFund} tr/tháng
                                    </div>
                                    {status === 'expired' && <span className="text-[9px] font-bold text-gray-500 bg-gray-200/50 px-1.5 py-0.5 rounded border border-gray-200 uppercase whitespace-nowrap shrink-0">Đã kết thúc</span>}
                                    {status === 'pending' && <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase whitespace-nowrap shrink-0">Chưa bắt đầu</span>}
                                    {status === 'active' && <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 uppercase whitespace-nowrap shrink-0 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Đang tác động</span>}
                                  </div>
                                  <div className="text-[10px] text-gray-500 font-medium mt-0.5">
                                    <span className="flex items-center gap-1 mb-0.5">
                                      <Landmark className="w-3 h-3 inline" />
                                      {event.recurringFundingSource ? `Từ Quỹ: ${formPeriodBreakdown.find((g: any) => g.id === event.recurringFundingSource)?.name || getSourceLabel(event.recurringFundingSource)}` : 'Không xác định'}
                                    </span>
                                    {(() => {
                                      const dur = safeNumber(event.recurringDurationMonthsFund);
                                      if (!dur) return 'Vô thời hạn';
                                      let sM = event.month + 1; let sY = event.year;
                                      if (sM > 12) { sM = 1; sY += 1; }
                                      const sM0 = sM - 1;
                                      const endTotal = sY * 12 + sM0 + dur - 1;
                                      const eY = Math.floor(endTotal / 12);
                                      const eM = (endTotal % 12) + 1;
                                      return (
                                        <span className="flex items-center gap-1">
                                          <CalendarRange className="w-3 h-3 inline" />
                                          Trong {dur} kỳ (Từ tháng {sM}/{sY} đến tháng {eM}/{eY})
                                        </span>
                                      );
                                    })()}
                                    
                                    {warnings.hasFundWarning && status === 'active' && (
                                      <div className="text-orange-600 text-[10.5px] font-bold mt-1.5 flex items-start gap-1 bg-orange-100/50 p-1 rounded">
                                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                        Cảnh báo: Số dư nguồn trích không đủ trong ít nhất 1 kỳ tương lai.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      
                      {/* Hover Actions */}
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white shadow-sm border border-gray-100 rounded-lg overflow-hidden z-10">
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
            <EmptyState title="Không tìm thấy khoản chi nào" description={sortedEvents.length > 0 ? "Vui lòng điều chỉnh bộ lọc để xem các khoản chi khác." : "Nhấn nút Thêm khoản chi linh hoạt ở trên để bắt đầu."} />
          )}
          </>
            );
          })()}
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

      <SmartAllocationAdvisorModal 
        isOpen={isAdvisorOpen}
        onClose={() => setIsAdvisorOpen(false)}
        snapshot={advisorSnapshot}
      />
    </div>
  );
};

