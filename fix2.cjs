const fs = require('fs');
const files = [
    'src/components/expense/SinkingFundModule_Liquidity.tsx',
    'src/components/portfolio/SinkingFundModule_Portfolio.tsx',
    'src/components/reserves/SinkingFundModule_Reserves.tsx',
    'src/components/savings/SinkingFundModule_Savings.tsx'
];

for (const file of files) {
    let c = fs.readFileSync(file, 'utf8');
    
    // Add isPast definition
    const pKeyRegex = /const pKey = b\.periodKey \|\| \`\$\{bYr\}-\$\{String\(bMo\)\.padStart\(2, '0'\)\}\`;/g;
    c = c.replace(pKeyRegex, `const pKey = b.periodKey || \`\${bYr}-\${String(bMo).padStart(2, '0')}\`;\n                                      const isPast = b.termStart < currentObservedYear * 12 + currentObservedMonth;`);
    
    // Disable inputs
    const inputRegex = /<input\s+type="number"\s+step="0\.1"\s+min="0"/g;
    c = c.replace(inputRegex, '<input type="number" step="0.1" min="0" disabled={isPast}');
    
    const selectRegex = /<select\s+value=\{b\.termMonths\}/g;
    c = c.replace(selectRegex, '<select value={b.termMonths} disabled={isPast}');
    
    // Add disabled styles to inputs (opacity-70 cursor-not-allowed)
    c = c.replace(/className="w-10 text-right text-\[11px\] font-bold text-family-accent bg-transparent focus:outline-none"/g, 'className="w-10 text-right text-[11px] font-bold text-family-accent bg-transparent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"');
    
    c = c.replace(/className="w-14 text-right text-\[11px\] bg-white border border-family-accent\/30 rounded px-1\.5 py-0\.5 font-bold text-family-accent focus:outline-none focus:ring-1 focus:ring-family-accent"/g, 'className="w-14 text-right text-[11px] bg-white border border-family-accent/30 rounded px-1.5 py-0.5 font-bold text-family-accent focus:outline-none focus:ring-1 focus:ring-family-accent disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"');
    
    c = c.replace(/className="text-\[10px\] bg-slate-50 border border-slate-200 rounded px-1\.5 py-0\.5 font-medium text-family-text focus:outline-none focus:ring-1 focus:ring-family-accent"/g, 'className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 font-medium text-family-text focus:outline-none focus:ring-1 focus:ring-family-accent disabled:opacity-50 disabled:cursor-not-allowed"');
    
    c = c.replace(/className="w-12 text-center text-\[10px\] bg-slate-50 border border-slate-200 rounded px-1 py-0\.5 font-medium text-family-text focus:outline-none focus:ring-1 focus:ring-family-accent"/g, 'className="w-12 text-center text-[10px] bg-slate-50 border border-slate-200 rounded px-1 py-0.5 font-medium text-family-text focus:outline-none focus:ring-1 focus:ring-family-accent disabled:opacity-50 disabled:cursor-not-allowed"');
    
    fs.writeFileSync(file, c);
}
console.log('done');
