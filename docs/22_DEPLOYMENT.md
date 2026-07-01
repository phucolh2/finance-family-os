# 22 — DEPLOYMENT

## 1. MVP Deployment

Recommended:

- Vite static build
- Netlify
- Vercel
- GitHub Pages

Build:

```bash
npm run build
```

Output:

```txt
dist/
```

---

## 2. Environment

MVP does not require backend.

No secrets needed.

---

## 3. Netlify

Deploy command:

```bash
npm run build
```

Publish directory:

```txt
dist
```

---

## 4. Versioning

Use semantic version:

```txt
0.1.0
0.2.0
1.0.0
```

---

## 5. Release Checklist

Before deploy:

- npm run build pass
- import/export tested
- LocalStorage migration tested
- no console errors
- no scenario 2035
- docs updated

---

## 6. Future Cloud Deployment

If adding Supabase:

- environment variables
- backend API
- auth
- database migration
- backup
