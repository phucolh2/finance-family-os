import os

with open('src/engines/sinkingFundEngine.ts', 'r', encoding='utf-8') as f:
    engine = f.read()

# Remove the old totalDeposited += newContrib if it exists somewhere else by mistake
# Actually, let's just do a clean replacement.
old_engine_block = """        bRate = periodCfg?.interestRateAnnual !== undefined ? periodCfg.interestRateAnnual : defaultRate;
     }

     if (bTerm > 0) {"""
new_engine_block = """        bRate = periodCfg?.interestRateAnnual !== undefined ? periodCfg.interestRateAnnual : defaultRate;
     }

     totalDeposited += newContrib;

     if (bTerm > 0) {"""

engine = engine.replace(old_engine_block, new_engine_block)

# Remove the duplicate totalDeposited += newContrib that was wrongly placed
wrong_placement = """const periodContrib = periodCfg?.contribution !== undefined ? periodCfg.contribution : fund.monthlyContribution;
     const newContrib = m === start ? periodContrib + fund.initialDeposit : periodContrib;
     totalDeposited += newContrib;
     let bTerm = fund.termMonths || 1;"""
correction = """const periodContrib = periodCfg?.contribution !== undefined ? periodCfg.contribution : fund.monthlyContribution;
     let newContrib = m === start ? periodContrib + fund.initialDeposit : periodContrib;
     let bTerm = fund.termMonths || 1;"""

engine = engine.replace(wrong_placement, correction)

with open('src/engines/sinkingFundEngine.ts', 'w', encoding='utf-8') as f:
    f.write(engine)

# Update SinkingFundModule for interest text
with open('src/components/portfolio/SinkingFundModule.tsx', 'r', encoding='utf-8') as f:
    module = f.read()

old_ui = '<span className="text-[10px] text-family-textMuted">%/năm</span>'
new_ui = """<span className="text-[10px] text-family-textMuted">%/năm</span>
                                              {b.termMonths > 0 && b.interestRateAnnual > 0 && (
                                                 <span className="text-[10px] text-emerald-600 font-semibold ml-2">
                                                    (+ {formatTableMoneyVNDMillion(b.principal * (b.interestRateAnnual / 100 / 12) * b.termMonths)} Tr lãi)
                                                 </span>
                                              )}"""

if new_ui not in module:
    module = module.replace(old_ui, new_ui)
    
with open('src/components/portfolio/SinkingFundModule.tsx', 'w', encoding='utf-8') as f:
    f.write(module)

print("Fixes applied")
