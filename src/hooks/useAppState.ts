import { useState, useEffect } from 'react';
import type { AppState, PersistedAppState, FamilyProfile, IncomeScheduleItem, Assumptions, LifeEvent, InvestmentDeal } from '../types/finance';
import type { BudgetRatioScheduleItem } from '../types/budget';
import type { AssetConfig } from '../types/portfolio';
import { migrateState, validateAppState } from '../utils/migration';
import { generateResolvedMonthlyDb } from '../engines/databaseResolver';
import {
  DEFAULT_FAMILY_PROFILE,
  DEFAULT_INCOME_SCHEDULE,
  DEFAULT_BUDGET_SCHEDULE,
  DEFAULT_LIFE_STAGES,
  DEFAULT_ASSETS,
  DEFAULT_ASSUMPTIONS,
  DEFAULT_LIFE_EVENTS,
  DEFAULT_INVESTMENT_DEALS,
} from '../data/defaultInputs';

const LOCAL_STORAGE_KEY = 'family_finance_os_state';
const CURRENT_SCHEMA_VERSION = 1;

const initialDb = generateResolvedMonthlyDb(
  DEFAULT_FAMILY_PROFILE,
  DEFAULT_INCOME_SCHEDULE,
  DEFAULT_BUDGET_SCHEDULE,
  DEFAULT_ASSETS,
  DEFAULT_ASSUMPTIONS
);

const INITIAL_APP_STATE: AppState = {
  profile: DEFAULT_FAMILY_PROFILE,
  incomeSchedule: DEFAULT_INCOME_SCHEDULE,
  budgetSchedule: DEFAULT_BUDGET_SCHEDULE,
  lifeStages: DEFAULT_LIFE_STAGES,
  lifeEvents: DEFAULT_LIFE_EVENTS,
  assets: DEFAULT_ASSETS,
  assumptions: DEFAULT_ASSUMPTIONS,
  investmentDeals: DEFAULT_INVESTMENT_DEALS,
  resolvedMonthlyDb: initialDb.list,
  resolvedMonthlyDbMap: initialDb.map,
};

export function useAppState() {
  // Global selected period key for observation
  const [selectedPeriodKey, setSelectedPeriodKey] = useState<string | undefined>(undefined);

  // Tracking the last saved date
  const [lastSaved, setLastSaved] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.updatedAt || new Date().toISOString();
      }
    } catch (_) {}
    return new Date().toISOString();
  });

  const [state, setState] = useState<AppState>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const migrated = migrateState(parsed, INITIAL_APP_STATE);
        if (
          !migrated.resolvedMonthlyDb ||
          migrated.resolvedMonthlyDb.length === 0 ||
          !migrated.resolvedMonthlyDbMap
        ) {
          const dbResult = generateResolvedMonthlyDb(
            migrated.profile,
            migrated.incomeSchedule,
            migrated.budgetSchedule,
            migrated.assets,
            migrated.assumptions
          );
          migrated.resolvedMonthlyDb = dbResult.list;
          migrated.resolvedMonthlyDbMap = dbResult.map;
        }
        return migrated;
      }
    } catch (e) {
      console.error('Failed to parse localStorage state:', e);
    }
    return INITIAL_APP_STATE;
  });

  // Debounced auto-save effect to prevent disk drag on frequent inputs
  useEffect(() => {
    const handler = setTimeout(() => {
      try {
        const timestamp = new Date().toISOString();
        const persisted: PersistedAppState = {
          schemaVersion: CURRENT_SCHEMA_VERSION,
          updatedAt: timestamp,
          data: state,
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(persisted));
        setLastSaved(timestamp);
      } catch (err) {
        console.error('Failed to write to localStorage:', err);
      }
    }, 500); // 500ms debounce
    return () => clearTimeout(handler);
  }, [state]);

  const saveState = (newState: AppState) => {
    const resolvedDb = generateResolvedMonthlyDb(
      newState.profile,
      newState.incomeSchedule,
      newState.budgetSchedule,
      newState.assets,
      newState.assumptions
    );
    setState({
      ...newState,
      resolvedMonthlyDb: resolvedDb.list,
      resolvedMonthlyDbMap: resolvedDb.map,
    });
  };

  const updateProfile = (profile: FamilyProfile) => {
    saveState({ ...state, profile });
  };

  const updateAssumptions = (assumptions: Assumptions) => {
    saveState({ ...state, assumptions });
  };

  // Income Schedule Actions
  const addIncomeItem = (item: Omit<IncomeScheduleItem, 'id'>) => {
    const newItem: IncomeScheduleItem = {
      ...item,
      id: `income_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    saveState({
      ...state,
      incomeSchedule: [...state.incomeSchedule, newItem],
    });
  };

  const updateIncomeItem = (updated: IncomeScheduleItem) => {
    saveState({
      ...state,
      incomeSchedule: state.incomeSchedule.map((item) => (item.id === updated.id ? updated : item)),
    });
  };

  const deleteIncomeItem = (id: string) => {
    saveState({
      ...state,
      incomeSchedule: state.incomeSchedule.filter((item) => item.id !== id),
    });
  };

  // Budget Schedule Actions
  const addBudgetScheduleItem = (item: Omit<BudgetRatioScheduleItem, 'id'>) => {
    const newItem: BudgetRatioScheduleItem = {
      ...item,
      id: `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    saveState({
      ...state,
      budgetSchedule: [...state.budgetSchedule, newItem],
    });
  };

  const updateBudgetScheduleItem = (updated: BudgetRatioScheduleItem) => {
    saveState({
      ...state,
      budgetSchedule: state.budgetSchedule.map((item) => (item.id === updated.id ? updated : item)),
    });
  };

  const deleteBudgetScheduleItem = (id: string) => {
    saveState({
      ...state,
      budgetSchedule: state.budgetSchedule.filter((item) => item.id !== id),
    });
  };

  const updateAssets = (assets: AssetConfig[]) => {
    saveState({
      ...state,
      assets,
    });
  };

  // Life Event Actions
  const addLifeEvent = (item: Omit<LifeEvent, 'id'>) => {
    const newItem: LifeEvent = {
      ...item,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    saveState({
      ...state,
      lifeEvents: [...state.lifeEvents, newItem],
    });
  };

  const updateLifeEvent = (updated: LifeEvent) => {
    saveState({
      ...state,
      lifeEvents: state.lifeEvents.map((item) => (item.id === updated.id ? updated : item)),
    });
  };

  const deleteLifeEvent = (id: string) => {
    saveState({
      ...state,
      lifeEvents: state.lifeEvents.filter((item) => item.id !== id),
    });
  };

  // Investment Deals Actions
  const addInvestmentDeal = (item: Omit<InvestmentDeal, 'id'>) => {
    const newItem: InvestmentDeal = {
      ...item,
      id: `deal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    saveState({
      ...state,
      investmentDeals: [...(state.investmentDeals || []), newItem],
    });
  };

  const updateInvestmentDeal = (updated: InvestmentDeal) => {
    saveState({
      ...state,
      investmentDeals: (state.investmentDeals || []).map((item) => (item.id === updated.id ? updated : item)),
    });
  };

  const deleteInvestmentDeal = (id: string) => {
    saveState({
      ...state,
      investmentDeals: (state.investmentDeals || []).filter((item) => item.id !== id),
    });
  };

  const settleInvestmentDeal = (id: string, endMonth: number, endYear: number, realizedProfit: number) => {
    saveState({
      ...state,
      investmentDeals: (state.investmentDeals || []).map((item) => {
        if (item.id === id) {
          return {
            ...item,
            status: 'settled',
            endMonth,
            endYear,
            realizedProfit,
          };
        }
        return item;
      }),
    });
  };

  const resetToDefault = () => {
    saveState(INITIAL_APP_STATE);
  };

  // Safe import JSON helper with strict schema checks
  const importState = (imported: any): { success: boolean; error?: string } => {
    try {
      const migrated = migrateState(imported, INITIAL_APP_STATE);
      if (validateAppState(migrated)) {
        saveState(migrated);
        return { success: true };
      }
      return { success: false, error: 'Định dạng dữ liệu JSON không đúng chuẩn AppState.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lỗi đọc tệp dữ liệu nhập khẩu.' };
    }
  };

  return {
    state,
    lastSaved,
    selectedPeriodKey,
    setSelectedPeriodKey,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    updateProfile,
    updateAssumptions,
    updateAssets,
    addIncomeItem,
    updateIncomeItem,
    deleteIncomeItem,
    addBudgetScheduleItem,
    updateBudgetScheduleItem,
    deleteBudgetScheduleItem,
    addLifeEvent,
    updateLifeEvent,
    deleteLifeEvent,
    addInvestmentDeal,
    updateInvestmentDeal,
    deleteInvestmentDeal,
    settleInvestmentDeal,
    resetToDefault,
    importState,
  };
}
export type AppStateHook = ReturnType<typeof useAppState>;
