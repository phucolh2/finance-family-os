const fs = require('fs');

function replaceInFile(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf8');
    for (const {search, replace} of replacements) {
        if (typeof search === 'string') {
            content = content.split(search).join(replace);
        } else {
            content = content.replace(search, replace);
        }
    }
    fs.writeFileSync(filePath, content, 'utf8');
}

// 8. ErrorBoundary
replaceInFile('src/components/ui/ErrorBoundary.tsx', [
    { search: '{ error, resetErrorBoundary }', replace: '{ error }' }
]);

// 9. SmartAllocationAdvisorModal
replaceInFile('src/components/ui/SmartAllocationAdvisorModal.tsx', [
    { search: 'const [amount, setAmount]', replace: 'const [, setAmount]' },
    { search: 'const [apiKey, setApiKey]', replace: 'const [, setApiKey]' },
    { search: 'const getTierIcon = (tier: number) => {', replace: '/* const getTierIcon = (tier: number) => {' },
    { search: '    }\n  };\n\n  const getTierBadge', replace: '    }\n  }; */\n\n  const getTierBadge' },
    { search: 'const getTierBadge = (tier: number) => {', replace: '/* const getTierBadge = (tier: number) => {' },
    { search: '    }\n  };\n\n  return (', replace: '    }\n  }; */\n\n  return (' }
]);

// 10. advisorEngine.ts - 'liquidityDeficitFound'
replaceInFile('src/engines/advisorEngine.ts', [
    { search: 'const liquidityDeficitFound = ', replace: '// const liquidityDeficitFound = ' },
    { search: 'let liquidityDeficitFound = ', replace: '// let liquidityDeficitFound = ' }
]);

// 11. databaseResolver.ts
replaceInFile('src/engines/databaseResolver.ts', [
    { search: 'const { budgetSchedule, lifeStages, assumptions } = ', replace: 'const { budgetSchedule } = ' },
    { search: 'const { budgetSchedule, assumptions, lifeStages } = ', replace: 'const { budgetSchedule } = ' }
]);

// 12. projectionEngine.ts
replaceInFile('src/engines/projectionEngine.ts', [
    { search: 'const { _assets, history } = ', replace: 'const { history } = ' },
    { search: ', lifeStages: Record<string, any>', replace: '' },
    { search: ' term,', replace: ' /*term*/,' },
    { search: ' _unallocatedForCompounding,', replace: '' },
    { search: ' _actualInvestmentRateMonthly,', replace: '' },
    { search: ' _safeTotalEndingBalance,', replace: '' },
    { search: ' _yearlyFireRes,', replace: '' }
]);

// 13. sinkingFundEngine.ts
replaceInFile('src/engines/sinkingFundEngine.ts', [
    { search: 'const currentBank = ', replace: '// const currentBank = ' },
    { search: 'const currentStrategy = ', replace: '// const currentStrategy = ' }
]);

// 14. useAppState.ts
replaceInFile('src/hooks/useAppState.ts', [
    { search: 'const newMonthValue = ', replace: '// const newMonthValue = ' }
]);

// 15. BudgetHistory.tsx
replaceInFile('src/pages/BudgetHistory.tsx', [
    { search: 'flow, ', replace: '' },
    { search: ' flow,', replace: '' }
]);

// 16. CashflowQuadrant.tsx
replaceInFile('src/pages/CashflowQuadrant.tsx', [
    { search: 'const budgetDetails = ', replace: '// const budgetDetails = ' }
]);

// 17. Dashboard.tsx
replaceInFile('src/pages/Dashboard.tsx', [
    { search: 'const lastRow = ', replace: '// const lastRow = ' },
    { search: 'const cumulativeReturns = ', replace: '// const cumulativeReturns = ' },
    { search: 'const yearlyChartData = ', replace: '// const yearlyChartData = ' },
    { search: 'const strokeDashoffset = ', replace: '// const strokeDashoffset = ' }
]);

// 18. DebtManagement.tsx
replaceInFile('src/pages/DebtManagement.tsx', [
    { search: 'const debtReserveBalance = ', replace: '// const debtReserveBalance = ' }
]);

// 19. HealthAndFinalRest.tsx
replaceInFile('src/pages/HealthAndFinalRest.tsx', [
    { search: 'const [, setInsuranceMonthly]', replace: 'const [, /*setInsuranceMonthly*/]' },
    { search: 'const [insuranceMonthly, setInsuranceMonthly]', replace: 'const [insuranceMonthly]' },
    { search: 'const [bhytMonthly, setBhytMonthly]', replace: 'const [bhytMonthly]' }
]);
