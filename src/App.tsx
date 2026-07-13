import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { EventLedger } from './pages/EventLedger';
import { IncomeSchedule } from './pages/IncomeSchedule';
import { BudgetHistory } from './pages/BudgetHistory';
import { LifeStages } from './pages/LifeStages';
import { ScenarioBase } from './pages/ScenarioBase';
import { ScenarioChild2031 } from './pages/ScenarioChild2031';
import { ScenarioManagement } from './pages/ScenarioManagement';
import { Portfolio } from './pages/Portfolio';
import { FireCenter } from './pages/FireCenter';
import { HealthAndFinalRest } from './pages/HealthAndFinalRest';
import { KnowledgeCenter } from './pages/KnowledgeCenter';
import { Settings } from './pages/Settings';
import { CopilotChat } from './components/copilot/CopilotChat';

function AppContent() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
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
      {renderActivePage()}
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
