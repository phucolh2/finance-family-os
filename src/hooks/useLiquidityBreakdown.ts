import { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { analyzeExpense } from '../engines/expenseEngine';

export const useLiquidityBreakdown = () => {
  const { state, selectedPeriodKey } = useAppContext();

  const activeBudget = useMemo(() => {
    let budget = state.budgetSchedule.length > 0 ? state.budgetSchedule[state.budgetSchedule.length - 1] : null;
    if (selectedPeriodKey) {
      const parts = selectedPeriodKey.split('-');
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
  }, [state.budgetSchedule, selectedPeriodKey]);

  const expenseData = useMemo(() => {
    const budgetTree = activeBudget ? activeBudget.rootGroups : [];
    const expenseTree = budgetTree.filter((g: any) => g.classification === 'expense');
    const expenseGroupIds = expenseTree.map((g: any) => g.groupId as string);
    return analyzeExpense(state.resolvedMonthlyDb || [], state.lifeEvents, selectedPeriodKey, expenseGroupIds);
  }, [state.resolvedMonthlyDb, state.lifeEvents, selectedPeriodKey, activeBudget]);

  const liquidityBreakdownData = useMemo(() => {
    const budgetTree = activeBudget ? activeBudget.rootGroups : [];
    const expenseTree = budgetTree.filter((g: any) => g.classification === 'expense');

    return expenseTree.map((g: any) => {
      const sum = expenseData.summaryByGroup[g.groupId] || { totalBudget: 0, totalActual: 0 };
      const remaining = Math.max(0, sum.totalBudget - sum.totalActual);
      
      const children = (g.children || []).map((child: any) => {
        const catSum = expenseData.summaryByCategory?.[child.id] || { totalBudget: 0, totalActual: 0 };
        const childRemaining = Math.max(0, catSum.totalBudget - catSum.totalActual);
        return {
          id: child.id,
          name: child.name,
          remaining: childRemaining,
          totalBudget: catSum.totalBudget,
          totalActual: catSum.totalActual,
          sortOrder: child.sortOrder || 0
        };
      }).sort((a: any, b: any) => a.sortOrder - b.sortOrder);

      return {
        id: g.id,
        name: g.name,
        remaining,
        totalBudget: sum.totalBudget,
        totalActual: sum.totalActual,
        sortOrder: g.sortOrder || 0,
        children
      };
    }).sort((a: any, b: any) => a.sortOrder - b.sortOrder);
  }, [activeBudget, expenseData.summaryByGroup, expenseData.summaryByCategory]);

  const totalBudgetSum = useMemo(() => liquidityBreakdownData.reduce((sum, g) => sum + g.totalBudget, 0), [liquidityBreakdownData]);
  const totalActualSum = useMemo(() => liquidityBreakdownData.reduce((sum, g) => sum + g.totalActual, 0), [liquidityBreakdownData]);
  const totalRemainingSum = useMemo(() => liquidityBreakdownData.reduce((sum, g) => sum + g.remaining, 0), [liquidityBreakdownData]);

  return {
    liquidityBreakdownData,
    totalBudgetSum,
    totalActualSum,
    totalRemainingSum,
    selectedPeriodKey
  };
};
