import React from 'react';
import {
  LayoutDashboard,
  BookOpenText,
  ScrollText,
  TrendingUp,
  PieChart,
  ReceiptText,
  LineChart,
  PiggyBank,
  ShieldCheck,
  ArrowLeftRight,
  CreditCard,
  Sparkles,
  Flame,
  HeartPulse,
  Baby,
  Receipt,
  BadgeCheck,
  Landmark,
  BookOpen,
  Settings,
  CarFront,
  Palmtree,
  X,
  FolderOpen,
  Gift,
  Activity,
  Wrench,
  Repeat,
  Contact,
  Utensils,
  CheckSquare,
  Target
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onCloseMobile }) => {
  const menuGroups = [
    {
      title: 'Tổng quan',
      items: [
        { id: 'dashboard', name: 'Tổng quan tài chính gia đình', icon: LayoutDashboard, color: 'text-indigo-500', bg: 'bg-indigo-500/15' },
        { id: 'cashflow', name: 'Bức tranh Tài chính (RDPD)', icon: BookOpenText, color: 'text-violet-500', bg: 'bg-violet-500/15' },
        { id: 'event_ledger', name: 'Nhật ký sự kiện (Ledger)', icon: ScrollText, color: 'text-sky-500', bg: 'bg-sky-500/15' },
      ],
    },
    {
      title: 'Lịch trình & Giai đoạn',
      items: [
        { id: 'income', name: 'Kế hoạch Thu nhập', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/15' },
        { id: 'budget_history', name: 'Phân Bổ Ngân Sách', icon: PieChart, color: 'text-cyan-500', bg: 'bg-cyan-500/15' },
        { id: 'life_stages', name: 'Quản lý chi tiêu', icon: ReceiptText, color: 'text-amber-500', bg: 'bg-amber-500/15' },
        { id: 'portfolio', name: 'Danh mục đầu tư', icon: LineChart, color: 'text-blue-500', bg: 'bg-blue-500/15' },
        { id: 'savings', name: 'Tiết kiệm', icon: PiggyBank, color: 'text-green-500', bg: 'bg-green-500/15' },
        { id: 'reserves', name: 'Quỹ Dự phòng', icon: ShieldCheck, color: 'text-teal-500', bg: 'bg-teal-500/15' },
        { id: 'fund_transfers', name: 'Điều chuyển dòng tiền', icon: ArrowLeftRight, color: 'text-orange-500', bg: 'bg-orange-500/15' },
        { id: 'debt_management', name: 'Quản lý Công nợ', icon: CreditCard, color: 'text-rose-500', bg: 'bg-rose-500/15' },
      ],
    },
    {
      title: 'Công cụ hữu ích',
      items: [
        { id: 'year_in_review', name: 'Financial Wrapped', icon: Sparkles, color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/15' },
        { id: 'lifestyle_assets', name: 'Tiêu sản & Tiện nghi', icon: CarFront, color: 'text-indigo-500', bg: 'bg-indigo-500/15' },
        { id: 'fire_center', name: 'FIRE Center', icon: Flame, color: 'text-red-500', bg: 'bg-red-500/15' },
        { id: 'health_rest', name: 'Dự phòng Y tế & Hậu sự', icon: HeartPulse, color: 'text-pink-500', bg: 'bg-pink-500/15' },
        { id: 'child_estimator', name: 'Công cụ tính phí Nuôi con', icon: Baby, color: 'text-yellow-500', bg: 'bg-yellow-500/15' },
        { id: 'tax_calculator', name: 'Tối ưu Thuế TNCN', icon: Receipt, color: 'text-lime-500', bg: 'bg-lime-500/15' },
        { id: 'insurance_manager', name: 'Sổ Quản lý Bảo hiểm', icon: BadgeCheck, color: 'text-slate-400', bg: 'bg-slate-400/15' },
        { id: 'loan_simulator', name: 'Mô phỏng Vay vốn', icon: Landmark, color: 'text-stone-400', bg: 'bg-stone-400/15' },
        { id: 'vacation_planner', name: 'Chuyến Đi Hạnh Phúc', icon: Palmtree, color: 'text-emerald-400', bg: 'bg-emerald-400/15' },
      ],
    },
    {
      title: 'Góc Tổ Ấm',
      items: [
        { id: 'document_vault', name: 'Tủ Giấy Tờ', icon: FolderOpen, color: 'text-amber-600', bg: 'bg-amber-500/15' },
        { id: 'giving_ledger', name: 'Sổ Ân Tình', icon: Gift, color: 'text-rose-500', bg: 'bg-rose-500/15' },
        { id: 'health_tracker', name: 'Nhật Ký Khỏe Mạnh', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/15' },
      ],
    },
    {
      title: 'Chăm Sóc Nhà Cửa',
      items: [
        { id: 'home_inventory', name: 'Đồ Đạc Trong Nhà', icon: Wrench, color: 'text-orange-500', bg: 'bg-orange-500/15' },
        { id: 'subscription_tracker', name: 'Dịch Vụ Đang Dùng', icon: Repeat, color: 'text-violet-500', bg: 'bg-violet-500/15' },
        { id: 'family_contacts', name: 'Danh Bạ Bỏ Túi', icon: Contact, color: 'text-cyan-500', bg: 'bg-cyan-500/15' },
      ],
    },
    {
      title: 'Bếp Núc & Con Cái',
      items: [
        { id: 'meal_planner', name: 'Cơm Nhà & Đi Chợ', icon: Utensils, color: 'text-orange-400', bg: 'bg-orange-400/15' },
        { id: 'chore_chart', name: 'Cùng Làm Việc Nhà', icon: CheckSquare, color: 'text-indigo-400', bg: 'bg-indigo-400/15' },
        { id: 'child_growth', name: 'Hành Trình Khôn Lớn', icon: Baby, color: 'text-pink-400', bg: 'bg-pink-400/15' },
        { id: 'vision_board', name: 'Ước Mơ Của Cả Nhà', icon: Target, color: 'text-sky-400', bg: 'bg-sky-400/15' },
      ],
    },
    {
      title: 'Dự phòng & Tri thức',
      items: [
        { id: 'knowledge_center', name: 'Knowledge Center', icon: BookOpen, color: 'text-family-accent', bg: 'bg-family-accent/15' },
        { id: 'settings', name: 'Cài đặt & Đồng bộ', icon: Settings, color: 'text-gray-400', bg: 'bg-gray-400/15' },
      ],
    },
  ];

  const handleItemClick = (id: string) => {
    setActiveTab(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <aside className="w-64 bg-family-bgDark border-r border-family-accent/10 flex flex-col h-full overflow-y-auto shrink-0 select-none">
      <div className="relative p-6 border-b border-family-accent/10 flex items-center justify-between overflow-hidden">
        {/* Subtle Romantic Background */}
        <div className="absolute inset-0 opacity-25">
          <img src="/images/family_love.jpg" alt="Love" className="w-full h-full object-cover object-[center_30%]" />
          <div className="absolute inset-0 bg-gradient-to-r from-family-bgDark via-family-bgDark/80 to-transparent"></div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-white/50 overflow-hidden shadow-md shrink-0">
            <img src="/images/couple_avatar.jpg" alt="Family Avatar" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-family-text drop-shadow-md leading-tight">
              Family OS
            </h2>
          </div>
        </div>
        {onCloseMobile && (
          <button onClick={onCloseMobile} className="relative z-10 md:hidden p-1.5 rounded-xl hover:bg-family-bgDeep text-family-textMuted bg-family-bgDark/50 backdrop-blur-sm">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-6">
        {menuGroups.map((group, index) => (
          <div key={group.title} className="space-y-0.5">
            {index > 0 && <div className="h-px bg-gradient-to-r from-transparent via-family-accent/10 to-transparent mb-4" />}
            <span className="text-[10px] font-bold text-family-textLight uppercase tracking-wider px-3 block mb-2 flex items-center gap-1.5">
              {group.title}
            </span>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { handleItemClick(item.id); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-150 ${
                    isActive
                      ? 'bg-family-accent text-white shadow-md shadow-family-accent/20'
                      : 'text-family-text hover:bg-family-bgDeep/50 hover:text-family-accentDark'
                  }`}
                >
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150 ${
                    isActive ? 'bg-white/20' : item.bg
                  }`}>
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : item.color}`} />
                  </span>
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Badge */}
      <div className="p-4 border-t border-family-accent/10 mt-auto">
        <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-br from-family-bgDeep to-white/30 border border-white/50 shadow-sm text-[10px] text-family-textLight font-medium">
          <Sparkles className="w-3.5 h-3.5 text-family-accent/70" />
          <span>Finance Family OS <span className="font-bold text-family-accent/80">v1.2</span></span>
        </div>
      </div>
    </aside>
  );
};
