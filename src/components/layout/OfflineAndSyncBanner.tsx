import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { WifiOff, RefreshCw, CheckCircle2, X } from 'lucide-react';

export const OfflineAndSyncBanner: React.FC = () => {
  const { isOnline, lastPartnerSync } = useAppContext();
  const [partnerNotice, setPartnerNotice] = useState<{ by: string; at: string } | null>(null);
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    if (!lastPartnerSync) return;
    setPartnerNotice(lastPartnerSync);
    setShowNotice(true);
    const timer = setTimeout(() => {
      setShowNotice(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [lastPartnerSync]);

  return (
    <>
      {/* 1. Offline Mode Banner */}
      {!isOnline && (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-900 flex items-center justify-between gap-3 shadow-2xs select-none print:hidden animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5 max-w-4xl mx-auto w-full">
            <span className="p-1 rounded-md bg-amber-500/20 text-amber-700 shrink-0">
              <WifiOff className="w-4 h-4" />
            </span>
            <div className="flex-1 leading-relaxed">
              <span className="font-bold text-amber-950">Đang ngoại tuyến (Offline): </span>
              <span>
                Mất kết nối Internet. Mọi thao tác nhập sổ, chi tiêu vẫn được lưu trên máy và sẽ <strong>tự động đồng bộ lên Cloud</strong> ngay khi có mạng trở lại.
              </span>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 border border-amber-500/30 shrink-0 hidden sm:inline-block">
              PWA Offline Ready
            </span>
          </div>
        </div>
      )}

      {/* 2. Partner Live Sync Toast Notification */}
      {showNotice && partnerNotice && (
        <aside
          role="status"
          aria-live="polite"
          aria-label="Thông báo đồng bộ dữ liệu"
          className="fixed top-16 right-4 z-50 max-w-sm w-full bg-white/95 backdrop-blur-md border border-emerald-500/30 rounded-2xl shadow-xl p-3.5 flex items-start gap-3 animate-in slide-in-from-top-4 duration-300 print:hidden"
        >
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 shrink-0 mt-0.5">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-0.5">
              <span>Đồng bộ thời gian thực</span>
              <RefreshCw className="w-3 h-3 text-emerald-600 animate-spin" />
            </div>
            <p className="text-slate-600 leading-normal">
              <strong className="text-emerald-800">{partnerNotice.by}</strong> vừa cập nhật dữ liệu tài chính. Giao diện của bạn đã được cập nhật đồng nhất!
            </p>
          </div>
          <button
            onClick={() => setShowNotice(false)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Đóng thông báo"
            aria-label="Đóng thông báo"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </aside>
      )}
    </>
  );
};
