import { useState, useEffect } from 'react';
import type { AppState, PersistedAppState, FamilyProfile, IncomeScheduleItem, Assumptions, LifeEvent, InvestmentDeal, SavingsDeposit } from '../types/finance';
import type { ProjectionAdjustmentRecord } from '../types/projection';
import type { BudgetRatioScheduleItem } from '../types/budget';
import type { AssetConfig } from '../types/portfolio';
import { migrateState, validateAppState } from '../utils/migration';
import { generateResolvedMonthlyDb } from '../engines/databaseResolver';
import { runProjection } from '../engines/projectionEngine';
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
  DEFAULT_ASSUMPTIONS,
  DEFAULT_LIFE_STAGES
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
  savingsDeposits: [],
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
            migrated.assumptions,
            migrated.lifeStages
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
      newState.assumptions,
      newState.lifeStages
    );

    const projection = runProjection({
      profile: newState.profile,
      incomeSchedule: newState.incomeSchedule,
      budgetSchedule: newState.budgetSchedule,
      lifeEvents: newState.lifeEvents || [],
      assets: newState.assets,
      assumptions: newState.assumptions,
      investmentDeals: newState.investmentDeals || [],
      savingsDeposits: newState.savingsDeposits || [],
      projectionAdjustments: newState.projectionAdjustments,
      lifeStages: newState.lifeStages,
    });

    const updatedList = resolvedDb.list.map(dbItem => {
      const projRow = projection.monthlyRows.find(r => r.period.key === dbItem.periodKey);
      if (projRow) {
        const port = projRow.portfolio;
        const invested = newState.assets.reduce((sum, asset) => sum + port.assets[asset.type].endingBalance, 0);
        const planned = newState.assets.reduce((sum, asset) => sum + (port.assets[asset.type].earmarkedEndingBalance || 0), 0);
        const idle = Math.max(0, port.totalEndingBalance - invested - planned);

        return {
          ...dbItem,
          investmentFlow: {
            beginningBalance: port.totalBeginningBalance,
            contribution: port.totalContribution,
            pnl: port.totalPnl,
            endingBalance: port.totalEndingBalance,
            invested,
            planned,
            idle,
          }
        };
      }
      return dbItem;
    });

    const updatedMap: Record<string, typeof resolvedDb.list[0]> = {};
    updatedList.forEach(item => {
      updatedMap[item.periodKey] = item;
    });

    setState({
      ...newState,
      resolvedMonthlyDb: updatedList,
      resolvedMonthlyDbMap: updatedMap,
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

    let updatedSchedule = [...state.incomeSchedule];
    const newMonthValue = newItem.effectiveYear * 12 + newItem.effectiveMonth;

    // Find the immediately preceding item
    const precedingItems = updatedSchedule.filter(
      (it) => it.effectiveYear * 12 + it.effectiveMonth < newMonthValue
    );

    if (precedingItems.length > 0) {
      precedingItems.sort(
        (a, b) =>
          b.effectiveYear * 12 + b.effectiveMonth - (a.effectiveYear * 12 + a.effectiveMonth)
      );
      const prevItem = precedingItems[0];

      // Only auto-end it if it doesn't already have an end date
      if (!prevItem.endYear) {
        let endMonth = newItem.effectiveMonth - 1;
        let endYear = newItem.effectiveYear;
        if (endMonth === 0) {
          endMonth = 12;
          endYear -= 1;
        }

        const updatedPrevItem: IncomeScheduleItem = {
          ...prevItem,
          endMonth,
          endYear,
          status: 'settled',
        };

        updatedSchedule = updatedSchedule.map((it) =>
          it.id === prevItem.id ? updatedPrevItem : it
        );
      }
    }

    updatedSchedule.push(newItem);

    saveState({
      ...state,
      incomeSchedule: updatedSchedule,
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

    let updatedSchedule = [...state.budgetSchedule];
    const newMonthValue = newItem.effectiveYear * 12 + newItem.effectiveMonth;

    // Find the immediately preceding item
    const precedingItems = updatedSchedule.filter(
      (it) => it.effectiveYear * 12 + it.effectiveMonth < newMonthValue
    );

    if (precedingItems.length > 0) {
      precedingItems.sort(
        (a, b) =>
          b.effectiveYear * 12 + b.effectiveMonth - (a.effectiveYear * 12 + a.effectiveMonth)
      );
      const prevItem = precedingItems[0];

      // Only auto-end it if it doesn't already have an end date
      if (!prevItem.endYear) {
        let endMonth = newItem.effectiveMonth - 1;
        let endYear = newItem.effectiveYear;
        if (endMonth === 0) {
          endMonth = 12;
          endYear -= 1;
        }

        const updatedPrevItem: BudgetRatioScheduleItem = {
          ...prevItem,
          endMonth,
          endYear,
          status: 'settled',
        };

        updatedSchedule = updatedSchedule.map((it) =>
          it.id === prevItem.id ? updatedPrevItem : it
        );
      }
    }

    updatedSchedule.push(newItem);

    saveState({
      ...state,
      budgetSchedule: updatedSchedule,
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

  // Savings Deposit Actions
  const addSavingsDeposit = (item: Omit<SavingsDeposit, 'id'>) => {
    const newItem: SavingsDeposit = {
      ...item,
      id: `saving_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    saveState({
      ...state,
      savingsDeposits: [...(state.savingsDeposits || []), newItem],
    });
  };

  const updateSavingsDeposit = (updated: SavingsDeposit) => {
    saveState({
      ...state,
      savingsDeposits: (state.savingsDeposits || []).map((item) => (item.id === updated.id ? updated : item)),
    });
  };

  const deleteSavingsDeposit = (id: string) => {
    saveState({
      ...state,
      savingsDeposits: (state.savingsDeposits || []).filter((item) => item.id !== id),
    });
  };

  const resetToDefault = () => {
    saveState(INITIAL_APP_STATE);
  };

  // Projection Adjustment Actions
  const addProjectionAdjustment = (item: Omit<ProjectionAdjustmentRecord, 'id'>) => {
    const newItem: ProjectionAdjustmentRecord = {
      ...item,
      id: `adj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    saveState({
      ...state,
      projectionAdjustments: [...(state.projectionAdjustments || []), newItem],
    });
  };

  const updateProjectionAdjustment = (updated: ProjectionAdjustmentRecord) => {
    saveState({
      ...state,
      projectionAdjustments: (state.projectionAdjustments || []).map((item) => (item.id === updated.id ? updated : item)),
    });
  };

  const deleteProjectionAdjustment = (id: string) => {
    saveState({
      ...state,
      projectionAdjustments: (state.projectionAdjustments || []).filter((item) => item.id !== id),
    });
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
    addSavingsDeposit,
    updateSavingsDeposit,
    deleteSavingsDeposit,
    addProjectionAdjustment,
    updateProjectionAdjustment,
    deleteProjectionAdjustment,
    resetToDefault,
    importState,
  };
}
export type AppStateHook = ReturnType<typeof useAppState>;
