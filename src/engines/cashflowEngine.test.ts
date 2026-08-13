import { describe, it, expect } from 'vitest';
import { calculateCashflow } from './cashflowEngine';
import type { TimelinePeriod, LifeEvent } from '../types/finance';
import type { MonthlyBudgetOutput } from '../types/budget';

describe('cashflowEngine', () => {
  const mockPeriod: TimelinePeriod = {
    index: 0,
    month: 5,
    year: 2026,
    yearOffset: 0,
    isFirstMonthOfYear: false
  };

  const mockBudget: MonthlyBudgetOutput = {
    month: 5,
    year: 2026,
    incomeMonthly: 100,
    totalAllocatedMonthly: 100,
    totalExpenseMonthly: 40,
    investmentMonthly: 30,
    savingMonthly: 20,
    debtReserveMonthly: 10,
    freeCashflowMonthly: 0,
    deficitMonthly: 0,
    warnings: [],
    categories: [
      {
        categoryId: 'child-1',
        categoryName: 'Child',
        group: 'children',
        ratioPercent: 10,
        amountMonthly: 10,
        amountYearly: 120,
        ruleType: 'percent',
        isActive: true,
        classification: 'expense'
      }
    ]
  };

  it('should calculate basic cashflow without events', () => {
    const result = calculateCashflow({
      period: mockPeriod,
      budget: mockBudget,
      lifeEvents: []
    });

    expect(result.incomeMonthly).toBe(100);
    expect(result.expensesMonthly).toBe(40);
    expect(result.childCostMonthly).toBe(10);
    expect(result.netCashflowMonthly).toBe(0);
    expect(result.unspentExpense).toBe(0);
    expect(result.unallocatedIncome).toBe(0);
  });

  it('should calculate cashflow with one-time event', () => {
    const events: LifeEvent[] = [
      { id: '1', name: 'Bonus', type: 'other', month: 5, year: 2026, amount: 50, affectsNetWorth: true, source: 'saving' },
      { id: '2', name: 'Wedding', type: 'other', month: 6, year: 2026, amount: -20, affectsNetWorth: true, source: 'saving' } // future
    ];

    const result = calculateCashflow({
      period: mockPeriod,
      budget: mockBudget,
      lifeEvents: events
    });

    expect(result.oneTimeEventImpact).toBe(50);
    expect(result.netCashflowMonthly).toBe(50);
  });

  it('should calculate cashflow with recurring events', () => {
    const events: LifeEvent[] = [
      { 
        id: '1', name: 'Car Loan', type: 'other', month: 4, year: 2026, amount: 0, 
        recurringMonthlyImpact: -15, recurringDurationMonths: 0, affectsNetWorth: true, source: 'saving' 
      }, // Active from 5/2026
      { 
        id: '2', name: 'Subscription', type: 'other', month: 12, year: 2025, amount: 0, 
        recurringMonthlyImpact: -5, recurringDurationMonths: 6, affectsNetWorth: true, source: 'saving' 
      }, // Active from 1/2026 to 6/2026
      { 
        id: '3', name: 'Future Loan', type: 'other', month: 6, year: 2026, amount: 0, 
        recurringMonthlyImpact: -10, recurringDurationMonths: 12, affectsNetWorth: true, source: 'saving' 
      } // Active from 7/2026
    ];

    const result = calculateCashflow({
      period: mockPeriod, // 5/2026
      budget: mockBudget,
      lifeEvents: events
    });

    // event 1 (-15) + event 2 (-5) = -20
    expect(result.lifeEventImpactMonthly).toBe(-20);
    expect(result.netCashflowMonthly).toBe(-20);
    expect(result.warnings.length).toBeGreaterThan(0); // Negative net cashflow
  });

  it('should handle recurring duration exact boundary', () => {
    const events: LifeEvent[] = [
      { 
        id: '1', name: 'Subscription', type: 'other', month: 12, year: 2025, amount: 0, 
        recurringMonthlyImpact: -5, recurringDurationMonths: 5, affectsNetWorth: true, source: 'saving' 
      } // Active from 1/2026. Duration 5. Month 1,2,3,4,5. 
        // End boundary = 1+5 = 6/2026. 
        // 5/2026 is IN. 6/2026 is OUT.
    ];

    const resultIn = calculateCashflow({
      period: { ...mockPeriod, month: 5, year: 2026 },
      budget: mockBudget,
      lifeEvents: events
    });
    expect(resultIn.lifeEventImpactMonthly).toBe(-5);

    const resultOut = calculateCashflow({
      period: { ...mockPeriod, month: 6, year: 2026 },
      budget: mockBudget,
      lifeEvents: events
    });
    expect(resultOut.lifeEventImpactMonthly).toBe(0);
  });

  it('should use actualExpenseMonthly if provided', () => {
    const result = calculateCashflow({
      period: mockPeriod,
      budget: mockBudget,
      lifeEvents: [],
      actualExpenseMonthly: 25 // less than budget (40)
    });

    expect(result.expensesMonthly).toBe(25);
    expect(result.unspentExpense).toBe(15);
    // freeCashflow = 100 - (25 + 30 + 20 + 10) = 15
    expect(result.netCashflowMonthly).toBe(15);
  });
});
