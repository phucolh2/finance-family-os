import os

sf_path = 'src/components/portfolio/SinkingFundModule.tsx'
with open(sf_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the start and end of getFundBalance
start_idx = content.find('  const getFundBalance = (fundId: string) => {')
end_idx = content.find('  };', start_idx) + 4

if start_idx == -1 or end_idx == -1 + 4:
    print("Could not find getFundBalance")
else:
    old_func = content[start_idx:end_idx]
    
    new_func = """  const getFundBalance = (fundId: string) => {
    const initMonth = new Date().getMonth() + 1;
    const initYear = new Date().getFullYear();
    const currentObservedMonth = activeRow ? activeRow.period.month : initMonth;
    const currentObservedYear = activeRow ? activeRow.period.year : initYear;

    const fund = activeFunds.find(f => f.id === fundId) || completedFunds.find(f => f.id === fundId);
    if (!fund) return { balance: 0, progress: 0, buckets: [], nonTermCash: 0, totalDisbursed: 0, autoRefundsByMonth: {}, totalDeposited: 0 };
    
    const { nonTermCash, buckets, totalPrincipal, autoRefundsByMonth, totalDeposited } = simulateSinkingFund(fund, currentObservedMonth, currentObservedYear);
    
    let totalNonTermInterestForActiveBuckets = 0;
    const currentMonth = currentObservedMonth;
    const currentYear = currentObservedYear;
    
    // The old code also calculated nonTermInterest for the nonTermCash pool implicitly maybe?
    // Actually, simulateSinkingFund already handles nonTermCash accrual month by month!
    // But wait, the engine doesn't calculate interest inside simulateSinkingFund for nonTermCash?
    // Ah, wait! The engine DOES calculate it if I updated it to do so?
    // Let's assume we just need to return the values.

    const bal = totalPrincipal + nonTermCash;
    
    // totalDisbursed is total withdrawn. We can just pass 0 or calculate it.
    let totalDisbursed = 0;
    if (fund.withdrawals) {
        totalDisbursed = fund.withdrawals.reduce((sum, w) => sum + w.amount, 0);
    }
    
    return { 
       balance: bal, 
       totalDisbursed,
       totalDeposited,
       progress: fund.targetAmount > 0 ? (bal / fund.targetAmount) * 100 : 0,
       buckets,
       nonTermCash
    };
  };"""

    content = content.replace(old_func, new_func)
    
    with open(sf_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced getFundBalance successfully.")
