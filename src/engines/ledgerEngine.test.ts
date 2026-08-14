import { describe, it, expect } from 'vitest';
import { buildEventLedger } from './ledgerEngine';
import type { AppState } from '../types/finance';

describe('ledgerEngine', () => {
  const mockState: Partial<AppState> = {
    incomeSchedule: [
      { id: 'inc1', effectiveMonth: 1, effectiveYear: 2026, incomeMonthly: 100, incomeType: 'fulltime_salary', status: 'active', note: '' },
      { id: 'inc2', effectiveMonth: 5, effectiveYear: 2026, incomeMonthly: 50, incomeType: 'freelance', status: 'active', note: 'Design' }
    ],
    budgetSchedule: [
      { id: 'bud1', effectiveMonth: 2, effectiveYear: 2026, status: 'active', rootGroups: [], ratios: [], note: 'New budget' }
    ],
    investmentDeals: [
      { id: 'inv1', name: 'Stock', startMonth: 3, startYear: 2026, capital: 500, status: 'active' } as any
    ],
    savingsDeposits: [
      { id: 'dep1', name: 'Saving 1', startMonth: 4, startYear: 2026, termMonths: 6, principal: 200, interestRateAnnual: 6, status: 'active', pool: 'idle' } as any,
      { id: 'dep2', name: 'Saving 2', startMonth: 8, startYear: 2026, termMonths: 12, principal: 100, interestRateAnnual: 5, status: 'matured', pool: 'sinking' } as any
    ],
    sinkingFunds: [
      { id: 'sf1', name: 'Fund 1', startMonth: 6, startYear: 2026, targetAmount: 300, targetAssetType: 'gold', monthlyContribution: 5, status: 'active' } as any,
      { id: 'sf2', name: 'Fund 2', startMonth: 7, startYear: 2026, disbursedMonth: 12, disbursedYear: 2026, targetAmount: 400, targetAssetType: 'other', monthlyContribution: 10, status: 'disbursed' } as any
    ],
    lifeEvents: [
      { id: 'evt1', name: 'Event 1', month: 9, year: 2026, amount: 50, note: 'Test' } as any
    ]
  };

  it('should build ledger events from AppState correctly', () => {
    const events = buildEventLedger(mockState as AppState);
    
    expect(events.length).toBe(9); // 2 income + 1 budget + 1 inv + 2 dep + 2 sf + 1 evt
    
    // Check sorting (by year then month)
    const months = events.map(e => e.startMonth);
    expect(months).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    // Check specific event mapping
    const inc1 = events.find(e => e.id === 'inc_inc1');
    expect(inc1?.category).toBe('income');
    expect(inc1?.name).toContain('Lương fulltime');
    
    const inc2 = events.find(e => e.id === 'inc_inc2');
    // wait, getIncomeTypeLabel('freelance') returns 'Lương fulltime' as default in ledgerEngine.
    // wait, getIncomeTypeLabel('freelance') returns 'Lương fulltime' as default in ledgerEngine.
    expect(inc2?.name).toContain('Lương fulltime'); // Since freelance is not in switch case
    
    const dep1 = events.find(e => e.id === 'dep_dep1');
    expect(dep1?.endMonth).toBe(10); // (4 - 1 + 6) % 12 + 1 = 10
    expect(dep1?.endYear).toBe(2026);
    expect(dep1?.status).toBe('active');
    
    const dep2 = events.find(e => e.id === 'dep_dep2');
    expect(dep2?.status).toBe('settled'); // matured -> settled

    const sf1 = events.find(e => e.id === 'sf_sf1');
    expect(sf1?.status).toBe('active');
    
    const sf2 = events.find(e => e.id === 'sf_sf2');
    expect(sf2?.status).toBe('settled'); // disbursed -> settled
  });

  it('should handle empty state', () => {
    const events = buildEventLedger({} as AppState);
    expect(events.length).toBe(0);
  });
  
  it('should test getIncomeTypeLabel all branches', () => {
    const state: Partial<AppState> = {
      incomeSchedule: [
        { id: '1', effectiveMonth: 1, effectiveYear: 2026, incomeMonthly: 0, incomeType: 'parttime_salary', status: 'active', note: '' },
        { id: '2', effectiveMonth: 2, effectiveYear: 2026, incomeMonthly: 0, incomeType: 'self_employed', status: 'active', note: '' },
        { id: '3', effectiveMonth: 3, effectiveYear: 2026, incomeMonthly: 0, incomeType: 'passive_income', status: 'active', note: '' },
        { id: '4', effectiveMonth: 4, effectiveYear: 2026, incomeMonthly: 0, incomeType: 'irregular_income', status: 'active', note: '' }
      ]
    };
    
    const events = buildEventLedger(state as AppState);
    expect(events.find(e => e.id === 'inc_1')?.name).toContain('Lương parttime');
    expect(events.find(e => e.id === 'inc_2')?.name).toContain('Tự kinh doanh');
    expect(events.find(e => e.id === 'inc_3')?.name).toContain('Thu nhập thụ động');
    expect(events.find(e => e.id === 'inc_4')?.name).toContain('Thu nhập không cố định');
  });
});
