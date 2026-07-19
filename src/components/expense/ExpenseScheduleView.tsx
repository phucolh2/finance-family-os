import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { WarningBox } from '../../components/ui/WarningBox';
import { Plus, Save, Trash2, Calendar, ChevronDown, ChevronRight, CheckCircle2, Wallet, PiggyBank, CircleDollarSign } from 'lucide-react';
import { safeNumber } from '../../utils/math';
import { formatTableMoneyVNDMillion } from '../../utils/format';
import { rebuildTreeFromFlatRatios } from '../../engines/budgetEngine';
import { SavingsDepositModule } from '../portfolio/SavingsDepositModule';

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
  const activeBudgetSchedule = state.budgetSchedule.find(s => 
    s.effectiveYear * 12 + s.effectiveMonth <= (activeVersion ? activeVersion.effectiveYear * 12 + activeVersion.effectiveMonth : new Date().getFullYear() * 12 + new Date().getMonth() + 1)
  ) || state.budgetSchedule[0];

  const budgetTree = activeBudgetSchedule 
    ? (activeBudgetSchedule.rootGroups || rebuildTreeFromFlatRatios(activeBudgetSchedule.ratios || []))
    : [];

  const [isCreatingNew, setIsCreatingNew] = useState(false);
  
  React.useEffect(() => {
    setIsCreatingNew(false);
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
      const allCatIds = flattenTree(expenseTree).filter(n => n.nodeType === 'item' || n.nodeType === 'subitem' || (n.nodeType === 'group' && (!n.children || n.children.length === 0))).map(c => c.id);
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
  
  // Flatten budget tree to get all leaf items
  const flattenTree = (nodes: any[]): any[] => {
    let result: any[] = [];
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        result.push(node);
        result = result.concat(flattenTree(node.children));
      } else {
        result.push(node);
      }
    });
    return result;
  };

  const expenseTree = budgetTree.filter(g => g.classification === 'expense');
  const allCategories = flattenTree(expenseTree).filter(n => n.nodeType === 'item' || n.nodeType === 'subitem' || (n.nodeType === 'group' && (!n.children || n.children.length === 0)));

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
    return sum + val;
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

      if (!isSettled && actual > budget) {
        validationWarnings.push(`"${cat.name}" vượt ngân sách (lố ${formatTableMoneyVNDMillion(actual - budget)} tr).`);
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
      {/* Left Column: Timeline */}
      <Card className="xl:col-span-1 border border-family-accent/10 shadow-sm self-start">
        <CardHeader className="pb-3 border-b border-family-accent/5 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm uppercase tracking-wider text-family-textMuted">Mốc thời gian</CardTitle>
            <div className="flex gap-1.5">
              <Button size="sm" onClick={() => { setIsCreatingNew(true); }} className="h-7 px-2 text-[10px] gap-1" title="Thêm mốc kế toán">
                <Plus className="w-3 h-3" /> Thêm mốc
              </Button>
            </div>
          </div>
          <CardDescription className="text-[11px]">Chọn mốc để nhập chi tiêu thực tế</CardDescription>
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
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => { setIsCreatingNew(false); }}>Hủy</Button>
                <Button size="sm" onClick={handleCreateNew}>Lưu mốc</Button>
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

      {/* Right Column: Editor */}
      <div className="w-full xl:col-span-3 flex flex-col gap-4">
        {activeVersion ? (
          <Card className="flex-1 border border-family-accent/10 shadow-md">
            <CardHeader className="flex flex-col border-b border-family-accent/10 pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-serif flex items-center gap-2">
                    Biên tập Thực tế chi tiêu: <span className="text-family-accent">Tháng {activeVersion.effectiveMonth}/{activeVersion.effectiveYear}</span>
                  </CardTitle>
                  <CardDescription>
                    Nhập số tiền thực tế chi tiêu. Số tiền dư sẽ tự động chuyển vào phần Tiết kiệm/Đầu tư.
                  </CardDescription>
                </div>
                
                <div className="flex items-center gap-4 self-start md:self-center">
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                    <span className={`text-sm font-semibold ${isSettled ? 'text-emerald-600' : 'text-gray-500'}`}>
                      Đã sử dụng hết
                    </span>
                    <button
                      type="button"
                      onClick={() => { setIsSettled(!isSettled); }}
                      className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 focus:outline-none shrink-0 ${
                        isSettled ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ${
                        isSettled ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                  
                  <Button variant="danger" size="sm" onClick={handleDelete} className="gap-2 shrink-0">
                    <Trash2 className="w-4 h-4" /> Xóa mốc
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSave} 
                    className="gap-2 shrink-0"
                    disabled={hasValidationError}
                  >
                    <Save className="w-4 h-4" /> Lưu mốc
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mt-6">
                <div className="px-4 py-3 bg-family-bgDark/35 rounded-xl border border-family-accent/5 flex-1 min-w-[200px]">
                  <div className="text-xs text-family-textMuted font-bold uppercase tracking-wider mb-1">Tổng Thực Chi</div>
                  <div className="text-2xl font-bold text-family-accent">{formatTableMoneyVNDMillion(totalActual)} <span className="text-sm font-normal text-family-textMuted">tr VNĐ</span></div>
                </div>
                <div className="px-4 py-3 bg-family-bgDark/35 rounded-xl border border-family-accent/5 flex-1 min-w-[200px]">
                  <div className="text-xs text-family-textMuted font-bold uppercase tracking-wider mb-1">Ngân Sách (Tham khảo)</div>
                  <div className="text-2xl font-bold text-family-text">{formatTableMoneyVNDMillion(totalBudget)} <span className="text-sm font-normal text-family-textMuted">tr VNĐ</span></div>
                </div>
                <div className="px-4 py-3 bg-family-bgDark/35 rounded-xl border border-family-accent/5 flex-1 min-w-[200px]">
                  <div className="text-xs text-family-textMuted font-bold uppercase tracking-wider mb-1">Chênh Lệch</div>
                  <div className={`text-2xl font-bold ${totalBudget - totalActual >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {totalBudget - totalActual >= 0 ? '+' : ''}{formatTableMoneyVNDMillion(totalBudget - totalActual)} <span className="text-sm font-normal text-family-textMuted">tr VNĐ</span>
                  </div>
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
                  const leaves = flattenTree([group]).filter(n => n.nodeType === 'item' || n.nodeType === 'subitem' || (n.nodeType === 'group' && (!n.children || n.children.length === 0)));
                  if (leaves.length === 0) return null;
                  
                  const isExpanded = expandedGroups[group.id];
                  
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
                        <div className="ml-auto flex items-center gap-3">
                          <span className="text-xs font-normal px-2 py-0.5 bg-family-bgDeep border border-family-accent/10 rounded-md text-family-textMuted">
                            {formatTableMoneyVNDMillion((activeIncome * group.ratioPercent) / 100)} tr
                          </span>
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
                            
                            const isOver = !isSettled && actual > budget;
                            
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
                                </div>
                                <div className="flex items-center gap-5 shrink-0">
                                  <div className="flex flex-col items-end justify-center h-full">
                                    <span className="text-[9px] uppercase font-bold text-family-textMuted">Phân bổ</span>
                                    <span className="text-sm font-bold text-family-textMuted">{formatTableMoneyVNDMillion(budget)} tr</span>
                                  </div>
                                  <div className="w-[120px] flex flex-col items-end">
                                    <span className="text-[9px] uppercase font-bold text-family-textMuted mb-1">Thực tế (tr)</span>
                                    <div className="relative w-full flex items-center gap-1.5">
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
                                        />
                                        {isOver && <span className="absolute -bottom-4 right-0 text-[9px] text-red-500 font-bold whitespace-nowrap">Vượt mức!</span>}
                                      </div>
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
              
              {/* Unspent Dashboard */}
              {totalRemaining > 0 && activeVersion && (
                <div className="pt-6 border-t border-family-accent/10 mt-8">
                  <h3 className="text-lg font-bold text-family-text mb-4 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-family-accent" /> Phân bổ Tiền dư trong tháng
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-family-textMuted uppercase">Tổng tiền dư</p>
                        <p className="text-2xl font-bold text-emerald-600">{formatTableMoneyVNDMillion(totalRemaining)} Tr</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <Wallet className="w-5 h-5" />
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-family-textMuted uppercase">Đã gửi tiết kiệm</p>
                        <p className="text-2xl font-bold text-sky-600">{formatTableMoneyVNDMillion(savingsThisMonth)} Tr</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600">
                        <PiggyBank className="w-5 h-5" />
                      </div>
                    </div>
                    
                    <div className={`bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between ${idleMoney > 0 ? 'ring-1 ring-orange-200' : ''}`}>
                      <div>
                        <p className="text-sm font-semibold text-family-textMuted uppercase">Tiền nhàn rỗi (Chưa sinh lời)</p>
                        <p className={`text-2xl font-bold ${idleMoney > 0 ? 'text-orange-600' : 'text-slate-400'}`}>{formatTableMoneyVNDMillion(idleMoney)} Tr</p>
                      </div>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${idleMoney > 0 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                        <CircleDollarSign className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  {/* Embed Savings Module directly for quick access */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <SavingsDepositModule 
                      defaultStartMonth={activeVersion.effectiveMonth} 
                      defaultStartYear={activeVersion.effectiveYear} 
                      filterCurrentMonthOnly={true} 
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="flex-1 flex items-center justify-center p-12 text-center text-family-textMuted shadow-sm border border-family-accent/10">
            <div className="flex flex-col items-center">
              <Calendar className="w-12 h-12 mb-4 opacity-20" />
              <h3 className="text-lg font-bold text-family-text mb-1">Chưa chọn mốc Kế toán</h3>
              <p className="text-sm">Vui lòng chọn một mốc thời gian ở cột bên trái để bắt đầu nhập chi tiêu thực tế.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
