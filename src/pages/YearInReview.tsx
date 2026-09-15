import React, { useMemo, useState } from 'react';
import { TrendingUp, PiggyBank, Target, CalendarDays, Download } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { formatTableMoneyVNDMillion, formatPercent } from '../utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import html2canvas from 'html2canvas';
import { runProjection } from '../engines/projectionEngine';
import { useLiquidityBreakdown } from '../hooks/useLiquidityBreakdown';
import { simulateSinkingFund } from '../engines/sinkingFundEngine';

const BACKGROUNDS = [
  'from-indigo-950 via-indigo-900 to-violet-900',
  'from-emerald-950 via-emerald-900 to-teal-900',
  'from-rose-950 via-rose-900 to-pink-900',
  'from-slate-950 via-slate-900 to-gray-900',
  'from-orange-950 via-orange-900 to-amber-900'
];

export const YearInReview: React.FC = () => {
  const { state, selectedPeriodKey } = useAppContext();
  const [isExporting, setIsExporting] = useState(false);
  
  // Extract all available years from resolved db
  const availableYears = useMemo(() => {
    const currentSystemYear = new Date().getFullYear();
    if (!state.resolvedMonthlyDb || state.resolvedMonthlyDb.length === 0) return [currentSystemYear];
    const years = Array.from(new Set(state.resolvedMonthlyDb.map(db => db.year)));
    if (!years.includes(currentSystemYear)) {
      years.push(currentSystemYear);
    }
    return years.sort((a, b) => b - a); // descending
  }, [state.resolvedMonthlyDb]);

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Wrapped is a yearly snapshot, always evaluated at December of the selected year.
  const endOfYearPeriodKey = `${selectedYear}-12`;
  const { totalRemainingSum } = useLiquidityBreakdown('cumulative', endOfYearPeriodKey);

  const yearData = useMemo(() => {
    if (!state.resolvedMonthlyDb) return null;
    
    const months = state.resolvedMonthlyDb.filter(db => db.year === selectedYear);
    if (months.length === 0) return null;

    let totalIncome = 0;
    let totalExpense = 0;
    let totalInvested = 0;
    
    let maxIncome = 0;
    let maxIncomeMonth = 1;
    let maxExpense = 0;
    let maxExpenseMonth = 1;
    let positiveMonths = 0;

    months.forEach(m => {
      const inc = m.income || 0;
      const exp = m.totalActualExpenseMonthly || 0;
      
      totalIncome += inc;
      totalExpense += exp;
      totalInvested += m.investmentFlow?.contribution || 0;
      
      if (inc > maxIncome) {
        maxIncome = inc;
        maxIncomeMonth = m.month;
      }
      if (exp > maxExpense) {
        maxExpense = exp;
        maxExpenseMonth = m.month;
      }
      if (inc > exp) {
        positiveMonths++;
      }
    });

    // We evaluate projection precisely at the end of the year to capture actuals vs budget up to that point
    const projection = runProjection({ ...state, observationPeriodKey: endOfYearPeriodKey });
    const projMonths = projection.monthlyRows.filter(r => r.period.year === selectedYear);
    const lastRow = projMonths.find(r => r.period.key === endOfYearPeriodKey) || (projMonths.length > 0 ? projMonths[projMonths.length - 1] : null);

    let totalAssets = 0;
    if (lastRow) {
      const savingBalance = lastRow.savingBalance || 0;
      const debtReserveBalance = lastRow.debtReserveBalance || 0;
      const portfolioSavingsBalance = lastRow.portfolio?.savingsBalance || 0;
      
      const sinkingFundBreakdown: Record<string, number> = {};
      if (state.sinkingFunds) {
        state.sinkingFunds.forEach(sf => {
          if (sf.status === 'active' || (sf.status === 'disbursed' && sf.disbursedYear && sf.disbursedMonth && (sf.disbursedYear * 12 + sf.disbursedMonth >= lastRow.period.year * 12 + lastRow.period.month))) {
            const { totalPrincipal, nonTermCash } = simulateSinkingFund(sf, lastRow.period.month, lastRow.period.year);
            const bal = totalPrincipal + nonTermCash;
            if (bal > 0) {
              sinkingFundBreakdown[sf.name] = bal;
            }
          }
        });
      }
      const activeSinkingFundsCash = Object.values(sinkingFundBreakdown).reduce((sum, v) => sum + v, 0);

      const portfolioUnallocatedBase = lastRow.portfolio?.unallocatedEndingBalance || 0;
      const actualUnallocatedIncome = lastRow.unallocatedCashBalance || 0;
      const displayLiquidityBalance = totalRemainingSum;

      const investmentAssets = lastRow.portfolio?.assets
        ? Object.values(lastRow.portfolio.assets).reduce((sum, a) => sum + a.endingBalance, 0)
        : 0;

      totalAssets = 
        investmentAssets +
        (portfolioUnallocatedBase + actualUnallocatedIncome) +
        (portfolioSavingsBalance + savingBalance) +
        (displayLiquidityBalance) +
        (debtReserveBalance) +
        (activeSinkingFundsCash);
    }

    const netWorthEnd = totalAssets;
    const netWorthGrowth = 0; 
    
    let totalActualSaving = 0;
    projMonths.forEach(m => {
      totalActualSaving += m.savingMonthly;
    });
    const savingsRate = totalIncome > 0 ? (totalActualSaving / totalIncome) * 100 : 0;

    let persona = "Nhà Quản Lý Khéo Léo";
    let personaDesc = "Cân bằng tốt giữa thu nhập và chi tiêu.";
    if (savingsRate > 50) {
      persona = "Cỗ Máy Siêu Tiết Kiệm";
      personaDesc = "Kỷ luật thép, giữ lại phần lớn thu nhập cho tương lai!";
    } else if (savingsRate < 10 && totalExpense > 0) {
      persona = "Tay Chơi Hào Phóng";
      personaDesc = "Tận hưởng cuộc sống trọn vẹn, nhưng hãy cẩn thận ví tiền!";
    } else if (totalIncome > 2000) { // 2 ty
      persona = "Cỗ Máy In Tiền";
      personaDesc = "Thu nhập khủng khiếp, trụ cột tài chính vững chắc!";
    }

    const chartData = months.map(m => ({
      month: `T${m.month}`,
      'Thu nhập': m.income || 0,
      'Chi tiêu': m.totalActualExpenseMonthly || 0,
      'Tiết kiệm': Math.max(0, (m.income || 0) - (m.totalActualExpenseMonthly || 0)),
    }));

    return {
      totalIncome,
      totalExpense,
      totalInvested,
      netWorthGrowth,
      netWorthEnd,
      savingsRate,
      maxIncomeMonth,
      maxIncome,
      maxExpenseMonth,
      maxExpense,
      positiveMonths,
      persona,
      personaDesc,
      chartData,
      totalActualSaving
    };
  }, [state, selectedYear, selectedPeriodKey, totalRemainingSum, endOfYearPeriodKey]);

  const handleDownloadImage = async () => {
    const poster = document.getElementById('social-poster');
    if (!poster) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(poster, {
        scale: 2, // higher resolution
        useCORS: true,
        backgroundColor: null
      });
      
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `Financial_Wrapped_${selectedYear}.png`;
      link.click();
    } catch (error) {
      console.error("Lỗi khi xuất ảnh:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!yearData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-500">
        <CalendarDays className="w-12 h-12 mb-4 text-gray-300" />
        <p>Không có dữ liệu cho năm {selectedYear}. Hãy chắc chắn rằng bạn đã thiết lập Kế hoạch thu chi.</p>
      </div>
    );
  }

  // Pick background based on year
  const bgClass = BACKGROUNDS[selectedYear % BACKGROUNDS.length];

  return (
    <div className="max-w-2xl mx-auto pb-12 print:max-w-none">
      {/* Year Selector */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 print:hidden">
        <label className="text-sm font-semibold text-family-textMuted uppercase tracking-wider">Chọn năm tổng kết:</label>
        <select 
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="bg-white border-2 border-family-accent/30 rounded-xl px-6 py-2.5 font-bold text-lg text-family-text focus:outline-none focus:border-family-accent shadow-sm"
        >
          {availableYears.map(y => (
            <option key={y} value={y}>Năm {y}</option>
          ))}
        </select>
      </div>

      {/* Social Poster Container */}
      <div id="social-poster" className={`bg-gradient-to-b ${bgClass} rounded-3xl overflow-hidden shadow-2xl text-white relative`}>
        {/* Background Decorations */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none"></div>
        
        <div className="relative p-8 md:p-10 z-10">
          <div className="text-center mb-10">
            <div className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-indigo-100 text-xs font-bold uppercase tracking-widest mb-4 border border-white/10">
              Finance Family OS
            </div>
            <h1 className="text-5xl md:text-6xl font-serif font-black text-yellow-400 mb-4 drop-shadow-md">
              Wrapped {selectedYear}
            </h1>
            <p className="text-indigo-100 text-sm md:text-base font-medium">Nhìn lại chặng đường tài chính của {state.profile.husbandName} & {state.profile.wifeName}</p>
          </div>

          {/* Persona */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/10 mb-8 shadow-xl">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-amber-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg mb-4 ring-4 ring-white/10">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xs text-indigo-200 font-bold uppercase tracking-widest mb-1">Danh hiệu tài chính</h2>
            <h3 className="text-2xl font-black text-white mb-2">{yearData.persona}</h3>
            <p className="text-sm text-indigo-100 italic">{yearData.personaDesc}</p>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/5 shadow-inner">
              <div className="flex items-center gap-2 text-indigo-200 mb-2 text-[10px] md:text-xs font-bold uppercase tracking-wider">
                <TrendingUp className="w-4 h-4" /> Tổng Thu
              </div>
              <div className="text-2xl md:text-3xl font-black text-white">{formatTableMoneyVNDMillion(yearData.totalIncome)}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/5 shadow-inner">
              <div className="flex items-center gap-2 text-pink-200 mb-2 text-[10px] md:text-xs font-bold uppercase tracking-wider">
                <TrendingUp className="w-4 h-4 rotate-180" /> Tổng Chi
              </div>
              <div className="text-2xl md:text-3xl font-black text-white">{formatTableMoneyVNDMillion(yearData.totalExpense)}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/5 shadow-inner flex flex-col justify-center">
              <div className="flex items-center gap-2 text-emerald-200 mb-2 text-[10px] md:text-xs font-bold uppercase tracking-wider">
                <PiggyBank className="w-4 h-4" /> Tiết Kiệm
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl md:text-3xl font-black text-white">{formatPercent(yearData.savingsRate)}</span>
                <span className="text-sm text-emerald-200/80 font-medium">
                  ({formatTableMoneyVNDMillion(yearData.totalActualSaving)})
                </span>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/5 shadow-inner">
              <div className="flex items-center gap-2 text-amber-200 mb-2 text-[10px] md:text-xs font-bold uppercase tracking-wider">
                <Target className="w-4 h-4" /> Tổng Tài Sản
              </div>
              <div className="text-2xl md:text-3xl font-black text-white">{formatTableMoneyVNDMillion(yearData.netWorthEnd)}</div>
            </div>
          </div>

          {/* Fun Facts */}
          <div className="space-y-3 mb-8">
            <div className="bg-white/5 rounded-xl p-4 flex items-center justify-between border border-white/5 backdrop-blur-sm">
              <span className="text-indigo-100 text-xs md:text-sm">Tháng thu nhập đỉnh cao</span>
              <span className="font-bold text-white text-sm md:text-base">Tháng {yearData.maxIncomeMonth} ({formatTableMoneyVNDMillion(yearData.maxIncome)})</span>
            </div>
            <div className="bg-white/5 rounded-xl p-4 flex items-center justify-between border border-white/5 backdrop-blur-sm">
              <span className="text-indigo-100 text-xs md:text-sm">Tháng chi tiêu nhiều nhất</span>
              <span className="font-bold text-white text-sm md:text-base">Tháng {yearData.maxExpenseMonth} ({formatTableMoneyVNDMillion(yearData.maxExpense)})</span>
            </div>
            <div className="bg-white/5 rounded-xl p-4 flex items-center justify-between border border-white/5 backdrop-blur-sm">
              <span className="text-indigo-100 text-xs md:text-sm">Tháng có dòng tiền dương (Dư dả)</span>
              <span className="font-bold text-white text-sm md:text-base">{yearData.positiveMonths} / 12 tháng</span>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-2xl p-4 shadow-xl text-gray-900">
             <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4 text-center">Diễn biến Thu - Chi</h3>
             <div className="h-40 md:h-48">
               <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearData.chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month" fontSize={10} stroke="#9ca3af" tickLine={false} axisLine={false} />
                  <YAxis fontSize={10} stroke="#9ca3af" tickFormatter={(v) => `${v}`} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    formatter={(value: any) => [formatTableMoneyVNDMillion(value), '']}
                  />
                  <Bar dataKey="Thu nhập" fill="#4f46e5" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Chi tiêu" fill="#f43f5e" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
             </div>
          </div>

        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-col items-center justify-center pt-8 pb-4 print:hidden space-y-4">
        <button 
          onClick={handleDownloadImage}
          disabled={isExporting}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-600/30 text-sm font-bold hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Đang tạo ảnh...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" /> Tải Xuống Dạng Ảnh (.PNG)
            </>
          )}
        </button>
        <div className="text-gray-400 text-xs text-center max-w-sm">
          Nhấn nút để tải về bức ảnh Wrapped chất lượng cao và chia sẻ ngay với bạn bè nhé!
        </div>
      </div>
    </div>
  );
};
