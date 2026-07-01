# 04 — DOMAIN MODEL

## Domain overview

Family Financial OS gồm:

- Family
- Timeline
- IncomeSchedule
- BudgetSchedule
- LifeStage
- LifeEvent
- Budget
- Cashflow
- Portfolio
- Projection
- Scenario
- FIRE
- Health
- Knowledge
- AIAdvisor

## Core types

```ts
type FamilyProfile = {
  husbandName: string
  wifeName: string
  husbandAgeAtStart: number
  wifeAgeAtStart: number
  planningStartMonth: number
  planningStartYear: number
  planningEndMonth: number
  planningEndYear: number
  childBirthMonth?: number
  childBirthYear?: number
  currency: 'VND_MILLION'
}
```

```ts
type TimelinePeriod = {
  index: number
  month: number
  year: number
  key: string
  husbandAge: number
  wifeAge: number
}
```

```ts
type IncomeScheduleItem = {
  id: string
  effectiveMonth: number
  effectiveYear: number
  incomeMonthly: number
  incomeGrowthRateAnnual: number
  note?: string
}
```

```ts
type BudgetGroup =
  | 'housing_basic'
  | 'future_investing'
  | 'safety_reserve'
  | 'family_experience'
  | 'health_growth'
  | 'children'
  | 'parents'
```

```ts
type BudgetRatio = {
  categoryId: string
  categoryName: string
  group: BudgetGroup
  ratioPercent: number
  ruleType: BudgetRuleType
  fixedAmountMonthly?: number
  capMonthly?: number
  capTotal?: number
  inflationRateAnnual?: number
  isActive: boolean
}
```

```ts
type LifeEvent = {
  id: string
  month: number
  year: number
  name: string
  type: 'child_birth' | 'buy_property' | 'sell_property' | 'buy_car' | 'medical' | 'job_loss' | 'bonus' | 'inheritance' | 'retirement' | 'travel' | 'other'
  amount: number
  source: 'cash' | 'investment' | 'saving' | 'debt' | 'external'
  targetAssetId?: string
  recurringMonthlyImpact?: number
  affectsNetWorth: boolean
  note?: string
}
```

## Domain rule

Domain model không phụ thuộc UI. UI phụ thuộc domain model. Engines phụ thuộc domain model.
