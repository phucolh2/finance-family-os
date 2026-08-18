import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { useLiquidityBreakdown } from '../../hooks/useLiquidityBreakdown';

import { Wallet, ChevronDown } from 'lucide-react';
import { formatTableMoneyVNDMillion } from '../../utils/format';
import { runProjection } from '../../engines/projectionEngine';
import { SinkingFundModule_Liquidity } from './SinkingFundModule_Liquidity';

export const SavingsAndLiquidityView: React.FC = () => {
  const { state, selectedPeriodKey } = useAppContext();
  const { liquidityBreakdownData, totalRemainingSum } = useLiquidityBreakdown('cumulative');

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
