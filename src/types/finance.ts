import type { AssetConfig } from './portfolio';
import type { AssetType } from './portfolio';
import type { FundingSourceId } from '../constants/fundingSources';
import type { LifecycleProps } from './ledger';

export interface FamilyProfile {
  husbandName: string;
  wifeName: string;
  husbandAgeAtStart: number;
  wifeAgeAtStart: number;
  planningStartMonth: number; // 1-12
  planningStartYear: number;
  planningEndMonth: number;   // 1-12
  planningEndYear: number;
  childBirthMonth?: number;
  childBirthYear?: number;
  currency: 'VND_MILLION';
  startingCapital?: number;
}

export interface TimelinePeriod {
  index: number;
  key: string; // YYYY-MM
  month: number;
  year: number;
  husbandAge: number;
  wifeAge: number;
}

export interface IncomeCategory {
  id: string;
  name: string;
  type: 'active' | 'passive';
  isDefault?: boolean;
}

export type IncomeType = string;

export interface IncomeScheduleItem extends Partial<LifecycleProps> {
  id: string;
  effectiveMonth: number;
  effectiveYear: number;
  incomeMonthly: number;
  incomeGrowthRateAnnual?: number;
  incomeType?: IncomeType;
  note?: string;
}

export interface LifeStage {
  id: string;
  name: string;
  fromYear: number;
  toYear: number;
  incomeMonthly: number;
  parentsMonthly: number;
  hasChild: boolean;
  childLifestyle: 'basic' | 'comfortable' | 'premium' | 'international';
  childBudgetCapMonthly: number;
  notes?: string;
}

export interface LifeEvent extends Partial<LifecycleProps> {
  id: string;
  month: number;
  year: number;
  name: string;
  type:
    | 'child_birth'
    | 'buy_property'
    | 'sell_property'
    | 'buy_car'
    | 'medical'
    | 'job_loss'
    | 'bonus'
    | 'inheritance'
    | 'retirement'
    | 'travel'
    | 'other';
  amount: number;
  source: 'housing_basic' | 'future_investing' | 'safety_reserve' | 'family_experience' | 'health_growth' | 'children' | 'parents' | 'saving' | 'investment' | 'debt' | 'external';
  targetAssetId?: string;
  recurringMonthlyImpact?: number;
  affectsNetWorth: boolean;
  note?: string;
  isMilestone?: boolean; // Đánh dấu sự kiện là Cột mốc quan trọng
  spendingCategory?: string; // Lớp Tiêu sản: "groupId/childId" e.g. "housing_basic/rent"
}

export interface NonTermInterestRatePeriod {
  startMonth: number;
  startYear: number;
  rateAnnual: number;
}

export interface Assumptions {
  generalInflationRateAnnual: number;
  educationInflationRateAnnual: number;
  medicalInflationRateAnnual: number;
  investmentYieldExpectationAnnual: number;
  savingsInterestRateAnnual: number;
  nonTermInterestRateSchedule?: NonTermInterestRatePeriod[];
}

export interface ResolvedMonthlyDbItem {
  periodKey: string; // YYYY-MM
  month: number;
  year: number;
  income: number; // resolved income in Tr VND
  expectedReturnAnnual: number; // portfolio weighted average expected return rate, e.g. 8.0
  budgetRatios: {
    housing_basic: number;
    future_investing: number;
    safety_reserve: number;
    family_experience: number;
    health_growth: number;
    children: number;
    parents: number;
  };
  budgetAmounts: {
    housing_basic: number;
    future_investing: number;
    safety_reserve: number;
    family_experience: number;
    health_growth: number;
    children: number;
    parents: number;
  };
  investmentFlow?: {
    beginningBalance: number;
    contribution: number;
    pnl: number;
    endingBalance: number;
    invested: number;
    planned: number;
    idle: number;
  };
  totalActualExpenseMonthly?: number;
  actualExpenseCategories?: Record<string, number>;
}

export interface InvestmentDeal {
  id: string;
  assetType: 'fx_reserve_usd' | 'gold' | 'real_estate' | 'stocks' | 'crypto';
  name: string;
  capital: number; // in VND Million
  startMonth: number;
  startYear: number;
  status: 'active' | 'settled';
  endMonth?: number;
  endYear?: number;
  realizedProfit?: number; // realized profit/loss in VND Million
  isEarmarked?: boolean; // If true, this is earmarked cash and does not generate ROI
  expectedSavingRate?: number; // Saving interest rate for earmarked deals (%/year)
  savingTermMonths?: number;   // Term of the savings period for earmarked deal (months)
  withdrawals?: WithdrawalEvent[]; // For partial withdrawal / capital liquidation
  dealType?: 'capital_gain' | 'cash_flow'; // Forms of investment (capital gain or cash flow)
  realEstateType?: 'capital_gain' | 'cash_flow'; // (Deprecated) Specific to Real Estate
  cashflowYieldAnnual?: number; // Annual yield for cash flow real estate (%)
  cashflowTrackedInIncome?: boolean;
  isConverted?: boolean;       // If true, converted to active investment
  conversionMonth?: number;
  conversionYear?: number;
  realizedSavingInterest?: number; // realized saving interest when converted/settled early (VND Million)
  bankName?: string; // Tên ngân hàng nếu gửi tiết kiệm chờ phân bổ
  notes?: string;
}

export interface WithdrawalEvent {
  id: string;
  month: number;
  year: number;
  amount: number; // Số tiền gốc rút
  realizedInterest?: number; // Lãi thực nhận (không kỳ hạn) - dùng cho Savings
  realizedProfit?: number; // Lãi thực nhận - dùng cho Đầu tư
  note?: string;
}

export interface SavingsDeposit {
  id: string;
  name: string;                          // VD: "Tiết kiệm Vietcombank 12T"
  principal: number;                     // Số tiền gốc (Tr VND)
  monthlyContribution?: number;          // Góp thêm định kỳ (Tr VND)
  interestRateAnnual: number;            // Lãi suất %/năm
  termMonths: number;                    // Kì hạn (3, 6, 12, 24...)
  startMonth: number;
  startYear: number;
  pool: 'planned' | 'idle' | 'saving' | 'liquidity' | 'unallocated';             // Thuộc phần tiền nào
  status: 'active' | 'matured' | 'settled_early'; // matured = đáo hạn, settled_early = tất toán trước kì hạn
  settledMonth?: number;
  settledYear?: number;
  realizedInterest?: number;
  withdrawals?: WithdrawalEvent[];
  notes?: string;
}

export interface SinkingFund {
  id: string;
  name: string; // VD: Quỹ mua chung cư
  fundType?: 'investment' | 'debt_prep';
  sourceOfFund?: FundingSourceId;
  targetAssetType: 'fx_reserve_usd' | 'gold' | 'real_estate' | 'stocks' | 'crypto';
  targetAmount: number; // Mục tiêu cần đạt (VD: 2000 Tr VND)
  
  initialDeposit: number; // Nộp gốc ban đầu (nếu có sẵn 1 ít)
  monthlyContribution: number; // Nộp định kỳ hàng tháng từ dòng tiền dư (VD: 20 Tr/tháng)
  interestRateAnnual: number; // Lãi suất tiết kiệm (VD: 5.5%/năm)
  termMonths?: number; // Kỳ hạn gửi (VD: 1, 3, 6, 12 tháng)
  
  startMonth: number;
  startYear: number;
  
  status: 'active' | 'disbursed'; // Đang tích lũy hoặc Đã giải ngân thành thương vụ
  disbursedMonth?: number;
  disbursedYear?: number;
  withdrawals?: WithdrawalEvent[];
  periodConfigs?: Record<string, { termMonths?: number; interestRateAnnual?: number }>;
  notes?: string;
}

export interface DebtLiability {
  id: string;
  name: string; // VD: Vay mua nhà, Vay mua xe
  type: 'mortgage' | 'auto' | 'consumer' | 'business';
  principal: number; // Dư nợ gốc ban đầu
  interestRateAnnual: number; // Lãi suất %/năm
  termMonths: number; // Thời gian vay
  startMonth: number;
  startYear: number;
  status: 'active' | 'settled';
  paymentSource?: 'debt_reserve' | 'cashflow' | string; // Nguồn tiền thanh toán hàng tháng
  notes?: string;
}

export interface FundTransfer {
  id: string;
  month: number;
  year: number;
  amount: number; // Số tiền (Tr VND)
  sourceType: 'cashflow' | 'savings' | 'sinking_fund' | 'investment' | 'life_event' | 'pool';
  sourceId?: string; // ID của nguồn nếu có (ví dụ ID sổ tiết kiệm)
  destinationType: 'cashflow' | 'savings' | 'sinking_fund' | 'investment' | 'debt';
  destinationId?: string; // ID của đích nếu có (ví dụ ID thương vụ đầu tư)
  note?: string;
  createdAt: number; // timestamp
}

export interface AppState {
  profile: FamilyProfile;
  incomeCategories?: IncomeCategory[];
  incomeSchedule: IncomeScheduleItem[];
  budgetSchedule: import('./budget').BudgetRatioScheduleItem[];
  expenseSchedule: import('./budget').ExpenseScheduleItem[];
  lifeStages: LifeStage[];
  lifeEvents: LifeEvent[];
  assets: AssetConfig[];
  assumptions: Assumptions;
  investmentDeals?: InvestmentDeal[];
  savingsDeposits?: SavingsDeposit[];
  sinkingFunds?: SinkingFund[];
  debts?: DebtLiability[];
  fundTransfers?: FundTransfer[];
  projectionAdjustments?: import('./projection').ProjectionAdjustmentRecord[];
  resolvedMonthlyDb?: ResolvedMonthlyDbItem[];
  resolvedMonthlyDbMap?: Record<string, ResolvedMonthlyDbItem>;
}

export interface PersistedAppState {
  schemaVersion: number;
  updatedAt: string;
  data: AppState;
}
