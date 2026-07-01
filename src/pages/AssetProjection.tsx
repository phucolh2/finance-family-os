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
  const { state, updateProfile } = useAppContext();

  // Local state for profile inputs before saving
  const [profileForm, setProfileForm] = useState<FamilyProfile>({ ...state.profile });
  const [scenario, setScenario] = useState<string>('base'); // 'base' | 'child_2031'

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
  });

  useEffect(() => {
    setProfileForm({ ...state.profile });
  }, [state.profile]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(profileForm);
  };

  const handleProfileChange = (key: keyof FamilyProfile, val: any) => {
    setProfileForm({
      ...profileForm,
      [key]: val,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-family-text">Dự phóng tài sản</h1>
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
                  <th className="p-3">Tuổi Chồng</th>
                  <th className="p-3">Tuổi Vợ</th>
                  <th className="p-3 text-right">Thu nhập cuối năm</th>
                  <th className="p-3 text-right">Tổng thu năm</th>
                  <th className="p-3 text-right">Tổng chi năm</th>
                  <th className="p-3 text-right">Đầu tư TB/tháng</th>
                  <th className="p-3 text-right">Số dư đầu tư</th>
                  <th className="p-3 text-right">Số dư tiết kiệm</th>
                  <th className="p-3 text-right">Net Worth</th>
                  <th className="p-3 text-right">Sức mua hiện tại</th>
                  <th className="p-3">Sự kiện / Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {projection.yearlyRows.map((row) => (
                  <tr key={row.year} className="border-b border-family-accent/5 hover:bg-family-bgDark/10">
                    <td className="p-3 font-bold text-family-text">{row.year}</td>
                    <td className="p-3">{row.husbandAge}</td>
                    <td className="p-3">{row.wifeAge}</td>
                    <td className="p-3 text-right">{formatTableMoneyVNDMillion(row.monthlyIncomeEndYear)}</td>
                    <td className="p-3 text-right font-semibold">{formatTableMoneyVNDMillion(row.totalIncomeYearly)}</td>
                    <td className="p-3 text-right text-red-600 font-semibold">{formatTableMoneyVNDMillion(row.totalExpensesYearly)}</td>
                    <td className="p-3 text-right">{formatTableMoneyVNDMillion(row.averageInvestmentMonthly)}</td>
                    <td className="p-3 text-right">{formatTableMoneyVNDMillion(row.endingInvestmentBalance)}</td>
                    <td className="p-3 text-right">{formatTableMoneyVNDMillion(row.endingSavingBalance)}</td>
                    <td className="p-3 text-right font-bold text-family-accent bg-family-bgDark/20">
                      {formatTableMoneyVNDMillion(row.nominalNetWorth)}
                    </td>
                    <td className="p-3 text-right font-bold text-green-800 bg-green-50/40">
                      {formatTableMoneyVNDMillion(row.realNetWorth)}
                    </td>
                    <td className="p-3 max-w-[150px] truncate text-family-textLight font-medium" title={row.lifeEventNotes.join(', ')}>
                      {row.lifeEventNotes.join(', ') || '---'}
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
