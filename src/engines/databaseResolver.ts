import { generateTimeline } from './timelineEngine';
import { calculateIncome } from './incomeEngine';
import { calculateBudget } from './budgetEngine';

import { safeNumber } from '../utils/math';
import type { FamilyProfile, IncomeScheduleItem, ResolvedMonthlyDbItem, Assumptions, LifeStage } from '../types/finance';
import type { BudgetRatioScheduleItem, ExpenseScheduleItem } from '../types/budget';
import type { AssetConfig } from '../types/portfolio';

export interface ResolvedMonthlyDbResult {
  list: ResolvedMonthlyDbItem[];
  map: Record<string, ResolvedMonthlyDbItem>;
}

export function generateResolvedMonthlyDb(
  profile: FamilyProfile,
  incomeSchedule: IncomeScheduleItem[],
  budgetSchedule: BudgetRatioScheduleItem[],
  expenseSchedule: ExpenseScheduleItem[],
  assets: AssetConfig[],
  assumptions: Assumptions,
  lifeStages?: LifeStage[]
): ResolvedMonthlyDbResult {
  // Generate the timeline periods
  const timelineResult = generateTimeline({
    planningStartMonth: profile.planningStartMonth,
    planningStartYear: profile.planningStartYear,
    planningEndMonth: profile.planningEndMonth,
    planningEndYear: profile.planningEndYear,
    husbandAgeAtStart: profile.husbandAgeAtStart,
    wifeAgeAtStart: profile.wifeAgeAtStart,
  });

  // Calculate weighted average portfolio expected return rate
  const totalAllocation = assets.reduce((sum, a) => sum + safeNumber(a.targetAllocationPercent, 0), 0);
  const weightedReturn = totalAllocation > 0
    ? assets.reduce((sum, a) => sum + (safeNumber(a.targetAllocationPercent, 0) * safeNumber(a.expectedReturnRateAnnual, 0)), 0) / totalAllocation
    : 0;

  const list: ResolvedMonthlyDbItem[] = timelineResult.periods.map((p) => {
    // 1. Resolve Income
    const incomeRes = calculateIncome({ period: p, incomeSchedule });
    
    // 3. Resolve Budget with child cost parameters
    const budgetRes = calculateBudget({
      period: p,
      incomeMonthly: incomeRes.incomeMonthly,
      budgetSchedule,
    });

    const ratios: Record<string, number> = {};
    const amounts: Record<string, number> = {};
    const budgetAmountsByCategory: Record<string, number> = {};

    budgetRes.categories.forEach((r) => {
      const val = r.ratioPercent;
      const amt = r.amountMonthly;
      
      // Default initialization
      if (ratios[r.group] === undefined) ratios[r.group] = 0;
      if (amounts[r.group] === undefined) amounts[r.group] = 0;

      ratios[r.group] += val;
      amounts[r.group] += amt;
      
      budgetAmountsByCategory[r.categoryId] = amt;
    });

    // 4. Resolve Actual Expenses
    let totalActualExpenseMonthly = 0;
    let actualExpenseCategories: Record<string, number> = {};
    let actualExpenseByGroup: Record<string, number> = {};
    // Find the latest effective expense schedule for this month
    const applicableExpenseSchedules = expenseSchedule.filter(
      (s) => s.effectiveYear * 12 + s.effectiveMonth <= p.year * 12 + p.month
    );
    
    if (applicableExpenseSchedules.length > 0) {
      // Sort to get the most recent one
      applicableExpenseSchedules.sort((a, b) => 
        b.effectiveYear * 12 + b.effectiveMonth - (a.effectiveYear * 12 + a.effectiveMonth)
      );
      
      const activeExpenseSchedule = applicableExpenseSchedules[0];
      
      // Check if it's still active (not ended)
      const isEnded = activeExpenseSchedule.endYear && activeExpenseSchedule.endMonth
        ? (p.year * 12 + p.month > activeExpenseSchedule.endYear * 12 + activeExpenseSchedule.endMonth)
        : false;
        
      if (!isEnded) {
        const tempCategories = { ...activeExpenseSchedule.categories };
        let calculatedTotal = 0;
        
        const tempActualExpenseByGroup: Record<string, number> = {};

        Object.keys(tempCategories).forEach(catId => {
          let val = safeNumber(tempCategories[catId], 0);
          if (val === -1) {
            // Dynamically map to the current month's budget allocation
            const matchedBudget = budgetRes.categories.find(c => c.categoryId === catId);
            if (matchedBudget) {
              val = matchedBudget.amountMonthly;
            } else {
              val = 0;
            }
            tempCategories[catId] = val;
          }
          
          calculatedTotal += val;
          
          const matchedBudget = budgetRes.categories.find(c => c.categoryId === catId);
          if (matchedBudget) {
            const groupId = matchedBudget.group;
            tempActualExpenseByGroup[groupId] = (tempActualExpenseByGroup[groupId] || 0) + val;
          }
        });
        
        actualExpenseCategories = tempCategories;
        totalActualExpenseMonthly = calculatedTotal;
        actualExpenseByGroup = tempActualExpenseByGroup;
      }
    }

    return {
      periodKey: p.key,
      month: p.month,
      year: p.year,
      income: Math.round(incomeRes.incomeMonthly * 100) / 100,
      expectedReturnAnnual: Math.round(weightedReturn * 100) / 100,
      totalActualExpenseMonthly: Math.round(totalActualExpenseMonthly * 100) / 100,
      actualExpenseCategories,
      actualExpenseByGroup,
      budgetRatios: Object.keys(ratios).reduce((acc, key) => {
        acc[key] = Math.round(ratios[key] * 100) / 100;
        return acc;
      }, {} as Record<string, number>),
      budgetAmounts: Object.keys(amounts).reduce((acc, key) => {
        acc[key] = Math.round(amounts[key] * 100) / 100;
        return acc;
      }, {} as Record<string, number>),
      budgetAmountsByCategory: Object.keys(budgetAmountsByCategory).reduce((acc, key) => {
        acc[key] = Math.round(budgetAmountsByCategory[key] * 100) / 100;
        return acc;
      }, {} as Record<string, number>),
    };
  });

  const map: Record<string, ResolvedMonthlyDbItem> = {};
  list.forEach((item) => {
    map[item.periodKey] = item;
  });

  return { list, map };
}
