# ADR-0001 — Timeline-first Architecture

## Status

Accepted

## Context

Family Financial OS cần mô phỏng tài chính gia đình theo nhiều năm, nhưng các thay đổi thực tế xảy ra theo tháng:

- thu nhập thay đổi từ một tháng cụ thể
- tỷ lệ ngân sách thay đổi từ một tháng cụ thể
- sinh con xảy ra ở một tháng cụ thể
- mua nhà, đổi xe, bệnh tật, thưởng, nghỉ việc đều là event theo tháng
- portfolio return và contribution cũng có thể theo tháng

Nếu tính trực tiếp theo năm, hệ thống sẽ sai khi sự kiện xảy ra giữa năm.

## Decision

Toàn bộ projection phải chạy theo **monthly timeline**.

Yearly table chỉ là aggregation từ monthly rows.

## Consequences

### Positive

- Chính xác hơn
- Dễ xử lý effective date
- Dễ mô phỏng life event
- Dễ so sánh scenario
- Dễ debug vì tháng nào cũng có output

### Negative

- Engine phức tạp hơn một chút
- Cần aggregate yearly cho UI
- Cần tối ưu nếu Monte Carlo nhiều simulation

## Implementation Rules

- `timelineEngine` là engine đầu tiên.
- `projectionEngine` lặp qua từng `TimelinePeriod`.
- Không tạo projection trực tiếp theo năm.
