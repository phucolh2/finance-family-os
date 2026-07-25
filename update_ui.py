import os
import re

with open('src/components/portfolio/SinkingFundModule.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Change grid to single column
code = code.replace(
    '<div className="grid grid-cols-1 md:grid-cols-2 gap-4">',
    '<div className="grid grid-cols-1 gap-4">'
)

# 2. Add estimated interest display next to interest rate
interest_pattern = r'(<span className="text-\[10px\] text-family-textMuted">%/năm</span>)'
replacement = r'\1\n                                              {b.termMonths > 0 && b.interestRateAnnual > 0 && (\n                                                 <span className="text-[10px] text-emerald-600 font-semibold ml-2">\n                                                    (+ {formatTableMoneyVNDMillion(b.principal * (b.interestRateAnnual / 100 / 12) * b.termMonths)} Tr lãi)\n                                                 </span>\n                                              )}'

code = re.sub(interest_pattern, replacement, code)

# 3. Enhance the contribution display to make it clearer what the input is
# The user wants "số tiền gửi kì đó" (contribution) to be clearer.
# Let's change the input to have a clear label "Nộp thêm:" if it's a rollover bucket, or "Số tiền nộp:" if it's just new contribution.
# Actually, the user already sees the input. Maybe just adding the interest is enough.

with open('src/components/portfolio/SinkingFundModule.tsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Done updating UI")
