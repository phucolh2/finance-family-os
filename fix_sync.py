import os

with open('src/hooks/useLiquidityBreakdown.ts', 'r', encoding='utf-8') as f:
    code = f.read()

# We need to compute an activePeriodKey to use consistently instead of selectedPeriodKey being null.
# If selectedPeriodKey is null, we should use nowKey, but if nowKey is before planningStart, we use planningStart.
replacement = """
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
"""

# Replace from `  const activeBudget = useMemo(() => {` to `    const selMonth = parseInt(selMonthStr, 10);`
import re
code = re.sub(r'  const activeBudget = useMemo\(\(\) => \{.*?const selMonth = parseInt\(selMonthStr, 10\);', replacement, code, flags=re.DOTALL)

# And replace `selectedPeriodKey` with `activePeriodKey` in dependency array of liquidityBreakdownData
code = code.replace(
    "}, [activeBudget, expenseData.summaryByGroup, expenseData.summaryByCategory, state.sinkingFunds, selectedPeriodKey]);",
    "}, [activeBudget, expenseData.summaryByGroup, expenseData.summaryByCategory, state.sinkingFunds, activePeriodKey]);"
)

# And return `selectedPeriodKey: activePeriodKey`
code = code.replace(
    "selectedPeriodKey",
    "selectedPeriodKey: activePeriodKey"
)
# Note: we need to replace it carefully in the return statement.
# Let's just fix the return statement explicitly.
code = re.sub(r'return \{\s*liquidityBreakdownData,\s*totalBudgetSum,\s*totalActualSum,\s*totalDeductedSum,\s*totalRemainingSum,\s*selectedPeriodKey\s*\};',
"""return {
    liquidityBreakdownData,
    totalBudgetSum,
    totalActualSum,
    totalDeductedSum,
    totalRemainingSum,
    selectedPeriodKey: activePeriodKey
  };""", code)

with open('src/hooks/useLiquidityBreakdown.ts', 'w', encoding='utf-8') as f:
    f.write(code)

# 3. Fix SavingsAndLiquidityView.tsx header to use the returned `selectedPeriodKey` (which is now activePeriodKey)
with open('src/components/expense/SavingsAndLiquidityView.tsx', 'r', encoding='utf-8') as f:
    view_code = f.read()

view_code = view_code.replace(
    "Tổng Quỹ sinh hoạt dư (Tháng {selectedPeriodKey ? `${selectedPeriodKey.split('-')[1]}/${selectedPeriodKey.split('-')[0]}` : 'hiện tại'})",
    "Tổng Quỹ sinh hoạt dư (Tháng {selectedPeriodKey ? `${selectedPeriodKey.split('-')[1]}/${selectedPeriodKey.split('-')[0]}` : 'hiện tại'})"
)

with open('src/components/expense/SavingsAndLiquidityView.tsx', 'w', encoding='utf-8') as f:
    f.write(view_code)

print("Done")
