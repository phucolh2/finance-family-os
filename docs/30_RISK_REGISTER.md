# 30 — RISK REGISTER

## 1. Technical Risks

| ID | Risk | Severity | Mitigation |
|---|---|---:|---|
| R-001 | AI hardcodes money | High | Docs + audit grep |
| R-002 | UI calculates logic | High | Engine-only rule |
| R-003 | Scenario duplicates formulas | High | Scenario = overrides + same engine |
| R-004 | LocalStorage schema breaks app | High | schemaVersion + migration |
| R-005 | Chart crashes on empty data | Medium | Empty state |
| R-006 | Monte Carlo slow | Medium | Run on demand, Web Worker later |
| R-007 | Context too large for AI | High | Progressive Context Loading |

---

## 2. Product Risks

| ID | Risk | Severity | Mitigation |
|---|---|---:|---|
| P-001 | App becomes too complex | High | MVP scope |
| P-002 | User does not understand formulas | Medium | Knowledge Center |
| P-003 | Too many inputs | Medium | Defaults + progressive disclosure |
| P-004 | Financial advice perceived as certainty | High | Advisor disclaimers |
| P-005 | Family conflict from numbers | Medium | Warm tone + explain trade-offs |

---

## 3. Financial Model Risks

| ID | Risk | Severity | Mitigation |
|---|---|---:|---|
| F-001 | Assumptions too optimistic | High | Editable assumptions + Monte Carlo |
| F-002 | Child cost unrealistic | High | Lifestyle bands + cap |
| F-003 | FIRE rule oversimplified | Medium | Knowledge explanation |
| F-004 | Inflation ignored | High | Real value calculation |
| F-005 | BĐS event misrepresents net worth | Medium | Asset transfer modeling |

---

## 4. AI Coding Risks

| ID | Risk | Severity | Mitigation |
|---|---|---:|---|
| A-001 | AI rewrites app | High | Minimal fix prompt |
| A-002 | AI forgets decisions | High | PRODUCT_DECISIONS.md |
| A-003 | AI reintroduces 2035 | Medium | tests + grep |
| A-004 | AI creates new field names | Medium | DATA_DICTIONARY.md |
| A-005 | AI changes theme | Low | UI_UX_SPEC.md |

---

## 5. Release Risk Checklist

Before release:

- grep 2035
- grep "Tài sản phụ"
- grep hardcoded 32/23.2 in src
- run build
- test LocalStorage reset
- test export/import
- test child 2031 scenario
