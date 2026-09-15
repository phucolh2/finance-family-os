import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { Heart, Plus, Trash2, ArrowRightLeft, Edit3, HeartHandshake } from 'lucide-react';
import type { SystemActivityLog } from '../../types/finance';

const timeAgo = (dateStr: string) => {
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
};

// Mock logs for demonstration when empty
const mockLogs: SystemActivityLog[] = [
  {
    id: 'mock_1',
    timestamp: new Date().toISOString(),
    actor: '👨‍💼 Chồng Yêu',
    action: 'ĐIỀU CHUYỂN',
    module: 'FundTransfer',
    description: 'Vừa góp 10.000.000 VNĐ vào Quỹ Các em bé đáng ghét'
  },
  {
    id: 'mock_2',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    actor: '👩‍💼 Vợ Yêu',
    action: 'CẬP NHẬT',
    module: 'Savings',
    description: 'Đã đổi tên Sổ tiết kiệm "Vietcombank" thành "VCB - Đám cưới chúng mình"'
  }
];

export const SystemAuditTab: React.FC = () => {
  const { state } = useAppContext();
  
  // Use state.systemLogs if available, otherwise mock data for preview
  const logs = state.systemLogs && state.systemLogs.length > 0 ? state.systemLogs : mockLogs;

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
      case 'THÊM MỚI': return 'text-emerald-700 bg-emerald-50';
      case 'CẬP NHẬT': return 'text-amber-700 bg-amber-50';
      case 'XÓA': return 'text-rose-700 bg-rose-50';
      case 'ĐIỀU CHUYỂN': return 'text-indigo-700 bg-indigo-50';
      default: return 'text-slate-700 bg-slate-50';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="bg-gradient-to-r from-rose-50 to-pink-50/50 p-5 rounded-3xl border border-rose-100 flex gap-4 items-start mb-8 shadow-sm">
        <HeartHandshake className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
        <div className="text-sm text-slate-700 leading-relaxed">
          <strong className="text-rose-600 font-bold block mb-1">💕 Góc nhìn yêu thương:</strong>
          Đây là nơi lưu giữ những đóng góp nhỏ bé mỗi ngày của cả hai vợ chồng để xây dựng tương lai. Mọi hoạt động đều được ghi nhận tự động để chúng ta cùng nhìn lại hành trình đã qua.
        </div>
      </div>

      <div className="relative">
        <div className="absolute top-4 bottom-4 left-[1.125rem] w-px border-l-2 border-dashed border-rose-100 z-0"></div>
        
        <div className="space-y-6">
          {logs.map((log) => (
            <div key={log.id} className="relative flex gap-5 items-start group">
              <div className="w-9 h-9 shrink-0 rounded-full bg-white border-2 border-rose-100 shadow-sm flex items-center justify-center relative z-10 group-hover:border-rose-300 transition-colors">
                {getActionIcon(log.action)}
              </div>
              
              <div className="flex-1 mt-1">
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 mb-2">
                  <span className="text-sm font-bold text-slate-800">{log.actor}</span>
                  <span className="text-xs text-slate-400 hidden sm:inline">•</span>
                  <span className="text-xs text-slate-400 font-medium">
                    {timeAgo(log.timestamp)}
                  </span>
                </div>
                
                <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow inline-block max-w-full">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${getActionTagColor(log.action)}`}>
                      {log.action === 'ĐIỀU CHUYỂN' ? 'Chuyển tiền' : log.action === 'CẬP NHẬT' ? 'Đổi thông tin' : log.action === 'THÊM MỚI' ? 'Thêm mới' : log.action === 'XÓA' ? 'Đã gác lại' : log.action}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-slate-700 break-words leading-relaxed">
                    {log.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
