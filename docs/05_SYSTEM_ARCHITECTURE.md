# 05 — SYSTEM ARCHITECTURE

## Architecture style

- Timeline-first
- Engine-based
- Event-driven
- Scenario-aware
- Local-first MVP
- AI-native development

## High-level flow

```mermaid
flowchart TD
  A[Family Profile] --> B[Timeline Engine]
  B --> C[Income Engine]
  B --> D[Life Stage Engine]
  C --> E[Budget Engine]
  D --> E
  E --> F[Cashflow Engine]
  G[Life Events] --> F
  F --> H[Portfolio Engine]
  H --> I[Projection Engine]
  F --> I
  I --> J[FIRE Engine]
  I --> K[Monte Carlo Engine]
  I --> L[Scenario Engine]
  J --> M[Dashboard]
  I --> M
  L --> M
  M --> N[AI Advisor]
```

## Layering

```txt
UI Layer: pages, components
Application Layer: hooks, state, storage
Domain Layer: types, engines
Data Layer: defaultInputs, defaultRatios, knowledgeBase, vietnamAssumptions
```

## Engine dependency order

```txt
timelineEngine
  ↓
incomeEngine
  ↓
lifeStageEngine
  ↓
budgetEngine
  ↓
cashflowEngine
  ↓
childEngine
  ↓
portfolioEngine
  ↓
projectionEngine
  ↓
fireEngine
  ↓
monteCarloEngine
  ↓
scenarioEngine
```

## Derived state

Không lưu như source of truth:

- projection rows
- dashboard KPIs
- FIRE year
- portfolio PnL
- net worth
- budget amount monthly

Tất cả derive từ engine.

## LocalStorage

```ts
type PersistedAppState = {
  schemaVersion: number
  updatedAt: string
  data: AppState
}
```

## Scenario architecture

Base AppState + Scenario Overrides → Resolved Scenario State → Same Engines → Scenario Projection.

## Error handling

Engine không throw làm trắng màn hình. Engine trả data + warnings + errors.
