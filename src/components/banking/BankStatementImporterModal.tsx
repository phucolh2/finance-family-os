import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Check, X, AlertCircle, Sparkles } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { getActiveActor } from '../../config/familyMembers';

interface ParsedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number; // in VND
  suggestedCategory: 'living' | 'housing' | 'savings' | 'investments' | 'debts' | 'other';
  selected: boolean;
}

interface BankStatementImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BankStatementImporterModal: React.FC<BankStatementImporterModalProps> = ({ isOpen, onClose }) => {
  const { addLifeEvent, pushSystemLog } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  // Thuật toán gợi ý phân loại giao dịch thông minh
  const classifyTransaction = (desc: string): ParsedTransaction['suggestedCategory'] => {
    const d = desc.toLowerCase();
    if (d.includes('tiet kiem') || d.includes('gui tiet kiem') || d.includes('sotk') || d.includes('saving')) {
      return 'savings';
    }
    if (d.includes('dau tu') || d.includes('chung khoan') || d.includes('co phieu') || d.includes('vang') || d.includes('crypto')) {
      return 'investments';
    }
    if (d.includes('vay') || d.includes('tra no') || d.includes('tin dung') || d.includes('tra gop') || d.includes('the tin dung')) {
      return 'debts';
    }
    if (d.includes('dien') || d.includes('nuoc') || d.includes('internet') || d.includes('viettel') || d.includes('chung cu') || d.includes('tien nha') || d.includes('quan ly')) {
      return 'housing';
    }
    if (d.includes('an') || d.includes('cho') || d.includes('sieu thi') || d.includes('grab') || d.includes('food') || d.includes('shopee') || d.includes('winmart') || d.includes('bach hoa')) {
      return 'living';
    }
    return 'living';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg(null);
    setSuccessCount(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
          setErrorMsg('Tệp CSV trống hoặc không đúng định dạng.');
          return;
        }

        const parsed: ParsedTransaction[] = [];
        // Bỏ qua dòng header nếu có
        const dataLines = lines.slice(1);

        dataLines.forEach((line, index) => {
          // Xử lý dấu phẩy hoặc chấm phẩy
          const parts = line.includes(';') ? line.split(';') : line.split(',');
          if (parts.length >= 3) {
            const rawDate = parts[0]?.replace(/"/g, '').trim();
            const rawDesc = parts[1]?.replace(/"/g, '').trim() || 'Giao dịch ngân hàng';
            const rawAmount = parts[2]?.replace(/[^\d.-]/g, '');

            const numAmount = Math.abs(parseFloat(rawAmount) || 0);
            if (numAmount > 0) {
              parsed.push({
                id: `tx_${Date.now()}_${index}`,
                date: rawDate,
                description: rawDesc,
                amount: numAmount,
                suggestedCategory: classifyTransaction(rawDesc),
                selected: true
              });
            }
          }
        });

        if (parsed.length === 0) {
          setErrorMsg('Không tìm thấy giao dịch hợp lệ. Cột mẫu khuyến nghị: Ngày, Diễn giải, Số tiền.');
        } else {
          setTransactions(parsed);
        }
      } catch (err: any) {
        setErrorMsg(`Lỗi đọc file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleImportSelected = () => {
    const selectedTxs = transactions.filter(t => t.selected);
    if (selectedTxs.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất một giao dịch để nhập.');
      return;
    }

    const now = new Date();
    const actor = getActiveActor();

    selectedTxs.forEach(tx => {
      // Phân tách ngày nếu có
      let txMonth = now.getMonth() + 1;
      let txYear = now.getFullYear();
      if (tx.date) {
        const d = new Date(tx.date);
        if (!isNaN(d.getTime())) {
          txMonth = d.getMonth() + 1;
          txYear = d.getFullYear();
        }
      }

      // Thêm vào LifeEvents dưới dạng sự kiện chi tiêu thực tế
      addLifeEvent({
        name: tx.description.slice(0, 50),
        amount: tx.amount / 1_000_000, // đổi sang triệu VND
        month: txMonth,
        year: txYear,
        type: 'other',
        source: 'cashflow',
        spendingCategory: 'living_daily',
        affectsNetWorth: true,
        note: `Sao kê tự động: ${tx.description} (${tx.date})`
      });
    });

    pushSystemLog(
      'THÊM MỚI',
      'Sao kê ngân hàng',
      `Đã nhập tự động ${selectedTxs.length} giao dịch từ tệp ${fileName}`,
      actor === 'wife' ? 'Vợ' : 'Chồng'
    );

    setSuccessCount(selectedTxs.length);
    setTransactions([]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-family-accent/15 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Nhập Sao Kê Ngân Hàng (CSV)</h3>
              <p className="text-xs text-slate-500">Tự động phân loại chi tiêu vào 4 Trụ cột Ngân sách gia đình</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successCount !== null && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2.5">
              <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong>Nhập thành công!</strong> Đã thêm {successCount} giao dịch vào hệ thống chi tiêu và nhật ký chung tay.
              </div>
            </div>
          )}

          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/60 p-6 rounded-2xl text-center cursor-pointer transition-all space-y-2"
          >
            <input
              type="file"
              accept=".csv,.txt"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-700">
              {fileName ? `Đã chọn: ${fileName}` : 'Bấm vào đây để tải lên tệp Sao kê CSV'}
            </p>
            <p className="text-[11px] text-slate-400">
              Hỗ trợ sao kê ngân hàng VCB, Techcombank, MB, ACB... (Cột: Ngày, Nội dung, Số tiền)
            </p>
          </div>

          {/* Transaction Preview Table */}
          {transactions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
                <span>Xem trước ({transactions.length} giao dịch tìm thấy):</span>
                <span className="text-[11px] text-indigo-600 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Tự động gợi ý hạng mục
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                {transactions.map(t => (
                  <div key={t.id} className="p-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={t.selected}
                      onChange={e => {
                        setTransactions(prev => prev.map(item => item.id === t.id ? { ...item, selected: e.target.checked } : item));
                      }}
                      className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{t.description}</p>
                      <span className="text-[10px] text-slate-400">{t.date}</span>
                    </div>
                    <span className="font-bold text-slate-700 whitespace-nowrap">
                      {(t.amount / 1_000_000).toFixed(2)} tr
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                      {t.suggestedCategory === 'living' ? 'Sinh hoạt' :
                       t.suggestedCategory === 'housing' ? 'Nhà ở' :
                       t.suggestedCategory === 'savings' ? 'Tiết kiệm' :
                       t.suggestedCategory === 'investments' ? 'Đầu tư' : 'Trả nợ'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
          {transactions.length > 0 && (
            <button
              type="button"
              onClick={handleImportSelected}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Xác nhận nhập ({transactions.filter(t => t.selected).length})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
