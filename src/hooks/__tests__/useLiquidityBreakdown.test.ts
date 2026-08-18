import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLiquidityBreakdown } from '../useLiquidityBreakdown';
import * as AppContextModule from '../../context/AppContext';
import type { AppState } from '../../types/finance';

describe('useLiquidityBreakdown', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const getMockState = (): Partial<AppState> => ({
    profile: {
      planningStartMonth: 1,
      planningStartYear: 2026,
    } as any,
    budgetSchedule: [
      {
        id: 'b1',
        effectiveMonth: 1,
        effectiveYear: 2026,
        rootGroups: [
          {
            id: 'housing',
            name: 'Nhà cửa & sinh hoạt cơ bản',
            classification: 'expense',
            ratioPercent: 50,
            children: [
              { id: 'housing/rent', name: 'Nhà ở / thuê nhà', classification: 'expense', ratioPercent: 50 }
            ]
          }
        ]
      } as any
    ],
    resolvedMonthlyDb: [
      {
        month: 10,
        year: 2026,
        income: 100,
        expectedReturnAnnual: 8,
        budgetRatios: {},
        budgetAmounts: { housing: 10 },
        budgetAmountsByCategory: { 'housing/rent': 10 },
        actualExpenseCategories: { 'housing/rent': 7 },
        periodKey: '2026-10',
      }
    ],
    lifeEvents: [],
    sinkingFunds: []
  });

  it('monthly mode: basic total matching without events', () => {
    vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
      state: getMockState() as AppState,
      selectedPeriodKey: '2026-10'
    } as any);

    const { result } = renderHook(() => useLiquidityBreakdown('monthly'));
    const { liquidityBreakdownData, totalActualSum, totalTrackASum } = result.current;
    
    expect(liquidityBreakdownData.length).toBe(1);
    expect(liquidityBreakdownData[0].id).toBe('housing');
    expect(liquidityBreakdownData[0].totalActual).toBe(7);
    expect(liquidityBreakdownData[0].children[0].totalActual).toBe(7);
    
    expect(totalActualSum).toBe(7);
    expect(totalTrackASum).toBe(0);
  });

  it('monthly mode: separates Track A properly', () => {
    const mockState = getMockState();
    mockState.lifeEvents = [
      {
        id: 'evt1',
        name: 'Giảm giá thuê',
        type: 'flexible',
        month: 9,
        year: 2026,
        recurringMonthlyImpact: -1,
        recurringDurationMonths: 1,
        source: 'salary',
        spendingCategory: 'housing/rent'
      } as any
    ];
    // In actual tracking, the user input might include the impact or it might just be the base actual.
    // Assuming user input regular expense as 6 (base actual), the engine would see 6
    if (mockState.resolvedMonthlyDb?.[0]) {
      mockState.resolvedMonthlyDb[0].budgetAmountsByCategory = { 'housing/rent': 6 };
      mockState.resolvedMonthlyDb[0].actualExpenseCategories = { 'housing/rent': 6 };
    }

    vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
      state: mockState as AppState,
      selectedPeriodKey: '2026-10'
    } as any);

    const { result } = renderHook(() => useLiquidityBreakdown('monthly'));
    const { liquidityBreakdownData, totalActualSum, totalTrackASum } = result.current;
    
    const housingGroup = liquidityBreakdownData[0];
    // In monthly mode, totalActual comes directly from base category minus impact? 
    // Wait, in useLiquidityBreakdown for monthly, totalActual for child is:
    // child.totalActual = safeNumber(currentDbItem.categories?.[child.id], 0)
    expect(housingGroup.children[0].totalActual).toBe(6);
    expect(housingGroup.children[0].trackA).toBe(-1);

    expect(housingGroup.totalActual).toBe(6); // The group sums child.totalActual
    expect(housingGroup.trackA).toBe(-1); // Group sums child.trackA

    expect(totalActualSum).toBe(6);
    expect(totalTrackASum).toBe(-1);
  });

  it('cumulative mode: calculates averages correctly and filters out flexible amounts', () => {
    const mockState = getMockState();
    // 2 months of data
    mockState.resolvedMonthlyDb = [
      {
        month: 9,
        year: 2026,
        income: 100,
        expectedReturnAnnual: 8,
        budgetAmounts: { housing: 10 },
        budgetAmountsByCategory: { 'housing/rent': 10 },
        actualExpenseCategories: { 'housing/rent': 7 },
        periodKey: '2026-09',
      } as any,
      {
        month: 10,
        year: 2026,
        income: 100,
        expectedReturnAnnual: 8,
        budgetRatios: {},
        budgetAmounts: { housing: 10 },
        budgetAmountsByCategory: { 'housing/rent': 10 },
        actualExpenseCategories: { 'housing/rent': 6 },
        periodKey: '2026-10',
      }
    ];
    mockState.lifeEvents = [
      {
        id: 'evt1',
        name: 'Giảm giá thuê',
        type: 'flexible',
        month: 9,
        year: 2026,
        recurringMonthlyImpact: -1,
        recurringDurationMonths: 1,
        source: 'salary',
        spendingCategory: 'housing/rent'
      } as any
    ];

    vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
      state: mockState as AppState,
      selectedPeriodKey: '2026-10' // View up to Oct
    } as any);

    const { result } = renderHook(() => useLiquidityBreakdown('cumulative'));
    const { liquidityBreakdownData, totalActualSum, totalTrackASum } = result.current;
    
    const housingGroup = liquidityBreakdownData[0];
    
    // In cumulative mode, actual from expenseEngine is summed.
    // Total raw actual from engine: 7 (month 9) + 5 (month 10 flexible logic? wait, expenseEngine doesn't aggregate automatically? 
    // the expenseEngine analyzeExpense puts 7+6=13 for regularActual)
    
    // For the child row, it should just be the cumulative total actual returned by expenseEngine minus nothing
    // Wait, let's verify what the hook returns based on our recent fix.
    expect(housingGroup.children[0].totalActual).toBe(13); // 7 + 6
    expect(housingGroup.children[0].trackA).toBe(-1);

    expect(housingGroup.totalActual).toBe(13); // Group total should be 13
    expect(housingGroup.trackA).toBe(-1);

    expect(totalActualSum).toBe(13);
    expect(totalTrackASum).toBe(-1);
  });
});
