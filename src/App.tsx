import { useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import type { FallbackProps } from 'react-error-boundary';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/layout/Layout';
import { Suspense, lazy } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const CashflowQuadrant = lazy(() => import('./pages/CashflowQuadrant').then(m => ({ default: m.CashflowQuadrant })));
const FundTransfers = lazy(() => import('./pages/FundTransfers').then(m => ({ default: m.FundTransfers })));
const EventLedger = lazy(() => import('./pages/EventLedger').then(m => ({ default: m.EventLedger })));
const IncomeSchedule = lazy(() => import('./pages/IncomeSchedule').then(m => ({ default: m.IncomeSchedule })));
const BudgetHistory = lazy(() => import('./pages/BudgetHistory').then(m => ({ default: m.BudgetHistory })));
const LifeStages = lazy(() => import('./pages/LifeStages').then(m => ({ default: m.LifeStages })));
const ChildCostEstimator = lazy(() => import('./pages/ChildCostEstimator').then(m => ({ default: m.ChildCostEstimator })));

const Portfolio = lazy(() => import('./pages/Portfolio').then(m => ({ default: m.Portfolio })));
const Savings = lazy(() => import('./pages/Savings').then(m => ({ default: m.Savings })));
const Reserves = lazy(() => import('./pages/Reserves').then(m => ({ default: m.Reserves })));
const FireCenter = lazy(() => import('./pages/FireCenter').then(m => ({ default: m.FireCenter })));
const HealthAndFinalRest = lazy(() => import('./pages/HealthAndFinalRest').then(m => ({ default: m.HealthAndFinalRest })));
const KnowledgeCenter = lazy(() => import('./pages/KnowledgeCenter').then(m => ({ default: m.KnowledgeCenter })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const DebtManagement = lazy(() => import('./pages/DebtManagement').then(m => ({ default: m.DebtManagement })));

function AppContent() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
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
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <Suspense fallback={<div className="p-8 text-center text-gray-500 animate-pulse">Đang tải phân hệ...</div>}>
        {renderActivePage()}
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
    if (window.confirm('Hành động này sẽ xóa toàn bộ dữ liệu tài chính trong thiết bị này và khôi phục về cấu hình mặc định. Bạn đã tải tệp sao lưu cứu hộ về chưa?')) {
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
          <h2 className="text-xl font-bold text-white font-serif">Đã xảy ra sự cố không mong muốn</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Hệ thống gặp lỗi render giao diện. Đừng lo lắng, dữ liệu tài chính của bạn vẫn an toàn trong LocalStorage của trình duyệt.
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
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
