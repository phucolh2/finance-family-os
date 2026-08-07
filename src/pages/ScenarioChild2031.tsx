import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { WarningBox } from '../components/ui/WarningBox';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import { calculateChildCost } from '../engines/childEngine';
import { formatTableMoneyVNDMillion, formatKpiMoneyVNDMillion, formatAxisMoneyVNDMillion, formatTooltipMoneyVNDMillion } from '../utils/format';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Baby, GraduationCap, Coins, Settings2 } from 'lucide-react';
import type { TimelinePeriod } from '../types/finance';
import type { ChildLifestyle } from '../types/child';

const LIFESTYLE_OPTIONS: { value: ChildLifestyle; label: string; description: string }[] = [
  { value: 'basic', label: 'Cơ bản', description: 'Trường công, chi phí tối thiểu' },
  { value: 'comfortable', label: 'Thoải mái', description: 'Trường bán công, ngoại ngữ vừa phải' },
  { value: 'premium', label: 'Cao cấp', description: 'Trường tư thục chất lượng cao, ngoại ngữ chuyên sâu' },
  { value: 'international', label: 'Quốc tế', description: 'Trường quốc tế, du học, lối sống cao cấp' },
];

export const ScenarioChild2031: React.FC = () => {
  const { state } = useAppContext();

  // --- Biến số nhập vào (thay vì hardcode) ---
  const [birthMonth, setBirthMonth] = useState<number>(10);
  const [birthYear, setBirthYear] = useState<number>(2031);
  const [lifestyle, setLifestyle] = useState<ChildLifestyle>('premium');
  const [budgetCapMonthly, setBudgetCapMonthly] = useState<number>(35);

  // 1. Calculate dynamic child cost timeline from age 0 to 22
  const childAgeRange = Array.from({ length: 23 }, (_, i) => i); // 0 to 22
  
  const childCostData = childAgeRange.map((age) => {
    const mockPeriod: TimelinePeriod = {
      index: age * 12,
      key: `${birthYear + age}-${String(birthMonth).padStart(2, '0')}`,
      month: birthMonth,
      year: birthYear + age,
      husbandAge: state.profile.husbandAgeAtStart + (birthYear - state.profile.planningStartYear) + age,
      wifeAge: state.profile.wifeAgeAtStart + (birthYear - state.profile.planningStartYear) + age,
    };

    const cost = calculateChildCost({
      period: mockPeriod,
      childBirthMonth: birthMonth,
      childBirthYear: birthYear,
      lifestyle,
      budgetCapMonthly,
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

  const totalCumulativeCost = childCostData.reduce((sum, item) => sum + item['Chi phí năm'], 0);
  const universityTotal = childCostData
    .filter((d) => d.age >= 18 && d.age <= 21)
    .reduce((sum, item) => sum + item['Chi phí năm'], 0);

  const selectedLifestyleLabel = LIFESTYLE_OPTIONS.find(o => o.value === lifestyle)?.label || lifestyle;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-family-text flex items-center gap-3">
            Kịch bản Nuôi Con
            <HelpTooltip text="Tùy chỉnh tháng/năm sinh, lối sống, và trần chi phí để mô phỏng tổng chi phí nuôi con từ 0 đến 22 tuổi. Tất cả số liệu đã tính gộp lạm phát theo giả định hệ thống." />
          </h1>
          <p className="text-sm text-family-textMuted mt-1">
            Mô phỏng chi phí nuôi con theo các biến số đầu vào tùy chỉnh — từ sơ sinh đến trưởng thành.
          </p>
        </div>
      </div>

      {/* --- Input Panel --- */}
      <Card className="border-blue-500/20 bg-gradient-to-br from-blue-50/50 to-indigo-50/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-blue-800">
            <Settings2 className="w-5 h-5" /> Biến số đầu vào
            <HelpTooltip text="Thay đổi các tham số bên dưới để thấy kết quả mô phỏng cập nhật theo thời gian thực." />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Tháng sinh */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Tháng sinh</label>
              <select
                value={birthMonth}
                onChange={e => setBirthMonth(Number(e.target.value))}
                className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>Tháng {m}</option>
                ))}
              </select>
            </div>

            {/* Năm sinh */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Năm sinh</label>
              <input
                type="number"
                value={birthYear}
                onChange={e => setBirthYear(Number(e.target.value))}
                min={2024}
                max={2045}
                className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400"
              />
            </div>

            {/* Lối sống */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Lối sống nuôi con</label>
              <select
                value={lifestyle}
                onChange={e => setLifestyle(e.target.value as ChildLifestyle)}
                className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400"
              >
                {LIFESTYLE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label} — {opt.description}</option>
                ))}
              </select>
            </div>

            {/* Trần chi phí */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Trần chi phí (triệu/tháng)</label>
              <input
                type="number"
                value={budgetCapMonthly}
                onChange={e => setBudgetCapMonthly(Number(e.target.value))}
                min={5}
                max={200}
                step={5}
                className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400"
              />
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-1.5">
            <span>💡</span>
            <span>Lạm phát Giáo dục: <strong>{state.assumptions.educationInflationRateAnnual}%</strong> · Y tế: <strong>{state.assumptions.medicalInflationRateAnnual}%</strong> · Chung: <strong>{state.assumptions.generalInflationRateAnnual}%</strong> (từ Cài đặt Giả định)</span>
          </div>
        </CardContent>
      </Card>

      {/* KPI Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card isKpi className="border-l-family-accent">
          <CardHeader>
            <CardDescription className="uppercase tracking-wider font-bold text-xs flex items-center gap-1.5">
              <Baby className="w-4 h-4 text-family-accent" /> Mốc sinh con dự kiến
            </CardDescription>
            <CardTitle className="text-xl mt-1">Tháng {birthMonth}/{birthYear}</CardTitle>
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
        message={`Giả định nuôi con theo lối sống ${selectedLifestyleLabel}, đã tính gộp tỷ lệ lạm phát giáo dục & y tế ${state.assumptions.educationInflationRateAnnual}%/năm và lạm phát chung ${state.assumptions.generalInflationRateAnnual}%/năm. Tổng chi phí tháng được khống chế ở trần ${budgetCapMonthly} triệu/tháng.`}
      />

      {/* Chart Child Cost Over Time */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Biểu đồ Chi phí nuôi con theo tuổi
            <HelpTooltip text="Biểu đồ area thể hiện chi phí hàng tháng theo từng độ tuổi, bao gồm các chi phí ăn uống, giáo dục, y tế, kỹ năng, và đại học." />
          </CardTitle>
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
              <YAxis tickFormatter={(v) => formatAxisMoneyVNDMillion(v)} fontSize={12} stroke="#94a3b8" />
              <Tooltip formatter={(value: any) => formatTooltipMoneyVNDMillion(value as number)} />
              <Area type="monotone" dataKey="Chi phí tháng" stroke="#d97706" fillOpacity={1} fill="url(#colorCost)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Child cost breakdown table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Chi tiết phân rã chi phí nuôi con hàng năm
            <HelpTooltip text="Bảng phân rã chi tiết theo từng cấu phần: ăn uống, giáo dục, ngoại ngữ, y tế, du lịch, và lập nghiệp. Đơn vị: triệu VND/tháng." />
          </CardTitle>
          <CardDescription>
            Định mức chi tiêu hàng tháng cho từng cấu phần chi tiết (Đơn vị: triệu VND/tháng).
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
