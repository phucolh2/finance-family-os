import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { ShieldCheck, Cloud, RefreshCw, Sparkles, ArrowRight, Lock } from 'lucide-react';

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading, isFirebaseEnabled, signInWithGoogle } = useAuth();
  const { isCloudLoading } = useAppContext();
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Ép vai trò dựa trên email
  if (user && user.email) {
    const email = user.email.toLowerCase();
    const husbandEmails = ['lhoaiphuoc@gmail.com', 'phuocbaulam@gmail.com'];
    const wifeEmails = ['que7tam@gmail.com', 'dieuhong1013@gmail.com'];
    if (husbandEmails.includes(email)) {
      localStorage.setItem('family_active_actor', 'husband');
    } else if (wifeEmails.includes(email)) {
      localStorage.setItem('family_active_actor', 'wife');
    }
  }

  // Nếu Firebase chưa được cấu hình hoặc người dùng đã đăng nhập hoặc chọn chế độ khách -> Cho vào app
  if (!isFirebaseEnabled || user || isGuestMode) {
    if (isCloudLoading) {
      return (
        <div className="min-h-screen bg-family-bg flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-family-accent/10 border border-family-accent/20 flex items-center justify-center text-family-accent mb-6 animate-pulse shadow-lg">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-family-text mb-2">Đang tải dữ liệu từ Cloud...</h2>
          <p className="text-sm text-family-textMuted max-w-sm">
            Hệ thống đang đồng bộ bản sao tài chính số mới nhất của bạn từ Firebase Firestore.
          </p>
        </div>
      );
    }
    return <>{children}</>;
  }

  // Đang kiểm tra phiên đăng nhập ban đầu
  if (authLoading) {
    return (
      <div className="min-h-screen bg-family-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-family-accent/20 border-t-family-accent animate-spin mb-4" />
        <p className="text-sm text-family-textMuted font-medium">Đang khởi tạo hệ thống...</p>
      </div>
    );
  }

  const handleGoogleLogin = async () => {
    try {
      setIsSigningIn(true);
      setErrorMsg(null);
      await signInWithGoogle();
    } catch (err: any) {
      console.error('[Auth Error]', err);
      const code = err?.code || '';
      const msg = err?.message || '';
      if (code === 'auth/operation-not-allowed') {
        setErrorMsg('Lỗi: Bạn chưa bật nhà cung cấp Google trong Firebase Console (Authentication > Sign-in method > Google > Enable).');
      } else if (code === 'auth/unauthorized-domain') {
        setErrorMsg('Lỗi: Tên miền này chưa được thêm vào Authorized Domains trong Firebase Console.');
      } else if (code === 'auth/popup-closed-by-user') {
        setErrorMsg('Cửa sổ đăng nhập đã bị đóng trước khi hoàn tất.');
      } else if (code === 'auth/popup-blocked') {
        setErrorMsg('Trình duyệt đã chặn cửa sổ Popup. Vui lòng cho phép popup để đăng nhập.');
      } else {
        setErrorMsg(`Lỗi đăng nhập (${code}): ${msg || 'Vui lòng kiểm tra lại cấu hình Firebase.'}`);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/40 via-family-bg to-stone-100/60 flex items-center justify-center p-4 md:p-8 select-none">
      <div className="max-w-md w-full bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-family-accent/15 space-y-8 relative overflow-hidden">
        {/* Background glow ornament */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center space-y-3 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-family-accent to-amber-600 flex items-center justify-center mx-auto text-white shadow-xl shadow-family-accent/25">
            <span className="text-3xl">👨‍👩‍👧‍👦</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-family-text tracking-tight">
            Finance Family OS
          </h1>
          <p className="text-xs text-family-textMuted leading-relaxed">
            Hệ sinh thái Quản trị Tài chính Gia đình & Bản sao Kỹ thuật số (Financial Digital Twin)
          </p>
        </div>

        {/* Value Props */}
        <div className="space-y-3 bg-stone-50/80 rounded-2xl p-4 border border-stone-200/60 text-xs text-family-text">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <Cloud className="w-4 h-4" />
            </div>
            <span>Đồng bộ dữ liệu thời gian thực trên mọi thiết bị</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span>Bảo mật dữ liệu cá nhân hóa 100% bằng Google Auth</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <span>Tự động sao lưu và không lo mất dữ liệu khi đổi máy</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 text-center font-medium">
            {errorMsg}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 relative z-10">
          <button
            onClick={handleGoogleLogin}
            disabled={isSigningIn}
            className="w-full py-3.5 px-4 bg-slate-900 hover:bg-black text-white font-medium rounded-2xl shadow-lg shadow-slate-900/20 transition-all transform active:scale-[0.99] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-70 group"
          >
            {isSigningIn ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.1 8.9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.6 6.4C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.6l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5.3L1.6 16c1.9 3.8 5.8 7 10.4 7z"
                />
              </svg>
            )}
            <span className="text-sm font-semibold">Đăng nhập với Google</span>
            <ArrowRight className="w-4 h-4 text-white/50 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => setIsGuestMode(true)}
            className="w-full py-2.5 px-4 text-xs font-medium text-family-textMuted hover:text-family-text hover:bg-stone-100 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            Dùng thử chế độ Khách (Lưu trên thiết bị)
          </button>
        </div>

        <div className="text-center">
          <p className="text-[11px] text-stone-400">
            Dữ liệu của bạn được mã hóa an toàn trên Google Cloud Firestore
          </p>
        </div>
      </div>
    </div>
  );
};
