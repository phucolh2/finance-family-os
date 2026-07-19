import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/layout/Layout';
import { Suspense, lazy } from 'react';
import { CopilotChat } from './components/copilot/CopilotChat';

const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const CashflowQuadrant = lazy(() => import('./pages/CashflowQuadrant').then(m => ({ default: m.CashflowQuadrant })));
const EventLedger = lazy(() => import('./pages/EventLedger').then(m => ({ default: m.EventLedger })));
const IncomeSchedule = lazy(() => import('./pages/IncomeSchedule').then(m => ({ default: m.IncomeSchedule })));
const BudgetHistory = lazy(() => import('./pages/BudgetHistory').then(m => ({ default: m.BudgetHistory })));
const LifeStages = lazy(() => import('./pages/LifeStages').then(m => ({ default: m.LifeStages })));
const ScenarioBase = lazy(() => import('./pages/ScenarioBase').then(m => ({ default: m.ScenarioBase })));
const ScenarioChild2031 = lazy(() => import('./pages/ScenarioChild2031').then(m => ({ default: m.ScenarioChild2031 })));
const ScenarioManagement = lazy(() => import('./pages/ScenarioManagement').then(m => ({ default: m.ScenarioManagement })));
const Portfolio = lazy(() => import('./pages/Portfolio').then(m => ({ default: m.Portfolio })));
const SavingsAndDebt = lazy(() => import('./pages/SavingsAndDebt').then(m => ({ default: m.SavingsAndDebt })));
const FireCenter = lazy(() => import('./pages/FireCenter').then(m => ({ default: m.FireCenter })));
const HealthAndFinalRest = lazy(() => import('./pages/HealthAndFinalRest').then(m => ({ default: m.HealthAndFinalRest })));
const KnowledgeCenter = lazy(() => import('./pages/KnowledgeCenter').then(m => ({ default: m.KnowledgeCenter })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));

function AppContent() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'cashflow':
        return <CashflowQuadrant />;
      case 'event_ledger':
        return <EventLedger />;
      case 'income':
        return <IncomeSchedule />;
      case 'budget_history':
        return <BudgetHistory />;
      case 'life_stages':
        return <LifeStages />;
      case 'scenario_base':
        return <ScenarioBase />;
      case 'scenario_child_2031':
        return <ScenarioChild2031 />;
      case 'scenario_mgmt':
        return <ScenarioManagement />;
      case 'portfolio':
        return <Portfolio />;
      case 'savings_debt':
        return <SavingsAndDebt />;
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
      <CopilotChat />
    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
