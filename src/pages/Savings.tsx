import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ShieldCheck, Wallet } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { formatKpiMoneyVNDMillion } from '../utils/format';
import { SinkingFundModule } from '../components/portfolio/SinkingFundModule';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import { ObservationControls } from '../components/ui/ObservationControls';
import { runProjection } from '../engines/projectionEngine';

export const Savings: React.FC = () => {
  const { state, selectedPeriodKey } = useAppContext();
  
  const projection = runProjection({
    profile: state.profile,
    incomeSchedule: state.incomeSchedule,
    budgetSchedule: state.budgetSchedule,
    lifeEvents: state.lifeEvents,
    assets: state.assets,
    assumptions: state.assumptions,
    investmentDeals: state.investmentDeals,
    savingsDeposits: state.savingsDeposits,
    projectionAdjustments: state.projectionAdjustments,
    lifeStages: state.lifeStages,
    fundTransfers: state.fundTransfers,
  });

  const hasData = projection.monthlyRows.length > 0;
  
  const now = new Date();
  const nowMonth = now.getMonth() + 1;
  const nowYear = now.getFullYear();
  const nowKey = `${nowYear}-${String(nowMonth).padStart(2, '0')}`;
  
  const currentPeriod = hasData
    ? (projection.monthlyRows.find(r => r.period.key === nowKey) || projection.monthlyRows[0])
    : null;

  const activeRow = (hasData && selectedPeriodKey)
    ? (projection.monthlyRows.find(r => r.period.key === selectedPeriodKey) || currentPeriod)
    : currentPeriod;
  
  const savingBalance = activeRow?.savingBalance || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="w-full">
          <h2 className="text-3xl font-serif font-bold text-family-text flex items-center gap-3">
            <Wallet className="w-8 h-8 text-blue-400" />
            Tiết kiệm
            <HelpTooltip text="Quản lý chi tiết các khoản tiết kiệm, bảo vệ thanh khoản và an toàn tài chính cho gia đình." />
          </h2>
          <p className="text-sm text-family-textMuted mt-1">
            Quản trị tài sản an toàn, tích lũy sinh lời ổn định.
          </p>
        </div>
        <ObservationControls />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border border-blue-500/20 bg-family-bgDeep">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-400 flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Tài sản đang Gửi Tiết Kiệm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-family-text">+{formatKpiMoneyVNDMillion((activeRow?.portfolio.defenseSavingsBalance || 0) + (activeRow?.portfolio.defenseSavingsInterestAccrued || 0))}</div>
            <p className="text-xs text-blue-500 mt-1">Gốc và Lãi dự kiến hiện tại</p>
          </CardContent>
        </Card>

        <Card className="border border-blue-500/20 bg-blue-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Số dư Quỹ Tiết Kiệm (Tiền mặt)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{formatKpiMoneyVNDMillion(savingBalance)}</div>
            <p className="text-xs text-family-textMuted mt-1">Lũy kế có sẵn để lập sổ tiết kiệm</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6 mt-6">
        <SinkingFundModule 
          filterFundType="savings" 
          filterSources={['savings', 'savings_kids', 'savings_biz']}
          title="Tích luỹ Dài hạn & Mục tiêu"
          description="Lên kế hoạch và theo dõi các mục tiêu tài chính lớn (mua nhà, mua xe, hưu trí, học vấn con cái)."
          emptyStateTitle="Chưa có quỹ tích luỹ nào"
          emptyStateDescription="Bắt đầu tạo quỹ tích luỹ để hiện thực hoá các mục tiêu tài chính trong tương lai."
          variant="savings"
        />
      </div>
    </div>
  );
};
