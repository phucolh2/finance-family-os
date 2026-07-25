import os

# 1. Create useLiquidityBreakdown.ts
os.makedirs('src/hooks', exist_ok=True)
hook_code = """import { useMemo } from 'react';
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
"""
with open('src/hooks/useLiquidityBreakdown.ts', 'w', encoding='utf-8') as f:
    f.write(hook_code)


# 2. Create LiquidityBreakdownTable.tsx
table_code = """import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatTableMoneyVNDMillion } from '../../utils/format';
import { HelpTooltip } from '../ui/HelpTooltip';
import { useLiquidityBreakdown } from '../../hooks/useLiquidityBreakdown';

export const LiquidityBreakdownTable: React.FC = () => {
  const { liquidityBreakdownData, totalBudgetSum, totalActualSum, totalRemainingSum, selectedPeriodKey } = useLiquidityBreakdown();
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [id]: prev[id] === false ? true : false
    }));
  };

  if (liquidityBreakdownData.length === 0) return null;

  return (
    <Card className="bg-white/80 border-family-accent/10 mt-6 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-family-textMuted uppercase flex items-center gap-1.5">
          Cấu trúc Tiền dư sinh hoạt tính đến (Tháng {selectedPeriodKey ? `${selectedPeriodKey.split('-')[1]}/${selectedPeriodKey.split('-')[0]}` : 'hiện tại'})
          <HelpTooltip text="Bảng này chỉ phân tách số tiền dư của THÁNG ĐANG CHỌN. (Khác với con số ở trên là TỔNG tiền dư tích lũy của TẤT CẢ các tháng cộng lại)." />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-xl border border-family-accent/10 shadow-sm">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-family-accent/15 text-family-textMuted font-bold bg-family-bgDark/40">
                <th className="p-3 w-[50%]">Nhóm / Hạng mục</th>
                <th className="p-3 text-right">Ngân sách (tr)</th>
                <th className="p-3 text-right">Đã chi (tr)</th>
                <th className="p-3 text-right text-emerald-600">Tiền dư (tr)</th>
              </tr>
            </thead>
            <tbody>
              {liquidityBreakdownData.map((group: any) => {
                const isExpanded = expandedNodes[group.id] !== false;
                const hasChildren = group.children && group.children.length > 0;
                return (
                  <React.Fragment key={group.id}>
                    <tr 
                      className={`border-b border-family-accent/5 hover:bg-family-accent/5 transition-colors ${hasChildren ? 'cursor-pointer' : ''}`}
                      onClick={() => { if (hasChildren) toggleExpand(group.id); }}
                    >
                      <td className="p-3 font-bold text-family-text flex items-center gap-2">
                        {hasChildren && (
                          <span className="text-family-textMuted">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </span>
                        )}
                        {!hasChildren && <span className="w-4 h-4 inline-block"></span>}
                        {group.name}
                      </td>
                      <td className="p-3 text-right text-family-textMuted font-semibold">
                        {formatTableMoneyVNDMillion(group.totalBudget)}
                      </td>
                      <td className="p-3 text-right text-family-textMuted font-semibold">
                        {formatTableMoneyVNDMillion(group.totalActual)}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-600 bg-emerald-50/30">
                        +{formatTableMoneyVNDMillion(group.remaining)}
                      </td>
                    </tr>
                    
                    {isExpanded && hasChildren && group.children.map((child: any) => (
                      <tr key={child.id} className="border-b border-family-accent/5 bg-family-bgDark/10 hover:bg-family-bgDark/20 transition-colors text-xs">
                        <td className="p-2 pl-10 text-family-text flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-family-accent/30"></div>
                          {child.name}
                        </td>
                        <td className="p-2 text-right text-family-textMuted">
                          {formatTableMoneyVNDMillion(child.totalBudget)}
                        </td>
                        <td className="p-2 text-right text-family-textMuted">
                          {formatTableMoneyVNDMillion(child.totalActual)}
                        </td>
                        <td className="p-2 text-right font-semibold text-emerald-600">
                          +{formatTableMoneyVNDMillion(child.remaining)}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
              
              {/* Total Row */}
              <tr className="bg-family-accent/5 font-bold text-sm border-t-2 border-family-accent/20">
                <td className="p-4 text-family-text uppercase tracking-wider">
                  Tổng cộng
                </td>
                <td className="px-3 py-4 text-right text-sm font-bold text-family-text">
                  {formatTableMoneyVNDMillion(totalBudgetSum)}
                </td>
                <td className="px-3 py-4 text-right text-sm font-bold text-family-text">
                  {formatTableMoneyVNDMillion(totalActualSum)}
                </td>
                <td className="px-3 py-4 text-right text-sm font-bold text-emerald-600">
                  +{formatTableMoneyVNDMillion(totalRemainingSum)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
"""
with open('src/components/expense/LiquidityBreakdownTable.tsx', 'w', encoding='utf-8') as f:
    f.write(table_code)


# 3. Update SavingsAndLiquidityView.tsx
with open('src/components/expense/SavingsAndLiquidityView.tsx', 'r', encoding='utf-8') as f:
    slv_content = f.read()

slv_content = slv_content.replace(
"import { useAppContext } from '../../context/AppContext';",
"import { useAppContext } from '../../context/AppContext';\nimport { useLiquidityBreakdown } from '../../hooks/useLiquidityBreakdown';"
)

# Remove the useMemos and the table logic
start_remove = slv_content.find('const activeBudget = useMemo(')
end_remove = slv_content.find('const projection = runProjection')

if start_remove != -1 and end_remove != -1:
    replacement = "const { liquidityBreakdownData, totalRemainingSum, selectedPeriodKey } = useLiquidityBreakdown();\n\n  "
    slv_content = slv_content[:start_remove] + replacement + slv_content[end_remove:]

# Also remove totalBudgetSum and totalActualSum definitions
slv_content = slv_content.replace("const totalBudgetSum = liquidityBreakdownData.reduce((sum, g) => sum + g.totalBudget, 0);", "")
slv_content = slv_content.replace("const totalActualSum = liquidityBreakdownData.reduce((sum, g) => sum + g.totalActual, 0);", "")
slv_content = slv_content.replace("const totalRemainingSum = liquidityBreakdownData.reduce((sum, g) => sum + g.remaining, 0);", "")

# Remove the table JSX
start_table = slv_content.find('<Card className="bg-white/80 border-family-accent/10">')
end_table = slv_content.find('</CardContent>\n        </Card>')
if start_table != -1 and end_table != -1:
    slv_content = slv_content[:start_table] + slv_content[end_table + len('</CardContent>\n        </Card>'):]

# Also remove const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({}); and toggleExpand
start_expanded = slv_content.find('const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});')
end_expanded = slv_content.find('  const { liquidityBreakdownData')
if start_expanded != -1 and end_expanded != -1:
    slv_content = slv_content[:start_expanded] + slv_content[end_expanded:]

with open('src/components/expense/SavingsAndLiquidityView.tsx', 'w', encoding='utf-8') as f:
    f.write(slv_content)


# 4. Update LifeStages.tsx to include LiquidityBreakdownTable
with open('src/pages/LifeStages.tsx', 'r', encoding='utf-8') as f:
    ls_content = f.read()

ls_content = ls_content.replace(
"import { ExpenseScheduleView } from '../components/expense/ExpenseScheduleView';",
"import { ExpenseScheduleView } from '../components/expense/ExpenseScheduleView';\nimport { LiquidityBreakdownTable } from '../components/expense/LiquidityBreakdownTable';"
)

ls_content = ls_content.replace(
"""      {activeTab === 'monthly_reconciliation' && (
        <div className="space-y-6">
          <ExpenseDashboard filter={dashboardFilter} setFilter={setDashboardFilter} />
          <ExpenseScheduleView />
        </div>
      )}""",
"""      {activeTab === 'monthly_reconciliation' && (
        <div className="space-y-6">
          <ExpenseDashboard filter={dashboardFilter} setFilter={setDashboardFilter} />
          <ExpenseScheduleView />
          <LiquidityBreakdownTable />
        </div>
      )}"""
)

with open('src/pages/LifeStages.tsx', 'w', encoding='utf-8') as f:
    f.write(ls_content)

print("Done")
