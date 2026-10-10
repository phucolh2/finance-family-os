import { describe, it, expect } from 'vitest';
import { isWithinObservationPeriod, getPeriodGuardMessage } from './periodGuard';

describe('periodGuard', () => {
  describe('isWithinObservationPeriod', () => {
    it('should return true if no observation period is selected', () => {
      expect(isWithinObservationPeriod(10, 2026, undefined)).toBe(true);
      expect(isWithinObservationPeriod(10, 2026, '')).toBe(true);
    });

    it('should return true if target is equal to observation period', () => {
      expect(isWithinObservationPeriod(10, 2026, '2026-10')).toBe(true);
    });

    it('should return true if target is after observation period', () => {
      expect(isWithinObservationPeriod(11, 2026, '2026-10')).toBe(true);
      expect(isWithinObservationPeriod(1, 2027, '2026-10')).toBe(true);
    });

    it('should return false if target is before observation period', () => {
      expect(isWithinObservationPeriod(9, 2026, '2026-10')).toBe(false);
      expect(isWithinObservationPeriod(12, 2025, '2026-01')).toBe(false);
    });
  });

  describe('getPeriodGuardMessage', () => {
    it('should return empty string if no period selected', () => {
      expect(getPeriodGuardMessage(undefined)).toBe('');
      expect(getPeriodGuardMessage('')).toBe('');
    });

    it('should format message correctly with given period key', () => {
      expect(getPeriodGuardMessage('2026-10')).toBe(
        'Không thể thao tác trước tháng quan sát (T10/2026). Vui lòng chọn lại tháng quan sát phù hợp để điều chỉnh dữ liệu quá khứ.'
      );
      expect(getPeriodGuardMessage('2027-01')).toBe(
        'Không thể thao tác trước tháng quan sát (T1/2027). Vui lòng chọn lại tháng quan sát phù hợp để điều chỉnh dữ liệu quá khứ.'
      );
    });
  });
});
