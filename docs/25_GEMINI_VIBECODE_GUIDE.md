# 25 — GEMINI VIBECODE GUIDE

## 1. Mục tiêu

Tài liệu này hướng dẫn cách dùng Gemini để phát triển Family Financial OS theo phương pháp Vibe Coding nhưng vẫn giữ kiến trúc ổn định.

Gemini phải đọc tài liệu theo từng phase, không đọc tất cả một lần rồi code toàn bộ.

---

## 2. Nguyên tắc dùng Gemini

### Không làm

Không prompt kiểu:

```txt
Đọc hết docs rồi build toàn bộ app.
```

Lý do:

- Context quá lớn
- Gemini dễ quên rule
- Dễ hardcode
- Dễ rewrite toàn app
- Dễ làm mỗi màn hình một logic

### Nên làm

Dùng **Progressive Context Loading**:

1. Cho Gemini đọc manifest và rule chính.
2. Yêu cầu Gemini tóm tắt hiểu biết.
3. Chỉ implement một phase nhỏ.
4. Build.
5. Fix.
6. Sang phase tiếp theo.

---

## 3. Lệnh khởi động dự án

```bash
npm create vite@latest family-financial-os -- --template react-ts
cd family-financial-os
npm install
npm install recharts lucide-react clsx
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm run dev
```

---

## 4. Cấu trúc thư mục cần tạo

```txt
family-financial-os/
  docs/
  prompts/
  src/
    app/
    components/
    pages/
    engines/
    data/
    types/
    utils/
```

Copy toàn bộ docs và prompts vào thư mục dự án.

---

## 5. Prompt khởi động Gemini

```txt
Bạn là Senior Vibe Coding Architect + React TypeScript Engineer.

Đọc các file:
- README.md
- PROJECT_MANIFEST.md
- docs/00_PROJECT_RULES.md
- docs/01_PRODUCT_VISION.md
- docs/05_SYSTEM_ARCHITECTURE.md
- docs/11_VIBE_CODING_RULES.md

Không code.

Hãy trả lời:
1. Bạn hiểu sản phẩm là gì?
2. Source of truth nằm ở đâu?
3. Vì sao Timeline là xương sống?
4. Vì sao UI không được tính toán?
5. Engine nào phụ thuộc engine nào?
6. Rủi ro lớn nhất khi implement là gì?
7. Sau khi tôi xác nhận mới code Phase 1.
```

---

## 6. Prompt Phase 1

```txt
Đọc:
- prompts/BUILD_PHASE_01.md
- docs/06_UI_UX_SPEC.md

Implement Phase 1.

Yêu cầu:
- Chỉ tạo layout, theme, sidebar, empty pages.
- Không implement financial logic.
- Không hardcode số tiền.
- npm run build phải pass.
```

---

## 7. Prompt Phase 2

```txt
Đọc:
- prompts/BUILD_PHASE_02.md
- docs/04_DOMAIN_MODEL.md
- docs/07_FINANCIAL_ENGINES.md

Implement Timeline Engine + Types.

Không code UI phức tạp.
Không tạo financial formulas ngoài engine.
Build pass.
```

---

## 8. Prompt Phase 3

```txt
Đọc:
- prompts/BUILD_PHASE_03.md
- docs/03_BUSINESS_RULES.md
- docs/09_DEFAULT_ASSUMPTIONS_VN.md
- docs/17_DATA_DICTIONARY.md

Implement Income Schedule + Budget Engine + Budget pages.

Bắt buộc:
- Default allocation là tỷ lệ, không phải số tiền.
- Không còn "Tài sản phụ & hình ảnh".
- Amount = income * ratio / 100.
- Dashboard không tự tính.
- Build pass.
```

---

## 9. Prompt Phase 4

```txt
Đọc:
- prompts/BUILD_PHASE_04.md
- docs/07_FINANCIAL_ENGINES.md
- docs/16_FINANCIAL_FORMULAS.md

Implement Cashflow + Projection + Dashboard integration.

Bắt buộc:
- Projection chạy monthly.
- Table aggregate yearly.
- Chart có tooltip.
- Đổi start month thì tính lại.
- Build pass.
```

---

## 10. Prompt Phase 5

```txt
Đọc:
- prompts/BUILD_PHASE_05.md
- docs/03_BUSINESS_RULES.md
- docs/18_PRODUCT_DECISIONS.md

Implement Child 2031 + Scenario Engine basic.

Bắt buộc:
- Không có child 2035.
- Child cost là category riêng.
- Không trừ trực tiếp child cost từ investment.
- Không hardcode 63tr/tháng.
- Build pass.
```

---

## 11. Prompt Bugfix

```txt
Ứng dụng bị lỗi sau phase gần nhất.

Đọc:
- PROJECT_MANIFEST.md
- prompts/BUGFIX_PROMPT.md
- docs/11_VIBE_CODING_RULES.md

Workflow:
1. Chạy npm run build.
2. Đọc lỗi.
3. Tìm root cause.
4. Fix tối thiểu.
5. Không rewrite toàn app.
6. Không hardcode.
7. Chạy lại build.
8. Báo file đã sửa và nguyên nhân.
```

---

## 12. Gemini Review Checklist

Sau mỗi phase, bắt Gemini trả lời:

```txt
Checklist:
- Build pass chưa?
- Có hardcode money không?
- Có tính trong UI không?
- Dashboard có chỉ render không?
- Có thêm lại child 2035 không?
- Ratio default có phải tỷ lệ không?
- LocalStorage có an toàn không?
```

---

## 13. Quy tắc nếu Gemini làm sai

Nếu Gemini bắt đầu rewrite toàn app, dùng prompt:

```txt
Dừng lại. Bạn đang rewrite quá rộng.

Quay lại yêu cầu:
- Fix tối thiểu.
- Giữ architecture hiện tại.
- Không thay đổi UI lớn.
- Không hardcode.
- Chỉ sửa root cause.
```
