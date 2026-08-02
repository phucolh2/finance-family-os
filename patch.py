import re

with open('src/components/expense/SinkingFundModule_Liquidity.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. State
c = c.replace(
    '  const [formError, setFormError] = useState<string | null>(null);',
    '  const [formError, setFormError] = useState<string | null>(null);\n  const [flashWarningFundId, setFlashWarningFundId] = useState<string | null>(null);\n  const [flashWarningMessage, setFlashWarningMessage] = useState<string>(\'\');'
)

# 2. handlePeriodicContributionChange
c = c.replace(
    '  const getFundBalance = (fundId: string) => {',
    '''  const handlePeriodicContributionChange = (fund: any, pKey: string | null, value: number) => {
     let newContrib = safeNumber(value, 0);
     const source = dynamicSources?.find(s => s.id === fund.sourceOfFund);
     
     if (source && newContrib > source.balance) {
         newContrib = 0;
         setFlashWarningFundId(fund.id);
         setFlashWarningMessage('Lưu ý: Hạng mục nguồn hiện tại không đủ số dư để duy trì mức trích định kỳ này (Đã tự động đưa về 0).');
         setTimeout(() => setFlashWarningFundId(null), 5000);
     }
     
     if (pKey) {
         const updatedConfigs = {
            ...(fund.periodConfigs || {}),
            [pKey]: {
               ...(fund.periodConfigs?.[pKey] || {}),
               contribution: newContrib,
            }
         };
         updateSinkingFund({
            ...fund,
            periodConfigs: updatedConfigs,
         });
     } else {
         updateSinkingFund({
            ...fund,
            monthlyContribution: newContrib,
         });
     }
  };

  const getFundBalance = (fundId: string) => {'''
)

# 3. Flashing warning in header
c = c.replace(
    '<div className="flex items-center gap-2">\n                    <h4 className="font-bold text-family-text group-hover:text-family-accent transition-colors">',
    '''                <div className="flex items-center gap-2 relative">
                  {flashWarningFundId === fund.id && (
                      <div className="absolute -top-7 right-0 left-0 bg-yellow-100 text-yellow-800 text-[11px] font-bold px-2 py-1 text-center animate-pulse z-10 rounded shadow-md border border-yellow-300">
                          {flashWarningMessage}
                      </div>
                  )}
                  <h4 className="font-bold text-family-text group-hover:text-family-accent transition-colors">'''
)

# 4. First onChange block (around line 850)
rgx1 = r'onChange=\{\(e\) => \{\s*const newContrib = safeNumber\(Number\(e\.target\.value\), 0\);\s*const updatedConfigs = \{\s*\.\.\.\(fund\.periodConfigs \|\| \{\}\),\s*\[pKey\]: \{\s*\.\.\.\(fund\.periodConfigs\?\.\[pKey\] \|\| \{\}\),\s*contribution: newContrib,\s*\}\s*\};\s*updateSinkingFund\(\{\s*\.\.\.fund,\s*periodConfigs: updatedConfigs,\s*\}\);\s*\}\}'
c = re.sub(rgx1, 'onChange={(e) => handlePeriodicContributionChange(fund, pKey, Number(e.target.value))}', c)

# 5. Withdrawal warning (around line 1262)
btn_str = '''<Button 
                        onClick={() => {
                          const wAmt = safeNumber(Number(disburseForm.amount), 0);'''
new_btn_str = '''{disburseForm.amount > getFundBalance(fund.id).balance && (
                          <div className="col-span-2 text-red-600 text-[11px] font-bold mt-1 mb-1 bg-red-50 p-2 rounded animate-pulse">
                              ⚠️ Số tiền rút không được vượt quá số dư hiện tại của quỹ là {formatTableMoneyVNDMillion(getFundBalance(fund.id).balance)} triệu.
                          </div>
                        )}
                        <Button disabled={disburseForm.amount > getFundBalance(fund.id).balance}
                        onClick={() => {
                          const wAmt = safeNumber(Number(disburseForm.amount), 0);'''

c = c.replace(btn_str, new_btn_str)

with open('src/components/expense/SinkingFundModule_Liquidity.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
