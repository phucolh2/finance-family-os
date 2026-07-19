import React from 'react';
import { formatTableMoneyVNDMillion } from '../../utils/format';
import type { BudgetTreeNode } from '../../types/budget';

interface BudgetDetailedListProps {
  rootGroups: BudgetTreeNode[];
  income: number;
}

export const BudgetDetailedList: React.FC<BudgetDetailedListProps> = ({ rootGroups, income }) => {
  // Sort groups: Expense first, then Investment, then Saving.
  // Within the same classification, sort by ratioPercent descending.
  const sortedGroups = [...rootGroups].sort((a, b) => {
    const classOrder: Record<string, number> = { expense: 1, investment: 2, saving: 3 };
    const orderA = a.classification ? classOrder[a.classification] || 99 : 99;
    const orderB = b.classification ? classOrder[b.classification] || 99 : 99;
    
    if (orderA !== orderB) return orderA - orderB;
    return b.ratioPercent - a.ratioPercent;
  });

  return (
    <div className="w-full h-auto">
      <div className="columns-1 md:columns-2 xl:columns-3 gap-4 space-y-4">
        {sortedGroups.map((group, groupIdx) => {
          const groupAmt = (group.ratioPercent / 100) * income;
          return (
            <div key={group.id} className="break-inside-avoid border border-family-accent/10 rounded-xl overflow-hidden bg-family-bgDeep flex flex-col">
              {/* Group Header */}
              <div className="bg-family-bgDark/40 px-4 py-3 flex justify-between items-center border-b border-family-accent/10">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-family-accent" />
                    <span className="font-bold text-sm text-family-text uppercase tracking-wide">{group.name}</span>
                  </div>
                  {group.classification && (
                    <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded-md font-bold tracking-wider w-fit ${
                      group.classification === 'expense' ? 'bg-red-500/10 text-red-600 border border-red-500/20' :
                      group.classification === 'investment' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                      'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                    }`}>
                      {group.classification === 'expense' ? 'Chi phí' :
                       group.classification === 'investment' ? 'Đầu tư' : 'Tiết kiệm'}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-bold text-family-text text-sm">{formatTableMoneyVNDMillion(groupAmt)}</span>
                  <span className="text-[10px] text-family-textMuted font-bold">{group.ratioPercent.toFixed(1)}% Tổng Thu</span>
                </div>
              </div>

              {/* Items List */}
              <div className="flex flex-col divide-y divide-family-accent/5">
                {group.children?.map((item) => {
                  // item.ratioPercent is ABSOLUTE % of total income (same unit as group.ratioPercent)
                  // group.ratioPercent = sum of its children's ratioPercent
                  const itemAmt = (item.ratioPercent / 100) * income;
                  const absRatio = item.ratioPercent; // already absolute % of income
                  return (
                    <div key={item.id} className="px-4 py-2.5 flex justify-between items-center hover:bg-family-accent/5 transition-colors">
                      <span className="text-xs text-family-textMuted font-medium pl-4 relative">
                        <span className="absolute left-0 top-1.5 w-2 h-[1px] bg-family-accent/20"></span>
                        {item.name}
                      </span>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-family-textMuted w-10 text-right">{absRatio.toFixed(1)}%</span>
                        <span className="text-family-text font-bold min-w-[4rem] text-right">{formatTableMoneyVNDMillion(itemAmt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
