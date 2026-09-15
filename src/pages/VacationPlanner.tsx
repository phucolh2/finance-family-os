import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import { Palmtree, Plus, Trash2, Edit3, MapPin, Users, Calendar, ChevronDown, ChevronUp, BarChart3, Lightbulb, CheckCircle2, X } from 'lucide-react';
import { formatTableMoneyVNDMillion } from '../utils/format';
import type { VacationTrip, VacationPlannerConfig, VacationStatus, ChecklistItem } from '../types/vacation';
import { VACATION_CATEGORIES, VACATION_STATUS_MAP, TRIP_EMOJIS } from '../types/vacation';
import { DESTINATION_SUGGESTIONS, TRAVEL_TIPS, PACKING_CHECKLIST } from '../data/vacationSuggestions';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const PIE_COLORS = ['#f43f5e', '#8b5cf6', '#f59e0b', '#10b981', '#3b82f6', '#6b7280'];

export const VacationPlanner: React.FC = () => {
  const { state, updateToolConfig } = useAppContext();
  
  const config: VacationPlannerConfig = state.toolConfigs?.vacationPlanner || { trips: [] };
  const trips = config.trips || [];
  const tipsChecklist = config.tipsChecklist || {};
  const customChecklist = config.customChecklist || [];

  // Combine default checklist + custom checklist items
  const allChecklistItems = useMemo(() => {
    return [...PACKING_CHECKLIST, ...customChecklist];
  }, [customChecklist]);

  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Giấy tờ');
  const [checklistFilter, setChecklistFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [isAddingItem, setIsAddingItem] = useState(false);

  const totalChecklistCount = allChecklistItems.length;
  const completedChecklistCount = allChecklistItems.filter(item => tipsChecklist[item.id]).length;
  const checklistPercent = totalChecklistCount > 0 ? Math.round((completedChecklistCount / totalChecklistCount) * 100) : 0;

  const handleAddChecklistItem = () => {
    if (!newItemLabel.trim()) return;
    const newItem: ChecklistItem = {
      id: `custom_pack_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      label: newItemLabel.trim(),
      category: newItemCategory,
    };
    saveConfig({
      ...config,
      customChecklist: [...customChecklist, newItem],
    });
    setNewItemLabel('');
    setIsAddingItem(false);
  };

  const handleDeleteChecklistItem = (id: string) => {
    const updatedCustom = customChecklist.filter(item => item.id !== id);
    const updatedTipsChecklist = { ...tipsChecklist };
    delete updatedTipsChecklist[id];
    saveConfig({
      ...config,
      customChecklist: updatedCustom,
      tipsChecklist: updatedTipsChecklist,
    });
  };

  const handleToggleAllChecklist = (checkAll: boolean) => {
    const newChecklist = { ...tipsChecklist };
    allChecklistItems.forEach(item => {
      newChecklist[item.id] = checkAll;
    });
    saveConfig({
      ...config,
      tipsChecklist: newChecklist,
    });
  };

  const saveConfig = (newConfig: VacationPlannerConfig) => {
    updateToolConfig('vacationPlanner', newConfig);
  };

  const [activeTab, setActiveTab] = useState<'plan' | 'overview' | 'tips'>('plan');
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editTripId, setEditTripId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<VacationTrip>>({});

  // Tip Expand State
  const [expandedTipCategory, setExpandedTipCategory] = useState<string | null>(null);

  const latestMonth = state.resolvedMonthlyDb?.[state.resolvedMonthlyDb.length - 1];
  const monthlyIncome = latestMonth?.income || 0;

  // Auto-save form if needed, or debounced. Currently explicit save.
  useEffect(() => {
    // just to use useEffect
  }, []);

  const handleOpenForm = (trip?: VacationTrip) => {
    if (trip) {
      setEditTripId(trip.id);
      setFormData(trip);
    } else {
      setEditTripId(null);
      setFormData({
        id: `trip_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        name: '',
        destination: '',
        emoji: '🏖️',
        startDate: '',
        endDate: '',
        adults: 2,
        children: 0,
        status: 'dreaming',
        notes: '',
        budgetItems: VACATION_CATEGORIES.map(c => ({ category: c.id, planned: 0, actual: 0 })),
        createdAt: Date.now()
      });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditTripId(null);
    setFormData({});
  };

  const handleSaveForm = () => {
    if (!formData.id || !formData.name) return;
    
    const newTrips = editTripId
      ? trips.map(t => (t.id === editTripId ? formData as VacationTrip : t))
      : [...trips, formData as VacationTrip];
      
    saveConfig({ ...config, trips: newTrips });
    handleCloseForm();
  };

  const handleDeleteTrip = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa chuyến đi này?')) {
      const newTrips = trips.filter(t => t.id !== id);
      saveConfig({ ...config, trips: newTrips });
    }
  };

  const handleBudgetChange = (categoryId: string, field: 'planned' | 'actual', value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => {
      const budgetItems = [...(prev.budgetItems || [])];
      const index = budgetItems.findIndex(b => b.category === categoryId);
      if (index >= 0) {
        budgetItems[index] = { ...budgetItems[index], [field]: numValue };
      }
      return { ...prev, budgetItems };
    });
  };

  const toggleChecklist = (id: string) => {
    const newChecklist = { ...tipsChecklist, [id]: !tipsChecklist[id] };
    saveConfig({ ...config, tipsChecklist: newChecklist });
  };

  const calculateTripTotals = (trip: VacationTrip) => {
    let planned = 0;
    let actual = 0;
    trip.budgetItems.forEach(b => {
      planned += b.planned;
      actual += b.actual;
    });
    return { planned, actual };
  };

  // KPI calculations
  const totalTrips = trips.length;
  const planningTrips = trips.filter(t => t.status !== 'completed');
  const completedTrips = trips.filter(t => t.status === 'completed');
  
  const totalPlannedBudget = planningTrips.reduce((acc, t) => acc + calculateTripTotals(t).planned, 0);
  const totalActualSpend = completedTrips.reduce((acc, t) => acc + calculateTripTotals(t).actual, 0);
  
  let avgVariance = 0;
  if (completedTrips.length > 0) {
    let totalCompletedPlanned = 0;
    let totalCompletedActual = 0;
    completedTrips.forEach(t => {
      const { planned, actual } = calculateTripTotals(t);
      totalCompletedPlanned += planned;
      totalCompletedActual += actual;
    });
    if (totalCompletedPlanned > 0) {
      avgVariance = ((totalCompletedActual - totalCompletedPlanned) / totalCompletedPlanned) * 100;
    }
  }

  // Chart data
  const barChartData = completedTrips.map(t => {
    const totals = calculateTripTotals(t);
    return {
      name: t.name,
      planned: totals.planned,
      actual: totals.actual
    };
  });

  const pieChartData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    VACATION_CATEGORIES.forEach(c => categoryTotals[c.label] = 0);
    
    completedTrips.forEach(t => {
      t.budgetItems.forEach(b => {
        const cat = VACATION_CATEGORIES.find(c => c.id === b.category);
        if (cat) {
          categoryTotals[cat.label] += b.actual;
        }
      });
    });

    return Object.entries(categoryTotals)
      .filter(([_, val]) => val > 0)
      .map(([name, value]) => ({ name, value }));
  }, [completedTrips]);

  // Grouped Tips and Checklist
  const groupedTips = useMemo(() => {
    const groups: Record<string, typeof TRAVEL_TIPS> = {};
    TRAVEL_TIPS.forEach(tip => {
      if (!groups[tip.category]) groups[tip.category] = [];
      groups[tip.category].push(tip);
    });
    return groups;
  }, []);

  const groupedChecklist = useMemo(() => {
    const groups: Record<string, ChecklistItem[]> = {};
    allChecklistItems.forEach(item => {
      const isChecked = !!tipsChecklist[item.id];
      if (checklistFilter === 'pending' && isChecked) return;
      if (checklistFilter === 'completed' && !isChecked) return;

      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [allChecklistItems, tipsChecklist, checklistFilter]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-md shadow-sm">
          <p className="font-medium text-family-text mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name === "planned" ? "Kế hoạch" : entry.name === "actual" ? "Thực tế" : entry.name}: {formatTableMoneyVNDMillion(entry.value as number || 0)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-md shadow-sm">
          <p className="font-medium text-family-text mb-1">{payload[0].name}</p>
          <p className="text-emerald-600 font-bold">{formatTableMoneyVNDMillion(payload[0].value as number || 0)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-family-text flex items-center gap-2">
          <Palmtree className="w-8 h-8 text-emerald-500" />
          Chuyến Đi Hạnh Phúc
          <HelpTooltip text="Công cụ lên kế hoạch du lịch cho gia đình. Dữ liệu hoàn toàn độc lập, không ảnh hưởng đến ngân sách hay dòng tiền gia đình." />
        </h1>
        <p className="text-family-textMuted mt-1">Cùng nhau lên kế hoạch cho những kỷ niệm đáng nhớ 🌴</p>
      </div>

      <div className="flex border-b border-family-bgDark">
        <button
          onClick={() => setActiveTab("plan")}
          className={`px-4 py-2 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === "plan" ? "border-emerald-500 text-emerald-600" : "border-transparent text-family-textMuted hover:text-family-text"}`}
        >
          <MapPin className="w-4 h-4" /> Kế hoạch
        </button>
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === "overview" ? "border-emerald-500 text-emerald-600" : "border-transparent text-family-textMuted hover:text-family-text"}`}
        >
          <BarChart3 className="w-4 h-4" /> Tổng quan
        </button>
        <button
          onClick={() => setActiveTab("tips")}
          className={`px-4 py-2 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === "tips" ? "border-emerald-500 text-emerald-600" : "border-transparent text-family-textMuted hover:text-family-text"}`}
        >
          <Lightbulb className="w-4 h-4" /> Kinh nghiệm
        </button>
      </div>

      {activeTab === "plan" && (
        <div className="space-y-6">
          {!showForm && (
            <div className="flex justify-end">
              <Button onClick={() => handleOpenForm()} className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2">
                <Plus className="w-4 h-4" /> Thêm Chuyến Đi Mới
              </Button>
            </div>
          )}

          {showForm && (
            <Card className="border-emerald-100 shadow-md">
              <CardHeader className="bg-gradient-to-r from-emerald-50/50 to-teal-50/30 border-b border-emerald-100">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-emerald-800 flex items-center gap-2">
                    {editTripId ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    {editTripId ? "Chỉnh sửa chuyến đi" : "Tạo chuyến đi mới"}
                    <HelpTooltip text="Điền các thông tin cơ bản và dự toán chi phí. Bạn có thể cập nhật chi phí thực tế sau khi chuyến đi kết thúc." />
                  </CardTitle>
                  <button onClick={handleCloseForm} className="p-1.5 rounded-full hover:bg-emerald-100 transition-colors">
                    <X className="w-5 h-5 text-emerald-800" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-family-text">Tên chuyến đi</label>
                    <div className="flex gap-2">
                      <select 
                        className="w-20 px-2 py-2 border rounded-md border-gray-300 bg-white"
                        value={formData.emoji}
                        onChange={e => setFormData({...formData, emoji: e.target.value})}
                      >
                        {TRIP_EMOJIS.map(emoji => <option key={emoji} value={emoji}>{emoji}</option>)}
                      </select>
                      <Input 
                        placeholder="VD: Nghỉ hè Nha Trang..."
                        value={formData.name || ""}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-family-text">Điểm đến</label>
                    <Input 
                      placeholder="VD: Nha Trang, Đà Lạt..."
                      value={formData.destination || ""}
                      onChange={e => setFormData({...formData, destination: e.target.value})}
                    />
                    {formData.destination && DESTINATION_SUGGESTIONS.some(d => formData.destination?.toLowerCase().includes(d.name.toLowerCase())) && (
                      <p className="text-xs text-emerald-600 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" /> Gợi ý ngân sách cho 2 người (3N2Đ): {
                          (() => {
                            const match = DESTINATION_SUGGESTIONS.find(d => formData.destination?.toLowerCase().includes(d.name.toLowerCase()));
                            return match ? `${match.budgetMin}tr - ${match.budgetMax}tr` : '';
                          })()
                        }
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-family-text">Ngày đi</label>
                    <Input 
                      type="date"
                      value={formData.startDate || ""}
                      onChange={e => setFormData({...formData, startDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-family-text">Ngày về</label>
                    <Input 
                      type="date"
                      value={formData.endDate || ""}
                      onChange={e => setFormData({...formData, endDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-family-text">Người lớn</label>
                    <Input 
                      type="number" min="1"
                      value={formData.adults || 2}
                      onChange={e => setFormData({...formData, adults: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-family-text">Trẻ em</label>
                    <Input 
                      type="number" min="0"
                      value={formData.children || 0}
                      onChange={e => setFormData({...formData, children: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-family-text">Trạng thái</label>
                    <select 
                      className="w-full px-3 py-2 border rounded-md border-gray-300 bg-white text-sm"
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value as VacationStatus})}
                    >
                      {Object.entries(VACATION_STATUS_MAP).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-family-text">Ghi chú</label>
                    <Input 
                      placeholder="Ghi chú thêm..."
                      value={formData.notes || ""}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="font-semibold text-lg text-family-text mb-4 border-b pb-2 flex items-center justify-between">
                    Ngân sách (Triệu VNĐ)
                    <HelpTooltip text="Nhập dự toán ngân sách cho từng hạng mục. Nếu chuyến đi đã hoàn thành, hãy nhập chi phí thực tế để so sánh." />
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-family-bgDark text-family-textMuted uppercase text-xs">
                        <tr>
                          <th className="px-4 py-3 rounded-tl-lg">Hạng mục</th>
                          <th className="px-4 py-3">Kế hoạch</th>
                          <th className="px-4 py-3 rounded-tr-lg">Thực tế</th>
                        </tr>
                      </thead>
                      <tbody>
                        {VACATION_CATEGORIES.map(category => {
                          const budgetItem = formData.budgetItems?.find(b => b.category === category.id) || { category: category.id, planned: 0, actual: 0 };
                          return (
                            <tr key={category.id} className="border-b border-family-bgDark hover:bg-family-bgDark/30">
                              <td className="px-4 py-3 font-medium flex items-center gap-2">
                                <span>{category.emoji}</span> {category.label}
                                <span className="text-xs font-normal text-gray-400 hidden sm:inline ml-2">({category.hint})</span>
                              </td>
                              <td className="px-4 py-3 w-32">
                                <Input 
                                  type="number" step="0.1" min="0" className="w-full text-right"
                                  value={budgetItem.planned === 0 ? "" : budgetItem.planned}
                                  placeholder="0.0"
                                  onChange={e => handleBudgetChange(category.id, "planned", e.target.value)}
                                />
                              </td>
                              <td className="px-4 py-3 w-32">
                                <Input 
                                  type="number" step="0.1" min="0" className="w-full text-right"
                                  value={budgetItem.actual === 0 ? "" : budgetItem.actual}
                                  placeholder="0.0"
                                  onChange={e => handleBudgetChange(category.id, "actual", e.target.value)}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="font-semibold text-family-text">
                        <tr>
                          <td className="px-4 py-4 text-right">Tổng cộng:</td>
                          <td className="px-4 py-4 text-emerald-600 text-right pr-6">
                            {formatTableMoneyVNDMillion(formData.budgetItems?.reduce((sum, b) => sum + b.planned, 0) || 0)}
                          </td>
                          <td className="px-4 py-4 text-blue-600 text-right pr-6">
                            {formatTableMoneyVNDMillion(formData.budgetItems?.reduce((sum, b) => sum + b.actual, 0) || 0)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-family-bgDark">
                  <Button variant="outline" onClick={handleCloseForm}>Hủy</Button>
                  <Button onClick={handleSaveForm} className="bg-emerald-600 hover:bg-emerald-700 text-white">Lưu Chuyến Đi</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {trips.length === 0 && !showForm && (
              <div className="col-span-full py-12 text-center text-family-textMuted bg-family-bgDark rounded-lg border border-dashed border-gray-300">
                <Palmtree className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>Chưa có chuyến đi nào. Hãy thêm chuyến đi đầu tiên của gia đình nhé!</p>
              </div>
            )}
            
            {trips.map(trip => {
              const totals = calculateTripTotals(trip);
              const statusInfo = VACATION_STATUS_MAP[trip.status];
              const incomeRatio = monthlyIncome > 0 ? (totals.planned / monthlyIncome) * 100 : 0;

              return (
                <Card key={trip.id} className="border border-family-bgDark hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3 border-b border-family-bgDark bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">{trip.emoji}</span>
                          <CardTitle className="text-xl text-family-text">{trip.name}</CardTitle>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.emoji} {statusInfo.label}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleOpenForm(trip)} className="p-1.5 text-blue-500 rounded-full hover:bg-blue-50 transition-colors">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteTrip(trip.id)} className="p-1.5 text-red-500 rounded-full hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-sm text-family-textMuted">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> {trip.destination || "Chưa có điểm đến"}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" /> {trip.adults} Người lớn{trip.children ? `, ${trip.children} Trẻ em` : ''}
                      </div>
                      <div className="flex items-center gap-2 col-span-2">
                        <Calendar className="w-4 h-4" /> {trip.startDate || '?'} đến {trip.endDate || '?'}
                      </div>
                    </div>

                    <div className="bg-family-bgDark p-3 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-family-text">Ngân sách dự kiến:</span>
                        <span className="font-bold text-emerald-600">{formatTableMoneyVNDMillion(totals.planned)}</span>
                      </div>
                      {trip.status === "completed" && (
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-family-text">Chi phí thực tế:</span>
                          <span className={`font-bold ${totals.actual > totals.planned ? "text-red-500" : "text-blue-600"}`}>
                            {formatTableMoneyVNDMillion(totals.actual)}
                          </span>
                        </div>
                      )}
                      {monthlyIncome > 0 && trip.status !== "completed" && (
                        <p className="text-xs text-family-textMuted text-right">
                          ≈ {incomeRatio.toFixed(1)}% thu nhập tháng
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                  <Palmtree className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-family-textMuted">Tổng chuyến đi</p>
                  <p className="text-2xl font-bold text-family-text">{totalTrips}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-family-textMuted">Ngân sách đang lên KH</p>
                  <p className="text-xl font-bold text-family-text">{formatTableMoneyVNDMillion(totalPlannedBudget)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-full text-purple-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-family-textMuted">Đã chi tiêu (Hoàn thành)</p>
                  <p className="text-xl font-bold text-family-text">{formatTableMoneyVNDMillion(totalActualSpend)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-3 rounded-full ${avgVariance > 0 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-family-textMuted">Chênh lệch trung bình</p>
                  <p className="text-xl font-bold text-family-text">{avgVariance > 0 ? '+' : ''}{avgVariance.toFixed(1)}%</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {completedTrips.length === 0 ? (
            <div className="py-12 text-center text-family-textMuted bg-family-bgDark rounded-lg border border-dashed border-gray-300">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>Chưa có dữ liệu chuyến đi hoàn thành để thống kê.</p>
              <p className="text-sm mt-1">Hãy cập nhật trạng thái chuyến đi thành "Kỷ niệm đẹp" để xem biểu đồ nhé!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex justify-between items-center">
                    Kế hoạch vs Thực tế
                    <HelpTooltip text="So sánh ngân sách dự kiến và chi phí thực tế của các chuyến đi đã hoàn thành." />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="planned" name="Kế hoạch" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="actual" name="Thực tế" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex justify-between items-center">
                    Cơ cấu chi tiêu
                    <HelpTooltip text="Phân bổ chi phí thực tế theo các hạng mục trong các chuyến đi đã hoàn thành." />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieChartData.map((_entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {activeTab === "tips" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <Card>
              <CardHeader className="bg-gradient-to-r from-blue-50/50 to-indigo-50/30 border-b border-blue-100">
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" /> Kinh Nghiệm Du Lịch Gia Đình
                  <HelpTooltip text="Các mẹo hữu ích được tổng hợp để giúp chuyến đi của gia đình bạn trọn vẹn hơn." />
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {Object.entries(groupedTips).map(([category, tips]) => (
                  <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      className="w-full px-4 py-3 bg-gray-50 flex justify-between items-center hover:bg-gray-100 transition-colors"
                      onClick={() => setExpandedTipCategory(expandedTipCategory === category ? null : category)}
                    >
                      <span className="font-medium text-family-text flex items-center gap-2">
                        {tips[0].emoji} {category}
                      </span>
                      {expandedTipCategory === category ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                    </button>
                    {expandedTipCategory === category && (
                      <div className="px-4 py-3 bg-white space-y-3 border-t border-gray-100">
                        {tips.map((tip) => (
                          <div key={tip.id} className="space-y-1">
                            <h4 className="font-medium text-family-text flex items-center gap-1.5 text-sm">
                              <span className="text-emerald-500">•</span>
                              {tip.title}
                            </h4>
                            <p className="text-sm text-family-textMuted pl-3 border-l-2 border-emerald-100 ml-1">
                              {tip.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

                    <div className="lg:col-span-5 space-y-4">
            <Card className="border border-emerald-100 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-50/80 to-teal-50/50 border-b border-emerald-100 pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-emerald-900 flex items-center gap-2 text-base sm:text-lg">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Danh sách chuẩn bị
                    <HelpTooltip text="Kiểm tra các vật dụng cần thiết trước khi khởi hành. Gia đình có thể tích chọn, tự thêm món đồ mới hoặc lọc các món cần soạn." />
                  </CardTitle>
                  <button
                    onClick={() => setIsAddingItem(!isAddingItem)}
                    className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-white border border-emerald-200 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg shadow-2xs transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm món đồ
                  </button>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-medium text-emerald-800">
                      Tiến độ: <strong className="text-emerald-700">{completedChecklistCount}/{totalChecklistCount} món</strong> ({checklistPercent}%)
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleAllChecklist(false)}
                        className="text-[11px] text-gray-500 hover:text-rose-600 transition-colors"
                      >
                        Bỏ chọn hết
                      </button>
                      <span className="text-gray-300">•</span>
                      <button
                        onClick={() => handleToggleAllChecklist(true)}
                        className="text-[11px] text-emerald-600 hover:text-emerald-800 font-medium transition-colors"
                      >
                        Chọn tất cả
                      </button>
                    </div>
                  </div>
                  <div className="w-full bg-emerald-100/70 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${checklistPercent}%` }}
                    />
                  </div>
                </div>

                {/* Filter buttons */}
                <div className="flex gap-1.5 mt-3 pt-2 border-t border-emerald-100/60 text-xs">
                  <button
                    onClick={() => setChecklistFilter('all')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      checklistFilter === 'all'
                        ? 'bg-emerald-600 text-white font-medium shadow-2xs'
                        : 'bg-white/80 text-gray-600 hover:bg-emerald-100/60'
                    }`}
                  >
                    Tất cả ({totalChecklistCount})
                  </button>
                  <button
                    onClick={() => setChecklistFilter('pending')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      checklistFilter === 'pending'
                        ? 'bg-amber-600 text-white font-medium shadow-2xs'
                        : 'bg-white/80 text-gray-600 hover:bg-amber-100/60'
                    }`}
                  >
                    Cần soạn ({totalChecklistCount - completedChecklistCount})
                  </button>
                  <button
                    onClick={() => setChecklistFilter('completed')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      checklistFilter === 'completed'
                        ? 'bg-emerald-700 text-white font-medium shadow-2xs'
                        : 'bg-white/80 text-gray-600 hover:bg-emerald-100/60'
                    }`}
                  >
                    Đã xong ({completedChecklistCount})
                  </button>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4 max-h-[600px] overflow-y-auto">
                {/* Form to add new item */}
                {isAddingItem && (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-emerald-900">Bổ sung món đồ cần chuẩn bị:</span>
                      <button onClick={() => setIsAddingItem(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={newItemCategory}
                        onChange={(e) => setNewItemCategory(e.target.value)}
                        className="text-xs px-2 py-1.5 bg-white border border-gray-300 rounded-md shrink-0"
                      >
                        <option value="Giấy tờ">Giấy tờ</option>
                        <option value="Trang phục">Trang phục</option>
                        <option value="Vệ sinh">Vệ sinh</option>
                        <option value="Sức khỏe">Sức khỏe</option>
                        <option value="Thiết bị">Thiết bị</option>
                        <option value="Cho bé yêu">Cho bé yêu</option>
                        <option value="Đồ ăn & Nước">Đồ ăn & Nước</option>
                        <option value="Khác">Khác</option>
                      </select>
                      <Input
                        placeholder="VD: Kính râm, sạc dự phòng..."
                        value={newItemLabel}
                        onChange={(e) => setNewItemLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddChecklistItem();
                        }}
                        className="text-xs flex-1 h-8"
                      />
                      <Button
                        size="sm"
                        onClick={handleAddChecklistItem}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 h-8 px-3 text-xs"
                      >
                        Thêm
                      </Button>
                    </div>
                  </div>
                )}

                {Object.keys(groupedChecklist).length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    Không có món đồ nào trong bộ lọc này.
                  </div>
                ) : (
                  Object.entries(groupedChecklist).map(([category, items]) => {
                    const catTotal = items.length;
                    const catDone = items.filter(i => tipsChecklist[i.id]).length;
                    return (
                      <div key={category} className="mb-4 last:mb-0">
                        <div className="flex justify-between items-center mb-2 pb-1 border-b border-gray-100">
                          <h4 className="font-semibold text-xs text-family-text uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {category}
                          </h4>
                          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {catDone}/{catTotal}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {items.map((item) => {
                            const isChecked = !!tipsChecklist[item.id];
                            const isCustom = item.id.startsWith('custom_');
                            return (
                              <div
                                key={item.id}
                                className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                                  isChecked
                                    ? 'bg-emerald-50/40 border-emerald-100 text-gray-400'
                                    : 'bg-white border-gray-100 hover:border-emerald-200 text-family-text shadow-2xs'
                                }`}
                              >
                                <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleChecklist(item.id)}
                                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                  />
                                  <span
                                    className={`text-xs select-none truncate ${
                                      isChecked ? 'line-through text-gray-400' : 'font-medium'
                                    }`}
                                  >
                                    {item.label}
                                  </span>
                                </label>
                                {isCustom && (
                                  <button
                                    onClick={() => handleDeleteChecklistItem(item.id)}
                                    title="Xóa món tự thêm này"
                                    className="p-1 text-gray-300 hover:text-rose-500 rounded transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
