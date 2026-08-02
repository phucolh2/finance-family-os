import re

with open('src/components/expense/SinkingFundModule_Liquidity.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Replace React.Fragment with relative div
rgx_fragment = re.compile(r'<React\.Fragment key=\{fund\.id\}>\s*\{variant === \'lifestyle\' && <LifestyleFundCard \{\.\.\.cardProps\} \/>\}\s*\{variant === \'savings\' && <SavingsFundCard \{\.\.\.cardProps\} \/>\}\s*\{variant === \'reserves\' && <ReservesFundCard \{\.\.\.cardProps\} \/>\}\s*\{variant === \'portfolio\' && <PortfolioFundCard \{\.\.\.cardProps\} \/>\}\s*<\/React\.Fragment>')
c = rgx_fragment.sub('''<div key={fund.id} className="relative mt-2 pt-2">
                  {flashWarningFundId === fund.id && (
                      <div className="absolute -top-3 right-0 left-0 bg-yellow-100 text-yellow-800 text-[11px] font-bold px-2 py-1.5 text-center animate-pulse z-[100] rounded-t-xl border-b border-yellow-300">
                          {flashWarningMessage}
                      </div>
                  )}
                  {variant === 'lifestyle' && <LifestyleFundCard {...cardProps} />}
                  {variant === 'savings' && <SavingsFundCard {...cardProps} />}
                  {variant === 'reserves' && <ReservesFundCard {...cardProps} />}
                  {variant === 'portfolio' && <PortfolioFundCard {...cardProps} />}
                </div>''', c)

# Replace Withdrawal Button
rgx_btn = re.compile(r'<Button\s*onClick=\{\(\) => \{\s*const wAmt = safeNumber\(Number\(disburseForm\.amount\), 0\);')
c = rgx_btn.sub('''{disburseForm.amount > getFundBalance(fund.id).balance && (
                          <div className="col-span-2 text-red-600 text-[11px] font-bold mt-1 mb-1 bg-red-50 p-2 rounded animate-pulse">
                              ⚠️ Số tiền rút không được vượt quá số dư hiện tại của quỹ là {formatTableMoneyVNDMillion(getFundBalance(fund.id).balance)} triệu.
                          </div>
                        )}
                        <Button disabled={disburseForm.amount > getFundBalance(fund.id).balance}
                        onClick={() => {
                          const wAmt = safeNumber(Number(disburseForm.amount), 0);''', c)

with open('src/components/expense/SinkingFundModule_Liquidity.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
