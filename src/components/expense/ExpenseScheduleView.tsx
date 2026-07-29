import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { WarningBox } from '../../components/ui/WarningBox';
import { Calendar, Save, Trash2, RefreshCw, AlertCircle, TrendingUp, Info, Zap, Plus, ChevronDown, ChevronRight, CheckCircle2, Wallet, PiggyBank, CircleDollarSign } from 'lucide-react';
import { safeNumber } from '../../utils/math';
import { formatTableMoneyVNDMillion } from '../../utils/format';
import { rebuildTreeFromFlatRatios, collectLeafNodes } from '../../engines/budgetEngine';
import { isWithinObservationPeriod, getPeriodGuardMessage } from '../../utils/periodGuard';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

const CHART_COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e', '#f97316', '#14b8a6'];


export const ExpenseScheduleView: React.FC = () => {
  const { state, addExpenseScheduleItem, updateExpenseScheduleItem, deleteExpenseScheduleItem, selectedPeriodKey } = useAppContext();

  // Sort schedule items by date
  const sortedHistory = [...(state.expenseSchedule || [])].sort((a, b) => {
    if (a.effectiveYear !== b.effectiveYear) {
      return a.effectiveYear - b.effectiveYear;
    }
    return a.effectiveMonth - b.effectiveMonth;
  });

  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(() => {
    return sortedHistory.length > 0 ? sortedHistory[0].id : null;
  });

  const activeVersion = sortedHistory.find(item => item.id === selectedVersionId) || sortedHistory[0];

  // Get active budget categories for the selected period
  const activeBudgetPeriod = activeVersion 
    ? `${activeVersion.effectiveYear}-${String(activeVersion.effectiveMonth).padStart(2, '0')}`
    : selectedPeriodKey || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  
  const activeDbItem = state.resolvedMonthlyDb?.find(db => db.periodKey === activeBudgetPeriod);
  
  // Extract categories from active budget schedule
  const activeBudgetSchedule = React.useMemo(() => {
    let budget = state.budgetSchedule.length > 0 ? state.budgetSchedule[state.budgetSchedule.length - 1] : null;
    const targetMonthValue = activeVersion 
      ? activeVersion.effectiveYear * 12 + activeVersion.effectiveMonth 
      : (selectedPeriodKey ? parseInt(selectedPeriodKey.split('-')[0], 10) * 12 + parseInt(selectedPeriodKey.split('-')[1], 10) : new Date().getFullYear() * 12 + new Date().getMonth() + 1);

    if (state.budgetSchedule.length > 0) {
      const pastOrActive = state.budgetSchedule.filter(b => b.effectiveYear * 12 + b.effectiveMonth <= targetMonthValue);
      if (pastOrActive.length > 0) {
        pastOrActive.sort((a,b) => (a.effectiveYear * 12 + a.effectiveMonth) - (b.effectiveYear * 12 + b.effectiveMonth));
        budget = pastOrActive[pastOrActive.length - 1];
      }
    }
    return budget;
  }, [state.budgetSchedule, selectedPeriodKey, activeVersion]);

  const budgetTree = activeBudgetSchedule 
    ? (activeBudgetSchedule.rootGroups || rebuildTreeFromFlatRatios(activeBudgetSchedule.ratios || []))
    : [];

  const [isCreatingNew, setIsCreatingNew] = useState(false);
  
  React.useEffect(() => {
    setIsCreatingNew(false);
    if (selectedPeriodKey) {
      const [y, m] = selectedPeriodKey.split('-').map(Number);
      const pastOrActiveItems = sortedHistory.filter((item) => {
        if (item.effectiveYear < y) return true;
        if (item.effectiveYear === y && item.effectiveMonth <= m) return true;
        return false;
      });
      if (pastOrActiveItems.length > 0) {
        const effective = pastOrActiveItems[pastOrActiveItems.length - 1];
        if (effective.id !== selectedVersionId) {
          setSelectedVersionId(effective.id);
        }
      }
    }
  }, [selectedPeriodKey]);

  const [newMonth, setNewMonth] = useState<number>(() => {
    if (selectedPeriodKey) return parseInt(selectedPeriodKey.split('-')[1], 10);
    return new Date().getMonth() + 1;
  });
  const [newYear, setNewYear] = useState<number>(() => {
    if (selectedPeriodKey) return parseInt(selectedPeriodKey.split('-')[0], 10);
    return new Date().getFullYear();
  });
  const [newNote, setNewNote] = useState<string>('');

  // Local state for categories
  const [categories, setCategories] = useState<Record<string, number>>(activeVersion?.categories || {});
  const [isSettled, setIsSettled] = useState(activeVersion?.status === 'settled');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId] ? true : false
    }));
  };

  // Calculate aggregated life event impacts for the currently viewed month
  const eventImpacts = React.useMemo(() => {
    const impacts: Record<string, { total: number, names: string[] }> = {};
    if (!activeVersion) return impacts;
    
    const targetMonthValue = activeVersion.effectiveYear * 12 + activeVersion.effectiveMonth;
    
    (state.lifeEvents || []).forEach(event => {
      const eventMonthValue = event.year * 12 + event.month;
      // if event is active in or before this month
      if (eventMonthValue <= targetMonthValue && event.recurringMonthlyImpact && event.recurringMonthlyImpact > 0 && event.spendingCategory) {
        // spendingCategory format is usually "groupId/childId", we need just "childId" for ExpenseSchedule matching
        const parts = event.spendingCategory.split('/');
        const categoryId = parts.length > 1 ? parts[1] : parts[0];
        
        if (!impacts[categoryId]) {
          impacts[categoryId] = { total: 0, names: [] };
        }
        impacts[categoryId].total += event.recurringMonthlyImpact;
        impacts[categoryId].names.push(event.name);
      }
    });
    return impacts;
  }, [state.lifeEvents, activeVersion]);

  // Update categories when version changes
  React.useEffect(() => {
    if (activeVersion) {
      setCategories(activeVersion.categories || {});
      setIsSettled(activeVersion.status === 'settled');
    } else {
      setCategories({});
      setIsSettled(false);
    }
  }, [activeVersion?.id, activeVersion?.status]);

  const handleCreateNew = () => {
    if (newMonth < 1 || newMonth > 12 || newYear < 2000) return;
    
    addExpenseScheduleItem({
      effectiveMonth: newMonth,
      effectiveYear: newYear,
      note: newNote,
      categories: {},
      status: 'active'
    });
    
    setIsCreatingNew(false);
    setNewNote('');
  };

  const handleSave = () => {
    if (activeVersion) {
      const expenseTreeTemp = budgetTree.filter((g: any) => g.classification === 'expense');
      const allCatIds = expenseTreeTemp.flatMap((g: any) => collectLeafNodes(g)).map((c: any) => c.id);
      const categoriesToSave = { ...categories };
      allCatIds.forEach(id => {
        if (categoriesToSave[id] === undefined) {
          categoriesToSave[id] = 0; // Initialize empty inputs with 0 on save
        }
      });
      updateExpenseScheduleItem({
        ...activeVersion,
        categories: categoriesToSave,
        status: isSettled ? 'settled' : 'active'
      });
    }
  };

  const handleDelete = () => {
    if (activeVersion && window.confirm('Bạn có chắc chắn muốn xóa mốc thời gian này?')) {
      deleteExpenseScheduleItem(activeVersion.id);
      setSelectedVersionId(null);
    }
  };

  const handleCategoryChange = (id: string, value: string) => {
    const numValue = parseFloat(value);
    setCategories(prev => ({
      ...prev,
      [id]: isNaN(numValue) ? 0 : numValue
    }));
    // If user manually edits, it's no longer 'settled'
    if (isSettled) {
      setIsSettled(false);
    }
  };


  let activeIncome = activeDbItem ? safeNumber(activeDbItem.income, 0) : 0;
  if (!activeDbItem) {
    const targetMonthValue = activeVersion 
      ? activeVersion.effectiveYear * 12 + activeVersion.effectiveMonth 
      : (selectedPeriodKey ? parseInt(selectedPeriodKey.split('-')[0], 10) * 12 + parseInt(selectedPeriodKey.split('-')[1], 10) : new Date().getFullYear() * 12 + new Date().getMonth() + 1);
    
    const applicableIncomeSchedules = state.incomeSchedule.filter(
      (s) => s.effectiveYear * 12 + s.effectiveMonth <= targetMonthValue
    );
    if (applicableIncomeSchedules.length > 0) {
      applicableIncomeSchedules.sort((a,b) => (b.effectiveYear * 12 + b.effectiveMonth) - (a.effectiveYear * 12 + a.effectiveMonth));
      activeIncome = applicableIncomeSchedules[0].incomeMonthly;
    }
  }
  
  const expenseTree = budgetTree.filter((g: any) => g.classification === 'expense');
  const allCategories = expenseTree.flatMap((g: any) => collectLeafNodes(g));

  // Calculate strict total budget from the ratios
  const totalBudget = allCategories.reduce((sum, cat) => sum + (activeIncome * cat.ratioPercent) / 100, 0);

  // Calculate totalActual correctly mapping -1 to budget
  const totalActual = Object.keys(categories).reduce((sum, catId) => {
    let val = safeNumber(categories[catId], 0);
    if (val === -1) {
      const catNode = allCategories.find(c => c.id === catId);
      if (catNode) {
        val = (activeIncome * catNode.ratioPercent) / 100;
      } else {
        val = 0;
      }
    }
    const eventImpact = eventImpacts[catId]?.total || 0;
    return sum + val + eventImpact;
  }, 0);

  // Collect validation warnings
  const validationWarnings: string[] = [];
  let hasMissingCategories = false;
  
  if (activeDbItem) {
    allCategories.forEach(cat => {
      let actual = safeNumber(categories[cat.id], 0);
      const budget = (activeIncome * cat.ratioPercent) / 100;
      
      const isNewRecord = Object.keys(activeVersion?.categories || {}).length === 0;
      if (categories[cat.id] === undefined && activeVersion && !isNewRecord) {
        hasMissingCategories = true;
      }
      
      if (actual === -1) actual = budget; // dynamically mapped

      const eventImpact = eventImpacts[cat.id]?.total || 0;
      const totalCatActual = actual + eventImpact;

      if (!isSettled && totalCatActual > budget) {
        validationWarnings.push(`"${cat.name}" vượt ngân sách (lố ${formatTableMoneyVNDMillion(totalCatActual - budget)}).`);
      }
    });
  }
  const hasValidationError = validationWarnings.length > 0;

  const totalRemaining = totalBudget - totalActual;
  
  const savingsThisMonth = (state.savingsDeposits || [])
    .filter(d => activeVersion && d.startMonth === activeVersion.effectiveMonth && d.startYear === activeVersion.effectiveYear)
    .reduce((sum, d) => sum + d.principal, 0);

  const idleMoney = totalRemaining - savingsThisMonth;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start h-full">
      {/* Left Column: Timeline (Moved to right/bottom visually via CSS order) */}
      <Card className="order-2 xl:order-2 xl:col-span-1 border border-family-accent/10 shadow-sm self-start">
        <CardHeader className="pb-3 border-b border-family-accent/5 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm uppercase tracking-wider text-family-textMuted">Mốc thời gian</CardTitle>
            <div className="flex gap-1.5">
              <Button size="sm" onClick={() => { setIsCreatingNew(true); }} className="h-7 px-2 text-[10px] gap-1" title="Thêm mốc kế toán">
                <Plus className="w-3 h-3" /> Thêm mốc
              </Button>
            </div>
          </div>
          <CardDescription className="text-[11px]">Chọn mốc để nhập chi tiêu thường xuyên</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 max-h-[500px] overflow-y-auto pr-1">
          {isCreatingNew && (
            <div className="p-3 border rounded-xl bg-gray-50 flex flex-col gap-3 mb-4 text-sm shadow-inner">
              <h4 className="font-semibold text-family-text">Thêm Mốc Mới</h4>
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" placeholder="Tháng" value={newMonth} onChange={e => { setNewMonth(Number(e.target.value)); }} />
                <Input type="number" placeholder="Năm" value={newYear} onChange={e => { setNewYear(Number(e.target.value)); }} />
              </div>
              <Input placeholder="Ghi chú (tùy chọn)" value={newNote} onChange={e => { setNewNote(e.target.value); }} />
              <div className="flex justify-end gap-2 mt-2 items-center">
                {!isWithinObservationPeriod(newMonth, newYear, selectedPeriodKey) && (
                  <span className="text-red-500 text-xs flex-1 text-right pr-2">{getPeriodGuardMessage(selectedPeriodKey)}</span>
                )}
                <Button variant="outline" size="sm" onClick={() => { setIsCreatingNew(false); }}>Hủy</Button>
                <Button size="sm" onClick={handleCreateNew} disabled={!isWithinObservationPeriod(newMonth, newYear, selectedPeriodKey)}>Lưu mốc</Button>
              </div>
            </div>
          )}

          <div className="relative border-l-2 border-family-accent/25 ml-4 pl-4 space-y-5 mt-2">
            {sortedHistory.map((item) => {
              const isSelected = item.id === selectedVersionId;
              return (
                <div key={item.id} className="relative group">
                  <div 
                    onClick={() => { setSelectedVersionId(item.id); }}
                    className={`absolute -left-[25px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-family-bgDeep cursor-pointer transition-all duration-150 ${
                      isSelected ? 'bg-family-accent scale-125 ring-4 ring-family-accent/20' : 'bg-family-textMuted/40 group-hover:bg-family-accent/60'
                    }`}
                  />
                  <div 
                    onClick={() => { setSelectedVersionId(item.id); }}
                    className={`cursor-pointer rounded-2xl p-3 transition-all border ${
                      isSelected ? 'bg-family-accent/10 border-family-accent/30 shadow-sm' : 'bg-white border-transparent hover:bg-family-bgDark/5 hover:border-family-accent/15'
                    }`}
                  >
                    <div className="font-bold text-sm text-family-text flex items-center justify-between">
                      <span>Tháng {item.effectiveMonth}/{item.effectiveYear}</span>
                      {item.status === 'settled' && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200">Đã chốt</span>
                      )}
                    </div>
                    {item.note && <div className="text-[11px] text-family-textMuted mt-1 line-clamp-1">{item.note}</div>}
                  </div>
                </div>
              );
            })}
          </div>
          {sortedHistory.length === 0 && (
            <div className="text-center text-family-textMuted py-8 text-sm">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-20" />
              Chưa có mốc Kế toán nào<br/>
              <span className="text-xs">Hãy tạo một mốc thời gian để bắt đầu.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Right Column: Editor (Moved to left/top visually via CSS order) */}
      <div className="order-1 xl:order-1 w-full xl:col-span-3 flex flex-col gap-4">
        {activeVersion ? (
          <Card className="flex-1 border border-family-accent/10 shadow-md">
            <CardHeader className="flex flex-col border-b border-family-accent/10 pb-4">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-xl font-serif flex flex-wrap items-center gap-2">
                      <span>Biên tập Chi tiêu thường xuyên:</span>
                      <span className="text-family-accent whitespace-nowrap">Tháng {activeVersion.effectiveMonth}/{activeVersion.effectiveYear}</span>
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Nhập số tiền thực tế chi tiêu thường xuyên. Số tiền dư sẽ tự động chuyển vào phần Tiết kiệm/Đầu tư.
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center justify-between gap-4 bg-family-bgDark/5 p-2 rounded-xl border border-family-accent/10">
                  <div className="flex items-center gap-3">
                    {/* Nút Điền nhanh */}
                    {!isSettled && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newCats = { ...categories };
                          const expenseTreeTemp = budgetTree.filter((g: any) => g.classification === 'expense');
                          const allCatIds = expenseTreeTemp.flatMap((g: any) => collectLeafNodes(g)).map((c: any) => c.id);
                          allCatIds.forEach(id => {
                            newCats[id] = -1;
                          });
                          setCategories(newCats);
                        }}
                        className="text-xs h-8 px-3 rounded-full border-blue-200 text-blue-600 hover:bg-blue-50"
                        title="Tự động điền số liệu bằng đúng mức Ngân sách phân bổ"
                      >
                        <Zap className="w-3.5 h-3.5 mr-1.5" /> Dùng hết ngân sách
                      </Button>
                    )}

                    {/* Công tắc Chốt sổ */}
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm shrink-0">
                      <span className={`text-sm font-semibold ${isSettled ? 'text-emerald-600' : 'text-gray-500'}`}>
                        {isSettled ? 'Đã khóa sổ' : 'Chốt sổ'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsSettled(!isSettled)}
                        title="Khóa dữ liệu tháng này để không bị vô tình chỉnh sửa"
                        className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 focus:outline-none shrink-0 ${
                          isSettled ? 'bg-emerald-500' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${
                          isSettled ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {activeVersion && !isWithinObservationPeriod(activeVersion.effectiveMonth, activeVersion.effectiveYear, selectedPeriodKey) && (
                      <span className="text-red-500 text-[10px] w-full text-right">{getPeriodGuardMessage(selectedPeriodKey)}</span>
                    )}
                    <Button variant="outline" size="sm" onClick={() => { 
                      setCategories({}); 
                      setIsSettled(false); 
                      if (activeVersion) {
                        updateExpenseScheduleItem({
                          ...activeVersion,
                          categories: {},
                          status: 'active'
                        });
                      }
                    }} className="gap-2 shrink-0 border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700">
                      <RefreshCw className="w-4 h-4" /> Đặt lại
                    </Button>
                    <Button variant="danger" size="sm" onClick={handleDelete} className="gap-2 shrink-0">
                      <Trash2 className="w-4 h-4" /> Xóa mốc
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleSave} 
                      className="gap-2 shrink-0"
                      disabled={hasValidationError || (activeVersion ? !isWithinObservationPeriod(activeVersion.effectiveMonth, activeVersion.effectiveYear, selectedPeriodKey) : false)}
                    >
                      <Save className="w-4 h-4" /> Lưu mốc
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 bg-family-bgDark/5 p-5 rounded-2xl border border-family-accent/10">
                <div className="flex flex-col justify-center gap-4">
                  <div className="px-5 py-4 bg-white dark:bg-black/40 rounded-xl border border-family-accent/5 flex-1 shadow-sm flex flex-col justify-center">
                    <div className="text-[11px] text-family-textMuted font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-family-accent"></div>
                      Tổng Thực Chi
                    </div>
                    <div className="text-4xl font-bold text-family-accent">{formatTableMoneyVNDMillion(totalActual)}</div>
                  </div>
                  <div className="flex gap-4">
                    <div className="px-4 py-3 bg-white/80 dark:bg-black/20 rounded-xl border border-family-accent/5 flex-1 shadow-sm">
                      <div className="text-[10px] text-family-textMuted font-bold uppercase tracking-widest mb-1">Ngân Sách (Tham khảo)</div>
                      <div className="text-lg font-bold text-family-text">{formatTableMoneyVNDMillion(totalBudget)}</div>
                    </div>
                    <div className="px-4 py-3 bg-white/80 dark:bg-black/20 rounded-xl border border-family-accent/5 flex-1 shadow-sm">
                      <div className="text-[10px] text-family-textMuted font-bold uppercase tracking-widest mb-1">Chênh Lệch</div>
                      <div className={`text-lg font-bold ${totalBudget - totalActual >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {totalBudget - totalActual > 0 ? '+' : ''}{formatTableMoneyVNDMillion(totalBudget - totalActual)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="h-[220px] flex items-center justify-center relative bg-white/50 dark:bg-black/20 rounded-xl border border-family-accent/5 p-4">
                  {(() => {
                    const pieData = expenseTree.map(group => {
                      const leaves = collectLeafNodes(group);
                      const groupActual = leaves.reduce((sum, cat) => {
                        let val = safeNumber(categories[cat.id], 0);
                        if (val === -1) val = (activeIncome * cat.ratioPercent) / 100;
                        return sum + val;
                      }, 0);
                      return { name: group.name, value: groupActual };
                    }).filter(d => d.value > 0);

                    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
                      const RADIAN = Math.PI / 180;
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);

                      if (percent < 0.05) return null;

                      return (
                        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="bold" style={{ textShadow: '0px 1px 3px rgba(0,0,0,0.4)' }}>
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    };

                    if (totalActual === 0) {
                      return (
                        <div className="text-sm text-family-textMuted italic flex flex-col items-center justify-center h-full">
                          <PieChart className="w-12 h-12 mb-2 text-gray-300" />
                          Chưa có dữ liệu chi tiêu
                        </div>
                      );
                    }

                    return (
                      <div className="flex flex-col w-full h-full">
                        <div className="text-[10px] text-family-textMuted font-bold uppercase tracking-widest mb-1 w-full text-left pl-1">Cơ cấu Thực chi</div>
                        <div className="flex w-full flex-1 items-center gap-6">
                        <div className="w-[180px] h-[180px] relative shrink-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                outerRadius={85}
                                dataKey="value"
                                stroke="white"
                                strokeWidth={2}
                                labelLine={false}
                                label={renderCustomizedLabel}
                              >
                                {pieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Pie>
                              <RechartsTooltip 
                                formatter={(value: any) => [`${formatTableMoneyVNDMillion(value as number)}`, 'Thực chi']}
                                contentStyle={{ borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                                itemStyle={{ fontWeight: 600 }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-full pr-1">
                          {pieData.map((d, i) => (
                            <div key={d.name} className="flex items-center gap-2.5">
                              <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}></div>
                              <span className="text-[11px] font-medium text-family-text flex-1 truncate" title={d.name}>{d.name}</span>
                              <span className="text-[11px] font-bold text-family-accent shrink-0">{formatTableMoneyVNDMillion(d.value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {hasMissingCategories && (
                <WarningBox 
                  type="warning"
                  message="Ngân sách đã thay đổi cấu trúc so với trước đây. Có một số khoản chi tiêu mới cần bạn kiểm tra và cập nhật."
                />
              )}
              {hasValidationError && (
                <WarningBox 
                  type="danger"
                  message={`Bạn đã nhập quá số tiền phân bổ: ${validationWarnings.join(', ')}. Vui lòng điều chỉnh lại, hoặc bật công tắc "Đã sử dụng hết" ở trên nếu bạn chấp nhận lố ngân sách.`}
                />
              )}

              <div className="space-y-4">
                {expenseTree.map(group => {
                  const leaves = collectLeafNodes(group);
                  if (leaves.length === 0) return null;
                  
                  const isExpanded = expandedGroups[group.id];
                  
                  const groupBudget = (activeIncome * group.ratioPercent) / 100;
                  const groupActual = leaves.reduce((sum, cat) => {
                    let val = safeNumber(categories[cat.id], 0);
                    if (val === -1) val = (activeIncome * cat.ratioPercent) / 100;
                    return sum + val;
                  }, 0);
                  const groupRemaining = groupBudget - groupActual;

                  // Check if group is completely filled (-1 dynamically)
                  const isGroupFilled = leaves.length > 0 && leaves.every(cat => {
                    return categories[cat.id] === -1;
                  });

                  const handleToggleGroupFilled = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    const newCats = { ...categories };
                    if (isGroupFilled) {
                      // Unfill all
                      leaves.forEach(cat => {
                        delete newCats[cat.id];
                      });
                    } else {
                      // Fill all with dynamic -1
                      leaves.forEach(cat => {
                        newCats[cat.id] = -1;
                      });
                    }
                    setCategories(newCats);
                  };

                  return (
                    <div key={group.id} className="space-y-2 border border-family-accent/10 rounded-2xl p-4 bg-family-bgDark/5 transition-all">
                      <div 
                        className="font-bold text-family-text border-b border-family-accent/10 pb-2 mb-3 flex items-center gap-2 cursor-pointer hover:text-family-accent group"
                        onClick={() => { toggleGroup(group.id); }}
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-family-textMuted" /> : <ChevronRight className="w-4 h-4 text-family-textMuted" />}
                        <span>{group.name}</span>
                        <div className="ml-auto flex items-center gap-2 md:gap-3">
                          <div className="hidden sm:flex items-center gap-1.5 text-[10px] md:text-xs">
                            <span className="px-2 py-0.5 bg-gray-100/80 rounded text-gray-500" title="Ngân sách phân bổ">
                              PB: {formatTableMoneyVNDMillion(groupBudget)}
                            </span>
                            <span className="px-2 py-0.5 bg-gray-100/80 rounded text-gray-700 font-medium" title="Thực tế đã chi thường xuyên">
                              TC: {formatTableMoneyVNDMillion(groupActual)}
                            </span>
                            <span className={`px-2 py-0.5 rounded font-bold ${groupRemaining >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`} title="Tiền dư">
                              Dư: {groupRemaining > 0 ? '+' : ''}{formatTableMoneyVNDMillion(groupRemaining)}
                            </span>
                          </div>
                          <div className="sm:hidden text-xs font-bold text-family-textMuted">
                            {formatTableMoneyVNDMillion(groupBudget)}
                          </div>
                          <button 
                            type="button" 
                            onClick={handleToggleGroupFilled}
                            title={isGroupFilled ? "Bỏ dùng hết nhóm" : "Dùng hết toàn bộ nhóm"}
                            className={`p-1 transition-colors rounded-full hover:bg-black/5 ${isGroupFilled ? 'text-emerald-500' : 'text-gray-300 hover:text-emerald-400'}`}
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="space-y-3">
                          {leaves.map(cat => {
                            const budget = (activeIncome * cat.ratioPercent) / 100;
                            const roundedBudget = Math.round(budget * 100) / 100;
                            
                            const isCatFilled = categories[cat.id] === -1;
                            const actualRaw = safeNumber(categories[cat.id], 0);
                            const actual = isCatFilled ? budget : actualRaw;
                            
                            const eventImpact = eventImpacts[cat.id];
                            const totalCatActual = actual + (eventImpact?.total || 0);
                            const isOver = !isSettled && totalCatActual > budget;
                            
                            const handleToggleCatFilled = () => {
                              if (isCatFilled) {
                                const newCats = { ...categories };
                                delete newCats[cat.id];
                                setCategories(newCats);
                              } else {
                                handleCategoryChange(cat.id, "-1");
                              }
                            };
                            
                            return (
                              <div key={cat.id} className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-3 hover:bg-white border border-transparent hover:border-family-accent/10 hover:shadow-sm rounded-xl transition-all">
                                <div className="flex-1">
                                  <div className="text-sm font-semibold text-family-text">{cat.name}</div>
                                  {cat.note && <div className="text-[11px] text-family-textMuted mt-0.5">{cat.note}</div>}
                                  {eventImpact && (
                                    <div className="text-[11px] text-orange-600/80 font-medium mt-0.5 flex items-center gap-1">
                                      <WarningBox message={`Cộng ${eventImpact.total}tr từ sự kiện: ${eventImpact.names.join(', ')}`} type="warning" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-5 shrink-0">
                                  <div className="flex flex-col items-end justify-center h-full">
                                    <span className="text-[9px] uppercase font-bold text-family-textMuted">Phân bổ</span>
                                    <span className="text-sm font-bold text-family-textMuted">{formatTableMoneyVNDMillion(budget)}</span>
                                  </div>
                                  <div className="w-[120px] flex flex-col items-end">
                                    <span className="text-[9px] uppercase font-bold text-family-textMuted mb-1">
                                      Thực tế (tr)
                                    </span>
                                    <div className="relative w-full flex flex-col gap-1 items-end">
                                      <div className="flex items-center gap-1.5 w-full">
                                        <button 
                                          type="button" 
                                          onClick={handleToggleCatFilled}
                                          title={isCatFilled ? "Bỏ dùng hết" : "Dùng hết mức phân bổ (tự động khớp khi cập nhật NS)"}
                                          className={`p-1 transition-colors ${isCatFilled ? 'text-emerald-500' : 'text-gray-300 hover:text-emerald-400'}`}
                                        >
                                          <CheckCircle2 className="w-4 h-4" />
                                        </button>
                                        <div className="relative flex-1">
                                          <Input 
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            value={isCatFilled ? roundedBudget : (categories[cat.id] === undefined ? '' : categories[cat.id])}
                                            onChange={(e) => { handleCategoryChange(cat.id, e.target.value); }}
                                            placeholder="0"
                                            className={`text-right font-bold w-full h-8 px-2 text-sm ${isOver ? 'border-red-500 text-red-600 focus-visible:ring-red-500' : (isCatFilled ? 'text-emerald-600 bg-emerald-50/50' : 'text-family-accent')}`}
                                            disabled={isSettled || isCatFilled}
                                            title={eventImpact ? `Gồm số nhập tay + ${eventImpact.total}tr sự kiện` : undefined}
                                          />
                                          {isOver && <span className="absolute -bottom-4 right-0 text-[9px] text-red-500 font-bold whitespace-nowrap">Vượt mức!</span>}
                                        </div>
                                      </div>
                                      {eventImpact && (
                                        <div className="text-[10px] text-orange-500 font-bold mr-1">
                                          TỔNG: {formatTableMoneyVNDMillion(totalCatActual)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
            </CardContent>
          </Card>
        ) : (
          <Card className="flex-1 flex items-center justify-center p-12 text-center text-family-textMuted shadow-sm border border-family-accent/10">
            <div className="flex flex-col items-center">
              <Calendar className="w-12 h-12 mb-4 opacity-20" />
              <h3 className="text-lg font-bold text-family-text mb-1">Chưa chọn mốc Kế toán</h3>
              <p className="text-sm">Vui lòng chọn một mốc thời gian ở cột bên trái để bắt đầu nhập chi tiêu thường xuyên.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
