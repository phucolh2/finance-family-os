# ADR-0003 — Ratio-based Budget Allocation

## Status

Accepted

## Context

Default allocation từng có nguy cơ bị hardcode thành số tiền như:

- 23.2 triệu
- 32 triệu
- 8 triệu
- 8.8 triệu

Điều này sai vì khi income thay đổi, số tiền phân bổ phải thay đổi.

## Decision

Default budget chỉ lưu tỷ lệ.

```txt
amountMonthly = incomeMonthly * ratioPercent / 100
```

Default ratios:

| Group | Ratio |
|---|---:|
| Nhà cửa & sinh hoạt cơ bản | 29% |
| Tương lai & đầu tư | 40% |
| Bình an & dự phòng | 10% |
| Gia đình & trải nghiệm | 11% |
| Sức khỏe & phát triển | 10% |

## Consequences

- Income 80 → đầu tư 32
- Income 100 → đầu tư 40
- Không hardcode amount
- Dễ tạo budget schedule theo thời gian
