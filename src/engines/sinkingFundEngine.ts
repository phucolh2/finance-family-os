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

  let currentBank = fund.depositBank;
  let currentStrategy = fund.rolloverStrategy;

  for (let m = start; m <= end; m++) {
     const yr = Math.floor((m - 1) / 12);
     const mo = ((m - 1) % 12) + 1;
     const periodKey = `${yr}-${String(mo).padStart(2, '0')}`;
     const periodCfg = fund.periodConfigs?.[periodKey];
     let maturingBuckets: any[] = [];
     let maturedCashPool: any[] = [];

     // 1. Kiểm tra đáo hạn trước khi rút tiền
     buckets = buckets.filter(b => {
        if (m - b.termStart === b.termMonths && m > b.termStart) {
           const interest = b.principal * ((b.interestRateAnnual || 0) / 100 / 12) * b.termMonths;
           maturedCashPool.push({
              ...b,
              maturedTotal: b.principal + interest,
              interestAccrued: interest
           });
           return false;
        }
        return true;
     });

     // 2. Xử lý rút tiền
     const withdrawalsThisMonth = (fund.withdrawals || []).filter(w => w.month === mo && w.year === yr);
     if (withdrawalsThisMonth.length > 0) {
        withdrawalsThisMonth.forEach(w => {
           let amountToDeduct = w.amount;
           totalDeposited -= w.amount;
           
           // 2.1 Rút từ nonTermCash trước
           if (nonTermCash >= amountToDeduct) {
              nonTermCash -= amountToDeduct;
              amountToDeduct = 0;
           } else {
              amountToDeduct -= nonTermCash;
              nonTermCash = 0;
           }
           
           // 2.2 Rút từ maturedCashPool (sổ đã đáo hạn hưởng trọn lãi suất)
           if (amountToDeduct > 0 && maturedCashPool.length > 0) {
              for (let i = 0; i < maturedCashPool.length && amountToDeduct > 0; i++) {
                 const item = maturedCashPool[i];
                 if (item.maturedTotal >= amountToDeduct) {
                    item.maturedTotal -= amountToDeduct;
                    amountToDeduct = 0;
                 } else {
                    amountToDeduct -= item.maturedTotal;
                    item.maturedTotal = 0;
                 }
              }
           }
           
           // 2.3 Rút từ các sổ đang gửi chưa đáo hạn, ưu tiên sổ mới gửi nhất (termStart lớn nhất)
           if (amountToDeduct > 0) {
              buckets.sort((a, b) => b.termStart - a.termStart);
              let newResidualBuckets: any[] = [];
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
              buckets.push(...newResidualBuckets);
              buckets = buckets.filter(b => b.principal > 0);
           }
        });
     }

     // 3. Xử lý tái tục cho phần dư còn lại của các sổ đáo hạn
     maturedCashPool.forEach(item => {
        if (item.maturedTotal > 0) {
           let rolloverPrincipal = 0;
           const strat = item.rolloverStrategy || fund.rolloverStrategy;
           
           const totalMaturedBeforeWithdrawal = item.principal + item.interestAccrued;
           const principalRatio = totalMaturedBeforeWithdrawal > 0 ? (item.principal / totalMaturedBeforeWithdrawal) : 1;
           const remainingPrincipal = item.maturedTotal * principalRatio;
           const remainingInterest = item.maturedTotal - remainingPrincipal;

           if (strat === 'none') {
              nonTermCash += item.maturedTotal;
           } else if (strat === 'principal_only') {
              rolloverPrincipal = remainingPrincipal;
              nonTermCash += remainingInterest;
           } else if (strat === 'return_to_source') {
              autoRefundsByMonth[m] = (autoRefundsByMonth[m] || 0) + item.maturedTotal;
           } else { // principal_and_interest
              rolloverPrincipal = item.maturedTotal;
           }

           if (rolloverPrincipal > 0) {
              maturingBuckets.push({
                 principal: rolloverPrincipal,
                 parentId: `Tái tục từ kỳ T${((item.termStart-1)%12)+1}/${Math.floor((item.termStart-1)/12)}`,
                 depositBank: item.depositBank,
                 rolloverStrategy: item.rolloverStrategy,
                 rolledOverPrincipal: remainingPrincipal,
                 rolledOverInterest: remainingInterest
              });
           }
        }
     });

     let newContrib = 0;
     if (m === start) newContrib += (fund.initialDeposit || 0);

     let periodContrib = periodCfg?.contribution !== undefined ? periodCfg.contribution : (fund.monthlyContribution || 0);
     if (m >= start) {
        newContrib += periodContrib;
     }

     const bTerm = periodCfg?.termMonths !== undefined ? periodCfg.termMonths : (fund.termMonths !== undefined ? fund.termMonths : 1);
     const bBank = periodCfg?.depositBank !== undefined ? periodCfg.depositBank : (fund.depositBank);
     const bStrategy = periodCfg?.rolloverStrategy !== undefined ? periodCfg.rolloverStrategy : (fund.rolloverStrategy);
     const bRate = periodCfg?.interestRateAnnual !== undefined ? periodCfg.interestRateAnnual : (fund.interestRateAnnual || 5.5);

     totalDeposited += newContrib;

     if (bTerm > 0) {
        let totalMaturing = 0;
        let totalRolledOverPrincipal = 0;
        let totalRolledOverInterest = 0;
        let parentIds: string[] = [];

        maturingBuckets.forEach(mb => {
           totalMaturing += mb.principal;
           // If we don't have explicit breakdown inside maturingBucket yet, 
           // we can approximate or we can update maturingBucket to have it.
           // Since we updated maturingBuckets logic, let's use it.
           totalRolledOverPrincipal += mb.rolledOverPrincipal !== undefined ? mb.rolledOverPrincipal : mb.principal;
           totalRolledOverInterest += mb.rolledOverInterest !== undefined ? mb.rolledOverInterest : 0;
           parentIds.push(mb.parentId);
        });

        const totalPrincipal = totalMaturing + newContrib;
        const isMerged = maturingBuckets.length > 0;

        if (totalPrincipal > 0) {
           buckets.push({
              id: isMerged ? `T${mo}-${yr}_merged` : `T${mo}-${yr}_new`,
              principal: totalPrincipal,
              termStart: m,
              termMonths: bTerm,
              interestRateAnnual: bRate,
              periodKey,
              contribAmount: periodContrib, // Even if merged, we preserve the current contribAmount
              depositBank: bBank,
              rolloverStrategy: bStrategy,
              parentId: isMerged ? parentIds.join(', ') : undefined,
              breakdown: isMerged ? {
                 maturingAmount: totalMaturing,
                 rolledOverPrincipal: totalRolledOverPrincipal,
                 rolledOverInterest: totalRolledOverInterest,
                 newContrib: newContrib
              } : undefined
           });
        }
     } else {
        nonTermCash += newContrib + maturingBuckets.reduce((sum, mb) => sum + mb.principal, 0);
     }
  }
  
  const totalPrincipal = buckets.reduce((sum, b) => sum + b.principal, 0);
  return { nonTermCash, buckets, totalPrincipal, autoRefundsByMonth, totalDeposited };
}
