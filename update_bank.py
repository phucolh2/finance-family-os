import re

with open('src/components/portfolio/SinkingFundModule.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add import
if 'VIETNAM_BANKS' not in content:
    content = content.replace("import type { FundingSourceId } from '../../constants/fundingSources';", "import type { FundingSourceId } from '../../constants/fundingSources';\nimport { VIETNAM_BANKS } from '../../constants/banks';")

# 2. Add to form state
if 'depositBank: \'\',' not in content:
    content = content.replace("fundGroup: '',", "fundGroup: '',\n    depositBank: '',")

# 3. Add to setForm in add
if 'depositBank: \'\'' not in content:
    content = content.replace("fundGroup: '', initialDeposit", "fundGroup: '', depositBank: '', initialDeposit")

# 4. Add to setForm in onEdit
if 'depositBank: fund.depositBank || \'\',' not in content:
    content = content.replace("fundGroup: fund.fundGroup || '',", "fundGroup: fund.fundGroup || '',\n                     depositBank: fund.depositBank || '',")

# 5. Add UI field
ui_field = '''            </div>
            <div className="sm:col-span-1 lg:col-span-1">
              <label className="block text-xs font-semibold text-family-textMuted uppercase tracking-wider mb-1">Ngân hàng</label>
              <select
                className="block w-full rounded-xl border border-family-accent/20 bg-white/60 py-2.5 px-3 text-sm text-family-text focus:border-family-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-family-accent transition-colors"
                value={form.depositBank}
                onChange={(e) => { setForm({ ...form, depositBank: e.target.value }); }}
              >
                <option value="">-- Chọn NH / Ví --</option>
                {VIETNAM_BANKS.map(bank => (
                  <option key={bank.id} value={bank.id}>{bank.name}</option>
                ))}
              </select>
            </div>'''
if 'Ngân hàng' not in content:
    content = content.replace('            </div>\n            <div className="sm:col-span-2 lg:col-span-2">\n              <label className="block text-xs font-semibold text-family-textMuted uppercase tracking-wider mb-1">Nguồn tiền</label>', ui_field + '\n            <div className="sm:col-span-1 lg:col-span-1">\n              <label className="block text-xs font-semibold text-family-textMuted uppercase tracking-wider mb-1">Nguồn tiền</label>')

# 6. Display in renderCashflowDetails
# I will find the top part of renderCashflowDetails and insert the bank info there
if 'Ngân hàng gửi:' not in content:
    details_part = '''<div className="bg-white/60 p-3 rounded-lg border border-family-accent/10 text-xs space-y-2 mt-1">
                         {fund.depositBank && (
                             <div className="flex justify-between border-b border-gray-100 pb-1">
                                <span className="text-family-textMuted">Ngân hàng gửi:</span>
                                <span className="font-semibold">{VIETNAM_BANKS.find(b => b.id === fund.depositBank)?.name || fund.depositBank}</span>
                             </div>
                         )}'''
    content = content.replace('<div className="bg-white/60 p-3 rounded-lg border border-family-accent/10 text-xs space-y-2 mt-1">', details_part)

with open('src/components/portfolio/SinkingFundModule.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
