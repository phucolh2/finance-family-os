import os

sinking_fund_file = 'src/components/portfolio/SinkingFundModule.tsx'
types_file = 'src/components/portfolio/fund-cards/types.ts'
cards = [
    'src/components/portfolio/fund-cards/PortfolioFundCard.tsx',
    'src/components/portfolio/fund-cards/LifestyleFundCard.tsx',
    'src/components/portfolio/fund-cards/SavingsFundCard.tsx',
    'src/components/portfolio/fund-cards/ReservesFundCard.tsx'
]

# 1. Update SinkingFundModule.tsx
with open(sinking_fund_file, 'r', encoding='utf-8') as f:
    sf_content = f.read()

old_get_fund = """  // Helper to find latest state of a fund from projection
  const getFundBalance = (fundId: string) => {
    const now = new Date();
    const nowKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const activeRow = (projection.monthlyRows.length > 0 && selectedPeriodKey)
      ? (projection.monthlyRows.find(r => r.period.key === selectedPeriodKey) || projection.monthlyRows[0])
      : (projection.monthlyRows.find(r => r.period.key === nowKey) || projection.monthlyRows[0]);

    const currentObservedMonth = activeRow ? activeRow.period.month : initMonth;
    const currentObservedYear = activeRow ? activeRow.period.year : initYear;"""

new_get_fund = """  const now = new Date();
  const nowKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const activeRow = (projection.monthlyRows.length > 0 && selectedPeriodKey)
    ? (projection.monthlyRows.find(r => r.period.key === selectedPeriodKey) || projection.monthlyRows[0])
    : (projection.monthlyRows.find(r => r.period.key === nowKey) || projection.monthlyRows[0]);
  const currentObservedMonth = activeRow ? activeRow.period.month : initMonth;
  const currentObservedYear = activeRow ? activeRow.period.year : initYear;

  // Helper to find latest state of a fund from projection
  const getFundBalance = (fundId: string) => {"""

sf_content = sf_content.replace(old_get_fund, new_get_fund)

old_card_props = """            const cardProps = {
               fund: fund as any,
               balance, progress, totalDisbursed: totalDisbursed ?? 0, totalDeposited: totalDeposited ?? 0, isDisbursing,"""

new_card_props = """            const cardProps = {
               fund: fund as any,
               balance, progress, totalDisbursed: totalDisbursed ?? 0, totalDeposited: totalDeposited ?? 0, isDisbursing,
               currentObservedMonth, currentObservedYear,"""

sf_content = sf_content.replace(old_card_props, new_card_props)

with open(sinking_fund_file, 'w', encoding='utf-8') as f:
    f.write(sf_content)


# 2. Update types.ts
with open(types_file, 'r', encoding='utf-8') as f:
    types_content = f.read()

if "currentObservedMonth: number;" not in types_content:
    old_types = """  isDisbursing: boolean;
  expandedFundId: string | null;"""
    new_types = """  isDisbursing: boolean;
  currentObservedMonth: number;
  currentObservedYear: number;
  expandedFundId: string | null;"""
    types_content = types_content.replace(old_types, new_types)
    with open(types_file, 'w', encoding='utf-8') as f:
        f.write(types_content)

# 3. Update all card files
for card in cards:
    if os.path.exists(card):
        with open(card, 'r', encoding='utf-8') as f:
            c_content = f.read()
        
        # Add to props destructuring
        old_props = """  fund, balance, progress, totalDisbursed, totalDeposited, isDisbursing,
  expandedFundId, setExpandedFundId, onEdit, onDelete, onDisburse,"""
        new_props = """  fund, balance, progress, totalDisbursed, totalDeposited, isDisbursing,
  currentObservedMonth, currentObservedYear,
  expandedFundId, setExpandedFundId, onEdit, onDelete, onDisburse,"""
        if old_props in c_content:
            c_content = c_content.replace(old_props, new_props)

        # Replace new Date()
        old_date_1 = """const currentM = new Date().getMonth() + 1;"""
        new_date_1 = """const currentM = currentObservedMonth;"""
        old_date_1b = """const currentM = new Date().getMonth() + 1; // Simplify for now"""
        new_date_1b = """const currentM = currentObservedMonth;"""
        
        old_date_2 = """const currentY = new Date().getFullYear();"""
        new_date_2 = """const currentY = currentObservedYear;"""

        c_content = c_content.replace(old_date_1, new_date_1)
        c_content = c_content.replace(old_date_1b, new_date_1b)
        c_content = c_content.replace(old_date_2, new_date_2)

        with open(card, 'w', encoding='utf-8') as f:
            f.write(c_content)

print("Done")
