import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import type { BudgetTreeNode } from '../../types/budget';
import { formatTableMoneyVNDMillion } from '../../utils/format';

interface BudgetHistoryTreeTableProps {
  rootGroups: BudgetTreeNode[];
  income: number;
}

export const BudgetHistoryTreeTable: React.FC<BudgetHistoryTreeTableProps> = ({ rootGroups, income }) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    // Expand all groups by default
    const defaults: Record<string, boolean> = {};
    rootGroups.forEach(g => {
      defaults[g.id] = true;
    });
    return defaults;
  });

  const toggleExpand = (id: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getGroupLabel = (groupId: string): string => {
    switch (groupId) {
      case 'housing_basic': return 'Sinh hoạt';
      case 'future_investing': return 'Đầu tư';
      case 'safety_reserve': return 'Dự phòng';
      case 'family_experience': return 'Trải nghiệm';
      case 'health_growth': return 'Phát triển';
      default: return 'Khác';
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-family-accent/10 shadow-md">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="border-b border-family-accent/15 text-family-textMuted font-bold bg-family-bgDark/40">
            <th className="p-4 w-[40%]">Hạng mục</th>
            <th className="p-4 w-[15%]">Nhóm cha</th>
            <th className="p-4 w-[15%] text-center">Tỷ lệ (%)</th>
            <th className="p-4 w-[15%] text-right">Tiền / tháng</th>
            <th className="p-4 w-[15%] text-right">Tiền / năm</th>
          </tr>
        </thead>
        <tbody>
          {rootGroups.map((group) => {
            const isExpanded = !!expandedGroups[group.id];
            const isGroupActive = group.isActive;
            const groupMonthly = (income * group.ratioPercent) / 100;
            const groupYearly = groupMonthly * 12;

            return (
              <React.Fragment key={group.id}>
                {/* Parent Group Row */}
                <tr className={`border-b border-family-accent/10 hover:bg-family-bgDark/10 ${!isGroupActive ? 'opacity-45' : ''}`}>
                  <td className="p-4 font-bold text-family-text flex items-center gap-2">
                    <button 
                      onClick={() => { toggleExpand(group.id); }}
                      className="p-1 hover:bg-family-bgDeep rounded-lg text-family-textMuted"
                    >
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                    <span className="font-serif text-base">{group.name}</span>
                  </td>
                  <td className="p-4 text-xs font-semibold text-family-textMuted uppercase tracking-wider">
                    {getGroupLabel(group.groupId)}
                  </td>
                  <td className="p-4 text-center font-extrabold text-family-accent text-base">
                    {group.ratioPercent}%
                  </td>
                  <td className="p-4 text-right font-extrabold text-family-text">
                    {formatTableMoneyVNDMillion(groupMonthly)}
                  </td>
                  <td className="p-4 text-right text-family-textMuted">
                    {formatTableMoneyVNDMillion(groupYearly)}
                  </td>
                </tr>

                {/* Children Rows */}
                {isExpanded && group.children?.map((child) => {
                  const isChildActive = child.isActive && isGroupActive;
                  const childMonthly = (income * child.ratioPercent) / 100;
                  const childYearly = childMonthly * 12;

                  return (
                    <tr 
                      key={child.id} 
                      className={`border-b border-family-accent/5 hover:bg-family-bgDark/5 bg-family-bgDark/5 ${!isChildActive ? 'opacity-45' : ''}`}
                    >
                      <td className="p-4 pl-12 font-medium text-family-text pr-4 truncate">
                        ├─ {child.name}
                      </td>
                      <td className="p-4 text-xs text-family-textMuted uppercase">
                        {getGroupLabel(child.groupId)}
                      </td>
                      <td className="p-4 text-center font-bold text-family-accent">
                        {child.ratioPercent}%
                      </td>
                      <td className="p-4 text-right font-bold text-family-text">
                        {formatTableMoneyVNDMillion(childMonthly)}
                      </td>
                      <td className="p-4 text-right text-family-textMuted">
                        {formatTableMoneyVNDMillion(childYearly)}
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
