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
  investmentMonthly: number;
  savingMonthly: number;
  liquidityMonthly: number;
  healthMonthly: number;
  childCostMonthly: number;
  lifeEventImpactMonthly: number;
  netCashflowMonthly: number;
  
  // Reserve balances
  liquidityBalance: number;
  healthBalance: number;
  savingBalance: number;
  
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
}

export interface ProjectionYearlyRow {
  year: number;
  husbandAge: number;
  wifeAge: number;
  monthlyIncomeEndYear: number;
  totalIncomeYearly: number;
  totalExpensesYearly: number;
  averageInvestmentMonthly: number;
  averageSavingMonthly: number;
  investmentReturnRateAnnual: number;
  savingInterestRateAnnual: number;
  averageChildCostMonthly: number;
  passiveCashFlowMonthly: number;
  endingInvestmentBalance: number;
  endingSavingBalance: number;
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
