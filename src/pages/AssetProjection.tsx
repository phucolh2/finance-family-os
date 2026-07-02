import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { WarningBox } from '../components/ui/WarningBox';
import { EmptyState } from '../components/ui/EmptyState';
import { runProjection } from '../engines/projectionEngine';
import { formatTableMoneyVNDMillion } from '../utils/format';
import { safeNumber } from '../utils/math';
import { Save, CalendarRange, Eye } from 'lucide-react';
import type { FamilyProfile } from '../types/finance';

export const AssetProjection: React.FC = () => {
  const { state, updateProfile, updateAssumptions, addProjectionAdjustment, updateProjectionAdjustment, deleteProjectionAdjustment } = useAppContext();

  // Local state for profile inputs before saving
  const [profileForm, setProfileForm] = useState<FamilyProfile>({ ...state.profile });
  const [assumptionsForm, setAssumptionsForm] = useState({
    investmentYieldExpectationAnnual: state.assumptions.investmentYieldExpectationAnnual,
    savingsInterestRateAnnual: state.assumptions.savingsInterestRateAnnual,
  });
  const [scenario, setScenario] = useState<string>('base'); // 'base' | 'child_2031'

  // Local state for projection adjustments form
  const [showAdjForm, setShowAdjForm] = useState(false);
  const [adjForm, setAdjForm] = useState<Partial<import('../types/projection').ProjectionAdjustmentRecord>>({
    startMonth: 1, startYear: 2025, endMonth: 12, endYear: 2030,
    annualInvestmentProfit: null, monthlyInvestmentProfit: null, oneTimeInvestmentProfit: null, adjustedSavingRate: null
  });

  // Prepare events based on active scenario
  const activeEvents = state.lifeEvents.filter((e) => {
    if (scenario === 'base') {
      // Exclude child birth related events if basic scenario
      return e.type !== 'child_birth';
    }
    return true;
  });

  // If scenario is 'child_2031', we can inject a mock child birth stage or event if needed,
  // but for Phase 4 we just filter state events.
  
  // Run projection engine dynamically (pure function call)
  const projection = runProjection({
    profile: state.profile,
    incomeSchedule: state.incomeSchedule,
    budgetSchedule: state.budgetSchedule,
    lifeEvents: activeEvents,
    assets: state.assets,
    assumptions: state.assumptions,
    investmentDeals: state.investmentDeals,
    projectionAdjustments: state.projectionAdjustments,
  });

  useEffect(() => {
    setProfileForm({ ...state.profile });
    setAssumptionsForm({
      investmentYieldExpectationAnnual: state.assumptions.investmentYieldExpectationAnnual,
      savingsInterestRateAnnual: state.assumptions.savingsInterestRateAnnual,
    });
  }, [state.profile, state.assumptions]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(profileForm);
    updateAssumptions({
      ...state.assumptions,
      investmentYieldExpectationAnnual: assumptionsForm.investmentYieldExpectationAnnual,
      savingsInterestRateAnnual: assumptionsForm.savingsInterestRateAnnual,
    });
  };

  const handleProfileChange = (key: keyof FamilyProfile, val: any) => {
    setProfileForm({
      ...profileForm,
      [key]: val,
    });
  };

  const handleAddAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjForm.startMonth || !adjForm.startYear || !adjForm.endMonth || !adjForm.endYear) return;
    addProjectionAdjustment(adjForm as import('../types/projection').ProjectionAdjustmentRecord);
    setShowAdjForm(false);
    setAdjForm({
      startMonth: 1, startYear: 2025, endMonth: 12, endYear: 2030,
      annualInvestmentProfit: null, monthlyInvestmentProfit: null, oneTimeInvestmentProfit: null, adjustedSavingRate: null
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-family-text">Tài sản & Dòng tiền</h1>
          <p className="text-sm text-family-textMuted mt-1">
            Bảng dự phóng tài sản ròng, số dư quỹ và sức mua thực tế qua các giai đoạn cuộc đời.
          </p>
        </div>
      </div>

      {/* Configuration Controls */}
      <Card className="bg-family-bgDark/20 border-family-accent/15">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarRange className="w-5 h-5 text-family-accent" /> Thiết lập thời gian & Kịch bản
          </CardTitle>
          <CardDescription>
            Định cấu hình các mốc thời gian, độ tuổi của vợ chồng và lựa chọn kịch bản để chạy mô phỏng.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <Input
                label="Tuổi chồng bắt đầu"
                type="number"
                value={profileForm.husbandAgeAtStart}
                onChange={(e) => handleProfileChange('husbandAgeAtStart', safeNumber(Number(e.target.value)))}
                required
              />
              <Input
                label="Tuổi vợ bắt đầu"
                type="number"
                value={profileForm.wifeAgeAtStart}
                onChange={(e) => handleProfileChange('wifeAgeAtStart', safeNumber(Number(e.target.value)))}
                required
              />
              <Input
                label="Tháng bắt đầu"
                type="number"
                min={1}
                max={12}
                value={profileForm.planningStartMonth}
                onChange={(e) => handleProfileChange('planningStartMonth', safeNumber(Number(e.target.value)))}
                required
              />
              <Input
                label="Năm bắt đầu"
                type="number"
                value={profileForm.planningStartYear}
                onChange={(e) => handleProfileChange('planningStartYear', safeNumber(Number(e.target.value)))}
                required
              />
              <Input
                label="Tháng kết thúc"
                type="number"
                min={1}
                max={12}
                value={profileForm.planningEndMonth}
                onChange={(e) => handleProfileChange('planningEndMonth', safeNumber(Number(e.target.value)))}
                required
              />
              <Input
                label="Năm kết thúc"
                type="number"
                value={profileForm.planningEndYear}
                onChange={(e) => handleProfileChange('planningEndYear', safeNumber(Number(e.target.value)))}
                required
              />
              <Input
                label="Lãi suất ĐT mặc định (%/năm)"
                type="number"
                step="0.1"
                value={assumptionsForm.investmentYieldExpectationAnnual}
                onChange={(e) => setAssumptionsForm({ ...assumptionsForm, investmentYieldExpectationAnnual: safeNumber(Number(e.target.value)) })}
                required
              />
              <Input
                label="Lãi suất TK mặc định (%/năm)"
                type="number"
                step="0.1"
                value={assumptionsForm.savingsInterestRateAnnual}
                onChange={(e) => setAssumptionsForm({ ...assumptionsForm, savingsInterestRateAnnual: safeNumber(Number(e.target.value)) })}
                required
              />
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-end justify-between border-t border-family-accent/5 pt-4">
              <div className="w-full md:w-72">
                <Select
                  label="Chọn kịch bản dự phóng"
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  options={[
                    { value: 'base', label: 'Kịch bản gốc (Không có con)' },
                    { value: 'child_2031', label: 'Kịch bản có con 2031 (năm Hợi)' },
                  ]}
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Button type="submit" className="w-full md:w-auto gap-2">
                  <Save className="w-4 h-4" /> Lưu & Chạy lại mô phỏng
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Adjustment Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Lợi nhuận/lãi suất dự phóng/thực tế</CardTitle>
            <CardDescription>Điền các thông số biến động đặc biệt theo từng giai đoạn</CardDescription>
          </div>
          <Button onClick={() => setShowAdjForm(!showAdjForm)}>Thêm giai đoạn</Button>
        </CardHeader>
        <CardContent>
          {showAdjForm && (
            <form onSubmit={handleAddAdjustment} className="mb-6 p-4 border border-family-accent/20 rounded-xl bg-family-bgDark/20 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Input label="Từ Tháng" type="number" min={1} max={12} value={adjForm.startMonth} onChange={e => setAdjForm({ ...adjForm, startMonth: Number(e.target.value) })} required />
                <Input label="Từ Năm" type="number" value={adjForm.startYear} onChange={e => setAdjForm({ ...adjForm, startYear: Number(e.target.value) })} required />
                <Input label="Đến Tháng" type="number" min={1} max={12} value={adjForm.endMonth} onChange={e => setAdjForm({ ...adjForm, endMonth: Number(e.target.value) })} required />
                <Input label="Đến Năm" type="number" value={adjForm.endYear} onChange={e => setAdjForm({ ...adjForm, endYear: Number(e.target.value) })} required />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Input label="LN đầu tư hằng năm (Tr)" type="number" step="0.1" value={adjForm.annualInvestmentProfit ?? ''} onChange={e => setAdjForm({ ...adjForm, annualInvestmentProfit: e.target.value ? Number(e.target.value) : null })} />
                <Input label="LN đầu tư hằng tháng (Tr)" type="number" step="0.1" value={adjForm.monthlyInvestmentProfit ?? ''} onChange={e => setAdjForm({ ...adjForm, monthlyInvestmentProfit: e.target.value ? Number(e.target.value) : null })} />
                <Input label="LN đầu tư KĐK (Tr)" type="number" step="0.1" value={adjForm.oneTimeInvestmentProfit ?? ''} onChange={e => setAdjForm({ ...adjForm, oneTimeInvestmentProfit: e.target.value ? Number(e.target.value) : null })} />
                <Input label="Lãi suất TK (%/năm)" type="number" step="0.1" value={adjForm.adjustedSavingRate ?? ''} onChange={e => setAdjForm({ ...adjForm, adjustedSavingRate: e.target.value ? Number(e.target.value) : null })} placeholder="Theo thiết lập chung" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setShowAdjForm(false)}>Hủy</Button>
                <Button type="submit">Lưu lại</Button>
              </div>
            </form>
          )}

          {(!state.projectionAdjustments || state.projectionAdjustments.length === 0) && !showAdjForm ? (
            <EmptyState title="Chưa có điều chỉnh nào" description="Bạn có thể thêm các khoản lợi nhuận đặc biệt cho từng năm tại đây." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-family-accent/10 text-family-textMuted bg-family-bgDark/30">
                    <th className="p-3">Giai đoạn</th>
                    <th className="p-3 text-right">LN hằng năm (Tr)</th>
                    <th className="p-3 text-right">LN hằng tháng (Tr)</th>
                    <th className="p-3 text-right">LN k. định kỳ (Tr)</th>
                    <th className="p-3 text-right">Lãi suất TK (%/năm)</th>
                    <th className="p-3 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody>
                  {state.projectionAdjustments?.map(adj => (
                    <tr key={adj.id} className="border-b border-family-accent/5 hover:bg-family-bgDark/10">
                      <td className="p-3 font-semibold">{adj.startMonth}/{adj.startYear} - {adj.endMonth}/{adj.endYear}</td>
                      <td className="p-3 text-right text-lime-500 font-bold">{adj.annualInvestmentProfit ?? '-'}</td>
                      <td className="p-3 text-right text-lime-500 font-bold">{adj.monthlyInvestmentProfit ?? '-'}</td>
                      <td className="p-3 text-right text-emerald-500 font-bold">{adj.oneTimeInvestmentProfit ?? '-'}</td>
                      <td className="p-3 text-right text-blue-500 font-bold">{adj.adjustedSavingRate ?? 'Mặc định'}</td>
                      <td className="p-3 text-center">
                        <Button variant="outline" onClick={() => deleteProjectionAdjustment(adj.id)} className="h-8 w-8 p-1 text-red-500 border-red-500/20 hover:bg-red-500/10">X</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warnings */}
      {projection.warnings.length > 0 && (
        <div className="space-y-2">
          {projection.warnings.map((w, idx) => (
            <WarningBox key={idx} type="warning" message={w} />
          ))}
        </div>
      )}

      {/* Yearly Projection Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bảng dự phóng tích lũy năm (Yearly Aggregation Table)</CardTitle>
          <CardDescription>
            Các chỉ số tài chính được gộp vào tháng 12 hàng năm. Bôi vàng để nhấn mạnh Net Worth danh nghĩa và sức mua thực tế.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {projection.yearlyRows.length > 0 ? (
            <table className="min-w-[1000px] w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-family-accent/10 text-family-textMuted font-bold bg-family-bgDark/30">
                  <th className="p-3">Năm</th>
                  <th className="p-3 text-right">Chi phí Con 1</th>
                  <th className="p-3 text-right">Chi phí Con 2</th>
                  <th className="p-3 text-right">Chi phí Khác</th>
                  <th className="p-3 text-right">Đầu tư TB/tháng</th>
                  <th className="p-3 text-right">Lãi suất ĐT/năm</th>
                  <th className="p-3 text-right">Số dư đầu tư</th>
                  <th className="p-3 text-right">Tiết kiệm TB/tháng</th>
                  <th className="p-3 text-right">Lãi suất TK/năm</th>
                  <th className="p-3 text-right">Số dư tiết kiệm</th>
                  <th className="p-3 text-right">Số dư tài sản</th>
                  <th className="p-3 text-right">PCF/Tháng</th>
                </tr>
              </thead>
              <tbody>
                {projection.yearlyRows.map((row: any) => (
                  <tr key={row.year} className="border-b border-family-accent/5 hover:bg-family-bgDark/10">
                    <td className="p-3 font-bold text-family-text">{row.year}</td>
                    <td className="p-3 text-right text-orange-500">{formatTableMoneyVNDMillion(row._childCost1)}</td>
                    <td className="p-3 text-right text-orange-500">{formatTableMoneyVNDMillion(row._childCost2)}</td>
                    <td className="p-3 text-right text-orange-400">{formatTableMoneyVNDMillion(row._childCostOther)}</td>
                    <td className="p-3 text-right">{formatTableMoneyVNDMillion(row.averageInvestmentMonthly)}</td>
                    <td className="p-3 text-right text-family-textMuted">{row.investmentReturnRateAnnual}%</td>
                    <td className="p-3 text-right font-bold text-lime-500">{formatTableMoneyVNDMillion(row.endingInvestmentBalance)}</td>
                    <td className="p-3 text-right">{formatTableMoneyVNDMillion(row.averageSavingMonthly)}</td>
                    <td className="p-3 text-right text-family-textMuted">{row.savingInterestRateAnnual}%</td>
                    <td className="p-3 text-right font-bold text-blue-500">{formatTableMoneyVNDMillion(row.endingSavingBalance)}</td>
                    <td className="p-3 text-right font-bold text-family-accent bg-family-bgDark/20">
                      {formatTableMoneyVNDMillion(row.endingInvestmentBalance + row.endingSavingBalance)}
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-500 bg-emerald-500/10">
                      {formatTableMoneyVNDMillion(row.passiveCashFlowMonthly)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState title="Không thể chạy dự phóng" description="Vui lòng kiểm tra lại mốc thời gian cài đặt." />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
