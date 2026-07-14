import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { WarningBox } from '../components/ui/WarningBox';
import { EmptyState } from '../components/ui/EmptyState';
import { runProjection } from '../engines/projectionEngine';
import { calculateFire } from '../engines/fireEngine';
import { runMonteCarlo } from '../engines/monteCarloEngine';
import {
  formatKpiMoneyVNDMillion,
  formatTooltipMoneyVNDMillion,
  formatAxisMoneyVNDMillion,
} from '../utils/format';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Flame, ShieldAlert, Sparkles, BookOpen, Play, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { MonteCarloOutput } from '../engines/monteCarloEngine';
import { HelpTooltip } from '../components/ui/HelpTooltip';

export const FireCenter: React.FC = () => {
  const { state } = useAppContext();

  // Run base projection dynamically (pure engine call)
  const projection = runProjection({
    profile: state.profile,
    incomeSchedule: state.incomeSchedule,
    budgetSchedule: state.budgetSchedule,
    lifeEvents: state.lifeEvents,
    assets: state.assets,
    assumptions: state.assumptions,
    investmentDeals: state.investmentDeals,
    savingsDeposits: state.savingsDeposits,
    projectionAdjustments: state.projectionAdjustments,
    lifeStages: state.lifeStages,
  });

  const hasData = projection.monthlyRows.length > 0;
  const startRow = hasData ? projection.monthlyRows[0] : null;

  const currentExpenses = startRow ? startRow.expensesMonthly : 0;
  const currentNetWorth = startRow ? startRow.nominalNetWorth : 0;

  // Run basic fireEngine on start state
  const fireResult = calculateFire({
    expensesMonthly: currentExpenses,
    netWorth: currentNetWorth,
    withdrawalRate: 4,
    yearlyRows: projection.yearlyRows,
  });

  // Local state for Monte Carlo simulation
  const [mcResult, setMcResult] = useState<MonteCarloOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRunMonteCarlo = () => {
    setIsLoading(true);
    // Timeout of 200ms to allow rendering the spinner for a premium feel
    setTimeout(() => {
      try {
        const res = runMonteCarlo({
          baseState: state,
          simulationCount: 1000,
        });
        setMcResult(res);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }, 200);
  };

  const chartData = projection.yearlyRows.map((row) => ({
    year: `${row.year}`,
    'Tài sản ròng tích lũy': Math.round(row.nominalNetWorth),
    'Mục tiêu FIRE': Math.round(row.fireTarget),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-family-text flex items-center gap-3">
            <Flame className="w-8 h-8 text-family-accent animate-pulse" /> FIRE Center
            <HelpTooltip text="Lộ trình tự do tài chính và giả lập thị trường Monte Carlo 1,000 lần thử ngẫu nhiên dưới biến động." />
          </h1>
          <p className="text-sm text-family-textMuted mt-1">
            Điểm tựa hoạch định tự do tài chính (Financial Independence, Retire Early) và giả lập rủi ro biến động.
          </p>
        </div>
      </div>

      {/* KPI Matrix */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card isKpi className="border-l-family-accent">
          <CardHeader className="p-4">
            <CardDescription className="uppercase font-bold text-[10px]">Chi phí năm ước tính</CardDescription>
            <CardTitle className="text-lg mt-1">{formatKpiMoneyVNDMillion(currentExpenses * 12)}</CardTitle>
          </CardHeader>
        </Card>

        <Card isKpi className="border-l-green">
          <CardHeader className="p-4">
            <CardDescription className="uppercase font-bold text-[10px]">Mục tiêu tự do (FIRE)</CardDescription>
            <CardTitle className="text-lg mt-1">{formatKpiMoneyVNDMillion(fireResult.fireTarget)}</CardTitle>
          </CardHeader>
        </Card>

        <Card isKpi className="border-l-purple">
          <CardHeader className="p-4">
            <CardDescription className="uppercase font-bold text-[10px]">Tài sản tích lũy hiện tại</CardDescription>
            <CardTitle className="text-lg mt-1">{formatKpiMoneyVNDMillion(currentNetWorth)}</CardTitle>
          </CardHeader>
        </Card>

        <Card isKpi className="border-l-teal">
          <CardHeader className="p-4">
            <CardDescription className="uppercase font-bold text-[10px]">Tiến trình đạt được</CardDescription>
            <CardTitle className="text-lg mt-1">{fireResult.fireProgress.toFixed(1)}%</CardTitle>
          </CardHeader>
        </Card>

        <Card isKpi className="border-l-yellow-600 col-span-2 md:col-span-1">
          <CardHeader className="p-4">
            <CardDescription className="uppercase font-bold text-[10px]">Năm tự do dự kiến (Danh nghĩa)</CardDescription>
            <CardTitle className="text-lg mt-1 text-purple-800 font-bold">
              {fireResult.expectedFireYear ? `Năm ${fireResult.expectedFireYear}` : 'Chưa đạt mốc'}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Reallocation Note or Gap Warning */}
      {fireResult.fireGap > 0 && !fireResult.expectedFireYear && (
        <WarningBox
          type="warning"
          message={`Gia đình còn thiếu ${formatKpiMoneyVNDMillion(fireResult.fireGap)} để đạt tự do tài chính. Chưa tìm thấy mốc giao cắt trước năm 2060 trong kịch bản cơ sở.`}
        />
      )}

      {/* educational rule 4% */}
      <Card className="bg-gradient-to-r from-family-bgDark/30 to-family-bgDeep/15 border-family-accent/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-family-accent" /> Quy tắc 4% (4% Rule) trong Tài chính gia đình
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-family-textMuted leading-relaxed space-y-2">
          <p>
            Quy tắc **4%** (Bắt nguồn từ nghiên cứu nổi tiếng *Trinity Study*) chỉ ra rằng: Bạn có thể rút tối đa **4%** từ tổng tài sản đầu tư tích lũy của mình trong năm đầu tiên nghỉ hưu để chi tiêu, và điều chỉnh số tiền rút này theo tỷ lệ lạm phát hàng năm ở các năm tiếp theo, mà vẫn có xác suất cực cao (**trên 95%**) giữ cho tài sản không bị cạn kiệt trong vòng ít nhất **30 năm**.
          </p>
          <p>
            Công thức tính số vốn tự do tài chính tối thiểu cần có:
            <strong className="block text-family-text mt-1 font-serif text-sm bg-white/70 p-2 rounded-lg border border-family-accent/10 text-center">
              Số vốn FIRE = Chi phí hàng năm / 4% (hoặc Chi phí hàng tháng x 300)
            </strong>
          </p>
        </CardContent>
      </Card>

      {/* Monte Carlo Simulation on-demand cockpit */}
      <Card className="border-family-accent/25 bg-family-bgDark/10">
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">🎲 Giả lập xác suất Monte Carlo (1,000 lần thử)</span>
            <Button
              onClick={handleRunMonteCarlo}
              disabled={isLoading}
              className="gap-2 text-xs"
            >
              {isLoading ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Đang giả lập...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 fill-current" /> Chạy Monte Carlo
                </span>
              )}
            </Button>
          </CardTitle>
          <CardDescription>
            Tự động làm lệch ngẫu nhiên lợi suất của 4 lớp tài sản và tỷ lệ lạm phát hàng năm theo phân phối chuẩn (Gaussian distribution) để đo lường độ an toàn tài chính.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mcResult ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white/80 rounded-2xl border border-family-accent/10 text-center">
                  <div className="text-[10px] uppercase font-bold text-family-textMuted">Tỷ lệ đạt mục tiêu</div>
                  <div className={`text-2xl font-bold mt-1 ${mcResult.probabilityReachFire >= 85 ? 'text-green-700' : mcResult.probabilityReachFire >= 70 ? 'text-family-accent' : 'text-red-600'}`}>
                    {mcResult.probabilityReachFire.toFixed(1)}%
                  </div>
                </div>

                <div className="p-4 bg-white/80 rounded-2xl border border-family-accent/10 text-center">
                  <div className="text-[10px] uppercase font-bold text-family-textMuted">Năm đạt trung vị (Median)</div>
                  <div className="text-xl font-bold mt-1 text-family-text">
                    {mcResult.medianFireYear ? `Năm ${mcResult.medianFireYear}` : '---'}
                  </div>
                </div>

                <div className="p-4 bg-white/80 rounded-2xl border border-family-accent/10 text-center">
                  <div className="text-[10px] uppercase font-bold text-family-textMuted">Mốc sớm nhất (P10)</div>
                  <div className="text-xl font-bold mt-1 text-green-700">
                    {mcResult.p10FireYear ? `Năm ${mcResult.p10FireYear}` : '---'}
                  </div>
                </div>

                <div className="p-4 bg-white/80 rounded-2xl border border-family-accent/10 text-center">
                  <div className="text-[10px] uppercase font-bold text-family-textMuted">Mốc muộn nhất (P90)</div>
                  <div className="text-xl font-bold mt-1 text-red-600">
                    {mcResult.p90FireYear ? `Năm ${mcResult.p90FireYear}` : '---'}
                  </div>
                </div>
              </div>

              {/* Risk factors and alerts */}
              <div className="space-y-1.5">
                <h5 className="text-[10px] uppercase font-bold text-family-textMuted flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-family-accent" /> Nhận định & Cảnh báo rủi ro (Risk Factors)
                </h5>
                <div className="space-y-1">
                  {mcResult.riskFactors.map((r, idx) => (
                    <div key={idx} className="text-xs text-family-textLight bg-white/50 px-3 py-1.5 rounded-xl border border-family-accent/5 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      <span>{r}</span>
                    </div>
                  ))}
                  {mcResult.riskFactors.length === 0 && (
                    <div className="text-xs text-green-700 bg-green-50/40 px-3 py-1.5 rounded-xl border border-green-200/50">
                      Tất cả các tham số giả lập đều cho kết quả cực kỳ an toàn, rủi ro cạn kiệt tài sản rất thấp.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-family-textMuted border border-dashed border-family-accent/15 rounded-2xl">
              Vui lòng nhấn nút **Chạy Monte Carlo** để thực hiện 1,000 lần mô phỏng ngẫu nhiên biến động thị trường.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart Section */}
      <Card>
        <CardHeader>
          <CardTitle>Biểu đồ lộ trình tiến tới Tự do tài chính (Base case)</CardTitle>
          <CardDescription>
            Điểm giao cắt giữa Tài sản ròng tích lũy danh nghĩa và Hạn mức mục tiêu tự do (FIRE Target Line) theo thời gian.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 16, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(125, 83, 45, 0.08)" />
                <XAxis dataKey="year" stroke="#6f5d50" fontSize={10} />
                <YAxis stroke="#6f5d50" fontSize={10} tickFormatter={formatAxisMoneyVNDMillion} />
                <Tooltip formatter={(value) => formatTooltipMoneyVNDMillion(value)} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="Tài sản ròng tích lũy" stroke="#d97706" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="Mục tiêu FIRE" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
