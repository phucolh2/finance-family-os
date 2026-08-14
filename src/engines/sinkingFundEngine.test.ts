import { describe, it, expect } from 'vitest';
import { simulateSinkingFund } from './sinkingFundEngine';
import type { SinkingFund } from '../types/finance';

describe('sinkingFundEngine', () => {
  const baseFund: SinkingFund = {
    id: 'fund1',
    name: 'Test Fund',
    fundType: 'savings',
    status: 'active',
    startMonth: 1,
    startYear: 2026,
    initialDeposit: 1000,
    monthlyContribution: 100,
    termMonths: 3,
    interestRateAnnual: 6, // 0.5% per month
    rolloverStrategy: 'principal_and_interest',
    depositBank: 'VCB',
    targetAssetType: 'gold',
    targetAmount: 1000
  };

  it('should create initial bucket and calculate correct nonTermCash if termMonths = 0', () => {
    const fund = { ...baseFund, termMonths: 0 };
    const result = simulateSinkingFund(fund, 3, 2026);
    // Month 1: 1000 + 100 = 1100
    // Month 2: 100
    // Month 3: 100
    // Total nonTermCash = 1300
    expect(result.buckets).toHaveLength(0);
    expect(result.nonTermCash).toBe(1300);
    expect(result.totalDeposited).toBe(1300);
  });

  it('should rollover principal and interest correctly', () => {
    // Term = 3 months. Starts at m=1 (Jan 2026)
    // Month 1: bucket created, 1100
    // Month 2: new bucket created, 100
    // Month 3: new bucket created, 100
    // Month 4: Month 1 bucket (1100) matures. Interest = 1100 * (6/100/12) * 3 = 1100 * 0.015 = 16.5
    //   Matured total = 1116.5.
    //   Rolled over into new bucket along with month 4 contribution (100) -> 1216.5.
    const result = simulateSinkingFund(baseFund, 4, 2026);
    
    expect(result.buckets.length).toBe(3); // from month 2, 3, 4(new merged with rollover)
    // Let's check total deposited
    expect(result.totalDeposited).toBe(1400); // 1000 + 4*100
  });

  it('should respect rolloverStrategy = return_to_source', () => {
    const fund = { ...baseFund, rolloverStrategy: 'return_to_source' as const };
    const result = simulateSinkingFund(fund, 4, 2026);
    
    // m = startYear * 12 + month = 2026 * 12 + 4 = 24316
    expect(result.autoRefundsByMonth[24316]).toBeGreaterThan(0);
    expect(result.nonTermCash).toBe(0);
  });

  it('should respect rolloverStrategy = principal_only', () => {
    const fund = { ...baseFund, rolloverStrategy: 'principal_only' as const };
    const result = simulateSinkingFund(fund, 4, 2026);
    
    // Matured bucket from month 1: 1100 + 16.5 interest.
    // Rolled over principal = 1100, nonTermCash should get 16.5
    expect(result.nonTermCash).toBeCloseTo(16.5, 1);
  });
  
  it('should respect rolloverStrategy = none', () => {
    const fund = { ...baseFund, rolloverStrategy: 'none' as const };
    const result = simulateSinkingFund(fund, 4, 2026);
    
    expect(result.nonTermCash).toBeCloseTo(1116.5, 1);
  });

  it('should handle withdrawals correctly from nonTermCash and buckets', () => {
    const fund: SinkingFund = { 
      ...baseFund, 
      termMonths: 3, 
      initialDeposit: 1000, 
      monthlyContribution: 0,
      withdrawals: [
        { id: 'w1', month: 2, year: 2026, amount: 200 } // withdrawal before maturity
      ]
    };
    
    const result = simulateSinkingFund(fund, 2, 2026);
    // Initial: 1000 in term bucket.
    // M=2: 200 withdrawal. 
    // nonTermCash is 0, maturedCashPool is 0.
    // Withdraws from bucket. Bucket principal goes from 1000 -> 800.
    // Due to logic, bucket is split into residual.
    
    const bucket = result.buckets[0];
    expect(bucket.principal).toBe(800);
  });

  it('should stop simulation at disbursed date if status is disbursed', () => {
    const fund: SinkingFund = {
      ...baseFund,
      status: 'disbursed',
      disbursedMonth: 2,
      disbursedYear: 2026
    };
    const result = simulateSinkingFund(fund, 6, 2026);
    
    // Should only simulate up to month 2
    expect(result.totalDeposited).toBe(1200); // 1000 + 100 + 100
  });

  it('should handle periodConfigs overrides', () => {
    const fund: SinkingFund = {
      ...baseFund,
      periodConfigs: {
        '2026-02': {
          contribution: 500,
          termMonths: 6,
          interestRateAnnual: 7,
          depositBank: 'TCB',
          rolloverStrategy: 'none'
        }
      }
    };
    
    const result = simulateSinkingFund(fund, 2, 2026);
    // Month 1: 1100 contrib, term=3
    // Month 2: 500 contrib, term=6
    expect(result.totalDeposited).toBe(1600);
    // Month 2 = absolute month 24314
    const m2Bucket = result.buckets.find(b => b.termStart === 24314); 
    expect(m2Bucket?.termMonths).toBe(6);
    expect(m2Bucket?.depositBank).toBe('TCB');
  });
});
