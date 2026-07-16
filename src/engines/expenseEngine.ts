import type { ResolvedMonthlyDbItem, LifeEvent } from '../types/finance';
import type { BudgetMainGroupId, BudgetGroup } from '../types/budget';
import { safeNumber } from '../utils/math';

export interface ExpenseGroupSummary {
  groupId: BudgetGroup | 'all';
  totalBudget: number;
  totalActual: number;
}

export interface ExpenseMonthlyPoint {
  periodKey: string; // "YYYY-MM"
  month: number;
  year: number;
  budget: number;
  actual: number;
}

export interface ExpenseAnalysisResult {
  summaryByGroup: Record<string, ExpenseGroupSummary>;
  monthlySeries: Record<string, ExpenseMonthlyPoint[]>; // key is groupId ('all', 'housing_basic', etc.)
}

export function analyzeExpense(
  resolvedMonthlyDb: ResolvedMonthlyDbItem[],
  lifeEvents: LifeEvent[],
  currentPeriodKey?: string
): ExpenseAnalysisResult {
  // Initialize summary and series
  const groups: (BudgetGroup | 'all')[] = [
    'all', 'housing_basic', 'future_investing', 'safety_reserve', 'family_experience', 'health_growth', 'children', 'parents'
  ];

  const summaryByGroup: Record<string, ExpenseGroupSummary> = {};
  const monthlySeries: Record<string, ExpenseMonthlyPoint[]> = {};
  
  groups.forEach(g => {
    summaryByGroup[g] = { groupId: g, totalBudget: 0, totalActual: 0 };
    monthlySeries[g] = [];
  });

  // Default to the provided period, OR the current real-world month, OR the first month
  let targetPeriod = currentPeriodKey;
  
  if (!targetPeriod && resolvedMonthlyDb.length > 0) {
    const now = new Date();
    const nowKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
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

  windowDb.forEach(dbItem => {
    const bAmounts = dbItem.budgetAmounts;
    // Only include actual expense groups in the 'all' budget total
    const totalExpenseBudget = bAmounts.housing_basic + bAmounts.family_experience + 
                               bAmounts.health_growth + bAmounts.children + bAmounts.parents;

    // Monthly budgets
    const monthlyBudgets: Record<string, number> = {
      'all': totalExpenseBudget,
      'housing_basic': bAmounts.housing_basic,
      'future_investing': bAmounts.future_investing,
      'safety_reserve': bAmounts.safety_reserve,
      'family_experience': bAmounts.family_experience,
      'health_growth': bAmounts.health_growth,
      'children': bAmounts.children,
      'parents': bAmounts.parents
    };

    // Monthly Actuals
    // Extract actual expenses from dbItem.actualExpenseCategories (which comes from ExpenseSchedule)
    const monthlyActuals: Record<string, number> = {
      'all': 0, 'housing_basic': 0, 'future_investing': 0, 'safety_reserve': 0,
      'family_experience': 0, 'health_growth': 0, 'children': 0, 'parents': 0
    };

    const expenseGroupsSet = new Set(['housing_basic', 'family_experience', 'health_growth', 'children', 'parents']);

    if (dbItem.actualExpenseCategories) {
      Object.entries(dbItem.actualExpenseCategories).forEach(([categoryId, amount]) => {
        const expenseAmount = safeNumber(amount);
        if (expenseAmount <= 0) return;

        // categoryId is in format "groupId/itemId" or just "groupId"
        const groupId = categoryId.split('/')[0];
        
        if (monthlyActuals[groupId] !== undefined) {
          monthlyActuals[groupId] += expenseAmount;
        }
        
        // Only sum actual expenses for 'all', excluding legacy investment/savings entries
        if (expenseGroupsSet.has(groupId)) {
          monthlyActuals['all'] += expenseAmount;
        }
      });
    }

    // Accumulate and push to series
    groups.forEach(g => {
      summaryByGroup[g].totalBudget += monthlyBudgets[g] || 0;
      summaryByGroup[g].totalActual += monthlyActuals[g] || 0;

      monthlySeries[g].push({
        periodKey: dbItem.periodKey,
        month: dbItem.month,
        year: dbItem.year,
        budget: monthlyBudgets[g] || 0,
        actual: monthlyActuals[g] || 0
      });
    });
  });

  return { summaryByGroup, monthlySeries };
}
