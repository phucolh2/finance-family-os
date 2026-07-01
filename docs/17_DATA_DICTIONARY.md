# 17 — DATA DICTIONARY

## 1. Naming Rules

- Use camelCase for TypeScript fields.
- Use `Monthly` suffix for monthly values.
- Use `Annual` suffix for annual rates.
- Use `Percent` for percent values.
- Use `Rate` for decimal rate if applicable.
- Use VND million as MVP unit.

---

## 2. FamilyProfile

| Field | Type | Meaning |
|---|---|---|
| husbandName | string | Tên chồng |
| wifeName | string | Tên vợ |
| husbandAgeAtStart | number | Tuổi chồng tại planning start |
| wifeAgeAtStart | number | Tuổi vợ tại planning start |
| planningStartMonth | number | Tháng bắt đầu |
| planningStartYear | number | Năm bắt đầu |
| planningEndMonth | number | Tháng kết thúc |
| planningEndYear | number | Năm kết thúc |
| childBirthMonth | number optional | Tháng sinh con |
| childBirthYear | number optional | Năm sinh con |
| currency | string | Currency unit |

---

## 3. IncomeScheduleItem

| Field | Type | Meaning |
|---|---|---|
| id | string | Unique ID |
| effectiveMonth | number | Tháng hiệu lực |
| effectiveYear | number | Năm hiệu lực |
| incomeMonthly | number | Thu nhập tháng, VND million |
| incomeGrowthRateAnnual | number | Tăng thu nhập/năm |
| note | string | Ghi chú |

---

## 4. BudgetRatio

| Field | Type | Meaning |
|---|---|---|
| categoryId | string | Category ID |
| categoryName | string | Tên category |
| group | BudgetGroup | Nhóm ngân sách |
| ratioPercent | number | Tỷ lệ thu nhập |
| ruleType | BudgetRuleType | Loại rule |
| fixedAmountMonthly | number optional | Số cố định nếu rule fixed |
| capMonthly | number optional | Trần tháng |
| capTotal | number optional | Trần tổng quỹ |
| inflationRateAnnual | number optional | Lạm phát |
| isActive | boolean | Có active không |

---

## 5. BudgetGroup

| ID | Display Name |
|---|---|
| housing_basic | Nhà cửa & sinh hoạt cơ bản |
| future_investing | Tương lai & đầu tư |
| safety_reserve | Bình an & dự phòng |
| family_experience | Gia đình & trải nghiệm |
| health_growth | Sức khỏe & phát triển |
| children | Con cái |
| parents | Cha mẹ |

---

## 6. LifeEvent

| Field | Type | Meaning |
|---|---|---|
| id | string | Unique ID |
| month | number | Tháng |
| year | number | Năm |
| name | string | Tên event |
| type | string | Loại event |
| amount | number | Số tiền |
| source | string | Nguồn tiền |
| targetAssetId | string optional | Asset nhận tác động |
| recurringMonthlyImpact | number optional | Tác động định kỳ |
| affectsNetWorth | boolean | Có ảnh hưởng net worth không |
| note | string | Ghi chú |

---

## 7. PortfolioAsset

| Field | Type | Meaning |
|---|---|---|
| id | string | Unique ID |
| name | string | USD/Crypto/BĐS/Chứng khoán |
| targetAllocationPercent | number | Tỷ trọng mục tiêu |
| expectedReturnRateAnnual | number | Lợi nhuận kỳ vọng/năm |
| actualReturnByPeriod | record | Actual return override |
| contributionByPeriod | record | Actual contribution |
| balanceOverrideByPeriod | record | Actual balance override |

---

## 8. ProjectionMonthlyRow

| Field | Type | Meaning |
|---|---|---|
| key | string | YYYY-MM |
| incomeMonthly | number | Thu nhập |
| expensesMonthly | number | Chi phí |
| investmentMonthly | number | Đầu tư |
| savingMonthly | number | Tiết kiệm |
| childCostMonthly | number | Chi phí con |
| netCashflow | number | Dòng tiền ròng |
| investmentBalance | number | Số dư đầu tư |
| savingBalance | number | Số dư tiết kiệm |
| portfolioBalance | number | Giá trị portfolio |
| netWorth | number | Tài sản ròng |
| realNetWorthTodayValue | number | Sức mua hiện tại |
| fireTarget | number | FIRE target |
| fireProgress | number | FIRE progress |
| warnings | string[] | Cảnh báo |

---

## 9. Important Rule

Do not create new field names if an equivalent field exists here.

Update this dictionary when adding new fields.
