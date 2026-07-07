import type { BudgetRatioScheduleItem } from './budget';
import type { AssetConfig } from './portfolio';

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

export interface IncomeScheduleItem {
  id: string;
  effectiveMonth: number;
  effectiveYear: number;
  incomeMonthly: number;
  incomeGrowthRateAnnual?: number;
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

export interface LifeEvent {
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
}

export interface Assumptions {
  generalInflationRateAnnual: number;
  educationInflationRateAnnual: number;
  medicalInflationRateAnnual: number;
  investmentYieldExpectationAnnual: number;
  savingsInterestRateAnnual: number;
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
  notes?: string;
}

export interface AppState {
  profile: FamilyProfile;
  incomeSchedule: IncomeScheduleItem[];
  budgetSchedule: BudgetRatioScheduleItem[];
  lifeStages: LifeStage[];
  lifeEvents: LifeEvent[];
  assets: AssetConfig[];
  assumptions: Assumptions;
  investmentDeals?: InvestmentDeal[];
  projectionAdjustments?: import('./projection').ProjectionAdjustmentRecord[];
  resolvedMonthlyDb?: ResolvedMonthlyDbItem[];
  resolvedMonthlyDbMap?: Record<string, ResolvedMonthlyDbItem>;
}

export interface PersistedAppState {
  schemaVersion: number;
  updatedAt: string;
  data: AppState;
}
