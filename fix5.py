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

replace_in_file('src/components/expense/ExpenseDashboard.tsx', [
    ('const [, setExpandedNodes]', 'const []')
])

replace_in_file('src/components/expense/ExpenseScheduleView.tsx', [
    ('const totalRemaining = ', '// const totalRemaining = '),
    ('const savingsThisMonth = ', '// const savingsThisMonth = ')
])

replace_in_file('src/components/expense/SavingsAndLiquidityView.tsx', [
    ('const currentPeriod = ', '// const currentPeriod = ')
])

replace_in_file('src/components/expense/SinkingFundModule_Liquidity.tsx', [
    (re.compile(r'\baddInvestmentDeal,\s*'), ''),
    (re.compile(r'\baddLifeEvent,\s*'), ''),
    ('const [flashWarningFundId, setFlashWarningFundId]', 'const [flashWarningFundId]'),
    ('const [flashWarningMessage, setFlashWarningMessage]', 'const [flashWarningMessage]')
])

replace_in_file('src/pages/LifeStages.tsx', [
    ('const [, setIsAdvisorOpen]', 'const []'),
    ('const [, setAdvisorSnapshot]', 'const []'),
    (re.compile(r'\(\_item, index\)'), '(_item, _index)')
])

print("SinkingFundModule_Liquidity fixes applied.")
