import type { TimelinePeriod } from '../types/finance';
import type { AssetConfig, PortfolioMonthlyOutput, AssetPeriodStatus, AssetType } from '../types/portfolio';
import { safeNumber, safeArray } from '../utils/math';

export interface PortfolioEngineInput {
  period: TimelinePeriod;
  assets: AssetConfig[];
  monthlyInvestmentAmount: number;
  previousBalances: Record<AssetType, number>;
}

/**
 * Pure, deterministic portfolio engine.
 * Calculates beginning balances, contributions, yields (expected vs actual), and ending balances for each asset.
 */
export function calculatePortfolio(input: PortfolioEngineInput): PortfolioMonthlyOutput {
  const period = input.period;
  const assets = safeArray(input.assets);
  const totalContribution = safeNumber(input.monthlyInvestmentAmount, 0);
  const prevBalances = input.previousBalances;
  const periodKey = period.key;

  const defaultAssetStatus = (): AssetPeriodStatus => ({
    beginningBalance: 0,
    contribution: 0,
    pnl: 0,
    endingBalance: 0,
    actualReturnApplied: false,
  });

  const assetOutputs: Record<AssetType, AssetPeriodStatus> = {
    fx_reserve_usd: defaultAssetStatus(),
    gold: defaultAssetStatus(),
    real_estate: defaultAssetStatus(),
    stocks: defaultAssetStatus(),
    crypto: defaultAssetStatus(),
  };

  let totalBeg = 0;
  let totalContrib = 0;
  let totalPnl = 0;
  let totalEnd = 0;

  // Process each default asset type
  const assetTypes: AssetType[] = ['fx_reserve_usd', 'gold', 'real_estate', 'stocks', 'crypto'];

  assetTypes.forEach((type) => {
    const config = assets.find((a) => a.type === type);
    const prevBal = safeNumber(prevBalances[type], 0);

    // 1. Balance override check
    let beginningBalance = prevBal;
    if (config?.balanceOverrideByPeriod?.[periodKey] !== undefined) {
      beginningBalance = safeNumber(config.balanceOverrideByPeriod[periodKey], 0);
    }

    // 2. Contribution check
    let contribution = 0;
    if (config?.contributionByPeriod?.[periodKey] !== undefined) {
      contribution = safeNumber(config.contributionByPeriod[periodKey], 0);
    } else {
      // Allocate investment based on target allocation ratio
      const allocationRatio = safeNumber(config?.targetAllocationPercent, 25) / 100;
      contribution = totalContribution * allocationRatio;
    }

    // 3. Return yield check (actual vs expected)
    let annualReturn = safeNumber(config?.expectedReturnRateAnnual, 0);
    let actualReturnApplied = false;

    if (config?.actualReturnByPeriod?.[periodKey] !== undefined) {
      annualReturn = safeNumber(config.actualReturnByPeriod[periodKey], 0);
      actualReturnApplied = true;
    }

    // Annual return to monthly percentage (e.g. 10% -> 0.10 / 12)
    const returnRate = annualReturn > 1 ? annualReturn / 100 : annualReturn;
    const monthlyReturn = returnRate / 12;

    // 4. Calculate PnL and Ending Balance
    // Formula: pnl = (beginningBalance + contribution * 0.5) * monthlyReturn
    const pnl = (beginningBalance + contribution * 0.5) * monthlyReturn;
    const endingBalance = beginningBalance + contribution + pnl;

    assetOutputs[type] = {
      beginningBalance,
      contribution,
      pnl,
      endingBalance,
      actualReturnApplied,
    };

    totalBeg += beginningBalance;
    totalContrib += contribution;
    totalPnl += pnl;
    totalEnd += endingBalance;
  });

  return {
    assets: assetOutputs,
    totalBeginningBalance: totalBeg,
    totalContribution: totalContrib,
    totalPnl: totalPnl,
    totalEndingBalance: totalEnd,
  };
}
