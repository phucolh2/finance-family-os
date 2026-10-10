import { describe, it, expect } from 'vitest';
import {
  roundRatio,
  isValidBase,
  percentToAmount,
  amountToPercent,
  roundAmount,
} from './budgetAmount';

describe('budgetAmount', () => {
  it('percentToAmount matches budgetEngine formula (base * pct / 100)', () => {
    expect(percentToAmount(2.2, 80)).toBeCloseTo(1.76, 5);
    expect(percentToAmount(100, 80)).toBe(80);
    expect(percentToAmount(0, 80)).toBe(0);
  });

  it('amountToPercent converts and keeps 2 decimals', () => {
    expect(amountToPercent(1.5, 80)).toBe(1.88); // 1.875 -> 1.88
    expect(amountToPercent(8, 80)).toBe(10);
    expect(amountToPercent(80, 80)).toBe(100);
  });

  it('round-trip amount -> percent -> amount error is below 0.01 trieu at base 80', () => {
    for (const amount of [0.5, 1.5, 1.76, 3.33, 12.34, 64, 79.99]) {
      const back = percentToAmount(amountToPercent(amount, 80), 80);
      expect(Math.abs(back - amount)).toBeLessThan(0.01);
    }
  });

  it('clamps to 0..100 and never returns NaN/Infinity for invalid input', () => {
    expect(amountToPercent(200, 80)).toBe(100);
    expect(amountToPercent(-5, 80)).toBe(0);
    expect(amountToPercent(10, 0)).toBe(0);
    expect(amountToPercent(10, -3)).toBe(0);
    expect(amountToPercent(10, NaN)).toBe(0);
    expect(amountToPercent(NaN, 80)).toBe(0);
    expect(percentToAmount(10, 0)).toBe(0);
    expect(percentToAmount(NaN, 80)).toBe(0);
  });

  it('isValidBase only accepts positive finite numbers', () => {
    expect(isValidBase(80)).toBe(true);
    expect(isValidBase(0)).toBe(false);
    expect(isValidBase(-1)).toBe(false);
    expect(isValidBase(undefined)).toBe(false);
    expect(isValidBase(null)).toBe(false);
    expect(isValidBase(Infinity)).toBe(false);
  });

  it('rounding helpers keep 2 decimals and are safe on bad input', () => {
    expect(roundRatio(1.8749)).toBe(1.87);
    expect(roundRatio(NaN)).toBe(0);
    expect(roundAmount(1.756)).toBe(1.76);
    expect(roundAmount(Infinity)).toBe(0);
  });
});
