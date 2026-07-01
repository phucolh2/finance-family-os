# 14 — CHANGELOG

## Format

Mỗi thay đổi phải ghi:

```md
## [Version] - YYYY-MM-DD

### Added
### Changed
### Fixed
### Removed
### Decision
```

---

## [2.0.0] - Initial SRS

### Added

- Timeline-first architecture
- Engine-based financial modeling
- Event-driven life simulation
- Scenario manager concept
- Child 2031 scenario
- Portfolio assets: USD, Crypto, BĐS, Chứng khoán
- FIRE Center
- Monte Carlo
- Health & Final Rest
- Knowledge Center

### Changed

- Default allocation moved from fixed amounts to ratios
- Budget calculation moves from UI to budgetEngine
- Projection source becomes monthly timeline

### Removed

- Child 2035 scenario
- "Tài sản phụ & hình ảnh" standalone group

### Decision

- Gộp "Tài sản phụ & hình ảnh" vào "Sức khỏe & phát triển"
- Default budget groups now 5 groups
- Child cost must be separate category
- Dashboard must not calculate
