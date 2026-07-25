import os

with open('src/components/portfolio/SinkingFundModule.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Let's find the start and end of getFundBalance
start_idx = code.find("  // Helper to find latest state of a fund from projection")
# The end of getFundBalance is after: return { balance, progress, buckets, nonTermCash, totalDisbursed };
# or similar.
# We can search for the start of the next function or component property.
# Actually, let's just search for the end of the return statement.
end_idx = code.find("  const [showAddForm, setShowAddForm] = useState(false);", start_idx)
if end_idx == -1:
    end_idx = code.find("  const existingFundGroups = Array.from(new Set(state.sinkingFunds?.map(f => f.fundGroup).filter(Boolean))) as string[];", start_idx)

# Wait, in the code we see:
# return { balance, progress, buckets, nonTermCash, totalDisbursed, autoRefundsByMonth: {}, totalDeposited: 0 };
#   };
# 
#   const [disbursingId, setDisbursingId] = useState<string | null>(null);

end_idx = code.find("  const [disbursingId", start_idx)

if start_idx != -1 and end_idx != -1:
    old_func = code[start_idx:end_idx]
    
    new_func = """  // Helper to find latest state of a fund from projection
  const getFundBalance = (fundId: string) => {
    const now = new Date();
    const nowKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const activeRow = (projection.monthlyRows.length > 0 && selectedPeriodKey)
      ? (projection.monthlyRows.find(r => r.period.key === selectedPeriodKey) || projection.monthlyRows[0])
      : (projection.monthlyRows.find(r => r.period.key === nowKey) || projection.monthlyRows[0]);

    const currentObservedMonth = activeRow ? activeRow.period.month : initMonth;
    const currentObservedYear = activeRow ? activeRow.period.year : initYear;

    const fund = activeFunds.find(f => f.id === fundId);
    if (!fund) return { balance: 0, progress: 0, buckets: [], nonTermCash: 0, totalDisbursed: 0, autoRefundsByMonth: {}, totalDeposited: 0 };
    
    const { nonTermCash, buckets, totalPrincipal, autoRefundsByMonth, totalDeposited } = simulateSinkingFund(fund, currentObservedMonth, currentObservedYear);
    
    // Add current month accrued interest to balance display
    let currentAccruedInterest = 0;
    buckets.forEach(b => {
      const currentValue = currentObservedYear * 12 + currentObservedMonth;
      const m = currentValue;
      if (m > b.termStart && m < b.termStart + b.termMonths) {
          currentAccruedInterest += b.principal * (b.interestRateAnnual / 100 / 12) * (m - b.termStart);
      }
    });

    const balance = totalPrincipal + nonTermCash + currentAccruedInterest;
    let progress = 0;
    if (fund.targetAmount > 0) {
       progress = Math.min(100, Math.round((balance / fund.targetAmount) * 100));
    }
    
    const totalDisbursed = (fund.withdrawals || []).reduce((sum, w) => sum + w.amount, 0);

    return { balance, progress, buckets, nonTermCash, totalDisbursed, autoRefundsByMonth, totalDeposited };
  };

"""
    code = code[:start_idx] + new_func + code[end_idx:]

with open('src/components/portfolio/SinkingFundModule.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done completely replacing getFundBalance")
