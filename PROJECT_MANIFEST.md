# PROJECT MANIFEST

Project: Family Financial OS  
Version: 2.0  
Architecture: Timeline-first + Engine-based + Event-driven

## Mission

Tạo Digital Twin của tài chính gia đình để mô phỏng tương lai và hỗ trợ ra quyết định.

## Non-negotiable rules

### Rule 1 — No hardcoded money

Sai: `investment = 32`  
Đúng: `investment = incomeMonthly * investmentRatio / 100`

### Rule 2 — No hardcoded year

Sai: `if (year === 2031)`  
Đúng: dùng LifeEvent hoặc childConfig có effective date.

### Rule 3 — UI never calculates

Component chỉ render. Engine tính toán.

### Rule 4 — Scenario uses same engines

Scenario = base input + overrides + same engines. Không code path riêng.

## Source of truth

FamilyProfile → Timeline → Schedules → LifeStages → LifeEvents → Rules → Engines → Projection → Dashboard

## Forbidden

- Hardcode money/year/category trong UI
- Duplicate calculation
- Tính trong Dashboard
- Hack tạm
- Bỏ qua LocalStorage migration
- Để NaN/undefined crash

## Required

- Build pass
- TypeScript strict
- Engine-based
- Timeline-first
- Defensive UI
- LocalStorage versioned
- Chart tooltip

## Final statement

Every number must be explainable. Every projection must be reproducible. Family first. Money second.
