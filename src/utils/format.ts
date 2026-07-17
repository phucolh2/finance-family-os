export type MoneyFormatMode =
  | 'auto'
  | 'million'
  | 'billion'
  | 'trillion'
  | 'compact'
  | 'raw';

export interface MoneyFormatOptions {
  mode?: MoneyFormatMode;
  decimals?: number;
  showUnit?: boolean;
  fallback?: string;
  signed?: boolean;
  shortUnit?: boolean;
  isTooltip?: boolean;
}

/**
 * Parses and returns a safe finite number.
 * Gracefully handles null, undefined, NaN, Infinity, strings, and objects.
 */
export function safeNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }
  
  if (typeof value === 'string') {
    const clean = value.trim();
    if (clean === '') return fallback;
    const parsed = parseFloat(clean);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  
  return fallback;
}

/**
 * Core money formatter for VND Million values.
 * 80 -> 80 triệu
 * 1000 -> 1 tỷ
 * 1200000 -> 1.2 nghìn tỷ (hoặc 1.2k tỷ)
 */
export function formatMoneyVNDMillion(
  value: unknown,
  options?: MoneyFormatOptions
): string {
  const fallback = options?.fallback ?? '—';
  
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) return fallback;

  const num = safeNumber(value, NaN);
  if (isNaN(num)) return fallback;

  const absNum = Math.abs(num);
  let mode = options?.mode ?? 'auto';
  let shortUnit = options?.shortUnit ?? false;
  const decimals = options?.decimals ?? 2;
  const showUnit = options?.showUnit ?? true;
  const isTooltip = options?.isTooltip ?? false;

  let scaledValue = num;
  let unit = '';

  // Determine scale and units
  if (mode === 'compact') {
    mode = 'auto';
    shortUnit = true;
  }

  if (mode === 'auto') {
    if (absNum < 1000) {
      scaledValue = num;
      unit = shortUnit ? 'tr' : (isTooltip ? 'triệu đồng' : 'triệu');
    } else if (absNum < 1000000) {
      scaledValue = num / 1000;
      unit = shortUnit ? 'tỷ' : (isTooltip ? 'tỷ đồng' : 'tỷ');
    } else {
      scaledValue = num / 1000000;
      unit = shortUnit ? 'k tỷ' : (isTooltip ? 'nghìn tỷ đồng' : 'nghìn tỷ');
    }
  } else if (mode === 'million') {
    scaledValue = num;
    unit = shortUnit ? 'tr' : (isTooltip ? 'triệu đồng' : 'triệu');
  } else if (mode === 'billion') {
    scaledValue = num / 1000;
    unit = shortUnit ? 'tỷ' : (isTooltip ? 'tỷ đồng' : 'tỷ');
  } else if (mode === 'trillion') {
    scaledValue = num / 1000000;
    unit = shortUnit ? 'k tỷ' : (isTooltip ? 'nghìn tỷ đồng' : 'nghìn tỷ');
  }

  // Format decimal precision
  let formattedNum = scaledValue.toFixed(decimals);
  
  // Remove unnecessary trailing zeroes e.g. 1.0 -> 1, 1.20 -> 1.2
  if (formattedNum.includes('.')) {
    formattedNum = formattedNum.replace(/\.?0+$/, '');
  }

  // Add thousand separators (commas)
  const parts = formattedNum.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  formattedNum = parts.join('.');

  // Prepend sign if required
  let sign = '';
  if (options?.signed && num > 0) {
    sign = '+';
  }

  if (showUnit && mode !== 'raw') {
    return `${sign}${formattedNum} ${unit}`.trim();
  }

  return `${sign}${formattedNum}`;
}

/**
 * Axis Money Formatter: Short labels to avoid overlaps.
 * 80 -> 80tr
 * 1500 -> 1.5tỷ
 */
export function formatAxisMoneyVNDMillion(value: unknown): string {
  if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) return '—';
  return formatMoneyVNDMillion(value, { mode: 'auto', shortUnit: true, decimals: 1 });
}

/**
 * Tooltip Money Formatter: Explicit long descriptions.
 * 80 -> 80 triệu đồng
 * 1500 -> 1.5 tỷ đồng
 */
export function formatTooltipMoneyVNDMillion(value: unknown): string {
  if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) return '—';
  return formatMoneyVNDMillion(value, { mode: 'auto', isTooltip: true, decimals: 2 });
}

/**
 * Table Cell Money Formatter.
 * 80 -> 80 triệu
 * 1500 -> 1.5 tỷ
 */
export function formatTableMoneyVNDMillion(value: unknown): string {
  return formatMoneyVNDMillion(value, { mode: 'auto', decimals: 2 });
}

/**
 * KPI Dashboard Card Money Formatter.
 * 80 -> 80 triệu
 * 1500 -> 1.5 tỷ
 */
export function formatKpiMoneyVNDMillion(value: unknown): string {
  return formatMoneyVNDMillion(value, { mode: 'auto', decimals: 1 });
}

/**
 * Compatibility alias for legacy formatVND calls.
 */
export function formatVND(value: unknown, compact = false): string {
  return formatMoneyVNDMillion(value, { mode: 'auto', decimals: compact ? 1 : 2 });
}

/**
 * Formats ratio value to a percentage string.
 * 40 -> 40%
 * NaN -> —
 */
export function formatPercent(value: unknown, decimals = 1): string {
  if (value === null || value === undefined) return '—';
  const num = safeNumber(value, NaN);
  if (isNaN(num)) return '—';
  
  let formatted = num.toFixed(decimals);
  if (formatted.includes('.')) {
    formatted = formatted.replace(/\.?0+$/, '');
  }
  return `${formatted}%`;
}
