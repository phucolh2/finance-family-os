import { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { analyzeExpense } from '../engines/expenseEngine';

export const useLiquidityBreakdown = () => {
  const { state, selectedPeriodKey } = useAppContext();

  const activePeriodKey = useMemo(() => {
    if (selectedPeriodKey) return selectedPeriodKey;
    
    const now = new Date();
    const nowMonth = now.getMonth() + 1;
    const nowYear = now.getFullYear();
    const startYear = state.profile?.planningStartYear || nowYear;
    const startMonth = state.profile?.planningStartMonth || nowMonth;
    
    if (nowYear < startYear || (nowYear === startYear && nowMonth < startMonth)) {
      return `${startYear}-${String(startMonth).padStart(2, '0')}`;
    }
    return `${nowYear}-${String(nowMonth).padStart(2, '0')}`;
  }, [selectedPeriodKey, state.profile]);

  const activeBudget = useMemo(() => {
    let budget = state.budgetSchedule.length > 0 ? state.budgetSchedule[state.budgetSchedule.length - 1] : null;
    if (activePeriodKey) {
      const parts = activePeriodKey.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const monthValue = year * 12 + month;
      
      const applicableBudgets = state.budgetSchedule.filter(
        (b) => b.effectiveYear * 12 + b.effectiveMonth <= monthValue
      );
      if (applicableBudgets.length > 0) {
        applicableBudgets.sort((a,b) => (b.effectiveYear * 12 + b.effectiveMonth) - (a.effectiveYear * 12 + a.effectiveMonth));
        budget = applicableBudgets[0];
      }
    }
    return budget;
  }, [state.budgetSchedule, activePeriodKey]);

  const expenseData = useMemo(() => {
    const budgetTree = activeBudget ? activeBudget.rootGroups : [];
    const expenseTree = budgetTree.filter((g: any) => g.classification === 'expense');
    const expenseGroupIds = expenseTree.map((g: any) => g.groupId as string);
    return analyzeExpense(state.resolvedMonthlyDb || [], state.lifeEvents, activePeriodKey, expenseGroupIds);
  }, [state.resolvedMonthlyDb, state.lifeEvents, activePeriodKey, activeBudget]);

  const liquidityBreakdownData = useMemo(() => {
    const budgetTree = activeBudget ? activeBudget.rootGroups : [];
    const expenseTree = budgetTree.filter((g: any) => g.classification === 'expense');

    const [selYearStr, selMonthStr] = activePeriodKey.split('-');
    const selYear = parseInt(selYearStr, 10);
    const selMonth = parseInt(selMonthStr, 10);
    const selMonthValue = selYear * 12 + selMonth;
    const pKey = `${selYearStr}-${String(selMonth).padStart(2, '0')}`;

    const deductedByGroup: Record<string, number> = {};
    (state.sinkingFunds || []).forEach(fund => {
       if (fund.status !== 'active') return;
       if (!fund.sourceOfFund?.startsWith('expense_surplus_')) return;
       const groupId = fund.sourceOfFund.replace('expense_surplus_', '');
       
       const startMonthValue = fund.startYear * 12 + fund.startMonth;
       if (selMonthValue >= startMonthValue) {
          let deduction = 0;
          if (selMonthValue === startMonthValue) {
             deduction += fund.initialDeposit || 0;
          }
          const contrib = fund.periodConfigs?.[pKey]?.contribution !== undefined ? fund.periodConfigs[pKey].contribution : fund.monthlyContribution;
          deduction += contrib || 0;
          
          deductedByGroup[groupId] = (deductedByGroup[groupId] || 0) + deduction;
       }
    });

    return expenseTree.map((g: any) => {
      const sum = expenseData.summaryByGroup[g.groupId] || { totalBudget: 0, totalActual: 0 };
      const rawRemaining = Math.max(0, sum.totalBudget - sum.totalActual);
      const deducted = deductedByGroup[g.id] || 0;
      const remaining = Math.max(0, rawRemaining - deducted);
      
      const children = (g.children || []).map((child: any) => {
        const catSum = expenseData.summaryByCategory?.[child.id] || { totalBudget: 0, totalActual: 0 };
        const childRemaining = Math.max(0, catSum.totalBudget - catSum.totalActual);
        return {
          id: child.id,
          name: child.name,
          remaining: childRemaining, // Children don't have sinking funds directly
          totalBudget: catSum.totalBudget,
          totalActual: catSum.totalActual,
          deducted: 0,
          sortOrder: child.sortOrder || 0
        };
      }).sort((a: any, b: any) => a.sortOrder - b.sortOrder);

      return {
        id: g.id,
        name: g.name,
        remaining,
        deducted,
        totalBudget: sum.totalBudget,
        totalActual: sum.totalActual,
        sortOrder: g.sortOrder || 0,
        children
      };
    }).sort((a: any, b: any) => a.sortOrder - b.sortOrder);
  }, [activeBudget, expenseData.summaryByGroup, expenseData.summaryByCategory, state.sinkingFunds, activePeriodKey]);

  const totalBudgetSum = useMemo(() => liquidityBreakdownData.reduce((sum, g) => sum + g.totalBudget, 0), [liquidityBreakdownData]);
  const totalActualSum = useMemo(() => liquidityBreakdownData.reduce((sum, g) => sum + g.totalActual, 0), [liquidityBreakdownData]);
  const totalDeductedSum = useMemo(() => liquidityBreakdownData.reduce((sum, g) => sum + g.deducted, 0), [liquidityBreakdownData]);
  const totalRemainingSum = useMemo(() => liquidityBreakdownData.reduce((sum, g) => sum + g.remaining, 0), [liquidityBreakdownData]);

  return {
    liquidityBreakdownData,
    totalBudgetSum,
    totalActualSum,
    totalDeductedSum,
    totalRemainingSum,
    selectedPeriodKey: activePeriodKey
  };
};
