import { describe, it, expect } from 'vitest';
import { calculateChildCost } from './childEngine';
import type { ChildEngineInput } from './childEngine';

describe('childEngine', () => {
  const baseInput: ChildEngineInput = {
    period: { year: 2030, month: 1, index: 0, yearOffset: 0, isFirstMonthOfYear: true, key: '2030-01' },
    childBirthMonth: 1,
    childBirthYear: 2026,
    lifestyle: 'comfortable',
    budgetCapMonthly: 35,
    educationInflationAnnual: 6,
    healthInflationAnnual: 6,
    generalInflationAnnual: 4,
  };

  it('should return inactive if birth date is missing', () => {
    const result = calculateChildCost({
      ...baseInput,
      childBirthMonth: undefined,
      childBirthYear: undefined
    });
    expect(result.isActive).toBe(false);
  });

  it('should return inactive if period is before birth', () => {
    const result = calculateChildCost({
      ...baseInput,
      period: { year: 2025, month: 1, index: 0, yearOffset: 0, isFirstMonthOfYear: true, key: '2025-01' }
    });
    expect(result.isActive).toBe(false);
  });

  it('should return 0 cost if child is >= 25', () => {
    const result = calculateChildCost({
      ...baseInput,
      period: { year: 2055, month: 1, index: 0, yearOffset: 0, isFirstMonthOfYear: true, key: '2055-01' } // age 29
    });
    expect(result.isActive).toBe(true);
    expect(result.totalMonthly).toBe(0);
    expect(result.notes.some(n => n.includes('trưởng thành'))).toBe(true);
  });

  it('should calculate infant cost without inflation', () => {
    const result = calculateChildCost({
      ...baseInput,
      period: { year: 2026, month: 6, index: 0, yearOffset: 0, isFirstMonthOfYear: true, key: '2026-06' } // 5 months old -> age 0
    });
    expect(result.childAge).toBe(0);
    // Base cost: food(4) + health(2) + clothes(3) + travel(1) = 10
    expect(result.food).toBe(4);
    expect(result.healthcare).toBe(2);
    expect(result.clothesSupplies).toBe(3);
    expect(result.travelExperience).toBe(1);
    expect(result.totalMonthly).toBe(10);
  });

  it('should apply compounding inflation for older child', () => {
    const result = calculateChildCost({
      ...baseInput,
      period: { year: 2036, month: 1, index: 0, yearOffset: 0, isFirstMonthOfYear: true, key: '2036-01' } // age 10 -> primary school
    });
    expect(result.childAge).toBe(10);
    
    // primary: food(5), health(1.5), clothes(2), travel(2), edu(7), eng(2.5)
    // gen(4%), health(6%), edu(6%)
    
    const food = 5 * Math.pow(1.04, 10);
    const edu = 7 * Math.pow(1.06, 10);
    
    expect(result.food).toBeCloseTo(food, 5);
    expect(result.education).toBeCloseTo(edu, 5);
  });

  it('should apply budget cap', () => {
    const result = calculateChildCost({
      ...baseInput,
      period: { year: 2046, month: 1, index: 0, yearOffset: 0, isFirstMonthOfYear: true, key: '2046-01' }, // age 20 -> university
      budgetCapMonthly: 15 // Very low cap
    });
    
    expect(result.childAge).toBe(20);
    expect(result.totalMonthly).toBe(15);
    expect(result.notes.some(n => n.includes('Đã giới hạn'))).toBe(true);
  });

  it('should calculate age groups correctly', () => {
    const testAge = (age: number) => calculateChildCost({
      ...baseInput,
      period: { year: 2026 + age, month: 1, index: 0, yearOffset: 0, isFirstMonthOfYear: true, key: 'test' },
      educationInflationAnnual: 0, healthInflationAnnual: 0, generalInflationAnnual: 0
    });

    // <= 2
    expect(testAge(2).food).toBe(4);
    // <= 5
    expect(testAge(5).education).toBe(5);
    // <= 11
    expect(testAge(11).education).toBe(7);
    // <= 17
    expect(testAge(17).education).toBe(9);
    // <= 21
    expect(testAge(21).education).toBe(18);
    // 22
    expect(testAge(22).postGradSupport).toBe(10);
    // 23
    expect(testAge(23).postGradSupport).toBe(7);
    // 24
    expect(testAge(24).postGradSupport).toBe(5);
  });
});
