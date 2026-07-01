import type { ProjectionYearlyRow } from '../types/projection';
import { safeNumber, safeArray } from '../utils/math';

export interface FireEngineInput {
  expensesMonthly: number;
  netWorth: number;
  withdrawalRate?: number; // e.g. 4 for 4%
  yearlyRows?: ProjectionYearlyRow[];
}

export interface FireOutput {
  fireTarget: number;
  fireProgress: number; // percentage
  fireGap: number;
  expectedFireYear: number | null;
  withdrawalRate: number;
}

/**
 * Pure, deterministic FIRE calculator.
 * Computes target capital requirements and derives the expected crossing year from projection rows.
 */
export function calculateFire(input: FireEngineInput): FireOutput {
  const expenses = safeNumber(input.expensesMonthly, 0);
  const netWorth = safeNumber(input.netWorth, 0);
  const wrInput = safeNumber(input.withdrawalRate, 4);
  
  // Convert 4 to 0.04 defensively
  const wrRate = wrInput > 1 ? wrInput / 100 : wrInput;

  const annualExpenses = expenses * 12;
  const fireTarget = wrRate > 0 ? annualExpenses / wrRate : 0;
  const fireProgress = fireTarget > 0 ? (netWorth / fireTarget) * 100 : 0;
  const fireGap = Math.max(0, fireTarget - netWorth);

  // Derive expected FIRE year from yearly projection rows where netWorth crossing target
  let expectedFireYear: number | null = null;
  const yearly = safeArray(input.yearlyRows);
  const crossingYear = yearly.find((row) => row.nominalNetWorth >= row.fireTarget);
  
  if (crossingYear) {
    expectedFireYear = crossingYear.year;
  }

  return {
    fireTarget,
    fireProgress,
    fireGap,
    expectedFireYear,
    withdrawalRate: wrInput,
  };
}
