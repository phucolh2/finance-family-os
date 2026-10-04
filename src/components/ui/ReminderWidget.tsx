import React, { useState } from 'react';
import { Bell, Calendar, CheckCircle2, Volume2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { getSmartReminders, requestNotificationPermission, sendBrowserNotification } from '../../utils/reminderEngine';
import { HelpTooltip } from './HelpTooltip';

export const ReminderWidget: React.FC = () => {
  const { state, selectedPeriodKey } = useAppContext();
  const reminders = getSmartReminders(state, selectedPeriodKey);
  const [notifGranted, setNotifGranted] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  const handleEnableNotification = async () => {
    const ok = await requestNotificationPermission();
    setNotifGranted(ok);
    if (ok) {
      sendBrowserNotification('Finance Family OS', 'Đã bật thông báo nhắc lịch tài chính gia đình thành công!');
    }
  };

  if (reminders.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm border border-emerald-100 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800">Lịch nhắc tài chính & Đến hạn</span>
              <HelpTooltip text="Tổng hợp tự động các mốc đáo hạn sổ tiết kiệm, kỳ thanh toán nợ, hợp đồng bảo hiểm và dịch vụ đăng ký trong tháng quan sát." />
            </div>
            <p className="text-xs text-slate-500">Tháng này không có khoản nợ hay sổ tiết kiệm nào đến hạn đáo hạn.</p>
          </div>
        </div>
        {!notifGranted && typeof window !== 'undefined' && 'Notification' in window && (
          <button
            type="button"
            onClick={handleEnableNotification}
            className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-all shrink-0 cursor-pointer flex items-center gap-1"
          >
            <Bell className="w-3.5 h-3.5" /> Bật thông báo
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm border border-amber-200/80 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Bell className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Lịch nhắc quan trọng & Đến hạn ({reminders.length})
              </h4>
              <HelpTooltip text="Hệ thống tự động lọc các sổ tiết kiệm đáo hạn, kỳ trả góp nợ, kỳ đóng bảo hiểm và gia hạn subscription trong tháng quan sát để hai vợ chồng không bỏ sót." />
            </div>
            <span className="text-[11px] text-slate-500">Cần lưu ý trong tháng này</span>
          </div>
        </div>

        {!notifGranted && typeof window !== 'undefined' && 'Notification' in window && (
          <button
            type="button"
            onClick={handleEnableNotification}
            className="text-[10px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1"
            title="Cho phép trình duyệt gửi thông báo đẩy"
          >
            <Volume2 className="w-3 h-3" /> Nhận tin thông báo
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
        {reminders.map((r) => (
          <div
            key={r.id}
            className={`p-3 rounded-xl border flex flex-col justify-between gap-1.5 transition-all hover:shadow-xs ${
              r.urgency === 'critical'
                ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                : r.urgency === 'warning'
                ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                : 'bg-slate-50/80 border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-bold leading-tight">{r.title}</span>
              {r.amountText && (
                <span className="text-[11px] font-black px-1.5 py-0.5 rounded-md bg-white/80 border border-current shrink-0">
                  {r.amountText}
                </span>
              )}
            </div>
            <p className="text-[11px] opacity-80 leading-snug line-clamp-2">{r.detail}</p>
            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-black/5 opacity-75">
              <span className="flex items-center gap-1 font-medium">
                <Calendar className="w-3 h-3" /> {r.dueDate}
              </span>
              <span className="capitalize font-semibold">{r.type}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
