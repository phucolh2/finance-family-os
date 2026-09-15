import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { WarningBox } from '../components/ui/WarningBox';
import { calculateHealthDefense } from '../engines/healthEngine';
import { formatKpiMoneyVNDMillion, formatAxisMoneyVNDMillion, formatTooltipMoneyVNDMillion } from '../utils/format';
import { safeNumber } from '../utils/math';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Shield, HeartPulse, ShieldAlert } from 'lucide-react';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import { useAppContext } from '../context/AppContext';

export const HealthAndFinalRest: React.FC = () => {
  const { state, updateToolConfig } = useAppContext();
  const config = state.toolConfigs?.healthSimulator || {};

  const [medicalInflationRate, setMedicalInflationRate] = useState(config.medicalInflationRate ?? 6);
  const [criticalIllnessReserveTarget, setCriticalIllnessReserveTarget] = useState(config.criticalIllnessReserveTarget ?? 500);
  const [healthFundCap, setHealthFundCap] = useState(config.healthFundCap ?? 300);
  const [liquidityFundCap, setLiquidityFundCap] = useState(config.liquidityFundCap ?? 100);
  const [finalRestCostToday, setFinalRestCostToday] = useState(config.finalRestCostToday ?? 150);
  const [finalRestInflationRate, setFinalRestInflationRate] = useState(config.finalRestInflationRate ?? 5);
  const [insuranceMonthly] = useState(config.insuranceMonthly ?? 2.0);
  const [bhytMonthly] = useState(config.bhytMonthly ?? 0.2);
  const [currentHealthFund, setCurrentHealthFund] = useState(config.currentHealthFund ?? 150);
  const [monthlyContribution, setMonthlyContribution] = useState(config.monthlyContribution ?? 5.0);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      updateToolConfig('healthSimulator', {
        medicalInflationRate, criticalIllnessReserveTarget, healthFundCap, liquidityFundCap,
        finalRestCostToday, finalRestInflationRate, insuranceMonthly, bhytMonthly, currentHealthFund, monthlyContribution
      });
    }, 500);
    return () => clearTimeout(handler);
  }, [medicalInflationRate, criticalIllnessReserveTarget, healthFundCap, liquidityFundCap, finalRestCostToday, finalRestInflationRate, insuranceMonthly, bhytMonthly, currentHealthFund, monthlyContribution]);

  // Run healthEngine dynamically (pure function call)
  const healthResult = calculateHealthDefense({
    medicalInflationRate,
    healthFundCap,
    liquidityFundCap,
    criticalIllnessReserveTarget,
    finalRestCostToday,
    finalRestInflationRate,
    insuranceMonthly,
    bhytMonthly,
    currentHealthFund,
    monthlyContribution,
  });

  // Prepare chart data comparing costs today vs inflated future costs
  const chartData = [
    {
      name: 'Viện phí bệnh hiểm nghèo',
      'Chi phí hôm nay': criticalIllnessReserveTarget,
      'Chi phí tương lai (10 năm sau)': Math.round(healthResult.projectedMedicalCostFuture),
    },
    {
      name: 'Chi phí hậu sự',
      'Chi phí hôm nay': finalRestCostToday,
      'Chi phí tương lai (30 năm sau)': Math.round(healthResult.projectedFinalRestCostFuture),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-family-text flex items-center gap-3">
            <HeartPulse className="w-8 h-8 text-red-600 animate-pulse" /> Dự phòng Y tế & Hậu sự
            <HelpTooltip text="Công cụ mô phỏng độc lập. Các thông số ở đây chỉ dùng để tính toán thử nghiệm, hoàn toàn không làm thay đổi hay ảnh hưởng đến Dòng tiền hiện tại của dự án." />
          </h1>
          <p className="text-sm text-family-textMuted mt-1">
            Mô phỏng tấm khiên tài chính bảo vệ gia đình trước các rủi ro sức khỏe lớn và sự kiện cuối đời.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card isKpi className="border-l-red-500">
          <CardHeader className="p-4">
            <CardDescription className="uppercase font-bold text-[10px]">Điểm Readiness Score</CardDescription>
            <CardTitle className="text-xl mt-1 text-red-700 font-bold">{healthResult.readinessScore.toFixed(0)}%</CardTitle>
          </CardHeader>
        </Card>

        <Card isKpi className="border-l-family-accent">
          <CardHeader className="p-4">
            <CardDescription className="uppercase font-bold text-[10px]">Quỹ phòng vệ cần thiết</CardDescription>
            <CardTitle className="text-xl mt-1">{formatKpiMoneyVNDMillion(healthResult.requiredHealthFund)}</CardTitle>
          </CardHeader>
        </Card>

        <Card isKpi className="border-l-green">
          <CardHeader className="p-4">
            <CardDescription className="uppercase font-bold text-[10px]">Số dư quỹ hiện tại</CardDescription>
            <CardTitle className="text-xl mt-1">{formatKpiMoneyVNDMillion(healthResult.currentHealthFund)}</CardTitle>
          </CardHeader>
        </Card>

        <Card isKpi className="border-l-teal">
          <CardHeader className="p-4">
            <CardDescription className="uppercase font-bold text-[10px]">Thời gian đạt mục tiêu</CardDescription>
            <CardTitle className="text-xl mt-1">
              {healthResult.yearsToReach === 0 
                ? 'Đã đạt hạn mức' 
                : healthResult.yearsToReach === 999 
                ? 'Vô hạn' 
                : `${healthResult.yearsToReach.toFixed(1)} năm`}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Warnings & Notes */}
      <div className="space-y-2">
        {healthResult.warnings.map((w, idx) => (
          <WarningBox key={idx} type="warning" message={w} />
        ))}
        {healthResult.notes.map((n, idx) => (
          <WarningBox key={idx} type="info" message={n} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parameters input card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" /> Thiết lập lá chắn phòng vệ
            </CardTitle>
            <CardDescription>Điều chỉnh các thông số sức khỏe và quỹ để chạy mô phỏng tức thì.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                label="Mục tiêu điều trị bệnh hiểm nghèo"
                type="number"
                suffix="triệu VND"
                value={criticalIllnessReserveTarget}
                onChange={(e) => { setCriticalIllnessReserveTarget(safeNumber(Number(e.target.value))); }}
              />
              <Input
                label="Hạn mức quỹ y tế (Cap)"
                type="number"
                suffix="triệu VND"
                value={healthFundCap}
                onChange={(e) => { setHealthFundCap(safeNumber(Number(e.target.value))); }}
              />
              <Input
                label="Hạn mức thanh khoản khẩn cấp (Cap)"
                type="number"
                suffix="triệu VND"
                value={liquidityFundCap}
                onChange={(e) => { setLiquidityFundCap(safeNumber(Number(e.target.value))); }}
              />
              <Input
                label="Số dư quỹ phòng vệ y tế hiện tại"
                type="number"
                suffix="triệu VND"
                value={currentHealthFund}
                onChange={(e) => { setCurrentHealthFund(safeNumber(Number(e.target.value))); }}
              />
              <Input
                label="Đóng góp tiết kiệm hàng tháng"
                type="number"
                suffix="triệu VND/tháng"
                value={monthlyContribution}
                onChange={(e) => { setMonthlyContribution(safeNumber(Number(e.target.value))); }}
              />
              <Input
                label="Chi phí hậu sự (Mức hôm nay)"
                type="number"
                suffix="triệu VND"
                value={finalRestCostToday}
                onChange={(e) => { setFinalRestCostToday(safeNumber(Number(e.target.value))); }}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Lạm phát y tế/năm"
                  type="number"
                  suffix="%"
                  value={medicalInflationRate}
                  onChange={(e) => { setMedicalInflationRate(safeNumber(Number(e.target.value))); }}
                />
                <Input
                  label="Lạm phát dịch vụ hậu sự"
                  type="number"
                  suffix="%"
                  value={finalRestInflationRate}
                  onChange={(e) => { setFinalRestInflationRate(safeNumber(Number(e.target.value))); }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Future Cost Inflation comparison Chart */}
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <div>
            <CardHeader>
              <CardTitle>Biểu đồ so sánh chi phí tương lai</CardTitle>
              <CardDescription>Mô phỏng gia tăng chi phí y tế và hậu sự do ảnh hưởng kép của lạm phát chuyên biệt.</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(125, 83, 45, 0.08)" />
                  <XAxis dataKey="name" stroke="#6f5d50" fontSize={10} />
                  <YAxis stroke="#6f5d50" fontSize={10} tickFormatter={(v) => formatAxisMoneyVNDMillion(v)} />
                  <Tooltip formatter={(value: any) => formatTooltipMoneyVNDMillion(value as number)} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="Chi phí hôm nay" fill="#6f5d50" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Chi phí tương lai (10 năm sau)" fill="#dc2626" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Chi phí tương lai (30 năm sau)" fill="#7c2d12" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </div>

          <CardContent className="pt-0">
            <div className="p-3.5 bg-red-50/50 border border-red-200/60 rounded-2xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h5 className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Tuyên bố miễn trách nhiệm y khoa & đầu tư</h5>
                <p className="text-[10px] text-red-700/80 leading-relaxed">
                  LƯU Ý: Đây hoàn toàn là mô phỏng dự phòng tài chính dựa trên dữ liệu thống kê giả định của người dùng. Hệ điều hành này không cung cấp lời khuyên y tế, chẩn đoán bệnh lý, định hướng điều trị y khoa hay cam kết bảo hiểm sinh mạng chắc chắn. Vui lòng tham khảo các chuyên gia y tế và bảo hiểm được cấp phép khi đưa ra quyết định thực tế.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
