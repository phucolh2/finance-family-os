# 23 — API DESIGN

## 1. MVP

MVP has no backend API.

All data local.

However, engine boundaries should be designed as if future API is possible.

---

## 2. Future API Resources

Potential resources:

```txt
/family-profile
/income-schedules
/budget-schedules
/life-stages
/life-events
/portfolio
/scenarios
/projections
/knowledge
```

---

## 3. API Principles

- versioned
- typed
- no business calculation in UI
- backend can run same engine later
- export/import compatible

---

## 4. Example Payload — AppState

```json
{
  "schemaVersion": 1,
  "familyProfile": {},
  "incomeSchedule": [],
  "budgetSchedule": [],
  "lifeStages": [],
  "lifeEvents": [],
  "portfolioConfig": {},
  "scenarios": []
}
```

---

## 5. Future AI API

AI Advisor endpoint should receive summarized engine output, not raw excessive private data unless user approves.

Example:

```txt
POST /ai/advice
```

Payload:

- selected scenario summary
- warnings
- key metrics
- user question

Response:

- explanation
- suggestions
- risks
