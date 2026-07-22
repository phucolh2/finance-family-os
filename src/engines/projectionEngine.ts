import type { FamilyProfile, IncomeScheduleItem, LifeEvent, Assumptions, InvestmentDeal, SavingsDeposit, LifeStage, DebtLiability } from '../types/finance';
import type { BudgetRatioScheduleItem, ExpenseScheduleItem } from '../types/budget';
import type { AssetConfig, AssetType } from '../types/portfolio';
import type { ProjectionMonthlyRow, ProjectionYearlyRow, ProjectionOutput, ProjectionAdjustmentRecord } from '../types/projection';
import { generateTimeline } from './timelineEngine';
import { calculateIncome } from './incomeEngine';
import { calculateBudget } from './budgetEngine';
import { calculateCashflow } from './cashflowEngine';
import { calculateChildCost } from './childEngine';
import { calculateFire } from './fireEngine';
import { safeNumber, safeArray, calculatePMT } from '../utils/math';

export interface ProjectionEngineInput {
  profile: FamilyProfile;
  incomeSchedule: IncomeScheduleItem[];
  budgetSchedule: BudgetRatioScheduleItem[];
  expenseSchedule?: ExpenseScheduleItem[];
  lifeEvents: LifeEvent[];
  assets: AssetConfig[];
  assumptions: Assumptions;
  investmentDeals?: InvestmentDeal[];
  savingsDeposits?: SavingsDeposit[];
  sinkingFunds?: import('../types/finance').SinkingFund[];
  debts?: DebtLiability[];
  projectionAdjustments?: ProjectionAdjustmentRecord[];
  lifeStages?: LifeStage[];
  fundTransfers?: import('../types/finance').FundTransfer[];
}

/**
 * Pure, deterministic projection engine.
 * Simulates financial timeline month-by-month and aggregates results into yearly summaries.
 */
export function runProjection(input: ProjectionEngineInput): ProjectionOutput {
  const warnings: string[] = [];

  const profile = input.profile;
  const incomeSchedule = safeArray(input.incomeSchedule);
  const budgetSchedule = safeArray(input.budgetSchedule);
  const expenseSchedule = safeArray(input.expenseSchedule);
  const lifeEvents = safeArray(input.lifeEvents);
  const _assets = safeArray(input.assets);
  const assumptions = input.assumptions;
  const investmentDeals = safeArray(input.investmentDeals);
  const savingsDeposits = safeArray(input.savingsDeposits);
  const sinkingFunds = safeArray(input.sinkingFunds);
  const debts = safeArray(input.debts);
  const projectionAdjustments = safeArray(input.projectionAdjustments);
  const lifeStages = safeArray(input.lifeStages);
  const fundTransfers = safeArray(input.fundTransfers);

  // 1. Generate monthly timeline
  const timelineResult = generateTimeline({
    planningStartMonth: profile.planningStartMonth,
    planningStartYear: profile.planningStartYear,
    planningEndMonth: profile.planningEndMonth,
    planningEndYear: profile.planningEndYear,
    husbandAgeAtStart: profile.husbandAgeAtStart,
    wifeAgeAtStart: profile.wifeAgeAtStart,
  });

  warnings.push(...timelineResult.warnings);

  if (timelineResult.periods.length === 0) {
    return { monthlyRows: [], yearlyRows: [], warnings };
  }

  // 2. Initialize simulation balances
  const initialCapital = Math.max(0, safeNumber(profile.startingCapital, 0));
  let totalInvestable = initialCapital;
  let currentSavingBalance = 0; // Cumulative Saving balance
  let currentDebtReserveBalance = 0; // Cumulative Debt Reserve balance
  let currentLiquidityBalance = 0; // Cumulative Operational Free Cashflow
  let cumulativeContribution = 0;
  let cumulativePnl = 0;

  const assetAdjustments: Record<AssetType, number> = {
    fx_reserve_usd: 0,
    gold: 0,
    real_estate: 0,
    stocks: 0,
    crypto: 0,
  };

  const sinkingFundStates: Record<string, { buckets: { principal: number; termStart: number }[]; balance: number; contribution: number; interest: number }> = {};
  const savingsStates: Record<string, { buckets: { principal: number; termStart: number }[]; balance: number; contribution: number; interest: number }> = {};
  const debtStates: Record<string, { remainingPrincipal: number }> = {};

  const monthlyRows: ProjectionMonthlyRow[] = [];

  // 3. Simulation loop
  timelineResult.periods.forEach((period) => {
    // Resolve Income
    const incomeRes = calculateIncome({ period, incomeSchedule });
    warnings.push(...incomeRes.warnings.map(w => `[Thu nhập] ${w}`));

    // Resolve Debt Payments (Dư nợ giảm dần)
    let activeDebtPaymentMonthly = 0;
    let totalDebtPrincipalRemaining = 0;
    let totalDebtInterestPaidMonthly = 0;
    debts.forEach((debt) => {
      if (!debtStates[debt.id]) {
        debtStates[debt.id] = { remainingPrincipal: debt.principal };
      }
      const start = debt.startYear * 12 + debt.startMonth;
      const current = period.year * 12 + period.month;
      const end = start + debt.termMonths;
      const isSettled = debt.status === 'settled';

      if (current >= start && current < end && !isSettled) {
        // Assume fixed monthly payment (PMT)
        const pmt = calculatePMT(debt.principal, debt.interestRateAnnual, debt.termMonths);
        const monthlyInterest = debtStates[debt.id].remainingPrincipal * ((debt.interestRateAnnual / 100) / 12);
        const principalPayment = pmt - monthlyInterest;
        debtStates[debt.id].remainingPrincipal = Math.max(0, debtStates[debt.id].remainingPrincipal - principalPayment);
        activeDebtPaymentMonthly += pmt;
        totalDebtInterestPaidMonthly += monthlyInterest;
        totalDebtPrincipalRemaining += debtStates[debt.id].remainingPrincipal;
      }
    });

    // Resolve active stage for childCost parameters
    const activeStage = lifeStages.find(
      s => period.year >= s.fromYear && period.year <= s.toYear
    );
    const childLifestyle = activeStage ? activeStage.childLifestyle : 'premium';
    const childBudgetCap = activeStage ? activeStage.childBudgetCapMonthly : 35;

    // Calculate Child Cost
    const childCostRes = calculateChildCost({
      period,
      childBirthMonth: profile.childBirthMonth,
      childBirthYear: profile.childBirthYear,
      lifestyle: childLifestyle,
      budgetCapMonthly: childBudgetCap,
      educationInflationAnnual: assumptions.educationInflationRateAnnual,
      healthInflationAnnual: assumptions.medicalInflationRateAnnual,
      generalInflationAnnual: assumptions.generalInflationRateAnnual,
    });

    // Do NOT deduct debt payment from income before budgeting.
    // The budget should be calculated on full income.
    const budgetRes = calculateBudget({
      period,
      incomeMonthly: incomeRes.incomeMonthly,
      budgetSchedule,
      childCost: childCostRes,
    });
    warnings.push(...budgetRes.warnings.map(w => `[Ngân sách] ${w}`));

    // Resolve Actual Expenses
    let totalActualExpenseMonthly: number | undefined = undefined;
    const applicableExpenseSchedules = expenseSchedule.filter(
      (s) => s.effectiveYear * 12 + s.effectiveMonth <= period.year * 12 + period.month
    );
    if (applicableExpenseSchedules.length > 0) {
      applicableExpenseSchedules.sort((a, b) => 
        b.effectiveYear * 12 + b.effectiveMonth - (a.effectiveYear * 12 + a.effectiveMonth)
      );
      const activeExpenseSchedule = applicableExpenseSchedules[0];
      const isEnded = activeExpenseSchedule.endYear && activeExpenseSchedule.endMonth
        ? (period.year * 12 + period.month > activeExpenseSchedule.endYear * 12 + activeExpenseSchedule.endMonth)
        : false;
      if (!isEnded) {
        totalActualExpenseMonthly = Object.values(activeExpenseSchedule.categories).reduce((sum, val) => sum + safeNumber(val), 0);
      }
    }

    // Resolve Cashflow
    const cashflowRes = calculateCashflow({
      period,
      budget: budgetRes,
      lifeEvents,
      actualExpenseMonthly: totalActualExpenseMonthly,
    });
    warnings.push(...cashflowRes.warnings.map(w => `[Dòng tiền] ${w}`));

    // Add budget's debt reserve allocation to the running balance
    currentDebtReserveBalance += safeNumber(cashflowRes.debtReserveMonthly, 0);

    // Pay active debt from the reserve balance
    currentDebtReserveBalance -= activeDebtPaymentMonthly;

    if (currentDebtReserveBalance < 0) {
      const deficit = Math.abs(currentDebtReserveBalance);
      // Deduct the missing amount from free cashflow (netCashflowMonthly)
      cashflowRes.netCashflowMonthly -= deficit;
      currentDebtReserveBalance = 0;
      
      warnings.push(`[Công nợ] Tháng ${period.month}/${period.year}: Quỹ Dự Phòng Nợ thiếu hụt ${deficit.toFixed(1)} tr. Đã tự động trừ vào dòng tiền tự do (Cashflow). Bạn có thể điều chỉnh ngân sách thủ công để bù đắp.`);
    }

    // Handle Life Event balances directly
    const activePeriodEvents = lifeEvents.filter(
      (e) => safeNumber(e.month) === period.month && safeNumber(e.year) === period.year
    );

    activePeriodEvents.forEach((event) => {
      const amt = event.amount; // âm là chi tiền, dương là nhận tiền
      
      // 1. External sources do not affect family internal pools
      if (event.source === 'external') {
         return; 
      }

      // 2. Determine classification dynamically based on budget definition
      let classification = 'expense'; // default fallback
      if (event.source === 'future_investing' || event.source === 'investment') classification = 'investment';
      else if (event.source === 'safety_reserve') classification = 'savings';
      else if (event.source === 'debt') classification = 'debt_reserve';
      
      const matchedCategory = budgetRes.categories.find(c => c.group === event.source);
      if (matchedCategory && matchedCategory.classification) {
          classification = matchedCategory.classification;
      }

      // 3. Deduct/Add to the correct bucket
      if (classification === 'investment') {
        if (event.type === 'buy_property') {
          assetAdjustments.stocks += amt; 
          assetAdjustments.real_estate -= amt; 
        } else {
          assetAdjustments.stocks += amt;
          totalInvestable = Math.max(0, totalInvestable + amt);
        }
      } else if (classification === 'savings') {
        currentSavingBalance = Math.max(0, currentSavingBalance + amt);
      } else if (classification === 'expense') {
        // Expense unspent budget piles up in Liquidity, so events draw from Liquidity
        currentLiquidityBalance += amt; 
      } else if (classification === 'debt_reserve') {
        currentDebtReserveBalance += amt;
      }
    });

    // Process Fund Transfers for abstract buckets and edge cases
    const transfersThisMonth = fundTransfers.filter(t => t.month === period.month && t.year === period.year);
    transfersThisMonth.forEach(t => {
       // --- 1. SOURCE DEDUCTIONS ---
       if (t.sourceType === 'pool' && t.sourceId === 'saving') {
          currentSavingBalance -= t.amount;
       } else if (t.sourceType === 'pool' && t.sourceId === 'debt_reserve') {
          currentDebtReserveBalance -= t.amount;
       } else if (t.sourceType === 'cashflow' && t.sourceId === 'liquidity') {
          currentLiquidityBalance -= t.amount;
       } else if (t.sourceType === 'cashflow' && (!t.sourceId || t.sourceId === 'investable')) {
          totalInvestable -= t.amount;
       }

       // --- 2. DESTINATION ADDITIONS ---
       if (t.destinationType === 'cashflow') {
          if (t.destinationId === 'liquidity') {
             currentLiquidityBalance += t.amount;
          } else {
             totalInvestable += t.amount;
          }
       } else if (t.destinationType === 'investment' || t.destinationType === 'sinking_fund') {
          // Any money that lands in an investment deal/fund must be part of the totalInvestable universe.
          totalInvestable += t.amount;
       }
    });

    // We will calculate Active Deal Values up to LAST month, to find unallocated compounding base
    let activeValueUpToLastMonth = 0;
    investmentDeals.forEach(deal => {
      const start = deal.startYear * 12 + deal.startMonth;
      const current = period.year * 12 + period.month;
      const end = deal.status === 'settled' && deal.endYear && deal.endMonth 
        ? deal.endYear * 12 + deal.endMonth 
        : Infinity;
      
      if (current >= start && current <= end) {
        let currentCapital = safeNumber(deal.capital, 0);
        if (deal.withdrawals) {
           deal.withdrawals.forEach(w => {
              if (w.year * 12 + w.month < current) {
                 currentCapital -= w.amount;
              }
           });
        }
        
        let acc = 0;
        if (deal.status === 'settled') {
          const investStart = deal.isConverted && deal.conversionYear && deal.conversionMonth
            ? deal.conversionYear * 12 + deal.conversionMonth
            : start;
          const duration = end - investStart + 1;
          acc = (safeNumber(deal.realizedProfit, 0) / duration) * Math.max(0, current - investStart);
        }
        activeValueUpToLastMonth += Math.max(0, currentCapital) + acc;
      }
    });

    let activeSavingsPrincipalThisMonth = 0;
    let activeSavingsContrib_saving = 0;
    let activeSavingsMaturedThisMonth_saving = 0;
    let activeSavingsMaturedThisMonth_unallocated = 0;

    savingsDeposits.forEach((dep) => {
      if (!savingsStates[dep.id]) {
        savingsStates[dep.id] = { buckets: [], balance: 0, contribution: 0, interest: 0 };
      }
      const state = savingsStates[dep.id];
      const depStart = dep.startYear * 12 + dep.startMonth;
      const depEnd = dep.status === 'settled_early' && dep.settledYear && dep.settledMonth
        ? dep.settledYear * 12 + dep.settledMonth
        : Infinity;
      const originalMaturity = depStart + dep.termMonths;
      const current = period.year * 12 + period.month;
      const term = dep.termMonths || 1;

      if (current >= depStart && current <= depEnd) {
        let maturingAmount = 0;
        
        if (current === depEnd && dep.status === 'settled_early') {
           maturingAmount = state.balance + safeNumber(dep.realizedInterest, 0);
           state.buckets = [];
           state.interest += safeNumber(dep.realizedInterest, 0);
           state.balance = 0;
        } else {
           // Handle withdrawals in this month
           const currentWithdrawals = (dep.withdrawals || []).filter(w => w.month === period.month && w.year === period.year);
           if (currentWithdrawals.length > 0) {
              currentWithdrawals.forEach(w => {
                 let amountToDeduct = w.amount;
                 for (let i = 0; i < state.buckets.length && amountToDeduct > 0; i++) {
                    if (state.buckets[i].principal >= amountToDeduct) {
                       state.buckets[i].principal -= amountToDeduct;
                       amountToDeduct = 0;
                    } else {
                       amountToDeduct -= state.buckets[i].principal;
                       state.buckets[i].principal = 0;
                    }
                 }
                 maturingAmount += w.amount + safeNumber(w.realizedInterest, 0);
                 state.interest += safeNumber(w.realizedInterest, 0);
              });
              state.buckets = state.buckets.filter(b => b.principal > 0);
           }

           state.buckets = state.buckets.filter(b => {
              if (current - b.termStart === term && current > b.termStart) {
                 const interest = b.principal * ((dep.interestRateAnnual || 0) / 100 / 12) * term;
                 maturingAmount += b.principal + interest;
                 state.interest += interest;
                 return false;
              }
              return true;
           });

           let newContrib = 0;
           if (current === depStart) newContrib += (dep.principal || 0);
           
           // Stop contributing when original term is reached
           if (current > depStart && current < originalMaturity) {
               newContrib += (dep.monthlyContribution || 0);
           } else if (current === originalMaturity && (dep.monthlyContribution || 0) > 0) {
               warnings.push(`[Tiết kiệm] Khoản "${dep.name}" đã hết kỳ hạn gốc (${dep.termMonths} tháng). Việc đóng góp hàng tháng (${dep.monthlyContribution}M) sẽ tự động dừng lại.`);
           }

           state.contribution += newContrib;
           if (newContrib > 0) {
              state.buckets.push({ principal: newContrib, termStart: current });
              if (dep.pool === 'liquidity') {
                  currentLiquidityBalance -= newContrib;
              }
           }
           state.balance = state.buckets.reduce((sum, b) => sum + b.principal, 0);
        }

        if (maturingAmount > 0) {
           if (dep.pool === 'saving') {
               activeSavingsMaturedThisMonth_saving += maturingAmount;
           } else if (dep.pool === 'liquidity') {
               currentLiquidityBalance += maturingAmount;
           } else {
               activeSavingsMaturedThisMonth_unallocated += maturingAmount;
           }
        }
        
        activeSavingsPrincipalThisMonth += state.balance;
        if (dep.pool === 'saving' && current < originalMaturity && current <= depEnd) {
           activeSavingsContrib_saving += (current === depStart ? (dep.principal + (dep.monthlyContribution||0)) : (dep.monthlyContribution||0));
        }
      }
    });

    let activeSinkingFundsBalance_unallocated = 0;
    let activeSinkingFundsBalance_saving = 0;
    let activeSinkingFundsBalance_debtReserve = 0;
    let activeSinkingFundsContrib_saving = 0;
    
    let sinkingFundMaturedThisMonth_saving = 0;
    let sinkingFundMaturedThisMonth_debtReserve = 0;
    let sinkingFundMaturedThisMonth_unallocated = 0;

    sinkingFunds.forEach(sf => {
      if (!sinkingFundStates[sf.id]) {
        sinkingFundStates[sf.id] = { buckets: [], balance: 0, contribution: 0, interest: 0 };
      }
      const state = sinkingFundStates[sf.id];
      const start = sf.startYear * 12 + sf.startMonth;
      const end = sf.status === 'disbursed' && sf.disbursedYear && sf.disbursedMonth
        ? sf.disbursedYear * 12 + sf.disbursedMonth
        : Infinity;
      const current = period.year * 12 + period.month;
      const term = sf.termMonths || 1;
      const source = sf.sourceOfFund || (sf.fundType === 'debt_prep' ? 'debt_reserve' : 'unallocated');
      
      if (current >= start && current <= end) {
        let maturingAmount = 0;
        let newContrib = 0;
        
        if (current === end && sf.status === 'disbursed') {
            maturingAmount = state.balance;
            state.buckets = [];
            state.balance = 0;
        } else {
            // Handle withdrawals in this month
            const currentWithdrawals = (sf.withdrawals || []).filter(w => w.month === period.month && w.year === period.year);
            if (currentWithdrawals.length > 0) {
               currentWithdrawals.forEach(w => {
                  let amountToDeduct = w.amount;
                  for (let i = 0; i < state.buckets.length && amountToDeduct > 0; i++) {
                     if (state.buckets[i].principal >= amountToDeduct) {
                        state.buckets[i].principal -= amountToDeduct;
                        amountToDeduct = 0;
                     } else {
                        amountToDeduct -= state.buckets[i].principal;
                        state.buckets[i].principal = 0;
                     }
                  }
                  maturingAmount += w.amount + safeNumber(w.realizedInterest, 0);
                  state.interest += safeNumber(w.realizedInterest, 0);
               });
               state.buckets = state.buckets.filter(b => b.principal > 0);
            }

            state.buckets = state.buckets.filter(b => {
               if (current - b.termStart === term && current > b.termStart) {
                  const interest = b.principal * ((sf.interestRateAnnual || 0) / 100 / 12) * term;
                  maturingAmount += b.principal + interest;
                  state.interest += interest;
                  return false;
               }
               return true;
            });
            
            if (current === start) {
               newContrib += (sf.initialDeposit || 0);
            }
            if (current >= start) {
               newContrib += (sf.monthlyContribution || 0);
            }
            
            state.contribution += newContrib;
            
            if (newContrib > 0 || maturingAmount > 0) {
               state.buckets.push({ principal: newContrib + maturingAmount, termStart: current });
            }
            
            state.balance = state.buckets.reduce((sum, b) => sum + b.principal, 0);
        }
        if (maturingAmount > 0) {
           if (source === 'saving') {
               sinkingFundMaturedThisMonth_saving += maturingAmount;
           } else if (source === 'debt_reserve') {
               sinkingFundMaturedThisMonth_debtReserve += maturingAmount;
           } else {
               sinkingFundMaturedThisMonth_unallocated += maturingAmount;
           }
        }
        
        if (source === 'unallocated') {
          activeSinkingFundsBalance_unallocated += state.balance;
        } else if (source === 'saving') {
          activeSinkingFundsBalance_saving += state.balance;
          if (current < end) activeSinkingFundsContrib_saving += newContrib;
        } else if (source === 'debt_reserve') {
          activeSinkingFundsBalance_debtReserve += state.balance;
          if (current < end) currentDebtReserveBalance -= newContrib;
        }
      }
    });

    currentDebtReserveBalance += sinkingFundMaturedThisMonth_debtReserve;

    if (currentDebtReserveBalance < 0) {
      const deficit = Math.abs(currentDebtReserveBalance);
      cashflowRes.netCashflowMonthly -= deficit;
      currentDebtReserveBalance = 0;
      warnings.push(`[Công nợ] Tháng ${period.month}/${period.year}: Quỹ Chuẩn bị Trả nợ (Sinking Fund) thiếu hụt ${deficit.toFixed(1)} tr. Đã tự động trừ vào dòng tiền tự do (Cashflow). Bạn có thể điều chỉnh ngân sách thủ công để bù đắp.`);
    }

    const _unallocatedForCompounding = Math.max(0, totalInvestable - activeValueUpToLastMonth - activeSavingsPrincipalThisMonth - activeSinkingFundsBalance_unallocated);

    // Evaluate adjustments for the current month
    let adjustedSavingRate: number | null = null;
    let manualAnnualProfit = 0;
    let manualMonthlyProfit = 0;
    let manualOneTimeProfit = 0;
    let hasManualInvestmentAdj = false;

    for (const adj of projectionAdjustments) {
      const isWithinPeriod = (period.year > adj.startYear || (period.year === adj.startYear && period.month >= adj.startMonth)) &&
                             (period.year < adj.endYear || (period.year === adj.endYear && period.month <= adj.endMonth));
      if (isWithinPeriod) {
        if (adj.adjustedSavingRate != null) adjustedSavingRate = adj.adjustedSavingRate;
        if (adj.annualInvestmentProfit != null || adj.monthlyInvestmentProfit != null || adj.oneTimeInvestmentProfit != null) {
          hasManualInvestmentAdj = true;
          if (adj.annualInvestmentProfit) manualAnnualProfit += adj.annualInvestmentProfit;
          if (adj.monthlyInvestmentProfit) manualMonthlyProfit += adj.monthlyInvestmentProfit;
          if (adj.oneTimeInvestmentProfit && period.month === adj.startMonth && period.year === adj.startYear) {
            manualOneTimeProfit += adj.oneTimeInvestmentProfit;
          }
        }
      }
    }

    const activeSavingRate = adjustedSavingRate ?? safeNumber(assumptions.savingsInterestRateAnnual, 0);
    const savingsRateRatio = activeSavingRate > 1 ? activeSavingRate / 100 : activeSavingRate;
    const savingsMonthlyYield = savingsRateRatio / 12;

    const savingMonthlyContribution = cashflowRes.savingMonthly - activeSinkingFundsContrib_saving - activeSavingsContrib_saving;
    const savingPnl = currentSavingBalance * savingsMonthlyYield + savingMonthlyContribution * (savingsMonthlyYield / 2);
    currentSavingBalance = currentSavingBalance + savingMonthlyContribution + savingPnl + activeSavingsMaturedThisMonth_saving + sinkingFundMaturedThisMonth_saving;

    const monthlyContribution = cashflowRes.investmentMonthly;
    
    // Calculate generic investment profit (on unallocated cash only)
    let genericPnl = 0;
    if (hasManualInvestmentAdj) {
      genericPnl = (manualAnnualProfit / 12) + manualMonthlyProfit + manualOneTimeProfit;
    }
    
    // Calculate specific deals PnL for THIS month
    let totalDealPnlThisMonth = 0;
    const dealSettleNotes: string[] = [];
    
    investmentDeals.forEach(deal => {
      const start = deal.startYear * 12 + deal.startMonth;
      const current = period.year * 12 + period.month;
      const end = deal.status === 'settled' && deal.endYear && deal.endMonth 
        ? deal.endYear * 12 + deal.endMonth 
        : Infinity;

      if (current >= start && current <= end) {
        if (deal.status === 'settled') {
          const investStart = (deal as any).isConverted && (deal as any).conversionYear && (deal as any).conversionMonth
            ? (deal as any).conversionYear * 12 + (deal as any).conversionMonth
            : start;
          if (current >= investStart && current <= end) {
            const duration = end - investStart + 1;
            totalDealPnlThisMonth += safeNumber(deal.realizedProfit, 0) / duration;
          }
        }
        
        // --- NEW: Handle Cash Flow ---
        if ((deal.dealType === 'cash_flow' || deal.realEstateType === 'cash_flow') && deal.cashflowYieldAnnual && current > start) {
           let currentCapital = safeNumber(deal.capital, 0);
           if (deal.withdrawals) {
              deal.withdrawals.forEach(w => {
                 if (w.year * 12 + w.month < current) currentCapital -= w.amount;
              });
           }
           const monthlyYield = (deal.cashflowYieldAnnual / 100) / 12;
           if (!deal.cashflowTrackedInIncome) {
             totalDealPnlThisMonth += Math.max(0, currentCapital) * monthlyYield;
           }
        }

        // --- NEW: Handle Partial Withdrawals Profit ---
        if (deal.withdrawals) {
           deal.withdrawals.forEach(w => {
              if (w.year === period.year && w.month === period.month) {
                 totalDealPnlThisMonth += safeNumber(w.realizedProfit, 0);
              }
           });
        }
      }

      if (deal.status === 'settled' && deal.endMonth === period.month && deal.endYear === period.year) {
        const profit = safeNumber(deal.realizedProfit, 0);
        dealSettleNotes.push(`Tất toán toàn bộ ${deal.name}: ${profit >= 0 ? `Lãi +` : `Lỗ `}${String(profit)}M`);
      }
      
      if (deal.withdrawals) {
        deal.withdrawals.forEach(w => {
           if (w.year === period.year && w.month === period.month) {
              const profit = w.realizedProfit || 0;
              dealSettleNotes.push(`Rút một phần ${deal.name}: Gốc ${w.amount}M, ${profit >= 0 ? `Lãi +` : `Lỗ `}${profit}M`);
           }
        });
      }
    });

    const investmentPnl = genericPnl + totalDealPnlThisMonth;
    const previousTotalInvestable = totalInvestable;
    
    // Unspent budget and recurring cash flow impacts flow into Liquidity (Operational Cash)
    const operationalCashflow = cashflowRes.netCashflowMonthly - cashflowRes.oneTimeEventImpact;
    currentLiquidityBalance += operationalCashflow;

    // For unallocated matured funds, they flow into totalInvestable
    totalInvestable += monthlyContribution + investmentPnl + activeSavingsMaturedThisMonth_unallocated + sinkingFundMaturedThisMonth_unallocated;

    // Derived actual monthly rate based on custom profit
    const _actualInvestmentRateMonthly = previousTotalInvestable > 0 ? investmentPnl / previousTotalInvestable : 0;

    const assetBalances: Record<AssetType, number> = { fx_reserve_usd: 0, gold: 0, real_estate: 0, stocks: 0, crypto: 0 };
    const earmarkedBalances: Record<AssetType, number> = { fx_reserve_usd: 0, gold: 0, real_estate: 0, stocks: 0, crypto: 0 };
    let totalEarmarkedCapital = 0;

    // Distribute accumulated PnL into asset classes
    investmentDeals.forEach((deal) => {
      const start = deal.startYear * 12 + deal.startMonth;
      const current = period.year * 12 + period.month;
      const end = deal.status === 'settled' && deal.endYear && deal.endMonth 
        ? deal.endYear * 12 + deal.endMonth 
        : Infinity;
      
      if (current >= start && current < end) {
        let accumulatedPnl = 0;
        if (deal.status === 'settled') {
          const investStart = (deal as any).isConverted && (deal as any).conversionYear && (deal as any).conversionMonth
            ? (deal as any).conversionYear * 12 + (deal as any).conversionMonth
            : start;
          if (current >= investStart) {
            const duration = end - investStart + 1;
            const monthsActiveSoFar = current - investStart + 1;
            accumulatedPnl = (safeNumber(deal.realizedProfit, 0) / duration) * monthsActiveSoFar;
          }
        }

        let currentCapital = safeNumber(deal.capital, 0);
        if (deal.withdrawals) {
           deal.withdrawals.forEach(w => {
              if (w.year * 12 + w.month <= current) {
                 currentCapital -= w.amount;
              }
           });
        }
        
        assetBalances[deal.assetType] += Math.max(0, currentCapital) + (deal.status === 'settled' ? accumulatedPnl : 0);
      }
    });

    sinkingFunds.forEach(sf => {
       const source = sf.sourceOfFund || (sf.fundType === 'debt_prep' ? 'debt_reserve' : 'unallocated');
       if (source !== 'unallocated') return;

       const start = sf.startYear * 12 + sf.startMonth;
       const end = sf.status === 'disbursed' && sf.disbursedYear && sf.disbursedMonth
        ? sf.disbursedYear * 12 + sf.disbursedMonth
        : Infinity;
       const current = period.year * 12 + period.month;
       
       if (current >= start && current < end) {
          const state = sinkingFundStates[sf.id] || { balance: 0 };
          earmarkedBalances[sf.targetAssetType] += state.balance;
          totalEarmarkedCapital += state.balance;
       }
    });

    const standardTypes: AssetType[] = ['fx_reserve_usd', 'gold', 'real_estate', 'stocks', 'crypto'];
    standardTypes.forEach((type) => {
      assetBalances[type] = Math.max(0, assetBalances[type] + assetAdjustments[type]);
    });

    const totalActiveCapital = Object.values(assetBalances).reduce((sum, v) => sum + v, 0);
    const unallocatedCash = Math.max(0, totalInvestable - totalActiveCapital - totalEarmarkedCapital);
    const _safeTotalEndingBalance = Math.max(totalInvestable, totalActiveCapital + totalEarmarkedCapital);

    if (totalActiveCapital + totalEarmarkedCapital > totalInvestable + 0.01) {
      warnings.push(`[Đầu tư] Tháng ${String(period.month)}/${String(period.year)}: Tổng vốn thương vụ hoạt động và chờ phân bổ (${(totalActiveCapital + totalEarmarkedCapital).toFixed(1)}M) vượt quá tổng ngân sách đầu tư khả dụng (${totalInvestable.toFixed(1)}M).`);
    }

    // Calculate savings deposits at this period
    let portfolioSavingsPrincipal = 0;
    let portfolioSavingsInterest = 0;
    let defenseSavingsPrincipal = 0;
    let defenseSavingsInterest = 0;
    
    savingsDeposits.forEach((dep) => {
      const state = savingsStates[dep.id] || { balance: 0, interest: 0 };
      const depStart = dep.startYear * 12 + dep.startMonth;
      const depEnd = dep.status === 'settled_early' && dep.settledYear && dep.settledMonth
        ? dep.settledYear * 12 + dep.settledMonth
        : Infinity;
      const current = period.year * 12 + period.month;
      if (current >= depStart && current <= depEnd) {
        const expectedInterest = state.interest;
        
        if (dep.pool === 'saving') {
          defenseSavingsPrincipal += state.balance;
          defenseSavingsInterest += expectedInterest;
        } else {
          portfolioSavingsPrincipal += state.balance;
          portfolioSavingsInterest += expectedInterest;
        }
      }
    });

    // Savings/Sinking interests are now naturally handled by matured amounts flowing into respective pools
    const totalYieldThisMonth = activeSavingsMaturedThisMonth_saving + activeSavingsMaturedThisMonth_unallocated + sinkingFundMaturedThisMonth_saving + sinkingFundMaturedThisMonth_unallocated + sinkingFundMaturedThisMonth_debtReserve;
    
    cumulativeContribution += monthlyContribution;
    cumulativePnl += (investmentPnl + totalYieldThisMonth); // Approximate total PnL generated

    const portfolioOutput = {
      assets: {
        fx_reserve_usd: { beginningBalance: 0, contribution: 0, pnl: 0, endingBalance: assetBalances.fx_reserve_usd, earmarkedEndingBalance: earmarkedBalances.fx_reserve_usd, actualReturnApplied: false },
        gold: { beginningBalance: 0, contribution: 0, pnl: 0, endingBalance: assetBalances.gold, earmarkedEndingBalance: earmarkedBalances.gold, actualReturnApplied: false },
        real_estate: { beginningBalance: 0, contribution: 0, pnl: 0, endingBalance: assetBalances.real_estate, earmarkedEndingBalance: earmarkedBalances.real_estate, actualReturnApplied: false },
        stocks: { beginningBalance: 0, contribution: 0, pnl: 0, endingBalance: assetBalances.stocks, earmarkedEndingBalance: earmarkedBalances.stocks, actualReturnApplied: false },
        crypto: { beginningBalance: 0, contribution: 0, pnl: 0, endingBalance: assetBalances.crypto, earmarkedEndingBalance: earmarkedBalances.crypto, actualReturnApplied: false },
      },
      totalBeginningBalance: previousTotalInvestable,
      totalContribution: monthlyContribution,
      totalPnl: investmentPnl + totalYieldThisMonth,
      totalEndingBalance: totalInvestable,
      unallocatedEndingBalance: Math.max(0, unallocatedCash - portfolioSavingsPrincipal),
      savingsBalance: portfolioSavingsPrincipal,
      savingsInterestAccrued: portfolioSavingsInterest,
      defenseSavingsBalance: defenseSavingsPrincipal,
      defenseSavingsInterestAccrued: defenseSavingsInterest,
      cumulativeContribution,
      cumulativePnl,
    };

    // Calculate Net Worth
    const nominalNetWorth = portfolioOutput.totalEndingBalance + currentSavingBalance + activeSinkingFundsBalance_saving + currentLiquidityBalance;

    // Calculate Real Value Today
    const inflationRate = safeNumber(assumptions.generalInflationRateAnnual, 0);
    const inflationRateRate = inflationRate > 1 ? inflationRate / 100 : inflationRate;
    const years = period.index / 12;
    const realNetWorth = nominalNetWorth / Math.pow(1 + inflationRateRate, years);

    // Calculate FIRE Target using fireEngine
    const fireRes = calculateFire({
      expensesMonthly: cashflowRes.expensesMonthly,
      netWorth: nominalNetWorth,
      withdrawalRate: 4,
      yearlyRows: [], // resolved at year aggregate step
    });

    const notes = [
      ...activePeriodEvents.map((e) => e.name),
      ...dealSettleNotes
    ];
    if (childCostRes.isActive && childCostRes.totalMonthly > 0) {
      if (childCostRes.childAge === 0 && period.month === profile.childBirthMonth) {
        notes.push(`Sinh con đầu lòng (${String(profile.childBirthYear)})`);
      } else if (childCostRes.childAge === 6 && period.month === profile.childBirthMonth) {
        notes.push('Con vào lớp 1');
      } else if (childCostRes.childAge === 18 && period.month === profile.childBirthMonth) {
        notes.push('Con vào Đại học');
      }
    }

    monthlyRows.push({
      period,
      incomeMonthly: incomeRes.incomeMonthly,
      expensesMonthly: cashflowRes.expensesMonthly,
      investmentMonthly: cashflowRes.investmentMonthly,
      savingMonthly: cashflowRes.savingMonthly,
      debtReserveMonthly: cashflowRes.debtReserveMonthly,
      liquidityMonthly: operationalCashflow,
      healthMonthly: 0,
      childCostMonthly: childCostRes.totalMonthly,
      lifeEventImpactMonthly: cashflowRes.lifeEventImpactMonthly + cashflowRes.oneTimeEventImpact,
      debtPaymentMonthly: activeDebtPaymentMonthly,
      netCashflowMonthly: cashflowRes.netCashflowMonthly,
      liquidityBalance: currentLiquidityBalance,
      healthBalance: 0,
      savingBalance: currentSavingBalance,
      debtReserveBalance: currentDebtReserveBalance,
      portfolio: portfolioOutput,
      propertyValue: assetBalances.real_estate,
      nominalNetWorth,
      realNetWorth,
      fireTarget: fireRes.fireTarget,
      fireProgress: fireRes.fireProgress,
      fireGap: fireRes.fireGap,
      notes,
      _activeSinkingFundsDebtReserve: activeSinkingFundsBalance_debtReserve,
      _totalDebtPrincipalRemaining: totalDebtPrincipalRemaining,
      _totalDebtInterestPaidMonthly: totalDebtInterestPaidMonthly,
    });
    
    // Attach additional runtime metrics to the row for aggregation later
    const lastRow = monthlyRows[monthlyRows.length - 1];
    lastRow._savingInterestRateAnnual = activeSavingRate;
    lastRow._customProfit = investmentPnl;
    lastRow._hasManualInvestmentAdj = hasManualInvestmentAdj;
    lastRow._savingPnl = savingPnl;
    lastRow._childCost1 = childCostRes.totalMonthly;
    lastRow._childCost2 = 0;
    lastRow._childCostOther = 0;
  });

  // 4. Aggregate monthly rows into yearly rows
  const yearlyRows: ProjectionYearlyRow[] = [];
  const yearsList = Array.from(new Set(monthlyRows.map((r) => r.period.year)));

  yearsList.forEach((yr) => {
    const yearRows = monthlyRows.filter((r) => r.period.year === yr);
    const lastRow = yearRows[yearRows.length - 1];

    const totalIncome = yearRows.reduce((sum, r) => sum + r.incomeMonthly, 0);
    const totalExpenses = yearRows.reduce((sum, r) => sum + r.expensesMonthly, 0);
    const totalDebtPayment = yearRows.reduce((sum, r) => sum + r.debtPaymentMonthly, 0);
    const avgInvestment = yearRows.reduce((sum, r) => sum + r.investmentMonthly, 0) / yearRows.length;
    const avgSaving = yearRows.reduce((sum, r) => sum + r.savingMonthly, 0) / yearRows.length;
    const avgDebtReserve = yearRows.reduce((sum, r) => sum + r.debtReserveMonthly, 0) / yearRows.length;
    
    const totalCustomProfit = yearRows.reduce((sum, r) => sum + (r._customProfit ?? 0), 0);
    const avgSavingRate = yearRows.reduce((sum, r) => sum + (r._savingInterestRateAnnual ?? 0), 0) / yearRows.length;
    
    // Child Cost details
    const totalChild1 = yearRows.reduce((sum, r) => sum + (r._childCost1 ?? 0), 0) / yearRows.length;
    const totalChild2 = yearRows.reduce((sum, r) => sum + (r._childCost2 ?? 0), 0) / yearRows.length;
    const totalChildOther = yearRows.reduce((sum, r) => sum + (r._childCostOther ?? 0), 0) / yearRows.length;
    const avgChildCost = yearRows.reduce((sum, r) => sum + r.childCostMonthly, 0) / yearRows.length;
    
    // PCF derived exactly from user request: PCF = lợi nhuận đầu tư hàng tháng + số dư tiết kiệm * 4%
    const avgMonthlyInvestmentProfit = totalCustomProfit / yearRows.length;
    // We assume 4% is an annual Safe Withdrawal Rate for savings, so divide by 12 for monthly PCF
    const pcfFromSaving = (lastRow.savingBalance * 0.04) / 12;
    const passiveCashFlowMonthly = avgMonthlyInvestmentProfit + pcfFromSaving;
    
    // Check if the year used any manual adjustment
    const usedManualAdj = yearRows.some((r) => r._hasManualInvestmentAdj);
    const activeInvestmentRateRate = totalCustomProfit > 0 && lastRow.portfolio.totalEndingBalance > 0 
      ? (totalCustomProfit / lastRow.portfolio.totalEndingBalance) 
      : (assumptions.investmentYieldExpectationAnnual / 100);

    const investmentReturnRateAnnualDisplay = usedManualAdj 
      ? (activeInvestmentRateRate * 100).toFixed(2)
      : assumptions.investmentYieldExpectationAnnual.toString();

    const eventNotes = Array.from(
      new Set(yearRows.flatMap((r) => r.notes).filter(Boolean))
    );

    // Calculate FIRE details for the end-of-year row
    const _yearlyFireRes = calculateFire({
      expensesMonthly: lastRow.expensesMonthly,
      netWorth: lastRow.nominalNetWorth,
      withdrawalRate: 4,
      yearlyRows, // pass in accumulated rows so far to calculate expectedFireYear
    });

    yearlyRows.push({
      year: yr,
      husbandAge: lastRow.period.husbandAge,
      wifeAge: lastRow.period.wifeAge,
      monthlyIncomeEndYear: lastRow.incomeMonthly,
      totalIncomeYearly: totalIncome,
      totalExpensesYearly: totalExpenses,
      totalDebtPaymentYearly: totalDebtPayment,
      averageInvestmentMonthly: avgInvestment,
      averageSavingMonthly: avgSaving,
      averageDebtReserveMonthly: avgDebtReserve,
      investmentReturnRateAnnual: Number(investmentReturnRateAnnualDisplay),
      savingInterestRateAnnual: Number(avgSavingRate.toFixed(2)),
      averageChildCostMonthly: avgChildCost,
      passiveCashFlowMonthly: passiveCashFlowMonthly,
      endingInvestmentBalance: lastRow.portfolio.totalEndingBalance,
      endingSavingBalance: lastRow.savingBalance,
      endingDebtReserveBalance: lastRow.debtReserveBalance,
      lifeEventNotes: eventNotes,
      nominalNetWorth: lastRow.nominalNetWorth,
      realNetWorth: lastRow.realNetWorth,
      fireTarget: lastRow.fireTarget,
      fireProgress: lastRow.fireProgress,
      notes: eventNotes,
    });
    
    // Store child breakdowns on the yearly row for the UI
    const lastYearRow = yearlyRows[yearlyRows.length - 1];
    lastYearRow._childCost1 = totalChild1;
    lastYearRow._childCost2 = totalChild2;
    lastYearRow._childCostOther = totalChildOther;
  });

  // 5. Run a final pass to evaluate crossing year across the fully populated yearly list
  yearlyRows.forEach((row) => {
    const finalFireRes = calculateFire({
      expensesMonthly: row.totalExpensesYearly / 12,
      netWorth: row.nominalNetWorth,
      withdrawalRate: 4,
      yearlyRows,
    });
    if (finalFireRes.expectedFireYear) {
      row.notes = Array.from(new Set([...row.notes, `Đạt mốc FIRE dự kiến vào năm ${String(finalFireRes.expectedFireYear)}`]));
    }
  });

  return {
    monthlyRows,
    yearlyRows,
    warnings: Array.from(new Set(warnings)),
  };
}
