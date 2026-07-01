# ADR-0004 — Remove Child 2035 Scenario

## Status

Accepted

## Context

Dự án từng có ý tưởng scenario sinh con 2035.

User đã quyết định tập trung vào kịch bản sinh con năm 2031.

## Decision

Loại bỏ toàn bộ scenario child 2035.

Không xuất hiện ở:

- Sidebar
- Scenario Manager
- Default data
- Documentation
- Test data
- Prompt
- Code

## Validation

Trước release phải grep:

```bash
grep -R "2035" src docs prompts
```

Nếu còn 2035 trong ngữ cảnh child scenario thì phải xóa.
