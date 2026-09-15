import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { Cloud, CloudOff, LogIn, LogOut, User } from 'lucide-react';

/**
 * AuthGate: Hiển thị trạng thái sync & nút đăng nhập/đăng xuất.
 * Không block giao diện — app vẫn hoạt động offline nếu chưa đăng nhập.
 */
export const AuthStatusBar: React.FC = () => {
  const { user, loading, isFirebaseEnabled, signInWithGoogle, logout } = useAuth();
  const appContext = useAppContext();

  // Firebase không được cấu hình → không hiện gì
  if (!isFirebaseEnabled) return null;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-family-textMuted px-3 py-1.5 bg-family-bg/50 rounded-lg">
        <div className="w-3 h-3 border-2 border-family-accent/40 border-t-family-accent rounded-full animate-spin" />
        <span>Đang kiểm tra đăng nhập...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <button
        onClick={signInWithGoogle}
        className="flex items-center gap-2 text-xs bg-family-bg/80 hover:bg-family-accent/10 border border-family-border rounded-lg px-3 py-1.5 transition-colors cursor-pointer group"
        title="Đăng nhập để đồng bộ dữ liệu lên Cloud"
      >
        <CloudOff className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-family-textMuted group-hover:text-family-text">Chế độ Offline</span>
        <span className="text-family-accent font-medium flex items-center gap-1">
          <LogIn className="w-3 h-3" />
          Đăng nhập
        </span>
      </button>
    );
  }

  const getSyncStatusUI = () => {
    switch (appContext.syncStatus) {
      case 'syncing':
        return (
          <>
            <div className="w-3.5 h-3.5 flex items-center justify-center">
              <div className="w-3 h-3 border-2 border-amber-500/40 border-t-amber-500 rounded-full animate-spin" />
            </div>
            <span className="text-amber-500 font-medium">Đang đồng bộ</span>
          </>
        );
      case 'synced':
        return (
          <>
            <Cloud className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-emerald-600 font-medium">Đã đồng bộ</span>
          </>
        );
      case 'error':
        return (
          <>
            <CloudOff className="w-3.5 h-3.5 text-red-500" />
            <span className="text-red-500 font-medium">Lỗi đồng bộ</span>
          </>
        );
      default:
        return (
          <>
            <Cloud className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-emerald-600 font-medium">Đã kết nối</span>
          </>
        );
    }
  };

  return (
    <div className="flex items-center gap-2 text-[10px] uppercase font-bold bg-white/40 backdrop-blur-md border border-family-accent/10 rounded-full px-3 py-1 shadow-sm hover:shadow-md transition-shadow">
      {getSyncStatusUI()}
      <div className="flex items-center gap-1.5 text-family-textMuted border-l border-family-accent/20 pl-2 ml-1">
        {user.photoURL ? (
           <img src={user.photoURL} alt="" className="w-4 h-4 rounded-full border border-family-accent/20" />
        ) : (
          <User className="w-3.5 h-3.5" />
        )}
        <span className="max-w-[100px] truncate capitalize">{user.displayName || user.email}</span>
      </div>
      <button
        onClick={logout}
        className="text-family-textMuted hover:text-red-500 transition-colors cursor-pointer ml-1"
        title="Đăng xuất"
      >
        <LogOut className="w-3 h-3" />
      </button>
    </div>
  );
};
