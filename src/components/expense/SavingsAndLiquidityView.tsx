import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Wallet, ChevronDown, ChevronRight } from 'lucide-react';
import { formatTableMoneyVNDMillion } from '../../utils/format';
import { HelpTooltip } from '../ui/HelpTooltip';
import { runProjection } from '../../engines/projectionEngine';
import { analyzeExpense } from '../../engines/expenseEngine';
import { SinkingFundModule } from '../portfolio/SinkingFundModule';

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

  const totalBudgetSum = liquidityBreakdownData.reduce((sum, g) => sum + g.totalBudget, 0);
  const totalActualSum = liquidityBreakdownData.reduce((sum, g) => sum + g.totalActual, 0);
  const totalRemainingSum = liquidityBreakdownData.reduce((sum, g) => sum + g.remaining, 0);

  return (
    <div className="space-y-6">


      {liquidityBreakdownData.length > 0 && (
        <>
          {/* Hierarchical KPI Cards */}
          <div className="bg-gradient-to-b from-emerald-500/5 to-transparent rounded-2xl border border-emerald-500/20 p-6 mb-6">
            {/* Total Section */}
            <div className="flex flex-col items-center justify-center text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 mb-3 shadow-inner">
                <Wallet className="w-7 h-7" />
              </div>
              <p className="text-xs font-bold text-emerald-600/80 uppercase tracking-wider mb-1">
                Tổng Quỹ sinh hoạt dư (Tháng {selectedPeriodKey ? `${selectedPeriodKey.split('-')[1]}/${selectedPeriodKey.split('-')[0]}` : 'hiện tại'})
              </p>
              <div className="text-4xl font-black text-emerald-600 drop-shadow-sm">
                +{formatTableMoneyVNDMillion(totalRemainingSum)}
              </div>
            </div>

            {/* Divider */}
            <div className="relative flex justify-center mb-6">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>
              <div className="bg-emerald-50 text-emerald-600 px-4 py-1 rounded-full text-xs font-semibold border border-emerald-500/20 relative z-10 flex items-center gap-1.5 shadow-sm">
                Phân bổ chi tiết <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Group Remaining Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {liquidityBreakdownData.map((group: any) => (
                <div key={`kpi-${group.id}`} className="bg-white rounded-xl p-4 shadow-sm border border-emerald-500/15 hover:border-emerald-500/40 transition-colors flex flex-col justify-between h-full relative overflow-hidden group">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-40 group-hover:opacity-100 transition-opacity"></div>
                  <p className="text-[11px] font-bold text-family-textMuted uppercase tracking-wider mb-3 line-clamp-2" title={group.name}>
                    {group.name}
                  </p>
                  <div className="text-xl font-bold text-emerald-600">
                    +{formatTableMoneyVNDMillion(group.remaining)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Card className="bg-white/80 border-family-accent/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-family-textMuted uppercase flex items-center gap-1.5">
              Cấu trúc Tiền dư sinh hoạt tính đến (Tháng {selectedPeriodKey ? `${selectedPeriodKey.split('-')[1]}/${selectedPeriodKey.split('-')[0]}` : 'hiện tại'})
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

        {/* Thêm SinkingFundModule dành riêng cho Quỹ sinh hoạt dư */}
        <div className="mt-8">
          <SinkingFundModule
            dynamicSources={[
              ...liquidityBreakdownData.map(group => ({
                id: `expense_surplus_${group.id}`,
                label: group.name,
                balance: group.remaining
              }))
            ]}
            filterFundType="expense_surplus"
            emptyStateTitle="Chưa có Quỹ Sinh Hoạt nào"
            emptyStateDescription="Tạo các quỹ sinh hoạt chuyên biệt (như Nhà cửa, Ăn uống) để quản lý ngân sách dư hiệu quả hơn."
            variant="lifestyle"
          />
        </div>
        </>
      )}


    </div>
  );
};
