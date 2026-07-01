# 19 — CODING STANDARDS

## 1. TypeScript

Use TypeScript strict.

Avoid:

- any
- implicit any
- untyped props
- untyped engine outputs

If `any` is unavoidable, explain why in comment.

---

## 2. File Naming

Use:

- PascalCase for React components
- camelCase for utilities/engines
- kebab-case not preferred in src

Examples:

```txt
Dashboard.tsx
budgetEngine.ts
formatCurrency.ts
```

---

## 3. Component Rules

Components must:

- be small
- use typed props
- avoid business logic
- avoid duplicated formatting
- use shared components where possible

---

## 4. Engine Rules

Engines must:

- be pure functions
- receive all input as arguments
- return output and warnings
- never import React
- never import UI components
- never read LocalStorage directly

---

## 5. Formatting

Use centralized format utils:

- formatMoney
- formatPercent
- formatYearMonth
- formatRatio
- safeNumber

No manual formatting scattered in pages.

---

## 6. Error Handling

Use:

- warnings array in engine output
- UI WarningBox
- console.warn only for developer-level issues

Never throw unhandled error in engine for user input issues.

---

## 7. Defensive UI

Always safe map:

```tsx
const rows = data ?? []
```

Never:

```tsx
data.map(...)
```

if data may be undefined.

---

## 8. State Updates

Use immutable updates.

Avoid mutating nested objects directly.

---

## 9. Comments

Comments should explain why, not what.

Good:

```ts
// Child cost is modeled as a budget category, not deducted from investment directly.
```

Bad:

```ts
// add child cost
```

---

## 10. Build

Every task ends with:

```bash
npm run build
```
