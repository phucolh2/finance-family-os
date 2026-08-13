import { describe, it, expect } from 'vitest';
import { calculateHealthDefense } from './healthEngine';

describe('healthEngine', () => {
  const baseInput = {
    medicalInflationRate: 6,
    healthFundCap: 300,
    liquidityFundCap: 100,
    criticalIllnessReserveTarget: 500,
    finalRestCostToday: 150,
    finalRestInflationRate: 5,
    insuranceMonthly: 2,
    bhytMonthly: 0.2,
    currentHealthFund: 150,
    monthlyContribution: 5,
  };

  it('should calculate required health fund correctly', () => {
    const result = calculateHealthDefense(baseInput);

    // required = illnessTarget(500) + liqCap(100) + restCostToday(150) = 750
    expect(result.requiredHealthFund).toBe(750);
  });

  it('should calculate readiness score correctly', () => {
    const result = calculateHealthDefense(baseInput);

    // 150 / 750 = 20%
    expect(result.readinessScore).toBe(20);
  });

  it('should cap readiness score at 100%', () => {
    const input = { ...baseInput, currentHealthFund: 1000 }; // 1000 > 750
    const result = calculateHealthDefense(input);

    expect(result.readinessScore).toBe(100);
  });

  it('should handle zero required fund gracefully', () => {
    const input = { 
      ...baseInput, 
      criticalIllnessReserveTarget: 0,
      liquidityFundCap: 0,
      finalRestCostToday: 0
    };
    const result = calculateHealthDefense(input);

    expect(result.readinessScore).toBe(100); // Defaults to 100 if required is 0
  });

  it('should calculate projected future costs correctly', () => {
    const result = calculateHealthDefense(baseInput);

    // medical 10 years @ 6% = 500 * (1.06)^10 = 895.42
    expect(result.projectedMedicalCostFuture).toBeCloseTo(895.42, 2);
    // rest 30 years @ 5% = 150 * (1.05)^30 = 648.29
    expect(result.projectedFinalRestCostFuture).toBeCloseTo(648.29, 2);
  });

  it('should calculate years to reach target correctly', () => {
    const result = calculateHealthDefense(baseInput);

    // gap = 750 - 150 = 600
    // months = 600 / 5 = 120 months
    // years = 10
    expect(result.yearsToReach).toBe(10);
  });

  it('should warn and set yearsToReach to 999 if contribution is zero and there is a gap', () => {
    const input = { ...baseInput, monthlyContribution: 0 };
    const result = calculateHealthDefense(input);

    expect(result.yearsToReach).toBe(999);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should advise reallocation if cap is reached', () => {
    const input = { ...baseInput, currentHealthFund: 800 }; // > 750
    const result = calculateHealthDefense(input);

    expect(result.yearsToReach).toBe(0);
    expect(result.notes.some(n => n.includes('đạt hạn mức (Cap)'))).toBe(true);
  });
});
