import { safeNumber } from '../utils/math';

export interface HealthEngineInput {
  medicalInflationRate: number;        // e.g. 6 for 6%
  healthFundCap: number;               // cap for medical fund, e.g. 300 Tr VND
  liquidityFundCap: number;            // cap for liquid reserve, e.g. 100 Tr VND
  criticalIllnessReserveTarget: number; // e.g. 500 Tr VND
  finalRestCostToday: number;          // e.g. 150 Tr VND
  finalRestInflationRate: number;      // e.g. 5 for 5%
  insuranceMonthly: number;            // e.g. 2 Tr VND
  bhytMonthly: number;                 // e.g. 0.2 Tr VND
  currentHealthFund: number;           // e.g. 150 Tr VND
  monthlyContribution: number;         // contribution from savings, e.g. 5 Tr/month
}

export interface HealthEngineOutput {
  requiredHealthFund: number;
  currentHealthFund: number;
  monthlyContributionNeeded: number;
  yearsToReach: number;
  projectedMedicalCostFuture: number;
  projectedFinalRestCostFuture: number;
  readinessScore: number;
  warnings: string[];
  notes: string[];
}

/**
 * Pure health & final rest engine.
 * Computes health defense metrics and future inflated costs defensively.
 */
export function calculateHealthDefense(input: HealthEngineInput): HealthEngineOutput {
  const warnings: string[] = [];
  const notes: string[] = [];

  const medInflation = safeNumber(input.medicalInflationRate, 6) / 100;
  const restInflation = safeNumber(input.finalRestInflationRate, 5) / 100;
  const healthCap = safeNumber(input.healthFundCap, 300);
  const liqCap = safeNumber(input.liquidityFundCap, 100);
  const illnessTarget = safeNumber(input.criticalIllnessReserveTarget, 500);
  const restCostToday = safeNumber(input.finalRestCostToday, 150);
  const currentFund = safeNumber(input.currentHealthFund, 0);
  const monthlyContrib = safeNumber(input.monthlyContribution, 0);

  // 1. Total Required Defense Fund today
  // Required Fund = Target Critical Illness + Liquid Cap + Final Rest Cost
  const requiredHealthFund = illnessTarget + liqCap + restCostToday;

  // 2. Projected Future Costs (compounded 10 years for medical, 30 years for final rest)
  const projectedMedicalCostFuture = illnessTarget * Math.pow(1 + medInflation, 10);
  const projectedFinalRestCostFuture = restCostToday * Math.pow(1 + restInflation, 30);

  // 3. Readiness Score (Savings vs Required Target)
  const readinessScore = requiredHealthFund > 0 
    ? Math.min(100, (currentFund / requiredHealthFund) * 100) 
    : 100;

  // 4. Years to reach the required target
  const gap = Math.max(0, requiredHealthFund - currentFund);
  let yearsToReach = 0;

  if (gap > 0) {
    if (monthlyContrib <= 0) {
      warnings.push('Chưa cấu hình khoản đóng góp tiết kiệm hàng tháng cho quỹ y tế. Khoảng trống tài chính phòng vệ sẽ kéo dài vô hạn.');
      yearsToReach = 999;
    } else {
      const monthsNeeded = gap / monthlyContrib;
      yearsToReach = monthsNeeded / 12;
    }
  }

  // 5. Reallocation check if cap is reached
  if (currentFund >= requiredHealthFund || currentFund >= (healthCap + liqCap)) {
    notes.push('Quỹ y tế & phòng vệ dự phòng đã đạt hạn mức (Cap). Khoản tiết kiệm hàng tháng có thể tái cơ cấu sang quỹ đầu tư (Chứng khoán/Crypto) để đẩy nhanh tốc độ tích lũy lãi kép.');
  } else {
    notes.push('Tiếp tục duy trì tích lũy hàng tháng để nâng cao điểm phòng thủ readiness score.');
  }

  return {
    requiredHealthFund,
    currentHealthFund: currentFund,
    monthlyContributionNeeded: monthlyContrib,
    yearsToReach,
    projectedMedicalCostFuture,
    projectedFinalRestCostFuture,
    readinessScore,
    warnings,
    notes,
  };
}
