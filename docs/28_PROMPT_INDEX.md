# 28 — PROMPT INDEX

## 1. Build Prompts

| File | Purpose |
|---|---|
| BUILD_PHASE_01.md | Foundation layout |
| BUILD_PHASE_02.md | Types + Timeline Engine |
| BUILD_PHASE_03.md | Income + Budget |
| BUILD_PHASE_04.md | Cashflow + Projection |
| BUILD_PHASE_05.md | Child 2031 + Scenario |
| BUILD_PHASE_06.md | Portfolio + FIRE |
| BUILD_PHASE_07.md | Monte Carlo + Health |
| BUILD_PHASE_08.md | Knowledge + AI Advisor |
| BUILD_PHASE_09.md | Persistence + Polish |

---

## 2. Debug Prompts

| File | Purpose |
|---|---|
| BUGFIX_PROMPT.md | Generic bugfix workflow |
| AUDIT_ARCHITECTURE.md | Check architecture violations |
| AUDIT_FINANCIAL_LOGIC.md | Check formulas and source of truth |
| RELEASE_CHECKLIST_PROMPT.md | Final release review |

---

## 3. Recommended Order

```txt
1. Read PROJECT_MANIFEST.md
2. Run BUILD_PHASE_01
3. Run BUILD_PHASE_02
4. Run BUILD_PHASE_03
5. Audit
6. Run BUILD_PHASE_04
7. Run BUILD_PHASE_05
8. Audit
9. Run BUILD_PHASE_06
10. Run BUILD_PHASE_07
11. Run BUILD_PHASE_08
12. Run BUILD_PHASE_09
13. Release checklist
```

---

## 4. Universal Audit Prompt

```txt
Audit the current codebase against:
- PROJECT_MANIFEST.md
- docs/00_PROJECT_RULES.md
- docs/03_BUSINESS_RULES.md
- docs/05_SYSTEM_ARCHITECTURE.md
- docs/13_ACCEPTANCE_TEST.md

Find:
- hardcoded money
- UI calculations
- duplicated formulas
- scenario 2035
- old category "Tài sản phụ & hình ảnh"
- missing warnings
- NaN risks
- LocalStorage schema risks

Do not fix yet.
Return findings with severity.
```

---

## 5. Universal Fix Prompt

```txt
Fix only the findings from the audit.

Rules:
- smallest possible change
- no rewrite
- no hardcode
- preserve UI
- update docs if business rule changes
- run npm run build
```
