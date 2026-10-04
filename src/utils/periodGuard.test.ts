import { describe, it, expect, beforeEach } from 'vitest';
import { isWithinObservationPeriod, getPeriodGuardMessage } from './periodGuard';
import { setMonthLocks } from './monthLockStore';

describe('periodGuard', () => {
  beforeEach(() => {
    setMonthLocks({});
  });

  describe('isWithinObservationPeriod', () => {
    it('should return true if no observation period is selected and not locked', () => {
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

    it('should return false if target month is locked', () => {
      setMonthLocks({
        '2026-10': { by: 'husband', at: '2026-10-01T00:00:00Z' }
      });
      expect(isWithinObservationPeriod(10, 2026, '2026-10')).toBe(false);
      // Unlocked month is still allowed
      expect(isWithinObservationPeriod(11, 2026, '2026-10')).toBe(true);
    });
  });

  describe('getPeriodGuardMessage', () => {
    it('should return lock message if no period selected', () => {
      expect(getPeriodGuardMessage(undefined)).toBe(
        'Tháng này đã chốt sổ. Bấm "Mở khóa" ở thanh Tháng quan sát để điều chỉnh.'
      );
      expect(getPeriodGuardMessage('')).toBe(
        'Tháng này đã chốt sổ. Bấm "Mở khóa" ở thanh Tháng quan sát để điều chỉnh.'
      );
    });

    it('should format normal message correctly with given period key when not locked', () => {
      expect(getPeriodGuardMessage('2026-10')).toBe(
        'Không thể thao tác trước tháng quan sát (T10/2026). Vui lòng chọn lại tháng quan sát phù hợp để điều chỉnh dữ liệu quá khứ.'
      );
      expect(getPeriodGuardMessage('2027-01')).toBe(
        'Không thể thao tác trước tháng quan sát (T1/2027). Vui lòng chọn lại tháng quan sát phù hợp để điều chỉnh dữ liệu quá khứ.'
      );
    });

    it('should format locked message correctly when period key is locked', () => {
      setMonthLocks({
        '2026-10': { by: 'husband', at: '2026-10-01T00:00:00Z' }
      });
      expect(getPeriodGuardMessage('2026-10')).toBe(
        'Tháng 10/2026 đã chốt sổ. Bấm "Mở khóa" ở thanh Tháng quan sát để điều chỉnh.'
      );
    });
  });
});
