import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowRightLeft, Plus, History, Lightbulb, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import { TransferForm } from '../components/transfer/TransferForm';
import { ObservationControls } from '../components/ui/ObservationControls';
import { formatMoneyVNDMillion } from '../utils/format';

import { useLiquidityBreakdown } from '../hooks/useLiquidityBreakdown';

export const FundTransfers: React.FC = () => {
  const { state, deleteFundTransfer, selectedPeriodKey } = useAppContext();
  const { fundTransfers = [] } = state;
  const { liquidityBreakdownData } = useLiquidityBreakdown('cumulative', selectedPeriodKey);
  
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const getSourceLabel = (type: string, id?: string) => {
    if (type === 'cashflow') {
      if (!id || id === 'investable') return 'Quỹ Đầu tư Nhàn rỗi / Chưa có kế hoạch';
      if (id === 'unallocated') return 'Nguồn tiền dôi ra khi phân bổ ngân sách';
      if (id?.startsWith('liquidity_group_')) {
        const groupId = id.replace('liquidity_group_', '');
        const g = liquidityBreakdownData.find((x) => x.id === groupId);
        return `Quỹ Sinh hoạt: ${g?.name || groupId}`;
      }
      if (id === 'liquidity') return 'Quỹ Thanh khoản Sinh hoạt';
      return 'Dòng tiền';
    }
    if (type === 'pool') {
      if (id === 'saving') return 'Quỹ Tiết kiệm tích lũy';
      if (id === 'debt_reserve') return 'Quỹ Dự phòng tích lũy';
      return 'Quỹ tích lũy';
    }
    if (type === 'life_event') {
      const ev = state.lifeEvents?.find(e => e.id === id);
      return ev ? ev.name : 'Sự kiện cuộc đời';
    }
    if (type === 'savings') {
      const s = state.savingsDeposits?.find(sd => sd.id === id);
      return s ? `Sổ TK: ${s.name}` : 'Sổ Tiết kiệm';
    }
    if (type === 'investment') {
      const d = state.investmentDeals?.find(deal => deal.id === id);
      return d ? `Thương vụ: ${d.name}` : 'Thương vụ đầu tư';
    }
    if (type === 'sinking_fund') {
      const sf = state.sinkingFunds?.find(f => f.id === id);
      return sf ? `Quỹ: ${sf.name}` : 'Quỹ mục tiêu';
    }
    return type;
  };

  const getDestLabel = (type: string, id?: string) => {
    if (type === 'cashflow') {
      if (!id || id === 'investable') return 'Quỹ Đầu tư Nhàn rỗi / Chưa có kế hoạch';
      if (id === 'unallocated') return 'Nguồn tiền dôi ra khi phân bổ ngân sách';
      if (id?.startsWith('liquidity_group_')) {
        const groupId = id.replace('liquidity_group_', '');
        const g = liquidityBreakdownData.find((x) => x.id === groupId);
        return `Quỹ Sinh hoạt: ${g?.name || groupId}`;
      }
      if (id === 'liquidity') return 'Quỹ Thanh khoản Sinh hoạt';
      return 'Dòng tiền';
    }
    if (type === 'pool') {
      if (id === 'saving') return 'Quỹ Tiết kiệm tích lũy';
      if (id === 'debt_reserve') return 'Quỹ Dự phòng tích lũy';
      return 'Quỹ tích lũy';
    }
    if (type === 'life_event') {
      const ev = state.lifeEvents?.find(e => e.id === id);
      return ev ? ev.name : 'Sự kiện cuộc đời';
    }
    if (type === 'savings') {
      if (id === 'new') return 'Sổ TK: Mở sổ mới';
      const s = state.savingsDeposits?.find(sd => sd.id === id);
      return s ? `Sổ TK: ${s.name}` : 'Sổ Tiết kiệm';
    }
    if (type === 'investment') {
      const d = state.investmentDeals?.find(deal => deal.id === id);
      return d ? `Thương vụ: ${d.name}` : 'Thương vụ đầu tư';
    }
    if (type === 'sinking_fund') {
      const sf = state.sinkingFunds?.find(f => f.id === id);
      return sf ? `Quỹ: ${sf.name}` : 'Quỹ mục tiêu';
    }
    if (type === 'debt') {
      const d = state.debts?.find(deb => deb.id === id);
      return d ? `Trả nợ: ${d.name}` : 'Trả nợ';
    }
    return type;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-family-text flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-blue-500" />
            Điều Chuyển Dòng Tiền
          </h2>
          <p className="text-family-textMuted text-sm mt-1">
            Ghi nhận và mô phỏng các nghiệp vụ chuyển tiền thực tế giữa các nguồn.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ObservationControls />
        </div>
      </div>

      {showTransferForm && (
         <div className="mb-8">
            <TransferForm onSuccess={() => setShowTransferForm(false)} onCancel={() => setShowTransferForm(false)} />
         </div>
      )}

      {/* Scenarios Guide */}
      <Card className="border border-amber-300/30 bg-gradient-to-br from-amber-50/80 to-orange-50/50 overflow-hidden">
        <CardHeader className="pb-2 cursor-pointer select-none" onClick={() => setShowGuide(!showGuide)}>
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2 text-amber-700">
              <Lightbulb className="w-4 h-4" />
              Hướng dẫn: Các kịch bản Điều chuyển dòng tiền thực tế
              <HelpTooltip text="Đây là các ví dụ minh họa cụ thể để bạn hiểu cách sử dụng tính năng Điều chuyển. Nhấn vào tiêu đề để thu gọn/mở rộng." />
            </span>
            <span className="text-amber-500">
              {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          </CardTitle>
        </CardHeader>
        {showGuide && (
          <CardContent className="pt-0 pb-5 px-5">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-2">
                  {/* Scenario 1 */}
              <div className="bg-white/70 rounded-xl p-3.5 border border-amber-200/40 space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">💰</span>
                  <span className="text-xs font-bold text-amber-800">Kịch bản 1: Gửi Tiết kiệm từ Quỹ Nhàn rỗi</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Bạn có <strong>100 triệu</strong> tiền nhàn rỗi, muốn gửi mở sổ tiết kiệm để tối ưu tiền lãi.
                </p>
                <div className="bg-amber-50 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-amber-900">
                  <span className="text-red-500 font-bold">TỪ:</span> Quỹ Đầu tư Nhàn rỗi<br/>
                  <span className="text-emerald-600 font-bold">ĐẾN:</span> Sổ TK: Mở sổ mới<br/>
                  <span className="text-blue-600 font-bold">SỐ TIỀN:</span> 100 triệu
                </div>
                <div className="bg-sky-50 rounded-lg px-2.5 py-1.5 text-[10px] text-sky-800 border border-sky-100">
                  <span className="font-bold">📍 Nguồn tiền lấy ở đâu?</span><br/>
                  Tiền được lấy từ phần <strong>Dòng tiền nhàn rỗi</strong> chưa phân bổ. Sau khi chuyển, dòng tiền nhàn rỗi giảm đi và một sổ tiết kiệm mới được khởi tạo.
                </div>
              </div>

              {/* Scenario 2 */}
              <div className="bg-white/70 rounded-xl p-3.5 border border-amber-200/40 space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🏦</span>
                  <span className="text-xs font-bold text-amber-800">Kịch bản 2: Gửi Tiết kiệm từ Thưởng</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Bạn nhận <strong>Thưởng Tết 50 triệu</strong> (Sự kiện), muốn tạo ngay một Sổ tiết kiệm.
                </p>
                <div className="bg-amber-50 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-amber-900">
                  <span className="text-red-500 font-bold">TỪ:</span> Sự kiện: Thưởng Tết 2026<br/>
                  <span className="text-emerald-600 font-bold">ĐẾN:</span> Sổ TK: Mở sổ mới<br/>
                  <span className="text-blue-600 font-bold">SỐ TIỀN:</span> 50 triệu
                </div>
                <div className="bg-sky-50 rounded-lg px-2.5 py-1.5 text-[10px] text-sky-800 border border-sky-100">
                  <span className="font-bold">📍 Nguồn tiền lấy ở đâu?</span><br/>
                  Tiền đến từ một khoản thu nhập đột xuất trong màn hình <strong>Sự kiện Cuộc đời</strong>. Số tiền dư của sự kiện sẽ giảm, và hệ thống giúp bạn mở sổ tiết kiệm mới.
                </div>
              </div>

              {/* Scenario 3 */}
              <div className="bg-white/70 rounded-xl p-3.5 border border-amber-200/40 space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🎯</span>
                  <span className="text-xs font-bold text-amber-800">Kịch bản 3: Chuyển Dòng tiền Sinh hoạt sang Nhàn rỗi</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Quỹ sinh hoạt dôi dư <strong>20 triệu</strong>, bạn muốn điều chuyển sang Quỹ Đầu tư Nhàn rỗi.
                </p>
                <div className="bg-amber-50 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-amber-900">
                  <span className="text-red-500 font-bold">TỪ:</span> Quỹ Thanh khoản Sinh hoạt<br/>
                  <span className="text-emerald-600 font-bold">ĐẾN:</span> Quỹ Đầu tư Nhàn rỗi (Bổ sung vào)<br/>
                  <span className="text-blue-600 font-bold">SỐ TIỀN:</span> 20 triệu
                </div>
                <div className="bg-sky-50 rounded-lg px-2.5 py-1.5 text-[10px] text-sky-800 border border-sky-100">
                  <span className="font-bold">📍 Nguồn tiền lấy ở đâu?</span><br/>
                  Tiền lấy từ <strong>Quỹ Thanh khoản Sinh hoạt</strong> dôi dư. Quỹ sinh hoạt giảm 20 triệu, và Quỹ Đầu tư Nhàn rỗi tăng thêm 20 triệu.
                </div>
              </div>

              {/* Scenario 4 */}
              <div className="bg-white/70 rounded-xl p-3.5 border border-amber-200/40 space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🔄</span>
                  <span className="text-xs font-bold text-amber-800">Kịch bản 4: Tất toán Tiết kiệm về Quỹ Nhàn rỗi</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Sổ tiết kiệm <strong>12 tháng đáo hạn</strong>, bạn tất toán 200 triệu về Quỹ Đầu tư Nhàn rỗi.
                </p>
                <div className="bg-amber-50 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-amber-900">
                  <span className="text-red-500 font-bold">TỪ:</span> Sổ TK: BIDV 12T (Tất toán)<br/>
                  <span className="text-emerald-600 font-bold">ĐẾN:</span> Quỹ Đầu tư Nhàn rỗi (Bổ sung vào)<br/>
                  <span className="text-blue-600 font-bold">SỐ TIỀN:</span> 200 triệu
                </div>
                <div className="bg-sky-50 rounded-lg px-2.5 py-1.5 text-[10px] text-sky-800 border border-sky-100">
                  <span className="font-bold">📍 Nguồn tiền lấy ở đâu?</span><br/>
                  Tiền đến từ <strong>Sổ tiết kiệm đang hoạt động</strong>. Khi rút tất toán, số gốc của sổ bị trừ 200 triệu và chảy về Quỹ Nhàn rỗi.
                </div>
              </div>

              {/* Scenario 5 */}
              <div className="bg-white/70 rounded-xl p-3.5 border border-amber-200/40 space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🛡️</span>
                  <span className="text-xs font-bold text-amber-800">Kịch bản 5: Chuyển Dòng tiền Sinh hoạt sang Tiết kiệm</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Quỹ thanh khoản sinh hoạt dôi dư <strong>50 triệu</strong>, bạn muốn gửi tiết kiệm mới.
                </p>
                <div className="bg-amber-50 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-amber-900">
                  <span className="text-red-500 font-bold">TỪ:</span> Quỹ Thanh khoản Sinh hoạt<br/>
                  <span className="text-emerald-600 font-bold">ĐẾN:</span> Sổ TK: Mở sổ mới<br/>
                  <span className="text-blue-600 font-bold">SỐ TIỀN:</span> 50 triệu
                </div>
                <div className="bg-sky-50 rounded-lg px-2.5 py-1.5 text-[10px] text-sky-800 border border-sky-100">
                  <span className="font-bold">📍 Nguồn tiền lấy ở đâu?</span><br/>
                  Tiền được chuyển từ <strong>Quỹ Thanh khoản Sinh hoạt</strong> dôi dư sang tạo sổ tiết kiệm mới nhằm tối ưu tiền lãi.
                </div>
              </div>

            </div>
          </CardContent>
        )}
      </Card>

      <Card className="border border-family-accent/20 bg-family-bgDeep overflow-hidden">
        <CardHeader className="border-b border-family-accent/10 pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-500" /> Lịch sử Điều chuyển dòng tiền
          </CardTitle>
          {!showTransferForm && (
            <Button onClick={() => setShowTransferForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shrink-0">
              <Plus className="w-4 h-4" /> Thực hiện Điều chuyển
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {fundTransfers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-family-bgDark/50 border-b border-family-accent/10 text-family-textMuted text-xs uppercase">
                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Thời gian</th>
                    <th className="px-6 py-4 font-semibold">Giao dịch</th>
                    <th className="px-6 py-4 font-semibold text-right whitespace-nowrap">Số tiền (triệu VND)</th>
                    <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-family-accent/10">
                  {fundTransfers.slice().sort((a, b) => b.createdAt - a.createdAt).map(tf => (
                    <tr key={tf.id} className="hover:bg-family-bgDark/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-family-textMuted text-xs">
                        {new Date(tf.createdAt).toLocaleString('vi-VN')}
                        <div className="text-[10px] text-blue-400 font-medium">Kỳ: Tháng {tf.month}/{tf.year}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-red-400 font-medium bg-red-400/10 px-2 py-0.5 rounded text-xs">
                            {getSourceLabel(tf.sourceType, tf.sourceId)}
                          </span>
                          <span className="text-family-textMuted text-xs">➔</span>
                          <span className="text-green-400 font-medium bg-green-400/10 px-2 py-0.5 rounded text-xs">
                            {getDestLabel(tf.destinationType, tf.destinationId)}
                          </span>
                        </div>
                        {tf.note && (
                          <div className="text-xs text-family-textMuted mt-1 italic opacity-80">{tf.note}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-family-textLight whitespace-nowrap">
                        {formatMoneyVNDMillion(tf.amount)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => { if(window.confirm('Bạn có chắc chắn muốn hoàn tác lệnh điều chuyển dòng tiền này?')) deleteFundTransfer(tf.id); }}
                          className="text-amber-400 hover:text-amber-300 border-amber-500/20 hover:bg-amber-500/10 h-7 text-xs gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Hoàn tác
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
             <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 mb-4">
                  <ArrowRightLeft className="w-6 h-6" />
                </div>
                <h3 className="text-family-text font-semibold mb-1">Chưa có giao dịch điều chuyển nào</h3>
                <p className="text-family-textMuted text-sm max-w-sm mx-auto">
                   Mô phỏng các luồng tiền thực tế của gia đình bạn bằng cách thực hiện các Lệnh điều chuyển giữa Tài sản, Dòng tiền và Công nợ.
                </p>
                <Button onClick={() => setShowTransferForm(true)} variant="outline" className="mt-4 border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                   Thực hiện lệnh đầu tiên
                </Button>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
