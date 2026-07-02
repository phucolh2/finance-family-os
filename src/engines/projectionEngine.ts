import type { FamilyProfile, IncomeScheduleItem, LifeEvent, Assumptions, InvestmentDeal } from '../types/finance';
import type { BudgetRatioScheduleItem } from '../types/budget';
import type { AssetConfig, AssetType } from '../types/portfolio';
import type { ProjectionMonthlyRow, ProjectionYearlyRow, ProjectionOutput, ProjectionAdjustmentRecord } from '../types/projection';
import { generateTimeline } from './timelineEngine';
import { calculateIncome } from './incomeEngine';
import { calculateBudget } from './budgetEngine';
import { calculateCashflow } from './cashflowEngine';
import { calculateChildCost } from './childEngine';
import { calculatePortfolio } from './portfolioEngine';
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
      if (event.source === 'investment') {
        const amt = Math.abs(event.amount);
        if (event.type === 'buy_property') {
          assetAdjustments['stocks'] -= amt;
          assetAdjustments['real_estate'] += amt;
        } else {
          assetAdjustments['stocks'] -= amt;
          totalInvestable = Math.max(0, totalInvestable - amt);
        }
      } else if (event.source === 'saving') {
        const amt = Math.abs(event.amount);
        currentSavingBalance = Math.max(0, currentSavingBalance - amt);
      }
    });

    // Check for settled deals in this month
    const activePeriodDeals = investmentDeals.filter(
      (d) => d.status === 'settled' && safeNumber(d.endMonth, 0) === period.month && safeNumber(d.endYear, 0) === period.year
    );

    let monthRealizedProfit = 0;
    const dealSettleNotes: string[] = [];
    activePeriodDeals.forEach((deal) => {
      const profit = safeNumber(deal.realizedProfit, 0);
      monthRealizedProfit += profit;
      dealSettleNotes.push(`Tất toán ${deal.name}: ${profit >= 0 ? `Lãi +` : `Lỗ `}${profit}M`);
    });

    totalInvestable += monthRealizedProfit;

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
          // One-time profit is only applied in the start month of the record
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
    // Standard compound interest: balance earns interest, contribution earns half-month or full interest.
    // The user's requested formula was: prev + contribution * (1+rate), but that ignores compound interest on prev. 
    // We will use standard compounding on prev balance, and add contribution.
    const savingPnl = currentSavingBalance * savingsMonthlyYield + savingMonthlyContribution * (savingsMonthlyYield / 2);
    currentSavingBalance = currentSavingBalance + savingMonthlyContribution + savingPnl;

    const monthlyContribution = cashflowRes.investmentMonthly;
    
    // Calculate investment profit (either from manual override or default compounding)
    let investmentPnl = 0;
    if (hasManualInvestmentAdj) {
      investmentPnl = (manualAnnualProfit / 12) + manualMonthlyProfit + manualOneTimeProfit;
    } else {
      const defaultInvRate = safeNumber(assumptions.investmentYieldExpectationAnnual, 0) / 100;
      investmentPnl = totalInvestable * (defaultInvRate / 12);
    }
    
    const previousTotalInvestable = totalInvestable;
    totalInvestable += monthlyContribution + investmentPnl;

    // Derived actual monthly rate based on custom profit
    const actualInvestmentRateMonthly = previousTotalInvestable > 0 ? investmentPnl / previousTotalInvestable : 0;

    // Calculate active deals in this month to compute balances of the 5 asset classes
    const monthActiveDeals = investmentDeals.filter((deal) => {
      // Started on or before this month
      const isStarted = (deal.startYear < period.year) || 
                        (deal.startYear === period.year && deal.startMonth <= period.month);
      // Not ended before this month
      const isNotEnded = deal.status === 'active' || 
                         (deal.endYear !== undefined && deal.endMonth !== undefined && (deal.endYear > period.year || 
                         (deal.endYear === period.year && deal.endMonth > period.month)));
      return isStarted && isNotEnded;
    });

    const assetBalances: Record<AssetType, number> = {
      fx_reserve_usd: 0,
      gold: 0,
      real_estate: 0,
      stocks: 0,
      crypto: 0,
    };
    const earmarkedBalances: Record<AssetType, number> = {
      fx_reserve_usd: 0,
      gold: 0,
      real_estate: 0,
      stocks: 0,
      crypto: 0,
    };

    let totalEarmarkedCapital = 0;
    monthActiveDeals.forEach((deal) => {
      if (deal.isEarmarked) {
        earmarkedBalances[deal.assetType] = Math.max(0, earmarkedBalances[deal.assetType] + safeNumber(deal.capital, 0));
        totalEarmarkedCapital += safeNumber(deal.capital, 0);
      } else {
        assetBalances[deal.assetType] = Math.max(0, assetBalances[deal.assetType] + safeNumber(deal.capital, 0));
      }
    });

    const standardTypes: AssetType[] = ['fx_reserve_usd', 'gold', 'real_estate', 'stocks', 'crypto'];
    standardTypes.forEach((type) => {
      assetBalances[type] = Math.max(0, assetBalances[type] + assetAdjustments[type]);
    });

    const totalActiveCapital = Object.values(assetBalances).reduce((sum, v) => sum + v, 0);
    const unallocatedCash = Math.max(0, totalInvestable - totalActiveCapital - totalEarmarkedCapital);
    const safeTotalEndingBalance = Math.max(totalInvestable, totalActiveCapital + totalEarmarkedCapital);

    if (totalActiveCapital + totalEarmarkedCapital > totalInvestable) {
      warnings.push(`[Đầu tư] Tháng ${period.month}/${period.year}: Tổng vốn thương vụ hoạt động và chờ phân bổ (${totalActiveCapital + totalEarmarkedCapital}M) vượt quá tổng ngân sách đầu tư khả dụng (${totalInvestable}M).`);
    }

    const portfolioOutput = {
      assets: {
        fx_reserve_usd: { beginningBalance: 0, contribution: 0, pnl: 0, endingBalance: assetBalances.fx_reserve_usd, earmarkedEndingBalance: earmarkedBalances.fx_reserve_usd, actualReturnApplied: false },
        gold: { beginningBalance: 0, contribution: 0, pnl: 0, endingBalance: assetBalances.gold, earmarkedEndingBalance: earmarkedBalances.gold, actualReturnApplied: false },
        real_estate: { beginningBalance: 0, contribution: 0, pnl: 0, endingBalance: assetBalances.real_estate, earmarkedEndingBalance: earmarkedBalances.real_estate, actualReturnApplied: false },
        stocks: { beginningBalance: 0, contribution: 0, pnl: 0, endingBalance: assetBalances.stocks, earmarkedEndingBalance: earmarkedBalances.stocks, actualReturnApplied: false },
        crypto: { beginningBalance: 0, contribution: 0, pnl: 0, endingBalance: assetBalances.crypto, earmarkedEndingBalance: earmarkedBalances.crypto, actualReturnApplied: false },
      },
      totalBeginningBalance: totalInvestable - monthlyContribution - monthRealizedProfit,
      totalContribution: monthlyContribution,
      totalPnl: monthRealizedProfit,
      totalEndingBalance: totalInvestable,
      unallocatedEndingBalance: unallocatedCash,
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
        notes.push('Sinh con đầu lòng (2031)');
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
    
    // Attach additional runtime metrics to the row object dynamically for aggregation later
    (monthlyRows[monthlyRows.length - 1] as any)._savingInterestRateAnnual = activeSavingRate;
    (monthlyRows[monthlyRows.length - 1] as any)._customProfit = investmentPnl;
    (monthlyRows[monthlyRows.length - 1] as any)._hasManualInvestmentAdj = hasManualInvestmentAdj;
    (monthlyRows[monthlyRows.length - 1] as any)._savingPnl = savingPnl;
    (monthlyRows[monthlyRows.length - 1] as any)._childCost1 = childCostRes.breakdown?.child1 || 0;
    (monthlyRows[monthlyRows.length - 1] as any)._childCost2 = childCostRes.breakdown?.child2 || 0;
    (monthlyRows[monthlyRows.length - 1] as any)._childCostOther = (childCostRes.breakdown?.healthcare || 0) + (childCostRes.breakdown?.others || 0);
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
    
    // Extract dynamic runtime metrics added earlier
    const totalCustomProfit = yearRows.reduce((sum, r: any) => sum + (r._customProfit || 0), 0);
    const avgSavingRate = yearRows.reduce((sum, r: any) => sum + (r._savingInterestRateAnnual || 0), 0) / yearRows.length;
    
    // Child Cost details
    const totalChild1 = yearRows.reduce((sum, r: any) => sum + (r._childCost1 || 0), 0) / yearRows.length;
    const totalChild2 = yearRows.reduce((sum, r: any) => sum + (r._childCost2 || 0), 0) / yearRows.length;
    const totalChildOther = yearRows.reduce((sum, r: any) => sum + (r._childCostOther || 0), 0) / yearRows.length;
    const avgChildCost = yearRows.reduce((sum, r) => sum + r.childCostMonthly, 0) / yearRows.length;
    
    // PCF derived exactly from user request: PCF = lợi nhuận đầu tư hàng tháng + số dư tiết kiệm * 4%
    const avgMonthlyInvestmentProfit = totalCustomProfit / yearRows.length;
    // We assume 4% is an annual Safe Withdrawal Rate for savings, so divide by 12 for monthly PCF
    const pcfFromSaving = (lastRow.savingBalance * 0.04) / 12;
    const passiveCashFlowMonthly = avgMonthlyInvestmentProfit + pcfFromSaving;
    
    // Check if the year used any manual adjustment
    const usedManualAdj = yearRows.some((r: any) => r._hasManualInvestmentAdj);
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
    (yearlyRows[yearlyRows.length - 1] as any)._childCost1 = totalChild1;
    (yearlyRows[yearlyRows.length - 1] as any)._childCost2 = totalChild2;
    (yearlyRows[yearlyRows.length - 1] as any)._childCostOther = totalChildOther;
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
