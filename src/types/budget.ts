import type { LifecycleProps } from './ledger';

export type BudgetMainGroupId =
  | 'housing_basic'
  | 'future_investing'
  | 'safety_reserve'
  | 'family_experience'
  | 'health_growth';

export type BudgetGroup = BudgetMainGroupId | 'children' | 'parents';

export type BudgetRuleType = 'percent' | 'fixed' | 'capped' | 'event_based';

export interface BudgetRatio {
  categoryId: string;
  categoryName: string;
  group: BudgetGroup;
  ratioPercent: number; // e.g. 29 for 29%
  ruleType: BudgetRuleType;
  fixedAmountMonthly?: number;
  capMonthly?: number;
  capTotal?: number;
  inflationRateAnnual?: number;
  isActive: boolean;
}

export interface BudgetCategoryOutput {
  categoryId: string;
  categoryName: string;
  group: BudgetGroup;
  ratioPercent: number;
  amountMonthly: number;
  amountYearly: number;
  ruleType: BudgetRuleType;
  isActive: boolean;
}

export interface MonthlyBudgetOutput {
  month: number;
  year: number;
  incomeMonthly: number;
  categories: BudgetCategoryOutput[];
  totalAllocatedMonthly: number;
  totalExpenseMonthly: number;
  investmentMonthly: number;
  savingMonthly: number;
  freeCashflowMonthly: number;
  deficitMonthly: number;
  warnings: string[];
}

export interface BudgetTreeNode {
  id: string;
  parentId: string | null;
  level: 0 | 1 | 2;
  nodeType: 'group' | 'item' | 'subitem';
  groupId: BudgetMainGroupId;

  name: string;
  code?: string;
  note?: string;

  ratioPercent: number;
  isActive: boolean;
  sortOrder: number;

  classification?: 'expense' | 'investment' | 'savings'; // Dimension classification

  children?: BudgetTreeNode[];
}

export interface BudgetRatioScheduleItem extends Partial<LifecycleProps> {
  id: string;
  effectiveMonth: number;
  effectiveYear: number;
  note?: string;
  
  rootGroups: BudgetTreeNode[];
  ratios?: BudgetRatio[]; // Keep this optional legacy field for backward compatibility/migration
}

export interface ExpenseScheduleItem {
  id: string;
  effectiveMonth: number;
  effectiveYear: number;
  endMonth?: number;
  endYear?: number;
  status?: 'active' | 'settled';
  note?: string;
  
  // Record of category IDs (groupId/itemId) and their actual spending amounts
  // For group totals, the key is just groupId. 
  // However, users input per item, so the key is mostly `${groupId}/${itemId}`
  categories: Record<string, number>; 
}
