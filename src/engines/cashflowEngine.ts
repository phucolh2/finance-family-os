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
  childCostMonthly: number;
  lifeEventImpactMonthly: number; // cumulative recurring impacts
  oneTimeEventImpact: number;     // one-time impact in this exact month
  netCashflowMonthly: number;
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

  // 1. One-time events matching this exact month/year
  const currentEvents = events.filter(
    (e) => safeNumber(e.month) === period.month && safeNumber(e.year) === period.year
  );
  const oneTimeImpact = currentEvents.reduce((sum, e) => sum + safeNumber(e.amount, 0), 0);

  // 2. Cumulative recurring impacts (applies from the event month onwards)
  const pastOrActiveEvents = events.filter((e) => {
    return isBeforeOrEqual(
      { year: safeNumber(e.year), month: safeNumber(e.month) },
      { year: period.year, month: period.month }
    );
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
  const freeCashflow = income - (expenses + investment + saving);
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
    childCostMonthly: childCost,
    lifeEventImpactMonthly: recurringImpact,
    oneTimeEventImpact: oneTimeImpact,
    netCashflowMonthly: netCashflow,
    warnings,
  };
}
