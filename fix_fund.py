import os

# 1. Update useLiquidityBreakdown.ts
with open('src/hooks/useLiquidityBreakdown.ts', 'r', encoding='utf-8') as f:
    code = f.read()

# We need to add logic to compute deductions
replacement = """
  const liquidityBreakdownData = useMemo(() => {
    const budgetTree = activeBudget ? activeBudget.rootGroups : [];
    const expenseTree = budgetTree.filter((g: any) => g.classification === 'expense');

    const [selYearStr, selMonthStr] = selectedPeriodKey ? selectedPeriodKey.split('-') : [new Date().getFullYear().toString(), (new Date().getMonth() + 1).toString()];
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
  }, [activeBudget, expenseData.summaryByGroup, expenseData.summaryByCategory, state.sinkingFunds, selectedPeriodKey]);

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
    selectedPeriodKey
  };
"""

start_idx = code.find('  const liquidityBreakdownData = useMemo(() => {')
end_idx = code.find('  return {')

if start_idx != -1 and end_idx != -1:
    code = code[:start_idx] + replacement + code[end_idx:]

with open('src/hooks/useLiquidityBreakdown.ts', 'w', encoding='utf-8') as f:
    f.write(code)

# 2. Update LiquidityBreakdownTable.tsx
with open('src/components/expense/LiquidityBreakdownTable.tsx', 'r', encoding='utf-8') as f:
    table_code = f.read()

table_code = table_code.replace(
  "const { liquidityBreakdownData, totalBudgetSum, totalActualSum, totalRemainingSum, selectedPeriodKey } = useLiquidityBreakdown();",
  "const { liquidityBreakdownData, totalBudgetSum, totalActualSum, totalDeductedSum, totalRemainingSum, selectedPeriodKey } = useLiquidityBreakdown();"
)

# Header
table_code = table_code.replace(
"""                <th className="p-3 text-right">Đã chi (tr)</th>
                <th className="p-3 text-right text-emerald-600">Tiền dư (tr)</th>""",
"""                <th className="p-3 text-right">Đã chi (tr)</th>
                <th className="p-3 text-right text-orange-500" title="Chuyển vào Quỹ tích lũy">Trích quỹ (tr)</th>
                <th className="p-3 text-right text-emerald-600">Thực dư (tr)</th>"""
)

# Group Row
table_code = table_code.replace(
"""                      <td className="p-3 text-right text-family-textMuted font-semibold">
                        {formatTableMoneyVNDMillion(group.totalActual)}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-600 bg-emerald-50/30">
                        +{formatTableMoneyVNDMillion(group.remaining)}
                      </td>""",
"""                      <td className="p-3 text-right text-family-textMuted font-semibold">
                        {formatTableMoneyVNDMillion(group.totalActual)}
                      </td>
                      <td className="p-3 text-right text-orange-500 font-semibold bg-orange-50/30">
                        {group.deducted > 0 ? `-${formatTableMoneyVNDMillion(group.deducted)}` : '-'}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-600 bg-emerald-50/30">
                        +{formatTableMoneyVNDMillion(group.remaining)}
                      </td>"""
)

# Child Row
table_code = table_code.replace(
"""                        <td className="p-2 text-right text-family-textMuted">
                          {formatTableMoneyVNDMillion(child.totalActual)}
                        </td>
                        <td className="p-2 text-right font-semibold text-emerald-600">
                          +{formatTableMoneyVNDMillion(child.remaining)}
                        </td>""",
"""                        <td className="p-2 text-right text-family-textMuted">
                          {formatTableMoneyVNDMillion(child.totalActual)}
                        </td>
                        <td className="p-2 text-right text-orange-400">
                          -
                        </td>
                        <td className="p-2 text-right font-semibold text-emerald-600">
                          +{formatTableMoneyVNDMillion(child.remaining)}
                        </td>"""
)

# Total Row
table_code = table_code.replace(
"""                <td className="px-3 py-4 text-right text-sm font-bold text-family-text">
                  {formatTableMoneyVNDMillion(totalActualSum)}
                </td>
                <td className="px-3 py-4 text-right text-sm font-bold text-emerald-600">
                  +{formatTableMoneyVNDMillion(totalRemainingSum)}
                </td>""",
"""                <td className="px-3 py-4 text-right text-sm font-bold text-family-text">
                  {formatTableMoneyVNDMillion(totalActualSum)}
                </td>
                <td className="px-3 py-4 text-right text-sm font-bold text-orange-500">
                  -{formatTableMoneyVNDMillion(totalDeductedSum)}
                </td>
                <td className="px-3 py-4 text-right text-sm font-bold text-emerald-600">
                  +{formatTableMoneyVNDMillion(totalRemainingSum)}
                </td>"""
)

with open('src/components/expense/LiquidityBreakdownTable.tsx', 'w', encoding='utf-8') as f:
    f.write(table_code)


# 3. Update LifestyleFundCard.tsx
with open('src/components/portfolio/fund-cards/LifestyleFundCard.tsx', 'r', encoding='utf-8') as f:
    card_code = f.read()

card_code = card_code.replace(
"""            {filterFundType !== 'debt_prep' && (
              <p className="text-[11px] font-medium text-orange-600/80 uppercase tracking-wider mt-1">Mục tiêu: {fund.targetAssetType}</p>
            )}""",
"""            {filterFundType === 'investment' && (
              <p className="text-[11px] font-medium text-orange-600/80 uppercase tracking-wider mt-1">Mục tiêu: {fund.targetAssetType}</p>
            )}"""
)

card_code = card_code.replace(
"""              <Button size="sm" onClick={onDisburse} className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-0 shadow-none font-semibold rounded-lg px-4">
                Giải ngân
              </Button>""",
"""              <Button size="sm" onClick={onDisburse} className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-0 shadow-none font-semibold rounded-lg px-4">
                Sử dụng
              </Button>"""
)

card_code = card_code.replace(
"""             {expandedFundId === fund.id ? 'Thu gọn chi tiết' : '⊕ Giải ngân đầu tư / Chi tiết dòng tiền'}""",
"""             {expandedFundId === fund.id ? 'Thu gọn chi tiết' : '⊕ Sử dụng quỹ / Chi tiết dòng tiền'}"""
)

card_code = card_code.replace(
"""                Đã giải ngân: <span className="font-semibold text-red-500">{formatMoney(fund.withdrawals.reduce((sum, w) => sum + w.amount, 0))} Tr</span>""",
"""                Đã sử dụng: <span className="font-semibold text-red-500">{formatMoney(fund.withdrawals.reduce((sum, w) => sum + w.amount, 0))} Tr</span>"""
)

with open('src/components/portfolio/fund-cards/LifestyleFundCard.tsx', 'w', encoding='utf-8') as f:
    f.write(card_code)

print("Done")
