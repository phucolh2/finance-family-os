# 31 — MIGRATION STRATEGY

## 1. Purpose

LocalStorage data can break when schema changes.

This document defines safe migration rules.

---

## 2. Persisted Shape

```ts
type PersistedAppState = {
  schemaVersion: number
  updatedAt: string
  data: AppState
}
```

---

## 3. Current Schema Version

```txt
1
```

---

## 4. Migration Principles

- Never white screen
- Try to preserve user data
- Validate after migration
- If impossible, reset to default with warning
- Do not silently discard important data

---

## 5. Migration Flow

```txt
Load LocalStorage
  ↓
Parse JSON
  ↓
Check schemaVersion
  ↓
If current → validate
  ↓
If old → migrate step by step
  ↓
If invalid → reset default
```

---

## 6. Example Migration — Remove Old Category

Old category:

```txt
Tài sản phụ & hình ảnh
```

New rule:

```txt
Merge into Sức khỏe & phát triển
```

Migration:

1. Find old ratio.
2. Add old ratio to health_growth ratio.
3. Remove old category.
4. Validate total ratio.

---

## 7. Example Migration — Fixed Amount to Ratio

If old data stores amount defaults:

```txt
investmentMonthly = 32
```

Convert:

```txt
ratioPercent = amount / incomeMonthly * 100
```

If income unavailable, use default ratio.

---

## 8. Error Handling

If migration fails:

```ts
console.warn("Failed to migrate app state, resetting to defaults", error)
```

UI should show:

```txt
Dữ liệu cũ không tương thích. Hệ thống đã khôi phục mặc định an toàn.
```

---

## 9. Migration Acceptance

- Old data does not crash app.
- New defaults load.
- User can export/import after migration.
- No NaN.
