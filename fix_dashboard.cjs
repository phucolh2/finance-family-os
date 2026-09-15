const fs = require('fs');

let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// 1. lastRow
content = content.replace(
  'const lastRow = hasData ? projection.monthlyRows[projection.monthlyRows.length - 1] : null;',
  '// const lastRow = hasData ? projection.monthlyRows[projection.monthlyRows.length - 1] : null;'
);

// 2. cumulativeReturns
content = content.replace(
  'const cumulativeReturns = activeRow \n    ? activeRow.nominalNetWorth - netPrincipal\n    : 0;',
  '/* const cumulativeReturns = activeRow \n    ? activeRow.nominalNetWorth - netPrincipal\n    : 0; */'
);
content = content.replace(
  'const cumulativeReturns = activeRow \r\n    ? activeRow.nominalNetWorth - netPrincipal\r\n    : 0;',
  '/* const cumulativeReturns = activeRow \r\n    ? activeRow.nominalNetWorth - netPrincipal\r\n    : 0; */'
);

// 3. yearlyChartData
content = content.replace(
  /const yearlyChartData = projection\.yearlyRows\.map\(\(row\) => \(\{\r?\n    year: `Năm \$\{row\.year\}`,\r?\n    'Tài sản ròng \(Danh nghĩa\)': Math\.round\(row\.nominalNetWorth\),\r?\n    'Tài sản ròng \(Thực tế\)': Math\.round\(row\.realNetWorth\),\r?\n    'Hạn mức FIRE': Math\.round\(row\.fireTarget\),\r?\n    'Tổng thu nhập': Math\.round\(row\.totalIncomeYearly\),\r?\n    'Tổng chi phí': Math\.round\(row\.totalExpensesYearly\),\r?\n  \}\)\);/g,
  `/* const yearlyChartData = projection.yearlyRows.map((row) => ({
    year: \`Năm \${row.year}\`,
    'Tài sản ròng (Danh nghĩa)': Math.round(row.nominalNetWorth),
    'Tài sản ròng (Thực tế)': Math.round(row.realNetWorth),
    'Hạn mức FIRE': Math.round(row.fireTarget),
    'Tổng thu nhập': Math.round(row.totalIncomeYearly),
    'Tổng chi phí': Math.round(row.totalExpensesYearly),
  })); */`
);

// 4. strokeDashoffset
content = content.replace(
  'const strokeDashoffset = circumference - (Math.max(1, Math.min(100, healthScore)) / 100) * circumference;',
  '// const strokeDashoffset = circumference - (Math.max(1, Math.min(100, healthScore)) / 100) * circumference;'
);

fs.writeFileSync('src/pages/Dashboard.tsx', content, 'utf8');
