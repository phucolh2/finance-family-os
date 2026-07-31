import type { ResolvedMonthlyDbItem, LifeEvent } from '../types/finance';
import type { BudgetGroup } from '../types/budget';
import { safeNumber } from '../utils/math';

export interface ExpenseGroupSummary {
  groupId: BudgetGroup | 'all';
  totalBudget: number;
  totalActual: number; // Includes flexible (LifeEvents)
  totalRegularActual: number; // Excludes flexible (LifeEvents)
}

export interface ExpenseMonthlyPoint {
  periodKey: string; // "YYYY-MM"
  month: number;
  year: number;
  budget: number;
  actual: number;
  regularActual: number;
  flexibleActual: number;
}

export interface ExpenseCategorySummary {
  categoryId: string;
  totalBudget: number;
  totalActual: number;
}

export interface ExpenseAnalysisResult {
  summaryByGroup: Record<string, ExpenseGroupSummary>;
  summaryByCategory: Record<string, ExpenseCategorySummary>;
  monthlySeries: Record<string, ExpenseMonthlyPoint[]>; // key is groupId ('all', 'housing_basic', etc.)
}

export function analyzeExpense(
  resolvedMonthlyDb: ResolvedMonthlyDbItem[],
  lifeEvents: LifeEvent[],
  currentPeriodKey?: string,
  dynamicExpenseGroupIds?: string[]
): ExpenseAnalysisResult {
  // Dynamically build groups from resolvedMonthlyDb
  const groupsSet = new Set<string>(['all']);
  resolvedMonthlyDb.forEach(db => {
    if (db.budgetAmounts) {
      Object.keys(db.budgetAmounts).forEach(k => groupsSet.add(k));
    }
  });
  
  // Ensure standard groups exist for backward compatibility and charting assumptions
  ['housing_basic', 'future_investing', 'safety_reserve', 'family_experience', 'health_growth', 'children', 'parents'].forEach(k => groupsSet.add(k));

  const groups = Array.from(groupsSet);

  const summaryByGroup: Record<string, ExpenseGroupSummary> = {};
  const summaryByCategory: Record<string, ExpenseCategorySummary> = {};
  const monthlySeries: Record<string, ExpenseMonthlyPoint[]> = {};
  
  groups.forEach(g => {
    summaryByGroup[g] = { groupId: g as any, totalBudget: 0, totalActual: 0, totalRegularActual: 0 };
    monthlySeries[g] = [];
  });

  // Default to the provided period, OR the current real-world month, OR the first month
  let targetPeriod = currentPeriodKey;
  
  if (!targetPeriod && resolvedMonthlyDb.length > 0) {
    const now = new Date();
    const nowKey = `${String(now.getFullYear())}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const foundNow = resolvedMonthlyDb.find(db => db.periodKey === nowKey);
    targetPeriod = foundNow ? nowKey : resolvedMonthlyDb[0].periodKey;
  }

  let targetIndex = resolvedMonthlyDb.findIndex(db => db.periodKey === targetPeriod);
  if (targetIndex === -1) {
    targetIndex = 0; // fallback to first month instead of last month
  }

  // The period window starts exactly from "Mốc bắt đầu" (index 0 of resolvedMonthlyDb)
  // and ends at "Tháng quan sát" (targetIndex)
  const windowDb = resolvedMonthlyDb.slice(0, targetIndex + 1);

  const expenseGroupsSet = new Set(
    dynamicExpenseGroupIds && dynamicExpenseGroupIds.length > 0 
      ? dynamicExpenseGroupIds 
      : ['housing_basic', 'family_experience', 'health_growth', 'children', 'parents']
  );

  windowDb.forEach(dbItem => {
    const bAmounts = dbItem.budgetAmounts;
    
    // Only include actual expense groups in the 'all' budget total based on dynamic classification
    let totalExpenseBudget = 0;
    expenseGroupsSet.forEach(gId => {
      totalExpenseBudget += (bAmounts as any)[gId] || 0;
    });

    const monthlyBudgets: Record<string, number> = {
      'all': totalExpenseBudget,
    };
    groups.forEach(g => {
      if (g !== 'all') {
        monthlyBudgets[g] = (bAmounts as any)[g] || 0;
      }
    });

    // Monthly Actuals
    // Extract actual expenses from dbItem.actualExpenseCategories (which comes from ExpenseSchedule)
    const monthlyActuals: Record<string, number> = { 'all': 0 };
    groups.forEach(g => {
      if (g !== 'all') {
        monthlyActuals[g] = 0;
      }
    });

    if (dbItem.actualExpenseByGroup) {
      Object.entries(dbItem.actualExpenseByGroup).forEach(([groupId, amount]) => {
        const expenseAmount = safeNumber(amount);
        if (expenseAmount <= 0) return;
        
        if (groupId in monthlyActuals) {
          monthlyActuals[groupId] += expenseAmount;
        }
        
        // Only sum actual expenses for 'all', excluding legacy investment/savings entries
        if (expenseGroupsSet.has(groupId)) {
          monthlyActuals.all += expenseAmount;
        }
      });
    } else if (dbItem.actualExpenseCategories) {
      // Fallback for older data that doesn't have actualExpenseByGroup
      Object.entries(dbItem.actualExpenseCategories).forEach(([categoryId, amount]) => {
        const expenseAmount = safeNumber(amount);
        if (expenseAmount <= 0) return;

        // categoryId is in format "groupId/itemId" or just "groupId"
        const groupId = categoryId.split('/')[0];
        
        if (groupId in monthlyActuals) {
          monthlyActuals[groupId] += expenseAmount;
        }
        
        // Only sum actual expenses for 'all', excluding legacy investment/savings entries
        if (expenseGroupsSet.has(groupId)) {
          monthlyActuals.all += expenseAmount;
        }
      });
    }

    const monthlyRegularActuals = { ...monthlyActuals };

    // Add Life Events spending that hit these expense groups
    const dbMonthValue = dbItem.year * 12 + dbItem.month;
    
    lifeEvents.forEach(e => {
       // 1. One-time expenses (Trừ thẳng 1 cục)
       const eMonthValue = safeNumber(e.year) * 12 + safeNumber(e.month);
       if (eMonthValue === dbMonthValue) {
           const amt = safeNumber(e.amount);
           if (amt < 0) { // Only count expenses
              const groupId = e.source ? e.source.split('/')[0] : '';
              if (expenseGroupsSet.has(groupId)) {
                 const absAmt = Math.abs(amt);
                 if (groupId in monthlyActuals) {
                    monthlyActuals[groupId] += absAmt;
                 }
                 monthlyActuals.all += absAmt;
              }
           }
       }
       
       // 2. Track A expenses (Trừ định kì hàng tháng)
       if (e.spendingCategory && e.recurringMonthlyImpact && safeNumber(e.recurringMonthlyImpact) < 0) {
           let startMonth = safeNumber(e.month) + 1;
           let startYear = safeNumber(e.year);
           if (startMonth > 12) { startMonth = 1; startYear += 1; }
           const startMonthValue = startYear * 12 + startMonth;
           
           const durationA = safeNumber(e.recurringDurationMonths) || 0;
           const endMonthValueA = durationA > 0 ? startMonthValue + durationA : Infinity;
           
           if (dbMonthValue >= startMonthValue && dbMonthValue < endMonthValueA) {
               const groupId = e.spendingCategory.split('/')[0];
               if (expenseGroupsSet.has(groupId)) {
                  const absAmt = Math.abs(safeNumber(e.recurringMonthlyImpact));
                  if (groupId in monthlyActuals) {
                     monthlyActuals[groupId] += absAmt;
                  }
                  monthlyActuals.all += absAmt;
               }
           }
       }
    });

    // Accumulate category summaries
    if (dbItem.budgetAmountsByCategory) {
      Object.entries(dbItem.budgetAmountsByCategory).forEach(([categoryId, amount]) => {
        if (!summaryByCategory[categoryId]) {
          summaryByCategory[categoryId] = { categoryId, totalBudget: 0, totalActual: 0 };
        }
        summaryByCategory[categoryId].totalBudget += safeNumber(amount);
      });
    }

    if (dbItem.actualExpenseCategories) {
      Object.entries(dbItem.actualExpenseCategories).forEach(([categoryId, amount]) => {
        if (!summaryByCategory[categoryId]) {
          summaryByCategory[categoryId] = { categoryId, totalBudget: 0, totalActual: 0 };
        }
        summaryByCategory[categoryId].totalActual += safeNumber(amount);
      });
    }

    // Accumulate and push to series
    groups.forEach(g => {
      summaryByGroup[g].totalBudget += monthlyBudgets[g] || 0;
      summaryByGroup[g].totalActual += monthlyActuals[g] || 0;
      summaryByGroup[g].totalRegularActual += monthlyRegularActuals[g] || 0;

      monthlySeries[g].push({
        periodKey: dbItem.periodKey,
        month: dbItem.month,
        year: dbItem.year,
        budget: monthlyBudgets[g] || 0,
        actual: monthlyActuals[g] || 0,
        regularActual: monthlyRegularActuals[g] || 0,
        flexibleActual: (monthlyActuals[g] || 0) - (monthlyRegularActuals[g] || 0)
      });
    });
  });

  return {
    summaryByGroup,
    summaryByCategory,
    monthlySeries,
  };
}
