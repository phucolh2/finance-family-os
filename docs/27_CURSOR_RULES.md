# 27 — CURSOR RULES

## 1. Purpose

Nếu dùng Cursor, hãy tạo rules để AI luôn nhớ luật dự án.

Đề xuất tạo:

```txt
.cursor/rules/
  architecture.mdc
  business-rules.mdc
  financial-engines.mdc
  ui-style.mdc
  testing.mdc
```

---

## 2. architecture.mdc

```md
---
description: Family Financial OS architecture rules
alwaysApply: true
---

Family Financial OS uses Timeline-first, Engine-based, Event-driven architecture.

Rules:
- UI never calculates.
- Engines calculate everything.
- Dashboard only renders engine output.
- Projection runs monthly and aggregates yearly.
- Scenario = base input + overrides + same engines.
- No hardcoded money.
- No hardcoded FIRE year.
- No child 2035 scenario.
```

---

## 3. business-rules.mdc

```md
---
description: Business rules for Family Financial OS
alwaysApply: true
---

Default budget allocation is ratio-based:
- Nhà cửa & sinh hoạt cơ bản: 29%
- Tương lai & đầu tư: 40%
- Bình an & dự phòng: 10%
- Gia đình & trải nghiệm: 11%
- Sức khỏe & phát triển: 10%

Do not use fixed default amounts.

"Tài sản phụ & hình ảnh" was removed and merged into "Sức khỏe & phát triển".

Child cost:
- active from child birth event/config
- separate budget category
- not subtracted directly from investment
- no default 63tr/month university cost
```

---

## 4. financial-engines.mdc

```md
---
description: Financial engine rules
alwaysApply: true
---

Engine dependency:
Timeline → Income → LifeStage → Budget → Cashflow → Portfolio → Projection → FIRE → MonteCarlo → Scenario.

Engines:
- pure functions
- no React import
- no LocalStorage direct access
- return warnings
- no UI dependencies
```

---

## 5. ui-style.mdc

```md
---
description: UI style rules
alwaysApply: true
---

Keep warm family-first style:
- cream background
- orange accent
- rounded cards
- Vietnamese language
- not corporate
- not trading terminal

All charts must have tooltip.
All tables must have empty state.
Warnings must be visible in UI.
```

---

## 6. testing.mdc

```md
---
description: Testing and build rules
alwaysApply: true
---

Every completed task must:
- run npm run build
- avoid NaN
- avoid undefined crash
- handle old LocalStorage
- verify no child 2035
- verify no "Tài sản phụ & hình ảnh"
- verify Dashboard uses engine output
```

---

## 7. Cursor Workflow

1. Open project.
2. Add rules.
3. Ask Cursor to read PROJECT_MANIFEST.md.
4. Work phase by phase.
5. Use Composer for multi-file edits.
6. Use Chat for audit/review.
