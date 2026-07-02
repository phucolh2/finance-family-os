import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { WarningBox } from '../components/ui/WarningBox';
import { EmptyState } from '../components/ui/EmptyState';
import { runProjection } from '../engines/projectionEngine';
import {
  formatKpiMoneyVNDMillion,
  formatTooltipMoneyVNDMillion,
  formatAxisMoneyVNDMillion,
  formatTableMoneyVNDMillion,
} from '../utils/format';
import { KNOWLEDGE_ITEMS } from '../data/knowledgeItems';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { 
  Sparkles, 
  TrendingUp, 
  Wallet, 
  Flame, 
  ShieldAlert, 
  BadgeDollarSign, 
  Info, 
  X, 
  Lightbulb, 
  HeartPulse, 
  ArrowRightLeft,
  ChevronRight
} from 'lucide-react';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import { safeNumber } from '../utils/math';
import { ObservationControls } from '../components/ui/ObservationControls';

export const Dashboard: React.FC = () => {
  const { state, selectedPeriodKey } = useAppContext();

  // State for explanation modal/box
  const [explanationId, setExplanationId] = useState<string | null>(null);

  // Run projection engine purely
  const projection = runProjection({
    profile: state.profile,
    incomeSchedule: state.incomeSchedule,
    budgetSchedule: state.budgetSchedule,
    lifeEvents: state.lifeEvents,
    assets: state.assets,
    assumptions: state.assumptions,
    investmentDeals: state.investmentDeals,
  });

  const hasData = projection.monthlyRows.length > 0;
  const lastRow = hasData ? projection.monthlyRows[projection.monthlyRows.length - 1] : null;

  // Determine current/selected period logic
  const now = new Date();
  const nowMonth = now.getMonth() + 1;
  const nowYear = now.getFullYear();
  const nowKey = `${nowYear}-${String(nowMonth).padStart(2, '0')}`;

  const currentPeriod = hasData
    ? (projection.monthlyRows.find(r => r.period.key === nowKey) || projection.monthlyRows[0])
    : null;

  // Active observation snapshot row
  const activeRow = (hasData && selectedPeriodKey)
    ? (projection.monthlyRows.find(r => r.period.key === selectedPeriodKey) || currentPeriod)
    : currentPeriod;

  // Extract starting metrics dynamically from the active snapshot
  const currentIncome = activeRow ? activeRow.incomeMonthly : 0;
  const currentInvestment = activeRow ? activeRow.investmentMonthly : 0;
  const currentSaving = activeRow ? activeRow.savingMonthly : 0;
  const currentNetWorth = activeRow ? activeRow.nominalNetWorth : 0;
  const currentPcf = (currentNetWorth * 4 / 100) / 12;
  const currentFireProgress = activeRow ? activeRow.fireProgress : 0;
  const currentExpenses = activeRow ? activeRow.expensesMonthly : 0;

  // Calculate cumulative figures from start month up to the activeRow's index
  const activeIndex = activeRow ? activeRow.period.index : 0;
  const rowsUpToActive = hasData ? projection.monthlyRows.slice(0, activeIndex + 1) : [];
  const monthsElapsed = rowsUpToActive.length;

  const startingNetWorth = safeNumber(state.profile.startingCapital, 100);
  
  let cumulativeSaving = 0;
  let cumulativeInvestment = 0;
  let cumulativeEventOutflows = 0;

  rowsUpToActive.forEach((row) => {
    cumulativeSaving += row.savingMonthly;
    cumulativeInvestment += row.investmentMonthly;
  });

  // Calculate cumulative life events up to active month/year
  if (activeRow) {
    const activeDate = { year: activeRow.period.year, month: activeRow.period.month };
    state.lifeEvents.forEach((e) => {
      const eventDate = { year: safeNumber(e.year), month: safeNumber(e.month) };
      const isPastOrCurrent = (eventDate.year < activeDate.year) || 
                            (eventDate.year === activeDate.year && eventDate.month <= activeDate.month);
      if (isPastOrCurrent) {
        cumulativeEventOutflows += Math.abs(safeNumber(e.amount, 0));
      }
    });
  }

  // Calculate cumulative returns (residual growth)
  const cumulativeReturns = activeRow 
    ? Math.max(0, activeRow.nominalNetWorth - startingNetWorth - cumulativeSaving - cumulativeInvestment + cumulativeEventOutflows)
    : 0;

  // Calculate Dynamic Financial Health Score (Khoa học, Chuẩn Quốc tế)
  const savingsRate = currentIncome > 0 ? ((currentSaving + currentInvestment) / currentIncome) * 100 : 0;
  const savingsRateScore = Math.min(40, savingsRate * 0.8); // 40 points if savingsRate >= 50%
  
  const totalActiveCapital = activeRow 
    ? Object.values(activeRow.portfolio.assets).reduce((sum, a) => sum + a.endingBalance, 0)
    : 0;
  const dealAllocationScore = currentNetWorth > 0 
    ? Math.min(30, (totalActiveCapital / currentNetWorth) * 30) 
    : 0; // 30 points if assets are allocated to active deals
  
  const fireScore = Math.min(20, (currentFireProgress || 0) * 0.2); // 20 points if FIRE progress is high
  
  const warningsCount = projection.warnings.filter(w => {
    if (!activeRow) return false;
    return w.includes(`Tháng ${activeRow.period.month}/${activeRow.period.year}`);
  }).length;
  const defensiveScore = Math.max(10 - (warningsCount * 5), 0); // 10 points max, penalty of 5 per warning in observed month
  
  const healthScore = Math.round(savingsRateScore + dealAllocationScore + fireScore + defensiveScore);

  // Render chart data from yearly rows
  const yearlyChartData = projection.yearlyRows.map((row) => ({
    year: `Năm ${row.year}`,
    'Tài sản ròng (Danh nghĩa)': Math.round(row.nominalNetWorth),
    'Tài sản ròng (Thực tế)': Math.round(row.realNetWorth),
    'Hạn mức FIRE': Math.round(row.fireTarget),
    'Tổng thu nhập': Math.round(row.totalIncomeYearly),
    'Tổng chi phí': Math.round(row.totalExpensesYearly),
  }));

  // Find expected FIRE target age
  const fireCrossingRow = projection.monthlyRows.find((r) => r.nominalNetWorth >= r.fireTarget);
  const fireAgeHusband = fireCrossingRow ? fireCrossingRow.period.husbandAge : null;
  const fireYear = fireCrossingRow ? fireCrossingRow.period.year : null;

  // Determine explanation item from knowledge data
  const explanationItem = KNOWLEDGE_ITEMS.find((item) => item.id === explanationId);

  // Scanning upcoming events (within 6 months of observed month)
  const upcomingEvents = activeRow
    ? state.lifeEvents.filter((e) => {
        const eventMonths = safeNumber(e.year) * 12 + safeNumber(e.month);
        const activeMonths = activeRow.period.year * 12 + activeRow.period.month;
        return eventMonths > activeMonths && eventMonths <= activeMonths + 6;
      })
    : [];

  // Generate dynamic AI observations based purely on the observed month
  const aiComments: string[] = [];
  if (savingsRate < 20) {
    aiComments.push(`⚠️ Tỷ lệ tích lũy tháng này đang ở mức thấp (${savingsRate.toFixed(1)}%). Hãy cân nhắc cắt giảm chi tiêu không thiết yếu.`);
  } else {
    aiComments.push(`📈 Tỷ lệ tích lũy tháng này đạt mức lý tưởng (${savingsRate.toFixed(1)}%), hỗ trợ tích lũy vốn đầu tư nhanh chóng.`);
  }

  if (upcomingEvents.length > 0) {
    const nextEvent = upcomingEvents[0];
    aiComments.push(`🔔 Sắp có sự kiện "${nextEvent.name}" diễn ra vào tháng ${nextEvent.month}/${nextEvent.year} với ngân sách ${nextEvent.amount}M. Hãy giữ tính thanh khoản trong ví Tiền chờ phân bổ.`);
  }

  if (warningsCount > 0) {
    aiComments.push(`🚨 Động cơ phát hiện cảnh báo thâm hụt tài chính trong tháng quan sát này. Vui lòng rà soát bảng phân bổ chi phí.`);
  } else if (fireYear && activeRow && activeRow.period.year < fireYear) {
    aiComments.push(`✨ Gia đình đang đi đúng lộ trình đạt tự do tài chính (FIRE) vào năm ${fireYear} ở tuổi chồng là ${fireAgeHusband}.`);
  }

  // Health score evaluation label
  const getHealthLabel = (score: number) => {
    if (score >= 80) return { label: 'Tối ưu / Xuất sắc', color: 'text-green-700 bg-green-50' };
    if (score >= 60) return { label: 'An toàn / Khá', color: 'text-teal-700 bg-teal-50' };
    if (score >= 40) return { label: 'Cần cải thiện', color: 'text-amber-700 bg-amber-50' };
    return { label: 'Cảnh báo rủi ro', color: 'text-red-600 bg-red-50' };
  };
  const healthMeta = getHealthLabel(healthScore);

  // SVG Circular progress configurations
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.max(1, Math.min(100, healthScore)) / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-family-text flex items-center gap-2">
            Tổng quan tài chính gia đình
            <HelpTooltip text="Bản sao kỹ thuật số hiển thị KPIs động, AI Twin Advisor và phân tích tài sản ròng/dòng tiền." />
          </h1>
          <p className="text-sm text-family-textMuted mt-1">
            Bản sao kỹ thuật số tài chính (Financial Digital Twin) của hai vợ chồng {state.profile.husbandName} & {state.profile.wifeName}.
          </p>
        </div>
        <ObservationControls />
      </div>

      {/* KPI & Health Score Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Income Card */}
        <Card isKpi className="border-l-family-accent bg-white/70 backdrop-blur-md shadow-sm transition-all hover:-translate-y-0.5">
          <CardContent className="p-4 flex flex-col justify-between h-24">
            <div className="flex items-center justify-between text-family-textMuted text-[10px] uppercase font-bold tracking-wider">
              <span className="flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5 text-family-accent" /> Khoản thu</span>
              <button onClick={() => setExplanationId('permanent_income_hypothesis')} className="text-[9px] text-family-accent hover:underline font-normal">Explain</button>
            </div>
            <div>
              <div className="text-lg font-bold text-family-text">{formatKpiMoneyVNDMillion(currentIncome)}</div>
              <div className="text-[9px] text-family-textMuted mt-0.5">Tháng quan sát</div>
            </div>
          </CardContent>
        </Card>

        {/* Investment Card */}
        <Card isKpi className="border-l-green bg-white/70 backdrop-blur-md shadow-sm transition-all hover:-translate-y-0.5">
          <CardContent className="p-4 flex flex-col justify-between h-24">
            <div className="flex items-center justify-between text-family-textMuted text-[10px] uppercase font-bold tracking-wider">
              <span className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-green-700" /> Khoản đầu tư</span>
              <button onClick={() => setExplanationId('modern_portfolio_theory')} className="text-[9px] text-family-accent hover:underline font-normal">Explain</button>
            </div>
            <div>
              <div className="text-lg font-bold text-family-text">{formatKpiMoneyVNDMillion(currentInvestment)}</div>
              <div className="text-[9px] text-family-textMuted mt-0.5">Đã trích trong tháng</div>
            </div>
          </CardContent>
        </Card>

        {/* Expense Card */}
        <Card isKpi className="border-l-teal bg-white/70 backdrop-blur-md shadow-sm transition-all hover:-translate-y-0.5">
          <CardContent className="p-4 flex flex-col justify-between h-24">
            <div className="flex items-center justify-between text-family-textMuted text-[10px] uppercase font-bold tracking-wider">
              <span className="flex items-center gap-1.5"><BadgeDollarSign className="w-3.5 h-3.5 text-teal-700" /> Khoản chi</span>
              <button onClick={() => setExplanationId('harvard_study')} className="text-[9px] text-family-accent hover:underline font-normal">Explain</button>
            </div>
            <div>
              <div className="text-lg font-bold text-family-text">{formatKpiMoneyVNDMillion(currentExpenses)}</div>
              <div className="text-[9px] text-family-textMuted mt-0.5">Tổng chi hàng tháng</div>
            </div>
          </CardContent>
        </Card>

        {/* Savings Rate Card */}
        <Card isKpi className="border-l-purple bg-white/70 backdrop-blur-md shadow-sm transition-all hover:-translate-y-0.5">
          <CardContent className="p-4 flex flex-col justify-between h-24">
            <div className="flex items-center justify-between text-family-textMuted text-[10px] uppercase font-bold tracking-wider">
              <span className="flex items-center gap-1.5"><ArrowRightLeft className="w-3.5 h-3.5 text-purple-700" /> Tỷ lệ tích lũy</span>
              <button onClick={() => setExplanationId('trinity_study')} className="text-[9px] text-family-accent hover:underline font-normal">Explain</button>
            </div>
            <div>
              <div className="text-lg font-bold text-family-text">{savingsRate.toFixed(1)}%</div>
              <div className="text-[9px] text-family-textMuted mt-0.5">Mục tiêu: &ge; 20%</div>
            </div>
          </CardContent>
        </Card>

        {/* PCF Card */}
        <Card isKpi className="border-l-blue bg-white/70 backdrop-blur-md shadow-sm transition-all hover:-translate-y-0.5">
          <CardContent className="p-4 flex flex-col justify-between h-24">
            <div className="flex items-center justify-between text-family-textMuted text-[10px] uppercase font-bold tracking-wider">
              <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-blue-600" /> Dòng tiền thụ động</span>
              <button onClick={() => setExplanationId('trinity_study')} className="text-[9px] text-family-accent hover:underline font-normal">Explain</button>
            </div>
            <div>
              <div className="text-lg font-bold text-family-text">{formatKpiMoneyVNDMillion(currentPcf)}</div>
              <div className="text-[9px] text-family-textMuted mt-0.5">Quy đổi từ Net Worth (4%)</div>
            </div>
          </CardContent>
        </Card>

        {/* Health Score Circular Dial Card */}
        <Card className="border-l-yellow-600 bg-white/70 backdrop-blur-md shadow-sm transition-all hover:-translate-y-0.5 md:col-span-3 lg:col-span-1">
          <CardContent className="p-3 flex items-center justify-between h-24">
            <div className="space-y-1">
              <span className="text-[10px] text-family-textMuted font-bold uppercase tracking-wider block">Sức khỏe tài chính</span>
              <div className={`text-[9px] font-bold px-2 py-0.5 rounded-lg inline-block ${healthMeta.color}`}>
                {healthMeta.label}
              </div>
            </div>
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  className="stroke-family-accent/10"
                  strokeWidth="4.5"
                  fill="transparent"
                />
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  className="stroke-yellow-600 transition-all duration-500"
                  strokeWidth="4.5"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-sm font-extrabold text-family-text">{healthScore}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Explanation Box when active */}
      {explanationItem && (
        <Card className="bg-family-accent/5 border-family-accent/30 relative">
          <button
            onClick={() => setExplanationId(null)}
            className="absolute top-3 right-3 text-family-textLight hover:text-family-text p-1"
          >
            <X className="w-4 h-4" />
          </button>
          <CardHeader className="pb-1.5">
            <CardTitle className="text-xs font-serif font-bold text-family-text flex items-center gap-2">
              <Info className="w-4 h-4 text-family-accent" /> Giải thích lý thuyết: {explanationItem.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-family-textMuted space-y-2">
            <p><strong>Bản chất:</strong> {explanationItem.simpleMeaning}</p>
            <p><strong>Ứng dụng gia đình:</strong> {explanationItem.familyApplication}</p>
            <p className="text-family-textLight italic"><strong>Minh họa số học:</strong> {explanationItem.numericExample}</p>
          </CardContent>
        </Card>
      )}

      {/* Main Dashboard Section: AI Advisor & Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Advisor Panel */}
        <Card className="lg:col-span-2 bg-gradient-to-br from-family-bgDark/40 via-family-bgDark/20 to-transparent border-family-accent/15 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-family-accent/5 rounded-full filter blur-2xl" />
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-family-text font-serif">
              <Sparkles className="w-5 h-5 text-family-accent animate-pulse" /> Tài Sản Song Sinh (Financial AI Advisor)
            </CardTitle>
            <CardDescription className="text-xs">
              Ý kiến nhận xét độc lập và gợi ý định hướng cấu trúc tích lũy từ AI Twin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* dynamic monthly AI advice */}
            <div className="bg-white/40 border border-family-accent/10 p-4 rounded-2xl space-y-2">
              <h5 className="text-[10px] font-bold text-family-accent uppercase tracking-wider flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5" /> Nhận xét tháng {activeRow?.period.month}/{activeRow?.period.year}
              </h5>
              <div className="space-y-2">
                {aiComments.map((c, i) => (
                  <p key={i} className="text-xs text-family-text font-medium flex items-start gap-2">
                    <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-0.5 text-family-accent" />
                    <span>{c}</span>
                  </p>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Warnings from Engine */}
              <div className="space-y-2">
                <h5 className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Cảnh báo hệ thống (Engine Warnings)</h5>
                {projection.warnings.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {projection.warnings.slice(0, 3).map((w, idx) => (
                      <div key={idx} className="text-[11px] text-red-700 bg-red-50/50 p-2.5 rounded-xl border border-red-200/50 flex items-start gap-1.5">
                        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-green-700 font-semibold bg-green-50/50 p-2.5 rounded-xl border border-green-200/30">
                    Không phát hiện bất kỳ cảnh báo thâm hụt nào từ động cơ dự phòng.
                  </p>
                )}
              </div>

              {/* Suggestions */}
              <div className="space-y-2">
                <h5 className="text-[10px] font-bold text-green-800 uppercase tracking-wider flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5 text-green-700" /> Gợi ý hành động bổ trợ
                </h5>
                <ul className="text-xs text-family-textMuted space-y-1.5 list-disc list-inside">
                  <li>Xem xét cơ cấu các dòng thu nhập thụ động khi tích lũy vượt mức 500 triệu.</li>
                  <li>Khi lãi suất tiết kiệm ở mức thấp, hãy dịch chuyển dòng tiền sang quỹ chứng khoán hoặc Crypto.</li>
                  <li>Cân đối ngân sách chi tiêu hàng tháng của trẻ em trong giai đoạn đi học.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visual Cashflow Breakdown Card (Sankey-like flow) */}
        <Card className="border-family-accent/15 bg-white/70 shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-family-text flex items-center gap-1.5">
              <span>📊</span> Cấu trúc luồng tiền tháng
            </CardTitle>
            <CardDescription className="text-xs">
              Mô tả phân rã phân bổ Khoản thu tháng {activeRow?.period.month}/{activeRow?.period.year}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5 flex-1 flex flex-col justify-center">
            {/* Inflow */}
            <div className="bg-family-accent/5 border border-family-accent/15 p-3 rounded-2xl">
              <div className="flex justify-between items-center text-xs font-bold text-family-text">
                <span>Khoản thu (Tiền vào)</span>
                <span className="text-family-accent">{formatTableMoneyVNDMillion(currentIncome)}</span>
              </div>
            </div>

            {/* Outflow Breakdown */}
            <div className="space-y-2 border-l-2 border-dashed border-family-accent/20 pl-4 py-1 ml-4">
              <div className="flex justify-between items-center text-[11px] font-semibold text-family-textMuted">
                <span className="flex items-center gap-1">🔴 Khoản chi sinh hoạt:</span>
                <span>-{formatTableMoneyVNDMillion(currentExpenses)}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-semibold text-green-700">
                <span className="flex items-center gap-1">🟢 Đầu tư tích lũy:</span>
                <span>+{formatTableMoneyVNDMillion(currentInvestment)}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-semibold text-purple-700">
                <span className="flex items-center gap-1">🟣 Quỹ tiết kiệm:</span>
                <span>+{formatTableMoneyVNDMillion(currentSaving)}</span>
              </div>
            </div>

            {/* Accounting Formula equation */}
            <div className="bg-family-bgDark/30 border border-family-accent/5 p-3 rounded-2xl mt-auto">
              <div className="flex justify-between items-center text-[10px] text-family-textMuted">
                <span className="font-bold">Phương trình ngân sách:</span>
                <span>Khoản thu = Khoản chi + Đầu tư + Tiết kiệm</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Point-in-Time Net Worth Explanation Card */}
      {activeRow && (
        <Card className="border border-family-accent/15 bg-family-bgDark/35 shadow-sm p-5">
          <div className="border-b border-family-accent/10 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-bold text-sm text-family-text uppercase tracking-wider">
                Bản Giải Trình Tích Lũy Tài Sản Ròng
              </h4>
              <p className="text-xs text-family-textMuted mt-0.5">
                Phân rã lũy tiến các nguồn dòng tiền từ mốc bắt đầu đến tháng quan sát ({activeRow.period.month < 10 ? `0${activeRow.period.month}` : activeRow.period.month}/{activeRow.period.year}).
              </p>
            </div>
            <div className="bg-family-accent/10 border border-family-accent/25 px-3 py-1 rounded-xl text-center">
              <span className="text-[10px] text-family-textMuted font-bold uppercase block">Thời gian trôi qua</span>
              <span className="text-sm font-extrabold text-family-accent">{monthsElapsed} tháng</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-family-bgDark/20 p-3.5 rounded-xl border border-family-accent/5">
              <span className="text-[10px] text-family-textMuted font-bold uppercase tracking-wider block">1. Vốn tích lũy gốc</span>
              <span className="text-base font-extrabold text-family-text block mt-1">{formatKpiMoneyVNDMillion(startingNetWorth)}</span>
              <span className="text-[10px] text-family-textMuted mt-0.5 block italic">Tổng số dư khởi điểm ban đầu</span>
            </div>
            <div className="bg-family-bgDark/20 p-3.5 rounded-xl border border-family-accent/5">
              <span className="text-[10px] text-family-textMuted font-bold uppercase tracking-wider block">2. Tiền tích lũy mới</span>
              <span className="text-base font-extrabold text-green-700 block mt-1">+{formatKpiMoneyVNDMillion(cumulativeSaving + cumulativeInvestment)}</span>
              <span className="text-[10px] text-family-textMuted mt-0.5 block italic">Đã trích: {formatKpiMoneyVNDMillion(cumulativeSaving)} TK + {formatKpiMoneyVNDMillion(cumulativeInvestment)} ĐT</span>
            </div>
            <div className="bg-family-bgDark/20 p-3.5 rounded-xl border border-family-accent/5">
              <span className="text-[10px] text-family-textMuted font-bold uppercase tracking-wider block">3. Lợi nhuận sinh lời</span>
              <span className="text-base font-extrabold text-teal-700 block mt-1">+{formatKpiMoneyVNDMillion(cumulativeReturns)}</span>
              <span className="text-[10px] text-family-textMuted mt-0.5 block italic">Lãi kép cộng dồn từ tiết kiệm & thương vụ chốt lời</span>
            </div>
            <div className="bg-family-bgDark/20 p-3.5 rounded-xl border border-family-accent/5">
              <span className="text-[10px] text-family-textMuted font-bold uppercase tracking-wider block">4. Chi tiêu đột xuất</span>
              <span className="text-base font-extrabold text-red-600 block mt-1">-{formatKpiMoneyVNDMillion(cumulativeEventOutflows)}</span>
              <span className="text-[10px] text-family-textMuted mt-0.5 block italic">Khấu trừ mua xe, mua nhà, sinh con...</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-family-accent/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-family-accent/5 p-4 rounded-xl">
            <div className="text-xs text-family-textMuted">
              <span className="font-bold text-family-text">Phương trình kế toán:</span> Tài sản ròng = Vốn gốc (1) + Tích lũy mới (2) + Lợi nhuận (3) - Chi tiêu đột xuất (4)
            </div>
            <div className="text-right">
              <span className="text-[10px] text-family-textMuted font-bold uppercase block">Tài sản ròng quan sát</span>
              <span className="text-lg font-extrabold text-family-accent">
                {formatKpiMoneyVNDMillion(currentNetWorth)}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Net Worth Chart */}
        <Card className="border-family-accent/10 shadow-sm bg-white/70 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-base font-serif font-bold text-family-text">Dự phóng Tài sản ròng dài hạn</CardTitle>
            <CardDescription className="text-xs text-family-textMuted">Tích lũy danh nghĩa vs Sức mua thực tế (đã chiết khấu lạm phát {state.assumptions.generalInflationRateAnnual}%).</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={yearlyChartData} margin={{ top: 16, right: 30, left: 10, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorNominal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d97706" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4d7c0f" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#4d7c0f" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(125, 83, 45, 0.08)" />
                  <XAxis dataKey="year" stroke="#6f5d50" fontSize={10} tick={{ fontSize: 9, angle: -45, textAnchor: 'end' }} height={60} />
                  <YAxis stroke="#6f5d50" fontSize={10} tickFormatter={formatAxisMoneyVNDMillion} />
                  <Tooltip formatter={(value) => formatTooltipMoneyVNDMillion(value)} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Area type="monotone" name="Tài sản ròng (Danh nghĩa)" dataKey="Tài sản ròng (Danh nghĩa)" stroke="#d97706" fillOpacity={1} fill="url(#colorNominal)" strokeWidth={2} />
                  <Area type="monotone" name="Tài sản ròng (Thực tế)" dataKey="Tài sản ròng (Thực tế)" stroke="#4d7c0f" fillOpacity={1} fill="url(#colorReal)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Card>

        {/* Yearly Cashflow Chart */}
        <Card className="border-family-accent/10 shadow-sm bg-white/70 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-base font-serif font-bold text-family-text">Khoản thu vs Khoản chi hàng năm</CardTitle>
            <CardDescription className="text-xs text-family-textMuted">Mô phỏng tích lũy dòng tiền hàng năm qua các giai đoạn.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyChartData} margin={{ top: 16, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(125, 83, 45, 0.08)" />
                  <XAxis dataKey="year" stroke="#6f5d50" fontSize={10} tick={{ fontSize: 9, angle: -45, textAnchor: 'end' }} height={60} />
                  <YAxis stroke="#6f5d50" fontSize={10} tickFormatter={formatAxisMoneyVNDMillion} />
                  <Tooltip formatter={(value) => formatTooltipMoneyVNDMillion(value)} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar name="Tổng khoản thu" dataKey="Tổng thu nhập" fill="#d97706" radius={[4, 4, 0, 0]} />
                  <Bar name="Tổng khoản chi" dataKey="Tổng chi phí" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
