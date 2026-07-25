import os

with open('src/types/finance.ts', 'r', encoding='utf-8') as f:
    types_code = f.read()

types_code = types_code.replace(
    "periodConfigs?: Record<string, { termMonths?: number; interestRateAnnual?: number; contribution?: number }>;",
    "periodConfigs?: Record<string, { termMonths?: number; interestRateAnnual?: number; contribution?: number; depositBank?: string; rolloverStrategy?: 'principal_and_interest' | 'principal_only' | 'none' | 'return_to_source' }>;"
)

with open('src/types/finance.ts', 'w', encoding='utf-8') as f:
    f.write(types_code)

with open('src/engines/sinkingFundEngine.ts', 'r', encoding='utf-8') as f:
    engine = f.read()

engine = engine.replace(
    "let bTerm = fund.termMonths || 1;",
    "let bTerm = fund.termMonths || 1;\n     let bBank = fund.depositBank;\n     let bStrategy = fund.rolloverStrategy;"
)
engine = engine.replace(
    "bTerm = periodCfg?.termMonths !== undefined ? periodCfg.termMonths : defaultTerm;",
    "bTerm = periodCfg?.termMonths !== undefined ? periodCfg.termMonths : defaultTerm;\n        const defaultBank = lastBucket ? lastBucket.depositBank : fund.depositBank;\n        const defaultStrategy = lastBucket ? lastBucket.rolloverStrategy : fund.rolloverStrategy;\n        bBank = periodCfg?.depositBank !== undefined ? periodCfg.depositBank : defaultBank;\n        bStrategy = periodCfg?.rolloverStrategy !== undefined ? periodCfg.rolloverStrategy : defaultStrategy;"
)
engine = engine.replace(
    "contribAmount: periodContrib",
    "contribAmount: periodContrib,\n              depositBank: bBank,\n              rolloverStrategy: bStrategy"
)
engine = engine.replace(
    "contribAmount: 0",
    "contribAmount: 0,\n              depositBank: mb.depositBank,\n              rolloverStrategy: mb.rolloverStrategy"
)
engine = engine.replace(
    "if (fund.rolloverStrategy === 'none') {",
    "const strat = b.rolloverStrategy || fund.rolloverStrategy;\n           if (strat === 'none') {"
)
engine = engine.replace(
    "} else if (fund.rolloverStrategy === 'principal_only') {",
    "} else if (strat === 'principal_only') {"
)
engine = engine.replace(
    "} else if (fund.rolloverStrategy === 'return_to_source') {",
    "} else if (strat === 'return_to_source') {"
)
engine = engine.replace(
    "parentId: `Tái tục từ kỳ T${((b.termStart-1)%12)+1}/${Math.floor((b.termStart-1)/12)}`",
    "parentId: `Tái tục từ kỳ T${((b.termStart-1)%12)+1}/${Math.floor((b.termStart-1)/12)}`,\n                 depositBank: b.depositBank,\n                 rolloverStrategy: b.rolloverStrategy"
)

with open('src/engines/sinkingFundEngine.ts', 'w', encoding='utf-8') as f:
    f.write(engine)

print("Done engine update")
