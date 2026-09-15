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

replace_in_file('src/components/expense/SavingsAndLiquidityView.tsx', [
    ('const nowKey = ', '// const nowKey = '),
    (re.compile(r'\bprojection,\s*'), '')
])

replace_in_file('src/components/portfolio/ExpertPortfolioCharts.tsx', [
    ('const observedSinkingFunds = ', '// const observedSinkingFunds = ')
])

replace_in_file('src/pages/BudgetHistory.tsx', [
    (re.compile(r'\bflow,\s*'), '')
])

replace_in_file('src/pages/Dashboard.tsx', [
    ('const startingNetWorth = 0;', '// const startingNetWorth = 0;')
])

replace_in_file('src/pages/LifeStages.tsx', [
    (re.compile(r'\(index\) =>'), '(_index) =>'),
    (re.compile(r'\(\_item,\s*index\)'), '(_item, _index)'),
    (re.compile(r'\(\_stage,\s*index\)'), '(_stage, _index)'),
    (re.compile(r'\(stage,\s*index\)'), '(stage, _index)')
])

replace_in_file('src/pages/Portfolio.tsx', [
    (re.compile(r'\bupdateAssets,\s*'), ''),
    ('const [conversionForm] = useState({', '/* const [conversionForm] = useState({'),
    ('partialWithdrawValue: 0,\n  });', 'partialWithdrawValue: 0,\n  }); */'),
    ('partialWithdrawValue: 0,\r\n  });', 'partialWithdrawValue: 0,\r\n  }); */')
])

print("Fixes applied.")
