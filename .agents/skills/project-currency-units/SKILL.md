---
name: project-currency-units
description: Quy định bắt buộc về hiển thị đơn vị tiền tệ trong dự án (triệu, tỷ).
---

# Project Currency Units

## Rule
1. Luôn sử dụng từ **"triệu"** (viết thường hoặc viết hoa chữ cái đầu tuỳ ngữ cảnh, tuyệt đối KHÔNG viết tắt là "tr", "Tr").
2. Nếu số tiền lớn hơn hoặc bằng 1000 triệu, bắt buộc phải quy đổi thành **"tỷ"** (VD: `1.5 tỷ` thay vì `1500 triệu`).
3. Quy tắc này áp dụng cho mọi định dạng hiển thị tiền tệ (VND) trong UI, cụ thể là các hàm format (như `formatTableMoneyVNDMillion`).
   - Tham số đầu vào thường mang ý nghĩa đơn vị "triệu" (VD: `amount = 1500` tức là 1500 triệu).
   - Logic:
     ```javascript
     if (Math.abs(amount) >= 1000) {
       return `${(amount / 1000).toLocaleString('en-US', { maximumFractionDigits: 2 })} tỷ`;
     } else {
       return `${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })} triệu`;
     }
     ```

## Example
- `10` -> `10 triệu`
- `1500` -> `1.5 tỷ`
- `1000` -> `1 tỷ`
- `0.5` -> `0.5 triệu`

## Khi nào sử dụng Skill này?
Luôn luôn tuân thủ quy tắc này khi sửa UI, sửa hàm format hoặc khi viết thêm bất kỳ component nào liên quan đến hiển thị số tiền trong dự án `Finance Family OS`.
