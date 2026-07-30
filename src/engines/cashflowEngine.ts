import type { TimelinePeriod, LifeEvent } from '../types/finance';
import type { MonthlyBudgetOutput } from '../types/budget';
import { isBeforeOrEqual } from '../utils/date';
import { safeNumber, safeArray } from '../utils/math';

export interface CashflowEngineInput {
  period: TimelinePeriod;
  budget: MonthlyBudgetOutput;
  lifeEvents: LifeEvent[];
  actualExpenseMonthly?: number;
}

export interface CashflowOutput {
  incomeMonthly: number;
  expensesMonthly: number;
  investmentMonthly: number;
  savingMonthly: number;
  debtReserveMonthly: number;
  childCostMonthly: number;
  lifeEventImpactMonthly: number; // cumulative recurring impacts
  oneTimeEventImpact: number;     // one-time impact in this exact month
  netCashflowMonthly: number;
  unspentExpense: number;         // Expense budget - actual expense
  unallocatedIncome: number;      // Income - total allocated budget
  warnings: string[];
}

/**
 * Pure, deterministic cashflow calculator.
 * Combines budget outputs and life events to produce the net cashflow for a month.
 */
export function calculateCashflow(input: CashflowEngineInput): CashflowOutput {
  const warnings: string[] = [];
  const period = input.period;
  const budget = input.budget;
  const events = safeArray(input.lifeEvents);

  const income = safeNumber(budget.incomeMonthly, 0);
  
  // Use actualExpenseMonthly if provided, otherwise fallback to budget
  const expenses = input.actualExpenseMonthly !== undefined 
    ? safeNumber(input.actualExpenseMonthly, 0)
    : safeNumber(budget.totalExpenseMonthly, 0);
    
  const investment = safeNumber(budget.investmentMonthly, 0);
  const saving = safeNumber(budget.savingMonthly, 0);
  const debtReserveMonthly = safeNumber(budget.debtReserveMonthly, 0);

  // 1. One-time events matching this exact month/year
  const currentEvents = events.filter(
    (e) => safeNumber(e.month) === period.month && safeNumber(e.year) === period.year
  );
  const oneTimeImpact = currentEvents.reduce((sum, e) => sum + safeNumber(e.amount, 0), 0);

  // 2. Cumulative recurring impacts (applies from the event month + 1 onwards)
  const pastOrActiveEvents = events.filter((e) => {
    if (!safeNumber(e.recurringMonthlyImpact, 0)) return false;
    
    let effectiveMonth = safeNumber(e.month) + 1;
    let effectiveYear = safeNumber(e.year);
    if (effectiveMonth > 12) {
      effectiveMonth = 1;
      effectiveYear += 1;
    }
    
    const startsBeforeOrAtPeriod = isBeforeOrEqual(
      { year: effectiveYear, month: effectiveMonth },
      { year: period.year, month: period.month }
    );
    if (!startsBeforeOrAtPeriod) return false;
    
    // Check duration boundary
    const duration = safeNumber(e.recurringDurationMonths, 0);
    if (duration > 0) {
      // Calculate end month (exclusive): effectiveMonth + duration
      let endMonth = effectiveMonth + (duration % 12);
      let endYear = effectiveYear + Math.floor(duration / 12);
      if (endMonth > 12) {
        endMonth -= 12;
        endYear += 1;
      }
      // Period must be BEFORE the end boundary
      return !isBeforeOrEqual(
        { year: endYear, month: endMonth },
        { year: period.year, month: period.month }
      ) || (endYear === period.year && endMonth === period.month);
    }
    
    return true;
  });
  const recurringImpact = pastOrActiveEvents.reduce(
    (sum, e) => sum + safeNumber(e.recurringMonthlyImpact, 0),
    0
  );

  // 3. Extract child cost dynamically from budget categories
  const childCategory = budget.categories.find((c) => c.group === 'children');
  const childCost = childCategory ? childCategory.amountMonthly : 0;

  // 4. Calculate Net Cashflow
  // Net Cashflow = Free cashflow (income - total allocated) + events
  const freeCashflow = income - (expenses + investment + saving + debtReserveMonthly);
  const netCashflow = freeCashflow + oneTimeImpact + recurringImpact;

  if (netCashflow < 0) {
    warnings.push(
      `Dòng tiền ròng tháng ${period.month}/${period.year} bị âm (${netCashflow.toFixed(1)} tr) do các khoản chi tiêu/sự kiện.`
    );
  }

  return {
    incomeMonthly: income,
    expensesMonthly: expenses,
    investmentMonthly: investment,
    savingMonthly: saving,
    debtReserveMonthly,
    childCostMonthly: childCost,
    lifeEventImpactMonthly: recurringImpact,
    oneTimeEventImpact: oneTimeImpact,
    netCashflowMonthly: netCashflow,
    unspentExpense: safeNumber(budget.totalExpenseMonthly, 0) - expenses,
    unallocatedIncome: income - (safeNumber(budget.totalExpenseMonthly, 0) + investment + saving + debtReserveMonthly),
    warnings,
  };
}
