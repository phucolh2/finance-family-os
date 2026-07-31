import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { ChevronDown, ChevronRight, Info } from 'lucide-react';
import { formatTableMoneyVNDMillion } from '../../utils/format';
import { HelpTooltip } from '../ui/HelpTooltip';
import { useLiquidityBreakdown } from '../../hooks/useLiquidityBreakdown';

interface LiquidityBreakdownTableProps {
  mode?: 'monthly' | 'cumulative';
}

export const LiquidityBreakdownTable: React.FC<LiquidityBreakdownTableProps> = ({ mode = 'monthly' }) => {
  const { liquidityBreakdownData, totalBudgetSum, totalActualSum, totalDeductedSum, totalFlexibleSum, totalRemainingSum, selectedPeriodKey } = useLiquidityBreakdown(mode);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [activeDetailId, setActiveDetailId] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tableRef.current && !tableRef.current.contains(event.target as Node)) {
        setActiveDetailId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          {mode === 'monthly' ? (
            <>
              Cấu trúc Tiền dư sinh hoạt (Tháng {selectedPeriodKey ? `${selectedPeriodKey.split('-')[1]}/${selectedPeriodKey.split('-')[0]}` : 'hiện tại'})
              <HelpTooltip text="Bảng này phân tách ngân sách và thực chi của RIÊNG tháng đang chọn. Số liệu Không bị cộng dồn từ các tháng trước." />
            </>
          ) : (
            <>
              Cấu trúc Tiền dư sinh hoạt Lũy Kế (Tính đến Tháng {selectedPeriodKey ? `${selectedPeriodKey.split('-')[1]}/${selectedPeriodKey.split('-')[0]}` : 'hiện tại'})
              <HelpTooltip text="Bảng này hiển thị ngân sách và thực chi LŨY KẾ (cộng dồn) từ đầu dự án cho đến tháng đang chọn." />
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-xl border border-family-accent/10 shadow-sm" ref={tableRef}>
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-family-accent/15 text-family-textMuted font-bold bg-family-bgDark/40">
                <th className="p-3 w-[45%]">Nhóm / Hạng mục</th>
                <th className="p-3 text-right">Ngân sách (tr)</th>
                <th className="p-3 text-right">Chi thường xuyên (tr)</th>
                <th className="p-3 text-right text-orange-500" title="Chuyển vào Quỹ tích lũy">Trích quỹ (tr)</th>
                <th className="p-3 text-right text-red-500" title="Khoản chi linh hoạt">Chi linh hoạt (tr)</th>
                <th className="p-3 text-right text-emerald-600">Còn lại (tr)</th>
              </tr>
            </thead>
            <tbody>
              {liquidityBreakdownData.map((group: any) => {
                const isExpanded = expandedNodes[group.id] !== false;
                const hasChildren = group.children && group.children.length > 0;
                const hasFlexibleDetails = group.flexibleEvents && group.flexibleEvents.length > 0;

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
                      <td className="p-3 text-right text-red-500 font-semibold bg-red-50/20 relative"
                          onClick={(e) => {
                            if (hasFlexibleDetails) {
                              e.stopPropagation();
                              setActiveDetailId(activeDetailId === group.id ? null : group.id);
                            }
                          }}
                      >
                        {Math.abs(group.flexible) > 0 ? (
                          <div className={`flex items-center justify-end gap-1 ${hasFlexibleDetails ? 'cursor-pointer hover:text-red-700 transition-colors' : ''}`}>
                            -{formatTableMoneyVNDMillion(Math.abs(group.flexible))}
                            {hasFlexibleDetails && <Info className="w-3.5 h-3.5 opacity-80" />}
                          </div>
                        ) : '-'}

                        {activeDetailId === group.id && hasFlexibleDetails && (
                          <div className="absolute top-full right-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-100 z-50 text-left p-3 animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 border-b border-gray-100 pb-1.5 flex items-center gap-1.5">
                              <Info className="w-3 h-3" /> Chi tiết linh hoạt
                            </div>
                            <div className="space-y-2.5">
                              {group.flexibleEvents.map((evt: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-start text-xs gap-3">
                                  <span className="text-gray-700 font-medium leading-tight">
                                    {evt.name} {evt.isRecurring ? <span className="text-[9px] bg-gray-100 text-gray-500 px-1 py-0.5 rounded ml-1">Định kỳ</span> : ''}
                                  </span>
                                  <span className="text-red-600 font-bold shrink-0">-{formatTableMoneyVNDMillion(Math.abs(evt.impact))}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
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
                  -{formatTableMoneyVNDMillion(Math.abs(totalFlexibleSum))}
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
