import { describe, it, expect } from 'vitest';
import { analyzeExpense } from './expenseEngine';
import type { ResolvedMonthlyDbItem, LifeEvent } from '../types/finance';

describe('expenseEngine', () => {
  const mockDb: ResolvedMonthlyDbItem[] = [
    {
      periodKey: '2026-10',
      month: 10,
      year: 2026,
      budgetAmounts: {
        housing_basic: 30,
        future_investing: 40,
        custom_group: 10
      },
      budgetAmountsByCategory: {
        'housing_basic/rent': 20,
        'housing_basic/food': 10
      },
      actualExpenseByGroup: {
        housing_basic: 25,
        custom_group: 5
      },
      actualExpenseCategories: {
        'housing_basic/rent': 15,
        'housing_basic/food': 10
      }
    } as any, // Cast as any because we don't need all properties of ResolvedMonthlyDbItem
    {
      periodKey: '2026-11',
      month: 11,
      year: 2026,
      budgetAmounts: {
        housing_basic: 30,
      },
      // Missing actualExpenseByGroup to test fallback
      actualExpenseCategories: {
        'housing_basic/rent': 30,
        'custom_group/something': 10
      }
    } as any
  ];

  const mockLifeEvents: LifeEvent[] = [
    {
      id: 'e1',
      type: 'other',
      name: 'One time expense',
      month: 10,
      year: 2026,
      amount: -5,
      source: 'housing_basic/savings',
      affectsNetWorth: true
    },
    {
      id: 'e2',
      type: 'other',
      name: 'Recurring expense',
      month: 9,
      year: 2026, // Starts 10/2026
      amount: 0,
      source: 'saving',
      spendingCategory: 'family_experience/event',
      recurringMonthlyImpact: -2,
      recurringDurationMonths: 3, // 10, 11, 12
      affectsNetWorth: true
    }
  ];

  it('should build groups from resolvedMonthlyDb and standard groups', () => {
    const result = analyzeExpense(mockDb, [], '2026-11');
    expect(result.summaryByGroup).toHaveProperty('all');
    expect(result.summaryByGroup).toHaveProperty('housing_basic');
    expect(result.summaryByGroup).toHaveProperty('custom_group');
    // Standard groups should be present even if no data
    expect(result.summaryByGroup).toHaveProperty('safety_reserve');
  });

  it('should slice windowDb up to targetPeriod', () => {
    const result = analyzeExpense(mockDb, [], '2026-10');
    // Only month 10 should be processed
    expect(result.monthlySeries['housing_basic'].length).toBe(1);
    
    const result2 = analyzeExpense(mockDb, [], '2026-11');
    expect(result2.monthlySeries['housing_basic'].length).toBe(2);
  });

  it('should default to first month if target period not found', () => {
    const result = analyzeExpense(mockDb, [], '2099-01');
    expect(result.monthlySeries['housing_basic'].length).toBe(1); // falls back to index 0
  });

  it('should use current real-world month or first month if no targetPeriod provided', () => {
    // Should fallback to first month since real-world month is not in mockDb
    const result = analyzeExpense(mockDb, []);
    expect(result.monthlySeries['housing_basic'].length).toBeGreaterThanOrEqual(1);
  });

  it('should calculate budget and actuals from actualExpenseByGroup correctly', () => {
    const result = analyzeExpense(mockDb, [], '2026-10');
    const housing = result.summaryByGroup['housing_basic'];
    
    expect(housing.totalBudget).toBe(30);
    expect(housing.totalActual).toBe(25);
    expect(housing.totalRegularActual).toBe(25);

    // 'all' budget depends on dynamicExpenseGroupIds, default is 'housing_basic', 'family_experience', 'health_growth', 'children', 'parents'
    expect(result.summaryByGroup['all'].totalBudget).toBe(30); // only housing_basic matches default
    expect(result.summaryByGroup['all'].totalActual).toBe(25); 
  });

  it('should fallback to actualExpenseCategories if actualExpenseByGroup is absent', () => {
    // 2026-11 is at index 1
    const result = analyzeExpense(mockDb, [], '2026-11');
    // total for housing_basic over 2 months: 25 + 30 = 55
    expect(result.summaryByGroup['housing_basic'].totalActual).toBe(55);
  });

  it('should handle LifeEvents correctly', () => {
    // One time expense -5 to housing_basic in 10/2026
    // Recurring expense -2 to family_experience in 10/2026, 11/2026
    const result = analyzeExpense(mockDb, mockLifeEvents, '2026-11');
    
    // housing_basic: Month 1 (25 + 5 from LE) = 30. Month 2 (30). Total = 60
    expect(result.summaryByGroup['housing_basic'].totalActual).toBe(60);
    expect(result.summaryByGroup['housing_basic'].totalRegularActual).toBe(55);
    
    // family_experience: Month 1 (2 from LE). Month 2 (2 from LE). Total = 4
    expect(result.summaryByGroup['family_experience'].totalActual).toBe(4);
    expect(result.summaryByGroup['family_experience'].totalRegularActual).toBe(0);

    // monthlySeries for housing_basic
    expect(result.monthlySeries['housing_basic'][0].flexibleActual).toBe(5);
    expect(result.monthlySeries['housing_basic'][1].flexibleActual).toBe(0);
  });

  it('should calculate summaryByCategory', () => {
    const result = analyzeExpense(mockDb, [], '2026-10');
    expect(result.summaryByCategory['housing_basic/rent']).toBeDefined();
    expect(result.summaryByCategory['housing_basic/rent'].totalBudget).toBe(20);
    expect(result.summaryByCategory['housing_basic/rent'].totalActual).toBe(15);
  });

  it('should respect dynamicExpenseGroupIds for "all" calculation', () => {
    const result = analyzeExpense(mockDb, [], '2026-10', ['housing_basic', 'custom_group']);
    // custom_group budget = 10, housing = 30 -> 40
    expect(result.summaryByGroup['all'].totalBudget).toBe(40);
    // actuals: housing = 25, custom = 5 -> 30
    expect(result.summaryByGroup['all'].totalActual).toBe(30);
  });
  
  it('should handle LifeEvent recurring expense wrapping around new year', () => {
     const leNewYear: LifeEvent[] = [{
      id: 'e3', type: 'other', name: 'YearWrap', month: 12, year: 2026, amount: 0,
      source: 'saving', spendingCategory: 'family_experience', recurringMonthlyImpact: -10, recurringDurationMonths: 2, affectsNetWorth: true
     }];
     
     const dbNewYear: ResolvedMonthlyDbItem[] = [
       { periodKey: '2027-01', month: 1, year: 2027 } as any
     ];
     
     const result = analyzeExpense(dbNewYear, leNewYear, '2027-01');
     expect(result.summaryByGroup['family_experience'].totalActual).toBe(10);
  });
});
