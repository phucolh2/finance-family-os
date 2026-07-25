export const BUDGET_PILLARS = {
  expense: {
    id: 'expense',
    label: 'Chi phí',
    colorHex: '#f87171',
    colorClass: 'text-red-500',
    colorClassDark: 'text-red-600',
    bgClass: 'bg-red-500/10',
    borderClass: 'border-red-500/20',
    targetScreen: 'life_stages'
  },
  investment: {
    id: 'investment',
    label: 'Đầu tư',
    colorHex: '#3b82f6',
    colorClass: 'text-blue-500',
    colorClassDark: 'text-blue-600',
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/20',
    targetScreen: 'portfolio'
  },
  savings: {
    id: 'savings',
    label: 'Tiết kiệm',
    colorHex: '#10b981',
    colorClass: 'text-emerald-500',
    colorClassDark: 'text-emerald-600',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/20',
    targetScreen: 'savings'
  },
  debt_reserve: {
    id: 'debt_reserve',
    label: 'Dự phòng',
    colorHex: '#f59e0b',
    colorClass: 'text-amber-500',
    colorClassDark: 'text-amber-600',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/20',
    targetScreen: 'reserves'
  }
} as const;

export type PillarId = keyof typeof BUDGET_PILLARS;
