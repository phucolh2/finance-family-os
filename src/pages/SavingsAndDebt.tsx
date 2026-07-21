import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { ShieldCheck, AlertTriangle, ArrowRightLeft, Wallet } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { formatKpiMoneyVNDMillion } from '../utils/format';
import { SavingsDepositModule } from '../components/portfolio/SavingsDepositModule';
import { SinkingFundModule } from '../components/portfolio/SinkingFundModule';
import { DebtLiabilityModule } from '../components/portfolio/DebtLiabilityModule';
import { calculatePMT } from '../utils/math';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import { ObservationControls } from '../components/ui/ObservationControls';
import { runProjection } from '../engines/projectionEngine';
import { SavingsDebtInsights } from '../components/portfolio/SavingsDebtInsights';

export const SavingsAndDebt: React.FC = () => {
  const { state, selectedPeriodKey } = useAppContext();
  
  // Run projection dynamically to get actual accumulated assets at the observed time
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
  
  // Set up current observation period
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
  
  const savingMonthly = activeRow?.savingMonthly || 0;
  const debtReserveMonthly = activeRow?.debtReserveMonthly || 0;
  const savingBalance = activeRow?.savingBalance || 0;
  const debtReserveBalance = activeRow?.debtReserveBalance || 0;

  // Sinking funds
  const totalSinkingTarget = (state.sinkingFunds ?? []).reduce((acc, sf) => acc + sf.targetAmount, 0);

  // Debts
  const activeDebts = (state.debts ?? []).filter(d => d.status === 'active');
  const totalDebtPrincipal = activeDebts.reduce((acc, d) => acc + d.principal, 0);
  
  const totalDebtMonthlyPayment = activeDebts.reduce((acc, debt) => {
    return acc + calculatePMT(debt.principal, debt.interestRateAnnual, debt.termMonths);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="w-full">
          <h2 className="text-3xl font-serif font-bold text-family-text flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
            Danh mục Tiết kiệm & Nợ
            <HelpTooltip text="Quản lý chi tiết các khoản tiết kiệm phòng thủ, quỹ chuẩn bị thanh toán nợ và theo dõi dư nợ tín dụng của gia đình." />
          </h2>
          <p className="text-sm text-family-textMuted mt-1">
            Quản trị tài sản an toàn và kiểm soát rủi ro thanh khoản từ các khoản vay.
          </p>
        </div>
        <ObservationControls />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saving Budget KPI -> Active Savings Deposit */}
        <Card className="border border-emerald-500/20 bg-family-bgDeep">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-emerald-400 flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Tài sản đang Gửi Tiết Kiệm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-family-text">+{formatKpiMoneyVNDMillion((activeRow?.portfolio.defenseSavingsBalance || 0) + (activeRow?.portfolio.defenseSavingsInterestAccrued || 0))}</div>
            <p className="text-xs text-emerald-500 mt-1">Gốc và Lãi dự kiến hiện tại</p>
          </CardContent>
        </Card>

        {/* Saving Balance KPI */}
        <Card className="border border-emerald-500/20 bg-emerald-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-emerald-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Số dư Quỹ Tiết Kiệm & Nợ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{formatKpiMoneyVNDMillion(savingBalance)}</div>
            <p className="text-xs text-family-textMuted mt-1">Lũy kế để gửi tiết kiệm / phòng thủ</p>
          </CardContent>
        </Card>

        {/* Debt Budget KPI */}
        <Card className="border border-amber-500/20 bg-family-bgDeep">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-400 flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Dòng tiền Nợ (Tháng)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-family-text">+{formatKpiMoneyVNDMillion(debtReserveMonthly)}</div>
            <p className="text-xs text-amber-500 mt-1">Ngân sách chuẩn bị trả nợ</p>
          </CardContent>
        </Card>

        {/* Debt Balance KPI -> Debt Reserve Fund */}
        <Card className="border border-red-500/20 bg-red-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Quỹ Chuẩn bị Trả nợ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{formatKpiMoneyVNDMillion((activeRow?.debtReserveBalance || 0) + (activeRow?._activeSinkingFundsDebtReserve || 0))}</div>
            <p className="text-xs text-red-400/70 mt-1">Tổng tiền mặt chờ tất toán (Gốc + Lãi)</p>
          </CardContent>
        </Card>
      </div>

      {hasData && (
        <div className="mt-8 mb-8">
          <SavingsDebtInsights projectionData={projection.monthlyRows} />
        </div>
      )}

      <div className="flex flex-col gap-6 mt-6">
        <SavingsDepositModule 
          title="🏦 Tiết kiệm Phòng thủ"
          filterPools={['saving']}
          description={
            <>Tạo các khoản gửi tiết kiệm từ <strong>Quỹ Tiết kiệm</strong> để dự phòng thanh khoản an toàn.</>
          }
          emptyStateTitle="Chưa có khoản tiết kiệm phòng thủ nào"
          emptyStateDescription="Nhấn 'Tạo khoản tiết kiệm' để gửi tiết kiệm từ Quỹ Tiết kiệm nhằm dự phòng thanh khoản an toàn."
        />
        
        <SinkingFundModule 
          title="🎯 Quỹ Chuẩn bị Trả nợ"
          filterFundType="debt_prep"
          filterSources={['saving', 'debt_reserve', 'unallocated']}
          description="Gom tiền định kỳ từ ngân sách để chuẩn bị tất toán trước hạn các khoản vay dư nợ gốc lớn."
          emptyStateTitle="Chưa có quỹ chuẩn bị trả nợ nào"
          emptyStateDescription="Hãy tạo quỹ để gom tiền định kỳ từ ngân sách chuẩn bị tất toán sớm các khoản vay."
        />

        <DebtLiabilityModule />
        
        <Card className="border border-family-accent/10 bg-family-bgDeep">
          <CardHeader>
            <CardTitle className="text-sm text-family-text flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-family-accent" />
              So sánh Lãi suất
              <HelpTooltip text="Bảng chênh lệch giữa lãi suất huy động (tiền gửi) và lãi suất đi vay. Dựa vào đây để đưa ra quyết định đòn bẩy tài chính hoặc tất toán nợ." />
            </CardTitle>
            <CardDescription>Tiền gửi có kỳ hạn vs Tiền vay phải trả</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-family-textMuted mb-2">
              * Nếu lãi suất vay quá cao so với lãi suất gửi tiết kiệm, hãy cân nhắc rút tiết kiệm để tất toán nợ sớm nhằm giải phóng dòng tiền và tránh "bẫy chuột".
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
