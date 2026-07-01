# Family Financial OS — Complete Documentation Pack

## Cách dùng nhanh với Gemini/Codex

1. Đọc đầu tiên:
   - README.md
   - PROJECT_MANIFEST.md
   - docs/00_PROJECT_RULES.md
   - docs/03_BUSINESS_RULES.md
   - docs/05_SYSTEM_ARCHITECTURE.md
   - docs/11_VIBE_CODING_RULES.md
   - docs/18_PRODUCT_DECISIONS.md

2. Sau đó dùng:
   - prompts/MASTER_START_PROMPT.md

3. Build theo phase:
   - prompts/BUILD_PHASE_01.md
   - prompts/BUILD_PHASE_02.md
   - prompts/BUILD_PHASE_03.md
   - prompts/BUILD_PHASE_04.md
   - prompts/BUILD_PHASE_05.md
   - prompts/BUILD_PHASE_06.md
   - prompts/BUILD_PHASE_07.md
   - prompts/BUILD_PHASE_08.md
   - prompts/BUILD_PHASE_09.md

4. Khi lỗi:
   - prompts/BUGFIX_PROMPT.md
   - prompts/AUDIT_ARCHITECTURE.md
   - prompts/AUDIT_FINANCIAL_LOGIC.md
   - prompts/RELEASE_CHECKLIST_PROMPT.md

## Ghi nhớ luật lớn

- Không hardcode số tiền.
- Default allocation là tỷ lệ, không phải số tiền.
- UI không tính toán tài chính.
- Dashboard chỉ render output từ engine.
- Projection chạy theo tháng, aggregate theo năm.
- Không còn kịch bản con 2035.
- “Tài sản phụ & hình ảnh” đã gộp vào “Sức khỏe & phát triển”.
## Thư mục bổ sung

### decisions/

Lưu Architectural Decision Records — các quyết định sản phẩm/kỹ thuật quan trọng.

Đọc khi AI có dấu hiệu làm sai rule cũ.

### assets/

Lưu guideline giao diện, màu sắc, wireframe, icon mapping, chart references.

Đọc khi build UI.

### examples/

Lưu data mẫu và expected output để test engine.

Đọc khi implement/test financial logic.
