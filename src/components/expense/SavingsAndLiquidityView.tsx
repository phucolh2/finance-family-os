import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { useLiquidityBreakdown } from '../../hooks/useLiquidityBreakdown';

import { Wallet, ChevronDown } from 'lucide-react';
import { formatMoneyVNDMillion } from '../../utils/format';
import { HelpTooltip } from '../ui/HelpTooltip';
import { SinkingFundModule_Liquidity } from './SinkingFundModule_Liquidity';

export const SavingsAndLiquidityView: React.FC = () => {
  const { selectedPeriodKey } = useAppContext();
  const { liquidityBreakdownData, totalRemainingSum } = useLiquidityBreakdown('cumulative');


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
                Tổng Quỹ sinh hoạt dư lũy kế (Tính đến Tháng {selectedPeriodKey ? `${selectedPeriodKey.split('-')[1]}/${selectedPeriodKey.split('-')[0]}` : 'hiện tại'})
              </p>
              <div className={`text-4xl font-black drop-shadow-sm ${totalRemainingSum < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                {formatMoneyVNDMillion(totalRemainingSum, { mode: 'auto', decimals: 2, signed: true })}
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
                <div key={`kpi-${group.id}`} className="bg-white rounded-xl p-4 shadow-sm border border-emerald-500/15 hover:border-emerald-500/40 transition-colors flex flex-col justify-between h-full relative group">
                  <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-gradient-to-r from-emerald-400 to-teal-400 opacity-40 group-hover:opacity-100 transition-opacity"></div>
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-[11px] font-bold text-family-textMuted uppercase tracking-wider line-clamp-2" title={group.name}>
                      {group.name}
                    </p>
                    <HelpTooltip 
                      position="top-right"
                      text={
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between gap-4">
                            <span className="text-gray-500">Ngân sách:</span>
                            <span className="font-semibold text-emerald-600">+{formatMoneyVNDMillion(group.totalBudget)}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-gray-500">Chi tiêu thường xuyên:</span>
                            <span className="font-semibold text-rose-500">-{formatMoneyVNDMillion(group.totalActual)}</span>
                          </div>
                          {(Math.abs(group.trackA) + Math.abs(group.trackB) + group.oneTimeExpense) > 0 && (
                            <div className="flex justify-between gap-4">
                              <span className="text-gray-500">Chi tiêu linh hoạt / Sự kiện:</span>
                              <span className="font-semibold text-rose-500">-{formatMoneyVNDMillion(Math.abs(group.trackA) + Math.abs(group.trackB) + group.oneTimeExpense)}</span>
                            </div>
                          )}
                          {group.oneTimeIncome > 0 && (
                            <div className="flex justify-between gap-4">
                              <span className="text-gray-500">Thu nhập phụ / Sự kiện:</span>
                              <span className="font-semibold text-emerald-600">+{formatMoneyVNDMillion(group.oneTimeIncome)}</span>
                            </div>
                          )}
                          {group.deducted > 0 && (
                            <div className="flex justify-between gap-4">
                              <span className="text-gray-500">Trích lập Quỹ (Cọc nhà,...):</span>
                              <span className="font-semibold text-orange-500">-{formatMoneyVNDMillion(group.deducted)}</span>
                            </div>
                          )}
                          <div className="border-t border-dashed pt-1 mt-1 flex justify-between gap-4 font-bold text-gray-800">
                            <span>Còn lại:</span>
                            <span className={group.remaining < 0 ? 'text-rose-500' : 'text-emerald-600'}>{formatMoneyVNDMillion(group.remaining, { signed: true })}</span>
                          </div>
                        </div>
                      }
                    />
                  </div>
                  <div className={`text-xl font-bold ${group.remaining < 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                    {formatMoneyVNDMillion(group.remaining, { mode: 'auto', decimals: 2, signed: true })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          

        {/* Thêm SinkingFundModule dành riêng cho Quỹ sinh hoạt dư */}
        <div className="mt-8">
          <SinkingFundModule_Liquidity
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
