import React from 'react';
import { formatTableMoneyVNDMillion } from '../../utils/format';
import type { BudgetTreeNode, BudgetMainGroupId } from '../../types/budget';

interface BudgetDecompositionTreeProps {
  rootGroups: BudgetTreeNode[];
  income: number;
}

const getGroupColorStyles = (groupId: BudgetMainGroupId) => {
  switch (groupId) {
    case 'housing_basic': 
      return { border: 'border-amber-500/35', text: 'text-amber-500', bg: 'bg-amber-500/5' };
    case 'future_investing': 
      return { border: 'border-lime-500/35', text: 'text-lime-500', bg: 'bg-lime-500/5' };
    case 'safety_reserve': 
      return { border: 'border-teal-500/35', text: 'text-teal-500', bg: 'bg-teal-500/5' };
    case 'family_experience': 
      return { border: 'border-purple-500/35', text: 'text-purple-500', bg: 'bg-purple-500/5' };
    case 'health_growth': 
      return { border: 'border-blue-500/35', text: 'text-blue-500', bg: 'bg-blue-500/5' };
    default: 
      return { border: 'border-family-accent/20', text: 'text-family-accent', bg: 'bg-family-bgDark/45' };
  }
};

export const BudgetDecompositionTree: React.FC<BudgetDecompositionTreeProps> = ({ rootGroups, income }) => {
  return (
    <div className="w-full h-full min-h-[300px] overflow-y-auto pr-1 flex flex-col justify-start space-y-4">
      {/* Root Node: Total Income */}
      <div className="flex justify-center mb-2">
        <div className="bg-family-bgDeep border border-family-accent/30 rounded-xl px-4 py-2 text-center shadow-md min-w-[200px]">
          <span className="text-[10px] text-family-textMuted uppercase font-bold tracking-wider">Tổng thu nhập</span>
          <div className="text-sm font-extrabold text-family-text mt-0.5">
            {formatTableMoneyVNDMillion(income)} / tháng
          </div>
          <span className="inline-block text-[10px] font-bold bg-family-accent/10 text-family-accent px-2 py-0.5 rounded-full mt-1">
            100% phân bổ
          </span>
        </div>
      </div>

      {/* Main Groups & Children Decomposition Tree */}
      <div className="space-y-4">
        {rootGroups.map((group) => {
          if (group.isActive === false) return null;
          
          const styles = getGroupColorStyles(group.groupId as BudgetMainGroupId);
          const activeChildren = group.children 
            ? group.children.filter((c) => c.isActive !== false) 
            : [];
          
          const groupAmount = (income * group.ratioPercent) / 100;

          return (
            <div key={group.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center border-l-2 border-family-accent/15 pl-3 py-1 ml-4">
              
              {/* Group Card (2/5 columns on large screens) */}
              <div className="md:col-span-2">
                <div className={`p-3 rounded-xl border ${styles.border} ${styles.bg} shadow-sm`}>
                  <div className="flex justify-between items-start">
                    <span className={`text-xs font-bold ${styles.text} truncate`}>
                      {group.name}
                    </span>
                    <span className={`text-xs font-extrabold ${styles.text} shrink-0 ml-2`}>
                      {group.ratioPercent}%
                    </span>
                  </div>
                  <div className="text-xs font-bold text-family-text mt-1.5">
                    {formatTableMoneyVNDMillion(groupAmount)} <span className="text-[10px] text-family-textMuted">/ tháng</span>
                  </div>
                </div>
              </div>

              {/* Children Nodes Column (3/5 columns on large screens) */}
              <div className="md:col-span-3 space-y-1.5 pl-2 md:border-l border-family-accent/10">
                {activeChildren.length > 0 ? (
                  activeChildren.map((child) => {
                    const childAmount = (income * child.ratioPercent) / 100;
                    return (
                      <div 
                        key={child.id} 
                        className="flex items-center justify-between p-2 rounded-lg bg-family-bgDeep border border-family-accent/5 hover:border-family-accent/10 transition-all text-left"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {/* Small indentation bullet */}
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${group.groupId === 'housing_basic' ? 'bg-amber-500' : group.groupId === 'future_investing' ? 'bg-lime-500' : group.groupId === 'safety_reserve' ? 'bg-teal-500' : group.groupId === 'family_experience' ? 'bg-purple-500' : 'bg-blue-500'}`} />
                          <span className="text-[11px] text-family-text font-medium truncate">
                            {child.name}
                          </span>
                        </div>
                        
                        <div className="text-right shrink-0 ml-2">
                          <span className="text-[10px] font-bold text-family-textMuted mr-1.5">
                            {child.ratioPercent}%
                          </span>
                          <span className="text-[10px] font-bold text-family-text">
                            {formatTableMoneyVNDMillion(childAmount)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-[10px] text-family-textMuted italic pl-2">
                    Không có hạng mục con nào hoạt động
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
export default BudgetDecompositionTree;
