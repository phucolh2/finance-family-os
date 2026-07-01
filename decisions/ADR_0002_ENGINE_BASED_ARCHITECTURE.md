# ADR-0002 — Engine-based Architecture

## Status

Accepted

## Context

Nếu để Dashboard, Projection page, FIRE page tự tính riêng, app sẽ nhanh chóng bị lệch số.

Ví dụ:

- Dashboard tính đầu tư một kiểu
- Projection tính một kiểu
- Scenario tính một kiểu
- FIRE tính một kiểu

Điều này làm user mất niềm tin.

## Decision

Tất cả tính toán tài chính phải nằm trong engines.

UI chỉ render output.

## Engines

- timelineEngine
- incomeEngine
- budgetEngine
- cashflowEngine
- lifeStageEngine
- childEngine
- portfolioEngine
- projectionEngine
- fireEngine
- monteCarloEngine
- healthEngine
- scenarioEngine
- recommendationEngine

## Consequences

### Positive

- Một source of truth
- Dễ test
- Dễ audit
- Dễ dùng lại cho scenario
- Dễ chuyển sang backend sau này

### Negative

- Cần discipline khi code
- Component không được tiện tay tính nhanh
