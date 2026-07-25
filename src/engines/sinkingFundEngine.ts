import type { SinkingFund } from '../types/finance';

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
  let totalDeposited = 0;

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
           totalDeposited -= w.amount;
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
                          contribAmount: 0,
                          depositBank: buckets[i].depositBank,
                          rolloverStrategy: buckets[i].rolloverStrategy
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
           const strat = b.rolloverStrategy || fund.rolloverStrategy;
           if (strat === 'none') {
              nonTermCash += b.principal + interest;
           } else if (strat === 'principal_only') {
              rolloverPrincipal = b.principal;
              nonTermCash += interest;
           } else if (strat === 'return_to_source') {
              autoRefundsByMonth[m] = (autoRefundsByMonth[m] || 0) + b.principal + interest;
           } else {
              rolloverPrincipal = b.principal + interest;
           }

           if (rolloverPrincipal > 0) {
              maturingBuckets.push({
                 principal: rolloverPrincipal,
                 parentId: `Tái tục từ kỳ T${((b.termStart-1)%12)+1}/${Math.floor((b.termStart-1)/12)}`,
                 depositBank: b.depositBank,
                 rolloverStrategy: b.rolloverStrategy
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
     let bBank = fund.depositBank;
     let bStrategy = fund.rolloverStrategy;
     let bRate = fund.interestRateAnnual || 5.5;

     if (m >= start) {
        const lastBucket = buckets.length > 0 ? buckets[buckets.length - 1] : null;
        const defaultContrib = lastBucket && lastBucket.contribAmount !== undefined ? lastBucket.contribAmount : (fund.monthlyContribution || 0);
        periodContrib = periodCfg?.contribution !== undefined ? periodCfg.contribution : defaultContrib;
        newContrib += periodContrib;

        const defaultTerm = lastBucket ? lastBucket.termMonths : (fund.termMonths || 1);
        const defaultRate = lastBucket ? lastBucket.interestRateAnnual : (fund.interestRateAnnual || 5.5);
        bTerm = periodCfg?.termMonths !== undefined ? periodCfg.termMonths : defaultTerm;
        const defaultBank = lastBucket ? lastBucket.depositBank : fund.depositBank;
        const defaultStrategy = lastBucket ? lastBucket.rolloverStrategy : fund.rolloverStrategy;
        bBank = periodCfg?.depositBank !== undefined ? periodCfg.depositBank : defaultBank;
        bStrategy = periodCfg?.rolloverStrategy !== undefined ? periodCfg.rolloverStrategy : defaultStrategy;
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
              contribAmount: periodContrib,
              depositBank: bBank,
              rolloverStrategy: bStrategy 
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
              contribAmount: 0,
              depositBank: mb.depositBank,
              rolloverStrategy: mb.rolloverStrategy
           });
        });
     } else {
        nonTermCash += newContrib + maturingBuckets.reduce((sum, mb) => sum + mb.principal, 0);
     }
  }
  
  const totalPrincipal = buckets.reduce((sum, b) => sum + b.principal, 0);
  return { nonTermCash, buckets, totalPrincipal, autoRefundsByMonth, totalDeposited };
}
