export type AssetClassId =
  | 'fx_reserve_usd'
  | 'gold'
  | 'real_estate'
  | 'stocks'
  | 'crypto';

export type AssetType = AssetClassId;

export const ASSET_CLASS_LABELS: Record<AssetClassId, string> = {
  fx_reserve_usd: 'Dự trữ ngoại hối (USD)',
  gold: 'Vàng',
  real_estate: 'Bất Động Sản',
  stocks: 'Chứng Khoán',
  crypto: 'Crypto',
};

export const ASSET_CLASS_SHORT_LABELS: Record<AssetClassId, string> = {
  fx_reserve_usd: 'USD',
  gold: 'Vàng',
  real_estate: 'BĐS',
  stocks: 'CK',
  crypto: 'Crypto',
};

export interface AssetConfig {
  id: string;
  type: AssetType;
  name: string;
  beginningBalance: number;
  targetAllocationPercent: number; // e.g. 40 for 40%
  expectedReturnRateAnnual: number; // e.g. 10 for 10%
  investmentYear?: number; // investment start/tracking year, e.g. 2026
  actualReturnByPeriod?: Record<string, number>; // key YYYY-MM -> actual return rate in that month (annualized or monthly percentage)
  contributionByPeriod?: Record<string, number>; // key YYYY-MM -> actual contribution override
  balanceOverrideByPeriod?: Record<string, number>; // key YYYY-MM -> balance override
  notes?: string;
}

export interface AssetPeriodStatus {
  beginningBalance: number;
  contribution: number;
  pnl: number;
  endingBalance: number;
  earmarkedEndingBalance?: number;
  actualReturnApplied: boolean;
}

export interface PortfolioMonthlyOutput {
  assets: Record<AssetType, AssetPeriodStatus>;
  totalBeginningBalance: number;
  totalContribution: number;
  totalPnl: number;
  totalEndingBalance: number;
  unallocatedEndingBalance?: number;
}
