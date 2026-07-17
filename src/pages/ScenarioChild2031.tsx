import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { WarningBox } from '../components/ui/WarningBox';
import { calculateChildCost } from '../engines/childEngine';
import { formatTableMoneyVNDMillion, formatKpiMoneyVNDMillion } from '../utils/format';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Baby, GraduationCap, Coins } from 'lucide-react';
import type { TimelinePeriod } from '../types/finance';

export const ScenarioChild2031: React.FC = () => {
  const { state } = useAppContext();

  const birthMonth = 10;
  const birthYear = 2031;

  // 1. Calculate dynamic child cost timeline from age 0 to 22
  const childAgeRange = Array.from({ length: 23 }, (_, i) => i); // 0 to 22
  
  const childCostData = childAgeRange.map((age) => {
    // Generate a mock period for this age (using month 10 of birthYear + age)
    const mockPeriod: TimelinePeriod = {
      index: age * 12,
      key: `${birthYear + age}-10`,
      month: birthMonth,
      year: birthYear + age,
      husbandAge: state.profile.husbandAgeAtStart + (birthYear - state.profile.planningStartYear) + age,
      wifeAge: state.profile.wifeAgeAtStart + (birthYear - state.profile.planningStartYear) + age,
    };

    const cost = calculateChildCost({
      period: mockPeriod,
      childBirthMonth: birthMonth,
      childBirthYear: birthYear,
      lifestyle: 'premium',
      budgetCapMonthly: 35,
      educationInflationAnnual: state.assumptions.educationInflationRateAnnual,
      healthInflationAnnual: state.assumptions.medicalInflationRateAnnual,
      generalInflationAnnual: state.assumptions.generalInflationRateAnnual,
    });

    return {
      age,
      year: birthYear + age,
      'Chi phí tháng': Math.round(cost.totalMonthly),
      'Chi phí năm': Math.round(cost.totalYearly),
      food: cost.food,
      education: cost.education,
      englishSkills: cost.englishSkills,
      healthcare: cost.healthcare,
      clothesSupplies: cost.clothesSupplies,
      travelExperience: cost.travelExperience,
      universityFund: cost.universityFund,
      postGradSupport: cost.postGradSupport,
      notes: cost.notes.join(' '),
    };
  });

  // Calculate cumulative child cost up to age 22 (exclusive of age 23)
  const totalCumulativeCost = childCostData.reduce((sum, item) => sum + item['Chi phí năm'], 0);

  // University cost at age 18-21
  const universityTotal = childCostData
    .filter((d) => d.age >= 18 && d.age <= 21)
    .reduce((sum, item) => sum + item['Chi phí năm'], 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-family-text">Kịch bản có con 2031</h1>
          <p className="text-sm text-family-textMuted mt-1">
            Kế hoạch chuẩn bị và phân tách chi phí nuôi con sinh năm Tân Hợi (10/2031) đến tuổi trưởng thành.
          </p>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card isKpi className="border-l-family-accent">
          <CardHeader>
            <CardDescription className="uppercase tracking-wider font-bold text-xs flex items-center gap-1.5">
              <Baby className="w-4 h-4 text-family-accent" /> Mốc sinh con dự kiến
            </CardDescription>
            <CardTitle className="text-xl mt-1">Tháng 10/2031</CardTitle>
          </CardHeader>
        </Card>

        <Card isKpi className="border-l-green">
          <CardHeader>
            <CardDescription className="uppercase tracking-wider font-bold text-xs flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-green-700" /> Tổng chi nuôi con (0-22 tuổi)
            </CardDescription>
            <CardTitle className="text-xl mt-1">{formatKpiMoneyVNDMillion(totalCumulativeCost)}</CardTitle>
          </CardHeader>
        </Card>

        <Card isKpi className="border-l-purple">
          <CardHeader>
            <CardDescription className="uppercase tracking-wider font-bold text-xs flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-purple-700" /> Tổng chi phí Đại Học (18-21 tuổi)
            </CardDescription>
            <CardTitle className="text-xl mt-1">{formatKpiMoneyVNDMillion(universityTotal)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <WarningBox
        type="info"
        message="Giả định mặc định nuôi con theo lối sống Cao vừa phải (Premium), đã tính gộp tỷ lệ lạm phát giáo dục & y tế 6%/năm và lạm phát chung 4%/năm. Tổng chi phí tháng được khống chế ở trần 35 triệu/tháng."
      />

      {/* Chart Child Cost Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Biểu đồ Chi phí nuôi con theo tuổi</CardTitle>
          <CardDescription>Biến động chi phí hàng tháng qua các cấp học và đại học (Đã điều chỉnh lạm phát).</CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={childCostData} margin={{ top: 16, right: 30, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(125, 83, 45, 0.08)" />
              <XAxis dataKey="age" stroke="#6f5d50" fontSize={10} label={{ value: 'Tuổi con', position: 'insideBottom', offset: -10, fontSize: 10 }} />
              <YAxis stroke="#6f5d50" fontSize={10} label={{ value: 'Triệu đồng / tháng', angle: -90, position: 'insideLeft', offset: 10, fontSize: 10 }} />
              <Tooltip formatter={(value) => `${value} tr VND`} />
              <Area type="monotone" dataKey="Chi phí tháng" stroke="#d97706" fillOpacity={1} fill="url(#colorCost)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Child cost breakdown table */}
      <Card>
        <CardHeader>
          <CardTitle>Chi tiết phân rã chi phí nuôi con hàng năm</CardTitle>
          <CardDescription>
            Định mức chi tiêu hàng tháng cho từng cấu phần chi tiết (Đơn vị: Tr VND/tháng).
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-family-accent/10 text-family-textMuted font-bold bg-family-bgDark/30">
                <th className="p-3">Tuổi</th>
                <th className="p-3">Năm</th>
                <th className="p-3">Ăn uống / Tã sữa</th>
                <th className="p-3">Học tập / Bán trú</th>
                <th className="p-3">Ngoại ngữ / Kỹ năng</th>
                <th className="p-3">Y tế / Bảo hiểm</th>
                <th className="p-3">Du lịch / Trải nghiệm</th>
                <th className="p-3">Lập nghiệp (Sau ĐH)</th>
                <th className="p-3 text-right bg-family-bgDark/40">Tổng cộng/tháng</th>
                <th className="p-3 text-right">Tổng cộng/năm</th>
              </tr>
            </thead>
            <tbody>
              {childCostData.map((d) => (
                <tr key={d.age} className="border-b border-family-accent/5 hover:bg-family-bgDark/10">
                  <td className="p-3 font-bold text-family-text">{d.age} tuổi</td>
                  <td className="p-3 text-family-textMuted">{d.year}</td>
                  <td className="p-3">{d.food.toFixed(1)}</td>
                  <td className="p-3">{d.education.toFixed(1)}</td>
                  <td className="p-3">{d.englishSkills.toFixed(1)}</td>
                  <td className="p-3">{d.healthcare.toFixed(1)}</td>
                  <td className="p-3">{d.travelExperience.toFixed(1)}</td>
                  <td className="p-3">{d.postGradSupport.toFixed(1)}</td>
                  <td className="p-3 text-right font-bold text-family-accent bg-family-bgDark/20">
                    {d['Chi phí tháng']} tr
                  </td>
                  <td className="p-3 text-right font-semibold">
                    {formatTableMoneyVNDMillion(d['Chi phí năm'])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};
