# 26 — CODEX WORKFLOW

## 1. Mục tiêu

Hướng dẫn dùng Codex để phát triển Family Financial OS an toàn.

Codex mạnh ở việc đọc repo, sửa nhiều file và chạy command. Nhưng cần kiểm soát bằng docs và phase nhỏ.

---

## 2. Setup

```bash
npm create vite@latest family-financial-os -- --template react-ts
cd family-financial-os
npm install
npm install recharts lucide-react clsx
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Copy docs và prompts vào project.

---

## 3. Prompt mở đầu cho Codex

```txt
Read:
- README.md
- PROJECT_MANIFEST.md
- docs/00_PROJECT_RULES.md
- docs/05_SYSTEM_ARCHITECTURE.md
- docs/11_VIBE_CODING_RULES.md

Do not code.

Summarize the architecture, source of truth, and implementation phases.
```

---

## 4. Codex Phase Prompt

```txt
Implement prompts/BUILD_PHASE_01.md.

Before coding:
- list files you will create/edit
- confirm no financial logic will be added in Phase 1

After coding:
- run npm run build
- fix build errors
- summarize changes
```

---

## 5. Codex Debug Prompt

```txt
The app has errors.

Run npm run build.
Read the exact errors.
Find the root cause.
Fix the smallest possible set of files.
Do not rewrite the app.
Do not change business rules.
Do not hardcode money.
Run npm run build again.
```

---

## 6. Codex Audit Prompt

```txt
Audit the codebase for violations:

1. hardcoded money
2. hardcoded year
3. financial calculation in UI
4. duplicate FIRE formula
5. duplicate budget formula
6. child 2035 references
7. "Tài sản phụ & hình ảnh" references
8. NaN risk
9. undefined map risk
10. LocalStorage migration risk

Return findings by file and severity.
Do not fix yet.
```

---

## 7. Codex Refactor Prompt

```txt
Refactor only the violations listed in the audit.

Rules:
- preserve UI
- preserve behavior unless it violates docs
- move calculation to engine
- update tests/manual checklist
- run npm run build
```

---

## 8. Useful Commands

```bash
npm run dev
npm run build
npm run preview
```

Search:

```bash
grep -R "2035" src docs
grep -R "Tài sản phụ" src docs
grep -R "32" src
grep -R "23.2" src
```

---

## 9. Codex Stop Conditions

Stop and ask for human review if:

- schema migration is destructive
- major architecture change needed
- business rule conflict found
- calculation ambiguity found
- build error requires deleting feature
