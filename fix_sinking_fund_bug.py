import os

# 1. Update sinkingFundEngine.ts
file_path1 = 'src/engines/sinkingFundEngine.ts'
with open(file_path1, 'r', encoding='utf-8') as f:
    content1 = f.read()

old_logic_part1 = """  let nonTermCash = 0;
  let buckets: any[] = [];
  const autoRefundsByMonth: Record<number, number> = {};
  let totalDeposited = 0;

  for (let m = start; m <= end; m++) {"""

new_logic_part1 = """  let nonTermCash = 0;
  let buckets: any[] = [];
  const autoRefundsByMonth: Record<number, number> = {};
  let totalDeposited = 0;

  let currentMonthlyContrib = fund.monthlyContribution || 0;
  let currentTerm = fund.termMonths || 1;
  let currentBank = fund.depositBank;
  let currentStrategy = fund.rolloverStrategy;
  let currentRate = fund.interestRateAnnual || 5.5;

  for (let m = start; m <= end; m++) {"""

content1 = content1.replace(old_logic_part1, new_logic_part1)

old_logic_part2 = """     let newContrib = 0;
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
     }"""

new_logic_part2 = """     let newContrib = 0;
     if (m === start) newContrib += (fund.initialDeposit || 0);

     let periodContrib = 0;
     let bTerm = currentTerm;
     let bBank = currentBank;
     let bStrategy = currentStrategy;
     let bRate = currentRate;

     if (m >= start) {
        if (periodCfg?.contribution !== undefined) currentMonthlyContrib = periodCfg.contribution;
        if (periodCfg?.termMonths !== undefined) currentTerm = periodCfg.termMonths;
        if (periodCfg?.depositBank !== undefined) currentBank = periodCfg.depositBank;
        if (periodCfg?.rolloverStrategy !== undefined) currentStrategy = periodCfg.rolloverStrategy;
        if (periodCfg?.interestRateAnnual !== undefined) currentRate = periodCfg.interestRateAnnual;

        periodContrib = currentMonthlyContrib;
        newContrib += periodContrib;

        bTerm = currentTerm;
        bBank = currentBank;
        bStrategy = currentStrategy;
        bRate = currentRate;
     }"""

content1 = content1.replace(old_logic_part2, new_logic_part2)

with open(file_path1, 'w', encoding='utf-8') as f:
    f.write(content1)
    
print("Updated sinkingFundEngine.ts")

# 2. Update projectionEngine.ts
file_path2 = 'src/engines/projectionEngine.ts'
with open(file_path2, 'r', encoding='utf-8') as f:
    content2 = f.read()

# Update sinkingFundStates definition
old_def = """  const sinkingFundStates: Record<string, { buckets: { principal: number; termStart: number; termMonths?: number; interestRateAnnual?: number }[]; balance: number; contribution: number; interest: number }> = {};"""
new_def = """  const sinkingFundStates: Record<string, { buckets: { principal: number; termStart: number; termMonths?: number; interestRateAnnual?: number; contribAmount?: number; }[]; balance: number; contribution: number; interest: number; currentMonthlyContrib?: number; currentTerm?: number; currentRate?: number; }> = {};"""
content2 = content2.replace(old_def, new_def)

old_init = """      if (!sinkingFundStates[sf.id]) {
        sinkingFundStates[sf.id] = { buckets: [], balance: 0, contribution: 0, interest: 0 };
      }"""
new_init = """      if (!sinkingFundStates[sf.id]) {
        sinkingFundStates[sf.id] = { 
           buckets: [], balance: 0, contribution: 0, interest: 0,
           currentMonthlyContrib: sf.monthlyContribution || 0,
           currentTerm: sf.termMonths || 1,
           currentRate: sf.interestRateAnnual || 5.5
        };
      }"""
content2 = content2.replace(old_init, new_init)

old_loop_logic = """             if (current >= start) {
                const pKey = `${period.year}-${String(period.month).padStart(2, '0')}`;
                const pCfg = sf.periodConfigs?.[pKey];
                const lastBucket = state.buckets.length > 0 ? state.buckets[state.buckets.length - 1] : null;
                
                const defaultContrib = lastBucket && (lastBucket as any).contribAmount !== undefined ? (lastBucket as any).contribAmount : (sf.monthlyContribution || 0);
                periodContrib = pCfg?.contribution !== undefined ? pCfg.contribution : defaultContrib;
                newContrib += periodContrib;

                const defaultTerm = lastBucket ? (lastBucket.termMonths || 1) : (sf.termMonths || 1);
                const defaultRate = lastBucket ? (lastBucket.interestRateAnnual || 5.5) : (sf.interestRateAnnual || 5.5);
                bTerm = (pCfg?.termMonths !== undefined ? pCfg.termMonths : defaultTerm) || 1;
                bRate = (pCfg?.interestRateAnnual !== undefined ? pCfg.interestRateAnnual : defaultRate) || 5.5;
             }"""

new_loop_logic = """             if (current >= start) {
                const pKey = `${period.year}-${String(period.month).padStart(2, '0')}`;
                const pCfg = sf.periodConfigs?.[pKey];

                if (pCfg?.contribution !== undefined) state.currentMonthlyContrib = pCfg.contribution;
                if (pCfg?.termMonths !== undefined) state.currentTerm = pCfg.termMonths;
                if (pCfg?.interestRateAnnual !== undefined) state.currentRate = pCfg.interestRateAnnual;

                periodContrib = state.currentMonthlyContrib || 0;
                newContrib += periodContrib;

                bTerm = state.currentTerm || 1;
                bRate = state.currentRate || 5.5;
             }"""

content2 = content2.replace(old_loop_logic, new_loop_logic)

with open(file_path2, 'w', encoding='utf-8') as f:
    f.write(content2)

print("Updated projectionEngine.ts")
