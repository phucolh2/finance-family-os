import os
import re

with open('src/components/portfolio/SinkingFundModule.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update getFundBalance to destructure and return totalDeposited
# const { nonTermCash, buckets, totalPrincipal, autoRefundsByMonth } = simulateSinkingFund...
code = code.replace(
    "const { nonTermCash, buckets, totalPrincipal, autoRefundsByMonth } = simulateSinkingFund",
    "const { nonTermCash, buckets, totalPrincipal, autoRefundsByMonth, totalDeposited } = simulateSinkingFund"
)

code = code.replace(
    "return { balance, progress, buckets, nonTermCash, totalDisbursed, autoRefundsByMonth };",
    "return { balance, progress, buckets, nonTermCash, totalDisbursed, autoRefundsByMonth, totalDeposited };"
)

# 2. Update the UI in renderCashflowDetails
# Replace the lines showing Tổng vốn đã nộp and Lãi cộng dồn.
# Also, we need to declare totalDeposited in the destructuring:
code = code.replace(
    "const { balance, progress, totalDisbursed } = getFundBalance(fund.id);",
    "const { balance, progress, totalDisbursed, totalDeposited, nonTermCash } = getFundBalance(fund.id);"
)

# Replace the specific lines inside renderCashflowDetails
ui_pattern = r'<div className="flex justify-between border-b border-gray-100 pb-1">\s*<span className="text-family-textMuted">Tổng vốn đã nộp:</span>\s*<span className="font-semibold">\{formatTableMoneyVNDMillion\(getFundBalance\(fund\.id\)\.buckets\.reduce\(\(sum: number, b: any\) => sum \+ b\.principal, 0\)\)\} Tr</span>\s*</div>\s*<div className="flex justify-between border-b border-gray-100 pb-1">\s*<span className="text-family-textMuted">Lãi cộng dồn:</span>\s*<span className="font-semibold text-emerald-600">\+\{formatTableMoneyVNDMillion\(balance - getFundBalance\(fund\.id\)\.buckets\.reduce\(\(sum: number, b: any\) => sum \+ b\.principal, 0\)\)\} Tr</span>\s*</div>'

new_ui = """                         <div className="flex justify-between border-b border-gray-100 pb-1">
                            <span className="text-family-textMuted">Tổng vốn đã nộp:</span>
                            <span className="font-semibold">{formatTableMoneyVNDMillion(totalDeposited)} Tr</span>
                         </div>
                         <div className="flex justify-between border-b border-gray-100 pb-1">
                            <span className="text-family-textMuted">Lãi cộng dồn:</span>
                            <span className="font-semibold text-emerald-600">+{formatTableMoneyVNDMillion(balance - totalDeposited)} Tr</span>
                         </div>
                         {nonTermCash > 0 && (
                            <div className="flex justify-between border-b border-gray-100 pb-1 bg-yellow-50 px-1 rounded">
                               <span className="text-family-textMuted">Tiền chờ phân bổ (Không kỳ hạn):</span>
                               <span className="font-semibold text-amber-600">{formatTableMoneyVNDMillion(nonTermCash)} Tr</span>
                            </div>
                         )}"""

code = re.sub(ui_pattern, new_ui, code, flags=re.DOTALL)

with open('src/components/portfolio/SinkingFundModule.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done updating module UI for totalDeposited")
