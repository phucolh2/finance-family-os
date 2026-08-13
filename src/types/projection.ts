import type { TimelinePeriod } from './finance';
import type { PortfolioMonthlyOutput } from './portfolio';

export interface ProjectionAdjustmentRecord {
  id: string;
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
  annualInvestmentProfit?: number | null; // Lợi nhuận đầu tư hằng năm
  monthlyInvestmentProfit?: number | null; // Lợi nhuận đầu tư hằng tháng
  oneTimeInvestmentProfit?: number | null; // Lợi nhuận không định kỳ
  adjustedSavingRate?: number | null; // Lãi suất tiết kiệm điều chỉnh (%/năm)
}

export interface ProjectionMonthlyRow {
  period: TimelinePeriod;
  incomeMonthly: number;
  expensesMonthly: number;
  budgetedExpensesMonthly?: number;
  investmentMonthly: number;
  savingMonthly: number;
  debtReserveMonthly: number;
  liquidityMonthly: number;
  healthMonthly: number;

  lifeEventImpactMonthly: number;
  debtPaymentMonthly: number;
  netCashflowMonthly: number;
  
  _totalDebtPrincipalRemaining?: number;
  _totalDebtInterestPaidMonthly?: number;
  
  // Reserve balances
  liquidityBalance: number;
  healthBalance: number;
  savingBalance: number;
  debtReserveBalance: number;
  unallocatedCashBalance: number;
  
  // Portfolio balances
  portfolio: PortfolioMonthlyOutput;
  
  // Property value
  propertyValue: number;
  
  // Totals
  nominalNetWorth: number;
  realNetWorth: number; // discounted by inflation
  
  // FIRE
  fireTarget: number;
  fireProgress: number; // percentage
  fireGap: number;
  
  notes: string[];

  // Runtime metrics for yearly aggregation
  _savingInterestRateAnnual?: number;
  _customProfit?: number;
  _hasManualInvestmentAdj?: boolean;
  _savingPnl?: number;

  _activeSinkingFundsDebtReserve?: number;
  _activeSinkingFundsSaving?: number;
  _activeSinkingFundsExpenseSurplus?: number;
  _groupBalances?: Record<string, number>;
  _monthlyBudget?: Record<string, number>;
  _monthlyActual?: Record<string, number>;
  _sinkingFundBalances?: Record<string, number>;
}

export interface ProjectionYearlyRow {
  year: number;
  husbandAge: number;
  wifeAge: number;
  monthlyIncomeEndYear: number;
  totalIncomeYearly: number;
  totalExpensesYearly: number;
  budgetedExpensesMonthly?: number;
  totalDebtPaymentYearly: number;
  averageInvestmentMonthly: number;
  averageSavingMonthly: number;
  averageDebtReserveMonthly: number;
  investmentReturnRateAnnual: number;
  savingInterestRateAnnual: number;

  passiveCashFlowMonthly: number;
  endingInvestmentBalance: number;
  endingSavingBalance: number;
  endingDebtReserveBalance: number;
  lifeEventNotes: string[];
  nominalNetWorth: number;
  realNetWorth: number;
  fireTarget: number;
  fireProgress: number;
  notes: string[];


}

export interface ProjectionOutput {
  monthlyRows: ProjectionMonthlyRow[];
  yearlyRows: ProjectionYearlyRow[];
  warnings: string[];
}
