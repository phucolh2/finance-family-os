const fs = require('fs');

let content = fs.readFileSync('src/pages/Portfolio.tsx', 'utf8');

content = content.replace(/    updateAssets,?\r?\n/g, '');
content = content.replace(/    setSelectedPeriodKey,?\r?\n/g, '');
content = content.replace(/    addInvestmentDeal,?\r?\n/g, '');
content = content.replace(/    addSavingsDeposit,?\r?\n/g, '');
content = content.replace(/    disburseSinkingFund,?\r?\n/g, '');
content = content.replace(/    updateSinkingFund,?\r?\n/g, '');

content = content.replace('const [editingDealId, setEditingDealId]', 'const [, setEditingDealId]');
content = content.replace('const [convertingDealId, setConvertingDealId]', 'const [, setConvertingDealId]');
content = content.replace('const [conversionForm, setConversionForm]', 'const [conversionForm]');
content = content.replace("const [settleDealInputMode, setSettleDealInputMode] = useState<'amount' | 'rate'>('amount');", '/* settleDealInputMode */');
content = content.replace('const [settleDealCustomRate, setSettleDealCustomRate] = useState<number>(0);', '/* settleDealCustomRate */');
content = content.replace("const [convertDealInputMode, setConvertDealInputMode] = useState<'amount' | 'rate'>('amount');", '/* convertDealInputMode */');
content = content.replace('const [convertDealCustomRate, setConvertDealCustomRate] = useState<number>(0);', '/* convertDealCustomRate */');

content = content.replace(
  'const getMonthsActive = (startMonth: number, startYear: number, endMonth: number, endYear: number) => {\r\n    return Math.max(0, (endYear * 12 + endMonth) - (startYear * 12 + startMonth));\r\n  };',
  '/* const getMonthsActive = (startMonth: number, startYear: number, endMonth: number, endYear: number) => {\r\n    return Math.max(0, (endYear * 12 + endMonth) - (startYear * 12 + startMonth));\r\n  }; */'
);
content = content.replace(
  'const getMonthsActive = (startMonth: number, startYear: number, endMonth: number, endYear: number) => {\n    return Math.max(0, (endYear * 12 + endMonth) - (startYear * 12 + startMonth));\n  };',
  '/* const getMonthsActive = (startMonth: number, startYear: number, endMonth: number, endYear: number) => {\n    return Math.max(0, (endYear * 12 + endMonth) - (startYear * 12 + startMonth));\n  }; */'
);

content = content.replace(
  'const genericUnallocatedPercent = totalObservedBalance > 0\n    ? (genericUnallocatedBalance / totalObservedBalance) * 100\n    : 100;',
  '/* const genericUnallocatedPercent = totalObservedBalance > 0\n    ? (genericUnallocatedBalance / totalObservedBalance) * 100\n    : 100; */'
);
content = content.replace(
  'const genericUnallocatedPercent = totalObservedBalance > 0\r\n    ? (genericUnallocatedBalance / totalObservedBalance) * 100\r\n    : 100;',
  '/* const genericUnallocatedPercent = totalObservedBalance > 0\r\n    ? (genericUnallocatedBalance / totalObservedBalance) * 100\r\n    : 100; */'
);

content = content.replace('const savInterest = ', '// const savInterest = ');
content = content.replace('const cumContribution = ', '// const cumContribution = ');
content = content.replace('(entry, index)', '(_entry, index)');
content = content.replace('const isOriginallyEarmarked = ', '// const isOriginallyEarmarked = ');

fs.writeFileSync('src/pages/Portfolio.tsx', content, 'utf8');
