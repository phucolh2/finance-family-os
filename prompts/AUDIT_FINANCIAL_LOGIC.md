# AUDIT FINANCIAL LOGIC PROMPT

Audit all financial formulas.

Read:
- docs/03_BUSINESS_RULES.md
- docs/07_FINANCIAL_ENGINES.md
- docs/16_FINANCIAL_FORMULAS.md
- docs/18_PRODUCT_DECISIONS.md

Check:
- Budget amount derives from income * ratio
- Default allocation is ratio-based
- Child cost is separate category
- Investment is not reduced directly by child cost
- FIRE target = annual expense / withdrawal rate
- Portfolio actual overrides forecast
- Projection runs monthly
- Yearly table aggregates monthly rows
- Real value uses inflation
- No hardcoded FIRE year

Return findings only.
