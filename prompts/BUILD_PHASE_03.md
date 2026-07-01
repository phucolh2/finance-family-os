# BUILD PHASE 03 — Budget + Income Engines

## Read First

- PROJECT_MANIFEST.md
- docs/03_BUSINESS_RULES.md
- docs/04_DOMAIN_MODEL.md
- docs/07_FINANCIAL_ENGINES.md
- docs/09_DEFAULT_ASSUMPTIONS_VN.md

## Task

Implement:

- incomeEngine
- budgetEngine
- defaultRatios
- IncomeSchedule page
- BudgetAllocation page
- BudgetSchedule page

## Required

- Default allocation is ratio-based
- No fixed money hardcode
- Budget amount = income * ratio / 100
- Groups:
  - Nhà cửa & sinh hoạt cơ bản
  - Tương lai & đầu tư
  - Bình an & dự phòng
  - Gia đình & trải nghiệm
  - Sức khỏe & phát triển

## Acceptance

- income 80 → investment 32
- income 100 → investment 40
- ratio total warning works
- npm run build pass
