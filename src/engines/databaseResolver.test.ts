import { describe, it, expect } from 'vitest';
import { generateResolvedMonthlyDb } from './databaseResolver';
import type { FamilyProfile, IncomeScheduleItem, Assumptions } from '../types/finance';
import type { BudgetRatioScheduleItem, ExpenseScheduleItem } from '../types/budget';
import type { AssetConfig } from '../types/portfolio';

describe('databaseResolver', () => {
  const profile: FamilyProfile = {
    planningStartMonth: 1,
    planningStartYear: 2026,
    planningEndMonth: 3,
    planningEndYear: 2026, // 3 months timeline
    husbandAgeAtStart: 30,
    wifeAgeAtStart: 30,
  } as any;

  const incomeSchedule: IncomeScheduleItem[] = [
    { id: 'inc1', effectiveMonth: 1, effectiveYear: 2026, incomeMonthly: 100, incomeType: 'fulltime_salary', status: 'active', note: '' }
  ];

  const budgetSchedule: BudgetRatioScheduleItem[] = [
    {
      id: 'bud1', effectiveMonth: 1, effectiveYear: 2026, status: 'active',
      rootGroups: [
        {
          id: 'g1', parentId: null, level: 0, nodeType: 'group', sortOrder: 0, groupId: 'housing_basic', name: 'Nhà cửa', ratioPercent: 100, isActive: true,
          children: [
            { id: 'housing-basic', parentId: 'g1', level: 1, nodeType: 'item', sortOrder: 0, groupId: 'housing_basic', name: 'Nhà', ratioPercent: 40, isActive: true, classification: 'expense' },
            { id: 'food', parentId: 'g1', level: 1, nodeType: 'item', sortOrder: 1, groupId: 'housing_basic', name: 'Ăn uống', ratioPercent: 60, isActive: true, classification: 'expense' }
          ]
        }
      ],
      ratios: [],
      note: ''
    }
  ];

  const expenseSchedule: ExpenseScheduleItem[] = [
    {
      id: 'exp1', effectiveMonth: 1, effectiveYear: 2026,
      categories: {
        'housing-basic': 30, // fixed amount
        'food': -1  // dynamic to budget amount
      },
      note: ''
    }
  ];

  const assets: AssetConfig[] = [
    { id: 'a1', beginningBalance: 0, type: 'stocks', targetAllocationPercent: 100, expectedReturnRateAnnual: 10, name: '' }
  ];

  const assumptions: Assumptions = {} as any;

  it('should generate resolved db correctly for basic setup', () => {
    const { list, map } = generateResolvedMonthlyDb(profile, incomeSchedule, budgetSchedule, expenseSchedule, assets, assumptions);

    expect(list).toHaveLength(3); // Jan, Feb, Mar

    const jan = map['2026-01'];
    expect(jan).toBeDefined();
    expect(jan.income).toBe(100);
    expect(jan.expectedReturnAnnual).toBe(10); // 100% * 10% / 100% = 10%

    // c1 = 40% -> 40
    // c2 = 60% -> 60
    expect(jan.budgetRatios['housing_basic']).toBe(100); // 40 + 60
    expect(jan.budgetAmounts['housing_basic']).toBe(100);
    expect(jan.budgetAmountsByCategory!['housing-basic']).toBe(40);
    expect(jan.budgetAmountsByCategory!['food']).toBe(60);

    // Actual expenses
    // c1 is fixed 30
    // c2 is dynamic (-1), so it maps to budget amount = 60
    // Total actual = 90
    expect(jan.actualExpenseCategories!['housing-basic']).toBe(30);
    expect(jan.actualExpenseCategories!['food']).toBe(60);
    expect(jan.actualExpenseByGroup!['housing_basic']).toBe(90);
    expect(jan.totalActualExpenseMonthly).toBe(90);
  });

  it('should handle ended expense schedules', () => {
    const localExp = [
      {
        id: 'exp1', effectiveMonth: 1, effectiveYear: 2026, endMonth: 1, endYear: 2026,
        categories: { 'housing-basic': 30 }, note: ''
      }
    ];
    
    const { map } = generateResolvedMonthlyDb(profile, incomeSchedule, budgetSchedule, localExp, assets, assumptions);
    
    expect(map['2026-01'].totalActualExpenseMonthly).toBe(30);
    
    // Ended in Jan, so Feb should be 0 since no other schedule applies
    expect(map['2026-02'].totalActualExpenseMonthly).toBe(0);
    expect(Object.keys(map['2026-02'].actualExpenseCategories!).length).toBe(0);
  });

  it('should handle zero assets for weighted return calculation', () => {
    const { list } = generateResolvedMonthlyDb(profile, incomeSchedule, budgetSchedule, expenseSchedule, [], assumptions);
    expect(list[0].expectedReturnAnnual).toBe(0);
  });

  it('should handle dynamic expense mapped to non-existent budget', () => {
    const localExp = [
      {
        id: 'exp1', effectiveMonth: 1, effectiveYear: 2026,
        categories: { 'c_missing': -1 }, note: '' // No budget category c_missing
      }
    ];
    const { list } = generateResolvedMonthlyDb(profile, incomeSchedule, budgetSchedule, localExp, assets, assumptions);
    expect(list[0].actualExpenseCategories!['c_missing']).toBe(0); // defaults to 0
    expect(list[0].totalActualExpenseMonthly).toBe(0);
  });
});
