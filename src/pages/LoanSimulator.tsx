import React, { useState, useMemo } from 'react';
import { Landmark, Calculator, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import { useAppContext } from '../context/AppContext';
import { formatTableMoneyVNDMillion } from '../utils/format';
import { safeNumber } from '../utils/math';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

export const LoanSimulator: React.FC = () => {
  const { state, updateToolConfig } = useAppContext();
  const config = state.toolConfigs?.loanSimulator || {};

  const [loanAmount, setLoanAmount] = useState<number>(config.loanAmount ?? 2000); // 2 tỷ
  const [termMonths, setTermMonths] = useState<number>(config.termMonths ?? 240); // 20 năm
  const [introInterestRate, setIntroInterestRate] = useState<number>(config.introInterestRate ?? 7.5); // 7.5% / năm
  const [introTermMonths, setIntroTermMonths] = useState<number>(config.introTermMonths ?? 24); // 2 năm
  const [floatingInterestRate, setFloatingInterestRate] = useState<number>(config.floatingInterestRate ?? 10.5); // 10.5% / năm
  const [loanMethod, setLoanMethod] = useState<'declining' | 'annuity'>(config.loanMethod ?? 'declining');

  React.useEffect(() => {
    const handler = setTimeout(() => {
      updateToolConfig('loanSimulator', { loanAmount, termMonths, introInterestRate, introTermMonths, floatingInterestRate, loanMethod });
    }, 500);
    return () => clearTimeout(handler);
  }, [loanAmount, termMonths, introInterestRate, introTermMonths, floatingInterestRate, loanMethod]);

  const amortizationSchedule = useMemo(() => {
    const schedule = [];
    let remainingPrincipal = safeNumber(loanAmount);
    const months = safeNumber(termMonths) || 1;
    
    // For declining balance (Gốc đều)
    const principalPerMonthDeclining = remainingPrincipal / months;
    
    let totalInterestPaid = 0;
    
    for (let month = 1; month <= months; month++) {
      const currentRateAnnual = month <= safeNumber(introTermMonths) 
        ? safeNumber(introInterestRate) 
        : safeNumber(floatingInterestRate);
        
      const monthlyRate = currentRateAnnual / 100 / 12;
      let principalPayment = 0;
      let interestPayment = 0;

      if (loanMethod === 'declining') {
        // Phương pháp Dư nợ giảm dần (Gốc đều)
        principalPayment = principalPerMonthDeclining;
        interestPayment = remainingPrincipal * monthlyRate;
      } else {
        // Phương pháp Gốc lãi trả đều (Niên kim)
        // Công thức: A = P * r * (1+r)^n / ((1+r)^n - 1)
        // Lưu ý: Nếu có đổi lãi suất (hết ưu đãi), phần gốc còn lại sẽ được tính lại theo lãi mới và thời gian còn lại.
        const remainingMonths = months - month + 1;
        const emi = (remainingPrincipal * monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)) / (Math.pow(1 + monthlyRate, remainingMonths) - 1);
        interestPayment = remainingPrincipal * monthlyRate;
        principalPayment = emi - interestPayment;
      }
      
      totalInterestPaid += interestPayment;

      // Group into years for charting to avoid too many data points
      if (month % 12 === 0 || month === months) {
        schedule.push({
          month: month,
          year: Math.ceil(month / 12),
          principalPayment: principalPayment * 12, // Approximate yearly for charting
          interestPayment: interestPayment * 12, 
          remainingBalance: Math.max(0, remainingPrincipal - principalPayment),
        });
      }
      
      remainingPrincipal -= principalPayment;
    }

    return { schedule, totalInterestPaid };
  }, [loanAmount, termMonths, introInterestRate, introTermMonths, floatingInterestRate, loanMethod]);

  // First month payment details
  const firstMonthInterest = safeNumber(loanAmount) * (safeNumber(introInterestRate) / 100 / 12);
  let firstMonthPrincipal = 0;
  if (loanMethod === 'declining') {
    firstMonthPrincipal = safeNumber(loanAmount) / (safeNumber(termMonths) || 1);
  } else {
    const monthlyRate = safeNumber(introInterestRate) / 100 / 12;
    const months = safeNumber(termMonths) || 1;
    const emi = (safeNumber(loanAmount) * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    firstMonthPrincipal = emi - firstMonthInterest;
  }
  const firstMonthTotal = firstMonthInterest + firstMonthPrincipal;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between border-b border-family-accent/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-family-accent/10 rounded-xl">
            <Landmark className="w-6 h-6 text-family-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-family-text flex items-center gap-2">
              Mô phỏng Vay vốn (Dư nợ giảm dần)
              <HelpTooltip text="Công cụ tính toán trả nợ vay độc lập. Các thông số ở đây không làm thay đổi hay ảnh hưởng đến dòng tiền của gia đình." />
            </h1>
            <p className="text-sm text-family-textMuted mt-1">
              Ước tính dòng tiền trả nợ hàng tháng khi mua nhà, mua xe hoặc kinh doanh.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="bg-family-bgDeep border-b border-family-accent/10 pb-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calculator className="w-4 h-4 text-family-accent" />
                Thông số khoản vay
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <Input
                label="Số tiền vay"
                type="number"
                suffix="triệu VND"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
              />
              <Input
                label="Thời hạn vay"
                type="number"
                suffix="tháng"
                value={termMonths}
                onChange={(e) => setTermMonths(Number(e.target.value))}
              />
              <div>
                <label className="block text-xs font-bold text-family-textLight uppercase mb-2">Phương thức trả nợ</label>
                <select
                  value={loanMethod}
                  onChange={(e) => setLoanMethod(e.target.value as 'declining' | 'annuity')}
                  className="w-full h-11 px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-family-accent focus:border-transparent text-sm"
                >
                  <option value="declining">Gốc đều, Lãi giảm dần (Dư nợ giảm dần)</option>
                  <option value="annuity">Gốc & Lãi trả đều (Niên kim)</option>
                </select>
              </div>
              <div className="border-t border-gray-100 pt-4 mt-2">
                <div className="text-xs font-bold text-family-textLight uppercase mb-3">Lãi suất ưu đãi ban đầu</div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Lãi suất"
                    type="number"
                    suffix="%/năm"
                    value={introInterestRate}
                    onChange={(e) => setIntroInterestRate(Number(e.target.value))}
                  />
                  <Input
                    label="Kéo dài"
                    type="number"
                    suffix="tháng"
                    value={introTermMonths}
                    onChange={(e) => setIntroTermMonths(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4 mt-2">
                <div className="text-xs font-bold text-family-textLight uppercase mb-3 flex items-center gap-1">
                  Lãi suất thả nổi 
                  <HelpTooltip text="Lãi suất áp dụng sau khi hết thời gian ưu đãi. Thường bằng Lãi suất tiết kiệm 12T + Biên độ (3-4%)." />
                </div>
                <Input
                  label="Lãi thả nổi (ước tính)"
                  type="number"
                  suffix="%/năm"
                  value={floatingInterestRate}
                  onChange={(e) => setFloatingInterestRate(Number(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Output */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card isKpi className="border-l-blue-500">
              <CardHeader className="p-4">
                <CardTitle className="text-xs text-family-textMuted uppercase">Tiền phải trả tháng đầu</CardTitle>
                <div className="text-xl mt-1 font-bold text-blue-700">{formatTableMoneyVNDMillion(firstMonthTotal)}</div>
                <div className="text-[10px] text-gray-500 mt-1 flex gap-2">
                  <span>Gốc: {formatTableMoneyVNDMillion(firstMonthPrincipal)}</span>
                  <span>Lãi: {formatTableMoneyVNDMillion(firstMonthInterest)}</span>
                </div>
              </CardHeader>
            </Card>
            
            <Card isKpi className="border-l-family-accent">
              <CardHeader className="p-4">
                <CardTitle className="text-xs text-family-textMuted uppercase">Tổng lãi phải trả (ước tính)</CardTitle>
                <div className="text-xl mt-1 font-bold text-family-accent">{formatTableMoneyVNDMillion(amortizationSchedule.totalInterestPaid)}</div>
                <div className="text-[10px] text-gray-500 mt-1">Trong suốt {termMonths} tháng</div>
              </CardHeader>
            </Card>

            <Card isKpi className="border-l-red-500">
              <CardHeader className="p-4">
                <CardTitle className="text-xs text-family-textMuted uppercase">Tổng Tiền (Gốc + Lãi)</CardTitle>
                <div className="text-xl mt-1 font-bold text-red-700">{formatTableMoneyVNDMillion(loanAmount + amortizationSchedule.totalInterestPaid)}</div>
                <div className="text-[10px] text-gray-500 mt-1">Tổng cộng chi phí mua tài sản</div>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Biểu đồ Chi phí vay qua các năm</CardTitle>
                <div className="text-xs text-family-textMuted mt-1">Mô phỏng giảm dần tiền lãi do tính theo dư nợ thực tế</div>
              </div>
            </CardHeader>
            <CardContent className="h-72 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={amortizationSchedule.schedule}>
                  <defs>
                    <linearGradient id="colorPrincipal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="year" tickFormatter={(v) => `Năm ${v}`} fontSize={11} stroke="#9ca3af" />
                  <YAxis fontSize={11} stroke="#9ca3af" tickFormatter={(v) => `${v}tr`} />
                  <RechartsTooltip 
                    formatter={(value: any) => formatTableMoneyVNDMillion(value)}
                    labelFormatter={(label) => `Năm thứ ${label}`}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" dataKey="principalPayment" name="Tiền gốc trả (năm)" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPrincipal)" stackId="1" />
                  <Area type="monotone" dataKey="interestPayment" name="Tiền lãi trả (năm)" stroke="#f59e0b" fillOpacity={1} fill="url(#colorInterest)" stackId="1" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="p-4 bg-orange-50/50 border border-orange-200/60 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="text-[11px] font-bold text-orange-700 uppercase tracking-wider">Lưu ý rủi ro thả nổi</h5>
              <p className="text-[11px] text-orange-700/80 leading-relaxed">
                Khi hết thời gian ưu đãi ({introTermMonths} tháng), lãi suất sẽ thả nổi theo thị trường. Việc lãi suất thả nổi tăng cao hơn dự kiến có thể gây áp lực lớn lên dòng tiền sinh hoạt của gia đình. Hãy đảm bảo <strong>Quỹ Dự phòng</strong> luôn có đủ số dư thanh toán nợ trong ít nhất 3-6 tháng.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
