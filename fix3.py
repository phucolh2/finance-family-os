import re
import os

def replace_in_file(filepath, replacements):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    for search, replace in replacements:
        if isinstance(search, str):
            content = content.replace(search, replace)
        else:
            content = search.sub(replace, content)
            
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# src/components/expense/SavingsAndLiquidityView.tsx
replace_in_file('src/components/expense/SavingsAndLiquidityView.tsx', [
    (re.compile(r'const currentRow = [\s\S]*?: currentPeriod;'), '/* const currentRow... */')
])

# src/engines/projectionEngine.ts
replace_in_file('src/engines/projectionEngine.ts', [
    (re.compile(r'const _yearlyFireRes = calculateFire\(\{[\s\S]*?\}\);'), '/* const _yearlyFireRes = ... */'),
    (re.compile(r'const _assets ='), '// const _assets ='),
    (re.compile(r'const lifeStages ='), '// const lifeStages ='),
    ('const term = sf.termMonths || 1;', '// const term = sf.termMonths || 1;'),
    ('const _unallocatedForCompounding =', '// const _unallocatedForCompounding ='),
    ('const _actualInvestmentRateMonthly =', '// const _actualInvestmentRateMonthly ='),
    ('const _safeTotalEndingBalance =', '// const _safeTotalEndingBalance =')
])

# src/pages/Portfolio.tsx
replace_in_file('src/pages/Portfolio.tsx', [
    (re.compile(r'\bupdateAssets,\s*'), ''),
    ('const [conversionForm, setConversionForm] =', 'const [conversionForm] =')
])

print("Fixes applied.")
