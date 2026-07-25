import os

sinking_fund_file = 'src/components/portfolio/SinkingFundModule.tsx'
with open(sinking_fund_file, 'r', encoding='utf-8') as f:
    sf = f.read()
# Remove const now = new Date(); at line 161
sf = sf.replace("  const now = new Date();\n  const nowKey", "  const nowKey")
with open(sinking_fund_file, 'w', encoding='utf-8') as f:
    f.write(sf)

reserves = 'src/components/portfolio/fund-cards/ReservesFundCard.tsx'
with open(reserves, 'r', encoding='utf-8') as f:
    rc = f.read()
rc = rc.replace(
    "  fund, balance, progress, totalDisbursed, isDisbursing,\n  expandedFundId",
    "  fund, balance, progress, totalDisbursed, isDisbursing,\n  currentObservedMonth, currentObservedYear,\n  expandedFundId"
)
with open(reserves, 'w', encoding='utf-8') as f:
    f.write(rc)

savings = 'src/components/portfolio/fund-cards/SavingsFundCard.tsx'
with open(savings, 'r', encoding='utf-8') as f:
    sc = f.read()
sc = sc.replace(
    "  fund, balance, progress, totalDisbursed, isDisbursing,\n  expandedFundId",
    "  fund, balance, progress, totalDisbursed, isDisbursing,\n  currentObservedMonth, currentObservedYear,\n  expandedFundId"
)
with open(savings, 'w', encoding='utf-8') as f:
    f.write(sc)

print("Fixed compile errors")
