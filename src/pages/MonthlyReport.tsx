import React, { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { runProjection } from '../engines/projectionEngine';
import { simulateSinkingFund } from '../engines/sinkingFundEngine';
import { isPeriodLocked } from '../utils/lockSystem';
import {
  formatKpiMoneyVNDMillion,
  formatTableMoneyVNDMillion,
  formatPercent,
} from '../utils/format';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import {
  Printer,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  ShieldCheck,
  PiggyBank,
  LineChart,
  Receipt,
  HeartHandshake,
  Download,
  AlertCircle,
  Award,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export const MonthlyReport: React.FC = () => {
  const { state, selectedPeriodKey, setSelectedPeriodKey } = useAppContext();

  // Parse active month & year from selectedPeriodKey (fallback to current system date)
  const { currentYear, currentMonth, activePeriodKey } = useMemo(() => {
    let y = new Date().getFullYear();
    let m = new Date().getMonth() + 1;
    if (selectedPeriodKey) {
      const parts = selectedPeriodKey.split('-');
      if (parts.length === 2) {
        y = parseInt(parts[0], 10);
        m = parseInt(parts[1], 10);
      }
    }
    return {
      currentYear: y,
      currentMonth: m,
      activePeriodKey: `${y}-${String(m).padStart(2, '0')}`,
    };
  }, [selectedPeriodKey]);

  // Previous month period key
  const prevPeriodKey = useMemo(() => {
    const prevM = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevY = currentMonth === 1 ? currentYear - 1 : currentYear;
    return `${prevY}-${String(prevM).padStart(2, '0')}`;
  }, [currentYear, currentMonth]);

  // Handler to navigate between months
  const handlePrevMonth = () => {
    const prevM = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevY = currentMonth === 1 ? currentYear - 1 : currentYear;
    setSelectedPeriodKey(`${prevY}-${String(prevM).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const nextM = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextY = currentMonth === 12 ? currentYear + 1 : currentYear;
    setSelectedPeriodKey(`${nextY}-${String(nextM).padStart(2, '0')}`);
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    setSelectedPeriodKey(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  };

  // Run projection engine at the active period
  const projection = useMemo(() => {
    return runProjection({
      profile: state.profile,
      incomeSchedule: state.incomeSchedule,
      budgetSchedule: state.budgetSchedule,
      lifeEvents: state.lifeEvents,
      assets: state.assets,
      assumptions: state.assumptions,
      investmentDeals: state.investmentDeals,
      savingsDeposits: state.savingsDeposits,
      sinkingFunds: state.sinkingFunds,
      fundTransfers: state.fundTransfers,
      debts: state.debts,
      expenseSchedule: state.expenseSchedule,
      lifeStages: state.lifeStages,
      projectionAdjustments: state.projectionAdjustments,
      observationPeriodKey: activePeriodKey,
    });
  }, [state, activePeriodKey]);

  const projRow = useMemo(() => {
    return (
      projection.monthlyRows.find((r) => r.period.key === activePeriodKey) ||
      projection.monthlyRows[0] ||
      null
    );
  }, [projection, activePeriodKey]);

  const prevProjRow = useMemo(() => {
    return projection.monthlyRows.find((r) => r.period.key === prevPeriodKey) || null;
  }, [projection, prevPeriodKey]);

  const currDb = state.resolvedMonthlyDbMap?.[activePeriodKey];
  const prevDb = state.resolvedMonthlyDbMap?.[prevPeriodKey];

  // Core Figures
  const totalIncome = currDb?.income ?? (projRow?.incomeMonthly || 0);
  const prevIncome = prevDb?.income ?? (prevProjRow?.incomeMonthly || 0);
  const incomeDiff = totalIncome - prevIncome;

  const totalActualExpense =
    currDb?.totalActualExpenseMonthly ??
    (projRow?.expensesMonthly || 0);
  const prevExpense =
    prevDb?.totalActualExpenseMonthly ??
    (prevProjRow?.expensesMonthly || 0);
  const expenseDiff = totalActualExpense - prevExpense;

  const budgetExpenseTarget = currDb?.budgetAmounts?.['expense'] || 0;
  const budgetInvestTarget = currDb?.budgetAmounts?.['investment'] || 0;
  const budgetSavingTarget = currDb?.budgetAmounts?.['saving'] || 0;
  const budgetReserveTarget = currDb?.budgetAmounts?.['debt_reserve'] || 0;

  const totalInvested =
    currDb?.investmentFlow?.contribution ?? (projRow?.investmentMonthly || 0);
  const totalSaved = projRow?.savingMonthly || 0;
  const debtPaid = projRow?.debtPaymentMonthly || 0;

  // Net Cashflow Surplus in Month
  const cashflowSurplus = totalIncome - totalActualExpense - debtPaid;
  const savingsRate =
    totalIncome > 0
      ? Math.min(
          100,
          Math.max(
            0,
            ((totalSaved + totalInvested + Math.max(0, cashflowSurplus - totalSaved - totalInvested)) /
              totalIncome) *
              100
          )
        )
      : 0;

  const netWorth = projRow?.nominalNetWorth || 0;
  const prevNetWorth = prevProjRow?.nominalNetWorth || 0;
  const netWorthDiff = netWorth - prevNetWorth;

  // 4 Pillars Comparison Data for Chart
  const pillarsData = useMemo(() => {
    return [
      {
        name: '1. Chi phí',
        shortName: 'Chi tiêu',
        classification: 'expense',
        budget: budgetExpenseTarget,
        actual: totalActualExpense,
        color: '#f87171', // Red/Rose
        unit: 'triệu',
      },
      {
        name: '2. Đầu tư',
        shortName: 'Đầu tư',
        classification: 'investment',
        budget: budgetInvestTarget,
        actual: totalInvested,
        color: '#3b82f6', // Blue
        unit: 'triệu',
      },
      {
        name: '3. Tiết kiệm',
        shortName: 'Tiết kiệm',
        classification: 'savings',
        budget: budgetSavingTarget,
        actual: totalSaved,
        color: '#10b981', // Emerald
        unit: 'triệu',
      },
      {
        name: '4. Dự phòng & Nợ',
        shortName: 'Dự phòng',
        classification: 'debt_reserve',
        budget: budgetReserveTarget,
        actual: debtPaid + (projRow?.liquidityMonthly || 0),
        color: '#f59e0b', // Amber
        unit: 'triệu',
      },
    ];
  }, [
    budgetExpenseTarget,
    totalActualExpense,
    budgetInvestTarget,
    totalInvested,
    budgetSavingTarget,
    totalSaved,
    budgetReserveTarget,
    debtPaid,
    projRow,
  ]);

  // Top Expense Categories in this month
  const topExpenseCategories = useMemo(() => {
    if (!currDb?.actualExpenseCategories) return [];
    return Object.entries(currDb.actualExpenseCategories)
      .map(([name, amount]) => ({ name, amount: Number(amount) }))
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [currDb]);

  // Sinking Funds Status at this month
  const sinkingFundsStatus = useMemo(() => {
    if (!state.sinkingFunds || state.sinkingFunds.length === 0) return [];
    return state.sinkingFunds
      .filter((f) => f.status === 'active')
      .map((f) => {
        const { totalPrincipal, nonTermCash } = simulateSinkingFund(f, currentMonth, currentYear);
        const currentBal = totalPrincipal + nonTermCash;
        const progress = f.targetAmount > 0 ? Math.min(100, (currentBal / f.targetAmount) * 100) : 0;
        return {
          id: f.id,
          name: f.name,
          currentBal,
          targetAmount: f.targetAmount,
          progress,
          monthlyContribution: f.monthlyContribution || 0,
        };
      })
      .sort((a, b) => b.currentBal - a.currentBal);
  }, [state.sinkingFunds, currentMonth, currentYear]);

  // Financial Health Score Calculation (0-100)
  const healthScore = useMemo(() => {
    let score = 0;
    if (totalIncome <= 0) return 50;

    // 1. Expense ratio (max 35 pts)
    const expenseRatio = totalActualExpense / totalIncome;
    if (expenseRatio <= 0.55) score += 35;
    else if (expenseRatio <= 0.7) score += 25;
    else if (expenseRatio <= 0.85) score += 15;
    else score += 5;

    // 2. Debt Burden (max 25 pts)
    const debtRatio = debtPaid / totalIncome;
    if (debtRatio === 0) score += 25;
    else if (debtRatio <= 0.2) score += 22;
    else if (debtRatio <= 0.35) score += 15;
    else score += 5;

    // 3. Savings & Investment rate (max 25 pts)
    if (savingsRate >= 30) score += 25;
    else if (savingsRate >= 20) score += 20;
    else if (savingsRate >= 10) score += 12;
    else score += 5;

    // 4. Reserve liquidity cushion (max 15 pts)
    const liquidity = projRow?.liquidityMonthly || 0;
    if (liquidity >= totalActualExpense * 3) score += 15;
    else if (liquidity >= totalActualExpense) score += 10;
    else score += 5;

    return Math.min(100, Math.max(0, score));
  }, [totalIncome, totalActualExpense, debtPaid, savingsRate, projRow]);

  // Handle Print
  const handlePrint = () => {
    window.print();
  };

  // Export current month summary to CSV
  const handleExportMonthCsv = () => {
    const headers = ['Chi muc', 'Gia tri (trieu VND)', 'Ghi chu'];
    const rows = [
      ['Ky bao cao', `Thang ${currentMonth}/${currentYear}`, activePeriodKey],
      ['Tong thu nhap', totalIncome.toFixed(2), 'Chu dong + Thu dong'],
      ['Chi tieu thuc te', totalActualExpense.toFixed(2), 'Dinh muc: ' + budgetExpenseTarget.toFixed(2)],
      ['Thang du dong tien', cashflowSurplus.toFixed(2), 'Thu nhap - Chi phi - No'],
      ['Tien dau tu', totalInvested.toFixed(2), 'Rot vao danh muc'],
      ['Tien tiet kiem', totalSaved.toFixed(2), 'Gui tiet kiem + Sinking fund'],
      ['Tien tra no', debtPaid.toFixed(2), 'Goc + Lai no vay'],
      ['Tai san rong uoc tinh', netWorth.toFixed(2), 'Net Worth cuoi thang'],
    ];

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bao_cao_Tai_chinh_T${currentMonth}_${currentYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 print:p-0 print:space-y-4 print:max-w-none text-family-text">
      {/* Top Header / Bar */}
      <div className="glass-panel rounded-3xl p-5 md:p-6 border border-family-accent/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:border-none print:shadow-none print:p-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-serif font-bold text-family-text flex items-center gap-2">
              <span>📊</span> Báo Cáo Tài Chính Hàng Tháng
            </h1>
            <HelpTooltip
              text="Bản tổng kết tài chính điều hành cho gia đình trong tháng được chọn. Đánh giá thu nhập, chi tiêu, 4 trụ cột ngân sách và điểm số sức khỏe tài chính."
              position="bottom"
            />
            {isPeriodLocked(state.profile?.lockedUntilPeriod, currentMonth, currentYear) ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 print:border-gray-400">
                🔒 Đã chốt sổ
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 print:border-gray-400">
                ✏️ Đang theo dõi
              </span>
            )}
          </div>
          <p className="text-xs md:text-sm text-family-textLight mt-1">
            Gia đình: <strong className="text-family-text font-serif">{state.profile.husbandName} & {state.profile.wifeName}</strong> • Kỳ: Tháng {currentMonth}/{currentYear}
          </p>
        </div>

        {/* Controls: Prev, Next, Today, Export, Print (Hidden during printing) */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <div className="flex items-center bg-white/90 border border-family-accent/20 rounded-2xl p-1 shadow-2xs">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-family-bgDeep text-family-text transition-colors cursor-pointer"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-family-text min-w-[5.5rem] text-center font-mono">
              T{currentMonth}/{currentYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-family-bgDeep text-family-text transition-colors cursor-pointer"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleCurrentMonth}
            className="px-3 py-2 rounded-2xl bg-white border border-family-accent/20 text-xs font-bold text-family-text hover:bg-family-bgDeep transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
            title="Về tháng hiện tại"
          >
            <Calendar className="w-3.5 h-3.5 text-family-accent" />
            <span>Tháng này</span>
          </button>

          <button
            onClick={handleExportMonthCsv}
            className="px-3 py-2 rounded-2xl bg-white border border-family-accent/20 text-xs font-bold text-family-text hover:bg-family-bgDeep transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
            title="Xuất CSV tháng"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Xuất CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-2xl bg-family-accent hover:bg-family-accentHover text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            title="In hoặc Lưu PDF báo cáo"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In / Lưu PDF</span>
          </button>
        </div>
      </div>

      {/* 5 Executive KPI Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 md:gap-4 print:grid-cols-5">
        {/* KPI 1: Income */}
        <div className="glass-panel rounded-2xl p-4 border-l-4 border-l-emerald-500 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-family-textLight">
            <span>Tổng Thu Nhập</span>
            <HelpTooltip text="Toàn bộ thu nhập chủ động từ lương thưởng và thụ động trong tháng." position="bottom" />
          </div>
          <div className="mt-2">
            <span className="text-lg md:text-xl font-bold font-serif text-emerald-700">
              {formatKpiMoneyVNDMillion(totalIncome)}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px]">
            {incomeDiff >= 0 ? (
              <span className="text-emerald-600 flex items-center font-bold">
                <TrendingUp className="w-3 h-3 mr-0.5 inline" /> +{formatTableMoneyVNDMillion(incomeDiff)}
              </span>
            ) : (
              <span className="text-rose-600 flex items-center font-bold">
                <TrendingDown className="w-3 h-3 mr-0.5 inline" /> {formatTableMoneyVNDMillion(incomeDiff)}
              </span>
            )}
            <span className="text-family-textLight text-[10px]">vs tháng trước</span>
          </div>
        </div>

        {/* KPI 2: Actual Expense vs Budget */}
        <div className="glass-panel rounded-2xl p-4 border-l-4 border-l-rose-500 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-family-textLight">
            <span>Chi Tiêu Thực Tế</span>
            <HelpTooltip text="Tổng số tiền đã chi tiêu thực tế trong tháng so với định mức ngân sách quy định." position="bottom" />
          </div>
          <div className="mt-2">
            <span className="text-lg md:text-xl font-bold font-serif text-rose-700">
              {formatKpiMoneyVNDMillion(totalActualExpense)}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="text-family-textLight text-[10px]">Định mức: {formatTableMoneyVNDMillion(budgetExpenseTarget)}</span>
            {expenseDiff !== 0 ? (
              <span className={`text-[10px] font-bold ${expenseDiff > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {expenseDiff > 0 ? `+${formatTableMoneyVNDMillion(expenseDiff)}` : formatTableMoneyVNDMillion(expenseDiff)}
              </span>
            ) : budgetExpenseTarget > 0 ? (
              <span
                className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                  totalActualExpense <= budgetExpenseTarget
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {Math.round((totalActualExpense / budgetExpenseTarget) * 100)}%
              </span>
            ) : null}
          </div>
        </div>

        {/* KPI 3: Net Cash Surplus */}
        <div className="glass-panel rounded-2xl p-4 border-l-4 border-l-blue-500 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-family-textLight">
            <span>Thặng Dư Ròng</span>
            <HelpTooltip text="Số tiền còn lại sau khi trừ toàn bộ chi tiêu và nghĩa vụ nợ (Thu nhập - Chi tiêu - Trả nợ)." position="bottom" />
          </div>
          <div className="mt-2">
            <span
              className={`text-lg md:text-xl font-bold font-serif ${
                cashflowSurplus >= 0 ? 'text-blue-700' : 'text-rose-700'
              }`}
            >
              {formatKpiMoneyVNDMillion(cashflowSurplus)}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-family-textLight">
            {cashflowSurplus >= 0 ? (
              <span className="text-emerald-600 font-bold">Dương dòng tiền</span>
            ) : (
              <span className="text-rose-600 font-bold">Thâm hụt dòng tiền</span>
            )}
          </div>
        </div>

        {/* KPI 4: Savings Rate */}
        <div className="glass-panel rounded-2xl p-4 border-l-4 border-l-teal-500 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-family-textLight">
            <span>Tỷ Lệ Tích Lũy</span>
            <HelpTooltip text="Tỷ lệ thu nhập được đưa vào Tiết kiệm + Đầu tư + Dự phòng tích lũy." position="bottom" />
          </div>
          <div className="mt-2">
            <span className="text-lg md:text-xl font-bold font-serif text-teal-700">
              {formatPercent(savingsRate)}
            </span>
          </div>
          <div className="mt-1 text-[10px] text-family-textLight">
            Mục tiêu tối ưu: <strong className="text-teal-800">≥ 25%</strong>
          </div>
        </div>

        {/* KPI 5: Net Worth */}
        <div className="col-span-2 lg:col-span-1 glass-panel rounded-2xl p-4 border-l-4 border-l-indigo-500 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-family-textLight">
            <span>Tài Sản Ròng</span>
            <HelpTooltip text="Ước tính tổng tài sản tích lũy trừ đi tổng nợ tại thời điểm kết thúc tháng quan sát." position="bottom" />
          </div>
          <div className="mt-2">
            <span className="text-lg md:text-xl font-bold font-serif text-indigo-700">
              {formatKpiMoneyVNDMillion(netWorth)}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px]">
            {netWorthDiff >= 0 ? (
              <span className="text-emerald-600 font-bold flex items-center text-[10px]">
                +{formatTableMoneyVNDMillion(netWorthDiff)}
              </span>
            ) : (
              <span className="text-rose-600 font-bold flex items-center text-[10px]">
                {formatTableMoneyVNDMillion(netWorthDiff)}
              </span>
            )}
            <span className="text-family-textLight text-[10px]">tăng trưởng ròng</span>
          </div>
        </div>
      </div>

      {/* Main Grid: 4 Pillars & Financial Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 4 Pillars Performance */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-3xl border border-family-accent/15 shadow-sm overflow-hidden break-inside-avoid">
            <CardHeader className="pb-3 border-b border-family-accent/10 bg-family-bgDeep/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold font-serif flex items-center gap-2 text-family-text">
                    <span>🏛️</span> Hiệu Suất 4 Trụ Cột Ngân Sách
                  </CardTitle>
                  <HelpTooltip
                    text="So sánh giữa Định Mức Kế Hoạch và Thực Tế Thực Hiện trong tháng của 4 Trụ cột cốt lõi: 1. Chi phí (Đỏ), 2. Đầu tư (Xanh dương), 3. Tiết kiệm (Xanh lá), 4. Dự phòng & Nợ (Vàng hổ phách)."
                    position="bottom"
                  />
                </div>
                <span className="text-xs font-semibold text-family-textLight">
                  Đơn vị: triệu VND
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-5 md:p-6 space-y-6">
              {/* Mini Chart for Pillars */}
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pillarsData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="shortName" tick={{ fontSize: 11, fill: '#4b5563' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#4b5563' }} />
                    <RechartsTooltip
                      formatter={(val: any, name: any) => [
                        formatTableMoneyVNDMillion(Number(val)),
                        name === 'budget' ? 'Định mức' : 'Thực tế',
                      ]}
                      labelFormatter={(label) => `Trụ cột: ${label}`}
                      contentStyle={{ borderRadius: '1rem', fontSize: '12px' }}
                    />
                    <Bar dataKey="budget" name="Định mức" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={22} />
                    <Bar dataKey="actual" name="Thực tế" radius={[4, 4, 0, 0]} barSize={22}>
                      {pillarsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 4 Pillars Details Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {/* Pillar 1: Expense */}
                <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-bold text-rose-900">
                    <span className="flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-rose-600" /> 1. Chi Tiêu Sinh Hoạt
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-rose-200/70 text-rose-800">
                      Đỏ
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between text-xs">
                    <span className="text-slate-600">Thực tế:</span>
                    <strong className="text-sm font-serif text-rose-700">{formatTableMoneyVNDMillion(totalActualExpense)}</strong>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between text-xs text-slate-500">
                    <span>Định mức:</span>
                    <span>{formatTableMoneyVNDMillion(budgetExpenseTarget)}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-rose-200/60 text-[11px] flex justify-between items-center">
                    <span className="text-slate-600">Trạng thái:</span>
                    {totalActualExpense <= budgetExpenseTarget ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Tiết kiệm {formatTableMoneyVNDMillion(budgetExpenseTarget - totalActualExpense)}
                      </span>
                    ) : (
                      <span className="text-rose-700 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Vượt {formatTableMoneyVNDMillion(totalActualExpense - budgetExpenseTarget)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Pillar 2: Investment */}
                <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                    <span className="flex items-center gap-1.5">
                      <LineChart className="w-4 h-4 text-blue-600" /> 2. Đầu Tư Tăng Trưởng
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-200/70 text-blue-800">
                      Xanh Dương
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between text-xs">
                    <span className="text-slate-600">Rót vốn tháng:</span>
                    <strong className="text-sm font-serif text-blue-700">{formatTableMoneyVNDMillion(totalInvested)}</strong>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between text-xs text-slate-500">
                    <span>Định mức:</span>
                    <span>{formatTableMoneyVNDMillion(budgetInvestTarget)}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-blue-200/60 text-[11px] flex justify-between items-center text-slate-600">
                    <span>Thương vụ đầu tư:</span>
                    <span className="font-bold text-blue-900">
                      {state.investmentDeals?.filter((d) => d.status === 'active').length || 0} đang kích hoạt
                    </span>
                  </div>
                </div>

                {/* Pillar 3: Savings */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                    <span className="flex items-center gap-1.5">
                      <PiggyBank className="w-4 h-4 text-emerald-600" /> 3. Tiết Kiệm & Tích Lũy
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-200/70 text-emerald-800">
                      Xanh Lá
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between text-xs">
                    <span className="text-slate-600">Tích lũy tháng:</span>
                    <strong className="text-sm font-serif text-emerald-700">{formatTableMoneyVNDMillion(totalSaved)}</strong>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between text-xs text-slate-500">
                    <span>Định mức:</span>
                    <span>{formatTableMoneyVNDMillion(budgetSavingTarget)}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-emerald-200/60 text-[11px] flex justify-between items-center text-slate-600">
                    <span>Quỹ Sinking Funds:</span>
                    <span className="font-bold text-emerald-900">
                      {sinkingFundsStatus.length} quỹ đang tích lũy
                    </span>
                  </div>
                </div>

                {/* Pillar 4: Reserves & Debts */}
                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                    <span className="flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-amber-600" /> 4. Dự Phòng & Trả Nợ
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-800">
                      Hổ Phách
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between text-xs">
                    <span className="text-slate-600">Trả nợ tháng:</span>
                    <strong className="text-sm font-serif text-amber-800">{formatTableMoneyVNDMillion(debtPaid)}</strong>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between text-xs text-slate-500">
                    <span>Định mức dự phòng:</span>
                    <span>{formatTableMoneyVNDMillion(budgetReserveTarget)}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-amber-200/60 text-[11px] flex justify-between items-center text-slate-600">
                    <span>Thanh khoản còn lại:</span>
                    <span className="font-bold text-amber-900">
                      {formatTableMoneyVNDMillion(projRow?.liquidityMonthly || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Expenses Breakdown */}
          <Card className="rounded-3xl border border-family-accent/15 shadow-sm overflow-hidden break-inside-avoid">
            <CardHeader className="pb-3 border-b border-family-accent/10 bg-family-bgDeep/40">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold font-serif flex items-center gap-2 text-family-text">
                  <span>🛒</span> Top 5 Hạng Mục Chi Tiêu Lớn Nhất Trong Tháng
                </CardTitle>
                <HelpTooltip
                  text="Những khoản chi tiêu chiếm tỷ trọng lớn nhất của gia đình trong tháng quan sát này."
                  position="bottom"
                />
              </div>
            </CardHeader>
            <CardContent className="p-5 md:p-6">
              {topExpenseCategories.length > 0 ? (
                <div className="space-y-3.5">
                  {topExpenseCategories.map((item, idx) => {
                    const pct = totalActualExpense > 0 ? Math.round((item.amount / totalActualExpense) * 100) : 0;
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-family-text flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-family-accent/15 text-family-accent flex items-center justify-center text-[10px] font-bold">
                              {idx + 1}
                            </span>
                            {item.name}
                          </span>
                          <span className="font-mono font-bold text-slate-700">
                            {formatTableMoneyVNDMillion(item.amount)} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-family-accent h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-family-textLight">
                  Chưa ghi nhận dữ liệu danh mục chi tiết cho tháng này.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Health Score, AI Twin Advice, Sinking Funds */}
        <div className="space-y-6">
          {/* Financial Health Score */}
          <Card className="rounded-3xl border border-family-accent/15 shadow-sm overflow-hidden break-inside-avoid">
            <CardHeader className="pb-3 border-b border-family-accent/10 bg-family-bgDeep/40">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold font-serif flex items-center gap-2 text-family-text">
                  <Award className="w-5 h-5 text-amber-500" /> Sức Khỏe Tài Chính Tháng
                </CardTitle>
                <HelpTooltip
                  text="Chỉ số đánh giá độ an toàn tài chính (0-100 điểm) dựa trên tỷ lệ chi tiêu/thu nhập, đòn bẩy nợ, tỷ lệ tích lũy và đệm thanh khoản dự phòng."
                  position="bottom"
                />
              </div>
            </CardHeader>
            <CardContent className="p-5 md:p-6 text-center space-y-4">
              <div className="relative inline-flex items-center justify-center">
                <div className="w-28 h-28 rounded-full border-4 border-slate-100 flex flex-col items-center justify-center bg-radial from-white to-slate-50 shadow-inner">
                  <span
                    className={`text-3xl font-extrabold font-serif ${
                      healthScore >= 80
                        ? 'text-emerald-600'
                        : healthScore >= 65
                        ? 'text-blue-600'
                        : healthScore >= 50
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {healthScore}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    / 100 điểm
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="font-bold text-sm text-family-text font-serif">
                  {healthScore >= 80
                    ? 'Xuất sắc & Bền vững 🎉'
                    : healthScore >= 65
                    ? 'Ổn định & An toàn 👍'
                    : healthScore >= 50
                    ? 'Cần Chú Ý Chi Tiêu ⚠️'
                    : 'Báo Động Dòng Tiền 🚨'}
                </div>
                <p className="text-xs text-family-textLight leading-relaxed">
                  {healthScore >= 80
                    ? 'Gia đình kiểm soát chi tiêu rất chặt chẽ và dòng tiền tích lũy tăng trưởng tốt.'
                    : healthScore >= 65
                    ? 'Cơ cấu tài chính đang vận hành tốt, tiếp tục duy trì tỷ lệ tích lũy này.'
                    : healthScore >= 50
                    ? 'Khoản chi tiêu sinh hoạt đang chiếm tỷ trọng khá cao trong thu nhập tháng.'
                    : 'Cần xem xét cắt giảm các chi phí không cần thiết để tạo đệm dự phòng an toàn.'}
                </p>
              </div>

              {/* AI Family Copilot Insight Memo */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-left space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                  <HeartHandshake className="w-4 h-4 text-indigo-600" />
                  <span>Lời Khuyên Của Trợ Lý Gia Đình</span>
                </div>
                <p className="text-xs text-indigo-900 leading-relaxed">
                  {cashflowSurplus > 0
                    ? `Tháng này hai vợ chồng tạo ra thặng dư ${formatTableMoneyVNDMillion(
                        cashflowSurplus
                      )}. Hãy ưu tiên nạp đầy các Quỹ Mục tiêu hoặc phân bổ vào danh mục đầu tư tích sản dài hạn nhé!`
                    : `Tháng này dòng tiền bị thâm hụt ${formatTableMoneyVNDMillion(
                        Math.abs(cashflowSurplus)
                      )}. Hai vợ chồng hãy ngồi lại cùng nhau rà soát lại các khoản chi đột xuất để cân đối cho tháng sau nhé!`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sinking Funds Summary */}
          <Card className="rounded-3xl border border-family-accent/15 shadow-sm overflow-hidden break-inside-avoid">
            <CardHeader className="pb-3 border-b border-family-accent/10 bg-family-bgDeep/40">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold font-serif flex items-center gap-2 text-family-text">
                  <PiggyBank className="w-5 h-5 text-emerald-600" /> Tiến Độ Quỹ Mục Tiêu (Sinking Funds)
                </CardTitle>
                <HelpTooltip
                  text="Số dư và tiến độ tích lũy của các quỹ mục tiêu gia đình tại tháng quan sát này."
                  position="bottom"
                />
              </div>
            </CardHeader>
            <CardContent className="p-5 md:p-6 space-y-3.5">
              {sinkingFundsStatus.length > 0 ? (
                sinkingFundsStatus.slice(0, 4).map((fund) => (
                  <div key={fund.id} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-family-text">{fund.name}</span>
                      <span className="font-mono text-slate-600">
                        {formatTableMoneyVNDMillion(fund.currentBal)} / {formatTableMoneyVNDMillion(fund.targetAmount)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${fund.progress}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-family-textLight">
                  Chưa có quỹ tích lũy mục tiêu nào được kích hoạt.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Print Signature Footer (Only visible on print) */}
      <div className="hidden print:flex items-center justify-between pt-12 border-t border-gray-300 text-xs text-gray-600">
        <div className="space-y-1 text-center">
          <p className="font-bold">Người Lập Báo Cáo</p>
          <p className="italic text-gray-500 pt-8">(Ký và ghi rõ họ tên)</p>
        </div>
        <div className="space-y-1 text-center">
          <p className="font-bold">Vợ / Chồng Đồng Thuận</p>
          <p className="italic text-gray-500 pt-8">(Ký và ghi rõ họ tên)</p>
        </div>
      </div>
    </div>
  );
};
