import { describe, it, expect } from 'vitest';
import { calculatePortfolio } from './portfolioEngine';
import type { TimelinePeriod } from '../types/finance';
import type { AssetConfig, AssetType } from '../types/portfolio';

describe('portfolioEngine', () => {
  const mockPeriod: TimelinePeriod = {
    index: 0,
    key: '2026-05',
    month: 5,
    year: 2026,
    husbandAge: 30,
    wifeAge: 28
  };

  const emptyPrevBalances: Record<AssetType, number> = {
    fx_reserve_usd: 0,
    gold: 0,
    real_estate: 0,
    stocks: 0,
    crypto: 0
  };

  const defaultAssets: AssetConfig[] = [
    { id: '1', beginningBalance: 0, type: 'stocks', name: 'Stocks', targetAllocationPercent: 60, expectedReturnRateAnnual: 12 },
    { id: '2', beginningBalance: 0, type: 'crypto', name: 'Crypto', targetAllocationPercent: 20, expectedReturnRateAnnual: 24 },
    { id: '3', beginningBalance: 0, type: 'gold', name: 'Gold', targetAllocationPercent: 10, expectedReturnRateAnnual: 6 },
    { id: '4', beginningBalance: 0, type: 'real_estate', name: 'Real Estate', targetAllocationPercent: 10, expectedReturnRateAnnual: 8 }
  ];

  it('should allocate monthly investment based on targetAllocationPercent', () => {
    const result = calculatePortfolio({
      period: mockPeriod,
      assets: defaultAssets,
      monthlyInvestmentAmount: 1000,
      previousBalances: emptyPrevBalances
    });

    expect(result.assets.stocks.contribution).toBe(600);
    expect(result.assets.crypto.contribution).toBe(200);
    expect(result.assets.gold.contribution).toBe(100);
    expect(result.assets.real_estate.contribution).toBe(100);
    expect(result.assets.fx_reserve_usd.contribution).toBe(250); // fallback is 25% if targetAllocationPercent is missing
    
    expect(result.totalContribution).toBe(1250);
  });

  it('should override balance if balanceOverrideByPeriod is provided', () => {
    const assetsWithOverride = [
      {
        ...defaultAssets[0],
        balanceOverrideByPeriod: { '2026-05': 5000 }
      }
    ];

    const result = calculatePortfolio({
      period: mockPeriod,
      assets: assetsWithOverride,
      monthlyInvestmentAmount: 0,
      previousBalances: emptyPrevBalances
    });

    expect(result.assets.stocks.beginningBalance).toBe(5000);
    // Pnl = (5000 + 0) * (0.12/12) = 5000 * 0.01 = 50
    expect(result.assets.stocks.pnl).toBe(50);
    expect(result.assets.stocks.endingBalance).toBe(5050);
  });

  it('should override contribution if contributionByPeriod is provided', () => {
    const assetsWithOverride = [
      {
        ...defaultAssets[0],
        contributionByPeriod: { '2026-05': 100 }
      }
    ];

    const result = calculatePortfolio({
      period: mockPeriod,
      assets: assetsWithOverride,
      monthlyInvestmentAmount: 1000, // Should be ignored for stocks
      previousBalances: emptyPrevBalances
    });

    expect(result.assets.stocks.contribution).toBe(100);
    // Other assets fall back to 25% or their target
  });

  it('should apply actual return if actualReturnByPeriod is provided', () => {
    const assetsWithOverride = [
      {
        ...defaultAssets[0],
        actualReturnByPeriod: { '2026-05': 24 } // 24% annual -> 2% monthly
      }
    ];

    const result = calculatePortfolio({
      period: mockPeriod,
      assets: assetsWithOverride,
      monthlyInvestmentAmount: 0,
      previousBalances: { ...emptyPrevBalances, stocks: 1000 }
    });

    expect(result.assets.stocks.actualReturnApplied).toBe(true);
    // Pnl = 1000 * (0.24 / 12) = 1000 * 0.02 = 20
    expect(result.assets.stocks.pnl).toBe(20);
    expect(result.assets.stocks.endingBalance).toBe(1020);
  });

  it('should calculate PnL correctly with half contribution rule', () => {
    // pnl = (beg + contrib * 0.5) * monthlyReturn
    const result = calculatePortfolio({
      period: mockPeriod,
      assets: defaultAssets,
      monthlyInvestmentAmount: 1000,
      previousBalances: { ...emptyPrevBalances, stocks: 1000 }
    });

    // stocks contrib = 600
    // stocks return = 12% annual -> 1% monthly
    // pnl = (1000 + 600 * 0.5) * 0.01 = 1300 * 0.01 = 13
    expect(result.assets.stocks.pnl).toBe(13);
    expect(result.assets.stocks.endingBalance).toBe(1000 + 600 + 13);
  });
});
