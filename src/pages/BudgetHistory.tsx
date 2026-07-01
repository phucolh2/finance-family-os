import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { WarningBox } from '../components/ui/WarningBox';
import { Trash2, Plus, Save, RotateCcw, Calendar, BarChart2, Check, Sliders, AlertTriangle } from 'lucide-react';
import { safeNumber } from '../utils/math';
import type { BudgetRatioScheduleItem, BudgetTreeNode } from '../types/budget';
import { BudgetVersionCompareChart } from '../components/budget/BudgetVersionCompareChart';
import { BudgetHistoryTrendChart } from '../components/budget/BudgetHistoryTrendChart';
import { BudgetHierarchyDoubleDonut } from '../components/budget/BudgetHierarchyDoubleDonut';
import { BudgetDecompositionTree } from '../components/budget/BudgetDecompositionTree';
import { BudgetTreeNodeRow } from '../components/budget/BudgetTreeNodeRow';
import { rebuildTreeFromFlatRatios, calculateBudget } from '../engines/budgetEngine';
import { DEFAULT_BUDGET_TREE } from '../data/defaultInputs';
import { ObservationControls } from '../components/ui/ObservationControls';

export const BudgetHistory: React.FC = () => {
  const { 
    state, 
    addBudgetScheduleItem, 
    updateBudgetScheduleItem, 
    deleteBudgetScheduleItem, 
    resetToDefault 
  } = useAppContext();

  // Sort schedule items by date
  const sortedHistory = [...state.budgetSchedule].sort((a, b) => {
    if (a.effectiveYear !== b.effectiveYear) {
      return a.effectiveYear - b.effectiveYear;
    }
    return a.effectiveMonth - b.effectiveMonth;
  });

  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(() => {
    return sortedHistory.length > 0 ? sortedHistory[0].id : null;
  });

  const activeVersion = sortedHistory.find(item => item.id === selectedVersionId) || sortedHistory[0];

  // Workspace Tabs: charts (BI visual analysis, default) vs editor (inputs & trees)
  const [workspaceTab, setWorkspaceTab] = useState<'editor' | 'charts'>('charts');

  // Workspace Local States (bound to active version)
  const [rootGroups, setRootGroups] = useState<BudgetTreeNode[]>([]);
  const [editMonth, setEditMonth] = useState<number>(1);
  const [editYear, setEditYear] = useState<number>(2028);
  const [editNote, setEditNote] = useState<string>('');
  
  // Find the real resolved income at the active milestone month using O(1) index map
  const activePeriodKey = `${activeVersion.effectiveYear}-${String(activeVersion.effectiveMonth).padStart(2, '0')}`;
  const activeDbItem = state.resolvedMonthlyDbMap?.[activePeriodKey];
  const milestoneIncome = activeDbItem ? activeDbItem.income : 80;
  const [chartMode, setChartMode] = useState<'donut' | 'tree'>('tree');
  const [formError, setFormError] = useState<string | null>(null);

  // New version creator state
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newMonth, setNewMonth] = useState<number>(10);
  const [newYear, setNewYear] = useState<number>(2027);
  const [newNote, setNewNote] = useState<string>('');

  // Expanded groups in tree editor
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    group_housing_basic: true,
    group_future_investing: true,
    group_safety_reserve: true,
    group_family_experience: true,
    group_health_growth: true,
  });

  // Sync workspace state when active version changes
  useEffect(() => {
    if (activeVersion) {
      setEditMonth(activeVersion.effectiveMonth);
      setEditYear(activeVersion.effectiveYear);
      setEditNote(activeVersion.note || '');
      
      if (activeVersion.rootGroups && activeVersion.rootGroups.length > 0) {
        setRootGroups(JSON.parse(JSON.stringify(activeVersion.rootGroups)));
      } else if (activeVersion.ratios && activeVersion.ratios.length > 0) {
        setRootGroups(rebuildTreeFromFlatRatios(activeVersion.ratios));
      } else {
        setRootGroups(JSON.parse(JSON.stringify(DEFAULT_BUDGET_TREE)));
      }
      setFormError(null);
    }
  }, [activeVersion?.id]);

  const handleToggleExpand = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleUpdateNode = (id: string, fields: Partial<BudgetTreeNode>) => {
    const updateRecursive = (nodes: BudgetTreeNode[]): BudgetTreeNode[] => {
      return nodes.map((node) => {
        if (node.id === id) {
          const updatedNode = { ...node, ...fields };
          const parentRatio = fields.ratioPercent;
          
          if (node.nodeType === 'group' && parentRatio !== undefined && node.children && node.children.length > 0) {
            const activeChildren = node.children.filter(c => c.isActive !== false);
            const originalChildrenSum = activeChildren.reduce((sum, c) => sum + c.ratioPercent, 0);
            
            if (originalChildrenSum > 0) {
              let remaining = parentRatio;
              updatedNode.children = node.children.map((child) => {
                if (child.isActive === false) return child;
                
                const scaled = Math.round((child.ratioPercent / originalChildrenSum) * parentRatio * 10) / 10;
                remaining = Math.round((remaining - scaled) * 10) / 10;
                
                return {
                  ...child,
                  ratioPercent: scaled,
                };
              });
              
              if (updatedNode.children.length > 0) {
                const activeChildrenUpdated = updatedNode.children.filter(c => c.isActive !== false);
                if (activeChildrenUpdated.length > 0) {
                  const newChildrenSumWithoutLast = activeChildrenUpdated
                    .slice(0, -1)
                    .reduce((sum, c) => sum + c.ratioPercent, 0);
                  
                  const targetLastRatio = Math.max(0, Math.round((parentRatio - newChildrenSumWithoutLast) * 10) / 10);
                  
                  let activeCount = 0;
                  updatedNode.children = updatedNode.children.map(c => {
                    if (c.isActive === false) return c;
                    activeCount++;
                    if (activeCount === activeChildrenUpdated.length) {
                      return { ...c, ratioPercent: targetLastRatio };
                    }
                    return c;
                  });
                }
              }
            } else {
              const activeCount = activeChildren.length;
              if (activeCount > 0) {
                const equalShare = Math.round((parentRatio / activeCount) * 10) / 10;
                let remaining = parentRatio;
                
                updatedNode.children = node.children.map((child, idx) => {
                  if (child.isActive === false) return child;
                  const isLastActive = idx === node.children!.map(c => c.isActive !== false).lastIndexOf(true);
                  const share = isLastActive ? remaining : equalShare;
                  remaining = Math.round((remaining - share) * 10) / 10;
                  return {
                    ...child,
                    ratioPercent: share,
                  };
                });
              }
            }
          }
          return updatedNode;
        }
        
        if (node.children && node.children.length > 0) {
          const updatedChildren = updateRecursive(node.children);
          const hasRatioChange = node.children.some((c, idx) => c.ratioPercent !== updatedChildren[idx].ratioPercent || c.isActive !== updatedChildren[idx].isActive);
          if (hasRatioChange && node.nodeType === 'group') {
            const activeChildren = updatedChildren.filter(c => c.isActive !== false);
            const childrenSum = activeChildren.reduce((sum, c) => sum + c.ratioPercent, 0);
            return {
              ...node,
              children: updatedChildren,
              ratioPercent: Math.round(childrenSum * 10) / 10,
            };
          }
          
          return { ...node, children: updatedChildren };
        }
        return node;
      });
    };
    
    setRootGroups(updateRecursive(rootGroups));
  };

  const handleDeleteNode = (id: string) => {
    const deleteRecursive = (nodes: BudgetTreeNode[]): BudgetTreeNode[] => {
      return nodes
        .filter((n) => n.id !== id)
        .map((node) => {
          if (node.children && node.children.length > 0) {
            return { ...node, children: deleteRecursive(node.children) };
          }
          return node;
        });
    };

    const nextGroups = deleteRecursive(rootGroups);

    const finalGroups = nextGroups.map((group) => {
      if (group.children && group.children.length > 0) {
        const activeChildren = group.children.filter((c) => c.isActive !== false);
        const childrenSum = activeChildren.reduce((sum, c) => sum + c.ratioPercent, 0);
        return {
          ...group,
          ratioPercent: Math.round(childrenSum * 10) / 10,
        };
      }
      return group;
    });

    setRootGroups(finalGroups);
  };

  const handleAddChild = (parentId: string) => {
    const addRecursive = (nodes: BudgetTreeNode[]): BudgetTreeNode[] => {
      return nodes.map((node) => {
        if (node.id === parentId) {
          const children = node.children || [];
          const newChild: BudgetTreeNode = {
            id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            parentId: parentId,
            level: 1,
            nodeType: 'item',
            groupId: node.groupId,
            name: 'Hạng mục mới',
            ratioPercent: 0,
            isActive: true,
            sortOrder: children.length + 1,
          };
          return { ...node, children: [...children, newChild] };
        }
        if (node.children && node.children.length > 0) {
          return { ...node, children: addRecursive(node.children) };
        }
        return node;
      });
    };

    setRootGroups(addRecursive(rootGroups));
    setExpandedGroups((prev) => ({ ...prev, [parentId]: true }));
  };

  const handleSaveChanges = () => {
    if (editMonth < 1 || editMonth > 12) {
      setFormError('Tháng hiệu lực phải từ 1 đến 12.');
      return;
    }
    if (editYear < 2026 || editYear > 2060) {
      setFormError('Năm hiệu lực phải từ 2026 đến 2060.');
      return;
    }

    const totalRatio = rootGroups.reduce((sum, g) => sum + (g.isActive ? g.ratioPercent : 0), 0);
    if (Math.abs(totalRatio - 100) > 0.05) {
      setFormError('Tổng tỷ lệ các nhóm chính phải bằng 100%.');
      return;
    }

    updateBudgetScheduleItem({
      id: activeVersion.id,
      effectiveMonth: editMonth,
      effectiveYear: editYear,
      note: editNote,
      rootGroups: rootGroups,
    });
    setFormError(null);
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMonth < 1 || newMonth > 12) {
      setFormError('Tháng hiệu lực phải từ 1 đến 12.');
      return;
    }
    if (newYear < 2026 || newYear > 2060) {
      setFormError('Năm hiệu lực phải từ 2026 đến 2060.');
      return;
    }

    const templateTree = activeVersion?.rootGroups && activeVersion.rootGroups.length > 0
      ? JSON.parse(JSON.stringify(activeVersion.rootGroups))
      : JSON.parse(JSON.stringify(DEFAULT_BUDGET_TREE));

    const newItem = {
      effectiveMonth: newMonth,
      effectiveYear: newYear,
      note: newNote,
      rootGroups: templateTree,
    };

    addBudgetScheduleItem(newItem);
    setIsCreatingNew(false);
    setNewNote('');
    setFormError(null);
  };

  const savedTreeStr = JSON.stringify(
    activeVersion?.rootGroups && activeVersion.rootGroups.length > 0
      ? activeVersion.rootGroups
      : (activeVersion?.ratios && activeVersion.ratios.length > 0
          ? rebuildTreeFromFlatRatios(activeVersion.ratios)
          : DEFAULT_BUDGET_TREE)
  );

  const currentTreeStr = JSON.stringify(rootGroups);

  const isDirty = activeVersion ? (
    editMonth !== activeVersion.effectiveMonth ||
    editYear !== activeVersion.effectiveYear ||
    editNote !== (activeVersion.note || '') ||
    currentTreeStr !== savedTreeStr
  ) : false;

  const totalRatio = rootGroups.reduce((sum, g) => sum + (g.isActive ? g.ratioPercent : 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-family-text">Lịch sử Phân bổ Ngân sách</h1>
          <p className="text-sm text-family-textMuted mt-1">
            Quản lý và trực quan hóa cơ cấu ngân sách gia đình qua các mốc thời gian cuộc đời.
          </p>
        </div>
        <ObservationControls />
      </div>
      
      {/* Workspace tab selectors */}
      <div className="flex justify-end pt-1">
        <div className="flex bg-family-bgDark p-1 rounded-xl border border-family-accent/15 h-10 shrink-0">
          <button
            type="button"
            onClick={() => setWorkspaceTab('charts')}
            className={`text-xs py-1.5 px-4 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              workspaceTab === 'charts' ? 'bg-family-accent text-white shadow-sm' : 'text-family-textMuted hover:text-family-text'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" /> 1. Trực quan hóa BI
          </button>
          <button
            type="button"
            onClick={() => setWorkspaceTab('editor')}
            className={`text-xs py-1.5 px-4 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              workspaceTab === 'editor' ? 'bg-family-accent text-white shadow-sm' : 'text-family-textMuted hover:text-family-text'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> 2. Biên tập Cây tỷ lệ
          </button>
        </div>
      </div>

      {formError && <WarningBox type="danger" message={formError} />}

      {/* Creation Modal / Form - Only shown if triggered */}
      {isCreatingNew && (
        <Card className="border-family-accent/30 bg-family-bgDark/20 shadow-md">
          <CardHeader>
            <CardTitle>Thêm cột mốc ngân sách lịch sử</CardTitle>
            <CardDescription>
              Tạo mốc mới. Cấu trúc cây con sẽ được sao chép tự động từ phiên bản mốc đang được chọn.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateNew} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Tháng hiệu lực"
                  type="number"
                  min={1}
                  max={12}
                  value={newMonth}
                  onChange={(e) => setNewMonth(Number(e.target.value))}
                  required
                />
                <Input
                  label="Năm hiệu lực"
                  type="number"
                  min={2026}
                  max={2060}
                  value={newYear}
                  onChange={(e) => setNewYear(Number(e.target.value))}
                  required
                />
                <Input
                  label="Ghi chú hoàn cảnh"
                  type="text"
                  placeholder="Ví dụ: Khi sinh bé thứ 2..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreatingNew(false)}>Hủy</Button>
                <Button type="submit" className="gap-2">
                  <Check className="w-4 h-4" /> Khởi tạo phiên bản
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 1: PURE FULL-WIDTH BI VISUALIZATION CENTER */}
      {workspaceTab === 'charts' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-family-bgDark/35 p-4 rounded-2xl border border-family-accent/10 shadow-sm">
            <div>
              <span className="text-xs text-family-textMuted uppercase font-bold tracking-wider">Cột mốc đang xem báo cáo</span>
              <h2 className="text-lg font-bold text-family-accent mt-0.5">
                Tháng {activeVersion?.effectiveMonth}/{activeVersion?.effectiveYear} — {activeVersion?.note || 'Không có ghi chú'}
              </h2>
            </div>
            
            <div className="text-right">
              <span className="text-xs text-family-textMuted uppercase font-bold tracking-wider block">Thu nhập thực tế mốc</span>
              <span className="text-xl font-extrabold text-family-text">
                {milestoneIncome} Tr VND
              </span>
            </div>
          </div>

          {/* Top Row: Side-by-side Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Card 1: Active Milestone Hierarchy (Power BI Tree / Sunburst) */}
            <Card className="border border-family-accent/10 p-4 bg-family-bgDark/5 flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-family-accent/5 pb-3 mb-4">
                <div>
                  <h4 className="font-bold text-sm text-family-text uppercase tracking-wider">
                    Cơ cấu mốc hiện tại
                  </h4>
                  <p className="text-xs text-family-textMuted mt-0.5">Biểu đồ phân cấp danh mục con</p>
                </div>
                
                <div className="flex bg-family-bgDark p-1 rounded-xl border border-family-accent/10 h-8 w-44">
                  <button
                    type="button"
                    onClick={() => setChartMode('tree')}
                    className={`flex-1 text-[9px] rounded-lg font-bold transition-all ${
                      chartMode === 'tree' ? 'bg-family-accent text-white shadow-sm' : 'text-family-textMuted'
                    }`}
                  >
                    Power BI Tree
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMode('donut')}
                    className={`flex-1 text-[9px] rounded-lg font-bold transition-all ${
                      chartMode === 'donut' ? 'bg-family-accent text-white shadow-sm' : 'text-family-textMuted'
                    }`}
                  >
                    Sunburst
                  </button>
                </div>
              </div>

              <div className="h-80 flex items-center justify-center bg-family-bgDark/20 rounded-xl p-2 shadow-inner mt-auto overflow-y-auto">
                {chartMode === 'tree' ? (
                  <BudgetDecompositionTree rootGroups={rootGroups} income={milestoneIncome} />
                ) : (
                  <BudgetHierarchyDoubleDonut rootGroups={rootGroups} income={milestoneIncome} />
                )}
              </div>
            </Card>

            {/* Card 2: Historical Compare Stacked Bar (%) */}
            <Card className="border border-family-accent/10 p-4 bg-family-bgDark/5 flex flex-col">
              <div className="border-b border-family-accent/5 pb-3 mb-4">
                <h4 className="font-bold text-sm text-family-text uppercase tracking-wider">
                  Biến động tỷ trọng qua các mốc (%)
                </h4>
                <p className="text-xs text-family-textMuted mt-0.5">So sánh dịch chuyển cơ cấu tỷ trọng giữa các phiên bản</p>
              </div>
              <div className="h-80 flex items-center justify-center bg-family-bgDark/20 rounded-xl p-2 shadow-inner mt-auto">
                <BudgetVersionCompareChart schedule={state.budgetSchedule} />
              </div>
            </Card>
          </div>

          {/* Bottom Row: Full-width Trend Chart */}
          <div className="mt-6">
            {/* Card 3: Historical Cost Trend Bar Chart */}
            <Card className="border border-family-accent/10 p-4 bg-family-bgDark/5 flex flex-col w-full">
              <div className="border-b border-family-accent/5 pb-3 mb-4">
                <h4 className="font-bold text-sm text-family-text uppercase tracking-wider">
                  Xu hướng chi phí theo thời gian
                </h4>
                <p className="text-xs text-family-textMuted mt-0.5">Số tiền mặt hàng tháng (Triệu VND) phân phối qua các mốc</p>
              </div>
              <div className="h-[340px] flex items-center justify-center bg-family-bgDark/20 rounded-xl p-2 shadow-inner w-full">
                <BudgetHistoryTrendChart schedule={state.budgetSchedule} resolvedMonthlyDb={state.resolvedMonthlyDb || []} />
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: EDITING AND MILESTONE TREE CONFIGURATION */}
      {workspaceTab === 'editor' && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
          
          {/* Timeline Navigator Panel (with Add Milestone and Reset actions inside!) */}
          <Card className="xl:col-span-1 border border-family-accent/10 shadow-sm self-start">
            <CardHeader className="pb-3 border-b border-family-accent/5 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm uppercase tracking-wider text-family-textMuted">
                  Mốc thời gian
                </CardTitle>
                <div className="flex gap-1.5">
                  <Button variant="secondary" size="sm" onClick={resetToDefault} className="h-7 px-2 text-[10px]">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" onClick={() => setIsCreatingNew(true)} className="h-7 px-2 text-[10px] gap-1">
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <CardDescription className="text-[11px]">Chọn mốc để chỉnh sửa cây ngân sách con</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 max-h-[500px] overflow-y-auto pr-1">
              <div className="relative border-l-2 border-family-accent/25 ml-4 pl-4 space-y-5">
                {sortedHistory.map((item) => {
                  const isSelected = item.id === selectedVersionId;
                  const hasTree = item.rootGroups && item.rootGroups.length > 0;
                  const childRatios = hasTree ? item.rootGroups : [];
                  const itemTotal = childRatios.reduce((sum, g) => sum + (g.isActive ? g.ratioPercent : 0), 0);
                  const hasMismatch = Math.abs(itemTotal - 100) > 0.05;

                  return (
                    <div key={item.id} className="relative group">
                      {/* Node Dot */}
                      <div 
                        onClick={() => setSelectedVersionId(item.id)}
                        className={`absolute -left-[25px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-family-bgDeep cursor-pointer transition-all duration-150 ${
                          isSelected 
                            ? 'bg-family-accent scale-125 ring-4 ring-family-accent/20' 
                            : 'bg-family-textLight hover:bg-family-accent'
                        }`}
                      />
                      
                      {/* Navigation Item card */}
                      <div 
                        onClick={() => setSelectedVersionId(item.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-family-accent/15 border-family-accent/40 shadow-sm' 
                            : 'bg-family-bgDark/20 border-family-accent/5 hover:border-family-accent/15'
                        }`}
                      >
                        <div className="flex justify-between items-center gap-1.5">
                          <span className="text-xs font-bold text-family-text">
                            Tháng {item.effectiveMonth}/{item.effectiveYear}
                          </span>
                          
                          <div className="flex items-center gap-1.5 shrink-0">
                            {hasMismatch && (
                              <span title="Tổng tỷ lệ lệch 100%" className="inline-flex items-center">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              </span>
                            )}
                            {isSelected && isDirty && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveChanges();
                                }}
                                disabled={Math.abs(totalRatio - 100) > 0.05}
                                className="p-1 rounded-md bg-family-accent text-white hover:bg-family-accent/80 transition-all disabled:opacity-50"
                                title="Lưu thay đổi"
                              >
                                <Save className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteBudgetScheduleItem(item.id);
                                if (selectedVersionId === item.id) {
                                  setSelectedVersionId(null);
                                }
                              }}
                              disabled={state.budgetSchedule.length <= 1}
                              className="p-1 rounded-md text-family-textMuted hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50"
                              title="Xóa mốc"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-[10px] text-family-textMuted truncate mt-1">
                          {item.note || 'Không có ghi chú'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Right Editor Workspace Column (3/4 width) */}
          <div className="xl:col-span-3 space-y-6">
            {activeVersion ? (
              <Card className="border border-family-accent/10 shadow-md">
                
                {/* Workspace Header: Selected Milestone Title and Save actions */}
                <CardHeader className="border-b border-family-accent/10 pb-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl font-serif flex items-center gap-2">
                        Biên tập mốc: <span className="text-family-accent">Tháng {editMonth}/{editYear}</span>
                      </CardTitle>
                      <CardDescription>
                        Điều chỉnh chi tiết ngày hiệu lực và tỷ lệ cơ cấu cây ngân sách.
                      </CardDescription>
                    </div>
                    
                    {isDirty && (
                      <Button 
                        onClick={handleSaveChanges} 
                        className="gap-2 self-start md:self-center"
                        disabled={Math.abs(totalRatio - 100) > 0.05}
                      >
                        <Save className="w-4 h-4" /> Lưu thay đổi của mốc
                      </Button>
                    )}
                  </div>

                  {/* Settings form fields (effective date inputs moved here!) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 bg-family-bgDark/35 p-4 rounded-2xl border border-family-accent/5">
                    <Input
                      label="Tháng hiệu lực"
                      type="number"
                      min={1}
                      max={12}
                      value={editMonth}
                      onChange={(e) => setEditMonth(Number(e.target.value))}
                    />
                    <Input
                      label="Năm hiệu lực"
                      type="number"
                      min={2026}
                      max={2060}
                      value={editYear}
                      onChange={(e) => setEditYear(Number(e.target.value))}
                    />
                    <Input
                      label="Ghi chú hoàn cảnh mốc"
                      type="text"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                    />
                  </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-4">
                  {Math.abs(totalRatio - 100) > 0.05 && (
                    <WarningBox
                      type="warning"
                      message={`Tổng tỷ lệ phân bổ của các nhóm chính hiện tại là ${totalRatio}%, khác biệt so với mức chuẩn 100%. Vui lòng chỉnh sửa để có thể Lưu mốc.`}
                    />
                  )}
                  <div className="space-y-4">
                    {rootGroups.map((group) => {
                      const isExpanded = !!expandedGroups[group.id];
                      return (
                        <div key={group.id} className="space-y-2 border border-family-accent/10 rounded-2xl p-2.5 bg-family-bgDark/5">
                          <BudgetTreeNodeRow
                            node={group}
                            onUpdate={handleUpdateNode}
                            onDelete={handleDeleteNode}
                            onAddChild={handleAddChild}
                            isExpanded={isExpanded}
                            onToggleExpand={() => handleToggleExpand(group.id)}
                          />
                          {isExpanded && group.children && group.children.map((child) => (
                            <BudgetTreeNodeRow
                              key={child.id}
                              node={child}
                              onUpdate={handleUpdateNode}
                              onDelete={handleDeleteNode}
                              onAddChild={handleAddChild}
                              isExpanded={false}
                              onToggleExpand={() => {}}
                            />
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="bg-family-bgDark/20 border border-dashed border-family-accent/20 rounded-2xl p-12 text-center text-family-textMuted font-bold">
                Vui lòng chọn một mốc thời gian để biên tập
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
