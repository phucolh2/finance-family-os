import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Heart, Plus, Trash2, ArrowRightLeft, Edit3, HeartHandshake, Clock, UserCheck, Filter } from 'lucide-react';
import type { SystemActivityLog } from '../../types/finance';

// Hàm tính khoảng thời gian tương đối
const timeAgo = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Vừa xong';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  } catch {
    return dateStr;
  }
};

// Hàm định dạng ngày giờ chính xác đến từng giây
const formatExactDateTime = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${time} • ${date}`;
  } catch {
    return dateStr;
  }
};

export const SystemAuditTab: React.FC = () => {
  const { state, clearSystemLogs } = useAppContext();
  
  // Chỉ dùng dữ liệu thật từ state.systemLogs, TUYỆT ĐỐI KHÔNG dùng mock logs
  const rawLogs: SystemActivityLog[] = state.systemLogs || [];

  // Quản lý vai trò người thực hiện hiện tại của thiết bị
  const currentActor = (localStorage.getItem('family_active_actor') as 'husband' | 'wife') || 'husband';

  const [filterActor, setFilterActor] = useState<'all' | 'husband' | 'wife'>('all');
  const [filterAction, setFilterAction] = useState<string>('all');

  const husbandName = state.profile?.husbandName || 'Chồng';
  const wifeName = state.profile?.wifeName || 'Vợ';


  const handleClearHistory = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử hoạt động chung tay này không? Thao tác này không thể hoàn tác.')) {
      if (clearSystemLogs) {
        clearSystemLogs();
      }
    }
  };

  // Lọc danh sách nhật ký
  const filteredLogs = rawLogs.filter(log => {
    if (filterActor === 'husband') {
      const isHusband = log.actor.includes('Chồng') || log.actor.includes(husbandName);
      if (!isHusband) return false;
    }
    if (filterActor === 'wife') {
      const isWife = log.actor.includes('Vợ') || log.actor.includes(wifeName);
      if (!isWife) return false;
    }
    if (filterAction !== 'all' && log.action !== filterAction) {
      return false;
    }
    return true;
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'THÊM MỚI': return <Plus className="w-4 h-4 text-emerald-500" />;
      case 'CẬP NHẬT': return <Edit3 className="w-4 h-4 text-amber-500" />;
      case 'XÓA': return <Trash2 className="w-4 h-4 text-rose-500" />;
      case 'ĐIỀU CHUYỂN': return <ArrowRightLeft className="w-4 h-4 text-indigo-500" />;
      default: return <Heart className="w-4 h-4 text-rose-400" />;
    }
  };

  const getActionTagColor = (action: string) => {
    switch (action) {
      case 'THÊM MỚI': return 'text-emerald-700 bg-emerald-50 border border-emerald-200';
      case 'CẬP NHẬT': return 'text-amber-700 bg-amber-50 border border-amber-200';
      case 'XÓA': return 'text-rose-700 bg-rose-50 border border-rose-200';
      case 'ĐIỀU CHUYỂN': return 'text-indigo-700 bg-indigo-50 border border-indigo-200';
      default: return 'text-slate-700 bg-slate-50 border border-slate-200';
    }
  };

  const isWifeActor = (actorStr: string) => {
    return actorStr.includes('Vợ') || actorStr.includes(wifeName) || actorStr.includes('👩');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Góc nhìn yêu thương & Giải thích cơ chế ghi nhận */}
      <div className="bg-gradient-to-r from-rose-50 via-pink-50/60 to-amber-50/50 p-5 rounded-3xl border border-rose-100/80 flex gap-4 items-start shadow-sm">
        <HeartHandshake className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
        <div className="text-sm text-slate-700 leading-relaxed">
          <strong className="text-rose-600 font-bold block mb-1">💕 Góc nhìn yêu thương:</strong>
          Đây là nơi lưu giữ <strong>những hoạt động thực tế</strong> của cả hai vợ chồng trong việc vun đắp tài chính và gia đình. Mọi hành động (điều chuyển quỹ, gửi thiệp yêu thương, cập nhật tài sản...) đều được ghi nhận tự động với mốc thời gian và người thực hiện chính xác.
        </div>
      </div>

      {/* Thanh hiển thị vai trò người thực hiện của thiết bị này */}
      <div className="p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Thiết bị này đang thao tác với vai trò:
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm ${
              currentActor === 'husband'
                ? 'bg-blue-600 text-white shadow-blue-200 ring-2 ring-blue-300'
                : 'bg-rose-500 text-white shadow-rose-200 ring-2 ring-rose-300'
            }`}
          >
            <span>{currentActor === 'husband' ? '👨‍💼' : '👩‍💼'}</span>
            <span>{currentActor === 'husband' ? `Chồng (${husbandName})` : `Vợ (${wifeName})`}</span>
          </div>
        </div>
      </div>

      {/* Bộ lọc và thao tác */}
      {rawLogs.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Lọc:
            </span>
            <button
              onClick={() => setFilterActor('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterActor === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả ({rawLogs.length})
            </button>
            <button
              onClick={() => setFilterActor('husband')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                filterActor === 'husband'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60'
              }`}
            >
              <span>👨‍💼</span> {husbandName}
            </button>
            <button
              onClick={() => setFilterActor('wife')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                filterActor === 'wife'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
              }`}
            >
              <span>👩‍💼</span> {wifeName}
            </button>

            <span className="text-slate-200 mx-1">|</span>

            <button
              onClick={() => setFilterAction(filterAction === 'ĐIỀU CHUYỂN' ? 'all' : 'ĐIỀU CHUYỂN')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                filterAction === 'ĐIỀU CHUYỂN'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/60'
              }`}
            >
              <span>🔄</span> Điều chuyển dòng tiền
            </button>
          </div>

          <button
            onClick={handleClearHistory}
            className="text-xs text-slate-400 hover:text-rose-500 font-medium transition-colors flex items-center gap-1 cursor-pointer"
            title="Xóa sạch lịch sử để ghi nhận lại từ đầu"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa nhật ký</span>
          </button>
        </div>
      )}

      {/* Hiển thị danh sách hoặc Trạng thái trống (Empty State) */}
      {filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white/50 rounded-3xl border border-dashed border-rose-200/80 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-400 mb-4 shadow-inner">
            <HeartHandshake className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-bold text-slate-700 mb-1">
            {rawLogs.length === 0 ? 'Chưa có hoạt động nào được ghi nhận' : 'Không có hoạt động phù hợp bộ lọc'}
          </h4>
          <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
            {rawLogs.length === 0
              ? 'Khi hai vợ chồng thực hiện các thao tác tài chính như Điều chuyển quỹ, Mở/đổi sổ tiết kiệm, Viết thiệp yêu thương... lịch sử sẽ tự động được ghi nhận tại đây kèm thời gian chính xác.'
              : 'Thử chuyển sang bộ lọc "Tất cả" để xem toàn bộ lịch sử hoạt động của gia đình.'}
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-slate-400">
            <span className="bg-slate-100 px-3 py-1 rounded-full font-medium">✨ Tự động ghi nhận</span>
            <span className="bg-slate-100 px-3 py-1 rounded-full font-medium">🔒 Đồng bộ Cloud</span>
            <span className="bg-slate-100 px-3 py-1 rounded-full font-medium">⏱️ Thời gian thực 100%</span>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute top-4 bottom-4 left-[1.125rem] w-px border-l-2 border-dashed border-rose-100 z-0"></div>
          
          <div className="space-y-6">
            {filteredLogs.map((log) => {
              const isWife = isWifeActor(log.actor);

              return (
                <div key={log.id} className="relative flex gap-5 items-start group">
                  <div className="w-9 h-9 shrink-0 rounded-full bg-white border-2 border-rose-100 shadow-sm flex items-center justify-center relative z-10 group-hover:border-rose-300 transition-colors">
                    {getActionIcon(log.action)}
                  </div>
                  
                  <div className="flex-1 mt-0.5">
                    {/* Header thông tin: Người thực hiện + Thời gian chính xác */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm ${
                        isWife 
                          ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {log.actor}
                      </span>
                      
                      <span className="text-xs text-slate-300">•</span>
                      
                      {/* Mốc thời gian chính xác đến từng giây */}
                      <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100/90 border border-slate-200/80 px-2 py-0.5 rounded-md flex items-center gap-1.5 shadow-2xs">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatExactDateTime(log.timestamp)}
                      </span>
                      
                      {/* Khoảng thời gian tương đối */}
                      <span className="text-xs text-slate-400 font-medium italic">
                        ({timeAgo(log.timestamp)})
                      </span>
                    </div>
                    
                    {/* Nội dung chi tiết hoạt động */}
                    <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow inline-block max-w-full">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${getActionTagColor(log.action)}`}>
                          {log.action === 'ĐIỀU CHUYỂN' ? 'Chuyển tiền' : log.action === 'CẬP NHẬT' ? 'Đổi thông tin' : log.action === 'THÊM MỚI' ? 'Thêm mới' : log.action === 'XÓA' ? 'Đã gác lại' : log.action}
                        </span>
                        {log.module && (
                          <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                            {log.module}
                          </span>
                        )}
                      </div>
                      <p className="text-sm sm:text-base text-slate-700 break-words leading-relaxed font-medium">
                        {log.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
