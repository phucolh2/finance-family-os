import { generateTimeline } from './timelineEngine';
import { calculateIncome } from './incomeEngine';
import { calculateBudget } from './budgetEngine';
import { calculateChildCost } from './childEngine';
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
    
    // Resolve active stage for childCost parameters
    const activeStage = Array.isArray(lifeStages) ? lifeStages.find(
      s => p.year >= s.fromYear && p.year <= s.toYear
    ) : null;
    const childLifestyle = activeStage ? activeStage.childLifestyle : 'premium';
    const childBudgetCap = activeStage ? activeStage.childBudgetCapMonthly : 35;

    // 2. Calculate Child Cost (injecting style and caps as defined in simulator)
    const childCostRes = calculateChildCost({
      period: p,
      childBirthMonth: profile.childBirthMonth,
      childBirthYear: profile.childBirthYear,
      lifestyle: childLifestyle,
      budgetCapMonthly: childBudgetCap,
      educationInflationAnnual: assumptions.educationInflationRateAnnual,
      healthInflationAnnual: assumptions.medicalInflationRateAnnual,
      generalInflationAnnual: assumptions.generalInflationRateAnnual,
    });

    // 3. Resolve Budget with child cost parameters
    const budgetRes = calculateBudget({
      period: p,
      incomeMonthly: incomeRes.incomeMonthly,
      budgetSchedule,
      childCost: childCostRes,
    });

    const ratios = {
      housing_basic: 0,
      future_investing: 0,
      safety_reserve: 0,
      family_experience: 0,
      health_growth: 0,
      children: 0,
      parents: 0,
    };

    const amounts = {
      housing_basic: 0,
      future_investing: 0,
      safety_reserve: 0,
      family_experience: 0,
      health_growth: 0,
      children: 0,
      parents: 0,
    };

    budgetRes.categories.forEach((r) => {
      const val = r.ratioPercent;
      const amt = r.amountMonthly;
      if (r.group === 'housing_basic') {
        ratios.housing_basic += val;
        amounts.housing_basic += amt;
      } else if (r.group === 'future_investing') {
        ratios.future_investing += val;
        amounts.future_investing += amt;
      } else if (r.group === 'safety_reserve') {
        ratios.safety_reserve += val;
        amounts.safety_reserve += amt;
      } else if (r.group === 'family_experience') {
        ratios.family_experience += val;
        amounts.family_experience += amt;
      } else if (r.group === 'health_growth') {
        ratios.health_growth += val;
        amounts.health_growth += amt;
      } else if (r.group === 'children') {
        ratios.children += val;
        amounts.children += amt;
      } else if (r.group === 'parents') {
        ratios.parents += val;
        amounts.parents += amt;
      }
    });

    // 4. Resolve Actual Expenses
    let totalActualExpenseMonthly = 0;
    let actualExpenseCategories: Record<string, number> = {};
    
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
        });
        
        actualExpenseCategories = tempCategories;
        totalActualExpenseMonthly = calculatedTotal;
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
      budgetRatios: {
        housing_basic: Math.round(ratios.housing_basic * 100) / 100,
        future_investing: Math.round(ratios.future_investing * 100) / 100,
        safety_reserve: Math.round(ratios.safety_reserve * 100) / 100,
        family_experience: Math.round(ratios.family_experience * 100) / 100,
        health_growth: Math.round(ratios.health_growth * 100) / 100,
        children: Math.round(ratios.children * 100) / 100,
        parents: Math.round(ratios.parents * 100) / 100,
      },
      budgetAmounts: {
        housing_basic: Math.round(amounts.housing_basic * 100) / 100,
        future_investing: Math.round(amounts.future_investing * 100) / 100,
        safety_reserve: Math.round(amounts.safety_reserve * 100) / 100,
        family_experience: Math.round(amounts.family_experience * 100) / 100,
        health_growth: Math.round(amounts.health_growth * 100) / 100,
        children: Math.round(amounts.children * 100) / 100,
        parents: Math.round(amounts.parents * 100) / 100,
      },
    };
  });

  const map: Record<string, ResolvedMonthlyDbItem> = {};
  list.forEach((item) => {
    map[item.periodKey] = item;
  });

  return { list, map };
}
