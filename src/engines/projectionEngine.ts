import type { FamilyProfile, IncomeScheduleItem, LifeEvent, Assumptions, InvestmentDeal, SavingsDeposit } from '../types/finance';
import type { BudgetRatioScheduleItem } from '../types/budget';
import type { AssetConfig, AssetType } from '../types/portfolio';
import type { ProjectionMonthlyRow, ProjectionYearlyRow, ProjectionOutput, ProjectionAdjustmentRecord } from '../types/projection';
import { generateTimeline } from './timelineEngine';
import { calculateIncome } from './incomeEngine';
import { calculateBudget } from './budgetEngine';
import { calculateCashflow } from './cashflowEngine';
import { calculateChildCost } from './childEngine';
import { calculateFire } from './fireEngine';
import { safeNumber, safeArray } from '../utils/math';

export interface ProjectionEngineInput {
  profile: FamilyProfile;
  incomeSchedule: IncomeScheduleItem[];
  budgetSchedule: BudgetRatioScheduleItem[];
  lifeEvents: LifeEvent[];
  assets: AssetConfig[];
  assumptions: Assumptions;
  investmentDeals?: InvestmentDeal[];
  savingsDeposits?: SavingsDeposit[];
  projectionAdjustments?: ProjectionAdjustmentRecord[];
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
  const lifeEvents = safeArray(input.lifeEvents);
  const assets = safeArray(input.assets);
  const assumptions = input.assumptions;
  const investmentDeals = safeArray(input.investmentDeals);
  const savingsDeposits = safeArray(input.savingsDeposits);
  const projectionAdjustments = safeArray(input.projectionAdjustments);

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
  let currentSavingBalance = 0;
  let totalInvestable = safeNumber(profile.startingCapital, 100);
  let cumulativeContribution = 0;
  let cumulativePnl = 0;

  const assetAdjustments: Record<AssetType, number> = {
    fx_reserve_usd: 0,
    gold: 0,
    real_estate: 0,
    stocks: 0,
    crypto: 0,
  };

  const monthlyRows: ProjectionMonthlyRow[] = [];

  // 3. Simulation loop
  timelineResult.periods.forEach((period) => {
    // Resolve Income
    const incomeRes = calculateIncome({ period, incomeSchedule });
    warnings.push(...incomeRes.warnings.map(w => `[Thu nhập] ${w}`));

    // Calculate Child Cost
    const childCostRes = calculateChildCost({
      period,
      childBirthMonth: profile.childBirthMonth,
      childBirthYear: profile.childBirthYear,
      lifestyle: 'premium',
      budgetCapMonthly: 35,
      educationInflationAnnual: assumptions.educationInflationRateAnnual,
      healthInflationAnnual: assumptions.medicalInflationRateAnnual,
      generalInflationAnnual: assumptions.generalInflationRateAnnual,
    });

    // Resolve Budget (Inject childCost)
    const budgetRes = calculateBudget({
      period,
      incomeMonthly: incomeRes.incomeMonthly,
      budgetSchedule,
      childCost: childCostRes,
    });
    warnings.push(...budgetRes.warnings.map(w => `[Ngân sách] ${w}`));

    // Resolve Cashflow
    const cashflowRes = calculateCashflow({
      period,
      budget: budgetRes,
      lifeEvents,
    });
    warnings.push(...cashflowRes.warnings.map(w => `[Dòng tiền] ${w}`));

    // Handle Life Event balances directly
    const activePeriodEvents = lifeEvents.filter(
      (e) => safeNumber(e.month) === period.month && safeNumber(e.year) === period.year
    );

    activePeriodEvents.forEach((event) => {
      const amt = event.amount; // âm là chi tiền, dương là nhận tiền
      if (event.source === 'investment' || event.source === 'future_investing') {
        if (event.type === 'buy_property') {
          // Chỉ chuyển đổi tài sản từ stocks sang real_estate (amount là số âm khi mua)
          assetAdjustments['stocks'] += amt; // amt âm -> trừ stocks
          assetAdjustments['real_estate'] -= amt; // trừ trừ thành cộng
        } else {
          assetAdjustments['stocks'] += amt;
          totalInvestable = Math.max(0, totalInvestable + amt);
        }
      } else {
        // safety_reserve, family_experience, housing_basic, health_growth, saving, v.v...
        currentSavingBalance = Math.max(0, currentSavingBalance + amt);
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
        const monthsActiveUpToLastMonth = current - start;
        let acc = 0;
        if (deal.status === 'settled') {
          const investStart = deal.isConverted && deal.conversionYear && deal.conversionMonth
            ? deal.conversionYear * 12 + deal.conversionMonth
            : start;
          const duration = end - investStart + 1;
          acc = (safeNumber(deal.realizedProfit, 0) / duration) * Math.max(0, current - investStart);
        }
        activeValueUpToLastMonth += safeNumber(deal.capital, 0) + acc;
      }
    });

    const unallocatedForCompounding = Math.max(0, totalInvestable - activeValueUpToLastMonth);

    // Evaluate adjustments for the current month
    let adjustedSavingRate: number | null = null;
    let manualAnnualProfit = 0;
    let manualMonthlyProfit = 0;
    let manualOneTimeProfit = 0;
    let hasManualInvestmentAdj = false;

    projectionAdjustments.forEach(adj => {
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
    });

    const activeSavingRate = adjustedSavingRate != null ? adjustedSavingRate : safeNumber(assumptions.savingsInterestRateAnnual, 0);
    const savingsRateRatio = activeSavingRate > 1 ? activeSavingRate / 100 : activeSavingRate;
    const savingsMonthlyYield = savingsRateRatio / 12;

    const savingMonthlyContribution = cashflowRes.savingMonthly;
    const savingPnl = currentSavingBalance * savingsMonthlyYield + savingMonthlyContribution * (savingsMonthlyYield / 2);
    currentSavingBalance = currentSavingBalance + savingMonthlyContribution + savingPnl;

    const monthlyContribution = cashflowRes.investmentMonthly;
    
    // Calculate generic investment profit (on unallocated cash only)
    let genericPnl = 0;
    if (hasManualInvestmentAdj) {
      genericPnl = (manualAnnualProfit / 12) + manualMonthlyProfit + manualOneTimeProfit;
    } else {
      const defaultInvRate = safeNumber(assumptions.investmentYieldExpectationAnnual, 0) / 100;
      genericPnl = unallocatedForCompounding * (defaultInvRate / 12);
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
      
      const isOriginallyEarmarked = deal.isEarmarked || deal.isConverted;
      const term = safeNumber(deal.savingTermMonths, 12);
      const maturity = start + term;
      const conversion = (deal.isConverted && deal.conversionYear && deal.conversionMonth)
        ? (deal.conversionYear * 12 + deal.conversionMonth)
        : Infinity;
      const savingEnd = isOriginallyEarmarked ? Math.min(maturity, conversion, end) : start;

      if (current >= start && current <= end) {
        if (deal.status === 'settled') {
          const investStart = deal.isConverted && deal.conversionYear && deal.conversionMonth
            ? deal.conversionYear * 12 + deal.conversionMonth
            : start;
          if (current >= investStart && current <= end) {
            const duration = end - investStart + 1;
            totalDealPnlThisMonth += safeNumber(deal.realizedProfit, 0) / duration;
          }
        }
      }

      // One-time savings interest payout at the savingEnd month
      if (isOriginallyEarmarked && current === savingEnd) {
        const monthsSavingsActive = savingEnd - start;
        if (monthsSavingsActive > 0) {
          const rate = safeNumber(deal.expectedSavingRate, 0);
          const totalSavingsInterest = deal.capital * (rate / 100 / 12) * monthsSavingsActive;
          totalDealPnlThisMonth += totalSavingsInterest;
          
          let cause = "đáo hạn";
          if (savingEnd === conversion) cause = "chuyển sang đầu tư";
          else if (savingEnd === end) cause = "tất toán";
          dealSettleNotes.push(`Ghi nhận lãi tiết kiệm (${cause}) của ${deal.name}: +${totalSavingsInterest.toFixed(2)}M`);
        }
      }

      if (deal.status === 'settled' && deal.endMonth === period.month && deal.endYear === period.year) {
        const profit = safeNumber(deal.realizedProfit, 0);
        dealSettleNotes.push(`Tất toán ${deal.name}: ${profit >= 0 ? `Lãi +` : `Lỗ `}${profit}M`);
      }
    });

    const investmentPnl = genericPnl + totalDealPnlThisMonth;
    const previousTotalInvestable = totalInvestable;
    totalInvestable += monthlyContribution + investmentPnl;

    // Derived actual monthly rate based on custom profit
    const actualInvestmentRateMonthly = previousTotalInvestable > 0 ? investmentPnl / previousTotalInvestable : 0;

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
      
      if (current >= start && current <= end) {
        const isOriginallyEarmarked = deal.isEarmarked || deal.isConverted;
        const term = safeNumber(deal.savingTermMonths, 12);
        const maturity = start + term;
        const conversion = (deal.isConverted && deal.conversionYear && deal.conversionMonth)
          ? (deal.conversionYear * 12 + deal.conversionMonth)
          : Infinity;
        const savingEnd = isOriginallyEarmarked ? Math.min(maturity, conversion, end) : start;

        // Is it currently earmarked in this month?
        const isCurrentlyEarmarked = isOriginallyEarmarked && current < conversion;

        let accumulatedPnl = 0;
        if (deal.status === 'settled') {
          const investStart = deal.isConverted && deal.conversionYear && deal.conversionMonth
            ? deal.conversionYear * 12 + deal.conversionMonth
            : start;
          if (current >= investStart) {
            const duration = end - investStart + 1;
            const monthsActiveSoFar = current - investStart + 1;
            accumulatedPnl = (safeNumber(deal.realizedProfit, 0) / duration) * monthsActiveSoFar;
          }
        } else if (isCurrentlyEarmarked) {
          // Earmarked saving interest accumulation
          const rate = safeNumber(deal.expectedSavingRate, 0);
          const monthsActive = current < savingEnd ? current - start + 1 : savingEnd - start;
          accumulatedPnl = safeNumber(deal.capital, 0) * (rate / 100 / 12) * monthsActive;
        }

        const totalValue = safeNumber(deal.capital, 0) + (isCurrentlyEarmarked ? accumulatedPnl : 0);
        
        if (isCurrentlyEarmarked) {
          earmarkedBalances[deal.assetType] += totalValue;
          totalEarmarkedCapital += totalValue;
        } else {
          // If settled or regular active, add to active assets. Note that for settled deals we add the accrued profit too.
          assetBalances[deal.assetType] += totalValue + (deal.status === 'settled' ? accumulatedPnl : 0);
        }
      }
    });

    const standardTypes: AssetType[] = ['fx_reserve_usd', 'gold', 'real_estate', 'stocks', 'crypto'];
    standardTypes.forEach((type) => {
      assetBalances[type] = Math.max(0, assetBalances[type] + assetAdjustments[type]);
    });

    const totalActiveCapital = Object.values(assetBalances).reduce((sum, v) => sum + v, 0);
    const unallocatedCash = Math.max(0, totalInvestable - totalActiveCapital - totalEarmarkedCapital);
    const safeTotalEndingBalance = Math.max(totalInvestable, totalActiveCapital + totalEarmarkedCapital);

    if (totalActiveCapital + totalEarmarkedCapital > totalInvestable + 0.01) {
      warnings.push(`[Đầu tư] Tháng ${period.month}/${period.year}: Tổng vốn thương vụ hoạt động và chờ phân bổ (${(totalActiveCapital + totalEarmarkedCapital).toFixed(1)}M) vượt quá tổng ngân sách đầu tư khả dụng (${totalInvestable.toFixed(1)}M).`);
    }

    // Calculate savings deposits at this period
    let totalSavingsPrincipal = 0;
    let totalSavingsInterest = 0;
    savingsDeposits.forEach((dep) => {
      if (dep.status !== 'active') return;
      const depStart = dep.startYear * 12 + dep.startMonth;
      const depEnd = depStart + dep.termMonths;
      const current = period.year * 12 + period.month;
      if (current >= depStart && current < depEnd) {
        const monthsActive = current - depStart + 1;
        const monthlyRate = safeNumber(dep.interestRateAnnual, 0) / 100 / 12;
        const interest = dep.principal * monthlyRate * monthsActive;
        totalSavingsPrincipal += dep.principal;
        totalSavingsInterest += interest;
      }
    });

    // Savings interest contributes to totalInvestable growth
    const savingsInterestThisMonth = (() => {
      let interest = 0;
      savingsDeposits.forEach((dep) => {
        if (dep.status !== 'active') return;
        const depStart = dep.startYear * 12 + dep.startMonth;
        const depEnd = depStart + dep.termMonths;
        const current = period.year * 12 + period.month;
        if (current >= depStart && current < depEnd) {
          interest += dep.principal * (safeNumber(dep.interestRateAnnual, 0) / 100 / 12);
        }
      });
      return interest;
    })();
    totalInvestable += savingsInterestThisMonth;
    
    cumulativeContribution += monthlyContribution;
    cumulativePnl += (investmentPnl + savingsInterestThisMonth);

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
      totalPnl: investmentPnl + savingsInterestThisMonth,
      totalEndingBalance: totalInvestable,
      unallocatedEndingBalance: Math.max(0, unallocatedCash - totalSavingsPrincipal),
      savingsBalance: totalSavingsPrincipal,
      savingsInterestAccrued: totalSavingsInterest,
      cumulativeContribution,
      cumulativePnl,
    };

    // Calculate Net Worth
    const nominalNetWorth = portfolioOutput.totalEndingBalance + currentSavingBalance;

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
        notes.push(`Sinh con đầu lòng (${profile.childBirthYear})`);
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
      liquidityMonthly: 0,
      healthMonthly: 0,
      childCostMonthly: childCostRes.totalMonthly,
      lifeEventImpactMonthly: cashflowRes.lifeEventImpactMonthly + cashflowRes.oneTimeEventImpact,
      netCashflowMonthly: cashflowRes.netCashflowMonthly,
      liquidityBalance: 0,
      healthBalance: 0,
      savingBalance: currentSavingBalance,
      portfolio: portfolioOutput,
      propertyValue: assetBalances['real_estate'],
      nominalNetWorth,
      realNetWorth,
      fireTarget: fireRes.fireTarget,
      fireProgress: fireRes.fireProgress,
      fireGap: fireRes.fireGap,
      notes,
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
    const avgInvestment = yearRows.reduce((sum, r) => sum + r.investmentMonthly, 0) / yearRows.length;
    const avgSaving = yearRows.reduce((sum, r) => sum + r.savingMonthly, 0) / yearRows.length;
    
    const totalCustomProfit = yearRows.reduce((sum, r) => sum + (r._customProfit || 0), 0);
    const avgSavingRate = yearRows.reduce((sum, r) => sum + (r._savingInterestRateAnnual || 0), 0) / yearRows.length;
    
    // Child Cost details
    const totalChild1 = yearRows.reduce((sum, r) => sum + (r._childCost1 || 0), 0) / yearRows.length;
    const totalChild2 = yearRows.reduce((sum, r) => sum + (r._childCost2 || 0), 0) / yearRows.length;
    const totalChildOther = yearRows.reduce((sum, r) => sum + (r._childCostOther || 0), 0) / yearRows.length;
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
    const yearlyFireRes = calculateFire({
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
      averageInvestmentMonthly: avgInvestment,
      averageSavingMonthly: avgSaving,
      investmentReturnRateAnnual: Number(investmentReturnRateAnnualDisplay),
      savingInterestRateAnnual: Number(avgSavingRate.toFixed(2)),
      averageChildCostMonthly: avgChildCost,
      passiveCashFlowMonthly: passiveCashFlowMonthly,
      endingInvestmentBalance: lastRow.portfolio.totalEndingBalance,
      endingSavingBalance: lastRow.savingBalance,
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
      row.notes = Array.from(new Set([...row.notes, `Đạt mốc FIRE dự kiến vào năm ${finalFireRes.expectedFireYear}`]));
    }
  });

  return {
    monthlyRows,
    yearlyRows,
    warnings: Array.from(new Set(warnings)),
  };
}
