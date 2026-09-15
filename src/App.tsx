import { useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import type { FallbackProps } from 'react-error-boundary';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { AuthGate } from './components/auth/AuthGate';
import { Layout } from './components/layout/Layout';
import { Suspense, lazy } from 'react';

const lazyWithRetry = (componentImport: () => Promise<any>) => {
  return lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
    );
    try {
      const component = await componentImport();
      window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        window.location.reload();
        return new Promise(() => {}); // Prevent React from trying to render
      }
      throw error;
    }
  });
};

const Dashboard = lazyWithRetry(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const CashflowQuadrant = lazyWithRetry(() => import('./pages/CashflowQuadrant').then(m => ({ default: m.CashflowQuadrant })));
const FundTransfers = lazyWithRetry(() => import('./pages/FundTransfers').then(m => ({ default: m.FundTransfers })));
const EventLedger = lazyWithRetry(() => import('./pages/EventLedger').then(m => ({ default: m.EventLedger })));
const IncomeSchedule = lazyWithRetry(() => import('./pages/IncomeSchedule').then(m => ({ default: m.IncomeSchedule })));
const BudgetHistory = lazyWithRetry(() => import('./pages/BudgetHistory').then(m => ({ default: m.BudgetHistory })));
const LifeStages = lazyWithRetry(() => import('./pages/LifeStages').then(m => ({ default: m.LifeStages })));
const ChildCostEstimator = lazyWithRetry(() => import('./pages/ChildCostEstimator').then(m => ({ default: m.ChildCostEstimator })));

const Portfolio = lazyWithRetry(() => import('./pages/Portfolio').then(m => ({ default: m.Portfolio })));
const Savings = lazyWithRetry(() => import('./pages/Savings').then(m => ({ default: m.Savings })));
const Reserves = lazyWithRetry(() => import('./pages/Reserves').then(m => ({ default: m.Reserves })));
const FireCenter = lazyWithRetry(() => import('./pages/FireCenter').then(m => ({ default: m.FireCenter })));
const HealthAndFinalRest = lazyWithRetry(() => import('./pages/HealthAndFinalRest').then(m => ({ default: m.HealthAndFinalRest })));
const KnowledgeCenter = lazyWithRetry(() => import('./pages/KnowledgeCenter').then(m => ({ default: m.KnowledgeCenter })));
const Settings = lazyWithRetry(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const DebtManagement = lazyWithRetry(() => import('./pages/DebtManagement').then(m => ({ default: m.DebtManagement })));
const TaxCalculator = lazyWithRetry(() => import('./pages/TaxCalculator').then(m => ({ default: m.TaxCalculator })));
const InsuranceManager = lazyWithRetry(() => import('./pages/InsuranceManager').then(m => ({ default: m.InsuranceManager })));
const LifestyleAssets = lazyWithRetry(() => import('./pages/LifestyleAssets').then(m => ({ default: m.LifestyleAssets })));
const LoanSimulator = lazyWithRetry(() => import('./pages/LoanSimulator').then(m => ({ default: m.LoanSimulator })));
const YearInReview = lazyWithRetry(() => import('./pages/YearInReview').then(m => ({ default: m.YearInReview })));
const VacationPlanner = lazyWithRetry(() => import('./pages/VacationPlanner').then(m => ({ default: m.VacationPlanner })));
const DocumentVault = lazyWithRetry(() => import('./pages/DocumentVault').then(m => ({ default: m.DocumentVault })));
const GivingLedger = lazyWithRetry(() => import('./pages/GivingLedger').then(m => ({ default: m.GivingLedger })));
const HealthTracker = lazyWithRetry(() => import('./pages/HealthTracker').then(m => ({ default: m.HealthTracker })));
const HomeInventory = lazyWithRetry(() => import('./pages/HomeInventory').then(m => ({ default: m.HomeInventory })));
const SubscriptionTracker = lazyWithRetry(() => import('./pages/SubscriptionTracker').then(m => ({ default: m.SubscriptionTracker })));
const FamilyContacts = lazyWithRetry(() => import('./pages/FamilyContacts').then(m => ({ default: m.FamilyContacts })));

function AppContent() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'year_in_review':
        return <YearInReview />;
      case 'cashflow':
        return <CashflowQuadrant />;
      case 'fund_transfers':
        return <FundTransfers />;
      case 'debt_management':
        return <DebtManagement />;
      case 'event_ledger':
        return <EventLedger />;
      case 'income':
        return <IncomeSchedule />;
      case 'budget_history':
        return <BudgetHistory />;
      case 'life_stages':
        return <LifeStages />;
      case 'child_estimator':
        return <ChildCostEstimator />;

      case 'portfolio':
        return <Portfolio />;
      case 'savings':
        return <Savings />;
      case 'reserves':
        return <Reserves />;
      case 'fire_center':
        return <FireCenter />;
      case 'health_rest':
        return <HealthAndFinalRest />;
      case 'knowledge_center':
        return <KnowledgeCenter />;
      case 'tax_calculator':
        return <TaxCalculator />;
      case 'insurance_manager':
        return <InsuranceManager />;
      case 'lifestyle_assets':
        return <LifestyleAssets />;
      case 'loan_simulator':
        return <LoanSimulator />;
      case 'vacation_planner':
        return <VacationPlanner />;
      case 'document_vault':
        return <DocumentVault />;
      case 'giving_ledger':
        return <GivingLedger />;
      case 'health_tracker':
        return <HealthTracker />;
      case 'home_inventory':
        return <HomeInventory />;
      case 'subscription_tracker':
        return <SubscriptionTracker />;
      case 'family_contacts':
        return <FamilyContacts />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <Suspense fallback={
        <div className="space-y-6 animate-fade-up">
          {/* Header skeleton */}
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <div className="h-8 w-64 rounded-xl skeleton-shimmer bg-family-bgDark/30" />
              <div className="h-4 w-96 rounded-lg skeleton-shimmer bg-family-bgDark/20" />
            </div>
            <div className="h-9 w-40 rounded-xl skeleton-shimmer bg-family-bgDark/20" />
          </div>
          {/* KPI cards skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-panel rounded-2xl p-4 border-l-4 border-l-family-accent/30 h-24 flex flex-col gap-3">
                <div className="h-3 w-20 rounded skeleton-shimmer bg-family-bgDark/25" />
                <div className="h-6 w-28 rounded-lg skeleton-shimmer bg-family-bgDark/30" />
                <div className="h-2.5 w-16 rounded skeleton-shimmer bg-family-bgDark/20" />
              </div>
            ))}
          </div>
          {/* Content skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-panel rounded-2xl p-6 h-64 flex flex-col gap-4">
              <div className="h-5 w-48 rounded-lg skeleton-shimmer bg-family-bgDark/25" />
              <div className="h-3 w-64 rounded skeleton-shimmer bg-family-bgDark/20" />
              <div className="flex-1 rounded-xl skeleton-shimmer bg-family-bgDark/15" />
            </div>
            <div className="glass-panel rounded-2xl p-6 h-64 flex flex-col gap-4">
              <div className="h-5 w-32 rounded-lg skeleton-shimmer bg-family-bgDark/25" />
              <div className="flex-1 rounded-xl skeleton-shimmer bg-family-bgDark/15" />
            </div>
          </div>
        </div>
      }>
        <div key={activeTab} className="animate-fade-up">
          {renderActivePage()}
        </div>
      </Suspense>
    </Layout>
  );
}

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const handleDownloadBackup = () => {
    try {
      const stored = localStorage.getItem('family_finance_os_state');
      if (stored) {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(stored);
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `family_finance_os_crash_backup.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      } else {
        alert('Không tìm thấy dữ liệu sao lưu trong LocalStorage.');
      }
    } catch (err: any) {
      alert(`Không thể xuất dữ liệu sao lưu: ${err.message}`);
    }
  };

  const handleClearAndReset = () => {
    if (window.confirm('Lưu ý nhỏ: Bạn có chắc chắn muốn làm lại từ đầu không? Toàn bộ dữ liệu sẽ được thiết lập lại. Hãy chắc chắn bạn đã tải file dự phòng nhé!')) {
      localStorage.removeItem('family_finance_os_state');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-slate-100">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-xl border border-red-500/20 max-w-lg w-full text-center space-y-6">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500 border border-red-500/20">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white font-serif">Trục trặc giao diện</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Finance Family OS gặp chút trục trặc khi hiển thị. Đừng lo lắng, dữ liệu tài chính của gia đình bạn vẫn an toàn trong thiết bị.
          </p>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl text-left border border-slate-700/50 max-h-40 overflow-y-auto">
          <p className="text-[11px] font-semibold text-red-400">Chi tiết lỗi:</p>
          <p className="text-[10px] text-red-300 font-mono mt-1 whitespace-pre-wrap">{(error as any)?.message || String(error)}</p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={handleDownloadBackup}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            📥 Tải xuống tệp cứu hộ dữ liệu (JSON)
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={resetErrorBoundary}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
            >
              🔄 Thử tải lại
            </button>
            <button
              onClick={handleClearAndReset}
              className="flex-1 border border-red-500/30 text-red-400 hover:bg-red-500/10 font-semibold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
            >
              ⚠️ Khôi phục mặc định
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => { window.location.reload(); }}>
      <AuthProvider>
        <AppProvider>
          <AuthGate>
            <AppContent />
          </AuthGate>
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
