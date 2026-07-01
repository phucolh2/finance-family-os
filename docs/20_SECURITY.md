# 20 — SECURITY

## 1. MVP Security Scope

MVP is local-first.

Data stored in browser LocalStorage.

No backend.

Security focus:

- protect user data locally
- avoid XSS
- safe import/export
- no secret leakage
- future cloud readiness

---

## 2. LocalStorage Risks

LocalStorage is not encrypted.

Warn user:

- Do not store highly sensitive credentials.
- Exported JSON contains financial data.
- Keep backup private.

---

## 3. Import JSON Validation

Import must validate:

- schemaVersion
- required fields
- numeric fields
- allowed enum values

Reject or sanitize invalid data.

---

## 4. XSS Prevention

Do not render user input as HTML.

Avoid:

```tsx
dangerouslySetInnerHTML
```

If markdown support is added, sanitize.

---

## 5. AI Advisor Safety

AI should not:

- expose private data externally without consent
- send data to API without user approval
- promise financial returns
- provide regulated financial advice as certainty

---

## 6. Future Cloud Security

When using Supabase:

- Row Level Security
- Auth
- encrypted transport
- backup strategy
- audit log
- data export/delete

---

## 7. Secrets

Never put API keys in frontend code.

If AI API needed later:

- use backend/edge function
- store keys server-side
