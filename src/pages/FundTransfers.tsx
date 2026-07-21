import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowRightLeft, Plus, History, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import { TransferForm } from '../components/transfer/TransferForm';
import { ObservationControls } from '../components/ui/ObservationControls';
import { formatMoneyVNDMillion } from '../utils/format';

export const FundTransfers: React.FC = () => {
  const { state, deleteFundTransfer } = useAppContext();
  const { fundTransfers = [] } = state;
  
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  const getSourceLabel = (type: string, id?: string) => {
    switch (type) {
      case 'cashflow': return 'Ngân sách Dòng tiền';
      case 'life_event': return `Sự kiện: ${state.lifeEvents?.find(e => e.id === id)?.name || 'N/A'}`;
      case 'savings': return `Tiết kiệm: ${state.savingsDeposits?.find(s => s.id === id)?.name || 'N/A'}`;
      case 'investment': return `Đầu tư: ${state.investmentDeals?.find(d => d.id === id)?.name || 'N/A'}`;
      case 'sinking_fund': return `Quỹ: ${state.sinkingFunds?.find(f => f.id === id)?.name || 'N/A'}`;
      default: return type;
    }
  };

  const getDestLabel = (type: string, id?: string) => {
    switch (type) {
      case 'savings': return 'Sổ tiết kiệm mới';
      case 'investment': return `Đầu tư: ${state.investmentDeals?.find(d => d.id === id)?.name || 'N/A'}`;
      case 'sinking_fund': return `Quỹ: ${state.sinkingFunds?.find(f => f.id === id)?.name || 'N/A'}`;
      case 'debt': return `Trả nợ: ${state.debts?.find(d => d.id === id)?.name || 'N/A'}`;
      default: return type;
    }
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
          {!showTransferForm && (
            <Button onClick={() => setShowTransferForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shrink-0">
              <Plus className="w-4 h-4" /> Thực hiện Điều chuyển
            </Button>
          )}
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
                  <span className="text-xs font-bold text-amber-800">Kịch bản 1: Rót vốn vào Thương vụ</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Bạn có <strong>100 Tr</strong> tiền nhàn rỗi trên Danh mục Đầu tư, muốn rót vào thương vụ chứng khoán VIX.
                </p>
                <div className="bg-amber-50 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-amber-900">
                  <span className="text-red-500 font-bold">TỪ:</span> Dòng tiền Nhàn rỗi (Chưa phân bổ + Sinh hoạt dư)<br/>
                  <span className="text-emerald-600 font-bold">ĐẾN:</span> Bơm vốn Thương vụ: VIX<br/>
                  <span className="text-blue-600 font-bold">SỐ TIỀN:</span> 100 Tr
                </div>
                <div className="bg-sky-50 rounded-lg px-2.5 py-1.5 text-[10px] text-sky-800 border border-sky-100">
                  <span className="font-bold">📍 Nguồn tiền lấy ở đâu?</span><br/>
                  Số tiền này chính là <strong>Dòng tiền nhàn rỗi</strong> chưa có kế hoạch cụ thể, cộng dồn từ phần Thu nhập chưa phân bổ hết và các khoản Ngân sách (như Sinh hoạt phí) còn dư trong tháng. Sau khi chuyển, dòng tiền nhàn rỗi sẽ giảm đi, và vốn thương vụ VIX tăng thêm 100 Tr.
                </div>
              </div>

              {/* Scenario 2 */}
              <div className="bg-white/70 rounded-xl p-3.5 border border-amber-200/40 space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🏦</span>
                  <span className="text-xs font-bold text-amber-800">Kịch bản 2: Gửi Tiết kiệm Ngân hàng</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Bạn nhận <strong>thưởng Tết 50 Tr</strong> (Sự kiện cuộc đời), muốn gửi tiết kiệm ngân hàng để an toàn.
                </p>
                <div className="bg-amber-50 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-amber-900">
                  <span className="text-red-500 font-bold">TỪ:</span> Tiền dôi dư: Thưởng Tết 2026<br/>
                  <span className="text-emerald-600 font-bold">ĐẾN:</span> Mở Sổ tiết kiệm mới<br/>
                  <span className="text-blue-600 font-bold">SỐ TIỀN:</span> 50 Tr
                </div>
                <div className="bg-sky-50 rounded-lg px-2.5 py-1.5 text-[10px] text-sky-800 border border-sky-100">
                  <span className="font-bold">📍 Nguồn tiền lấy ở đâu?</span><br/>
                  Tiền này đến từ <strong>màn hình Sự kiện Cuộc đời</strong> — một khoản thu nhập đột xuất (thưởng, quà tặng, bán tài sản cũ...). Sau khi chuyển, số tiền Sự kiện bị trừ 50 Tr và hệ thống <em>tự tạo một Sổ tiết kiệm mới</em> với DNA nguồn = "idle" (vì nguồn gốc không phải Quỹ phòng thủ).
                </div>
              </div>

              {/* Scenario 3 */}
              <div className="bg-white/70 rounded-xl p-3.5 border border-amber-200/40 space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🎯</span>
                  <span className="text-xs font-bold text-amber-800">Kịch bản 3: Bơm tiền Quỹ tích lũy</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Bạn chốt lời thương vụ Vàng được <strong>200 Tr</strong>, muốn dội thẳng vào Quỹ mua nhà để rút ngắn thời gian đạt mục tiêu.
                </p>
                <div className="bg-amber-50 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-amber-900">
                  <span className="text-red-500 font-bold">TỪ:</span> Rút vốn Thương vụ: Vàng SJC<br/>
                  <span className="text-emerald-600 font-bold">ĐẾN:</span> Bơm tiền Quỹ: Mua nhà 2028<br/>
                  <span className="text-blue-600 font-bold">SỐ TIỀN:</span> 200 Tr
                </div>
                <div className="bg-sky-50 rounded-lg px-2.5 py-1.5 text-[10px] text-sky-800 border border-sky-100">
                  <span className="font-bold">📍 Nguồn tiền lấy ở đâu?</span><br/>
                  Tiền đến từ <strong>một Thương vụ đang hoạt động trên màn hình Danh mục Đầu tư</strong>. Cụ thể là bạn rút bớt vốn gốc từ thương vụ Vàng SJC (200 Tr). Sau khi chuyển, vốn thương vụ Vàng giảm 200 Tr, và Quỹ mua nhà tăng thêm 200 Tr tiền mặt — giúp đạt mục tiêu nhanh hơn.
                </div>
              </div>

              {/* Scenario 4 */}
              <div className="bg-white/70 rounded-xl p-3.5 border border-amber-200/40 space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">💳</span>
                  <span className="text-xs font-bold text-amber-800">Kịch bản 4: Trả nợ sớm</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Quỹ chuẩn bị trả nợ đã đủ <strong>300 Tr</strong>, bạn quyết định tất toán sớm khoản vay mua xe.
                </p>
                <div className="bg-amber-50 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-amber-900">
                  <span className="text-red-500 font-bold">TỪ:</span> Số dư Quỹ Chuẩn bị Trả nợ<br/>
                  <span className="text-emerald-600 font-bold">ĐẾN:</span> Trả nợ sớm: Vay mua xe<br/>
                  <span className="text-blue-600 font-bold">SỐ TIỀN:</span> 300 Tr
                </div>
                <div className="bg-sky-50 rounded-lg px-2.5 py-1.5 text-[10px] text-sky-800 border border-sky-100">
                  <span className="font-bold">📍 Nguồn tiền lấy ở đâu?</span><br/>
                  Tiền đến từ <strong>Quỹ Chuẩn bị Trả nợ trên màn hình Tiết kiệm &amp; Nợ</strong>. Quỹ này được nuôi hàng tháng bằng phần "Ngân sách Trả nợ" mà bạn đã thiết lập trên màn hình <em>Kế hoạch Thu nhập</em>. Sau khi chuyển, Quỹ bị trừ 300 Tr, và Dư nợ gốc khoản vay mua xe cũng giảm 300 Tr. <em>Hệ thống chặn cứng nếu số trả vượt dư nợ gốc.</em>
                </div>
              </div>

              {/* Scenario 5 */}
              <div className="bg-white/70 rounded-xl p-3.5 border border-amber-200/40 space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🔄</span>
                  <span className="text-xs font-bold text-amber-800">Kịch bản 5: Tái đầu tư Tiết kiệm đáo hạn</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Sổ tiết kiệm <strong>12 tháng đáo hạn</strong> (Gốc 200 Tr), bạn muốn rót vào thương vụ Bất động sản.
                </p>
                <div className="bg-amber-50 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-amber-900">
                  <span className="text-red-500 font-bold">TỪ:</span> Tất toán Sổ tiết kiệm: BIDV 12T<br/>
                  <span className="text-emerald-600 font-bold">ĐẾN:</span> Bơm vốn Thương vụ: BĐS Quận 9<br/>
                  <span className="text-blue-600 font-bold">SỐ TIỀN:</span> 200 Tr
                </div>
                <div className="bg-sky-50 rounded-lg px-2.5 py-1.5 text-[10px] text-sky-800 border border-sky-100">
                  <span className="font-bold">📍 Nguồn tiền lấy ở đâu?</span><br/>
                  Tiền đến từ <strong>một Sổ tiết kiệm đang hoạt động trên màn hình Tiết kiệm &amp; Nợ</strong> (hoặc trên Danh mục Đầu tư nếu là sổ "idle"). Khi rút, số gốc của Sổ cũ bị trừ 200 Tr. Tiền này chảy sang tăng vốn cho thương vụ BĐS Quận 9 trên màn hình Danh mục Đầu tư.
                </div>
              </div>

              {/* Scenario 6 */}
              <div className="bg-white/70 rounded-xl p-3.5 border border-amber-200/40 space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🏠</span>
                  <span className="text-xs font-bold text-amber-800">Kịch bản 6: Giải ngân Quỹ → Thương vụ</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Quỹ tích lũy mua nhà đã đạt mục tiêu <strong>500 Tr</strong>, bạn muốn giải ngân để tạo Thương vụ BĐS mới.
                </p>
                <div className="bg-amber-50 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-amber-900">
                  <span className="text-red-500 font-bold">TỪ:</span> Tất toán Quỹ: Mua nhà 2028<br/>
                  <span className="text-emerald-600 font-bold">ĐẾN:</span> Bơm vốn Thương vụ: Chung cư Q2<br/>
                  <span className="text-blue-600 font-bold">SỐ TIỀN:</span> 500 Tr
                </div>
                <div className="bg-sky-50 rounded-lg px-2.5 py-1.5 text-[10px] text-sky-800 border border-sky-100">
                  <span className="font-bold">📍 Nguồn tiền lấy ở đâu?</span><br/>
                  Tiền đến từ <strong>Quỹ tích lũy mục tiêu trên màn hình Danh mục Đầu tư</strong>. Quỹ này được nuôi hàng tháng bằng phần "Ngân sách Đầu tư" mà bạn đã thiết lập trên màn hình <em>Kế hoạch Thu nhập</em>. Khi giải ngân, Quỹ bị trừ 500 Tr và vốn Thương vụ Chung cư Q2 tăng 500 Tr. <em>Lưu ý: Tạo Thương vụ trước ở màn hình Đầu tư, rồi quay lại đây chuyển tiền.</em>
                </div>
              </div>

            </div>
          </CardContent>
        )}
      </Card>

      <Card className="border border-family-accent/20 bg-family-bgDeep overflow-hidden">
        <CardHeader className="border-b border-family-accent/10 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-500" /> Lịch sử Điều chuyển (Ledger)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {fundTransfers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-family-bgDark/50 border-b border-family-accent/10 text-family-textMuted text-xs uppercase">
                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Thời gian</th>
                    <th className="px-6 py-4 font-semibold">Giao dịch</th>
                    <th className="px-6 py-4 font-semibold text-right whitespace-nowrap">Số tiền (Tr VND)</th>
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
                          onClick={() => { if(window.confirm('Bạn có chắc muốn xóa lịch sử này? Lưu ý: Việc xóa chỉ xóa log, không tự động Rollback số dư trong phiên bản hiện tại.')) deleteFundTransfer(tf.id); }}
                          className="text-red-400 hover:text-red-300 border-red-500/20 hover:bg-red-500/10 h-7 text-xs"
                        >
                          Xóa log
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
