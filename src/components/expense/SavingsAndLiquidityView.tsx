import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { SavingsDepositModule } from '../portfolio/SavingsDepositModule';
import { Card, CardContent } from '../ui/Card';
import { Wallet, PiggyBank, ShieldCheck } from 'lucide-react';
import { formatTableMoneyVNDMillion } from '../../utils/format';

import { runProjection } from '../../engines/projectionEngine';

export const SavingsAndLiquidityView: React.FC = () => {
  const { state, selectedPeriodKey } = useAppContext();
  
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
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <Card className="bg-white/80 border-family-accent/10 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-family-textMuted uppercase tracking-wider mb-1">
                Quỹ Thanh khoản sinh hoạt
              </p>
              <h3 className="text-2xl font-bold text-emerald-600">
                {formatTableMoneyVNDMillion(currentRow?.liquidityBalance || 0)} Tr
              </h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Wallet className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

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
