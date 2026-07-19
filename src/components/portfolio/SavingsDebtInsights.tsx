import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ReferenceLine, ComposedChart, Line, Legend } from 'recharts';
import { ShieldCheck, Zap, Goal } from 'lucide-react';
import { formatMoneyVNDMillion } from '../../utils/format';
import type { ProjectionMonthlyRow } from '../../types/projection';
import { HelpTooltip } from '../ui/HelpTooltip';
import { safeNumber } from '../../utils/math';

interface SavingsDebtInsightsProps {
  projectionData: ProjectionMonthlyRow[];
}

export const SavingsDebtInsights: React.FC<SavingsDebtInsightsProps> = ({ projectionData }) => {
  const chartData = useMemo(() => {
    return projectionData.map((row) => {
      return {
        key: row.period.key,
        year: row.period.year,
        month: row.period.month,
        // Dữ liệu cho Bức tranh "Thoát nợ"
        totalDebtPrincipal: safeNumber(row._totalDebtPrincipalRemaining, 0),
        totalDefenseSavings: safeNumber(row.portfolio.defenseSavingsBalance, 0) + safeNumber(row.portfolio.savingsBalance, 0) + safeNumber(row.savingBalance, 0) + safeNumber(row.debtReserveBalance, 0),
        netDefenseValue: (safeNumber(row.portfolio.defenseSavingsBalance, 0) + safeNumber(row.portfolio.savingsBalance, 0) + safeNumber(row.savingBalance, 0) + safeNumber(row.debtReserveBalance, 0)) - safeNumber(row._totalDebtPrincipalRemaining, 0),
        // Dữ liệu dòng máu lãi suất
        monthlyDebtInterest: -safeNumber(row._totalDebtInterestPaidMonthly, 0), // Âm để vẽ xuống dưới
        cumulativeAccrued: safeNumber(row.portfolio.defenseSavingsInterestAccrued, 0) + safeNumber(row.portfolio.savingsInterestAccrued, 0),
      };
    });
  }, [projectionData]);

  // Cần tính Delta cho cumulativeAccrued để ra monthlySavingInterest
  const enrichedChartData = useMemo(() => {
    return chartData.map((row, index) => {
      let monthlySavingInterest = 0;
      if (index === 0) {
        monthlySavingInterest = row.cumulativeAccrued;
      } else {
        const prev = chartData[index - 1].cumulativeAccrued;
        // Nếu cumulative giảm (do đáo hạn), monthly lãi có thể là 0 hoặc sai lệch, tạm dùng max(0)
        monthlySavingInterest = Math.max(0, row.cumulativeAccrued - prev);
      }
      return { ...row, monthlySavingInterest };
    });
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-family-bgDeep border border-family-accent/20 p-3 rounded-lg shadow-lg">
          <p className="font-semibold text-family-text mb-2 text-sm">{label}</p>
          {payload.map((p: any, i: number) => (
            <div key={i} className="flex items-center gap-2 text-xs mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-family-textMuted">{p.name}:</span>
              <span className="font-bold text-family-text" style={{ color: p.color }}>
                {formatMoneyVNDMillion(Math.abs(p.value))}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Find the exact month where netDefenseValue crosses 0 (Debt Free Horizon)
  const debtFreeIndex = enrichedChartData.findIndex(d => d.netDefenseValue > 0 && d.totalDebtPrincipal > 0);
  const debtFreeTarget = debtFreeIndex !== -1 ? enrichedChartData[debtFreeIndex] : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Biểu đồ Cán cân Lãi suất */}
        <Card className="border border-family-accent/10 bg-family-bgDeep">
          <CardHeader>
            <CardTitle className="text-base text-family-text flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Cán cân Lãi suất
              <HelpTooltip text="So sánh Lãi thu được từ Tiết kiệm (xanh) và Lãi bị mất đi do vay Nợ (đỏ) theo từng tháng. Nếu phần đỏ lớn hơn, dòng tiền của gia đình đang bị âm lãi suất (Bẫy chuột)." />
            </CardTitle>
            <CardDescription>Dòng chảy lãi suất hàng tháng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={enrichedChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="key" stroke="#888888" fontSize={10} tickFormatter={(val) => val.substring(2)} />
                  <YAxis stroke="#888888" fontSize={10} tickFormatter={(val) => `${val}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={0} stroke="#ffffff50" />
                  <Bar dataKey="monthlySavingInterest" name="Lãi nhận được (Từ Tiết kiệm)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="monthlyDebtInterest" name="Lãi phải trả (Cho Nợ)" fill="#ef4444" radius={[0, 0, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Biểu đồ Hành trình Cắt nợ */}
        <Card className="border border-family-accent/10 bg-family-bgDeep">
          <CardHeader>
            <CardTitle className="text-base text-family-text flex items-center gap-2">
              <Goal className="w-5 h-5 text-emerald-500" />
              Hành trình Cắt nợ (Debt-Free Horizon)
              <HelpTooltip text="Theo dõi tốc độ thanh toán dư nợ gốc so với sự gia tăng của Tiết kiệm phòng thủ. Giao điểm (Net Defense vượt 0) là lúc bạn hoàn toàn tự do nợ nần." />
            </CardTitle>
            <CardDescription>Dự phóng thời điểm Tự do nợ nần</CardDescription>
          </CardHeader>
          <CardContent>
            {debtFreeTarget && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-500">Mục tiêu: Tự do nợ nần vào {debtFreeTarget.month}/{debtFreeTarget.year}</h4>
                  <p className="text-xs text-family-textMuted mt-1">Tại thời điểm này, Tổng Tiết kiệm phòng thủ sẽ vượt mức Dư nợ gốc. Bạn có thể tất toán toàn bộ và chính thức thoát khỏi "Bẫy chuột".</p>
                </div>
              </div>
            )}
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={enrichedChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="key" stroke="#888888" fontSize={10} tickFormatter={(val) => val.substring(2)} />
                  <YAxis stroke="#888888" fontSize={10} tickFormatter={(val) => formatMoneyVNDMillion(val)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Area type="monotone" dataKey="totalDebtPrincipal" name="Dư nợ Gốc" fill="#ef444430" stroke="#ef4444" strokeWidth={2} />
                  <Area type="monotone" dataKey="totalDefenseSavings" name="Tài sản Phòng thủ" fill="#10b98130" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="netDefenseValue" name="Phòng thủ Ròng (Tiết kiệm - Nợ)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <ReferenceLine y={0} stroke="#ffffff50" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};
