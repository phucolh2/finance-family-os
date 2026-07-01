# 21 — PERFORMANCE

## 1. Expected Scale

MVP projection:

- 10/2026 to 12/2060
- ~411 months
- small enough for browser realtime

Even with 1,000 Monte Carlo simulations:

- optimize but no backend required initially

---

## 2. Performance Principles

- Pure functions
- Memoization
- Avoid unnecessary recalculation
- Aggregate yearly from monthly only when needed
- Avoid huge state object copies

---

## 3. React Optimization

Use:

- useMemo for derived projection
- useCallback for handlers if needed
- component splitting
- virtualization only if tables grow large

---

## 4. Chart Performance

Recharts is fine for yearly charts.

For monthly charts over decades:

- aggregate if too dense
- allow toggle monthly/yearly

---

## 5. Monte Carlo Performance

MVP:

- 1,000 simulations
- simple model
- run on button click or debounce
- show loading state

Future:

- Web Worker
- backend simulation
- cached results

---

## 6. LocalStorage Performance

Avoid saving on every keystroke instantly.

Use debounce:

```txt
300–800ms
```

Large JSON export/import should show status.

---

## 7. Acceptance

- UI responsive when editing income
- projection updates under 300ms for normal cases
- Monte Carlo under acceptable wait with loading state
