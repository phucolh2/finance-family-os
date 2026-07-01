# 29 — MVP IMPLEMENTATION PLAN

## 1. MVP Goal

Tạo app local-first chạy được cho gia đình dùng thực tế.

MVP không cần backend.

MVP phải có:

- nhập thu nhập theo tháng hiệu lực
- nhập tỷ lệ ngân sách theo tháng hiệu lực
- projection realtime
- scenario có con 2031
- portfolio USD/Crypto/BĐS/Chứng khoán
- FIRE Center
- Health & Final Rest
- export/import JSON

---

## 2. Phase Breakdown

### Phase 1 — Foundation

Duration: 1–2 sessions

Deliverables:

- React + Vite + TS
- Tailwind
- Theme
- Layout
- Sidebar
- Empty pages

### Phase 2 — Domain + Timeline

Duration: 1 session

Deliverables:

- Types
- Default data
- Timeline engine
- Date utils

### Phase 3 — Income + Budget

Duration: 2–3 sessions

Deliverables:

- Income schedule
- Budget schedule
- Budget engine
- Budget pages
- Validation

### Phase 4 — Projection

Duration: 2–3 sessions

Deliverables:

- Cashflow engine
- Projection engine
- Yearly aggregation
- Dashboard linked

### Phase 5 — Child + Scenario

Duration: 2 sessions

Deliverables:

- Child engine
- Child 2031 scenario
- Scenario manager basic
- Scenario compare

### Phase 6 — Portfolio + FIRE

Duration: 2 sessions

Deliverables:

- Portfolio engine
- Portfolio page
- FIRE engine
- FIRE Center

### Phase 7 — Monte Carlo + Health

Duration: 2 sessions

Deliverables:

- Monte Carlo
- Health engine
- Final rest planning

### Phase 8 — Knowledge + AI Advisor

Duration: 1–2 sessions

Deliverables:

- Knowledge Center
- AI summary
- Explain buttons

### Phase 9 — Persistence + Polish

Duration: 2 sessions

Deliverables:

- LocalStorage versioning
- Export/import
- Responsive polish
- Release checklist

---

## 3. MVP Cut Scope

Không làm trong MVP:

- backend
- login
- bank sync
- OCR
- mobile app
- real AI API
- tax optimization
- detailed debt amortization
- insurance product comparison

---

## 4. MVP Release Criteria

- Build pass
- No crash
- Projection works
- Scenario child 2031 works
- Portfolio works
- FIRE works
- JSON export/import works
- Warm UI preserved
