import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatTableMoneyVNDMillion } from '../../utils/format';
import { HelpTooltip } from '../ui/HelpTooltip';
import { useLiquidityBreakdown } from '../../hooks/useLiquidityBreakdown';

export const LiquidityBreakdownTable: React.FC = () => {
  const { liquidityBreakdownData, totalBudgetSum, totalActualSum, totalDeductedSum, totalFlexibleSum, totalRemainingSum, selectedPeriodKey } = useLiquidityBreakdown();
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
                <th className="p-3 w-[45%]">Nhóm / Hạng mục</th>
                <th className="p-3 text-right">Ngân sách (tr)</th>
                <th className="p-3 text-right">Đã chi (tr)</th>
                <th className="p-3 text-right text-orange-500" title="Chuyển vào Quỹ tích lũy">Trích quỹ (tr)</th>
                <th className="p-3 text-right text-red-500" title="Khoản chi linh hoạt">Chi linh hoạt (tr)</th>
                <th className="p-3 text-right text-emerald-600">Còn lại (tr)</th>
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
                      <td className="p-3 text-right text-orange-500 font-semibold bg-orange-50/30">
                        {group.deducted > 0 ? `-${formatTableMoneyVNDMillion(group.deducted)}` : '-'}
                      </td>
                      <td className="p-3 text-right text-red-500 font-semibold bg-red-50/20">
                        {group.flexible > 0 ? `-${formatTableMoneyVNDMillion(group.flexible)}` : '-'}
                      </td>
                      <td className={`p-3 text-right font-bold ${group.remaining >= 0 ? 'text-emerald-600 bg-emerald-50/30' : 'text-red-600 bg-red-50/30'}`}>
                        {group.remaining > 0 ? '+' : ''}{formatTableMoneyVNDMillion(group.remaining)}
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
                        <td className="p-2 text-right text-orange-400">
                          -
                        </td>
                        <td className="p-2 text-right text-red-400">
                          -
                        </td>
                        <td className={`p-2 text-right font-semibold ${child.remaining >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {child.remaining > 0 ? '+' : ''}{formatTableMoneyVNDMillion(child.remaining)}
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
                <td className="px-3 py-4 text-right text-sm font-bold text-orange-500">
                  -{formatTableMoneyVNDMillion(totalDeductedSum)}
                </td>
                <td className="px-3 py-4 text-right text-sm font-bold text-red-500">
                  -{formatTableMoneyVNDMillion(totalFlexibleSum)}
                </td>
                <td className={`px-3 py-4 text-right text-sm font-bold ${totalRemainingSum >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {totalRemainingSum > 0 ? '+' : ''}{formatTableMoneyVNDMillion(totalRemainingSum)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
