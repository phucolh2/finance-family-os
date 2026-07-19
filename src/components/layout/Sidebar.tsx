import React from 'react';
import {
  Home,
  Wallet,
  Calendar,
  Milestone,
  GitBranch,
  Briefcase,
  Flame,
  HeartPulse,
  BookOpen,
  Settings,
  X,
  Map,
  History,
  Activity,
  ShieldCheck,
  ArrowRightLeft,
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
        { id: 'dashboard', name: 'Tổng quan tài chính gia đình', icon: Home },
        { id: 'cashflow', name: 'Báo cáo Dòng tiền (RDPD)', icon: Activity },
        { id: 'fund_transfers', name: 'Sổ cái Điều chuyển', icon: ArrowRightLeft },
        { id: 'event_ledger', name: 'Nhật ký sự kiện (Ledger)', icon: History },
      ],
    },
    {
      title: 'Lịch trình & Giai đoạn',
      items: [
        { id: 'income', name: 'Kế hoạch Thu nhập', icon: Wallet },
        { id: 'budget_history', name: 'Phân Bổ Ngân Sách', icon: Calendar },
        { id: 'life_stages', name: 'Sự kiện cuộc đời', icon: Milestone },
        { id: 'portfolio', name: 'Danh mục đầu tư', icon: Briefcase },
        { id: 'savings_debt', name: 'Tiết kiệm & Nợ', icon: ShieldCheck },
      ],
    },
    {
      title: 'Công cụ hữu ích',
      items: [
        { id: 'scenario_base', name: 'Kịch bản cơ sở', icon: Map },
        { id: 'fire_center', name: 'FIRE Center', icon: Flame },
        { id: 'health_rest', name: 'Bệnh tật & hậu sự', icon: HeartPulse },
        { id: 'scenario_child_2031', name: 'Kịch bản có con 2031', icon: GitBranch },
      ],
    },
    {
      title: 'Dự phòng & Tri thức',
      items: [
        { id: 'knowledge_center', name: 'Knowledge Center', icon: BookOpen },
        { id: 'settings', name: 'Cấu hình hệ thống', icon: Settings },
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
      <div className="p-6 border-b border-family-accent/10 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif font-bold text-family-text flex items-center gap-2">
            <span>👨‍👩‍👧‍👦</span> Family OS
          </h2>
          <span className="text-[10px] uppercase font-bold text-family-accent tracking-widest mt-1 block">v2.0 Beta</span>
        </div>
        {onCloseMobile && (
          <button onClick={onCloseMobile} className="md:hidden p-1.5 rounded-xl hover:bg-family-bgDeep text-family-textMuted">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-6">
        {menuGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <span className="text-[10px] font-bold text-family-textLight uppercase tracking-wider px-3 block mb-2">
              {group.title}
            </span>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { handleItemClick(item.id); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-xl transition-all duration-150 ${
                    isActive
                      ? 'bg-family-accent text-white shadow-md shadow-family-accent/15'
                      : 'text-family-text hover:bg-family-bgDeep/40 hover:text-family-accentDark'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
};
