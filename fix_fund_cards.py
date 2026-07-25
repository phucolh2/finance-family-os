import os
import re

# 1. Update types.ts
types_path = 'src/components/portfolio/fund-cards/types.ts'
with open(types_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('totalDisbursed: number;', 'totalDisbursed: number;\n  totalDeposited: number;')
with open(types_path, 'w', encoding='utf-8') as f:
    f.write(content)

# 2. Update LifestyleFundCard.tsx
lf_path = 'src/components/portfolio/fund-cards/LifestyleFundCard.tsx'
with open(lf_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('fund, balance, progress, totalDisbursed, isDisbursing,', 'fund, balance, progress, totalDisbursed, totalDeposited, isDisbursing,')
content = content.replace('Tổng vốn đã góp: <span className="font-semibold text-orange-900">{formatMoney(totalDisbursed)}</span>', 'Tổng vốn đã góp: <span className="font-semibold text-orange-900">{formatMoney(totalDeposited)}</span>')
with open(lf_path, 'w', encoding='utf-8') as f:
    f.write(content)

# 3. Update PortfolioFundCard.tsx
pf_path = 'src/components/portfolio/fund-cards/PortfolioFundCard.tsx'
with open(pf_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('fund, balance, progress, totalDisbursed, isDisbursing,', 'fund, balance, progress, totalDisbursed, totalDeposited, isDisbursing,')
content = content.replace('Vốn thực góp: <span className="font-medium text-slate-700">{formatMoney(totalDisbursed)}</span>', 'Vốn thực góp: <span className="font-medium text-slate-700">{formatMoney(totalDeposited)}</span>')
with open(pf_path, 'w', encoding='utf-8') as f:
    f.write(content)

# 4. Update SinkingFundModule.tsx
sf_path = 'src/components/portfolio/SinkingFundModule.tsx'
with open(sf_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('totalDisbursed={totalDisbursed}', 'totalDisbursed={totalDisbursed} totalDeposited={totalDeposited}')
with open(sf_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Card fixes applied")
