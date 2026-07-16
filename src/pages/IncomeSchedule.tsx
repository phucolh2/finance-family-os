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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { IncomePassiveActiveChart, IncomeCumulativeChart } from '../components/income/IncomeAreaCharts';
import { ObservationControls } from '../components/ui/ObservationControls';
import type { IncomeScheduleItem, IncomeType } from '../types/finance';

export const IncomeSchedule: React.FC = () => {
  const { state, addIncomeItem, updateIncomeItem, deleteIncomeItem, resetToDefault, selectedPeriodKey } = useAppContext();
  
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
  const [editEndMonth, setEditEndMonth] = useState<number | ''>('');
  const [editEndYear, setEditEndYear] = useState<number | ''>('');
  const [editStatus, setEditStatus] = useState<'active' | 'cancelled' | 'settled' | 'planned'>('active');
  const [editType, setEditType] = useState<IncomeType>('fulltime_salary');

  const [formError, setFormError] = useState<string | null>(null);

  // New version creator state
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newMonth, setNewMonth] = useState<number>(1);
  const [newYear, setNewYear] = useState<number>(2027);
  const [newIncome, setNewIncome] = useState<number>(100);
  const [newNote, setNewNote] = useState<string>('');
  const [newEndMonth, setNewEndMonth] = useState<number | ''>('');
  const [newEndYear, setNewEndYear] = useState<number | ''>('');
  const [newStatus, setNewStatus] = useState<'active' | 'cancelled' | 'settled' | 'planned'>('active');
  const [newType, setNewType] = useState<IncomeType>('fulltime_salary');

  // Sync workspace state when active version changes
  useEffect(() => {
    if (activeVersion) {
      setEditMonth(activeVersion.effectiveMonth);
      setEditYear(activeVersion.effectiveYear);
      setEditIncome(activeVersion.incomeMonthly);
      setEditNote(activeVersion.note || '');
      setEditEndMonth(activeVersion.endMonth || '');
      setEditEndYear(activeVersion.endYear || '');
      setEditStatus((activeVersion.status as 'active' | 'cancelled' | 'settled' | 'planned') || 'active');
      setEditType(activeVersion.incomeType || 'fulltime_salary');
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
  let cumIncome = 0;
  const chartData = timelineResult.periods.map((p, index, arr) => {
    const inc = calculateIncome({ period: p, incomeSchedule: state.incomeSchedule });
    const prevInc = index > 0 ? calculateIncome({ period: arr[index-1], incomeSchedule: state.incomeSchedule }) : null;
    
    // active = fulltime + parttime + self_employed + irregular
    const active = (inc.breakdown?.fulltime_salary || 0) + (inc.breakdown?.parttime_salary || 0) + (inc.breakdown?.self_employed || 0) + (inc.breakdown?.irregular_income || 0);
    // passive = passive_income
    const passive = (inc.breakdown?.passive_income || 0);
    
    cumIncome += inc.incomeMonthly;
    
    // Cliff detection: if income drops by more than 20% compared to previous month
    let cliffDrop = 0;
    if (prevInc && prevInc.incomeMonthly > 0) {
      const dropRatio = (prevInc.incomeMonthly - inc.incomeMonthly) / prevInc.incomeMonthly;
      if (dropRatio >= 0.2) {
        cliffDrop = prevInc.incomeMonthly - inc.incomeMonthly;
      }
    }

    return {
      year: p.year,
      month: p.month,
      dateStr: `Tháng ${p.month}/${p.year}`,
      'Tiền lương fulltime': Math.round((inc.breakdown?.fulltime_salary || 0) * 10) / 10,
      'Lương parttime': Math.round((inc.breakdown?.parttime_salary || 0) * 10) / 10,
      'Tự kinh doanh': Math.round((inc.breakdown?.self_employed || 0) * 10) / 10,
      'Thu nhập thụ động': Math.round((inc.breakdown?.passive_income || 0) * 10) / 10,
      'Thu nhập không cố định': Math.round((inc.breakdown?.irregular_income || 0) * 10) / 10,
      'Khoản thu tháng': Math.round(inc.incomeMonthly * 10) / 10,
      activeIncome: Math.round(active * 10) / 10,
      passiveIncome: Math.round(passive * 10) / 10,
      cumulativeIncome: Math.round(cumIncome * 10) / 10,
      cliffDrop: Math.round(cliffDrop * 10) / 10,
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
    if (editStatus === 'settled' && (editEndMonth === '' || editEndYear === '')) {
      setFormError('Khi chọn "Đã kết thúc", bạn bắt buộc phải nhập cả Tháng kết thúc và Năm kết thúc.');
      return;
    }
    if (editEndMonth !== '' && editEndYear !== '') {
      const startKey = editYear * 12 + editMonth;
      const endKey = Number(editEndYear) * 12 + Number(editEndMonth);
      if (endKey < startKey) {
        setFormError('Thời điểm kết thúc không được nhỏ hơn thời điểm hiệu lực bắt đầu.');
        return;
      }
    }

    updateIncomeItem({
      ...activeVersion,
      effectiveMonth: editMonth,
      effectiveYear: editYear,
      incomeMonthly: editIncome,
      note: editNote,
      endMonth: editEndMonth === '' ? undefined : editEndMonth,
      endYear: editEndYear === '' ? undefined : editEndYear,
      status: editStatus,
      incomeType: editType,
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
    if (newStatus === 'settled' && (newEndMonth === '' || newEndYear === '')) {
      setFormError('Khi chọn "Đã kết thúc", bạn bắt buộc phải nhập cả Tháng kết thúc và Năm kết thúc.');
      return;
    }
    if (newEndMonth !== '' && newEndYear !== '') {
      const startKey = newYear * 12 + newMonth;
      const endKey = Number(newEndYear) * 12 + Number(newEndMonth);
      if (endKey < startKey) {
        setFormError('Thời điểm kết thúc không được nhỏ hơn thời điểm hiệu lực bắt đầu.');
        return;
      }
    }

    addIncomeItem({
      effectiveMonth: newMonth,
      effectiveYear: newYear,
      incomeMonthly: newIncome,
      note: newNote,
      endMonth: newEndMonth === '' ? undefined : newEndMonth,
      endYear: newEndYear === '' ? undefined : newEndYear,
      status: newStatus,
      incomeType: newType,
    });
    setIsCreatingNew(false);
    setNewNote('');
    setNewEndMonth('');
    setNewEndYear('');
    setNewStatus('active');
    setNewType('fulltime_salary');
    setFormError(null);
  };

  const isDirty = activeVersion ? (
    editMonth !== activeVersion.effectiveMonth ||
    editYear !== activeVersion.effectiveYear ||
    editIncome !== activeVersion.incomeMonthly ||
    editNote !== (activeVersion.note || '') ||
    editEndMonth !== (activeVersion.endMonth || '') ||
    editEndYear !== (activeVersion.endYear || '') ||
    editStatus !== (activeVersion.status || 'active') ||
    editType !== (activeVersion.incomeType || 'fulltime_salary')
  ) : false;

  const activeDbItem = selectedPeriodKey ? state.resolvedMonthlyDbMap?.[selectedPeriodKey] : undefined;
  const flow = activeDbItem?.investmentFlow;

  const getIncomeTypeLabel = (type?: string) => {
    switch (type) {
      case 'fulltime_salary': return 'Tiền lương fulltime';
      case 'parttime_salary': return 'Lương parttime';
      case 'self_employed': return 'Tự kinh doanh';
      case 'passive_income': return 'Thu nhập thụ động';
      case 'irregular_income': return 'Thu nhập không cố định';
      default: return 'Tiền lương fulltime';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-family-text">Kế hoạch Thu nhập</h1>
          <p className="text-sm text-family-textMuted mt-1">
            Quản lý và trực quan hóa lịch trình phát triển các nguồn thu nhập theo thời gian.
          </p>
        </div>
        <ObservationControls />
      </div>

      {/* Dynamic Cashflow History Summary Banner */}
      {flow && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-family-accent/5 border border-family-accent/15 rounded-2xl text-xs shadow-sm">
          <div className="font-bold text-family-text flex items-center gap-1.5 shrink-0">
            <span>💸</span>
            Dòng tiền đầu tư tại mốc quan sát ({selectedPeriodKey}):
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-family-textMuted font-semibold">
            <div>Số dư đầu: <strong className="text-family-text">{formatTableMoneyVNDMillion(flow.beginningBalance)}</strong></div>
            <div>+ Phân bổ đầu tư: <strong className="text-emerald-700">+{formatTableMoneyVNDMillion(flow.contribution)}</strong></div>
            <div>+ Lãi phát sinh: <strong className={flow.pnl >= 0 ? "text-emerald-700" : "text-red-600"}>{flow.pnl >= 0 ? `+` : ``}{formatTableMoneyVNDMillion(flow.pnl)}</strong></div>
            <div>= Số dư cuối: <strong className="text-family-accent">{formatTableMoneyVNDMillion(flow.endingBalance)}</strong></div>
            <div className="text-[10px] pl-3 border-l border-family-accent/20 flex gap-3 text-family-text shrink-0">
              <span className="text-emerald-800">Đã ĐT: {formatTableMoneyVNDMillion(flow.invested)}</span>
              <span className="text-violet-800">Kế hoạch: {formatTableMoneyVNDMillion(flow.planned)}</span>
              <span className="text-sky-800">Chưa KH: {formatTableMoneyVNDMillion(flow.idle)}</span>
            </div>
          </div>
        </div>
      )}
      
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
                  label="Khoản thu tháng"
                  type="number"
                  suffix="Tr VND"
                  value={newIncome}
                  onChange={(e) => setNewIncome(Number(e.target.value))}
                  required
                />
                <div>
                  <label className="block text-xs font-semibold text-family-textMuted uppercase mb-2">
                    Loại thu nhập
                  </label>
                  <select 
                    className="w-full bg-family-bgDeep border border-family-accent/20 rounded-xl px-4 py-2.5 text-family-text focus:outline-none focus:border-family-accent/60 transition-colors text-xs h-[38px]"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as IncomeType)}
                  >
                    <option value="fulltime_salary">Tiền lương fulltime</option>
                    <option value="parttime_salary">Lương parttime</option>
                    <option value="self_employed">Tự kinh doanh</option>
                    <option value="passive_income">Thu nhập thụ động</option>
                    <option value="irregular_income">Thu nhập không cố định</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-family-textMuted uppercase mb-2">
                    Trạng thái
                  </label>
                  <select 
                    className="w-full bg-family-bgDeep border border-family-accent/20 rounded-xl px-4 py-2.5 text-family-text focus:outline-none focus:border-family-accent/60 transition-colors text-xs h-[38px]"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as 'active' | 'cancelled' | 'settled' | 'planned')}
                  >
                    <option value="active">Đang hoạt động</option>
                    <option value="planned">Dự kiến</option>
                    <option value="settled">Đã kết thúc</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                </div>
                <Input
                  label="Tháng kết thúc"
                  placeholder="Bắt buộc nếu đã kết thúc"
                  type="number"
                  min={1}
                  max={12}
                  value={newEndMonth}
                  onChange={(e) => setNewEndMonth(e.target.value ? Number(e.target.value) : '')}
                />
                <Input
                  label="Năm kết thúc"
                  placeholder="Bắt buộc nếu đã kết thúc"
                  type="number"
                  min={2026}
                  max={2060}
                  value={newEndYear}
                  onChange={(e) => setNewEndYear(e.target.value ? Number(e.target.value) : '')}
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
                <CardDescription className="uppercase tracking-wider font-bold">Khoản thu khởi điểm</CardDescription>
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

          {/* Cliff Risk Warnings */}
          {(() => {
            const currentPeriodTotal = startPeriod.year * 12 + startPeriod.month;
            const cliffs = chartData.filter(d => d.cliffDrop > 0 && (d.year * 12 + d.month) > currentPeriodTotal);
            if (cliffs.length > 0) {
              return (
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-red-400 uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Cảnh báo Thu nhập rơi tự do (Income Cliff Risk)
                  </h4>
                  {cliffs.map((cliff, idx) => (
                    <WarningBox 
                      key={idx} 
                      type="danger" 
                      message={`Tháng ${cliff.month}/${cliff.year}: Tổng thu nhập sụt giảm mạnh ${formatKpiMoneyVNDMillion(cliff.cliffDrop)} so với tháng trước (Chỉ còn ${formatKpiMoneyVNDMillion(cliff['Khoản thu tháng'])}). Cần chuẩn bị nguồn thu thay thế!`} 
                    />
                  ))}
                </div>
              );
            }
            return null;
          })()}

          {/* BI Area Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-family-accent/10 p-5 bg-family-bgDark/5">
              <div className="border-b border-family-accent/5 pb-3 mb-4">
                <h4 className="font-bold text-sm text-family-text uppercase tracking-wider">
                  Thụ động vs Chủ động
                </h4>
                <p className="text-xs text-family-textMuted mt-0.5">Xu hướng tự do tài chính</p>
              </div>
              <div className="h-64 w-full bg-family-bgDark/20 rounded-xl p-2 shadow-inner">
                <IncomePassiveActiveChart data={chartData} yearTicks={yearTicks} />
              </div>
            </Card>

            <Card className="border border-family-accent/10 p-5 bg-family-bgDark/5">
              <div className="border-b border-family-accent/5 pb-3 mb-4">
                <h4 className="font-bold text-sm text-family-text uppercase tracking-wider">
                  Lũy kế thu nhập cả đời
                </h4>
                <p className="text-xs text-family-textMuted mt-0.5">Tổng giá trị tài sản tạo ra</p>
              </div>
              <div className="h-64 w-full bg-family-bgDark/20 rounded-xl p-2 shadow-inner">
                <IncomeCumulativeChart data={chartData} yearTicks={yearTicks} />
              </div>
            </Card>
          </div>

          {/* Income Projection Chart Card */}
          <Card className="border border-family-accent/10 p-5 bg-family-bgDark/5">
            <div className="border-b border-family-accent/5 pb-3 mb-4">
              <h4 className="font-bold text-sm text-family-text uppercase tracking-wider">
                Chi tiết Kế hoạch Thu nhập (2026 - 2060)
              </h4>
              <p className="text-xs text-family-textMuted mt-0.5">
                Dự báo các nguồn thu nhập tích lũy theo thời gian.
              </p>
            </div>
            
            <div className="h-80 w-full bg-family-bgDark/20 rounded-xl p-2 shadow-inner">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 15, right: 30, left: 10, bottom: 5 }}
                >
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
                    labelFormatter={(label, items) => items[0]?.payload ? items[0].payload.dateStr : label}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />
                  <Bar name="Tiền lương fulltime" dataKey="Tiền lương fulltime" stackId="a" fill="#3b82f6" />
                  <Bar name="Lương parttime" dataKey="Lương parttime" stackId="a" fill="#10b981" />
                  <Bar name="Tự kinh doanh" dataKey="Tự kinh doanh" stackId="a" fill="#f59e0b" />
                  <Bar name="Thu nhập thụ động" dataKey="Thu nhập thụ động" stackId="a" fill="#8b5cf6" />
                  <Bar name="Thu nhập không cố định" dataKey="Thu nhập không cố định" stackId="a" fill="#ec4899" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* List of Income Milestones Summary under chart */}
          <Card className="border border-family-accent/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm uppercase tracking-wider text-family-textMuted">Tóm tắt các mốc thay đổi thu nhập</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-family-accent/10 text-family-textMuted font-bold bg-family-bgDark/30">
                    <th className="p-3">Thời điểm hiệu lực</th>
                    <th className="p-3">Loại thu nhập</th>
                    <th className="p-3">Khoản thu tháng khởi điểm</th>
                    <th className="p-3">Trạng thái/Kết thúc</th>
                    <th className="p-3">Ghi chú hoàn cảnh</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSchedule.map((item) => (
                    <tr key={item.id} className="border-b border-family-accent/5 hover:bg-family-bgDark/10">
                      <td className="p-3 font-semibold text-family-text">
                        Tháng {item.effectiveMonth}/{item.effectiveYear}
                      </td>
                      <td className="p-3 font-medium text-family-text">
                        {getIncomeTypeLabel(item.incomeType)}
                      </td>
                      <td className="p-3 font-bold text-family-accent">
                        {formatTableMoneyVNDMillion(item.incomeMonthly)}
                      </td>
                      <td className="p-3 text-family-textMuted max-w-sm">
                        {item.status === 'cancelled' ? (
                          <span className="text-red-400 text-xs px-2 py-0.5 rounded-full bg-red-400/10">Đã hủy</span>
                        ) : item.status === 'planned' ? (
                          <span className="text-amber-400 text-xs px-2 py-0.5 rounded-full bg-amber-400/10">Dự kiến</span>
                        ) : item.status === 'settled' && item.endYear ? (
                          <span className="text-yellow-400 text-xs px-2 py-0.5 rounded-full bg-yellow-400/10">Đến {item.endMonth}/{item.endYear}</span>
                        ) : (
                          <span className="text-green-400 text-xs px-2 py-0.5 rounded-full bg-green-400/10">Đang HĐ</span>
                        )}
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
                          <span className="text-xs font-bold text-family-text flex items-center flex-wrap gap-1">
                            Tháng {item.effectiveMonth}/{item.effectiveYear}
                            {item.status === 'cancelled' ? (
                              <span className="text-[10px] text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">Đã hủy</span>
                            ) : item.endYear ? (
                              <span className="text-[10px] text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded">Tới {item.endMonth}/{item.endYear}</span>
                            ) : null}
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
                        Tinh chỉnh ngày hiệu lực và khoản thu tháng của mốc.
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-family-bgDark/35 p-4 rounded-2xl border border-family-accent/5">
                    <Input
                      label="Tháng bắt đầu"
                      type="number"
                      min={1}
                      max={12}
                      value={editMonth}
                      onChange={(e) => setEditMonth(safeNumber(Number(e.target.value)))}
                    />
                    <Input
                      label="Năm bắt đầu"
                      type="number"
                      min={2026}
                      max={2060}
                      value={editYear}
                      onChange={(e) => setEditYear(safeNumber(Number(e.target.value)))}
                    />
                    <Input
                      label="Khoản thu tháng"
                      type="number"
                      suffix="Tr VND"
                      value={editIncome}
                      onChange={(e) => setEditIncome(safeNumber(Number(e.target.value)))}
                    />
                    <div>
                      <label className="block text-xs font-semibold text-family-textMuted uppercase mb-2">
                        Loại thu nhập
                      </label>
                      <select 
                        className="w-full bg-family-bgDeep border border-family-accent/20 rounded-xl px-4 py-2.5 text-family-text focus:outline-none focus:border-family-accent/60 transition-colors text-xs h-[38px]"
                        value={editType}
                        onChange={(e) => setEditType(e.target.value as IncomeType)}
                      >
                        <option value="fulltime_salary">Tiền lương fulltime</option>
                        <option value="parttime_salary">Lương parttime</option>
                        <option value="self_employed">Tự kinh doanh</option>
                        <option value="passive_income">Thu nhập thụ động</option>
                        <option value="irregular_income">Thu nhập không cố định</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-family-textMuted uppercase mb-2">
                        Trạng thái
                      </label>
                      <select 
                        className="w-full bg-family-bgDeep border border-family-accent/20 rounded-xl px-4 py-2.5 text-family-text focus:outline-none focus:border-family-accent/60 transition-colors text-xs h-[38px]"
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as 'active' | 'cancelled' | 'settled' | 'planned')}
                      >
                        <option value="active">Đang hoạt động</option>
                        <option value="planned">Dự kiến</option>
                        <option value="settled">Đã kết thúc</option>
                        <option value="cancelled">Đã hủy</option>
                      </select>
                    </div>
                    <Input
                      label="Tháng kết thúc"
                      placeholder="Bắt buộc nếu đã kết thúc"
                      type="number"
                      min={1}
                      max={12}
                      value={editEndMonth}
                      onChange={(e) => setEditEndMonth(e.target.value ? Number(e.target.value) : '')}
                    />
                    <Input
                      label="Năm kết thúc"
                      placeholder="Bắt buộc nếu đã kết thúc"
                      type="number"
                      min={2026}
                      max={2060}
                      value={editEndYear}
                      onChange={(e) => setEditEndYear(e.target.value ? Number(e.target.value) : '')}
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
