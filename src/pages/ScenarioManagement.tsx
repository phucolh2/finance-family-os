import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { WarningBox } from '../components/ui/WarningBox';
import { runScenario } from '../engines/scenarioEngine';
import {
  formatTableMoneyVNDMillion,
  formatKpiMoneyVNDMillion,
  formatTooltipMoneyVNDMillion,
  formatAxisMoneyVNDMillion,
  formatMoneyVNDMillion,
} from '../utils/format';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GitCompare, Flame, AlertCircle, ShieldAlert } from 'lucide-react';

export const ScenarioManagement: React.FC = () => {
  const { state } = useAppContext();

  // Run Base Scenario (No Child) using pure engine overrides
  const baseProjection = runScenario(state, {
    childBirthMonth: undefined,
    childBirthYear: undefined,
  });

  // Run Child Scenario (Birth 10/2031)
  const childProjection = runScenario(state, {
    childBirthMonth: 10,
    childBirthYear: 2031,
  });

  // 1. Final Net Worth (at year 2060)
  const baseFinalRow = baseProjection.yearlyRows[baseProjection.yearlyRows.length - 1];
  const childFinalRow = childProjection.yearlyRows[childProjection.yearlyRows.length - 1];
  
  const baseFinalNW = baseFinalRow ? baseFinalRow.nominalNetWorth : 0;
  const childFinalNW = childFinalRow ? childFinalRow.nominalNetWorth : 0;
  const nwDifference = childFinalNW - baseFinalNW;

  // 2. FIRE Year Crossing
  const baseFireCrossing = baseProjection.monthlyRows.find((r) => r.nominalNetWorth >= r.fireTarget);
  const baseFireYear = baseFireCrossing ? baseFireCrossing.period.year : null;

  const childFireCrossing = childProjection.monthlyRows.find((r) => r.nominalNetWorth >= r.fireTarget);
  const childFireYear = childFireCrossing ? childFireCrossing.period.year : null;

  // 3. Total Child Cost
  const totalChildCost = childProjection.monthlyRows.reduce((sum, r) => sum + r.childCostMonthly, 0);

  // 4. Monthly Cashflow Impact / Avg Cashflow
  const baseAvgCashflow = baseProjection.monthlyRows.reduce((sum, r) => sum + r.netCashflowMonthly, 0) / (baseProjection.monthlyRows.length || 1);
  const childAvgCashflow = childProjection.monthlyRows.reduce((sum, r) => sum + r.netCashflowMonthly, 0) / (childProjection.monthlyRows.length || 1);

  // Prepare dual line chart data
  const comparisonChartData = baseProjection.yearlyRows.map((baseRow, idx) => {
    const childRow = childProjection.yearlyRows[idx] || baseRow;
    return {
      year: `${baseRow.year}`,
      'Kịch bản gốc (Không con)': Math.round(baseRow.nominalNetWorth),
      'Kịch bản có con 2031': Math.round(childRow.nominalNetWorth),
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-family-text flex items-center gap-3">
            <GitCompare className="w-8 h-8 text-family-accent" /> So sánh các kịch bản cuộc sống
          </h1>
          <p className="text-sm text-family-textMuted mt-1">
            So sánh tác động của các mốc sự kiện lớn lên bức tranh tài sản ròng và điểm tự do tài chính dài hạn.
          </p>
        </div>
      </div>

      {/* Side-by-Side KPI Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-family-accent">
          <CardHeader className="p-4">
            <CardDescription className="uppercase font-bold text-[10px]">Tài sản ròng cuối kỳ (2060)</CardDescription>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Gốc:</span>
                <span className="font-bold text-family-text">{formatKpiMoneyVNDMillion(baseFinalNW)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Có con:</span>
                <span className="font-bold text-family-text">{formatKpiMoneyVNDMillion(childFinalNW)}</span>
              </div>
              <div className="border-t border-family-accent/10 pt-1 flex justify-between text-xs font-bold text-red-600">
                <span>Chênh lệch:</span>
                <span>{formatTableMoneyVNDMillion(nwDifference)}</span>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="border-l-4 border-l-purple">
          <CardHeader className="p-4">
            <CardDescription className="uppercase font-bold text-[10px] flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-purple-700" /> Năm đạt FIRE dự kiến
            </CardDescription>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Kịch bản gốc:</span>
                <span className="font-bold text-family-text">{baseFireYear ? `Năm ${baseFireYear}` : 'Chưa đạt'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Kịch bản có con:</span>
                <span className="font-bold text-family-text">{childFireYear ? `Năm ${childFireYear}` : 'Chưa đạt'}</span>
              </div>
              <div className="border-t border-family-accent/10 pt-1 flex justify-between text-xs text-family-textLight">
                <span>Tác động:</span>
                <span className="font-semibold text-red-600">
                  {baseFireYear && childFireYear 
                    ? `Chậm ${childFireYear - baseFireYear} năm` 
                    : !childFireYear && baseFireYear 
                    ? 'Mất khả năng FIRE trước 2060'
                    : 'Không ảnh hưởng'}
                </span>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="border-l-4 border-l-green">
          <CardHeader className="p-4">
            <CardDescription className="uppercase font-bold text-[10px]">Tổng chi phí nuôi con phát sinh</CardDescription>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Giai đoạn 0-22 tuổi:</span>
                <span className="font-bold text-family-text">{formatKpiMoneyVNDMillion(totalChildCost)}</span>
              </div>
              <div className="flex justify-between text-xs text-family-textMuted">
                <span>Trung bình/năm:</span>
                <span>{formatKpiMoneyVNDMillion(totalChildCost / 23)}</span>
              </div>
              <div className="border-t border-family-accent/10 pt-1 text-[10px] text-family-textLight">
                Đã tính lạm phát giáo dục/y tế 6%/năm.
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="border-l-4 border-l-teal">
          <CardHeader className="p-4">
            <CardDescription className="uppercase font-bold text-[10px]">Dòng tiền ròng TB/tháng</CardDescription>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Kịch bản gốc:</span>
                <span className="font-bold text-family-text">{formatKpiMoneyVNDMillion(baseAvgCashflow)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Kịch bản có con:</span>
                <span className="font-bold text-family-text">{formatKpiMoneyVNDMillion(childAvgCashflow)}</span>
              </div>
              <div className="border-t border-family-accent/10 pt-1 flex justify-between text-xs font-bold text-red-600">
                <span>Chênh lệch:</span>
                <span>{formatMoneyVNDMillion(childAvgCashflow - baseAvgCashflow, { signed: true, decimals: 1 })}</span>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {childProjection.warnings.length > 0 && (
        <div className="space-y-1 border border-red-200/50 bg-red-50/20 p-4 rounded-2xl">
          <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" /> Cảnh báo an toàn kịch bản có con
          </h4>
          <p className="text-[11px] text-family-textMuted">
            Việc có con làm phát sinh thâm hụt ngân sách phân bổ vượt quá thu nhập thực tế trong các giai đoạn học tập. Hệ thống phát sinh cảnh báo thâm hụt dòng tiền ròng.
          </p>
        </div>
      )}

      {/* Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Biểu đồ so sánh tăng trưởng tài sản ròng</CardTitle>
          <CardDescription>
            Tài sản ròng danh nghĩa lũy kế: Kịch bản gốc vs Kịch bản có con 2031 (Đơn vị: Tr VND).
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={comparisonChartData} margin={{ top: 16, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(125, 83, 45, 0.08)" />
              <XAxis dataKey="year" stroke="#6f5d50" fontSize={10} />
              <YAxis stroke="#6f5d50" fontSize={10} tickFormatter={formatAxisMoneyVNDMillion} />
              <Tooltip formatter={(value) => formatTooltipMoneyVNDMillion(value)} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="Kịch bản gốc (Không con)" stroke="#6f5d50" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Kịch bản có con 2031" stroke="#d97706" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed comparison rows */}
      <Card>
        <CardHeader>
          <CardTitle>Bảng chi tiết chênh lệch tài sản qua các năm</CardTitle>
          <CardDescription>Đo lường chênh lệch tài sản danh nghĩa hàng năm giữa hai kịch bản cuộc đời.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-family-accent/10 text-family-textMuted font-bold bg-family-bgDark/30">
                <th className="p-3">Năm</th>
                <th className="p-3 text-right">Tài sản ròng (Kịch bản gốc)</th>
                <th className="p-3 text-right">Tài sản ròng (Kịch bản có con)</th>
                <th className="p-3 text-right bg-red-50">Chênh lệch tài sản</th>
                <th className="p-3 text-right">Tổng chi phí con năm đó</th>
              </tr>
            </thead>
            <tbody>
              {baseProjection.yearlyRows.map((baseRow, idx) => {
                const childRow = childProjection.yearlyRows[idx] || baseRow;
                const diff = childRow.nominalNetWorth - baseRow.nominalNetWorth;
                const yearlyChildCost = childProjection.monthlyRows
                  .filter((r) => r.period.year === baseRow.year)
                  .reduce((sum, r) => sum + r.childCostMonthly, 0);

                return (
                  <tr key={baseRow.year} className="border-b border-family-accent/5 hover:bg-family-bgDark/10">
                    <td className="p-3 font-semibold text-family-text">Năm {baseRow.year}</td>
                    <td className="p-3 text-right">{formatTableMoneyVNDMillion(baseRow.nominalNetWorth)}</td>
                    <td className="p-3 text-right">{formatTableMoneyVNDMillion(childRow.nominalNetWorth)}</td>
                    <td className={`p-3 text-right font-bold bg-red-50/40 ${diff < 0 ? 'text-red-700' : 'text-green-700'}`}>
                      {formatMoneyVNDMillion(diff, { signed: true, decimals: 2 })}
                    </td>
                    <td className="p-3 text-right text-family-accent font-bold">
                      {yearlyChildCost > 0 ? formatTableMoneyVNDMillion(yearlyChildCost) : '---'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};
