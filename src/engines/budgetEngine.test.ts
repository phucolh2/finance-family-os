import { describe, it, expect } from 'vitest';
import { calculateBudget } from './budgetEngine';

describe('budgetEngine', () => {
  describe('calculateBudget', () => {
    it('should correctly calculate budget amounts from active tree ratios', () => {
      const budgetSchedule = [
        {
          id: 'b1',
          effectiveMonth: 1,
          effectiveYear: 2030,
          rootGroups: [
            {
              groupId: 'housing_basic',
              name: 'Nhà ở & Sinh hoạt cơ bản',
              ratioPercent: 40,
              isActive: true,
              children: []
            },
            {
              groupId: 'future_investing',
              name: 'Đầu tư tương lai',
              ratioPercent: 30,
              isActive: true,
              children: []
            },
            {
              groupId: 'safety_reserve',
              name: 'Dự phòng an toàn',
              ratioPercent: 10,
              isActive: true,
              children: []
            }
          ] as any,
        }
      ];

      const period = { month: 1, year: 2030, husbandAge: 30, wifeAge: 30, index: 0, key: '2030-01' };

      const result = calculateBudget({
        incomeMonthly: 100,
        budgetSchedule: budgetSchedule,
        period: period,
        childCost: { isActive: false, totalMonthly: 0 } as any
      });

      // Verify the ratios and amounts were updated
      expect(result.categories.find(c => c.group === 'housing_basic')?.ratioPercent).toBe(40);
      expect(result.categories.find(c => c.group === 'housing_basic')?.amountMonthly).toBe(40); // 40% of 100

      expect(result.categories.find(c => c.group === 'future_investing')?.ratioPercent).toBe(30);
      expect(result.categories.find(c => c.group === 'future_investing')?.amountMonthly).toBe(30);
    });
  });
});
