import os

with open('src/engines/sinkingFundEngine.ts', 'r', encoding='utf-8') as f:
    engine = f.read()

# Track totalDeposited
engine = engine.replace(
    "const autoRefundsByMonth: Record<number, number> = {};",
    "const autoRefundsByMonth: Record<number, number> = {};\n  let totalDeposited = 0;"
)

engine = engine.replace(
    "let amountToDeduct = w.amount;",
    "let amountToDeduct = w.amount;\n           totalDeposited -= w.amount;"
)

engine = engine.replace(
    "const periodContrib = periodCfg?.contribution !== undefined ? periodCfg.contribution : fund.monthlyContribution;",
    "const periodContrib = periodCfg?.contribution !== undefined ? periodCfg.contribution : fund.monthlyContribution;\n     const newContrib = m === start ? periodContrib + fund.initialDeposit : periodContrib;\n     totalDeposited += newContrib;"
)

# Remove the old newContrib declaration since we put it above
engine = engine.replace(
    "const newContrib = m === start ? periodContrib + fund.initialDeposit : periodContrib;\n     let bTerm = fund.termMonths || 1;",
    "let bTerm = fund.termMonths || 1;"
)

engine = engine.replace(
    "return { nonTermCash, buckets, totalPrincipal, autoRefundsByMonth };",
    "return { nonTermCash, buckets, totalPrincipal, autoRefundsByMonth, totalDeposited };"
)

with open('src/engines/sinkingFundEngine.ts', 'w', encoding='utf-8') as f:
    f.write(engine)

print("Engine updated for totalDeposited")
