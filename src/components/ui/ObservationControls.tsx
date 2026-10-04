import React, { useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { runProjection } from '../../engines/projectionEngine';
import { isPeriodKeyLocked } from '../../utils/monthLockStore';
import { getActiveActor } from '../../config/familyMembers';
import { Lock, LockOpen, RotateCcw } from 'lucide-react';
import { HelpTooltip } from './HelpTooltip';

export const ObservationControls: React.FC = () => {
  const { state, updateProfile, selectedPeriodKey, setSelectedPeriodKey, updateToolConfig, pushSystemLog } = useAppContext();

  // Run projection dynamically to get the month list
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

  // Validate if selectedPeriodKey is still in the projection
  useEffect(() => {
    if (selectedPeriodKey) {
      const isValid = projection.monthlyRows.some(r => r.period.key === selectedPeriodKey);
      if (!isValid) {
        setSelectedPeriodKey(undefined);
      }
    }
  }, [projection.monthlyRows, selectedPeriodKey, setSelectedPeriodKey]);

  const now = new Date();
  const nowMonth = now.getMonth() + 1;
  const nowYear = now.getFullYear();
  const nowKey = `${nowYear}-${String(nowMonth).padStart(2, '0')}`;

  const currentPeriod = projection.monthlyRows.find(r => r.period.key === nowKey) || projection.monthlyRows[0];
  const activeKey = selectedPeriodKey || currentPeriod?.period.key || '';

  const [activeYearStr, activeMonthStr] = (activeKey || '2026-10').split('-');
  const activeMonthLabel = `${activeMonthStr}/${activeYearStr}`;

  // Generate options for Planning Start Month (e.g. 10/2026 to 2035)
  const startMonthOptions: { month: number; year: number; label: string; key: string }[] = [];
  for (let y = 2026; y <= 2035; y++) {
    for (let m = 1; m <= 12; m++) {
      if (y === 2026 && m < 10) continue; // Chỉ cho phép chạy từ 10/2026 trở đi
      const label = `${m < 10 ? `0${m}` : m}/${y}`;
      const key = `${y}-${String(m).padStart(2, '0')}`;
      startMonthOptions.push({ month: m, year: y, label, key });
    }
  }

  // Force active start month/year to at least 10/2026
  useEffect(() => {
    const currentYear = state.profile.planningStartYear;
    const currentMonth = state.profile.planningStartMonth;
    if (currentYear < 2026 || (currentYear === 2026 && currentMonth < 10)) {
      updateProfile({ ...state.profile, planningStartYear: 2026, planningStartMonth: 10 });
    }
  }, [state.profile.planningStartYear, state.profile.planningStartMonth, updateProfile, state.profile]);

  const activeStartKey = `${state.profile.planningStartYear}-${String(state.profile.planningStartMonth).padStart(2, '0')}`;

  const isLocked = isPeriodKeyLocked(activeKey);

  const handleToggleLock = () => {
    if (!activeKey) return;
    if (!selectedPeriodKey) {
      setSelectedPeriodKey(activeKey);
    }
    const currentLocks = { ...(state.toolConfigs?.monthLock || {}) };
    if (currentLocks[activeKey]) {
      delete currentLocks[activeKey];
      updateToolConfig('monthLock', currentLocks);
      pushSystemLog('CẬP NHẬT', 'Chốt sổ tháng', `Mở khóa sổ tháng ${activeMonthLabel} để điều chỉnh số liệu`);
    } else {
      const actor = getActiveActor();
      currentLocks[activeKey] = {
        by: actor,
        at: new Date().toISOString()
      };
      updateToolConfig('monthLock', currentLocks);
      pushSystemLog('CẬP NHẬT', 'Chốt sổ tháng', `Đã chốt sổ tháng ${activeMonthLabel}`);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
      {/* 1. Planning Start Date Selector (Mốc bắt đầu) */}
      <div className="h-9 px-3 rounded-xl bg-white border border-family-accent/15 shadow-2xs flex items-center gap-2 text-xs font-semibold text-family-text hover:border-family-accent/30 transition-colors whitespace-nowrap shrink-0">
        <span className="text-family-textMuted font-medium">Mốc bắt đầu:</span>
        <select
          value={activeStartKey}
          onChange={(e) => {
            const [year, month] = e.target.value.split('-').map(Number);
            updateProfile({ ...state.profile, planningStartMonth: month, planningStartYear: year });
          }}
          className="bg-transparent border-none text-family-accent focus:ring-0 cursor-pointer font-bold p-0 text-xs"
        >
          {startMonthOptions.map((opt) => (
             <option key={opt.key} value={opt.key} className="bg-white text-family-text">
               {opt.label}
             </option>
          ))}
        </select>
      </div>

      {/* 2. Observation Month Selector (Tháng quan sát) */}
      <div className="h-9 px-3 rounded-xl bg-white border border-family-accent/15 shadow-2xs flex items-center gap-2 text-xs font-semibold text-family-text hover:border-family-accent/30 transition-colors whitespace-nowrap shrink-0">
        <span className="text-family-textMuted font-medium">Tháng quan sát:</span>
        <select
          value={activeKey}
          onChange={(e) => { setSelectedPeriodKey(e.target.value); }}
          className="bg-transparent border-none text-family-accent focus:ring-0 cursor-pointer font-bold p-0 text-xs"
        >
          {projection.monthlyRows.map((row) => (
            <option key={row.period.key} value={row.period.key} className="bg-white text-family-text">
              {row.period.month < 10 ? `0${row.period.month}` : row.period.month}/{row.period.year}
            </option>
          ))}
        </select>
        {activeKey !== currentPeriod?.period.key && (
          <button
            onClick={() => { setSelectedPeriodKey(undefined); }}
            className="ml-1 px-1.5 py-0.5 text-[10px] font-bold text-white bg-family-accent/85 rounded-md hover:bg-family-accent transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer"
            title="Trở về tháng quan sát hiện tại"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>Hiện tại</span>
          </button>
        )}
      </div>

      {/* 3. Month Lock / Unlock toggle (Chốt sổ theo tháng quan sát) */}
      {activeKey && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleToggleLock}
            className={`h-9 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-2xs transition-all active:scale-95 cursor-pointer border ${
              isLocked
                ? 'bg-amber-50/90 hover:bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}
            title={
              isLocked
                ? `Tháng quan sát (${activeMonthLabel}) đã chốt sổ. Bấm để mở khóa chỉnh sửa dữ liệu`
                : `Bấm để chốt sổ tháng quan sát (${activeMonthLabel})`
            }
          >
            {isLocked ? (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Đã chốt {activeMonthLabel}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-200/80 hover:bg-amber-300 text-amber-900 ml-0.5 transition-colors">
                  Mở khóa
                </span>
              </>
            ) : (
              <>
                <LockOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Chốt sổ {activeMonthLabel}</span>
              </>
            )}
          </button>
          <HelpTooltip text={`Chốt sổ tháng quan sát (${activeMonthLabel}): Khóa các số liệu của tháng này để bảo toàn sổ sách tài chính gia đình. Khi cần điều chỉnh thu chi hay giao dịch, hai vợ chồng có thể mở khóa bất kỳ lúc nào.`} />
        </div>
      )}
    </div>
  );
};
