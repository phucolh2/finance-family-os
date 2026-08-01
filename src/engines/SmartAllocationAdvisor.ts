// READ-ONLY SIMULATION — does not mutate system state
import type { AppState, SinkingFund } from '../types/finance';
import type { ProjectionOutput } from '../types/projection';
import type { BudgetRatioScheduleItem } from '../types/budget';

export interface AllocationSuggestion {
  tier: 0 | 1 | 2 | 3;
  targetId: string;
  targetName: string;
  amount: number;
  durationMonths: number;
  amountPerMonth: number;
  reason: string;
}

export interface AllocationSnapshot {
  appState: AppState;
  projection: ProjectionOutput;
  currentPeriodKey: string; // format: YYYY-MM
  housingBasicAvgExpense: number; // chi trung bình tháng (budget) của Nhà cửa & sinh hoạt cơ bản
  currentLiquidityBalance: number;
}

/**
 * Helper to parse YYYY-MM into total months
 */
const parsePeriodKey = (key: string) => {
  const parts = key.split('-');
  return parseInt(parts[0], 10) * 12 + parseInt(parts[1], 10);
};

const formatMoney = (val: number) => {
  return val.toLocaleString('vi-VN', { maximumFractionDigits: 1 });
};

/**
 * TẦNG 0 — Precautionary Buffer Check
 * Sàn = 3x chi tiêu cơ bản, Khuyến nghị = 6x
 */
export const checkBufferFund = (snapshot: AllocationSnapshot, availableAmount: number): { suggestions: AllocationSuggestion[], remaining: number } => {
  const suggestions: AllocationSuggestion[] = [];
  let remaining = availableAmount;

  if (snapshot.housingBasicAvgExpense <= 0) return { suggestions, remaining };

  const floorTarget = snapshot.housingBasicAvgExpense * 3;
  const recommendedTarget = snapshot.housingBasicAvgExpense * 6;
  const current = snapshot.currentLiquidityBalance;

  if (current < floorTarget) {
    const gap = floorTarget - current;
    const allocation = Math.min(gap, remaining);
    if (allocation > 0) {
      remaining -= allocation;
      suggestions.push({
        tier: 0,
        targetId: 'liquidity_buffer',
        targetName: 'Quỹ thanh khoản sinh hoạt',
        amount: allocation,
        durationMonths: 1,
        amountPerMonth: allocation,
        reason: `Quỹ thanh khoản hiện ${formatMoney(current)}tr, dưới mức sàn an toàn 3 tháng (${formatMoney(floorTarget)}tr) ➔ bù ${formatMoney(allocation)}tr để đạt ngưỡng tối thiểu.`
      });
    }
  }

  if (remaining > 0 && current + (floorTarget > current ? floorTarget - current : 0) < recommendedTarget) {
    const virtualCurrent = Math.max(current, floorTarget);
    const gap = recommendedTarget - virtualCurrent;
    const allocation = Math.min(gap, remaining);
    if (allocation > 0) {
      remaining -= allocation;
      suggestions.push({
        tier: 0,
        targetId: 'liquidity_buffer',
        targetName: 'Quỹ thanh khoản sinh hoạt',
        amount: allocation,
        durationMonths: 1,
        amountPerMonth: allocation,
        reason: `Củng cố Quỹ thanh khoản thêm ${formatMoney(allocation)}tr để hướng tới mức an toàn khuyến nghị 6 tháng (${formatMoney(recommendedTarget)}tr).`
      });
    }
  }

  return { suggestions, remaining };
};

/**
 * TẦNG 1 — Budget Pressure Relief
 * Tìm các nhóm tiêu sản Cấp 2 (>85%) hoặc Cấp 3 (>100%), bù đắp về <70%
 */
export const checkBudgetPressure = (snapshot: AllocationSnapshot, availableAmount: number): { suggestions: AllocationSuggestion[], remaining: number } => {
  const suggestions: AllocationSuggestion[] = [];
  let remaining = availableAmount;

  if (!snapshot.appState.resolvedMonthlyDbMap) return { suggestions, remaining };
  const currentDb = snapshot.appState.resolvedMonthlyDbMap[snapshot.currentPeriodKey];
  if (!currentDb || !currentDb.budgetAmounts || !currentDb.actualExpenseByGroup) return { suggestions, remaining };

  // Collect groups under pressure
  const pressuredGroups = [];
  
  // Find Budget ratios to get group names
  let activeBudget: BudgetRatioScheduleItem | null = null;
  const currentPeriodValue = parsePeriodKey(snapshot.currentPeriodKey);
  const applicableBudgets = snapshot.appState.budgetSchedule.filter(
    (b) => b.effectiveYear * 12 + b.effectiveMonth <= currentPeriodValue
  );
  if (applicableBudgets.length > 0) {
    applicableBudgets.sort((a,b) => (b.effectiveYear * 12 + b.effectiveMonth) - (a.effectiveYear * 12 + a.effectiveMonth));
    activeBudget = applicableBudgets[0];
  }

  for (const groupId of Object.keys(currentDb.budgetAmounts)) {
    const budget = currentDb.budgetAmounts[groupId] || 0;
    const actual = currentDb.actualExpenseByGroup[groupId] || 0; // Using base regular expense
    if (budget <= 0) continue;

    const ratio = actual / budget;
    if (ratio > 0.85) {
      // Find name
      const groupNode = activeBudget?.rootGroups?.find(g => g.groupId === groupId || g.id === groupId);
      const name = groupNode ? groupNode.name : groupId;
      
      const targetSafeActual = budget * 0.70;
      const gap = actual - targetSafeActual;
      
      if (gap > 0) {
        pressuredGroups.push({
          groupId,
          name,
          actual,
          budget,
          ratio,
          gap
        });
      }
    }
  }

  // Sort by highest ratio first (Cấp 3 > Cấp 2)
  pressuredGroups.sort((a, b) => b.ratio - a.ratio);

  for (const group of pressuredGroups) {
    if (remaining <= 0) break;
    const allocation = Math.min(group.gap, remaining);
    remaining -= allocation;
    
    let levelStr = group.ratio > 1.0 ? 'Cấp 3 (>100%)' : 'Cấp 2 (>85%)';
    
    suggestions.push({
      tier: 1,
      targetId: group.groupId,
      targetName: group.name,
      amount: allocation,
      durationMonths: 1, // Relief is immediate
      amountPerMonth: allocation,
      reason: `Nhóm chi tiêu đang ở ${levelStr} (Thực chi: ${formatMoney(group.actual)}tr / Ngân sách: ${formatMoney(group.budget)}tr) ➔ Bơm ${formatMoney(allocation)}tr để đưa áp lực về mức an toàn <70%.`
    });
  }

  return { suggestions, remaining };
};

/**
 * TẦNG 2 — Sinking Fund Smoothing
 * Tìm các quỹ Sinking Fund đang trễ tiến độ và bù vào
 */
export const checkSinkingFundProgress = (snapshot: AllocationSnapshot, availableAmount: number): { suggestions: AllocationSuggestion[], remaining: number } => {
  const suggestions: AllocationSuggestion[] = [];
  let remaining = availableAmount;

  const currentPeriodValue = parsePeriodKey(snapshot.currentPeriodKey);

  const activeFunds = (snapshot.appState.sinkingFunds || []).filter(f => f.status === 'active');
  
  for (const fund of activeFunds) {
    if (remaining <= 0) break;
    
    const startValue = fund.startYear * 12 + fund.startMonth;
    if (startValue > currentPeriodValue) continue; // Not started yet

    const monthsPassed = currentPeriodValue - startValue + 1;
    const expectedContributionSoFar = (fund.initialDeposit || 0) + monthsPassed * (fund.monthlyContribution || 0);
    const target = fund.targetAmount || 0;
    
    if (target <= 0) continue;
    
    const term = fund.termMonths || 12; // default term if not specified
    const totalExpectedMonths = term; 
    
    const timeProgress = Math.min(1, monthsPassed / totalExpectedMonths);
    const financialProgress = expectedContributionSoFar / target;
    
    if (financialProgress < timeProgress) {
      const targetCurrentBalance = target * timeProgress;
      const gap = targetCurrentBalance - expectedContributionSoFar;
      
      if (gap > 0) {
        const allocation = Math.min(gap, remaining);
        remaining -= allocation;
        
        suggestions.push({
          tier: 2,
          targetId: fund.id || fund.fundGroup || 'sinking_fund',
          targetName: fund.fundGroup || 'Quỹ mục tiêu',
          amount: allocation,
          durationMonths: 1, // Catch up is one-time
          amountPerMonth: allocation,
          reason: `Quỹ đang trễ tiến độ (Đạt ${(financialProgress*100).toFixed(0)}% so với lộ trình ${(timeProgress*100).toFixed(0)}%) ➔ Bổ sung ${formatMoney(allocation)}tr để bắt kịp kế hoạch.`
        });
      }
    }
  }

  return { suggestions, remaining };
};

/**
 * TẦNG 3 — Life-Stage Glide Path Allocation
 */
export const applyGlidePath = (snapshot: AllocationSnapshot, availableAmount: number): { suggestions: AllocationSuggestion[], remaining: number } => {
  const suggestions: AllocationSuggestion[] = [];
  let remaining = availableAmount;

  if (remaining <= 0) return { suggestions, remaining };

  const currentPeriodValue = parsePeriodKey(snapshot.currentPeriodKey);
  const currentYear = Math.floor(currentPeriodValue / 12);
  let activeStage = snapshot.appState.lifeStages.find(s => 
    s.fromYear <= currentYear && s.toYear >= currentYear
  );
  
  if (!activeStage && snapshot.appState.lifeStages.length > 0) {
    activeStage = snapshot.appState.lifeStages[0];
  }

  let stageType = 'accumulation';
  if (activeStage) {
    if (activeStage.name.toLowerCase().includes('nghỉ hưu') || activeStage.name.toLowerCase().includes('fire')) {
      stageType = 'retirement';
    } else if (activeStage.hasChild) {
      stageType = 'child_raising';
    }
  }
  let longTermRatio = 0;
  let shortTermRatio = 0;
  let stageName = '';

  if (stageType === 'accumulation') {
    longTermRatio = 0.4;
    shortTermRatio = 0.6;
    stageName = 'Tích lũy tài sản';
  } else if (stageType === 'child_raising') {
    longTermRatio = 0.25;
    shortTermRatio = 0.75;
    stageName = 'Nuôi dạy con';
  } else {
    longTermRatio = 0.8;
    shortTermRatio = 0.2;
    stageName = 'Nghỉ hưu / FIRE';
  }

  const longTermAmount = remaining * longTermRatio;
  const shortTermAmount = remaining * shortTermRatio;

  if (longTermAmount > 0) {
    let duration = Math.min(12, Math.max(1, Math.ceil(longTermAmount / 10))); // Assume max 10M per month for smoothing
    
    suggestions.push({
      tier: 3,
      targetId: 'investment_longterm',
      targetName: 'Đầu tư dài hạn',
      amount: longTermAmount,
      durationMonths: duration,
      amountPerMonth: longTermAmount / duration,
      reason: `Giai đoạn "${stageName}" ➔ Rải đều ${formatMoney(longTermAmount)}tr vào các kênh đầu tư dài hạn (Tỷ trọng ${(longTermRatio*100).toFixed(0)}%).`
    });
  }

  if (shortTermAmount > 0) {
    let duration = Math.min(12, Math.max(1, Math.ceil(shortTermAmount / 10)));
    suggestions.push({
      tier: 3,
      targetId: 'short_term_goals',
      targetName: 'Các mục tiêu ngắn hạn / Thanh khoản',
      amount: shortTermAmount,
      durationMonths: duration,
      amountPerMonth: shortTermAmount / duration,
      reason: `Giai đoạn "${stageName}" ➔ Đẩy ${formatMoney(shortTermAmount)}tr vào thanh khoản dự phòng và các quỹ chi tiêu ngắn hạn (Tỷ trọng ${(shortTermRatio*100).toFixed(0)}%).`
    });
  }

  remaining = 0; // Completely allocated

  return { suggestions, remaining };
};

export const computeSmartAllocation = (amount: number, snapshot: AllocationSnapshot): { suggestions: AllocationSuggestion[], remaining: number } => {
  const allSuggestions: AllocationSuggestion[] = [];
  let remaining = amount;

  const steps = [checkBufferFund, checkBudgetPressure, checkSinkingFundProgress, applyGlidePath];
  
  for (const step of steps) {
    if (remaining <= 0) break;
    const { suggestions, remaining: newRemaining } = step(snapshot, remaining);
    allSuggestions.push(...suggestions);
    remaining = newRemaining;
  }

  return { suggestions: allSuggestions, remaining };
};

export interface ExpenseFinancingResult {
  expenseAmount: number;
  availableLiquidity: number;
  upfrontPayment: number;
  remainingToFinance: number;
  surplusMonthly: number;
  durationMonths: number;
  monthlyPayment: number;
  isFeasible: boolean;
  message: string;
}

/**
 * Tính toán Cấu trúc Khoản chi (Expense Financing)
 * Cố gắng tối đa hóa việc trả góp để không làm thủng ngưỡng Quỹ an toàn (3 tháng sinh hoạt).
 */
export const computeExpenseFinancing = (expenseAmount: number, snapshot: AllocationSnapshot): ExpenseFinancingResult => {
  const floorTarget = snapshot.housingBasicAvgExpense * 3;
  
  // 1. Tính toán lượng thanh khoản dư thừa có thể dùng trả ngay (Upfront)
  const availableLiquidity = Math.max(0, snapshot.currentLiquidityBalance - floorTarget);
  
  const upfrontPayment = Math.min(expenseAmount, availableLiquidity);
  const remainingToFinance = expenseAmount - upfrontPayment;
  
  // Nếu khoản chi nhỏ hơn lượng thanh khoản dư thừa, có thể trả thẳng 1 lần
  if (remainingToFinance <= 0) {
    return {
      expenseAmount,
      availableLiquidity,
      upfrontPayment,
      remainingToFinance: 0,
      surplusMonthly: 0,
      durationMonths: 0,
      monthlyPayment: 0,
      isFeasible: true,
      message: `Bạn có dư ${formatMoney(availableLiquidity)}tr thanh khoản an toàn. Có thể thanh toán đứt điểm 1 lần.`
    };
  }

  // 2. Nếu còn dư nợ, tính toán trả góp dựa trên dòng tiền hàng tháng
  const currentRow = snapshot.projection.monthlyRows.find(r => r.period.key === snapshot.currentPeriodKey);
  const surplusMonthly = currentRow ? Math.max(0, currentRow.netCashflowMonthly) : 0;
  
  // Tính tỷ lệ an toàn: dùng tối đa 90% thặng dư để trả góp (để lại 10% sai số)
  const safeMonthlyPayment = surplusMonthly * 0.9;
  
  if (safeMonthlyPayment <= 0) {
    return {
      expenseAmount,
      availableLiquidity,
      upfrontPayment,
      remainingToFinance,
      surplusMonthly,
      durationMonths: 0,
      monthlyPayment: 0,
      isFeasible: false,
      message: `Dòng tiền thặng dư hàng tháng hiện tại không đủ (≈ 0) để gánh khoản trả góp ${formatMoney(remainingToFinance)}tr. Cần cân nhắc cắt giảm chi tiêu khác trước khi quyết định.`
    };
  }
  
  const durationMonths = Math.ceil(remainingToFinance / safeMonthlyPayment);
  const monthlyPayment = remainingToFinance / durationMonths;
  
  return {
    expenseAmount,
    availableLiquidity,
    upfrontPayment,
    remainingToFinance,
    surplusMonthly,
    durationMonths,
    monthlyPayment,
    isFeasible: true,
    message: `Trích ${formatMoney(upfrontPayment)}tr từ Quỹ Thanh Khoản dư. Phần còn lại ${formatMoney(remainingToFinance)}tr trả góp trong ${durationMonths} tháng.`
  };
};
