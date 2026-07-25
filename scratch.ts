import { runProjection } from './src/engines/projectionEngine';
import { 
  DEFAULT_FAMILY_PROFILE as DEFAULT_PROFILE, 
  DEFAULT_INCOME_SCHEDULE,
  DEFAULT_BUDGET_TREE as DEFAULT_BUDGET_RATIOS,
  DEFAULT_LIFE_EVENTS,
  DEFAULT_ASSETS,
  DEFAULT_ASSUMPTIONS,
  DEFAULT_INVESTMENT_DEALS,
  DEFAULT_SAVINGS_DEPOSITS,
  DEFAULT_PROJECTION_ADJUSTMENTS,
  DEFAULT_LIFE_STAGES,
  DEFAULT_FUND_TRANSFERS
} from './src/data/defaultInputs';
import fs from 'fs';

const state = {
  profile: DEFAULT_PROFILE,
  incomeSchedule: DEFAULT_INCOME_SCHEDULE,
  budgetSchedule: DEFAULT_BUDGET_RATIOS,
  lifeEvents: DEFAULT_LIFE_EVENTS,
  assets: DEFAULT_ASSETS,
  assumptions: DEFAULT_ASSUMPTIONS,
  investmentDeals: DEFAULT_INVESTMENT_DEALS,
  savingsDeposits: DEFAULT_SAVINGS_DEPOSITS,
  projectionAdjustments: DEFAULT_PROJECTION_ADJUSTMENTS,
  lifeStages: DEFAULT_LIFE_STAGES,
  fundTransfers: DEFAULT_FUND_TRANSFERS,
};

const projection = runProjection(state as any);

const targetMonth = '2026-10';
const row = projection.monthlyRows.find(r => r.period.key === targetMonth);

if (row) {
  const result = {
    period: targetMonth,
    income: row.incomeMonthly,
    totalAllocated: row.totalAllocatedMonthly,
    expense: row.totalExpenseMonthly,
    investment: row.investmentMonthly,
    saving: row.savingMonthly,
    debtReserve: row.debtReserveMonthly,
    unallocated: row.freeCashflowMonthly,
    categories: (row as any).budget.categories.map((c: any) => ({
      name: c.categoryName,
      group: c.group,
      amount: c.amountMonthly,
      classification: c.classification || 'reserve' // 'Không phân loại' -> 'reserve'
    }))
  };
  fs.writeFileSync('C:/Users/Lhoai/.gemini/antigravity/brain/33433a78-8ef6-46ed-b9c8-84d8d6769019/scratch/result_10_2026.json', JSON.stringify(result, null, 2));
  console.log('Done writing result.');
} else {
  console.log('Month not found in projection.');
}
