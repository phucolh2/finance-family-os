import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { SavingsDepositModule } from '../portfolio/SavingsDepositModule';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Wallet, ChevronDown, ChevronRight } from 'lucide-react';
import { formatTableMoneyVNDMillion } from '../../utils/format';
import { HelpTooltip } from '../ui/HelpTooltip';
import { runProjection } from '../../engines/projectionEngine';
import { analyzeExpense } from '../../engines/expenseEngine';

export const SavingsAndLiquidityView: React.FC = () => {
  const { state, selectedPeriodKey } = useAppContext();
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [id]: prev[id] === false ? true : false
    }));
  };

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
          totalActual: catSum.totalActual
        };
      }).filter((c: any) => c.remaining > 0).sort((a: any, b: any) => b.remaining - a.remaining);

      return {
        id: g.id,
        name: g.name,
        remaining,
        totalBudget: sum.totalBudget,
        totalActual: sum.totalActual,
        children
      };
    }).filter((d: any) => d.remaining > 0).sort((a: any, b: any) => b.remaining - a.remaining);
  }, [activeBudget, expenseData.summaryByGroup, expenseData.summaryByCategory]);


  // Lấy dòng tháng hiện tại (hoặc tháng cuối cùng) để hiển thị số dư tổng quát
  const projection = runProjection({
    profile: state.profile,
    incomeSchedule: state.incomeSchedule,
    budgetSchedule: state.budgetSchedule,
    lifeEvents: state.lifeEvents,
    assets: state.assets,
    assumptions: state.assumptions,
    investmentDeals: state.investmentDeals,
    savingsDeposits: state.savingsDeposits,
    sinkingFunds: state.sinkingFunds,
    debts: state.debts,
    projectionAdjustments: state.projectionAdjustments,
    lifeStages: state.lifeStages,
    fundTransfers: state.fundTransfers,
    expenseSchedule: state.expenseSchedule,
  });

  const now = new Date();
  const nowKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const currentPeriod = projection.monthlyRows.length > 0
    ? (projection.monthlyRows.find(r => r.period.key === nowKey) || projection.monthlyRows[0])
    : null;

  const currentRow = (projection.monthlyRows.length > 0 && selectedPeriodKey)
    ? (projection.monthlyRows.find(r => r.period.key === selectedPeriodKey) || currentPeriod)
    : currentPeriod;

  return (
    <div className="space-y-6">


      {liquidityBreakdownData.length > 0 && (
        <Card className="bg-white/80 border-family-accent/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-family-textMuted uppercase flex items-center gap-1.5">
              Cấu trúc Tiền dư sinh hoạt (Tháng {selectedPeriodKey ? selectedPeriodKey.split('-')[1] : 'hiện tại'})
              <HelpTooltip text="Bảng này chỉ phân tách số tiền dư của THÁNG ĐANG CHỌN. (Khác với con số 45 triệu ở trên là TỔNG tiền dư tích lũy của TẤT CẢ các tháng cộng lại)." />
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
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <SavingsDepositModule 
            title="Quản lý Sổ Tiết Kiệm (Quỹ sinh hoạt)"
            description="Tạo và quản lý các khoản gửi tiết kiệm sử dụng nguồn tiền dư dả từ Quỹ thanh khoản sinh hoạt hàng tháng."
            filterPools={['liquidity', 'unallocated']}
            emptyStateTitle="Chưa có khoản tiết kiệm từ quỹ sinh hoạt"
            emptyStateDescription="Nhấn 'Tạo khoản tiết kiệm' để gửi tiết kiệm từ Quỹ thanh khoản sinh hoạt dư thừa."
          />
        </CardContent>
      </Card>
    </div>
  );
};
