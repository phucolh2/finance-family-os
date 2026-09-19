import React, { useState, Suspense, lazy } from 'react';
import {
  Home,
  Wrench,
  FolderOpen,
  Gift,
  Activity,
  Repeat,
  Contact,
  CheckSquare,
  Baby,
  Target,
  ChevronRight,
  Utensils,
} from 'lucide-react';
import { HelpTooltip } from '../components/ui/HelpTooltip';

// Lazy load sub-pages
const DocumentVault = lazy(() => import('./DocumentVault').then(m => ({ default: m.DocumentVault })));
const GivingLedger = lazy(() => import('./GivingLedger').then(m => ({ default: m.GivingLedger })));
const HealthTracker = lazy(() => import('./HealthTracker').then(m => ({ default: m.HealthTracker })));
const HomeInventory = lazy(() => import('./HomeInventory').then(m => ({ default: m.HomeInventory })));
const SubscriptionTracker = lazy(() => import('./SubscriptionTracker').then(m => ({ default: m.SubscriptionTracker })));
const FamilyContacts = lazy(() => import('./FamilyContacts').then(m => ({ default: m.FamilyContacts })));
const MealPlanner = lazy(() => import('./MealPlanner').then(m => ({ default: m.MealPlanner })));
const ChoreChart = lazy(() => import('./ChoreChart').then(m => ({ default: m.ChoreChart })));
const ChildGrowth = lazy(() => import('./ChildGrowth').then(m => ({ default: m.ChildGrowth })));
const VisionBoard = lazy(() => import('./VisionBoard').then(m => ({ default: m.VisionBoard })));

type HubTab = 'to_am' | 'nha_cua' | 'bep_con';

interface SubModule {
  id: string;
  name: string;
  emoji: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  bg: string;
  borderColor: string;
}

const TAB_CONFIG: {
  id: HubTab;
  label: string;
  emoji: string;
  color: string;
  description: string;
  modules: SubModule[];
}[] = [
  {
    id: 'to_am',
    label: 'Tổ Ấm',
    emoji: '❤️',
    color: 'text-rose-500',
    description: 'Giấy tờ, sức khỏe và tình nghĩa gia đình',
    modules: [
      {
        id: 'document_vault',
        name: 'Tủ Giấy Tờ',
        emoji: '📁',
        description: 'Lưu trữ và quản lý giấy tờ quan trọng của cả gia đình',
        icon: FolderOpen,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        borderColor: 'border-amber-200',
      },
      {
        id: 'giving_ledger',
        name: 'Sổ Ân Tình',
        emoji: '🎁',
        description: 'Ghi nhận hiếu, quà tặng và tình nghĩa với gia đình hai bên',
        icon: Gift,
        color: 'text-rose-500',
        bg: 'bg-rose-50',
        borderColor: 'border-rose-200',
      },
      {
        id: 'health_tracker',
        name: 'Nhật Ký Khỏe Mạnh',
        emoji: '💚',
        description: 'Theo dõi sức khỏe, tiêm chủng và lịch khám định kỳ',
        icon: Activity,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
      },
    ],
  },
  {
    id: 'nha_cua',
    label: 'Nhà Cửa',
    emoji: '🏡',
    color: 'text-orange-500',
    description: 'Đồ đạc, dịch vụ và danh bạ quan trọng',
    modules: [
      {
        id: 'home_inventory',
        name: 'Đồ Đạc Trong Nhà',
        emoji: '🔧',
        description: 'Kiểm kê tài sản, đồ gia dụng và lịch bảo dưỡng',
        icon: Wrench,
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        borderColor: 'border-orange-200',
      },
      {
        id: 'subscription_tracker',
        name: 'Dịch Vụ Đang Dùng',
        emoji: '🔄',
        description: 'Quản lý các gói đăng ký, tránh lãng phí thanh toán thừa',
        icon: Repeat,
        color: 'text-violet-600',
        bg: 'bg-violet-50',
        borderColor: 'border-violet-200',
      },
      {
        id: 'family_contacts',
        name: 'Danh Bạ Bỏ Túi',
        emoji: '📞',
        description: 'Số điện thoại khẩn cấp, thợ sửa chữa, bác sĩ tin cậy',
        icon: Contact,
        color: 'text-cyan-600',
        bg: 'bg-cyan-50',
        borderColor: 'border-cyan-200',
      },
    ],
  },
  {
    id: 'bep_con',
    label: 'Bếp & Con',
    emoji: '🍳',
    color: 'text-yellow-600',
    description: 'Ăn uống, việc nhà và hành trình lớn khôn của con',
    modules: [
      {
        id: 'meal_planner',
        name: 'Cơm Nhà & Đi Chợ',
        emoji: '🍜',
        description: 'Lên thực đơn tuần và danh sách đi chợ thông minh',
        icon: Utensils,
        color: 'text-orange-500',
        bg: 'bg-orange-50',
        borderColor: 'border-orange-200',
      },
      {
        id: 'chore_chart',
        name: 'Cùng Làm Việc Nhà',
        emoji: '✅',
        description: 'Phân công và theo dõi việc nhà hai vợ chồng cùng làm',
        icon: CheckSquare,
        color: 'text-indigo-500',
        bg: 'bg-indigo-50',
        borderColor: 'border-indigo-200',
      },
      {
        id: 'child_growth',
        name: 'Hành Trình Khôn Lớn',
        emoji: '👶',
        description: 'Ghi lại cột mốc phát triển và chiều cao cân nặng của bé',
        icon: Baby,
        color: 'text-pink-500',
        bg: 'bg-pink-50',
        borderColor: 'border-pink-200',
      },
      {
        id: 'vision_board',
        name: 'Ước Mơ Của Cả Nhà',
        emoji: '🎯',
        description: 'Bảng ước mơ và mục tiêu cuộc sống của cả gia đình',
        icon: Target,
        color: 'text-sky-500',
        bg: 'bg-sky-50',
        borderColor: 'border-sky-200',
      },
    ],
  },
];

const ModuleSkeleton = () => (
  <div className="space-y-4 animate-pulse pt-2">
    <div className="h-7 w-56 rounded-xl bg-slate-200/70" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-28 rounded-2xl bg-slate-100/80" />
      ))}
    </div>
  </div>
);

const ModuleCard: React.FC<{ module: SubModule; onClick: () => void }> = ({ module, onClick }) => {
  const Icon = module.icon;
  return (
    <button
      onClick={onClick}
      className={`group w-full text-left p-4 sm:p-5 rounded-2xl border ${module.borderColor} ${module.bg} hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-white shadow-sm border ${module.borderColor}`}>
          <Icon className={`w-5 h-5 ${module.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className={`font-bold text-sm ${module.color}`}>
              {module.emoji} {module.name}
            </h3>
            <ChevronRight className={`w-4 h-4 ${module.color} opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0`} />
          </div>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
            {module.description}
          </p>
        </div>
      </div>
    </button>
  );
};

const renderSubModule = (moduleId: string) => {
  switch (moduleId) {
    case 'document_vault':      return <DocumentVault />;
    case 'giving_ledger':       return <GivingLedger />;
    case 'health_tracker':      return <HealthTracker />;
    case 'home_inventory':      return <HomeInventory />;
    case 'subscription_tracker': return <SubscriptionTracker />;
    case 'family_contacts':     return <FamilyContacts />;
    case 'meal_planner':        return <MealPlanner />;
    case 'chore_chart':         return <ChoreChart />;
    case 'child_growth':        return <ChildGrowth />;
    case 'vision_board':        return <VisionBoard />;
    default:                    return null;
  }
};

export const FamilyHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<HubTab>('to_am');
  const [activeModule, setActiveModule] = useState<string | null>(null);

  const currentTab = TAB_CONFIG.find(t => t.id === activeTab)!;
  const activeModuleMeta = currentTab.modules.find(m => m.id === activeModule)
    ?? TAB_CONFIG.flatMap(t => t.modules).find(m => m.id === activeModule);

  // ── Module detail view ──────────────────────────
  if (activeModule) {
    const Icon = activeModuleMeta?.icon;
    return (
      <div className="space-y-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveModule(null)}
            className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-family-accent transition-colors cursor-pointer group"
          >
            <Home className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Nhà Mình</span>
          </button>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <button
            onClick={() => setActiveModule(null)}
            className="text-xs font-semibold text-slate-500 hover:text-family-accent transition-colors cursor-pointer"
          >
            {currentTab.emoji} {currentTab.label}
          </button>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className={`flex items-center gap-1 text-xs font-bold ${activeModuleMeta?.color ?? 'text-family-accent'}`}>
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {activeModuleMeta?.name}
          </span>
        </nav>

        {/* Sub-page content */}
        <Suspense fallback={<ModuleSkeleton />}>
          <div className="animate-fade-up">
            {renderSubModule(activeModule)}
          </div>
        </Suspense>
      </div>
    );
  }

  // ── Hub landing ────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-family-text flex items-center gap-2.5">
            <span className="text-3xl">🏠</span>
            Nhà Mình
          </h1>
          <p className="text-sm text-family-textMuted mt-1">
            Không gian quản lý cuộc sống hàng ngày của gia đình
          </p>
        </div>
        <HelpTooltip
          text={
            <div>
              <strong>Nhà Mình: </strong>
              Tập hợp các công cụ quản lý cuộc sống gia đình: từ giấy tờ, sức khỏe, đến bếp núc và chăm sóc con cái. Chọn tab phù hợp và bấm vào module để mở chi tiết.
            </div>
          }
          position="bottom-right"
        />
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60 w-fit max-w-full">
        {TAB_CONFIG.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setActiveModule(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white shadow-sm text-slate-800'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            }`}
          >
            <span className="text-base leading-none">{tab.emoji}</span>
            <span className="hidden xs:inline sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab subtitle */}
      <p className={`text-sm ${currentTab.color} font-medium flex items-center gap-1.5`}>
        <span>{currentTab.emoji}</span>
        <span>{currentTab.description}</span>
      </p>

      {/* Module Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {currentTab.modules.map(module => (
          <ModuleCard
            key={module.id}
            module={module}
            onClick={() => setActiveModule(module.id)}
          />
        ))}
      </div>

      {/* Tip */}
      <div className="pt-1 border-t border-slate-100">
        <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <span>💡</span>
          <span>Bấm vào bất kỳ module nào để mở và sử dụng đầy đủ tính năng</span>
        </p>
      </div>
    </div>
  );
};
