import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import type { FallbackProps } from 'react-error-boundary';
import { ShieldAlert, RefreshCw, Download, Trash2 } from 'lucide-react';

const ErrorFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  const handleResetData = () => {
    if (window.confirm("CẢNH BÁO: Thao tác này sẽ XÓA TOÀN BỘ dữ liệu của bạn và khôi phục về trạng thái mặc định ban đầu. Bạn có chắc chắn muốn thực hiện?")) {
      localStorage.removeItem('finance_family_os_state');
      window.location.reload();
    }
  };

  const handleDownloadError = () => {
    const err = error as Error;
    const errorData = {
      message: err.message || String(error),
      stack: err.stack,
      time: new Date().toISOString(),
      userAgent: navigator.userAgent
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(errorData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `error_log_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-family-bg flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-family-bgDeep border border-red-500/20 rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-red-500/10 p-6 flex flex-col items-center text-center border-b border-red-500/20">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-red-600 mb-2">Hệ thống gặp sự cố ngoài ý muốn</h2>
          <p className="text-family-textMuted text-sm">
            Finance Family OS vừa gặp lỗi khi xử lý dữ liệu. Đừng lo lắng, hệ thống đã tạm dừng để bảo vệ dữ liệu của bạn.
          </p>
        </div>
        
        <div className="p-6">
          <div className="bg-family-bgDark/50 rounded-xl p-4 mb-6 border border-family-accent/5 overflow-auto max-h-48">
            <p className="font-mono text-xs text-red-400 break-words">{(error as Error).message || String(error)}</p>
            {(error as Error).stack && (
              <pre className="mt-2 text-[10px] text-gray-500 font-mono whitespace-pre-wrap">
                {(error as Error).stack}
              </pre>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 bg-family-accent text-white py-3 px-4 rounded-xl font-semibold hover:bg-family-accent/90 transition-colors"
            >
              <RefreshCw className="w-5 h-5" /> Tải lại trang
            </button>

            <button 
              onClick={handleDownloadError}
              className="w-full flex items-center justify-center gap-2 bg-family-bgDark text-family-text py-3 px-4 rounded-xl font-semibold hover:bg-family-bgDark/80 transition-colors border border-family-accent/20"
            >
              <Download className="w-5 h-5" /> Tải file log báo lỗi cho kỹ thuật
            </button>

            <div className="mt-6 pt-6 border-t border-family-accent/10">
              <p className="text-xs text-family-textMuted text-center mb-3">Nếu lỗi vẫn lặp lại sau khi tải lại trang, dữ liệu LocalStorage của bạn có thể đã bị hỏng cấu trúc nghiêm trọng.</p>
              <button 
                onClick={handleResetData}
                className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 px-4 rounded-xl font-semibold hover:bg-red-100 transition-colors border border-red-200"
              >
                <Trash2 className="w-5 h-5" /> Xóa dữ liệu lỗi & Khôi phục mặc định
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const GlobalErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ReactErrorBoundary FallbackComponent={ErrorFallback}>
      {children}
    </ReactErrorBoundary>
  );
};
