import type { AppState, DebtLiability, SavingsDeposit } from '../types/finance';
import type { ProjectionOutput } from '../types/projection';

export type AlertType = 'danger' | 'warning' | 'info' | 'success';
export type AlertCategory = 'liquidity' | 'rat_race' | 'arbitrage' | 'fire_track';

export interface AdvisorAlert {
  id: string;
  type: AlertType;
  category: AlertCategory;
  title: string;
  message: string;
  suggestion: string;
  icon?: string;
}

export function generateAdvisorAlerts(
  state: AppState,
  projection: ProjectionOutput,
  currentPeriodKey: string // YYYY-MM
): AdvisorAlert[] {
  const alerts: AdvisorAlert[] = [];
  
  if (!projection.monthlyRows || projection.monthlyRows.length === 0) return alerts;

  // Find current index
  const currentIndex = projection.monthlyRows.findIndex(r => r.period.key === currentPeriodKey);
  const startIdx = currentIndex >= 0 ? currentIndex : 0;
  
  // Rule 1: Liquidity Deficit (Khô máu dòng tiền)
  // Quét 24 tháng tới xem có tháng nào netCashflow âm nặng (dưới -5 triệu) do chi phí đột xuất / mua sắm / nợ.
  let liquidityDeficitFound = false;
  for (let i = startIdx; i < Math.min(startIdx + 24, projection.monthlyRows.length); i++) {
    const row = projection.monthlyRows[i];
    // Check projection warnings for "Quỹ Dự Phòng Nợ thiếu hụt" or similar cashflow issues
    const deficitWarnings = projection.warnings.filter(w => w.includes('thiếu hụt') && w.includes(String(row.period.month)));
    
    // Evaluate pure negative free cashflow if it's large
    if (row.netCashflowMonthly < -10 || deficitWarnings.length > 0) {
      alerts.push({
        id: `liq_${row.period.key}`,
        type: 'danger',
        category: 'liquidity',
        title: 'Cảnh báo Thâm hụt Thanh khoản',
        message: `Hệ thống dự phóng đến tháng ${row.period.month}/${row.period.year}, gia đình sẽ đối mặt với thâm hụt tiền mặt khoảng ${Math.abs(Math.round(row.netCashflowMonthly))} triệu.`,
        suggestion: 'Đề xuất: Giảm phân bổ đầu tư rủi ro ngay từ tháng này để bơm vào quỹ tiết kiệm phòng thủ, hoặc lùi kế hoạch chi tiêu lớn lại.',
        icon: 'droplets'
      });
      liquidityDeficitFound = true;
      break; // Only show the first nearest deficit
    }
  }

  // Rule 2: Rat Race Trap (Bẫy Chuột)
  // Tổng chi phí trả nợ hàng tháng > 40% Thu nhập chủ động
  const activeIncomeCategories = state.incomeCategories?.filter(c => c.type === 'active').map(c => c.id) || ['fulltime_salary', 'freelance'];
  
  // Calc active income for current month
  let currentActiveIncome = 0;
  state.incomeSchedule.forEach(item => {
    if (activeIncomeCategories.includes(item.incomeType || '')) {
      // Very basic static check (in reality, engine rows are better but we need to identify 'active' part)
      // Let's use the income schedule directly for the current effective income
      currentActiveIncome += item.incomeMonthly;
    }
  });

  // Calculate current monthly debt payment (approx based on PMT or principal/term)
  let currentMonthlyDebtPayment = 0;
  state.debts?.forEach(debt => {
    if (debt.status === 'active') {
      const rateMonthly = (debt.interestRateAnnual / 100) / 12;
      const pmt = rateMonthly === 0 
        ? debt.principal / debt.termMonths 
        : debt.principal * (rateMonthly * Math.pow(1 + rateMonthly, debt.termMonths)) / (Math.pow(1 + rateMonthly, debt.termMonths) - 1);
      currentMonthlyDebtPayment += pmt;
    }
  });

  if (currentActiveIncome > 0) {
    const debtRatio = currentMonthlyDebtPayment / currentActiveIncome;
    if (debtRatio > 0.4) {
      alerts.push({
        id: 'rat_race',
        type: 'danger',
        category: 'rat_race',
        title: 'Cảnh báo Bẫy Chuột (Rat Race Trap)',
        message: `Tổng chi trả nợ hàng tháng (${Math.round(currentMonthlyDebtPayment)} tr) đang chiếm ${(debtRatio * 100).toFixed(1)}% thu nhập chủ động. Rủi ro mất thanh khoản cực cao nếu một trong hai vợ chồng đột ngột mất việc.`,
        suggestion: 'Đề xuất: Hạn chế vay nợ tiêu dùng thêm. Hãy tập trung mọi nguồn lực để tất toán dứt điểm các khoản nợ lãi suất cao trước khi nghĩ đến đầu tư.',
        icon: 'alert-triangle'
      });
    } else if (debtRatio > 0.25) {
      alerts.push({
        id: 'rat_race_warn',
        type: 'warning',
        category: 'rat_race',
        title: 'Lưu ý Tỷ lệ Nợ vay',
        message: `Tổng chi trả nợ hàng tháng đang chiếm ${(debtRatio * 100).toFixed(1)}% thu nhập chủ động.`,
        suggestion: 'Đề xuất: Tỷ lệ này nằm trong ngưỡng an toàn (dưới 40%), nhưng không nên tăng thêm nợ trừ khi đó là nợ tốt (vay mua tài sản sinh lời).',
        icon: 'activity'
      });
    }
  }

  // Rule 3: Arbitrage Warning (Lãng phí chênh lệch lãi suất)
  const highInterestDebts = state.debts?.filter(d => d.status === 'active' && d.interestRateAnnual >= 10) || [];
  const lowInterestSavings = state.savingsDeposits?.filter(s => s.status === 'active' && s.interestRateAnnual < 10) || [];

  for (const debt of highInterestDebts) {
    for (const saving of lowInterestSavings) {
      if (saving.interestRateAnnual < debt.interestRateAnnual) {
        const diff = (debt.interestRateAnnual - saving.interestRateAnnual).toFixed(1);
        alerts.push({
          id: `arb_${debt.id}_${saving.id}`,
          type: 'warning',
          category: 'arbitrage',
          title: 'Lãng phí Chênh lệch Lãi suất',
          message: `Bạn đang gánh nợ "${debt.name}" với lãi suất ${debt.interestRateAnnual}%/năm, nhưng lại gửi tiết kiệm "${saving.name}" chỉ được ${saving.interestRateAnnual}%/năm. Đang lãng phí ${diff}% chênh lệch.`,
          suggestion: `Đề xuất: Trừ khi sổ tiết kiệm sắp đáo hạn, hãy cân nhắc rút ngay sổ "${saving.name}" để tất toán một phần hoặc toàn bộ khoản nợ "${debt.name}".`,
          icon: 'scale'
        });
        break; // Max 1 arbitrage warning per high debt
      }
    }
  }

  // Rule 4: FIRE Off-track (Lạm phát lối sống)
  // Compare recent actual expenses vs budget
  const actualExpenseSchedules = state.expenseSchedule || [];
  if (actualExpenseSchedules.length > 0) {
    const latestExpense = actualExpenseSchedules[actualExpenseSchedules.length - 1];
    const totalActual = Object.values(latestExpense.categories).reduce((sum, val) => sum + (val || 0), 0);
    
    // Find budgeted expense for the same period
    const row = projection.monthlyRows[startIdx];
    if (row && totalActual > 0) {
      // In projected row, actual expenses override budget, but let's compare with baseline budget
      // The budget limit is roughly income * (1 - savingRate) - debt
      // Actually we have the exact budgeted components in projection engine
      const totalBudget = row.expensesMonthly;

      if (totalBudget > 0 && totalActual > totalBudget * 1.15) { // Exceeds by 15%
        const exceedPercent = (((totalActual / totalBudget) - 1) * 100).toFixed(1);
        alerts.push({
          id: 'fire_offtrack',
          type: 'warning',
          category: 'fire_track',
          title: 'Cảnh báo Lạm phát lối sống',
          message: `Chi tiêu thực tế tháng gần nhất (${totalActual} tr) đang vượt ${exceedPercent}% so với ngân sách quy hoạch (${Math.round(totalBudget)} tr).`,
          suggestion: 'Đề xuất: Việc vỡ kế hoạch chi tiêu liên tục sẽ đẩy lùi thời điểm đạt Tự do tài chính (FIRE). Hãy rà soát lại các khoản chi tiêu không thiết yếu.',
          icon: 'trending-down'
        });
      }
    }
  }
  
  // If no warnings, push a success state
  if (alerts.length === 0) {
    alerts.push({
      id: 'all_good',
      type: 'success',
      category: 'fire_track',
      title: 'Tài chính Khỏe mạnh',
      message: 'Không phát hiện rủi ro dòng tiền, bẫy nợ hay lãng phí lãi suất trong hiện tại và tương lai gần.',
      suggestion: 'Đề xuất: Tiếp tục duy trì kỷ luật tích lũy. Gia đình đang đi đúng lộ trình thiết kế.',
      icon: 'shield-check'
    });
  }

  return alerts;
}
