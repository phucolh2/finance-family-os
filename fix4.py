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

# src/components/expense/ExpenseDashboard.tsx
replace_in_file('src/components/expense/ExpenseDashboard.tsx', [
    ('const [, setExpandedNodes]', 'const []') # actually we can just comment it out
])

# src/components/expense/ExpenseScheduleView.tsx
replace_in_file('src/components/expense/ExpenseScheduleView.tsx', [
    ('const totalRemaining = ', '// const totalRemaining = '),
    ('const savingsThisMonth = ', '// const savingsThisMonth = ')
])

# src/components/expense/SavingsAndLiquidityView.tsx
replace_in_file('src/components/expense/SavingsAndLiquidityView.tsx', [
    ('const currentPeriod = ', '// const currentPeriod = ')
])

# src/components/portfolio/ExpertPortfolioCharts.tsx
replace_in_file('src/components/portfolio/ExpertPortfolioCharts.tsx', [
    ('const observedSinkingFunds = ', '// const observedSinkingFunds = ')
])

# src/pages/BudgetHistory.tsx
replace_in_file('src/pages/BudgetHistory.tsx', [
    (re.compile(r'\bflow,\s*'), '')
])

# src/pages/Dashboard.tsx
replace_in_file('src/pages/Dashboard.tsx', [
    ('const startingNetWorth = 0;', '// const startingNetWorth = 0;'),
    ('const radius = 22;', '// const radius = 22;')
])

# src/pages/LifeStages.tsx
replace_in_file('src/pages/LifeStages.tsx', [
    ('const [, setIsAdvisorOpen]', 'const []'),
    ('const [, setAdvisorSnapshot]', 'const []'),
    (re.compile(r'\(\_item, index\)'), '(_item, _index)')
])

# src/pages/Portfolio.tsx
replace_in_file('src/pages/Portfolio.tsx', [
    (re.compile(r'\bsetSelectedPeriodKey,?\r?\n'), ''),
    (re.compile(r'\baddInvestmentDeal,?\r?\n'), ''),
    (re.compile(r'\baddSavingsDeposit,?\r?\n'), ''),
    (re.compile(r'\bdisburseSinkingFund,?\r?\n'), ''),
    (re.compile(r'\bupdateSinkingFund,?\r?\n'), ''),
    ('const [editingDealId, setEditingDealId]', 'const [, setEditingDealId]'),
    ('const [convertingDealId, setConvertingDealId]', 'const [, setConvertingDealId]'),
    ('const [conversionForm]', '/* const [conversionForm] */'), # wait, it was const [conversionForm, setConversionForm]
    ('const [conversionForm, setConversionForm] = useState({', '/* const [conversionForm, setConversionForm] = useState({'),
    ('partialWithdrawValue: 0,\n  });', 'partialWithdrawValue: 0,\n  }); */'),
    ('partialWithdrawValue: 0,\r\n  });', 'partialWithdrawValue: 0,\r\n  }); */'),
    ("const [settleDealInputMode, setSettleDealInputMode] = useState<'amount' | 'rate'>('amount');", '/* settleDealInputMode */'),
    ('const [settleDealCustomRate, setSettleDealCustomRate] = useState<number>(0);', '/* settleDealCustomRate */'),
    ("const [convertDealInputMode, setConvertDealInputMode] = useState<'amount' | 'rate'>('amount');", '/* convertDealInputMode */'),
    ('const [convertDealCustomRate, setConvertDealCustomRate] = useState<number>(0);', '/* convertDealCustomRate */'),
    ('const getMonthsActive = (startMonth: number, startYear: number, endMonth: number, endYear: number) => {', '/* const getMonthsActive = (startMonth: number, startYear: number, endMonth: number, endYear: number) => {'),
    ('return Math.max(0, (endYear * 12 + endMonth) - (startYear * 12 + startMonth));\r\n  };', 'return Math.max(0, (endYear * 12 + endMonth) - (startYear * 12 + startMonth));\r\n  }; */'),
    ('return Math.max(0, (endYear * 12 + endMonth) - (startYear * 12 + startMonth));\n  };', 'return Math.max(0, (endYear * 12 + endMonth) - (startYear * 12 + startMonth));\n  }; */'),
    ('const genericUnallocatedPercent = totalObservedBalance > 0\n    ? (genericUnallocatedBalance / totalObservedBalance) * 100\n    : 100;', '/* const genericUnallocatedPercent = totalObservedBalance > 0\n    ? (genericUnallocatedBalance / totalObservedBalance) * 100\n    : 100; */'),
    ('const genericUnallocatedPercent = totalObservedBalance > 0\r\n    ? (genericUnallocatedBalance / totalObservedBalance) * 100\r\n    : 100;', '/* const genericUnallocatedPercent = totalObservedBalance > 0\r\n    ? (genericUnallocatedBalance / totalObservedBalance) * 100\r\n    : 100; */'),
    ('const savInterest = ', '// const savInterest = '),
    ('const cumContribution = ', '// const cumContribution = '),
    ('(entry, index)', '(_entry, index)'),
    ('(_entry, index)', '(_entry, _index)'), # catch if I renamed entry but not index
    ('const isOriginallyEarmarked = ', '// const isOriginallyEarmarked = ')
])

print("Fixes applied.")
