import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { formatTableMoneyVNDMillion } from '../../utils/format';
import { safeNumber } from '../../utils/math';
import { Calculator, ArrowRightLeft, X, Wallet, PiggyBank, CircleDollarSign } from 'lucide-react';
import { SavingsDepositModule } from '../portfolio/SavingsDepositModule';
import type { BudgetGroup } from '../../types/budget';

export const MonthlyReconciliation: React.FC = () => {
  const { state, selectedPeriodKey, addLifeEvent, updateLifeEvent } = useAppContext();

  // Find the resolved budget for the selected month
  const resolvedDbItem = useMemo(() => {
    return (state.resolvedMonthlyDb || []).find(db => db.periodKey === selectedPeriodKey);
  }, [state.resolvedMonthlyDb, selectedPeriodKey]);

  // Find active budget schedule
  const activeBudget = state.budgetSchedule.length > 0 ? state.budgetSchedule[state.budgetSchedule.length - 1] : null;

  // Filter events for this month
  const monthlyEvents = useMemo(() => {
    if (!resolvedDbItem) return [];
    return state.lifeEvents.filter(e => e.year === resolvedDbItem.year && e.month === resolvedDbItem.month);
  }, [state.lifeEvents, resolvedDbItem]);

  // Build grid data
  const gridData = useMemo(() => {
    if (!resolvedDbItem || !activeBudget) return [];

    const rows: {
      groupId: BudgetGroup;
      groupName: string;
      itemId: string;
      itemName: string;
      budgetAmount: number;
      actualAmount: number;
      aggregateEventId?: string;
    }[] = [];

    activeBudget.rootGroups.forEach(group => {
      const groupBudgetTotal = (resolvedDbItem.budgetAmounts as any)[group.groupId] || 0;
      
      const items = group.children || [];
      const totalRatio = items.reduce((sum, item) => sum + item.ratioPercent, 0);

      items.forEach(item => {
        const itemBudget = totalRatio > 0 ? groupBudgetTotal * (item.ratioPercent / totalRatio) : 0;
        
        const categoryKey = `${group.groupId}/${item.id}`;
        const itemEvents = monthlyEvents.filter(e => e.spendingCategory === categoryKey);
        
        const aggregateEvent = itemEvents.find(e => e.type === 'other' && e.name.startsWith('Chi tiêu tháng'));
        
        const totalActualAbs = itemEvents.reduce((sum, e) => {
          return sum + (safeNumber(e.amount) < 0 ? Math.abs(safeNumber(e.amount)) : 0);
        }, 0);

        rows.push({
          groupId: group.groupId,
          groupName: group.name,
          itemId: item.id,
          itemName: item.name,
          budgetAmount: itemBudget,
          actualAmount: totalActualAbs,
          aggregateEventId: aggregateEvent?.id
        });
      });
    });

    return rows;
  }, [resolvedDbItem, activeBudget, monthlyEvents]);

  const handleActualChange = (row: typeof gridData[0], newTotalActualText: string) => {
    if (!resolvedDbItem) return;
    const newTotalActual = safeNumber(Number(newTotalActualText));
    if (isNaN(newTotalActual) || newTotalActual < 0) return;

    const categoryKey = `${row.groupId}/${row.itemId}`;
    const itemEvents = monthlyEvents.filter(e => e.spendingCategory === categoryKey);
    const aggregateEvent = itemEvents.find(e => e.id === row.aggregateEventId);
    
    const specificEventsAbs = itemEvents
      .filter(e => e.id !== row.aggregateEventId)
      .reduce((sum, e) => sum + (safeNumber(e.amount) < 0 ? Math.abs(safeNumber(e.amount)) : 0), 0);

    const newAggregateAbs = Math.max(0, newTotalActual - specificEventsAbs);
    const newAmount = -newAggregateAbs; // Âm cho chi tiêu

    if (aggregateEvent) {
      updateLifeEvent({
        ...aggregateEvent,
        amount: newAmount
      });
    } else {
      if (newAggregateAbs > 0) {
        addLifeEvent({
          name: `Chi tiêu tháng ${resolvedDbItem.month}/${resolvedDbItem.year} - ${row.itemName}`,
          type: 'other',
          month: resolvedDbItem.month,
          year: resolvedDbItem.year,
          amount: newAmount,
          source: row.groupId as any,
          spendingCategory: categoryKey,
          recurringMonthlyImpact: 0,
          affectsNetWorth: true,
          note: 'Tự động tạo từ Bảng đối chiếu',
          isMilestone: false
        });
      }
    }
  };

  const totalBudget = gridData.reduce((sum, r) => sum + r.budgetAmount, 0);
  const totalActual = gridData.reduce((sum, r) => sum + r.actualAmount, 0);
  const totalRemaining = totalBudget - totalActual;

  const savingsThisMonth = (state.savingsDeposits || [])
    .filter(d => d.startMonth === resolvedDbItem?.month && d.startYear === resolvedDbItem?.year)
    .reduce((sum, d) => sum + d.principal, 0);

  const idleMoney = totalRemaining - savingsThisMonth;

  if (!resolvedDbItem) return null;

  return (
    <>
      <Card className="bg-white/80 border-family-accent/20 shadow-md">
        <CardHeader className="pb-4 border-b border-gray-100">
          <CardTitle className="text-xl font-serif text-family-text flex items-center gap-2">
            <Calculator className="w-5 h-5 text-family-accent" />
            Bảng Đối chiếu Ngân sách & Thực tế tháng {resolvedDbItem.month}/{resolvedDbItem.year}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/50 text-gray-500 font-semibold border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 w-1/3">Danh mục</th>
                <th className="px-4 py-3 text-right">Ngân sách (Tr)</th>
                <th className="px-4 py-3 text-right">Đã chi (Tr)</th>
                <th className="px-4 py-3 text-right">Nhập Tổng Thực Tế</th>
                <th className="px-4 py-3 text-right">Còn lại (Tr)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {gridData.map((row, idx) => {
                const remaining = row.budgetAmount - row.actualAmount;
                return (
                  <tr key={`${row.groupId}-${row.itemId}-${idx}`} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-family-text">{row.itemName}</div>
                      <div className="text-xs text-gray-400">{row.groupName}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-orange-500">
                      {formatTableMoneyVNDMillion(row.budgetAmount)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-blue-500">
                      {formatTableMoneyVNDMillion(row.actualAmount)}
                    </td>
                    <td className="px-4 py-3 flex justify-end">
                      <input 
                        type="number" 
                        className="w-24 px-2 py-1 text-right border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-family-accent focus:border-family-accent"
                        defaultValue={row.actualAmount.toFixed(1)}
                        onBlur={(e) => handleActualChange(row, e.target.value)}
                        step="0.1"
                        min="0"
                      />
                    </td>
                    <td className={`px-4 py-3 text-right font-bold ${remaining < 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {formatTableMoneyVNDMillion(remaining)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 font-bold border-t-2 border-gray-200">
              <tr>
                <td className="px-4 py-3">TỔNG CỘNG</td>
                <td className="px-4 py-3 text-right text-orange-600">{formatTableMoneyVNDMillion(totalBudget)}</td>
                <td className="px-4 py-3 text-right text-blue-600">{formatTableMoneyVNDMillion(totalActual)}</td>
                <td className="px-4 py-3"></td>
                <td className={`px-4 py-3 text-right ${totalRemaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatTableMoneyVNDMillion(totalRemaining)}
                </td>
              </tr>
            </tfoot>
          </table>
          {/* Unspent Dashboard */}
          {totalRemaining > 0 && (
            <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 border-t border-slate-200">
              <h3 className="text-lg font-bold text-family-text mb-4 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-family-accent" /> Phân bổ Tiền dư trong tháng
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-family-textMuted uppercase">Tổng tiền dư</p>
                    <p className="text-2xl font-bold text-emerald-600">{formatTableMoneyVNDMillion(totalRemaining)} Tr</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <Calculator className="w-5 h-5" />
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-family-textMuted uppercase">Đã gửi tiết kiệm</p>
                    <p className="text-2xl font-bold text-sky-600">{formatTableMoneyVNDMillion(savingsThisMonth)} Tr</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600">
                    <PiggyBank className="w-5 h-5" />
                  </div>
                </div>
                
                <div className={`bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between ${idleMoney > 0 ? 'ring-1 ring-orange-200' : ''}`}>
                  <div>
                    <p className="text-sm font-semibold text-family-textMuted uppercase">Tiền nhàn rỗi (Chưa sinh lời)</p>
                    <p className={`text-2xl font-bold ${idleMoney > 0 ? 'text-orange-600' : 'text-slate-400'}`}>{formatTableMoneyVNDMillion(idleMoney)} Tr</p>
                  </div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${idleMoney > 0 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                    <CircleDollarSign className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Embed Savings Module directly for quick access */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <SavingsDepositModule 
                  defaultStartMonth={resolvedDbItem.month} 
                  defaultStartYear={resolvedDbItem.year} 
                  filterCurrentMonthOnly={true} 
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};