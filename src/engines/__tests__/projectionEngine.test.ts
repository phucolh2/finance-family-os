import { describe, it, expect } from 'vitest';
import { runProjection } from '../projectionEngine';
import type { AppState, SinkingFund } from '../../types/finance';

describe('projectionEngine', () => {
  it('should decrease sinking fund balances correctly with Track B events', () => {
    // Setup initial state
    const input = {
      profile: {
        planningStartMonth: 1,
        planningStartYear: 2026,
        planningEndMonth: 12,
        planningEndYear: 2026,
        currency: 'VND_MILLION'
      } as any,
      sinkingFunds: [
        {
          id: 'fund1',
          name: 'Quỹ dự phòng',
          status: 'active',
          sourceOfFund: 'savings',
          initialDeposit: 100,
          monthlyContribution: 0,
          startMonth: 1,
          startYear: 2026
        } as SinkingFund
      ],
      lifeEvents: [
        {
          id: 'evt1',
          name: 'Trả góp TV',
          type: 'flexible',
          month: 1,
          year: 2026,
          recurringFundingSource: 'fund1',
          recurringMonthlyImpactFund: -5,
          recurringDurationMonthsFund: 10,
          source: 'salary', // required field
          assetType: 'other' // required field
        } as any
      ],
      budgetSchedule: [],
      incomeSchedule: [{ id: 'inc1', effectiveMonth: 1, effectiveYear: 2026, incomeMonthly: 0 } as any],
      expenseSchedule: [],
      assets: [],
      assumptions: {
        inflationRate: 0,
        investmentReturnRate: 0,
        savingsInterestRate: 0,
        loanInterestRate: 0,
        investmentYieldExpectationAnnual: 0
      }
    };

    const projection = runProjection(input as any);

    // Initial is 100. Over 10 months (Jan to Oct is 10 months), it should deduct 5 * 10 = 50.
    // The balance at month 10 should be 50.
    const month10 = projection.monthlyRows.find(s => s.period.month === 10 && s.period.year === 2026);
    expect(month10).toBeDefined();
    // Event impact is 5 per month starting in Feb. Jan to Oct is 10 months, so it deducts 5 for 9 months (Feb to Oct).
    // The balance at month 10 should be -45.
    expect(month10!._groupBalances!['fund1']).toBe(-45);
  });
});
