import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { computeSmartAllocation, computeExpenseFinancing } from '../../engines/SmartAllocationAdvisor';
import type { AllocationSnapshot, AllocationSuggestion, ExpenseFinancingResult } from '../../engines/SmartAllocationAdvisor';
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
  const [results, setResults] = useState<{ suggestions: AllocationSuggestion[], remaining: number } | null>(null);
  const [expenseResult, setExpenseResult] = useState<ExpenseFinancingResult | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setAmountInput('');
      setAmount(0);
      setResults(null);
      setExpenseResult(null);
      setMode('income');
    }
  }, [isOpen]);

  // Clear results when switching mode
  useEffect(() => {
    setResults(null);
    setExpenseResult(null);
  }, [mode]);

  if (!isOpen) return null;

  const handleAnalyze = () => {
    const val = parseFloat(amountInput);
    if (isNaN(val) || val <= 0 || !snapshot) {
      return;
    }
    setAmount(val);
    
    if (mode === 'income') {
      const res = computeSmartAllocation(val, snapshot);
      setResults(res);
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
                    className="h-12 px-8 gap-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md shadow-indigo-200/50 hover:shadow-lg hover:shadow-indigo-300/50 transform hover:-translate-y-0.5 transition-all duration-200 rounded-xl font-bold"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-100" /> Phân tích
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results Section */}
            {results && (
              <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-500">
                <h3 className="font-bold text-lg text-slate-800 tracking-tight flex items-center gap-2">
                  Đề xuất phân bổ (Waterfall)
                </h3>
                
                {results.suggestions.length === 0 ? (
                  <div className="text-center p-10 text-slate-400 bg-white rounded-2xl border border-slate-200 border-dashed shadow-sm">
                    Không có đề xuất nào được tạo.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {results.suggestions.map((sug, idx) => (
                      <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200/60 transition-all duration-300 flex gap-4 items-start relative overflow-hidden group">
                        {/* Subtle left accent bar based on tier */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                          sug.tier === 0 ? 'bg-rose-400' : 
                          sug.tier === 1 ? 'bg-amber-400' : 
                          sug.tier === 2 ? 'bg-blue-400' : 'bg-emerald-400'
                        } opacity-50 group-hover:opacity-100 transition-opacity`}></div>

                        <div className="mt-1 bg-slate-50 p-2 rounded-xl ring-1 ring-slate-100">
                          {getTierIcon(sug.tier)}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-slate-800 text-base">{sug.targetName}</h4>
                            {getTierBadge(sug.tier)}
                          </div>
                          <div className="text-sm text-slate-500 mb-4 leading-relaxed">
                            {sug.reason}
                          </div>
                          
                          <div className="flex items-center gap-6 bg-slate-50/80 px-4 py-3.5 rounded-xl border border-slate-100/80">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">Phân bổ</span>
                              <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 text-lg">
                                {formatTableMoneyVNDMillion(sug.amount)}
                              </span>
                            </div>
                            <div className="w-px h-8 bg-slate-200"></div>
                            <div className="flex flex-col">
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">Tác động</span>
                              <span className="font-semibold text-slate-700">
                                {sug.durationMonths > 0 ? `${formatTableMoneyVNDMillion(sug.amountPerMonth)} / ${sug.durationMonths} tháng` : 'Giải ngân 1 lần'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary Footer */}
                <div className="mt-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 p-6 rounded-2xl flex justify-between items-center shadow-xl border border-slate-700/50 relative overflow-hidden group">
                  {/* Subtle background glow */}
                  <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl rounded-full"></div>
                  
                  <div className="relative z-10 flex flex-col">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Tổng đã phân bổ</span>
                    <span className="text-3xl font-black text-white drop-shadow-sm">{formatTableMoneyVNDMillion(amount - results.remaining)}</span>
                  </div>
                  <div className="relative z-10 flex flex-col items-end">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Còn dư</span>
                    <span className={`text-3xl font-black drop-shadow-sm ${results.remaining > 0 ? 'text-emerald-400' : 'text-teal-400'}`}>
                      {formatTableMoneyVNDMillion(results.remaining)}
                    </span>
                  </div>
                </div>

                {results.remaining > 0 && (
                  <p className="text-center text-sm font-medium text-amber-600 bg-amber-50 py-2 px-4 rounded-lg border border-amber-200/60 shadow-sm mt-4">
                    Số tiền chưa đủ để phủ hết nhu cầu an toàn các tầng dưới, hệ thống tạm dừng phân bổ Tầng 3.
                  </p>
                )}
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
