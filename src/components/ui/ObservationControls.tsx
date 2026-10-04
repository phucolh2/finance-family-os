import React, { useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { runProjection } from '../../engines/projectionEngine';
import { isPeriodKeyLocked } from '../../utils/monthLockStore';
import { getActiveActor } from '../../config/familyMembers';

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
    const currentLocks = { ...(state.toolConfigs?.monthLock || {}) };
    if (currentLocks[activeKey]) {
      delete currentLocks[activeKey];
      updateToolConfig('monthLock', currentLocks);
      pushSystemLog('CẬP NHẬT', 'Chốt sổ tháng', `Mở khóa sổ tháng ${activeKey} để điều chỉnh số liệu`);
    } else {
      const actor = getActiveActor();
      currentLocks[activeKey] = {
        by: actor,
        at: new Date().toISOString()
      };
      updateToolConfig('monthLock', currentLocks);
      pushSystemLog('CẬP NHẬT', 'Chốt sổ tháng', `Đã chốt sổ tháng ${activeKey}`);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* Planning Start Date Selector (Mốc bắt đầu) */}
      <div className="flex items-center gap-2 text-xs font-semibold text-family-text bg-white px-3 py-1.5 rounded-xl border border-family-accent/15 shadow-sm">
        <span className="text-family-textMuted font-medium whitespace-nowrap">Mốc bắt đầu:</span>
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

      {/* Observation Month Selector (Tháng quan sát) */}
      <div className="flex items-center gap-2 text-xs font-semibold text-family-text bg-white px-3 py-1.5 rounded-xl border border-family-accent/15 shadow-sm">
        <span className="text-family-textMuted font-medium whitespace-nowrap">Tháng quan sát:</span>
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
            className="ml-1 px-2 py-0.5 text-[10px] font-bold text-white bg-family-accent/80 rounded hover:bg-family-primary transition-colors whitespace-nowrap"
            title="Trở về hiện tại"
          >
            Về hiện tại
          </button>
        )}
      </div>

      {/* Month Lock / Unlock toggle (Chốt sổ tháng) */}
      {activeKey && (
        <button
          type="button"
          onClick={handleToggleLock}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm ${
            isLocked
              ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
          }`}
          title={isLocked ? `Tháng ${activeKey} đã chốt sổ. Bấm để mở khóa chỉnh sửa tự do` : `Bấm để chốt sổ tháng ${activeKey}`}
        >
          {isLocked ? (
            <>
              <span className="text-amber-600">🔒</span>
              <span>Đã chốt</span>
              <span className="text-[10px] underline ml-0.5 text-amber-700 font-normal hover:font-bold">(Mở khóa)</span>
            </>
          ) : (
            <>
              <span className="text-emerald-600">🔓</span>
              <span>Chốt sổ tháng</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
