import { describe, it, expect } from 'vitest';
import { checkBufferFund, checkBudgetPressure, checkSinkingFundProgress, applyGlidePath, computeSmartAllocation, computeExpenseFinancing } from './SmartAllocationAdvisor';
import type { AllocationSnapshot } from './SmartAllocationAdvisor';

describe('SmartAllocationAdvisor', () => {
  const mockSnapshot: AllocationSnapshot = {
    appState: {
      budgetSchedule: [
        { id: 'b1', effectiveYear: 2026, effectiveMonth: 1, rootGroups: [{ groupId: 'g1', name: 'Nhà cửa' }], ratios: [], note: '', status: 'active' } as any
      ],
      sinkingFunds: [
        { id: 'f1', startYear: 2026, startMonth: 1, monthlyContribution: 10, targetAmount: 120, termMonths: 12, initialDeposit: 0, status: 'active' } as any,
        { id: 'f2', startYear: 2026, startMonth: 8, monthlyContribution: 5, targetAmount: 60, termMonths: 12, initialDeposit: 0, status: 'active' } as any // future
      ],
      lifeStages: [
        { name: 'Tích lũy tài sản', fromYear: 2026, toYear: 2030 },
        { name: 'Nuôi dạy con', fromYear: 2031, toYear: 2045 },
        { name: 'Nghỉ hưu / FIRE', fromYear: 2046, toYear: 2080 }
      ],
      resolvedMonthlyDbMap: {
        '2026-06': {
          budgetAmounts: { 'g1': 100, 'g2': 50 },
          actualExpenseByGroup: { 'g1': 90, 'g2': 20 }
        }
      } as any
    } as any,
    projection: {
      monthlyRows: [
        { period: { key: '2026-06' }, netCashflowMonthly: 20 }
      ]
    } as any,
    currentPeriodKey: '2026-06',
    housingBasicAvgExpense: 20,
    currentLiquidityBalance: 10
  };

  describe('checkBufferFund', () => {
    it('should suggest allocation to reach floor and recommended target', () => {
      // floor: 60, recommended: 120, current: 10
      const { suggestions, remaining } = checkBufferFund(mockSnapshot, 100);
      
      expect(suggestions.length).toBe(2);
      expect(suggestions[0].amount).toBe(50); // to reach floor (60 - 10)
      expect(suggestions[1].amount).toBe(50); // goes towards recommended
      expect(remaining).toBe(0);
    });

    it('should skip if housingBasicAvgExpense is 0', () => {
      const snap = { ...mockSnapshot, housingBasicAvgExpense: 0 };
      const { suggestions, remaining } = checkBufferFund(snap, 100);
      expect(suggestions.length).toBe(0);
      expect(remaining).toBe(100);
    });
  });

  describe('checkBudgetPressure', () => {
    it('should find groups over 85% ratio and allocate to bring them down to 70%', () => {
      // g1 budget: 100, actual: 90 -> 90%
      // target safe actual: 70
      // gap: 20
      const { suggestions, remaining } = checkBudgetPressure(mockSnapshot, 50);
      
      expect(suggestions.length).toBe(1);
      expect(suggestions[0].targetId).toBe('g1');
      expect(suggestions[0].amount).toBe(20);
      expect(remaining).toBe(30);
    });
    
    it('should handle missing resolvedMonthlyDbMap', () => {
      const snap = { ...mockSnapshot, appState: { ...mockSnapshot.appState, resolvedMonthlyDbMap: undefined } } as any;
      const { suggestions, remaining } = checkBudgetPressure(snap, 50);
      expect(suggestions.length).toBe(0);
      expect(remaining).toBe(50);
    });
  });

  describe('checkSinkingFundProgress', () => {
    it('should find delayed funds and allocate to catch up', () => {
      // 2026-06 vs start 2026-01 -> monthsPassed = 6
      // f1 target: 120, term: 12. timeProgress = 0.5. targetCurrentBalance = 60
      // expectedContributionSoFar = 60
      // financial progress = 60/120 = 0.5 = timeProgress. No gap!
      
      // Let's modify mock to create a gap. Assume initialDeposit is missing, but monthlyContribution is 5 instead of 10
      const snap = {
        ...mockSnapshot,
        appState: {
          ...mockSnapshot.appState,
          sinkingFunds: [
            { id: 'f1', fundGroup: 'Test Group', startYear: 2026, startMonth: 1, monthlyContribution: 5, targetAmount: 120, termMonths: 12, initialDeposit: 0, status: 'active' } as any
          ]
        }
      };
      // expectedContributionSoFar = 5 * 6 = 30
      // gap = 60 - 30 = 30
      const { suggestions, remaining } = checkSinkingFundProgress(snap, 100);
      expect(suggestions.length).toBe(1);
      expect(suggestions[0].amount).toBe(30);
      expect(remaining).toBe(70);
    });
  });

  describe('applyGlidePath', () => {
    it('should apply accumulation stage logic', () => {
      const { suggestions, remaining } = applyGlidePath(mockSnapshot, 100);
      
      expect(suggestions.length).toBe(2);
      expect(suggestions.find(s => s.targetId === 'investment_longterm')?.amount).toBe(40); // 40%
      expect(suggestions.find(s => s.targetId === 'short_term_goals')?.amount).toBe(60); // 60%
      expect(remaining).toBe(0);
    });

    it('should handle retirement stage logic', () => {
      const snap = { ...mockSnapshot, currentPeriodKey: '2046-01' }; // Retirement stage
      const { suggestions, remaining } = applyGlidePath(snap, 100);
      
      expect(suggestions.find(s => s.targetId === 'investment_longterm')?.amount).toBe(80); // 80%
      expect(suggestions.find(s => s.targetId === 'short_term_goals')?.amount).toBe(20); // 20%
      expect(remaining).toBe(0);
    });
  });

  describe('computeSmartAllocation', () => {
    it('should chain all steps and return suggestions', () => {
      // 100 amount
      // step 1: buffer takes 100.
      const { suggestions, remaining } = computeSmartAllocation(100, mockSnapshot);
      expect(suggestions.length).toBe(2); // both tier 0
      expect(remaining).toBe(0);
    });
  });

  describe('computeExpenseFinancing', () => {
    it('should suggest upfront payment if available liquidity is sufficient', () => {
      // housingAvg = 20, floor = 60. currentLiq = 100 -> available = 40.
      // expense = 30.
      const snap = { ...mockSnapshot, currentLiquidityBalance: 100 };
      const res = computeExpenseFinancing(30, snap);
      
      expect(res.upfrontPayment).toBe(30);
      expect(res.remainingToFinance).toBe(0);
      expect(res.isFeasible).toBe(true);
    });

    it('should calculate duration and monthly payment if financing is needed and feasible', () => {
      // floor = 60. currentLiq = 70 -> available = 10.
      // expense = 40 -> finance = 30.
      // surplus = 20 -> safe = 18.
      // duration = ceil(30 / 18) = 2.
      const snap = { ...mockSnapshot, currentLiquidityBalance: 70 };
      const res = computeExpenseFinancing(40, snap);
      
      expect(res.upfrontPayment).toBe(10);
      expect(res.remainingToFinance).toBe(30);
      expect(res.durationMonths).toBe(2);
      expect(res.isFeasible).toBe(true);
    });

    it('should return infeasible if safe monthly payment is not enough', () => {
      // surplus = 0
      const snap = { 
        ...mockSnapshot, 
        currentLiquidityBalance: 60,
        projection: {
          monthlyRows: [
            { period: { key: '2026-06' }, netCashflowMonthly: 0 }
          ]
        } as any
      };
      const res = computeExpenseFinancing(40, snap);
      
      expect(res.isFeasible).toBe(false);
    });
  });
});
