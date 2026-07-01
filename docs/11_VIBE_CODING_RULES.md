# 11 — VIBE CODING RULES

## 1. Purpose

Tài liệu này là bộ quy tắc làm việc với Gemini, Codex, Claude Code, Cursor hoặc bất kỳ AI coding assistant nào trong dự án **Family Financial OS**.

Mục tiêu:

- tránh code loạn
- tránh hardcode
- tránh mỗi màn hình một logic
- giữ architecture nhất quán
- đảm bảo build pass sau mỗi phase
- giúp AI hiểu sản phẩm trước khi sinh code

---

## 2. Golden Workflow

AI assistant phải làm theo workflow này:

```txt
Read docs
  ↓
Audit requirement
  ↓
Explain understanding
  ↓
List files to change
  ↓
Implement small phase
  ↓
Run build
  ↓
Fix minimal errors
  ↓
Summarize changes
```

Không code ngay khi chưa audit.

---

## 3. Required Reading by Phase

### Phase 1 — Foundation

Read:

- README.md
- PROJECT_MANIFEST.md
- docs/00_PROJECT_RULES.md
- docs/01_PRODUCT_VISION.md
- docs/05_SYSTEM_ARCHITECTURE.md
- docs/06_UI_UX_SPEC.md

### Phase 2 — Domain + Timeline

Read:

- docs/03_BUSINESS_RULES.md
- docs/04_DOMAIN_MODEL.md
- docs/07_FINANCIAL_ENGINES.md

### Phase 3 — Budget + Income

Read:

- docs/03_BUSINESS_RULES.md
- docs/07_FINANCIAL_ENGINES.md
- docs/09_DEFAULT_ASSUMPTIONS_VN.md
- docs/17_DATA_DICTIONARY.md

### Phase 4 — Projection

Read:

- docs/07_FINANCIAL_ENGINES.md
- docs/08_FEATURE_SPEC.md
- docs/16_FINANCIAL_FORMULAS.md

### Phase 5 — Scenarios + Child

Read:

- docs/03_BUSINESS_RULES.md
- docs/08_FEATURE_SPEC.md
- docs/18_PRODUCT_DECISIONS.md

### Phase 6 — Portfolio + FIRE

Read:

- docs/07_FINANCIAL_ENGINES.md
- docs/16_FINANCIAL_FORMULAS.md
- docs/12_TEST_CASES.md

---

## 4. Never Do

AI assistant không được:

- hardcode money
- hardcode year
- hardcode FIRE year
- hardcode child cost unrealistic
- calculate in UI
- duplicate business logic
- rewrite whole app for a bugfix
- remove feature silently
- ignore build errors
- ignore LocalStorage migration
- ignore warnings
- create fake data in components
- use separate formulas for scenarios
- reintroduce child 2035 scenario

---

## 5. Always Do

AI assistant luôn phải:

- use TypeScript types
- keep engines pure
- keep UI defensive
- run build
- use default ratios, not default amounts
- preserve warm family UI style
- return warnings from engine
- display warnings in UI
- use empty state for missing data
- preserve LocalStorage data when possible
- update docs if business rule changes

---

## 6. Prompt Template — Audit Before Coding

```txt
Đọc các tài liệu sau:
- PROJECT_MANIFEST.md
- docs/00_PROJECT_RULES.md
- docs/03_BUSINESS_RULES.md
- docs/05_SYSTEM_ARCHITECTURE.md

Không code.

Hãy trả lời:
1. Bạn hiểu sản phẩm là gì?
2. Source of truth nằm ở đâu?
3. Engine nào phụ thuộc engine nào?
4. File nào cần tạo/sửa?
5. Rủi ro kỹ thuật lớn nhất là gì?
6. Sau khi tôi xác nhận mới implement.
```

---

## 7. Prompt Template — Implement Phase

```txt
Implement đúng Phase hiện tại.

Yêu cầu:
- Không rewrite toàn app.
- Không hardcode số tiền.
- Không tính trong UI.
- Dùng engine theo docs.
- Chạy npm run build.
- Fix lỗi build nếu có.
- Sau khi xong, báo file đã sửa và test đã chạy.
```

---

## 8. Prompt Template — Bugfix

```txt
Bạn là Senior React TypeScript Debugger.

Ứng dụng bị lỗi sau thay đổi gần nhất.

Workflow:
1. Chạy npm run build.
2. Đọc lỗi.
3. Tìm root cause.
4. Fix tối thiểu.
5. Không rewrite toàn app.
6. Không hardcode.
7. Chạy lại npm run build.
8. Báo nguyên nhân và file đã sửa.
```

---

## 9. Code Quality Rules

### 9.1 Component

Component phải:

- typed props
- no financial formulas
- no hardcoded amounts
- defensive for undefined
- empty state support

### 9.2 Engine

Engine phải:

- pure
- deterministic
- no React imports
- no LocalStorage
- no direct DOM
- return warnings, not crash

### 9.3 Utils

Utils dùng cho:

- date calculations
- formatting
- safe numbers
- validations
- currency display

---

## 10. Build Discipline

Sau mỗi phase:

```bash
npm run build
```

Nếu build fail, task chưa xong.

Không được trả lời "xong" khi build fail.

---

## 11. Documentation Discipline

Nếu thay đổi:

- business rule
- formula
- domain model
- default assumption
- category structure

thì phải cập nhật docs liên quan.

---

## 12. AI Self-check

Trước khi trả lời "xong", AI phải tự kiểm:

- Có hardcode số tiền không?
- Có tính trong UI không?
- Có dùng đúng engine không?
- Dashboard có chỉ render không?
- Ratio default có phải tỷ lệ không?
- Kịch bản 2035 có bị thêm lại không?
- Build pass chưa?
