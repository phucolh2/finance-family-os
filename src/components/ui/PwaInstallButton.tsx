import React, { useState } from 'react';
import { usePwaInstall } from '../../hooks/usePwaInstall';
import { Smartphone, Download, Share2, PlusSquare, X, CheckCircle2 } from 'lucide-react';

interface PwaInstallButtonProps {
  className?: string;
  variant?: 'button' | 'card' | 'compact';
}

export const PwaInstallButton: React.FC<PwaInstallButtonProps> = ({
  className = '',
  variant = 'button',
}) => {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePwaInstall();
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIosGuide(true);
      return;
    }
    if (isInstallable) {
      setIsInstalling(true);
      await promptInstall();
      setIsInstalling(false);
    } else {
      // Fallback instruction for browsers without direct prompt
      setShowIosGuide(true);
    }
  };

  if (isInstalled) {
    if (variant === 'card') {
      return (
        <div className={`flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 ${className}`}>
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-700 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Ứng dụng đã được cài đặt (PWA)</h4>
            <p className="text-xs text-emerald-700">Family OS đang chạy ở chế độ app độc lập trên thiết bị của bạn.</p>
          </div>
        </div>
      );
    }
    return null; // Don't clutter header if already standalone
  }

  return (
    <>
      {variant === 'compact' ? (
        <button
          onClick={handleInstallClick}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-900 transition-colors shadow-2xs text-xs font-bold cursor-pointer ${className}`}
          title="Cài đặt Family OS lên điện thoại hoặc máy tính"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-600" />
          <span>Cài App</span>
        </button>
      ) : variant === 'card' ? (
        <div className={`p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-500/15 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${className}`}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-700 shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <span>Cài đặt ứng dụng lên Điện thoại (PWA)</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800">Tiện lợi</span>
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Mở app trực tiếp từ màn hình chính như ứng dụng native, tải cực nhanh và chạy offline mượt mà.
              </p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            disabled={isInstalling}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>{isInstalling ? 'Đang cài đặt...' : 'Cài đặt lên Màn hình chính'}</span>
          </button>
        </div>
      ) : (
        <button
          onClick={handleInstallClick}
          disabled={isInstalling}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs shadow-2xs transition-all cursor-pointer ${className}`}
          title="Cài đặt ứng dụng lên màn hình chính điện thoại"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-600" />
          <span>Cài đặt App</span>
        </button>
      )}

      {/* iOS Installation Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowIosGuide(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-amber-100 text-amber-700">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Cài đặt ứng dụng lên điện thoại</h3>
                <p className="text-xs text-slate-500">Dành cho iPhone, iPad và trình duyệt di động</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-slate-700 my-4 bg-amber-50/50 p-4 rounded-2xl border border-amber-200/50">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-900 font-bold flex items-center justify-center shrink-0 text-xs">1</span>
                <p className="leading-relaxed">
                  Đảm bảo bạn đang mở website bằng trình duyệt <strong>Safari</strong> (hoặc Chrome trên Android).
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-900 font-bold flex items-center justify-center shrink-0 text-xs">2</span>
                <p className="leading-relaxed flex items-center gap-1.5 flex-wrap">
                  Nhấn vào nút <strong>Chia sẻ</strong> <Share2 className="w-4 h-4 text-blue-600 inline" /> ở thanh công cụ dưới đáy màn hình.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-900 font-bold flex items-center justify-center shrink-0 text-xs">3</span>
                <p className="leading-relaxed flex items-center gap-1.5 flex-wrap">
                  Cuộn xuống danh sách tác vụ và chọn <strong>"Thêm vào Màn hình chính"</strong> (Add to Home Screen) <PlusSquare className="w-4 h-4 text-slate-700 inline" />.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-900 font-bold flex items-center justify-center shrink-0 text-xs">4</span>
                <p className="leading-relaxed">
                  Nhấn <strong>"Thêm" (Add)</strong> ở góc trên bên phải để hoàn tất. Biểu tượng Family OS sẽ xuất hiện trên màn hình điện thoại như ứng dụng chuyên nghiệp!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Tôi đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
};
