import type { AppState } from '../types/finance';
import { runProjection } from './projectionEngine';
import { safeNumber, safeArray } from '../utils/math';

export interface MonteCarloInput {
  baseState: AppState;
  simulationCount?: number;
}

export interface MonteCarloOutput {
  probabilityReachFire: number;
  medianFireYear: number | null;
  p10FireYear: number | null;
  p90FireYear: number | null;
  successCount: number;
  failureCount: number;
  riskFactors: string[];
}

/**
 * Box-Muller transform for generating random numbers with a normal distribution.
 */
export function randomNormal(mean: number, stdDev: number): number {
  let u = 0, v = 0;
  while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while(v === 0) v = Math.random();
  const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return num * stdDev + mean;
}

/**
 * Pure Monte Carlo Simulator.
 * Simulates multiple random financial projection paths under volatility.
 */
export function runMonteCarlo(input: MonteCarloInput): MonteCarloOutput {
  const baseState = input.baseState;
  const trials = safeNumber(input.simulationCount, 1000);

  const assets = safeArray(baseState.assets);
  const assumptions = baseState.assumptions;

  // Define asset volatilities
  const volatilities: Record<string, number> = {
    fx_reserve_usd: 2.5,
    gold: 5.0,
    real_estate: 8.0,
    stocks: 18.0,
    crypto: 55.0,
  };

  const successYears: number[] = [];
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < trials; i++) {
    // 1. Randomize asset expected return rates under normal distribution
    const randomizedAssets = assets.map((asset) => {
      const vol = volatilities[asset.type] || 15.0;
      const randomizedReturn = randomNormal(asset.expectedReturnRateAnnual, vol);
      return {
        ...asset,
        expectedReturnRateAnnual: Math.max(-30, Math.min(100, randomizedReturn)), // cap return between -30% and +100%
      };
    });

    // 2. Randomize inflation rate
    const inflationVol = 1.8; // standard inflation volatility
    const randomizedInflation = randomNormal(assumptions.generalInflationRateAnnual, inflationVol);

    const randomizedAssumptions = {
      ...assumptions,
      generalInflationRateAnnual: Math.max(0.5, Math.min(15, randomizedInflation)), // cap inflation between 0.5% and 15%
    };

    // 3. Run the exact same projection engine under randomized parameters
    const projection = runProjection({
      profile: baseState.profile,
      incomeSchedule: baseState.incomeSchedule,
      budgetSchedule: baseState.budgetSchedule,
      lifeEvents: baseState.lifeEvents,
      assets: randomizedAssets,
      assumptions: randomizedAssumptions,
    });

    // Find if this trial successfully reaches FIRE target
    const crossingRow = projection.monthlyRows.find((r) => r.nominalNetWorth >= r.fireTarget);
    if (crossingRow) {
      successCount++;
      successYears.push(crossingRow.period.year);
    } else {
      failureCount++;
    }
  }

  // Calculate statistics from successful runs
  successYears.sort((a, b) => a - b);
  const successLen = successYears.length;

  let medianFireYear: number | null = null;
  let p10FireYear: number | null = null;
  let p90FireYear: number | null = null;

  if (successLen > 0) {
    medianFireYear = successYears[Math.floor(successLen * 0.5)];
    p10FireYear = successYears[Math.floor(successLen * 0.1)];
    p90FireYear = successYears[Math.floor(successLen * 0.9)];
  }

  const probabilityReachFire = (successCount / trials) * 100;

  // Determine risk factors based on volatility results
  const riskFactors: string[] = [];
  if (probabilityReachFire < 70) {
    riskFactors.push('Tỷ lệ thành công dưới 70% do mức tiết kiệm thấp hoặc tài sản rủi ro biến động lớn.');
  }
  if (probabilityReachFire >= 70 && probabilityReachFire < 90) {
    riskFactors.push('Hệ thống khuyến nghị nâng quỹ dự phòng hoặc giảm bớt tỷ trọng Crypto để tăng tính phòng thủ.');
  }
  if (successYears.some(y => y > 2050)) {
    riskFactors.push('Nhiều kịch bản dự phóng kéo dài thời gian tích lũy vượt quá tuổi 55 của hai vợ chồng.');
  }

  return {
    probabilityReachFire,
    medianFireYear,
    p10FireYear,
    p90FireYear,
    successCount,
    failureCount,
    riskFactors,
  };
}
export type MonteCarloOutputResult = MonteCarloOutput;
export type MonteCarloInputArgs = MonteCarloInput;
