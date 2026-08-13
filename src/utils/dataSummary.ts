import type { AppState } from '../types/finance';

/**
 * Summary of data contained in an AppState snapshot.
 * Used for export/import feedback and backup history.
 */
export interface DataSummary {
  profileName: string;
  planningRange: string;
  startingCapital: number;
  incomeScheduleCount: number;
  incomeCategoriesCount: number;
  budgetScheduleCount: number;
  expenseScheduleCount: number;
  lifeStagesCount: number;
  lifeEventsCount: number;
  assetsCount: number;
  investmentDealsCount: number;
  savingsDepositsCount: number;
  sinkingFundsCount: number;
  debtsCount: number;
  fundTransfersCount: number;
  projectionAdjustmentsCount: number;
}

/**
 * Creates a human-readable summary of an AppState snapshot.
 */
export function createDataSummary(state: AppState): DataSummary {
  const p = state.profile;
  const profileName = [p.husbandName, p.wifeName].filter(Boolean).join(' & ') || 'Chưa cấu hình';
  const planningRange = `${p.planningStartMonth}/${p.planningStartYear} - ${p.planningEndMonth}/${p.planningEndYear}`;

  return {
    profileName,
    planningRange,
    startingCapital: p.startingCapital ?? 0,
    incomeScheduleCount: state.incomeSchedule?.length ?? 0,
    incomeCategoriesCount: (state.incomeCategories ?? []).length,
    budgetScheduleCount: state.budgetSchedule?.length ?? 0,
    expenseScheduleCount: state.expenseSchedule?.length ?? 0,
    lifeStagesCount: state.lifeStages?.length ?? 0,
    lifeEventsCount: state.lifeEvents?.length ?? 0,
    assetsCount: state.assets?.length ?? 0,
    investmentDealsCount: (state.investmentDeals ?? []).length,
    savingsDepositsCount: (state.savingsDeposits ?? []).length,
    sinkingFundsCount: (state.sinkingFunds ?? []).length,
    debtsCount: (state.debts ?? []).length,
    fundTransfersCount: (state.fundTransfers ?? []).length,
    projectionAdjustmentsCount: (state.projectionAdjustments ?? []).length,
  };
}

/**
 * Formats a DataSummary into an array of human-readable lines for display.
 */
export function formatSummaryLines(summary: DataSummary): string[] {
  const lines: string[] = [];
  lines.push(`Hồ sơ: ${summary.profileName} (${summary.planningRange})`);
  lines.push(`Vốn khởi điểm: ${summary.startingCapital} triệu`);
  
  const parts: string[] = [];
  if (summary.incomeScheduleCount > 0) parts.push(`${summary.incomeScheduleCount} mốc thu nhập`);
  if (summary.incomeCategoriesCount > 0) parts.push(`${summary.incomeCategoriesCount} danh mục thu nhập`);
  if (parts.length > 0) { lines.push(parts.join(' · ')); }

  const parts2: string[] = [];
  if (summary.budgetScheduleCount > 0) parts2.push(`${summary.budgetScheduleCount} mốc ngân sách`);
  if (summary.expenseScheduleCount > 0) parts2.push(`${summary.expenseScheduleCount} mốc chi tiêu thực tế`);
  if (parts2.length > 0) { lines.push(parts2.join(' · ')); }

  if (summary.lifeEventsCount > 0) lines.push(`${summary.lifeEventsCount} sự kiện chi tiêu linh hoạt`);
  if (summary.lifeStagesCount > 0) lines.push(`${summary.lifeStagesCount} giai đoạn cuộc đời`);

  const parts3: string[] = [];
  if (summary.assetsCount > 0) parts3.push(`${summary.assetsCount} loại tài sản`);
  if (summary.investmentDealsCount > 0) parts3.push(`${summary.investmentDealsCount} thương vụ đầu tư`);
  if (parts3.length > 0) { lines.push(parts3.join(' · ')); }

  const parts4: string[] = [];
  if (summary.sinkingFundsCount > 0) parts4.push(`${summary.sinkingFundsCount} quỹ tích lũy`);
  if (summary.savingsDepositsCount > 0) parts4.push(`${summary.savingsDepositsCount} sổ tiết kiệm`);
  if (summary.debtsCount > 0) parts4.push(`${summary.debtsCount} khoản nợ`);
  if (parts4.length > 0) { lines.push(parts4.join(' · ')); }

  if (summary.fundTransfersCount > 0) lines.push(`${summary.fundTransfersCount} lệnh điều chuyển`);
  if (summary.projectionAdjustmentsCount > 0) lines.push(`${summary.projectionAdjustmentsCount} điều chỉnh dự phóng`);

  return lines;
}
