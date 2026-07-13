import type { AppState } from '../types/finance';
import type { LedgerEvent } from '../types/ledger';

export const buildEventLedger = (state: AppState): LedgerEvent[] => {
  const events: LedgerEvent[] = [];

  // 1. Incomes
  if (state.incomeSchedule) {
    state.incomeSchedule.forEach(inc => {
      events.push({
        id: `inc_${inc.id}`,
        category: 'income',
        name: `Thu nhập: ${inc.note || 'Lương'}`,
        startMonth: inc.effectiveMonth,
        startYear: inc.effectiveYear,
        endMonth: inc.endMonth,
        endYear: inc.endYear,
        status: inc.status || 'active',
        refId: inc.id,
        amountVnd: inc.incomeMonthly,
        note: inc.note
      });
    });
  }

  // 2. Budgets
  if (state.budgetSchedule) {
    state.budgetSchedule.forEach(bud => {
      events.push({
        id: `bud_${bud.id}`,
        category: 'budget_allocation',
        name: `Cơ cấu ngân sách: ${bud.note || 'Thay đổi'}`,
        startMonth: bud.effectiveMonth,
        startYear: bud.effectiveYear,
        endMonth: bud.endMonth,
        endYear: bud.endYear,
        status: bud.status || 'active',
        refId: bud.id,
        note: bud.note
      });
    });
  }

  // 3. Investments (Investment Deals)
  if (state.investmentDeals) {
    state.investmentDeals.forEach(inv => {
      events.push({
        id: `inv_${inv.id}`,
        category: 'investment',
        name: `${inv.isEarmarked ? 'Thương vụ Chờ phân bổ' : 'Đầu tư'}: ${inv.name}`,
        startMonth: inv.startMonth,
        startYear: inv.startYear,
        endMonth: inv.endMonth,
        endYear: inv.endYear,
        status: inv.status || 'active',
        refId: inv.id,
        amountVnd: inv.capital,
        note: inv.notes
      });
    });
  }

  // 3.5. Savings Deposits
  if (state.savingsDeposits) {
    state.savingsDeposits.forEach(dep => {
      const endMonth = ((dep.startMonth - 1 + dep.termMonths) % 12) + 1;
      const endYear = dep.startYear + Math.floor((dep.startMonth - 1 + dep.termMonths) / 12);
      events.push({
        id: `dep_${dep.id}`,
        category: 'investment',
        name: `Gửi tiết kiệm: ${dep.name} (${dep.termMonths} tháng, Lãi suất ${dep.interestRateAnnual}%/năm)`,
        startMonth: dep.startMonth,
        startYear: dep.startYear,
        endMonth: endMonth,
        endYear: endYear,
        status: dep.status === 'matured' ? 'settled' : 'active',
        refId: dep.id,
        amountVnd: dep.principal,
        note: `Nguồn vốn: ${dep.pool === 'idle' ? 'Chưa có kế hoạch' : 'Đã lên kế hoạch'}`
      });
    });
  }

  // 4. Life Events
  if (state.lifeEvents) {
    state.lifeEvents.forEach(evt => {
      events.push({
        id: `evt_${evt.id}`,
        category: 'life_event',
        name: `Sự kiện: ${evt.name}`,
        startMonth: evt.month,
        startYear: evt.year,
        endMonth: evt.endMonth,
        endYear: evt.endYear,
        status: evt.status || 'settled',
        refId: evt.id,
        amountVnd: evt.amount,
        note: evt.note
      });
    });
  }

  // Sort chronologically
  events.sort((a, b) => {
    if (a.startYear !== b.startYear) return a.startYear - b.startYear;
    return a.startMonth - b.startMonth;
  });

  return events;
};
