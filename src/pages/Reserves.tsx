import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ShieldCheck, Crosshair } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { formatKpiMoneyVNDMillion } from '../utils/format';
import { SinkingFundModule } from '../components/portfolio/SinkingFundModule';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import { ObservationControls } from '../components/ui/ObservationControls';
import { runProjection } from '../engines/projectionEngine';

export const Reserves: React.FC = () => {
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
  
  // Tổng các quỹ dự phòng (sinking funds)
  const sinkingFundsTotal = activeRow?.debtReserveBalance || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="w-full">
          <h2 className="text-3xl font-serif font-bold text-family-text flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-amber-400" />
            Quỹ Dự phòng
            <HelpTooltip text="Quản lý các Quỹ mục tiêu (Sinking Funds) để chuẩn bị tài chính cho các sự kiện cụ thể (trả nợ, mua nhà, y tế...)." />
          </h2>
          <p className="text-sm text-family-textMuted mt-1">
            Gom tiền định kỳ từ ngân sách để chuẩn bị cho các mục tiêu tài chính cụ thể.
          </p>
        </div>
        <ObservationControls />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border border-amber-500/20 bg-family-bgDeep">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-400 flex items-center gap-2">
              <Crosshair className="w-4 h-4" /> Số lượng Quỹ mục tiêu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-family-text">
              {state.sinkingFunds?.filter(f => f.status === 'active').length || 0}
            </div>
            <p className="text-xs text-amber-500 mt-1">Quỹ đang hoạt động</p>
          </CardContent>
        </Card>

        <Card className="border border-amber-500/20 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Tổng tài sản Dự phòng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">{formatKpiMoneyVNDMillion(sinkingFundsTotal)}</div>
            <p className="text-xs text-family-textMuted mt-1">Tổng cộng các quỹ dự phòng hiện có</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6 mt-6">
        <SinkingFundModule 
          title="🎯 Quỹ Mục tiêu & Dự phòng"
          // We remove filterFundType to allow showing ALL sinking funds here, or we can keep it flexible.
          // In the original, it filtered by debt_prep. Since this is the generic Reserve screen, let's remove filterFundType.
          filterSources={['saving', 'debt_reserve', 'unallocated']}
          description="Lên kế hoạch và gom tiền định kỳ từ ngân sách cho các mục tiêu cụ thể (như tất toán nợ, khẩn cấp...)."
          emptyStateTitle="Chưa có quỹ dự phòng nào"
          emptyStateDescription="Hãy tạo quỹ để gom tiền định kỳ từ ngân sách cho các mục tiêu tương lai."
        />
      </div>
    </div>
  );
};
