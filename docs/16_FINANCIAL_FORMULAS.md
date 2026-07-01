# 16 — FINANCIAL FORMULAS

## 1. Monthly Growth from Annual Growth

```txt
monthlyGrowth = (1 + annualGrowth)^(1/12) - 1
```

Use for income, inflation, portfolio return if compounding monthly.

---

## 2. Budget Amount from Ratio

```txt
amountMonthly = incomeMonthly * ratioPercent / 100
```

Never use fixed default amount.

---

## 3. Inflation Adjustment

Future value:

```txt
futureCost = currentCost * (1 + inflationRate)^years
```

Real value today:

```txt
realValueToday = nominalValue / (1 + inflationRate)^years
```

---

## 4. Portfolio Monthly PnL

```txt
monthlyReturn = annualReturn / 12
pnl = (beginningBalance + contribution * 0.5) * monthlyReturn
endingBalance = beginningBalance + contribution + pnl
```

---

## 5. Net Worth

```txt
netWorth = totalAssets - totalLiabilities
```

Assets may include:

- cash
- savings
- portfolio
- property
- USD
- crypto
- stocks

Liabilities may include:

- mortgage
- consumer debt
- family debt
- credit card debt

---

## 6. FIRE Target

```txt
annualExpense = monthlyExpense * 12
fireTarget = annualExpense / withdrawalRate
```

Default withdrawalRate:

```txt
4% = 0.04
```

Example:

```txt
monthlyExpense = 50
annualExpense = 600
fireTarget = 600 / 0.04 = 15,000
```

Unit = VND million.

---

## 7. FIRE Progress

```txt
fireProgress = netWorth / fireTarget
```

Cap display can be 100%+, but keep raw value.

---

## 8. CAGR

```txt
CAGR = (EndingValue / BeginningValue)^(1 / years) - 1
```

---

## 9. Savings Rate

```txt
savingsRate = (investmentMonthly + savingMonthly) / incomeMonthly
```

---

## 10. Expense Ratio

```txt
expenseRatio = totalExpensesMonthly / incomeMonthly
```

---

## 11. Monte Carlo Basic

For each simulation:

```txt
returnYear = randomNormal(meanReturn, returnVolatility)
inflationYear = randomNormal(meanInflation, inflationVolatility)
```

Run projection.

Success if:

```txt
netWorth >= fireTarget
```

within planning horizon.

Probability:

```txt
successCount / simulationCount
```

---

## 12. Health Fund Progress

```txt
healthFundProgress = currentHealthFund / healthFundCap
```

---

## 13. Years to Reach Fund

```txt
monthsNeeded = (target - current) / monthlyContribution
yearsNeeded = monthsNeeded / 12
```

If monthlyContribution <= 0, return warning.

---

## 14. Scenario Difference

```txt
difference = scenarioValue - baseValue
differencePercent = difference / baseValue
```

---

## 15. Important Precision Rule

All internal calculations use numbers.

Formatting to "tr", "tỷ" only happens in UI formatter.
