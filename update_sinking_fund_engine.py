import os

file_path = 'src/engines/sinkingFundEngine.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the bucket pushing logic
old_logic = """     if (bTerm > 0) {
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
     } else {"""

new_logic = """     if (bTerm > 0) {
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
     } else {"""

content = content.replace(old_logic, new_logic)

# Replace maturingBuckets push
old_mb = """            if (rolloverPrincipal > 0) {
               maturingBuckets.push({
                  principal: rolloverPrincipal,
                  parentId: `Tái tục từ kỳ T${((b.termStart-1)%12)+1}/${Math.floor((b.termStart-1)/12)}`,
                  depositBank: b.depositBank,
                  rolloverStrategy: b.rolloverStrategy
               });
            }"""

new_mb = """            if (rolloverPrincipal > 0) {
               maturingBuckets.push({
                  principal: rolloverPrincipal,
                  rolledOverPrincipal: strat === 'return_to_source' || strat === 'none' ? 0 : b.principal,
                  rolledOverInterest: strat === 'principal_only' || strat === 'return_to_source' || strat === 'none' ? 0 : interest,
                  parentId: `Tái tục từ kỳ T${((b.termStart-1)%12)+1}/${Math.floor((b.termStart-1)/12)}`,
                  depositBank: b.depositBank,
                  rolloverStrategy: b.rolloverStrategy
               });
            }"""

content = content.replace(old_mb, new_mb)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
