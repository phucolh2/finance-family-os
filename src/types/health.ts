export interface HealthInputs {
  medicalInflationRate: number;
  healthFundCap: number;
  liquidityFundCap: number;
  criticalIllnessReserveTarget: number;
  finalRestCostToday: number;
  finalRestInflationRate: number;
  insuranceMonthly: number;
  bhytMonthly: number;
}

export interface HealthOutput {
  requiredHealthFund: number;
  currentHealthFund: number;
  monthlyContributionNeeded: number;
  yearsToReachHealthFund: number;
  projectedMedicalCostFuture: number;
  projectedFinalRestCostFuture: number;
  readinessScore: number; // 0 - 100
}
