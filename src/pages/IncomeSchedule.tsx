import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { WarningBox } from '../components/ui/WarningBox';
import { generateTimeline } from '../engines/timelineEngine';
import { calculateIncome } from '../engines/incomeEngine';
import { formatTableMoneyVNDMillion, formatKpiMoneyVNDMillion } from '../utils/format';
import { safeNumber } from '../utils/math';
import { Trash2, Plus, Save, RotateCcw, BarChart2, Check, Sliders, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ObservationControls } from '../components/ui/ObservationControls';
import type { IncomeScheduleItem } from '../types/finance';

export const IncomeSchedule: React.FC = () => {
  const { state, addIncomeItem, updateIncomeItem, deleteIncomeItem, resetToDefault } = useAppContext();
  
  // Sort schedule items by date
  const sortedSchedule = [...state.incomeSchedule].sort((a, b) => {
    if (a.effectiveYear !== b.effectiveYear) {
      return a.effectiveYear - b.effectiveYear;
    }
    return a.effectiveMonth - b.effectiveMonth;
  });

  const [selectedItemId, setSelectedItemId] = useState<string | null>(() => {
    return sortedSchedule.length > 0 ? sortedSchedule[0].id : null;
  });

  const activeVersion = sortedSchedule.find(item => item.id === selectedItemId) || sortedSchedule[0];

  // Workspace Tabs: charts (BI visual analysis, default) vs editor (inputs & trees)
  const [workspaceTab, setWorkspaceTab] = useState<'editor' | 'charts'>('charts');

  // Workspace Local States (bound to active version)
  const [editMonth, setEditMonth] = useState<number>(10);
  const [editYear, setEditYear] = useState<number>(2026);
  const [editIncome, setEditIncome] = useState<number>(80);
  const [editNote, setEditNote] = useState<string>('');

  const [formError, setFormError] = useState<string | null>(null);

  // New version creator state
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newMonth, setNewMonth] = useState<number>(1);
  const [newYear, setNewYear] = useState<number>(2027);
  const [newIncome, setNewIncome] = useState<number>(100);
  const [newNote, setNewNote] = useState<string>('');

  // Sync workspace state when active version changes
  useEffect(() => {
    if (activeVersion) {
      setEditMonth(activeVersion.effectiveMonth);
      setEditYear(activeVersion.effectiveYear);
      setEditIncome(activeVersion.incomeMonthly);
      setEditNote(activeVersion.note || '');
      setFormError(null);
    }
  }, [activeVersion?.id]);

  // Calculate current income metrics using timeline + income engines
  const timelineResult = generateTimeline({
    planningStartMonth: state.profile.planningStartMonth,
    planningStartYear: state.profile.planningStartYear,
    planningEndMonth: state.profile.planningEndMonth,
    planningEndYear: state.profile.planningEndYear,
    husbandAgeAtStart: state.profile.husbandAgeAtStart,
    wifeAgeAtStart: state.profile.wifeAgeAtStart,
  });

  const startPeriod = timelineResult.periods[0];
  const startIncomeResult = startPeriod
    ? calculateIncome({ period: startPeriod, incomeSchedule: state.incomeSchedule })
    : { incomeMonthly: 0, activeScheduleId: '', warnings: [] };

  // Generate continuous timeline data for chart rendering
  const chartData = timelineResult.periods.map((p) => {
    const inc = calculateIncome({ period: p, incomeSchedule: state.incomeSchedule });
    return {
      year: p.year,
      month: p.month,
      dateStr: `Tháng ${p.month}/${p.year}`,
      'Thu nhập tháng': Math.round(inc.incomeMonthly * 10) / 10,
    };
  });

  // XAxis ticks every 5 years to keep it clean
  const yearTicks = Array.from(new Set(timelineResult.periods.map(p => p.year))).filter(y => y % 5 === 0);

  const handleSaveChanges = () => {
    if (editMonth < 1 || editMonth > 12) {
      setFormError('Tháng hiệu lực phải từ 1 đến 12.');
      return;
    }
    if (editYear < 2026 || editYear > 2060) {
      setFormError('Năm hiệu lực phải từ 2026 đến 2060.');
      return;
    }
    if (editIncome <= 0) {
      setFormError('Mức thu nhập tháng phải lớn hơn 0.');
      return;
    }

    updateIncomeItem({
      id: activeVersion.id,
      effectiveMonth: editMonth,
      effectiveYear: editYear,
      incomeMonthly: editIncome,
      note: editNote,
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
    if (newIncome <= 0) {
      setFormError('Mức thu nhập phải lớn hơn 0.');
      return;
    }

    addIncomeItem({
      effectiveMonth: newMonth,
      effectiveYear: newYear,
      incomeMonthly: newIncome,
      note: newNote,
    });
    setIsCreatingNew(false);
    setNewNote('');
    setFormError(null);
  };

  const isDirty = activeVersion ? (
    editMonth !== activeVersion.effectiveMonth ||
    editYear !== activeVersion.effectiveYear ||
    editIncome !== activeVersion.incomeMonthly ||
    editNote !== (activeVersion.note || '')
  ) : false;

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-family-text">Thu nhập theo thời gian</h1>
          <p className="text-sm text-family-textMuted mt-1">
            Quản lý và trực quan hóa lịch trình phát triển các nguồn thu nhập theo thời gian.
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
            <Sliders className="w-3.5 h-3.5" /> 2. Biên tập mốc thu nhập
          </button>
        </div>
      </div>

      {formError && <WarningBox type="danger" message={formError} />}

      {/* Creation Modal / Form */}
      {isCreatingNew && (
        <Card className="border-family-accent/30 bg-family-bgDark/20 shadow-md">
          <CardHeader>
            <CardTitle>Thêm mốc thu nhập mới</CardTitle>
            <CardDescription>
              Thiết lập thu nhập tháng tại thời điểm hiệu lực.
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
                  label="Thu nhập tháng"
                  type="number"
                  suffix="Tr VND"
                  value={newIncome}
                  onChange={(e) => setNewIncome(Number(e.target.value))}
                  required
                />
              </div>
              <Input
                label="Ghi chú hoàn cảnh"
                type="text"
                placeholder="Ví dụ: Lên chức trưởng phòng, bắt đầu kinh doanh phụ..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreatingNew(false)}>Hủy</Button>
                <Button type="submit" className="gap-2">
                  <Check className="w-4 h-4" /> Khởi tạo mốc thu nhập
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 1: PURE FULL-WIDTH BI VISUALIZATION CENTER */}
      {workspaceTab === 'charts' && (
        <div className="space-y-6">
          {/* KPI Summaries Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card isKpi className="border-l-family-accent">
              <CardHeader>
                <CardDescription className="uppercase tracking-wider font-bold">Số mốc biến động</CardDescription>
                <CardTitle className="text-2xl mt-1">{state.incomeSchedule.length} cột mốc</CardTitle>
              </CardHeader>
            </Card>
            <Card isKpi className="border-l-green">
              <CardHeader>
                <CardDescription className="uppercase tracking-wider font-bold">Thu nhập khởi điểm</CardDescription>
                <CardTitle className="text-2xl mt-1">{formatKpiMoneyVNDMillion(startIncomeResult.incomeMonthly)}</CardTitle>
              </CardHeader>
            </Card>
            <Card isKpi className="border-l-purple">
              <CardHeader>
                <CardDescription className="uppercase tracking-wider font-bold">Chu kỳ hoạch định</CardDescription>
                <CardTitle className="text-2xl mt-1">2026 - 2060</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Engine warnings */}
          {startIncomeResult.warnings.length > 0 && (
            <div className="space-y-2">
              {startIncomeResult.warnings.map((w, idx) => (
                <WarningBox key={idx} type="warning" message={w} />
              ))}
            </div>
          )}

          {/* Income Projection Area Chart Card */}
          <Card className="border border-family-accent/10 p-5 bg-family-bgDark/5">
            <div className="border-b border-family-accent/5 pb-3 mb-4">
              <h4 className="font-bold text-sm text-family-text uppercase tracking-wider">
                Xu hướng thu nhập theo thời gian (2026 - 2060)
              </h4>
              <p className="text-xs text-family-textMuted mt-0.5">
                Dự báo dòng thu nhập tháng theo các thời kỳ hiệu lực.
              </p>
            </div>
            
            <div className="h-80 w-full bg-family-bgDark/20 rounded-xl p-2 shadow-inner">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 15, right: 30, left: 10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e2b44c" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#e2b44c" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(var(--color-accent-rgb), 0.05)" />
                  <XAxis 
                    dataKey="year" 
                    ticks={yearTicks} 
                    stroke="#6b7280" 
                    fontSize={11} 
                  />
                  <YAxis stroke="#6b7280" fontSize={11} unit=" tr" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(226, 180, 76, 0.15)', borderRadius: '12px' }}
                    itemStyle={{ color: '#f8fafc', fontSize: 11 }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: 11 }}
                    formatter={(value) => [`${value} tr VND`, 'Thu nhập tháng']}
                    labelFormatter={(label, items) => items[0]?.payload ? items[0].payload.dateStr : label}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Thu nhập tháng" 
                    stroke="#e2b44c" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorIncome)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* List of Income Milestones Summary under chart */}
          <Card className="border border-family-accent/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm uppercase tracking-wider text-family-textMuted">Tóm tắt các mốc thay đổi nguồn thu</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-family-accent/10 text-family-textMuted font-bold bg-family-bgDark/30">
                    <th className="p-3">Thời điểm hiệu lực</th>
                    <th className="p-3">Mức thu nhập tháng khởi điểm</th>
                    <th className="p-3">Ghi chú hoàn cảnh</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSchedule.map((item) => (
                    <tr key={item.id} className="border-b border-family-accent/5 hover:bg-family-bgDark/10">
                      <td className="p-3 font-semibold text-family-text">
                        Tháng {item.effectiveMonth}/{item.effectiveYear}
                      </td>
                      <td className="p-3 font-bold text-family-accent">
                        {formatTableMoneyVNDMillion(item.incomeMonthly)}
                      </td>
                      <td className="p-3 text-family-textMuted max-w-sm truncate">
                        {item.note || '---'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: EDITING AND MILESTONE CONFIGURATION */}
      {workspaceTab === 'editor' && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
          
          {/* Timeline Navigator Panel */}
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
              <CardDescription className="text-[11px]">Chọn mốc để thay đổi thông số thu nhập</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 max-h-[500px] overflow-y-auto pr-1">
              <div className="relative border-l-2 border-family-accent/25 ml-4 pl-4 space-y-5">
                {sortedSchedule.map((item) => {
                  const isSelected = item.id === selectedItemId;

                  return (
                    <div key={item.id} className="relative group">
                      {/* Node Dot */}
                      <div 
                        onClick={() => setSelectedItemId(item.id)}
                        className={`absolute -left-[25px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-family-bgDeep cursor-pointer transition-all duration-150 ${
                          isSelected 
                            ? 'bg-family-accent scale-125 ring-4 ring-family-accent/20' 
                            : 'bg-family-textLight hover:bg-family-accent'
                        }`}
                      />
                      
                      {/* Navigation Item card */}
                      <div 
                        onClick={() => setSelectedItemId(item.id)}
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
                            {isSelected && isDirty && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveChanges();
                                }}
                                className="p-1 rounded-md bg-family-accent text-white hover:bg-family-accent/80 transition-all"
                                title="Lưu thay đổi"
                              >
                                <Save className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteIncomeItem(item.id);
                                if (selectedItemId === item.id) {
                                  setSelectedItemId(null);
                                }
                              }}
                              disabled={state.incomeSchedule.length <= 1}
                              className="p-1 rounded-md text-family-textMuted hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50"
                              title="Xóa mốc"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[10px] text-family-textMuted font-bold">
                          <span>{item.incomeMonthly} tr VND</span>
                        </div>
                        {item.note && (
                          <p className="text-[10px] text-family-textMuted truncate mt-1 italic border-t border-family-accent/5 pt-1">
                            {item.note}
                          </p>
                        )}
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
                
                {/* Workspace Header */}
                <CardHeader className="border-b border-family-accent/10 pb-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl font-serif flex items-center gap-2">
                        Biên tập mốc: <span className="text-family-accent">Tháng {editMonth}/{editYear}</span>
                      </CardTitle>
                      <CardDescription>
                        Tinh chỉnh ngày hiệu lực và thu nhập tháng của mốc.
                      </CardDescription>
                    </div>
                    
                    {isDirty && (
                      <Button 
                        onClick={handleSaveChanges} 
                        className="gap-2 self-start md:self-center"
                      >
                        <Save className="w-4 h-4" /> Lưu thay đổi của mốc
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-family-bgDark/35 p-4 rounded-2xl border border-family-accent/5">
                    <Input
                      label="Tháng hiệu lực"
                      type="number"
                      min={1}
                      max={12}
                      value={editMonth}
                      onChange={(e) => setEditMonth(safeNumber(Number(e.target.value)))}
                    />
                    <Input
                      label="Năm hiệu lực"
                      type="number"
                      min={2026}
                      max={2060}
                      value={editYear}
                      onChange={(e) => setEditYear(safeNumber(Number(e.target.value)))}
                    />
                    <Input
                      label="Thu nhập tháng"
                      type="number"
                      suffix="Tr VND"
                      value={editIncome}
                      onChange={(e) => setEditIncome(safeNumber(Number(e.target.value)))}
                    />
                  </div>
                  
                  <div className="mt-4">
                    <Input
                      label="Ghi chú hoàn cảnh mốc"
                      type="text"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                    />
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
