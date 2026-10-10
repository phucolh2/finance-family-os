export const isPeriodLocked = (lockedUntilPeriod: string | undefined, month: number, year: number) => {
  if (!lockedUntilPeriod) return false;
  const key = `${year}-${String(month).padStart(2, '0')}`;
  return key <= lockedUntilPeriod;
};
