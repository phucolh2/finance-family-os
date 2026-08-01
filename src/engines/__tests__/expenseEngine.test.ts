import { describe, it, expect } from 'vitest';
import { analyzeExpense } from '../expenseEngine';
import type { LifeEvent } from '../../types/finance';
import type { ResolvedMonthlyDbItem } from '../../types/finance';

describe('expenseEngine', () => {
  describe('analyzeExpense', () => {
    it('should calculate base actual correctly for a single month', () => {
      const dbItem: ResolvedMonthlyDbItem = {
        periodKey: '2026-10',
        month: 10,
        year: 2026,
        income: 100,
        expectedReturnAnnual: 5,
        budgetRatios: {},
        budgetAmounts: { housing: 10, food: 8 },
        budgetAmountsByCategory: {},
        actualExpenseCategories: {
          'housing/rent': 7,
          'food/groceries': 7
        },
      };

      const monthlyDb = [dbItem];
      const lifeEvents: LifeEvent[] = [];

      const result = analyzeExpense(
        monthlyDb,
        lifeEvents,
        '2026-10',
        ['housing', 'food']
      );

      // Total housing group actual should be 7
      expect(result.summaryByGroup['housing'].totalActual).toBe(7);
      expect(result.summaryByGroup['food'].totalActual).toBe(7);
    });

    it('should strip Track A impacts from base actual', () => {
      const dbItem: ResolvedMonthlyDbItem = {
        periodKey: '2026-10',
        month: 10,
        year: 2026,
        income: 100,
        expectedReturnAnnual: 5,
        budgetRatios: {},
        budgetAmounts: { housing: 10 },
        budgetAmountsByCategory: {},
        actualExpenseCategories: {
          'housing/rent': 6 // Reduced manually in DB
        },
      };

      const lifeEvents: LifeEvent[] = [
        {
          id: 'evt1',
          name: 'Phí dịch vụ tăng thêm',
          type: 'flexible',
          assetType: 'other',
          month: 9, // Start in month 9 so it impacts month 10
          year: 2026,
          capital: 0,
          source: 'salary',
          spendingCategory: 'housing/rent',
          recurringMonthlyImpact: -1,
          recurringDurationMonths: 1,
          recurringFundingSource: '',
          recurringMonthlyImpactFund: 0,
          recurringDurationMonthsFund: 0
        } as any
      ];

      const result = analyzeExpense(
        [dbItem],
        lifeEvents,
        '2026-10',
        ['housing']
      );

      // The regular actual is 6. The flexible is 1 (Math.abs(-1)).
      // Total actual is 6 + 1 = 7
      expect(result.summaryByGroup['housing'].totalActual).toBe(7);
      expect(result.summaryByGroup['housing'].totalRegularActual).toBe(6);
      expect(result.monthlySeries['housing'][0].flexibleActual).toBe(1);
    });

    it('should include OneTime events in totalActual but keep regularActual clean', () => {
      const dbItem: ResolvedMonthlyDbItem = {
        periodKey: '2026-10',
        month: 10,
        year: 2026,
        income: 100,
        expectedReturnAnnual: 5,
        budgetRatios: {},
        budgetAmounts: { housing: 10 },
        budgetAmountsByCategory: {},
        actualExpenseCategories: {
          'housing/rent': 7
        },
      };

      const lifeEvents: LifeEvent[] = [
        {
          id: 'evt1',
          name: 'Sửa nhà',
          type: 'flexible',
          assetType: 'other',
          month: 10, // One-time event impacts same month
          year: 2026,
          amount: -3, // One-time expense is negative
          source: 'housing/rent', // the logic uses e.source for group split
          spendingCategory: 'housing/rent',
        } as any
      ];

      const result = analyzeExpense(
        [dbItem],
        lifeEvents,
        '2026-10',
        ['housing']
      );

      // Total actual = 7 (base) + 3 (one time) = 10
      expect(result.summaryByGroup['housing'].totalActual).toBe(10);
      expect(result.summaryByGroup['housing'].totalRegularActual).toBe(7);
      expect(result.monthlySeries['housing'][0].flexibleActual).toBe(3);
    });
  });
});
