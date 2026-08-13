import { describe, it, expect } from 'vitest';
import { generateTimeline } from './timelineEngine';
import type { TimelineInput } from './timelineEngine';

describe('timelineEngine', () => {
  const baseInput: TimelineInput = {
    planningStartMonth: 1,
    planningStartYear: 2026,
    planningEndMonth: 12,
    planningEndYear: 2026,
    husbandAgeAtStart: 30,
    wifeAgeAtStart: 28
  };

  it('should generate periods correctly for a valid timeline', () => {
    const result = generateTimeline(baseInput);

    expect(result.warnings).toHaveLength(0);
    expect(result.periods).toHaveLength(12); // From month 1 to month 12 inclusive

    const first = result.periods[0];
    expect(first.index).toBe(0);
    expect(first.month).toBe(1);
    expect(first.year).toBe(2026);
    expect(first.husbandAge).toBe(30);
    expect(first.wifeAge).toBe(28);

    const last = result.periods[11];
    expect(last.index).toBe(11);
    expect(last.month).toBe(12);
    expect(last.year).toBe(2026);
  });

  it('should generate periods bridging multiple years', () => {
    const input: TimelineInput = {
      ...baseInput,
      planningEndMonth: 2,
      planningEndYear: 2028 // 2026(12) + 2027(12) + 2028(2) = 26 months
    };

    const result = generateTimeline(input);
    expect(result.periods).toHaveLength(26);

    const last = result.periods[25];
    expect(last.month).toBe(2);
    expect(last.year).toBe(2028);
    expect(last.husbandAge).toBe(32); // 30 + 2 elapsed years (25 months -> Math.floor(25/12) = 2)
  });

  it('should output warning and return empty array if end is before start', () => {
    const input: TimelineInput = {
      ...baseInput,
      planningStartYear: 2030
    };

    const result = generateTimeline(input);
    expect(result.periods).toHaveLength(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should output warning for invalid month', () => {
    const input: TimelineInput = {
      ...baseInput,
      planningStartMonth: 13,
      planningEndMonth: 0
    };

    const result = generateTimeline(input);
    expect(result.warnings.some(w => w.includes('Tháng bắt đầu không hợp lệ'))).toBe(true);
    expect(result.warnings.some(w => w.includes('Tháng kết thúc không hợp lệ'))).toBe(true);
  });

  it('should cap timeline at 1200 months and output warning', () => {
    const input: TimelineInput = {
      ...baseInput,
      planningEndYear: 2150 // > 100 years
    };

    const result = generateTimeline(input);
    expect(result.periods).toHaveLength(1201); // 0 to 1200 inclusive
    expect(result.warnings.some(w => w.includes('100 năm'))).toBe(true);
  });
});
