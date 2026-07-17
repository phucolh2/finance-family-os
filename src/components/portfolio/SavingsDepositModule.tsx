import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { WarningBox } from '../ui/WarningBox';
import { EmptyState } from '../ui/EmptyState';
import { Save, Plus, Trash2, CheckCircle } from 'lucide-react';
import { formatTableMoneyVNDMillion } from '../../utils/format';
import { safeNumber } from '../../utils/math';
import { runProjection } from '../../engines/projectionEngine';

interface SavingsDepositModuleProps {
  defaultStartMonth?: number;
  defaultStartYear?: number;
  filterCurrentMonthOnly?: boolean;
}

export const SavingsDepositModule: React.FC<SavingsDepositModuleProps> = ({
  defaultStartMonth,
  defaultStartYear,
  filterCurrentMonthOnly = false
}) => {
  const { 
    state, 
    addSavingsDeposit,
    deleteSavingsDeposit,
    settleSavingsDepositEarly,
  } = useAppContext();

  // Run projection dynamically to calculate available balance for savings
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
  });

  const now = new Date();
  const initMonth = defaultStartMonth || now.getMonth() + 1;
  const initYear = defaultStartYear || now.getFullYear();

  const [showAddSavingsForm, setShowAddSavingsForm] = useState(false);
  const [savingsForm, setSavingsForm] = useState({
    name: '',
    principal: 0,
    interestRate: 5,
    termMonths: 12,
    startMonth: initMonth,
    startYear: initYear,
    pool: 'idle' as 'idle' | 'planned',
  });

  const [settlingSavingsId, setSettlingSavingsId] = useState<string | null>(null);
  const [settleSavingsForm, setSettleSavingsForm] = useState({
    settledMonth: initMonth,
    settledYear: initYear,
    realizedInterest: 0,
  });
  const [settleSavingsInputMode, setSettleSavingsInputMode] = useState<'amount' | 'rate'>('amount');
  const [settleSavingsCustomRate, setSettleSavingsCustomRate] = useState<number>(0);
  const [formError, setFormError] = useState<string | null>(null);

  const getMonthsActive = (startMonth: number, startYear: number, endMonth: number, endYear: number) => {
    return Math.max(0, (endYear * 12 + endMonth) - (startYear * 12 + startMonth));
  };

  // Calculate available savings pool balance for validation
  const savingsTargetMonthRow = projection.monthlyRows.find(
    (r) => r.period.month === savingsForm.startMonth && r.period.year === savingsForm.startYear
  );
  
  let availableSavingsPoolBalance = 0;
  if (savingsTargetMonthRow) {
    const port = savingsTargetMonthRow.portfolio;
    const invested = state.assets.reduce((sum, asset) => sum + port.assets[asset.type].endingBalance, 0);
    const planned = state.assets.reduce((sum, asset) => sum + (port.assets[asset.type].earmarkedEndingBalance || 0), 0);
    const idle = Math.max(0, port.totalEndingBalance - invested - planned);
    availableSavingsPoolBalance = savingsForm.pool === 'idle' ? idle : planned;
  } else {
    availableSavingsPoolBalance = safeNumber(state.profile.startingCapital, 100);
  }
  const isSavingsOverLimit = savingsForm.principal > availableSavingsPoolBalance;

  let displayDeposits = state.savingsDeposits || [];
  if (filterCurrentMonthOnly && defaultStartMonth && defaultStartYear) {
    displayDeposits = displayDeposits.filter(d => d.startMonth === defaultStartMonth && d.startYear === defaultStartYear);
  }

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <div className="w-full md:w-3/4">
          <h3 className="text-xl font-serif font-bold text-family-text flex items-center gap-2">
            🏦 Gửi Tiết kiệm Ngân hàng
          </h3>
          <p className="text-sm text-family-textMuted mt-1">
            Tạo các khoản gửi tiết kiệm từ phần tiền <strong>nhàn rỗi</strong> hoặc <strong>đã lên kế hoạch</strong>.
          </p>
        </div>
        <Button onClick={() => { setShowAddSavingsForm(!showAddSavingsForm); }} size="sm" className="gap-1 text-xs py-1 h-8 shrink-0">
          <Plus className="w-3.5 h-3.5" /> Tạo khoản tiết kiệm
        </Button>
      </div>

      {showAddSavingsForm && (
        <div className="mb-6 p-4 bg-sky-50/50 border border-sky-200/30 rounded-xl space-y-4">
          <h4 className="font-bold text-sm text-family-text">Tạo khoản Gửi tiết kiệm mới</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Input
              label="Tên khoản"
              value={savingsForm.name}
              onChange={(e) => { setSavingsForm({ ...savingsForm, name: e.target.value }); }}
              placeholder="VD: Tiết kiệm VCB 12 tháng"
            />
            <Input
              label="Số tiền gốc (Tr VND)"
              type="number"
              value={savingsForm.principal}
              onChange={(e) => { setSavingsForm({ ...savingsForm, principal: safeNumber(Number(e.target.value), 0) }); }}
            />
            <div>
              <label className="block text-xs font-semibold text-family-textMuted uppercase tracking-wider mb-1">Kì hạn</label>
              <select
                className="block w-full rounded-xl border border-family-accent/20 bg-white/60 py-2.5 px-3 text-sm text-family-text focus:border-family-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-family-accent transition-colors"
                value={savingsForm.termMonths}
                onChange={(e) => { setSavingsForm({ ...savingsForm, termMonths: Number(e.target.value) }); }}
              >
                <option value={1}>1 tháng</option>
                <option value={3}>3 tháng</option>
                <option value={6}>6 tháng</option>
                <option value={9}>9 tháng</option>
                <option value={12}>12 tháng</option>
                <option value={18}>18 tháng</option>
                <option value={24}>24 tháng</option>
                <option value={36}>36 tháng</option>
              </select>
            </div>
            <Input
              label="Lãi suất (%/năm)"
              type="number"
              value={savingsForm.interestRate}
              onChange={(e) => { setSavingsForm({ ...savingsForm, interestRate: safeNumber(Number(e.target.value), 0) }); }}
            />
            <Input
              label="Tháng bắt đầu"
              type="number"
              min={1}
              max={12}
              value={savingsForm.startMonth}
              onChange={(e) => { setSavingsForm({ ...savingsForm, startMonth: safeNumber(Number(e.target.value), 1) }); }}
            />
            <Input
              label="Năm bắt đầu"
              type="number"
              min={2024}
              max={2060}
              value={savingsForm.startYear}
              onChange={(e) => { setSavingsForm({ ...savingsForm, startYear: safeNumber(Number(e.target.value), 2026) }); }}
            />
            <div>
              <label className="block text-xs font-semibold text-family-textMuted uppercase tracking-wider mb-1">Nguồn vốn</label>
              <select
                className="block w-full rounded-xl border border-family-accent/20 bg-white/60 py-2.5 px-3 text-sm text-family-text focus:border-family-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-family-accent transition-colors"
                value={savingsForm.pool}
                onChange={(e) => { setSavingsForm({ ...savingsForm, pool: e.target.value as 'idle' | 'planned' }); }}
              >
                <option value="idle">Chưa có kế hoạch</option>
                <option value="planned">Đã lên kế hoạch</option>
              </select>
            </div>
          </div>

          {isSavingsOverLimit && (
            <WarningBox 
              type="danger" 
              message={`Số tiền gửi (${savingsForm.principal} Tr VND) vượt quá số dư khả dụng của nguồn vốn "${savingsForm.pool === 'idle' ? 'Chưa có kế hoạch' : 'Đã lên kế hoạch'}" tại tháng ${savingsForm.startMonth}/${savingsForm.startYear} (Số dư khả dụng: ${availableSavingsPoolBalance.toFixed(1)} Tr VND).`} 
            />
          )}
          {formError && (
            <WarningBox type="danger" message={formError} />
          )}

          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              className="gap-1"
              disabled={isSavingsOverLimit || savingsForm.principal <= 0 || !savingsForm.name.trim()}
              onClick={() => {
                if (isSavingsOverLimit) return;
                if (!savingsForm.name.trim()) {
                  setFormError('Vui lòng nhập tên khoản tiết kiệm.');
                  return;
                }
                if (savingsForm.principal <= 0) {
                  setFormError('Số tiền gốc phải lớn hơn 0.');
                  return;
                }
                addSavingsDeposit({
                  name: savingsForm.name.trim(),
                  principal: savingsForm.principal,
                  interestRateAnnual: savingsForm.interestRate,
                  termMonths: savingsForm.termMonths,
                  startMonth: savingsForm.startMonth,
                  startYear: savingsForm.startYear,
                  pool: savingsForm.pool,
                  status: 'active',
                });
                setShowAddSavingsForm(false);
                setSavingsForm({ name: '', principal: 0, interestRate: 5, termMonths: 12, startMonth: initMonth, startYear: initYear, pool: 'idle' });
                setFormError(null);
              }}
            >
              <Save className="w-3.5 h-3.5" /> Lưu
            </Button>
            <Button variant="secondary" size="sm" onClick={() => { setShowAddSavingsForm(false); }}>Hủy</Button>
          </div>
        </div>
      )}

      {displayDeposits.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-sky-200/30 text-family-textMuted font-bold bg-sky-50/30">
                <th className="p-3">Tên khoản</th>
                <th className="p-3 text-right">Gốc (Tr)</th>
                <th className="p-3 text-right">Lãi suất</th>
                <th className="p-3 text-right">Kì hạn</th>
                <th className="p-3 text-center">Bắt đầu</th>
                <th className="p-3 text-center">Đáo hạn</th>
                <th className="p-3 text-right">Lãi dự kiến</th>
                <th className="p-3 text-center">Nguồn</th>
                <th className="p-3 text-center">Trạng thái</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {displayDeposits.map((dep) => {
                const maturityMonth = ((dep.startMonth - 1 + dep.termMonths) % 12) + 1;
                const maturityYear = dep.startYear + Math.floor((dep.startMonth - 1 + dep.termMonths) / 12);
                
                const current = defaultStartYear && defaultStartMonth ? defaultStartYear * 12 + defaultStartMonth : now.getFullYear() * 12 + now.getMonth() + 1;
                const depStart = dep.startYear * 12 + dep.startMonth;
                const depEnd = depStart + dep.termMonths;
                
                const isActive = current >= depStart && current < depEnd && dep.status === 'active';
                const isSettledEarly = dep.status === 'settled_early';
                const isSettling = settlingSavingsId === dep.id;
                
                const expectedInterest = dep.principal * (dep.interestRateAnnual / 100 / 12) * dep.termMonths;
                const displayInterest = isSettledEarly ? (dep.realizedInterest || 0) : expectedInterest;

                return (
                  <React.Fragment key={dep.id}>
                    <tr className="border-b border-sky-100/50 hover:bg-sky-50/30">
                      <td className="p-3 font-semibold text-family-text">{dep.name}</td>
                      <td className="p-3 font-medium text-right">{formatTableMoneyVNDMillion(dep.principal)}</td>
                      <td className="p-3 font-bold text-sky-600 text-right">{dep.interestRateAnnual}%/năm</td>
                      <td className="p-3 text-right">{dep.termMonths} tháng</td>
                      <td className="p-3 text-center">{dep.startMonth}/{dep.startYear}</td>
                      <td className="p-3 font-medium text-center">
                        {isSettledEarly ? `${dep.settledMonth}/${dep.settledYear} (Tất toán)` : `${maturityMonth}/${maturityYear}`}
                      </td>
                      <td className="p-3 font-bold text-emerald-600 text-right">
                        +{formatTableMoneyVNDMillion(displayInterest)}
                        {isSettledEarly && <span className="text-[10px] text-orange-600 font-semibold block">(thực nhận)</span>}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${dep.pool === 'idle' ? 'bg-sky-100 text-sky-700' : 'bg-violet-100 text-violet-700'}`}>
                          {dep.pool === 'idle' ? 'Nhàn rỗi' : 'Kế hoạch'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {isSettledEarly ? (
                          <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">Tất toán trước hạn</span>
                        ) : isActive ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">Đang chạy</span>
                        ) : current >= depEnd ? (
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">Đã đáo hạn</span>
                        ) : (
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Chưa bắt đầu</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 justify-end">
                          {isActive && (
                            <button
                              onClick={() => {
                                setSettlingSavingsId(dep.id);
                                setSettleSavingsForm({
                                  settledMonth: defaultStartMonth || dep.startMonth,
                                  settledYear: defaultStartYear || dep.startYear,
                                  realizedInterest: 0,
                                });
                              }}
                              className="p-1 rounded-md text-sky-600 hover:text-sky-850 hover:bg-sky-50 transition-all"
                              title="Tất toán trước hạn"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => { deleteSavingsDeposit(dep.id); }}
                            className="p-1 rounded-md text-family-textMuted hover:text-red-500 hover:bg-red-500/10 transition-all"
                            title="Xóa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isSettling && (
                      <tr className="bg-sky-50/50 border-b border-sky-100/50">
                        <td colSpan={10} className="p-3">
                          <div className="flex flex-wrap items-center gap-4 text-xs bg-white/80 p-3 rounded-xl border border-sky-200">
                            <div className="font-bold text-sky-800">Thông tin tất toán trước hạn:</div>
                            <div className="flex items-center gap-2">
                              <label className="font-semibold text-family-text">Tháng chốt:</label>
                              <input
                                type="number"
                                min={1}
                                max={12}
                                value={settleSavingsForm.settledMonth}
                                onChange={(e) => {
                                  const m = safeNumber(Number(e.target.value), 12);
                                  setSettleSavingsForm({ ...settleSavingsForm, settledMonth: m });
                                  if (settleSavingsInputMode === 'rate') {
                                    const months = getMonthsActive(dep.startMonth, dep.startYear, m, settleSavingsForm.settledYear);
                                    const computed = dep.principal * (settleSavingsCustomRate / 100 / 12) * months;
                                    setSettleSavingsForm(prev => ({ ...prev, settledMonth: m, realizedInterest: Math.round(computed * 100) / 100 }));
                                  }
                                }}
                                className="w-14 text-center bg-white rounded-lg border border-sky-205 p-1"
                                required
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="font-semibold text-family-text">Năm chốt:</label>
                              <input
                                type="number"
                                min={2020}
                                max={2060}
                                value={settleSavingsForm.settledYear}
                                onChange={(e) => {
                                  const y = safeNumber(Number(e.target.value), 2026);
                                  setSettleSavingsForm({ ...settleSavingsForm, settledYear: y });
                                  if (settleSavingsInputMode === 'rate') {
                                    const months = getMonthsActive(dep.startMonth, dep.startYear, settleSavingsForm.settledMonth, y);
                                    const computed = dep.principal * (settleSavingsCustomRate / 100 / 12) * months;
                                    setSettleSavingsForm(prev => ({ ...prev, settledYear: y, realizedInterest: Math.round(computed * 100) / 100 }));
                                  }
                                }}
                                className="w-18 text-center bg-white rounded-lg border border-sky-205 p-1"
                                required
                              />
                            </div>
                            <div className="flex items-center gap-2 border-l pl-4 border-sky-100">
                              <label className="font-semibold text-family-text">Cách nhập lãi:</label>
                              <select
                                value={settleSavingsInputMode}
                                onChange={(e) => {
                                  const mode = e.target.value as 'amount' | 'rate';
                                  setSettleSavingsInputMode(mode);
                                  if (mode === 'amount') {
                                    setSettleSavingsForm(prev => ({ ...prev, realizedInterest: 0 }));
                                  } else {
                                    const months = getMonthsActive(dep.startMonth, dep.startYear, settleSavingsForm.settledMonth, settleSavingsForm.settledYear);
                                    const computed = dep.principal * (settleSavingsCustomRate / 100 / 12) * months;
                                    setSettleSavingsForm(prev => ({ ...prev, realizedInterest: Math.round(computed * 100) / 100 }));
                                  }
                                }}
                                className="bg-white rounded-lg border border-sky-200 p-1"
                              >
                                <option value="amount">Nhập số tiền</option>
                                <option value="rate">Nhập %/năm thực nhận</option>
                              </select>
                            </div>
                            {settleSavingsInputMode === 'amount' ? (
                              <div className="flex items-center gap-2">
                                <label className="font-semibold text-family-text">Lãi thực tế nhận được:</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={settleSavingsForm.realizedInterest}
                                  onChange={(e) => { setSettleSavingsForm({ ...settleSavingsForm, realizedInterest: safeNumber(Number(e.target.value), 0) }); }}
                                  className="w-20 text-center bg-white rounded-lg border border-sky-205 p-1 font-bold text-sky-700"
                                  required
                                />
                                <span className="font-bold text-family-textMuted">Tr VND</span>
                              </div>
                            ) : (
                              <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <label className="font-semibold text-family-text">Lãi suất thực nhận:</label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={settleSavingsCustomRate}
                                    onChange={(e) => {
                                      const rate = safeNumber(Number(e.target.value), 0);
                                      setSettleSavingsCustomRate(rate);
                                      const months = getMonthsActive(dep.startMonth, dep.startYear, settleSavingsForm.settledMonth, settleSavingsForm.settledYear);
                                      const computed = dep.principal * (rate / 100 / 12) * months;
                                      setSettleSavingsForm(prev => ({ ...prev, realizedInterest: Math.round(computed * 100) / 100 }));
                                    }}
                                    className="w-16 text-center bg-white rounded-lg border border-sky-205 p-1 font-bold text-sky-700"
                                    required
                                  />
                                  <span className="font-semibold text-family-textMuted">%/năm</span>
                                </div>
                                <div className="bg-sky-50 text-[10px] text-sky-800 font-semibold px-2 py-1 rounded-lg">
                                  Lãi tính từ {dep.startMonth}/{dep.startYear} đến {settleSavingsForm.settledMonth}/{settleSavingsForm.settledYear} ({getMonthsActive(dep.startMonth, dep.startYear, settleSavingsForm.settledMonth, settleSavingsForm.settledYear)} tháng): <span className="text-xs font-bold text-sky-700">+{settleSavingsForm.realizedInterest} Tr VND</span>
                                </div>
                              </div>
                            )}
                            <div className="flex gap-2 ml-auto">
                              <button
                                type="button"
                                onClick={() => {
                                  settleSavingsDepositEarly(dep.id, settleSavingsForm.settledMonth, settleSavingsForm.settledYear, settleSavingsForm.realizedInterest);
                                  setSettlingSavingsId(null);
                                }}
                                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold transition-all"
                              >
                                Xác nhận tất toán
                              </button>
                              <button
                                type="button"
                                onClick={() => { setSettlingSavingsId(null); }}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-family-text rounded-lg font-semibold transition-all"
                              >
                                Hủy
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState 
          title={filterCurrentMonthOnly ? "Chưa có khoản tiết kiệm nào trong tháng này" : "Chưa có khoản tiết kiệm nào"}
          description="Nhấn 'Tạo khoản tiết kiệm' để gửi tiết kiệm từ phần tiền chưa có kế hoạch hoặc đã lên kế hoạch."
        />
      )}
    </div>
  );
};
