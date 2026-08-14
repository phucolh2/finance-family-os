import { describe, it, expect } from 'vitest';
import { runProjection } from './projectionEngine';
import { 
  DEFAULT_FAMILY_PROFILE, 
  DEFAULT_INCOME_SCHEDULE,
  DEFAULT_BUDGET_SCHEDULE,
  DEFAULT_ASSUMPTIONS,
  DEFAULT_ASSETS,
  DEFAULT_LIFE_EVENTS,
  DEFAULT_INVESTMENT_DEALS,
  DEFAULT_SINKING_FUNDS
} from '../data/defaultInputs';

describe('projectionEngine', () => {
  it('should run projection without crashing using default inputs', () => {
    const output = runProjection({
      profile: DEFAULT_FAMILY_PROFILE,
      incomeSchedule: DEFAULT_INCOME_SCHEDULE,
      budgetSchedule: DEFAULT_BUDGET_SCHEDULE,
      expenseSchedule: [],
      lifeEvents: DEFAULT_LIFE_EVENTS,
      assets: DEFAULT_ASSETS,
      assumptions: DEFAULT_ASSUMPTIONS,
      investmentDeals: DEFAULT_INVESTMENT_DEALS,
      sinkingFunds: DEFAULT_SINKING_FUNDS,
      debts: [],
      fundTransfers: []
    });

    // Check basic structural integrity of the output
    expect(output).toBeDefined();
    expect(output.monthlyRows).toBeInstanceOf(Array);
    expect(output.yearlyRows).toBeInstanceOf(Array);
    
    if (output.monthlyRows.length > 0) {
       expect(output.monthlyRows[0]).toHaveProperty('period.month');
       expect(output.monthlyRows[0]).toHaveProperty('period.year');
       expect(output.monthlyRows[0]).toHaveProperty('nominalNetWorth');
    }
    if (output.yearlyRows.length > 0) {
       expect(output.yearlyRows[0]).toHaveProperty('year');
       expect(output.yearlyRows[0]).toHaveProperty('nominalNetWorth');
    }
  });

  it('should return empty arrays if timeline is empty (e.g. invalid start/end dates)', () => {
    const output = runProjection({
      profile: { ...DEFAULT_FAMILY_PROFILE, planningStartYear: 2060, planningEndYear: 2020 },
      incomeSchedule: [],
      budgetSchedule: [],
      lifeEvents: [],
      assets: [],
      assumptions: DEFAULT_ASSUMPTIONS
    });

    expect(output.monthlyRows).toHaveLength(0);
    expect(output.yearlyRows).toHaveLength(0);
  });

  it('should handle custom projection adjustments and edge case life events correctly', () => {
    const output = runProjection({
      profile: DEFAULT_FAMILY_PROFILE,
      incomeSchedule: DEFAULT_INCOME_SCHEDULE,
      budgetSchedule: DEFAULT_BUDGET_SCHEDULE,
      expenseSchedule: [],
      lifeEvents: [
        ...DEFAULT_LIFE_EVENTS,
        {
          id: 'test_recurring_fund',
          month: 10,
          year: 2026,
          name: 'Test recurring',
          type: 'other',
          amount: 0,
          source: 'saving',
          recurringFundingSource: 'saving',
          recurringMonthlyImpactFund: -5,
          recurringDurationMonthsFund: 5,
          affectsNetWorth: true
        }
      ],
      assets: DEFAULT_ASSETS,
      assumptions: DEFAULT_ASSUMPTIONS,
      investmentDeals: [],
      sinkingFunds: [],
      debts: [
        {
           id: 'debt_1',
           name: 'Mortgage',
           type: 'mortgage',
           principal: 1000,
           interestRateAnnual: 8,
           termMonths: 120,
           startMonth: 10,
           startYear: 2026,
           status: 'active'
        }
      ],
      fundTransfers: [
        {
           id: 'tf_1',
           month: 11,
           year: 2026,
           amount: 50,
           sourceType: 'pool',
           sourceId: 'saving',
           destinationType: 'cashflow',
           destinationId: 'investable',
           createdAt: 1234567890,
           note: ''
        }
      ],
      projectionAdjustments: [
        {
           id: 'adj_1',
           startMonth: 10,
           startYear: 2026,
           endMonth: 12,
           endYear: 2027,
           monthlyInvestmentProfit: 10
        }
      ]
    });

    expect(output.monthlyRows.length).toBeGreaterThan(0);
  });
});
