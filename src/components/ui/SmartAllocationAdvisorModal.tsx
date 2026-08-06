import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { computeExpenseFinancing } from '../../engines/SmartAllocationAdvisor';
import type { AllocationSnapshot, ExpenseFinancingResult } from '../../engines/SmartAllocationAdvisor';
import { analyzeAllocationOffline } from '../../services/aiService';

export interface AIAllocationResult {
  goc_phan_bo: number;
  thang_du: number;
  benchmarks: {
    muc_tieu_tu_do_tai_chinh: number;
    dau_tu_toi_thieu: number;
    quy_khan_cap_can: number;
    chi_phi_toi_da: number;
  };
  canh_bao: {
    muc_do: 'cao' | 'trung_binh' | 'thong_tin';
    tieu_de: string;
    noi_dung: string;
    de_xuat_hanh_dong: string;
  }[];
  tong_ket: string;
}
import { Sparkles, X, BrainCircuit, ShieldAlert, ArrowDownToLine, Target, TrendingUp, CheckCircle2 } from 'lucide-react';
import { formatTableMoneyVNDMillion } from '../../utils/format';
import { HelpTooltip } from './HelpTooltip';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  snapshot: AllocationSnapshot | null;
}

export const SmartAllocationAdvisorModal: React.FC<Props> = ({ isOpen, onClose, snapshot }) => {
  const [mode, setMode] = useState<'income' | 'expense'>('income');
  const [amountInput, setAmountInput] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [aiResults, setAiResults] = useState<AIAllocationResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [expenseResult, setExpenseResult] = useState<ExpenseFinancingResult | null>(null);

  useEffect(() => {
    setApiKey(localStorage.getItem('gemini_api_key') || '');
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setAmountInput('');
      setAmount(0);
      setAiResults(null);
      setExpenseResult(null);
      setMode('income');
    }
  }, [isOpen]);

  // Clear results when switching mode
  useEffect(() => {
    setAiResults(null);
    setExpenseResult(null);
  }, [mode]);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    const val = parseFloat(amountInput);
    if (isNaN(val) || val <= 0 || !snapshot) {
      return;
    }
    setAmount(val);
    
    if (mode === 'income') {
      setIsAnalyzing(true);
      
      // Giả lập thời gian load một chút (600ms) để giữ cảm giác Premium cho UI
      setTimeout(() => {
        try {
          const currentDb = snapshot.appState.resolvedMonthlyDbMap?.[snapshot.currentPeriodKey];
          const actualIncome = currentDb ? currentDb.income : val;
          
          let activeVersion = snapshot.appState.budgetSchedule[0];
          const periodParts = snapshot.currentPeriodKey.split('-');
          const y = parseInt(periodParts[0], 10);
          const m = parseInt(periodParts[1], 10);
          
          const sortedHistory = [...snapshot.appState.budgetSchedule].sort((a, b) => {
            if (a.effectiveYear !== b.effectiveYear) return a.effectiveYear - b.effectiveYear;
            return a.effectiveMonth - b.effectiveMonth;
          });
          
          const pastOrActive = sortedHistory.filter(item => {
            if (item.effectiveYear < y) return true;
            if (item.effectiveYear === y && item.effectiveMonth <= m) return true;
            return false;
          });
          
          if (pastOrActive.length > 0) {
            activeVersion = pastOrActive[pastOrActive.length - 1];
          }

          const chi_phi_hang_thang = snapshot.housingBasicAvgExpense > 0 ? snapshot.housingBasicAvgExpense : (val * 0.5);

          const inputData = {
            thu_nhap_du_phong: actualIncome,
            goc_phan_bo: val,
            cay_ngan_sach: activeVersion?.rootGroups.map(g => ({
              ten_muc: g.name,
              ty_le_phan_tram: g.ratioPercent,
              so_tien: (val * g.ratioPercent) / 100,
              classification: g.classification
            })) || [],
            chi_phi_hang_thang,
            current_liquidity: snapshot.currentLiquidityBalance
          };

          const result = analyzeAllocationOffline(inputData);
          setAiResults(result);
        } catch (err) {
          console.error(err);
          alert("Lỗi khi phân tích: " + (err as Error).message);
        } finally {
          setIsAnalyzing(false);
        }
      }, 600);
    } else {
      const res = computeExpenseFinancing(val, snapshot);
      setExpenseResult(res);
    }
  };



  const getTierIcon = (tier: number) => {
    switch(tier) {
      case 0: return <ShieldAlert className="w-5 h-5 text-rose-500 drop-shadow-sm" />;
      case 1: return <ArrowDownToLine className="w-5 h-5 text-amber-500 drop-shadow-sm" />;
      case 2: return <Target className="w-5 h-5 text-blue-500 drop-shadow-sm" />;
      case 3: return <TrendingUp className="w-5 h-5 text-emerald-500 drop-shadow-sm" />;
      default: return <CheckCircle2 className="w-5 h-5 text-indigo-500 drop-shadow-sm" />;
    }
  };

  const getTierBadge = (tier: number) => {
    switch(tier) {
      case 0: return <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200 shadow-sm flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span> Khẩn cấp</span>;
      case 1: return <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200 shadow-sm flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Nên làm</span>;
      case 2: return <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-sm flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Tối ưu</span>;
      case 3: return <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 shadow-sm flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Dài hạn</span>;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200/60 ring-1 ring-slate-900/5">
        {/* Header */}
        <div className="px-7 py-5 border-b border-slate-100 bg-white/80 backdrop-blur-md flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl text-white shadow-lg shadow-indigo-200/50 ring-1 ring-white/20">
              <BrainCircuit className="w-6 h-6 drop-shadow-md" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Trợ lý Phân bổ Thông minh</h2>
                <HelpTooltip 
                  text={
                    mode === 'income' ? (
                      <div className="w-72 space-y-2">
                        <p className="font-bold border-b border-indigo-200/50 pb-1.5 mb-2 text-indigo-700">Nguyên tắc Phân bổ Waterfall</p>
                        <p className="text-slate-600">Dòng tiền sẽ chảy tuần tự qua các tầng ưu tiên sau:</p>
                        <ul className="list-disc pl-4 text-xs space-y-1.5 text-slate-600">
                          <li><b className="text-slate-800">Khẩn cấp:</b> Đảm bảo Quỹ an toàn tối thiểu (3 tháng sinh hoạt)</li>
                          <li><b className="text-slate-800">Nên làm:</b> Ưu tiên các Mục tiêu cố định đang chạy</li>
                          <li><b className="text-slate-800">Tối ưu:</b> Bù đắp Quỹ an toàn (6 tháng)</li>
                          <li><b className="text-slate-800">Dài hạn:</b> Đầu tư & Tiết kiệm theo tỷ trọng</li>
                        </ul>
                      </div>
                    ) : (
                      <div className="w-72 space-y-2">
                        <p className="font-bold border-b border-indigo-200/50 pb-1.5 mb-2 text-indigo-700">Nguyên tắc Trả góp Khoản chi</p>
                        <p className="text-slate-600">Tính toán phương án an toàn nhất khi mua sắm lớn:</p>
                        <ul className="list-disc pl-4 text-xs space-y-1.5 text-slate-600">
                          <li><b className="text-slate-800">Trả trước:</b> Rút từ Quỹ thanh khoản nhưng đảm bảo giữ lại số dư tối thiểu (3 tháng sinh hoạt).</li>
                          <li><b className="text-slate-800">Trả góp:</b> Dùng tối đa 90% thặng dư dòng tiền hàng tháng để gánh số tiền còn thiếu.</li>
                        </ul>
                      </div>
                    )
                  }
                  position="bottom-left"
                />
                {snapshot && (
                  <span className="px-3 py-1 bg-slate-50 text-slate-600 text-[10px] uppercase tracking-wider font-bold rounded-full border border-slate-200 shadow-sm ml-auto flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                    Tháng: {snapshot.currentPeriodKey.split('-')[1]}/{snapshot.currentPeriodKey.split('-')[0]}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                {mode === 'income' 
                  ? "Tối ưu dòng tiền dựa trên các nguyên tắc tài chính cá nhân"
                  : "Mô phỏng cấu trúc trả trước & trả góp an toàn cho khoản chi lớn"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all duration-200 hover:rotate-90">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-7 bg-slate-50/50">
          <div className="flex flex-col gap-8">
            
            {/* Input Section */}
            <div className="flex bg-slate-200/50 p-1 rounded-xl w-full max-w-sm mx-auto mb-2">
              <button
                onClick={() => setMode('income')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${
                  mode === 'income' 
                    ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                💰 Phân bổ Thu nhập
              </button>
              <button
                onClick={() => setMode('expense')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${
                  mode === 'expense' 
                    ? 'bg-white text-rose-700 shadow-sm ring-1 ring-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                🛒 Trả góp Khoản chi
              </button>
            </div>

            <Card className="border-0 shadow-md shadow-slate-200/50 bg-white ring-1 ring-slate-200/50 rounded-2xl overflow-hidden">
              <CardContent className="p-7">
                <div className="flex gap-5 items-end">
                  <div className="flex-1 space-y-2.5">
                    <label className="text-sm font-bold text-slate-700">
                      {mode === 'income' ? 'Số tiền thu nhập/tiền dư (Triệu VNĐ)' : 'Số tiền cần chi tiêu (Triệu VNĐ)'}
                    </label>
                    <Input 
                      type="number" 
                      placeholder="VD: 100" 
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      className="text-lg font-semibold h-12 shadow-inner bg-slate-50 border-slate-200 focus-visible:ring-indigo-500/30"
                    />
                  </div>
                  <Button 
                    onClick={handleAnalyze} 
                    disabled={isAnalyzing}
                    className="h-12 px-8 gap-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md shadow-indigo-200/50 hover:shadow-lg hover:shadow-indigo-300/50 transform hover:-translate-y-0.5 transition-all duration-200 rounded-xl font-bold disabled:opacity-70 disabled:hover:translate-y-0"
                  >
                    <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : 'text-indigo-100'}`} /> {isAnalyzing ? 'Đang phân tích...' : 'Phân tích'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Loading State */}
            {isAnalyzing && (
              <div className="flex flex-col items-center justify-center p-10 space-y-4 animate-in fade-in">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-indigo-600 font-medium animate-pulse">AI đang phân tích chiến lược dòng tiền...</p>
              </div>
            )}

            {/* Results Section */}
            {!isAnalyzing && mode === 'income' && aiResults && (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="bg-gradient-to-r from-indigo-50 to-violet-50 p-5 rounded-2xl border border-indigo-100 shadow-sm flex items-start gap-4">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm text-indigo-600">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-indigo-900 tracking-tight mb-1">
                      Tổng kết từ AI
                    </h3>
                    <p className="text-indigo-800/80 font-medium leading-relaxed">
                      {aiResults.tong_ket}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Mục tiêu Tự do TC</div>
                    <div className="text-lg font-black text-slate-800">{formatTableMoneyVNDMillion(aiResults.benchmarks.muc_tieu_tu_do_tai_chinh)}</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Đầu tư tối thiểu</div>
                    <div className="text-lg font-black text-slate-800">{formatTableMoneyVNDMillion(aiResults.benchmarks.dau_tu_toi_thieu)}</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Quỹ khẩn cấp cần</div>
                    <div className="text-lg font-black text-slate-800">{formatTableMoneyVNDMillion(aiResults.benchmarks.quy_khan_cap_can)}</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Chi phí tối đa</div>
                    <div className="text-lg font-black text-slate-800">{formatTableMoneyVNDMillion(aiResults.benchmarks.chi_phi_toi_da)}</div>
                  </div>
                </div>

                <div className="space-y-4 mt-6">
                  <h4 className="font-bold text-slate-700 flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-slate-400" /> Chi tiết phân tích
                  </h4>
                  {aiResults.canh_bao.length === 0 ? (
                    <div className="text-center p-8 text-slate-500 bg-white rounded-2xl border border-slate-200 border-dashed shadow-sm">
                      Phân bổ của bạn đã đạt chuẩn, không có cảnh báo nào!
                    </div>
                  ) : (
                    aiResults.canh_bao.map((cb, idx) => {
                      const isHigh = cb.muc_do === 'cao';
                      const isMed = cb.muc_do === 'trung_binh';
                      
                      return (
                        <div key={idx} className={`bg-white p-5 rounded-2xl border shadow-sm flex gap-4 items-start relative overflow-hidden group ${
                          isHigh ? 'border-rose-200' : isMed ? 'border-amber-200' : 'border-blue-200'
                        }`}>
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                            isHigh ? 'bg-rose-500' : isMed ? 'bg-amber-500' : 'bg-blue-500'
                          }`}></div>
                          <div className={`mt-1 p-2 rounded-xl ring-1 ${
                            isHigh ? 'bg-rose-50 ring-rose-100 text-rose-600' : isMed ? 'bg-amber-50 ring-amber-100 text-amber-600' : 'bg-blue-50 ring-blue-100 text-blue-600'
                          }`}>
                            {isHigh ? <ShieldAlert className="w-5 h-5" /> : isMed ? <Target className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-bold text-slate-800 text-base">{cb.tieu_de}</h4>
                              <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-full font-bold border shadow-sm ${
                                isHigh ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                                isMed ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                                'bg-blue-50 text-blue-700 border-blue-200'
                              }`}>
                                {isHigh ? 'Quan trọng' : isMed ? 'Lưu ý' : 'Thông tin'}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 mb-3 leading-relaxed">{cb.noi_dung}</p>
                            <div className={`text-xs px-3 py-2 rounded-lg inline-block font-medium border ${
                              isHigh ? 'bg-rose-50 text-rose-700 border-rose-100' : 
                              isMed ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                              'bg-blue-50 text-blue-700 border-blue-100'
                            }`}>
                              💡 {cb.de_xuat_hanh_dong}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Expense Financing Results */}
            {mode === 'expense' && expenseResult && (
              <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-500">
                <h3 className="font-bold text-lg text-slate-800 tracking-tight flex items-center gap-2">
                  Cấu trúc Trả góp Đề xuất
                </h3>

                <div className={`p-5 rounded-2xl border ${expenseResult.isFeasible ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'} shadow-sm`}>
                  <p className={`text-sm font-medium ${expenseResult.isFeasible ? 'text-emerald-800' : 'text-rose-800'}`}>
                    {expenseResult.message}
                  </p>
                </div>

                {expenseResult.isFeasible && (
                  <div className="space-y-4">
                    {/* Upfront Card */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex gap-4 items-start relative overflow-hidden group">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 opacity-50"></div>
                      <div className="mt-1 bg-slate-50 p-2 rounded-xl ring-1 ring-slate-100">
                        <Target className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-slate-800 text-base">Tác động Một lần (Trả trước)</h4>
                          <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-sm">
                            Từ Quỹ Thanh Khoản
                          </span>
                        </div>
                        <div className="text-sm text-slate-500 mb-4 leading-relaxed">
                          Hệ thống đã tính toán giữ lại {formatTableMoneyVNDMillion((snapshot?.housingBasicAvgExpense || 0) * 3)} mức sàn an toàn (3 tháng). Số tiền tối đa có thể rút ra trả ngay là:
                        </div>
                        <div className="flex items-center gap-6 bg-slate-50/80 px-4 py-3.5 rounded-xl border border-slate-100/80">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">Số tiền thanh toán ngay</span>
                            <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 text-lg">
                              {formatTableMoneyVNDMillion(expenseResult.upfrontPayment)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Installments Card */}
                    {expenseResult.remainingToFinance > 0 && (
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex gap-4 items-start relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-400 opacity-50"></div>
                        <div className="mt-1 bg-slate-50 p-2 rounded-xl ring-1 ring-slate-100">
                          <TrendingUp className="w-5 h-5 text-orange-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-slate-800 text-base">Luồng B: Trả góp hàng tháng</h4>
                            <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-full bg-orange-50 text-orange-700 font-bold border border-orange-200 shadow-sm">
                              Dòng tiền thặng dư
                            </span>
                          </div>
                          <div className="text-sm text-slate-500 mb-4 leading-relaxed">
                            Dòng tiền thặng dư mỗi tháng đang là {formatTableMoneyVNDMillion(expenseResult.surplusMonthly)}. Trích 90% thặng dư để trả góp phần còn lại ({formatTableMoneyVNDMillion(expenseResult.remainingToFinance)}).
                          </div>
                          <div className="flex items-center gap-6 bg-slate-50/80 px-4 py-3.5 rounded-xl border border-slate-100/80">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">Số tiền (Triệu/tháng)</span>
                              <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-rose-600 text-lg">
                                {formatTableMoneyVNDMillion(expenseResult.monthlyPayment)}
                              </span>
                            </div>
                            <div className="w-px h-8 bg-slate-200"></div>
                            <div className="flex flex-col">
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">Số kỳ tác động</span>
                              <span className="font-semibold text-slate-700">
                                {expenseResult.durationMonths} tháng
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white/80 backdrop-blur-sm flex justify-end gap-3 rounded-b-2xl">
          <Button variant="outline" onClick={onClose} className="hover:bg-slate-50 hover:text-slate-700 text-slate-500 font-semibold border-slate-200">
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
};
