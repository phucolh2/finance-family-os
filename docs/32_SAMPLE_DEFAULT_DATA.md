# 32 — SAMPLE DEFAULT DATA

## 1. Purpose

Tài liệu này mô tả dữ liệu mặc định cho MVP.

Unit: VND million.

---

## 2. Family Profile

```json
{
  "husbandName": "A. Phước",
  "wifeName": "Quế",
  "husbandAgeAtStart": 35,
  "wifeAgeAtStart": 31,
  "planningStartMonth": 10,
  "planningStartYear": 2026,
  "planningEndMonth": 12,
  "planningEndYear": 2060,
  "childBirthMonth": 1,
  "childBirthYear": 2031,
  "currency": "VND_MILLION"
}
```

---

## 3. Income Schedule

```json
[
  {
    "id": "income-2026-10",
    "effectiveMonth": 10,
    "effectiveYear": 2026,
    "incomeMonthly": 80,
    "incomeGrowthRateAnnual": 5,
    "note": "Bắt đầu tích lũy"
  }
]
```

---

## 4. Budget Schedule

```json
[
  {
    "id": "budget-2026-10",
    "effectiveMonth": 10,
    "effectiveYear": 2026,
    "note": "Default 5 nhóm sau khi gộp tài sản phụ vào sức khỏe phát triển",
    "ratios": [
      {
        "categoryId": "housing-basic",
        "categoryName": "Nhà cửa & sinh hoạt cơ bản",
        "group": "housing_basic",
        "ratioPercent": 29,
        "ruleType": "percent",
        "isActive": true
      },
      {
        "categoryId": "future-investing",
        "categoryName": "Tương lai & đầu tư",
        "group": "future_investing",
        "ratioPercent": 40,
        "ruleType": "percent",
        "isActive": true
      },
      {
        "categoryId": "safety-reserve",
        "categoryName": "Bình an & dự phòng",
        "group": "safety_reserve",
        "ratioPercent": 10,
        "ruleType": "percent",
        "capTotal": 700,
        "isActive": true
      },
      {
        "categoryId": "family-experience",
        "categoryName": "Gia đình & trải nghiệm",
        "group": "family_experience",
        "ratioPercent": 11,
        "ruleType": "percent",
        "isActive": true
      },
      {
        "categoryId": "health-growth",
        "categoryName": "Sức khỏe & phát triển",
        "group": "health_growth",
        "ratioPercent": 10,
        "ruleType": "percent",
        "isActive": true
      }
    ]
  }
]
```

---

## 5. Life Stages

```json
[
  {
    "id": "stage-2026-2027",
    "name": "Khởi động tích lũy",
    "fromMonth": 10,
    "fromYear": 2026,
    "toMonth": 12,
    "toYear": 2027,
    "hasHouse": false,
    "rentMode": "fixed",
    "rentMonthly": 7,
    "foodBaseMonthly": 7.6,
    "foodInflationAnnual": 4,
    "foodCapMonthly": 20,
    "transportMonthly": 1,
    "travelMonthly": 0,
    "healthFundCap": 700,
    "liquidityFundCap": 700,
    "note": "Giai đoạn thuê nhà fixed"
  },
  {
    "id": "stage-2031-child",
    "name": "Có con 2031",
    "fromMonth": 1,
    "fromYear": 2031,
    "toMonth": 12,
    "toYear": 2060,
    "hasHouse": false,
    "rentMode": "dynamic",
    "healthFundCap": 700,
    "liquidityFundCap": 700,
    "note": "Child engine active"
  }
]
```

---

## 6. Portfolio Config

```json
{
  "assets": [
    {
      "id": "usd",
      "name": "USD",
      "targetAllocationPercent": 20,
      "expectedReturnRateAnnual": 3
    },
    {
      "id": "crypto",
      "name": "Crypto",
      "targetAllocationPercent": 15,
      "expectedReturnRateAnnual": 15
    },
    {
      "id": "property",
      "name": "Bất động sản",
      "targetAllocationPercent": 35,
      "expectedReturnRateAnnual": 8
    },
    {
      "id": "stocks",
      "name": "Chứng khoán",
      "targetAllocationPercent": 30,
      "expectedReturnRateAnnual": 10
    }
  ]
}
```

---

## 7. Assumptions

```json
{
  "generalInflationAnnual": 4,
  "medicalInflationAnnual": 6,
  "educationInflationAnnual": 6,
  "finalRestInflationAnnual": 5,
  "withdrawalRate": 4,
  "monteCarloSimulations": 1000,
  "returnVolatilityAnnual": 15,
  "inflationVolatilityAnnual": 2
}
```

---

## 8. Child Config

```json
{
  "childBirthMonth": 1,
  "childBirthYear": 2031,
  "lifestyle": "premium",
  "budgetCapMonthly": 35,
  "educationTrack": "vn_quality",
  "educationInflationAnnual": 6,
  "healthInflationAnnual": 6
}
```
