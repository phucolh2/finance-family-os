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

# src/components/budget/BudgetDetailedList.tsx
replace_in_file('src/components/budget/BudgetDetailedList.tsx', [
    (re.compile(r'\(groupIdx\) =>'), '(_groupIdx) =>'),
    (re.compile(r'\(group, groupIdx\) =>'), '(group, _groupIdx) =>')
])

# src/components/budget/BudgetTreeNodeRow.tsx
replace_in_file('src/components/budget/BudgetTreeNodeRow.tsx', [
    (re.compile(r'const hasChildren = node\.children && node\.children\.length > 0;'), '// const hasChildren = node.children && node.children.length > 0;')
])

# src/components/expense/ExpenseDashboard.tsx
replace_in_file('src/components/expense/ExpenseDashboard.tsx', [
    (re.compile(r'const \[expandedNodes, setExpandedNodes\] = useState<Record<string, boolean>>\(\{\}\);'), 'const [, setExpandedNodes] = useState<Record<string, boolean>>({});'),
    ('const toggleExpand = (id: string) => {', '/* const toggleExpand = (id: string) => {'),
    ('}));\r\n  };', '}));\r\n  }; */'),
    ('}));\n  };', '}));\n  }; */'),
    ('const BREAKDOWN_COLORS = [', '/* const BREAKDOWN_COLORS = ['),
    ("];\n\n  return (", "]; */\n\n  return ("),
    ("];\r\n\r\n  return (", "]; */\r\n\r\n  return ("),
    ('(entry, index)', '(_entry, index)')
])

# src/components/expense/ExpenseScheduleView.tsx
replace_in_file('src/components/expense/ExpenseScheduleView.tsx', [
    ('const idleMoney = ', '// const idleMoney = '),
    ('(entry, index)', '(_entry, index)')
])

# src/components/expense/LiquidityBreakdownTable.tsx
replace_in_file('src/components/expense/LiquidityBreakdownTable.tsx', [
    ('const hasFlexibleDetails = ', '// const hasFlexibleDetails = ')
])

# src/components/expense/SavingsAndLiquidityView.tsx
replace_in_file('src/components/expense/SavingsAndLiquidityView.tsx', [
    ('const currentRow = ', '// const currentRow = ')
])

# src/components/expense/SinkingFundModule_Liquidity.tsx
replace_in_file('src/components/expense/SinkingFundModule_Liquidity.tsx', [
    (re.compile(r'\baddInvestmentDeal,\s*'), ''),
    (re.compile(r'\baddLifeEvent,\s*'), ''),
    ('const [flashWarningFundId, setFlashWarningFundId]', 'const [, setFlashWarningFundId]'),
    ('const [flashWarningMessage, setFlashWarningMessage]', 'const [, setFlashWarningMessage]')
])

# src/components/layout/Sidebar.test.tsx
replace_in_file('src/components/layout/Sidebar.test.tsx', [
    (re.compile(r"import React from 'react';\r?\n"), '')
])

# src/components/portfolio/DebtLiabilityModule.tsx
replace_in_file('src/components/portfolio/DebtLiabilityModule.tsx', [
    (re.compile(r'\bupdateDebt,\s*'), ''),
    (re.compile(r'\bsettleDebt\b\s*,?'), '')
])

# src/components/portfolio/ExpertPortfolioCharts.tsx
replace_in_file('src/components/portfolio/ExpertPortfolioCharts.tsx', [
    ('const observedSinkingFunds = ', '// const observedSinkingFunds = ')
])

# src/components/portfolio/SinkingFundModule_Portfolio.tsx
# src/components/reserves/SinkingFundModule_Reserves.tsx
# src/components/savings/SinkingFundModule_Savings.tsx
for fp in ['src/components/portfolio/SinkingFundModule_Portfolio.tsx', 'src/components/reserves/SinkingFundModule_Reserves.tsx', 'src/components/savings/SinkingFundModule_Savings.tsx']:
    replace_in_file(fp, [
        (re.compile(r'\baddInvestmentDeal,\s*'), ''),
        (re.compile(r'\baddLifeEvent,\s*'), '')
    ])

# src/components/ui/SmartAllocationAdvisorModal.tsx
replace_in_file('src/components/ui/SmartAllocationAdvisorModal.tsx', [
    (re.compile(r'\bArrowDownToLine,\s*'), ''),
    (re.compile(r'\bCheckCircle2\b\s*,?'), '')
])

# src/engines/databaseResolver.ts
replace_in_file('src/engines/databaseResolver.ts', [
    (re.compile(r'\bassumptions: Assumptions,'), '_assumptions: Assumptions,'),
    (re.compile(r'\blifeStages\?: LifeStage\['), '_lifeStages?: LifeStage[')
])

# src/engines/projectionEngine.ts
replace_in_file('src/engines/projectionEngine.ts', [
    (re.compile(r'const _assets ='), '// const _assets ='),
    (re.compile(r'const lifeStages ='), '// const lifeStages ='),
    ('const term = sf.termMonths || 1;', '// const term = sf.termMonths || 1;'),
    ('const _unallocatedForCompounding =', '// const _unallocatedForCompounding ='),
    ('const _actualInvestmentRateMonthly =', '// const _actualInvestmentRateMonthly ='),
    ('const _safeTotalEndingBalance =', '// const _safeTotalEndingBalance ='),
    ('const _yearlyFireRes =', '// const _yearlyFireRes =')
])

# src/pages/BudgetHistory.tsx
replace_in_file('src/pages/BudgetHistory.tsx', [
    (re.compile(r'\bflow,\s*'), '')
])

# src/pages/CashflowQuadrant.tsx
replace_in_file('src/pages/CashflowQuadrant.tsx', [
    (re.compile(r"import \{ calculateBudget \} from '\.\./engines/budgetEngine';\r?\n"), '')
])

# src/pages/Dashboard.tsx
replace_in_file('src/pages/Dashboard.tsx', [
    ('const netPrincipal = ', '// const netPrincipal = '),
    ('const circumference = 2 * Math.PI * radius;', '// const circumference = 2 * Math.PI * radius;')
])

# src/pages/LifeStages.tsx
replace_in_file('src/pages/LifeStages.tsx', [
    ('const [isAdvisorOpen, setIsAdvisorOpen]', 'const [, setIsAdvisorOpen]'),
    ('const [advisorSnapshot, setAdvisorSnapshot]', 'const [, setAdvisorSnapshot]'),
    ('const endMonthValueFund = ', '// const endMonthValueFund = '),
    ('const isOverBudget = ', '// const isOverBudget = '),
    ('const text2 = ', '// const text2 = '),
    ('(item, index)', '(_item, index)'),
    ('(stage, index)', '(_stage, index)')
])

# src/pages/Portfolio.tsx
replace_in_file('src/pages/Portfolio.tsx', [
    (re.compile(r'\bupdateAssets,\s*'), ''),
    ('const [, setConversionForm] = useState({', '/* const [, setConversionForm] = useState({'),
    ('partialWithdrawValue: 0,\n  });', 'partialWithdrawValue: 0,\n  }); */'),
    ('partialWithdrawValue: 0,\r\n  });', 'partialWithdrawValue: 0,\r\n  }); */')
])

print("Python fix script complete")
