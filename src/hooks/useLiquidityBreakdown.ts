import { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { analyzeExpense } from '../engines/expenseEngine';

export const useLiquidityBreakdown = (mode: 'monthly' | 'cumulative' = 'monthly') => {
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

  // Removed unused cumulative expenseData
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
          if (mode === 'monthly') {
             if (selMonthValue === startMonthValue) {
                deduction += fund.initialDeposit || 0;
             }
             const contrib = fund.periodConfigs?.[pKey]?.contribution !== undefined ? fund.periodConfigs[pKey].contribution : fund.monthlyContribution;
             deduction += contrib || 0;
          } else {
             deduction += fund.initialDeposit || 0;
             for (let m = startMonthValue; m <= selMonthValue; m++) {
                const y = Math.floor((m - 1) / 12);
                const monthStr = String(((m - 1) % 12) + 1).padStart(2, '0');
                const loopKey = `${y}-${monthStr}`;
                const contrib = fund.periodConfigs?.[loopKey]?.contribution !== undefined ? fund.periodConfigs[loopKey].contribution : fund.monthlyContribution;
                deduction += contrib || 0;
             }
          }
          
          deductedByGroup[groupId] = (deductedByGroup[groupId] || 0) + deduction;
       }
    });

    const flexibleByGroup: Record<string, number> = {};
    (state.lifeEvents || []).forEach(event => {
      const eMonthValue = event.year * 12 + event.month;
      if (mode === 'monthly') {
        if (event.month === selMonth && event.year === selYear) {
          flexibleByGroup[event.source] = (flexibleByGroup[event.source] || 0) + event.amount;
        }
      } else {
        if (eMonthValue <= selMonthValue) {
          flexibleByGroup[event.source] = (flexibleByGroup[event.source] || 0) + event.amount;
        }
      }
    });

    const targetDb = (state.resolvedMonthlyDb || []).find(db => db.periodKey === activePeriodKey);
    const cumulativeExpenseData = mode === 'cumulative' 
      ? analyzeExpense(state.resolvedMonthlyDb || [], state.lifeEvents, activePeriodKey, expenseTree.map((g: any) => g.groupId as string))
      : null;

    return expenseTree.map((g: any) => {
      let totalBudget = 0;
      let totalActual = 0;
      
      const flexible = flexibleByGroup[g.groupId] || 0;

      if (mode === 'monthly') {
        totalBudget = targetDb?.budgetAmounts?.[g.groupId] || 0;
        if (targetDb?.actualExpenseByGroup && typeof targetDb.actualExpenseByGroup[g.groupId] === 'number') {
          totalActual = targetDb.actualExpenseByGroup[g.groupId];
        } else if (targetDb?.actualExpenseCategories) {
          (g.children || []).forEach((child: any) => {
            totalActual += targetDb.actualExpenseCategories![child.id] || 0;
          });
        }
      } else {
        totalBudget = cumulativeExpenseData?.summaryByGroup?.[g.groupId]?.totalBudget || 0;
        // cumulativeExpenseData already includes flexible in totalActual, so we subtract it here to separate it
        totalActual = (cumulativeExpenseData?.summaryByGroup?.[g.groupId]?.totalActual || 0) - flexible;
      }


      const rawRemaining = Math.max(0, totalBudget - totalActual);
      const deducted = deductedByGroup[g.groupId] || 0;
      const remaining = rawRemaining - deducted - flexible;
      
      const children = (g.children || []).map((child: any) => {
        let catBudget = 0;
        let catActual = 0;
        
        if (mode === 'monthly') {
          catBudget = targetDb?.budgetAmountsByCategory?.[child.id] || 0;
          catActual = targetDb?.actualExpenseCategories?.[child.id] || 0;
        } else {
          catBudget = cumulativeExpenseData?.summaryByCategory?.[child.id]?.totalBudget || 0;
          catActual = cumulativeExpenseData?.summaryByCategory?.[child.id]?.totalActual || 0;
        }
        
        const childRemaining = Math.max(0, catBudget - catActual);

        return {
          id: child.id,
          name: child.name,
          remaining: childRemaining, // Children don't have sinking funds directly
          totalBudget: catBudget,
          totalActual: catActual,
          deducted: 0,
          flexible: 0,
          sortOrder: child.sortOrder || 0
        };
      }).sort((a: any, b: any) => a.sortOrder - b.sortOrder);

      return {
        id: g.id,
        name: g.name,
        remaining,
        deducted,
        flexible,
        totalBudget,
        totalActual,
        sortOrder: g.sortOrder || 0,
        children
      };

    }).sort((a: any, b: any) => a.sortOrder - b.sortOrder);
  }, [activeBudget, state.resolvedMonthlyDb, state.sinkingFunds, state.lifeEvents, activePeriodKey, mode]);

  const totalBudgetSum = useMemo(() => liquidityBreakdownData.reduce((sum, g) => sum + g.totalBudget, 0), [liquidityBreakdownData]);
  const totalActualSum = useMemo(() => liquidityBreakdownData.reduce((sum, g) => sum + g.totalActual, 0), [liquidityBreakdownData]);
  const totalDeductedSum = useMemo(() => liquidityBreakdownData.reduce((sum, g) => sum + g.deducted, 0), [liquidityBreakdownData]);
  const totalFlexibleSum = useMemo(() => liquidityBreakdownData.reduce((sum, g) => sum + g.flexible, 0), [liquidityBreakdownData]);
  const totalRemainingSum = useMemo(() => liquidityBreakdownData.reduce((sum, g) => sum + g.remaining, 0), [liquidityBreakdownData]);

  return {
    liquidityBreakdownData,
    totalBudgetSum,
    totalActualSum,
    totalDeductedSum,
    totalFlexibleSum,
    totalRemainingSum,
    selectedPeriodKey: activePeriodKey
  };
};
