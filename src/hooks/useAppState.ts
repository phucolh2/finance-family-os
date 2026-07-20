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
  DEFAULT_INCOME_CATEGORIES,
} from '../data/defaultInputs';

const LOCAL_STORAGE_KEY = 'family_finance_os_state';
const CURRENT_SCHEMA_VERSION = 1;

const initialDb = generateResolvedMonthlyDb(
  DEFAULT_FAMILY_PROFILE,
  DEFAULT_INCOME_SCHEDULE,
  DEFAULT_BUDGET_SCHEDULE,
  [], // default empty expense schedule
  DEFAULT_ASSETS,
  DEFAULT_ASSUMPTIONS,
  DEFAULT_LIFE_STAGES
);

const INITIAL_APP_STATE: AppState = {
  profile: DEFAULT_FAMILY_PROFILE,
  incomeCategories: DEFAULT_INCOME_CATEGORIES,
  incomeSchedule: DEFAULT_INCOME_SCHEDULE,
  budgetSchedule: DEFAULT_BUDGET_SCHEDULE,
  expenseSchedule: [],
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

  // Auto-reset observation month when Vite Hot Reload occurs
  useEffect(() => {
    if (import.meta.hot) {
      import.meta.hot.on('vite:beforeUpdate', () => {
        setSelectedPeriodKey(undefined);
      });
    }
  }, []);

  // Tracking the last saved date
  const [lastSaved, setLastSaved] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, unknown>;
        if (parsed.updatedAt) {
          return parsed.updatedAt as string;
        }
      }
    } catch {
      // ignore
    }
    return new Date().toISOString();
  });

  const [state, setState] = useState<AppState>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        let parsed: unknown;
        try {
          parsed = JSON.parse(stored);
        } catch (parseError) {
          console.error('Failed to parse localStorage state. Saving backup and resetting:', parseError);
          // Save a backup of the corrupted data
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_backup_${Date.now()}`, stored);
          // Show alert to user (if possible, though this is during initial render, so alert might block)
          // alert('Dữ liệu lưu trữ cục bộ bị hỏng. Đã tự động tạo bản sao lưu và khôi phục về mặc định.');
          return INITIAL_APP_STATE;
        }

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
            migrated.expenseSchedule,
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
      console.error('Failed to access localStorage:', e);
    }
    return INITIAL_APP_STATE;
  });

  // Debounced auto-save effect to prevent disk drag on frequent inputs
  useEffect(() => {
    const saveToLocalStorage = () => {
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
    };

    const handler = setTimeout(saveToLocalStorage, 500); // 500ms debounce
    
    // Force save on page unload/refresh to prevent data loss in race condition
    window.addEventListener('beforeunload', saveToLocalStorage);
    
    return () => { 
      clearTimeout(handler); 
      window.removeEventListener('beforeunload', saveToLocalStorage);
    };
  }, [state]);

  const saveState = (newState: AppState) => {
    const resolvedDb = generateResolvedMonthlyDb(
      newState.profile,
      newState.incomeSchedule,
      newState.budgetSchedule,
      newState.expenseSchedule,
      newState.assets,
      newState.assumptions,
      newState.lifeStages
    );

    const projection = runProjection({
      profile: newState.profile,
      incomeSchedule: newState.incomeSchedule,
      budgetSchedule: newState.budgetSchedule,
      expenseSchedule: newState.expenseSchedule,
      lifeEvents: newState.lifeEvents,
      assets: newState.assets,
      assumptions: newState.assumptions,
      investmentDeals: newState.investmentDeals ?? [],
      savingsDeposits: newState.savingsDeposits ?? [],
      projectionAdjustments: newState.projectionAdjustments,
      lifeStages: newState.lifeStages,
    });

    const updatedList = resolvedDb.list.map(dbItem => {
      const projRow = projection.monthlyRows.find(r => r.period.key === dbItem.periodKey);
      if (projRow) {
        const port = projRow.portfolio;
        const invested = newState.assets.reduce((sum, asset) => sum + port.assets[asset.type].endingBalance, 0);
        const planned = newState.assets.reduce((sum, asset) => sum + (port.assets[asset.type].earmarkedEndingBalance ?? 0), 0);
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
      id: `id_${Date.now().toString()}_${Math.random().toString(36).substring(2, 9)}`,
    };

    const updatedSchedule = [...state.incomeSchedule];
    const newMonthValue = newItem.effectiveYear * 12 + newItem.effectiveMonth;

    // Allow concurrent streams (e.g., passive income from Real Estate and Fulltime Salary).
    // Removed logic that auto-ends previous items to support multiple income streams.


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
      id: `budget_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
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

  // Expense Schedule Actions
  const addExpenseScheduleItem = (item: Omit<import('../types/budget').ExpenseScheduleItem, 'id'>) => {
    const newItem: import('../types/budget').ExpenseScheduleItem = {
      ...item,
      id: `expense_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    };

    let updatedSchedule = [...state.expenseSchedule];
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

        const updatedPrevItem: import('../types/budget').ExpenseScheduleItem = {
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
      expenseSchedule: updatedSchedule,
    });
  };

  const updateExpenseScheduleItem = (updated: import('../types/budget').ExpenseScheduleItem) => {
    saveState({
      ...state,
      expenseSchedule: state.expenseSchedule.map((item) => (item.id === updated.id ? updated : item)),
    });
  };

  const deleteExpenseScheduleItem = (id: string) => {
    saveState({
      ...state,
      expenseSchedule: state.expenseSchedule.filter((item) => item.id !== id),
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
      id: `event_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
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
      id: `deal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    };
    saveState({
      ...state,
      investmentDeals: [...(state.investmentDeals ?? []), newItem],
    });
  };

  const updateInvestmentDeal = (updated: InvestmentDeal) => {
    saveState({
      ...state,
      investmentDeals: (state.investmentDeals ?? []).map((item) => (item.id === updated.id ? updated : item)),
    });
  };

  const deleteInvestmentDeal = (id: string) => {
    saveState({
      ...state,
      investmentDeals: (state.investmentDeals ?? []).filter((item) => item.id !== id),
    });
  };

  const settleInvestmentDeal = (id: string, endMonth: number, endYear: number, realizedProfit: number) => {
    saveState({
      ...state,
      investmentDeals: (state.investmentDeals ?? []).map((item) => {
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

  const withdrawInvestmentDeal = (id: string, amount: number, realizedProfit: number, month: number, year: number) => {
    saveState({
      ...state,
      investmentDeals: (state.investmentDeals ?? []).map((item) => {
        if (item.id === id) {
          const newWithdrawal = {
            id: `wd_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            amount,
            realizedProfit,
            month,
            year,
          };
          return {
            ...item,
            withdrawals: [...(item.withdrawals || []), newWithdrawal]
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
      id: `saving_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    };
    saveState({
      ...state,
      savingsDeposits: [...(state.savingsDeposits ?? []), newItem],
    });
  };

  const updateSavingsDeposit = (updated: SavingsDeposit) => {
    saveState({
      ...state,
      savingsDeposits: (state.savingsDeposits ?? []).map((item) => (item.id === updated.id ? updated : item)),
    });
  };

  const deleteSavingsDeposit = (id: string) => {
    saveState({
      ...state,
      savingsDeposits: (state.savingsDeposits ?? []).filter((item) => item.id !== id),
    });
  };

  const settleSavingsDepositEarly = (id: string, settledMonth: number, settledYear: number, realizedInterest: number) => {
    saveState({
      ...state,
      savingsDeposits: (state.savingsDeposits ?? []).map((item) => {
        if (item.id === id) {
          return {
            ...item,
            status: 'settled_early',
            settledMonth,
            settledYear,
            realizedInterest,
          };
        }
        return item;
      }),
    });
  };

  const resetToDefault = () => {
    saveState(INITIAL_APP_STATE);
  };

  // Projection Adjustment Actions
  const addProjectionAdjustment = (item: Omit<ProjectionAdjustmentRecord, 'id'>) => {
    const newItem: ProjectionAdjustmentRecord = {
      ...item,
      id: `adj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    };
    saveState({
      ...state,
      projectionAdjustments: [...(state.projectionAdjustments ?? []), newItem],
    });
  };

  const updateProjectionAdjustment = (updated: ProjectionAdjustmentRecord) => {
    saveState({
      ...state,
      projectionAdjustments: (state.projectionAdjustments ?? []).map((item) => (item.id === updated.id ? updated : item)),
    });
  };

  const deleteProjectionAdjustment = (id: string) => {
    saveState({
      ...state,
      projectionAdjustments: (state.projectionAdjustments ?? []).filter((item) => item.id !== id),
    });
  };

  // Safe import JSON helper with strict schema checks
  const importState = (imported: unknown): { success: boolean; error?: string } => {
    try {
      const migrated = migrateState(imported, INITIAL_APP_STATE);
      if (validateAppState(migrated)) {
        saveState(migrated);
        return { success: true };
      }
      return { success: false, error: 'Định dạng dữ liệu JSON không đúng chuẩn AppState.' };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Lỗi đọc tệp dữ liệu nhập khẩu.' };
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
    addExpenseScheduleItem,
    updateExpenseScheduleItem,
    deleteExpenseScheduleItem,
    addLifeEvent,
    updateLifeEvent,
    deleteLifeEvent,
    addInvestmentDeal,
    updateInvestmentDeal,
    deleteInvestmentDeal,
    settleInvestmentDeal,
    withdrawInvestmentDeal,
    addSavingsDeposit,
    updateSavingsDeposit,
    deleteSavingsDeposit,
    settleSavingsDepositEarly,
    
    addSinkingFund: (item: Omit<import('../types/finance').SinkingFund, 'id'>) => {
      saveState({
        ...state,
        sinkingFunds: [...(state.sinkingFunds ?? []), { ...item, id: `sf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}` }],
      });
    },
    updateSinkingFund: (updated: import('../types/finance').SinkingFund) => {
      saveState({
        ...state,
        sinkingFunds: (state.sinkingFunds ?? []).map(item => item.id === updated.id ? updated : item),
      });
    },
    deleteSinkingFund: (id: string) => {
      saveState({
        ...state,
        sinkingFunds: (state.sinkingFunds ?? []).filter(item => item.id !== id),
      });
    },
    disburseSinkingFund: (id: string, disbursedMonth: number, disbursedYear: number) => {
      saveState({
        ...state,
        sinkingFunds: (state.sinkingFunds ?? []).map(item => {
          if (item.id === id) {
            return { ...item, status: 'disbursed', disbursedMonth, disbursedYear };
          }
          return item;
        }),
      });
    },

    addDebt: (item: Omit<import('../types/finance').DebtLiability, 'id'>) => {
      saveState({
        ...state,
        debts: [...(state.debts ?? []), { ...item, id: `debt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}` }],
      });
    },
    updateDebt: (updated: import('../types/finance').DebtLiability) => {
      saveState({
        ...state,
        debts: (state.debts ?? []).map(item => item.id === updated.id ? updated : item),
      });
    },
    deleteDebt: (id: string) => {
      saveState({
        ...state,
        debts: (state.debts ?? []).filter(item => item.id !== id),
      });
    },
    settleDebt: (id: string) => {
      saveState({
        ...state,
        debts: (state.debts ?? []).map(item => {
          if (item.id === id) {
            return { ...item, status: 'settled' };
          }
          return item;
        }),
      });
    },
    addIncomeCategory: (item: Omit<import('../types/finance').IncomeCategory, 'id'>) => {
      saveState({
        ...state,
        incomeCategories: [...(state.incomeCategories ?? []), { ...item, id: `inc_cat_${Date.now()}` }],
      });
    },
    updateIncomeCategory: (updated: import('../types/finance').IncomeCategory) => {
      saveState({
        ...state,
        incomeCategories: (state.incomeCategories ?? []).map(item => item.id === updated.id ? updated : item),
      });
    },
    deleteIncomeCategory: (id: string) => {
      saveState({
        ...state,
        incomeCategories: (state.incomeCategories ?? []).filter(item => item.id !== id),
        incomeSchedule: state.incomeSchedule.map(item => 
          item.incomeType === id ? { ...item, incomeType: 'irregular_income' } : item
        ),
      });
    },

    addFundTransfer: (transfer: Omit<import('../types/finance').FundTransfer, 'id' | 'createdAt'>) => {
      const newTransfer = {
        ...transfer,
        id: `tf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        createdAt: Date.now(),
      };
      
      const nextState = { ...state };
      nextState.fundTransfers = [...(state.fundTransfers ?? []), newTransfer];
      
      // Deduct from Source
      if (transfer.sourceType === 'investment' && transfer.sourceId) {
        nextState.investmentDeals = (nextState.investmentDeals ?? []).map(deal => 
          deal.id === transfer.sourceId ? { ...deal, capital: Math.max(0, deal.capital - transfer.amount) } : deal
        );
      } else if (transfer.sourceType === 'sinking_fund' && transfer.sourceId) {
        nextState.sinkingFunds = (nextState.sinkingFunds ?? []).map(fund => 
          fund.id === transfer.sourceId ? { ...fund, initialDeposit: Math.max(0, fund.initialDeposit - transfer.amount) } : fund
        );
      } else if (transfer.sourceType === 'life_event' && transfer.sourceId) {
        nextState.lifeEvents = (nextState.lifeEvents ?? []).map(evt => 
          evt.id === transfer.sourceId ? { ...evt, amount: Math.max(0, evt.amount - transfer.amount) } : evt
        );
      } else if (transfer.sourceType === 'savings' && transfer.sourceId) {
        nextState.savingsDeposits = (nextState.savingsDeposits ?? []).map(sav => 
          sav.id === transfer.sourceId ? { ...sav, principal: Math.max(0, sav.principal - transfer.amount) } : sav
        );
      }

      // Auto-handle destination logic if applicable
      if (transfer.destinationType === 'savings') {
        const newSavings: import('../types/finance').SavingsDeposit = {
          id: `sav_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          name: `Nhận điều chuyển từ ${transfer.sourceType === 'cashflow' ? 'Dòng tiền' : transfer.sourceType === 'investment' ? 'Đầu tư' : 'Khác'}`,
          principal: transfer.amount,
          interestRateAnnual: state.assumptions.savingsInterestRateAnnual || 5.0,
          termMonths: 6,
          startMonth: transfer.month,
          startYear: transfer.year,
          pool: transfer.sourceType === 'savings' ? 'saving' : 'idle',
          status: 'active',
          notes: transfer.note
        };
        nextState.savingsDeposits = [...(nextState.savingsDeposits ?? []), newSavings];
      } else if (transfer.destinationType === 'investment' && transfer.destinationId) {
        nextState.investmentDeals = (nextState.investmentDeals ?? []).map(deal => {
          if (deal.id === transfer.destinationId) {
            return { ...deal, capital: deal.capital + transfer.amount };
          }
          return deal;
        });
      } else if (transfer.destinationType === 'sinking_fund' && transfer.destinationId) {
         nextState.sinkingFunds = (nextState.sinkingFunds ?? []).map(fund => {
            if (fund.id === transfer.destinationId) {
               return { ...fund, initialDeposit: fund.initialDeposit + transfer.amount };
            }
            return fund;
         });
      } else if (transfer.destinationType === 'debt' && transfer.destinationId) {
         nextState.debts = (nextState.debts ?? []).map(debt => {
             if (debt.id === transfer.destinationId) {
                 return { ...debt, principal: Math.max(0, debt.principal - transfer.amount) };
             }
             return debt;
         });
      }

      // Auto-handle source logic
      if (transfer.sourceType === 'savings' && transfer.sourceId) {
         nextState.savingsDeposits = (nextState.savingsDeposits ?? []).map(sav => {
             if (sav.id === transfer.sourceId) {
                 const newWithdrawal: import('../types/finance').WithdrawalEvent = {
                     id: `wd_${Date.now()}`,
                     month: transfer.month,
                     year: transfer.year,
                     amount: transfer.amount,
                     note: 'Điều chuyển nội bộ'
                 };
                 return { ...sav, withdrawals: [...(sav.withdrawals ?? []), newWithdrawal] };
             }
             return sav;
         });
      } else if (transfer.sourceType === 'investment' && transfer.sourceId) {
         nextState.investmentDeals = (nextState.investmentDeals ?? []).map(deal => {
             if (deal.id === transfer.sourceId) {
                 const newWithdrawal: import('../types/finance').WithdrawalEvent = {
                     id: `wd_${Date.now()}`,
                     month: transfer.month,
                     year: transfer.year,
                     amount: transfer.amount,
                     realizedProfit: 0,
                     note: 'Điều chuyển nội bộ'
                 };
                 return { ...deal, withdrawals: [...(deal.withdrawals ?? []), newWithdrawal] };
             }
             return deal;
         });
      } else if (transfer.sourceType === 'sinking_fund' && transfer.sourceId) {
         nextState.sinkingFunds = (nextState.sinkingFunds ?? []).map(fund => {
             if (fund.id === transfer.sourceId) {
                 const newWithdrawal: import('../types/finance').WithdrawalEvent = {
                     id: `wd_${Date.now()}`,
                     month: transfer.month,
                     year: transfer.year,
                     amount: transfer.amount,
                     note: 'Điều chuyển nội bộ'
                 };
                 return { ...fund, withdrawals: [...(fund.withdrawals ?? []), newWithdrawal] };
             }
             return fund;
         });
      }

      saveState(nextState);
    },
    deleteFundTransfer: (id: string) => {
      // Simplification: In a full production app, this would rollback the associated withdrawals and deposits.
      saveState({
        ...state,
        fundTransfers: (state.fundTransfers ?? []).filter(item => item.id !== id),
      });
    },

    addProjectionAdjustment,
    updateProjectionAdjustment,
    deleteProjectionAdjustment,
    resetToDefault,
    importState,
  };
}
export type AppStateHook = ReturnType<typeof useAppState>;
