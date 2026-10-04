import React, { useState } from 'react';
import { Sparkles, ShieldCheck, Heart, PieChart, Check, X } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      icon: <Sparkles className="w-8 h-8 text-amber-500" />,
      title: 'Chào mừng hai vợ chồng đến với Finance Family OS!',
      desc: 'Bản sao kỹ thuật số tài chính cá nhân hóa 100% giúp hai vợ chồng quản trị dòng tiền, tài sản ròng và các mục tiêu tương lai một cách minh bạch, hạnh phúc.',
      badge: 'Bản sao số'
    },
    {
      icon: <PieChart className="w-8 h-8 text-indigo-500" />,
      title: 'Hệ thống Ngân sách 4 Trụ Cột',
      desc: 'Mọi dòng tiền thu nhập được phân bổ khoa học vào: 1. Quỹ Sinh hoạt thiết yếu, 2. Quỹ Tiết kiệm tích lũy, 3. Danh mục Đầu tư sinh lời, 4. Dự phòng & Trả nợ.',
      badge: '4 Trụ Cột'
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-emerald-500" />,
      title: 'Nhận diện tự động & Khóa sổ tháng',
      desc: 'Hệ thống tự động nhận diện vai trò Chồng / Vợ qua Email Google đã đăng ký. Bạn có thể bấm "Chốt sổ tháng" để lưu trữ kết quả và "Mở khóa" bất kỳ lúc nào nếu cần điều chỉnh lại.',
      badge: 'Bảo mật & Linh hoạt'
    },
    {
      icon: <Heart className="w-8 h-8 text-rose-500" />,
      title: 'Nhà Mình & Nhật Ký Chung Tay',
      desc: 'Mọi thao tác điều chuyển quỹ, mở sổ tiết kiệm, hay gửi lời yêu thương đều được tự động lưu lại trong Nhật ký Chung tay với mốc thời gian chuẩn xác.',
      badge: 'Gắn kết'
    }
  ];

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-family-accent/15 overflow-hidden p-6 space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-family-accent/10 text-family-accent">
            {current.badge} ({step + 1}/{steps.length})
          </span>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center text-center space-y-3 py-2">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-inner">
            {current.icon}
          </div>
          <h3 className="text-lg font-bold text-slate-800 leading-snug">{current.title}</h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm">{current.desc}</p>
        </div>

        {/* Indicators & Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-6 bg-family-accent' : 'w-1.5 bg-slate-200'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Quay lại
              </button>
            )}
            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep(s => s + 1)}
                className="px-4 py-2 text-xs font-bold text-white bg-family-accent hover:opacity-90 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Tiếp tục
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> Bắt đầu ngay
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
