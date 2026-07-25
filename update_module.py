import os
import re

with open('src/components/portfolio/SinkingFundModule.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Import simulateSinkingFund
if 'import { simulateSinkingFund }' not in code:
    code = code.replace(
        "import { runProjection } from '../../engines/projectionEngine';",
        "import { runProjection } from '../../engines/projectionEngine';\nimport { simulateSinkingFund } from '../../engines/sinkingFundEngine';"
    )

# 2. Replace getFundBalance
get_fund_balance_pattern = r'  // Helper to find latest state of a fund from projection\n  const getFundBalance = \(fundId: string\) => \{.*?(?:return \{\s*balance,\s*progress,\s*buckets,\s*nonTermCash,\s*totalDisbursed\s*\};\n  \};)'

new_get_fund_balance = """  // Helper to find latest state of a fund from projection
  const getFundBalance = (fundId: string) => {
    const now = new Date();
    const nowKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const activeRow = (projection.monthlyRows.length > 0 && selectedPeriodKey)
      ? (projection.monthlyRows.find(r => r.period.key === selectedPeriodKey) || projection.monthlyRows[0])
      : (projection.monthlyRows.find(r => r.period.key === nowKey) || projection.monthlyRows[0]);

    const currentObservedMonth = activeRow ? activeRow.period.month : initMonth;
    const currentObservedYear = activeRow ? activeRow.period.year : initYear;

    const fund = activeFunds.find(f => f.id === fundId);
    if (!fund) return { balance: 0, progress: 0, buckets: [], nonTermCash: 0, totalDisbursed: 0, autoRefundsByMonth: {} };
    
    const { nonTermCash, buckets, totalPrincipal, autoRefundsByMonth } = simulateSinkingFund(fund, currentObservedMonth, currentObservedYear);
    
    // Add current month accrued interest to balance display
    let currentAccruedInterest = 0;
    buckets.forEach(b => {
      const currentValue = currentObservedYear * 12 + currentObservedMonth;
      const m = currentValue;
      if (m > b.termStart && m < b.termStart + b.termMonths) {
          currentAccruedInterest += b.principal * (b.interestRateAnnual / 100 / 12) * (m - b.termStart);
      }
    });

    const balance = totalPrincipal + nonTermCash + currentAccruedInterest;
    let progress = 0;
    if (fund.targetAmount > 0) {
       progress = Math.min(100, Math.round((balance / fund.targetAmount) * 100));
    }
    
    const totalDisbursed = (fund.withdrawals || []).reduce((sum, w) => sum + w.amount, 0);

    return { balance, progress, buckets, nonTermCash, totalDisbursed, autoRefundsByMonth };
  };"""

code = re.sub(get_fund_balance_pattern, new_get_fund_balance, code, flags=re.DOTALL)

# 3. Add UI inputs for depositBank and rolloverStrategy per bucket
ui_pattern = r'(<span className="text-\[10px\] text-family-textMuted">Lãi suất:</span>.*?%/năm\s*</div>\s*</div>)'

new_ui = """\\1
                                        <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-gray-100">
                                            <div className="flex items-center gap-1">
                                               <span className="text-[10px] text-family-textMuted w-16">Ngân hàng:</span>
                                               <select
                                                  value={fund.periodConfigs?.[pKey]?.depositBank || b.depositBank || fund.depositBank || ''}
                                                  onChange={(e) => {
                                                     const updatedConfigs = {
                                                        ...(fund.periodConfigs || {}),
                                                        [pKey]: {
                                                           ...(fund.periodConfigs?.[pKey] || {}),
                                                           depositBank: e.target.value,
                                                        }
                                                     };
                                                     updateSinkingFund({
                                                        ...fund,
                                                        periodConfigs: updatedConfigs,
                                                     });
                                                  }}
                                                  className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 font-medium text-family-text focus:outline-none focus:ring-1 focus:ring-family-accent flex-1"
                                               >
                                                  <option value="">Chọn ngân hàng</option>
                                                  {VIETNAM_BANKS.map((bank) => (
                                                    <option key={bank.id} value={bank.id}>{bank.name}</option>
                                                  ))}
                                               </select>
                                            </div>
                                            <div className="flex items-center gap-1">
                                               <span className="text-[10px] text-family-textMuted w-16">Tái tục:</span>
                                               <select
                                                  value={fund.periodConfigs?.[pKey]?.rolloverStrategy || b.rolloverStrategy || fund.rolloverStrategy || 'principal_and_interest'}
                                                  onChange={(e) => {
                                                     const updatedConfigs = {
                                                        ...(fund.periodConfigs || {}),
                                                        [pKey]: {
                                                           ...(fund.periodConfigs?.[pKey] || {}),
                                                           rolloverStrategy: e.target.value as any,
                                                        }
                                                     };
                                                     updateSinkingFund({
                                                        ...fund,
                                                        periodConfigs: updatedConfigs,
                                                     });
                                                  }}
                                                  className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 font-medium text-family-text focus:outline-none focus:ring-1 focus:ring-family-accent flex-1"
                                               >
                                                  <option value="principal_and_interest">Gốc + Lãi</option>
                                                  <option value="principal_only">Chỉ xoay vòng Gốc (Lãi rút về)</option>
                                                  <option value="none">Không xoay vòng (Đáo hạn vào quỹ chờ)</option>
                                                  <option value="return_to_source">Hoàn trả Nguồn (Tự động trừ vào nguồn trích quỹ)</option>
                                               </select>
                                            </div>
                                        </div>"""

code = re.sub(ui_pattern, new_ui, code, flags=re.DOTALL)

with open('src/components/portfolio/SinkingFundModule.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done updating module")
