import os

# 1. Update src/types/finance.ts
with open('src/types/finance.ts', 'r', encoding='utf-8') as f:
    types_code = f.read()

types_code = types_code.replace(
    "rolloverStrategy?: 'principal_and_interest' | 'principal_only' | 'none';",
    "rolloverStrategy?: 'principal_and_interest' | 'principal_only' | 'none' | 'return_to_source';"
)
types_code = types_code.replace(
    """  withdrawals?: {
    amount: number;
    month: number;
    year: number;
    dealId?: string;
  }[];""",
    """  withdrawals?: {
    amount: number;
    month: number;
    year: number;
    dealId?: string;
    isRefund?: boolean;
  }[];"""
)

with open('src/types/finance.ts', 'w', encoding='utf-8') as f:
    f.write(types_code)

# 2. Extract getFundBalance logic so useLiquidityBreakdown can use it
# Actually, it's easier to just copy the logic or export it if we move it to engines/sinkingFundEngine.ts.
# Let's create src/engines/sinkingFundEngine.ts
engine_code = """import { SinkingFund } from '../types/finance';
import { safeNumber } from '../utils/formatters';

export function simulateSinkingFund(fund: SinkingFund, targetMonth?: number, targetYear?: number) {
  const start = fund.startYear * 12 + fund.startMonth;
  let end = targetYear && targetMonth ? targetYear * 12 + targetMonth : (new Date().getFullYear() * 12 + new Date().getMonth() + 1);
  if (fund.status === 'disbursed' && fund.disbursedMonth && fund.disbursedYear) {
     const disbursedTime = fund.disbursedYear * 12 + fund.disbursedMonth;
     if (end > disbursedTime) end = disbursedTime;
  }

  let nonTermCash = 0;
  let buckets: any[] = [];
  const autoRefundsByMonth: Record<number, number> = {};

  for (let m = start; m <= end; m++) {
     const yr = Math.floor((m - 1) / 12);
     const mo = ((m - 1) % 12) + 1;
     const periodKey = `${yr}-${String(mo).padStart(2, '0')}`;
     const periodCfg = fund.periodConfigs?.[periodKey];
     let maturingBuckets: any[] = [];

     const withdrawalsThisMonth = (fund.withdrawals || []).filter(w => w.month === mo && w.year === yr);
     if (withdrawalsThisMonth.length > 0) {
        withdrawalsThisMonth.forEach(w => {
           let amountToDeduct = w.amount;
           if (nonTermCash >= amountToDeduct) {
              nonTermCash -= amountToDeduct;
              amountToDeduct = 0;
           } else {
              amountToDeduct -= nonTermCash;
              nonTermCash = 0;
           }
           let newResidualBuckets: any[] = [];
           if (amountToDeduct > 0) {
              buckets.sort((a, b) => (a.termStart + a.termMonths) - (b.termStart + b.termMonths));
              for (let i = 0; i < buckets.length && amountToDeduct > 0; i++) {
                 if (buckets[i].principal >= amountToDeduct) {
                    const residual = buckets[i].principal - amountToDeduct;
                    buckets[i].principal = 0;
                    amountToDeduct = 0;
                    if (residual > 0) {
                       newResidualBuckets.push({
                          ...buckets[i],
                          id: `residual_${buckets[i].id}_${m}`,
                          parentId: `Dôi dư từ kỳ T${((buckets[i].termStart-1)%12)+1}/${Math.floor((buckets[i].termStart-1)/12)}`,
                          principal: residual,
                          termStart: m,
                          contribAmount: 0
                       });
                    }
                 } else {
                    amountToDeduct -= buckets[i].principal;
                    buckets[i].principal = 0;
                 }
              }
           }
           buckets.push(...newResidualBuckets);
        });
        buckets = buckets.filter(b => b.principal > 0);
     }

     buckets = buckets.filter(b => {
        if (m - b.termStart === b.termMonths && m > b.termStart) {
           const interest = b.principal * ((b.interestRateAnnual || 0) / 100 / 12) * b.termMonths;
           let rolloverPrincipal = 0;
           if (fund.rolloverStrategy === 'none') {
              nonTermCash += b.principal + interest;
           } else if (fund.rolloverStrategy === 'principal_only') {
              rolloverPrincipal = b.principal;
              nonTermCash += interest;
           } else if (fund.rolloverStrategy === 'return_to_source') {
              autoRefundsByMonth[m] = (autoRefundsByMonth[m] || 0) + b.principal + interest;
           } else {
              rolloverPrincipal = b.principal + interest;
           }

           if (rolloverPrincipal > 0) {
              maturingBuckets.push({
                 principal: rolloverPrincipal,
                 parentId: `Tái tục từ kỳ T${((b.termStart-1)%12)+1}/${Math.floor((b.termStart-1)/12)}`
              });
           }
           return false;
        }
        return true;
     });

     let newContrib = 0;
     if (m === start) newContrib += (fund.initialDeposit || 0);

     let periodContrib = 0;
     let bTerm = fund.termMonths || 1;
     let bRate = fund.interestRateAnnual || 5.5;

     if (m >= start) {
        const lastBucket = buckets.length > 0 ? buckets[buckets.length - 1] : null;
        const defaultContrib = lastBucket && lastBucket.contribAmount !== undefined ? lastBucket.contribAmount : (fund.monthlyContribution || 0);
        periodContrib = periodCfg?.contribution !== undefined ? periodCfg.contribution : defaultContrib;
        newContrib += periodContrib;

        const defaultTerm = lastBucket ? lastBucket.termMonths : (fund.termMonths || 1);
        const defaultRate = lastBucket ? lastBucket.interestRateAnnual : (fund.interestRateAnnual || 5.5);
        bTerm = periodCfg?.termMonths !== undefined ? periodCfg.termMonths : defaultTerm;
        bRate = periodCfg?.interestRateAnnual !== undefined ? periodCfg.interestRateAnnual : defaultRate;
     }

     if (bTerm > 0) {
        if (newContrib > 0) {
           buckets.push({ 
              id: `T${mo}-${yr}_new`,
              principal: newContrib, 
              termStart: m, 
              termMonths: bTerm, 
              interestRateAnnual: bRate, 
              periodKey, 
              contribAmount: periodContrib 
           });
        }
        maturingBuckets.forEach((mb, idx) => {
           buckets.push({
              id: `T${mo}-${yr}_roll_${idx}`,
              principal: mb.principal,
              parentId: mb.parentId,
              termStart: m,
              termMonths: bTerm,
              interestRateAnnual: bRate,
              periodKey,
              contribAmount: 0
           });
        });
     } else {
        nonTermCash += newContrib + maturingBuckets.reduce((sum, mb) => sum + mb.principal, 0);
     }
  }
  
  const totalPrincipal = buckets.reduce((sum, b) => sum + b.principal, 0);
  return { nonTermCash, buckets, totalPrincipal, autoRefundsByMonth };
}
"""

os.makedirs('src/engines', exist_ok=True)
with open('src/engines/sinkingFundEngine.ts', 'w', encoding='utf-8') as f:
    f.write(engine_code)

print("Done")
