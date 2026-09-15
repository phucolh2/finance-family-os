import React, { useState } from 'react';
import { Calculator, Users, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import { useAppContext } from '../context/AppContext';

const formatTableMoneyVND = (value: number) => {
  return new Intl.NumberFormat('vi-VN').format(value);
};

const LUONG_CO_SO = 2530000;
const LUONG_TOI_THIEU_VUNG: Record<string, number> = {
  'I': 5310000,
  'II': 4729000,
  'III': 4136000,
  'IV': 3698000,
};

const GIAM_TRU_BAN_THAN = 15500000;
const GIAM_TRU_PHU_THUOC = 6200000;

export const TaxCalculator: React.FC = () => {
  const { state, updateToolConfig } = useAppContext();
  const config = state.toolConfigs?.taxCalculator || {};

  const [gross, setGross] = useState<number>(config.gross ?? 120000000);
  const [dependents, setDependents] = useState<number>(config.dependents ?? 1);
  const [region, setRegion] = useState<string>(config.region ?? 'I');
  const [insuranceSalaryBasis, setInsuranceSalaryBasis] = useState<'gross' | 'other'>(config.insuranceSalaryBasis ?? 'gross');
  const [insuranceSalary, setInsuranceSalary] = useState<number>(config.insuranceSalary ?? 9400000);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      updateToolConfig('taxCalculator', { gross, dependents, region, insuranceSalaryBasis, insuranceSalary });
    }, 500);
    return () => clearTimeout(handler);
  }, [gross, dependents, region, insuranceSalaryBasis, insuranceSalary]);

  // Calculation Logic
  const maxBhxhBhyt = LUONG_CO_SO * 20; // 50,600,000
  const maxBhtn = LUONG_TOI_THIEU_VUNG[region] * 20; // Vùng I: 106,200,000

  const actualInsuranceSalary = insuranceSalaryBasis === 'gross' ? gross : insuranceSalary;

  const bhxhBase = Math.min(actualInsuranceSalary, maxBhxhBhyt);
  const bhtnBase = Math.min(actualInsuranceSalary, maxBhtn);

  const bhxh = bhxhBase * 0.08;
  const bhyt = bhxhBase * 0.015;
  const bhtn = bhtnBase * 0.01;
  const totalInsurance = bhxh + bhyt + bhtn;

  const incomeBeforeTax = gross - totalInsurance;
  
  const dependentDeduction = dependents * GIAM_TRU_PHU_THUOC;
  const totalDeductions = GIAM_TRU_BAN_THAN + dependentDeduction;

  const taxableIncome = Math.max(0, incomeBeforeTax - totalDeductions);

  // Biểu thuế 5 bậc (2026)
  // Bậc 1: 0 - 10tr (5%)
  // Bậc 2: 10tr - 30tr (10%)
  // Bậc 3: 30tr - 60tr (20%)
  // Bậc 4: 60tr - 100tr (30%)
  // Bậc 5: > 100tr (35%)
  
  let remaining = taxableIncome;
  
  const brackets = [
    { limit: 10000000, rate: 0.05, label: 'Đến 10 triệu VNĐ' },
    { limit: 20000000, rate: 0.10, label: 'Trên 10 triệu đến 30 triệu VNĐ' },
    { limit: 30000000, rate: 0.20, label: 'Trên 30 triệu đến 60 triệu VNĐ' },
    { limit: 40000000, rate: 0.30, label: 'Trên 60 triệu đến 100 triệu VNĐ' },
    { limit: Infinity, rate: 0.35, label: 'Trên 100 triệu VNĐ' },
  ];

  const taxDetails = brackets.map((b) => {
    const amountInBracket = Math.min(Math.max(0, remaining), b.limit);
    const tax = amountInBracket * b.rate;
    remaining -= amountInBracket;
    return {
      label: b.label,
      rate: b.rate * 100,
      amount: amountInBracket,
      tax: tax,
    };
  });

  const totalTax = taxDetails.reduce((sum, b) => sum + b.tax, 0);
  const netIncome = incomeBeforeTax - totalTax;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-3 border-b border-family-accent/10 pb-4">
        <div className="p-3 bg-family-accent/10 rounded-xl">
          <Calculator className="w-6 h-6 text-family-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-serif font-bold text-family-text flex items-center gap-2">
            Tối ưu Thuế TNCN
            <HelpTooltip text="Công cụ tính toán độc lập. Các số liệu nhập ở đây chỉ để tra cứu, không làm thay đổi hay lưu vào Bức tranh Tài chính của gia đình." />
          </h1>
          <p className="text-sm text-family-textMuted mt-1">
            Công cụ tính lương Gross sang Net và ngược lại [Chuẩn Luật Mới 2026]
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="bg-family-bgDeep border-b border-family-accent/10 pb-4">
              <CardTitle className="text-sm">Tham số đầu vào</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <div>
                <label className="block text-xs font-bold text-family-textLight uppercase mb-2">Lương Gross (VNĐ)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-family-textMuted font-bold">₫</span>
                  <Input 
                    type="number" 
                    value={gross || ''}
                    onChange={(e) => setGross(Number(e.target.value))}
                    className="pl-8 text-right font-mono text-lg font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-family-textLight uppercase mb-2 flex items-center gap-1">
                  Người phụ thuộc
                  <HelpTooltip text="Bao gồm con cái dưới 18 tuổi, con đang học đại học không có thu nhập, hoặc cha mẹ già yếu. Gợi ý: Hãy khai báo người phụ thuộc cho vợ hoặc chồng (người có thu nhập cao hơn và đang chịu bậc thuế cao hơn) để giảm tối đa tiền thuế chung của gia đình." />
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-family-textMuted">
                    <Users className="w-4 h-4" />
                  </span>
                  <Input 
                    type="number" 
                    value={dependents}
                    onChange={(e) => setDependents(Number(e.target.value))}
                    min={0}
                    className="pl-9 text-right font-mono text-lg font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-family-textLight uppercase mb-3">Vùng lương tối thiểu</label>
                <div className="flex gap-4">
                  {['I', 'II', 'III', 'IV'].map(r => (
                    <label key={r} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="region" 
                        value={r} 
                        checked={region === r}
                        onChange={(e) => setRegion(e.target.value)}
                        className="accent-family-accent"
                      />
                      <span className="text-sm font-semibold">{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t border-family-accent/10 pt-5">
                <label className="block text-xs font-bold text-family-textLight uppercase mb-3">Mức lương đóng bảo hiểm</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      value="gross" 
                      checked={insuranceSalaryBasis === 'gross'}
                      onChange={() => setInsuranceSalaryBasis('gross')}
                      className="accent-family-accent"
                    />
                    <span className="text-sm font-semibold text-family-text">Trên lương chính thức (Gross)</span>
                  </label>
                  
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer shrink-0">
                      <input 
                        type="radio" 
                        value="other" 
                        checked={insuranceSalaryBasis === 'other'}
                        onChange={() => setInsuranceSalaryBasis('other')}
                        className="accent-family-accent"
                      />
                      <span className="text-sm font-semibold text-family-text">Khác:</span>
                    </label>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-family-textMuted font-bold">₫</span>
                      <Input 
                        type="number" 
                        value={insuranceSalary || ''}
                        onChange={(e) => {
                          setInsuranceSalaryBasis('other');
                          setInsuranceSalary(Number(e.target.value));
                        }}
                        disabled={insuranceSalaryBasis === 'gross'}
                        className={`pl-8 text-right font-mono text-sm font-bold ${insuranceSalaryBasis === 'gross' ? 'opacity-50 bg-gray-50' : ''}`}
                      />
                    </div>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-5">
              <h3 className="text-xs font-bold text-green-800 uppercase mb-3 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Thông số áp dụng (Năm 2026)
              </h3>
              <ul className="text-xs text-green-700 space-y-2">
                <li>• Lương cơ sở: <strong>{formatTableMoneyVND(LUONG_CO_SO)}đ</strong></li>
                <li>• Giảm trừ bản thân: <strong>{formatTableMoneyVND(GIAM_TRU_BAN_THAN)}đ</strong></li>
                <li>• Giảm trừ phụ thuộc: <strong>{formatTableMoneyVND(GIAM_TRU_PHU_THUOC)}đ/người</strong></li>
                <li>• Biểu thuế rút gọn: <strong>5 Bậc</strong></li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Output */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Lương Gross</div>
                <div className="text-xl font-bold font-mono text-gray-800">{formatTableMoneyVND(gross)}</div>
             </div>
             <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Bảo hiểm</div>
                <div className="text-xl font-bold font-mono text-red-600">-{formatTableMoneyVND(totalInsurance)}</div>
             </div>
             <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Thuế TNCN</div>
                <div className="text-xl font-bold font-mono text-red-600">-{formatTableMoneyVND(totalTax)}</div>
             </div>
             <div className="bg-family-accent/10 border border-family-accent/30 rounded-xl p-4 shadow-sm">
                <div className="text-[10px] text-family-accent font-bold uppercase mb-1">Lương Net</div>
                <div className="text-xl font-bold font-mono text-family-accent">{formatTableMoneyVND(netIncome)}</div>
             </div>
          </div>

          <Card>
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-3">
              <CardTitle className="text-sm">Diễn giải chi tiết (VNĐ)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100 text-sm">
                <div className="flex justify-between px-6 py-3 bg-gray-50">
                  <span className="font-semibold text-gray-700">Lương GROSS</span>
                  <span className="font-bold font-mono">{formatTableMoneyVND(gross)}</span>
                </div>
                <div className="flex justify-between px-6 py-3">
                  <span className="text-gray-600">Bảo hiểm xã hội (8%)</span>
                  <span className="font-mono text-gray-500">-{formatTableMoneyVND(bhxh)}</span>
                </div>
                <div className="flex justify-between px-6 py-3">
                  <span className="text-gray-600">Bảo hiểm y tế (1.5%)</span>
                  <span className="font-mono text-gray-500">-{formatTableMoneyVND(bhyt)}</span>
                </div>
                <div className="flex justify-between px-6 py-3">
                  <span className="text-gray-600">Bảo hiểm thất nghiệp (1%)</span>
                  <span className="font-mono text-gray-500">-{formatTableMoneyVND(bhtn)}</span>
                </div>
                <div className="flex justify-between px-6 py-3 bg-blue-50/30">
                  <span className="font-semibold text-gray-700">Thu nhập trước thuế</span>
                  <span className="font-bold font-mono">{formatTableMoneyVND(incomeBeforeTax)}</span>
                </div>
                <div className="flex justify-between px-6 py-3">
                  <span className="text-gray-600">Giảm trừ gia cảnh bản thân</span>
                  <span className="font-mono text-gray-500">-{formatTableMoneyVND(GIAM_TRU_BAN_THAN)}</span>
                </div>
                <div className="flex justify-between px-6 py-3">
                  <span className="text-gray-600">Giảm trừ gia cảnh người phụ thuộc ({dependents})</span>
                  <span className="font-mono text-gray-500">-{formatTableMoneyVND(dependentDeduction)}</span>
                </div>
                <div className="flex justify-between px-6 py-3 bg-orange-50/30">
                  <span className="font-semibold text-gray-700">Thu nhập chịu thuế</span>
                  <span className="font-bold font-mono">{formatTableMoneyVND(taxableIncome)}</span>
                </div>
                <div className="flex justify-between px-6 py-3">
                  <span className="font-semibold text-red-600">Thuế thu nhập cá nhân (*)</span>
                  <span className="font-bold font-mono text-red-600">-{formatTableMoneyVND(totalTax)}</span>
                </div>
                <div className="flex justify-between px-6 py-4 bg-green-50">
                  <div className="flex flex-col">
                     <span className="font-bold text-green-800">Lương NET</span>
                     <span className="text-[10px] text-green-600 mt-1">(Thu nhập trước thuế - Thuế thu nhập cá nhân)</span>
                  </div>
                  <span className="text-xl font-bold font-mono text-green-700">{formatTableMoneyVND(netIncome)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {totalTax > 0 && (
            <Card>
              <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-3">
                <CardTitle className="text-sm text-red-600">(*) Chi tiết thuế TNCN phân bổ theo 5 Bậc</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-500">
                      <th className="font-semibold py-3 px-4 text-left">Mức chịu thuế</th>
                      <th className="font-semibold py-3 px-4">Thuế suất</th>
                      <th className="font-semibold py-3 px-4">Lương chịu thuế</th>
                      <th className="font-semibold py-3 px-4 text-red-600">Tiền nộp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {taxDetails.map((b, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="py-2.5 px-4 text-left text-gray-600 font-medium">
                          Bậc {i+1}: {b.label}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-gray-500">{b.rate}%</td>
                        <td className="py-2.5 px-4 font-mono text-gray-500">{formatTableMoneyVND(b.amount)}</td>
                        <td className="py-2.5 px-4 font-mono font-semibold text-red-600">{formatTableMoneyVND(b.tax)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
};
