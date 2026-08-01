import { describe, it, expect, vi } from 'vitest';
import { computeSmartAllocation, checkBufferFund, checkBudgetPressure, checkSinkingFundProgress, applyGlidePath } from '../SmartAllocationAdvisor';
import type { AllocationSnapshot, AllocationSuggestion } from '../SmartAllocationAdvisor';

describe('SmartAllocationAdvisor Engine', () => {
  const createMockSnapshot = (overrides: Partial<AllocationSnapshot> = {}): AllocationSnapshot => ({
    appState: {
      profile: {
        husbandName: 'Test',
        wifeName: 'Test',
        husbandAgeAtStart: 30,
        wifeAgeAtStart: 30,
        planningEndMonth: 12,
        planningEndYear: 2030,
        currency: 'VND_MILLION',
        planningStartMonth: 1,
        planningStartYear: 2024
      },
      incomeSchedule: [],
      budgetSchedule: [
        {
          id: 'b1',
          effectiveMonth: 1,
          effectiveYear: 2024,

          rootGroups: [
            { id: 'group_housing_basic', groupId: 'housing_basic', name: 'Nhà cửa', ratioPercent: 30, isActive: true, classification: 'expense', level: 0, nodeType: 'group', parentId: null, sortOrder: 0 },
            { id: 'group_health_growth', groupId: 'health_growth', name: 'Sức khỏe', ratioPercent: 20, isActive: true, classification: 'expense', level: 0, nodeType: 'group', parentId: null, sortOrder: 1 }
          ]
        }
      ],
      expenseSchedule: [],
      lifeStages: [
        { id: 's1', fromYear: 2024, toYear: 2030, name: 'Tích lũy', hasChild: false, incomeMonthly: 0, parentsMonthly: 0, childLifestyle: 'basic', childBudgetCapMonthly: 0 }
      ],
      lifeEvents: [],
      assets: [],
      assumptions: {
        generalInflationRateAnnual: 4,
        savingsInterestRateAnnual: 5,
        investmentYieldExpectationAnnual: 8,
        medicalInflationRateAnnual: 6,
        educationInflationRateAnnual: 6
      },
      sinkingFunds: [
        {
          id: 'sf1',
          name: 'Mua xe',
          fundGroup: 'Mua xe',
          targetAssetType: 'gold',
          targetAmount: 500,
          initialDeposit: 50,
          monthlyContribution: 10,
          interestRateAnnual: 5,
          startMonth: 1,
          startYear: 2024,
          status: 'active'
        }
      ],
      resolvedMonthlyDbMap: {
        '2024-06': {
          periodKey: '2024-06',
          month: 6,
          year: 2024,
          income: 100,
          expectedReturnAnnual: 8,
          budgetRatios: {},
          budgetAmounts: {
            'housing_basic': 10,
            'health_growth': 5
          },
          actualExpenseByGroup: {
            'housing_basic': 8, // 80%
            'health_growth': 6  // 120% -> Level 3
          }
        }
      }
    },
    projection: {
      monthlyRows: [
        {
          period: { key: '2024-06', month: 6, year: 2024, index: 0, husbandAge: 30, wifeAge: 30 },
          liquidityBalance: 15,
          savingBalance: 0,
          debtReserveBalance: 0,
          healthBalance: 0,
          unallocatedCashBalance: 0,
          portfolio: { breakdown: {}, allocation: [] } as any,
          propertyValue: 0,
          nominalNetWorth: 0,
          realNetWorth: 0,
          fireTarget: 0,
          fireProgress: 0,
          fireGap: 0,
          notes: [],
          incomeMonthly: 0,
          expensesMonthly: 0,
          investmentMonthly: 0,
          savingMonthly: 0,
          debtReserveMonthly: 0,
          liquidityMonthly: 0,
          healthMonthly: 0,
          childCostMonthly: 0,
          lifeEventImpactMonthly: 0,
          debtPaymentMonthly: 0,
          netCashflowMonthly: 0
        }
      ],
      yearlyRows: [],
      warnings: []
    },
    currentPeriodKey: '2024-06',
    housingBasicAvgExpense: 10,
    currentLiquidityBalance: 15,
    ...overrides
  });

  describe('Tier 0 - checkBufferFund', () => {
    it('should allocate to reach floor target (3x) if below', () => {
      const snapshot = createMockSnapshot({
        housingBasicAvgExpense: 10,
        currentLiquidityBalance: 15 // Needs 15 more to reach 30 (3x)
      });
      const { suggestions, remaining } = checkBufferFund(snapshot, 100);
      
      // Should allocate 15 for floor, and 30 for recommended (6x = 60).
      // Wait, the logic allocates floor first.
      expect(suggestions.length).toBe(2);
      expect(suggestions[0].amount).toBe(15);
      expect(suggestions[1].amount).toBe(30);
      expect(remaining).toBe(100 - 15 - 30); // 55
    });

    it('should only allocate floor if availableAmount is limited', () => {
      const snapshot = createMockSnapshot({
        housingBasicAvgExpense: 10,
        currentLiquidityBalance: 15
      });
      const { suggestions, remaining } = checkBufferFund(snapshot, 20);
      
      expect(suggestions.length).toBe(2);
      expect(suggestions[0].amount).toBe(15);
      expect(suggestions[1].amount).toBe(5); // Only 5 left for the recommended tier
      expect(remaining).toBe(0);
    });

    it('should skip if liquidity is already >= 6x', () => {
      const snapshot = createMockSnapshot({
        housingBasicAvgExpense: 10,
        currentLiquidityBalance: 100 // 6x = 60
      });
      const { suggestions, remaining } = checkBufferFund(snapshot, 100);
      expect(suggestions.length).toBe(0);
      expect(remaining).toBe(100);
    });
  });

  describe('Tier 1 - checkBudgetPressure', () => {
    it('should find groups > 85% and allocate to bring them down to 70%', () => {
      const snapshot = createMockSnapshot(); // health_growth is at 6 (120% of 5)
      const { suggestions, remaining } = checkBudgetPressure(snapshot, 100);
      
      expect(suggestions.length).toBe(1);
      expect(suggestions[0].targetId).toBe('health_growth');
      // Target safe actual = 5 * 0.7 = 3.5. Gap = 6 - 3.5 = 2.5
      expect(suggestions[0].amount).toBe(2.5);
      expect(remaining).toBe(97.5);
    });
  });

  describe('Tier 2 - checkSinkingFundProgress', () => {
    it('should allocate to sinking fund if financial progress < time progress', () => {
      const snapshot = createMockSnapshot(); 
      // Fund started 2024-01. Current is 2024-06. Months passed = 6.
      // Expected contribution = 50 + 6*10 = 110.
      // Target = 500. Time progress (assuming 12 mo term) = 6/12 = 0.5.
      // Financial progress = 110 / 500 = 0.22.
      // Target current balance = 500 * 0.5 = 250.
      // Gap = 250 - 110 = 140.
      const { suggestions, remaining } = checkSinkingFundProgress(snapshot, 200);
      
      expect(suggestions.length).toBe(1);
      expect(suggestions[0].amount).toBe(140);
      expect(remaining).toBe(60);
    });
  });

  describe('Tier 3 - applyGlidePath', () => {
    it('should distribute remaining according to accumulation stage (40/60)', () => {
      const snapshot = createMockSnapshot();
      const { suggestions, remaining } = applyGlidePath(snapshot, 100);
      
      expect(suggestions.length).toBe(2);
      expect(suggestions[0].amount).toBe(40); // Long-term
      expect(suggestions[0].durationMonths).toBe(4); // 40 / 10M per month
      expect(suggestions[1].amount).toBe(60); // Short-term
      expect(suggestions[1].durationMonths).toBe(6);
      expect(remaining).toBe(0);
    });
  });

  describe('computeSmartAllocation (Waterfall)', () => {
    it('should flow through all tiers sequentially', () => {
      const snapshot = createMockSnapshot();
      const { suggestions, remaining } = computeSmartAllocation(150, snapshot);
      
      // Tier 0: 15 (floor) + 30 (rec) = 45. Remaining: 105
      // Tier 1: 2.5. Remaining: 102.5
      // Tier 2: 140 (wait, only 102.5 remaining)
      // Tier 3: 0
      
      expect(suggestions.length).toBe(4);
      expect(suggestions[0].tier).toBe(0);
      expect(suggestions[1].tier).toBe(0);
      expect(suggestions[2].tier).toBe(1);
      expect(suggestions[3].tier).toBe(2);
      expect(suggestions[3].amount).toBe(102.5);
      expect(remaining).toBe(0);
    });
  });
});
