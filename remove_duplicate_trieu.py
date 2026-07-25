import os
import re

file_path = 'src/components/portfolio/SinkingFundModule.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace: {formatTableMoneyVNDMillion(totalDeposited || 0)} triệu -> {formatTableMoneyVNDMillion(totalDeposited || 0)}
content = re.sub(r'(\{formatTableMoneyVNDMillion\([^}]+\)\})\s*triệu', r'\1', content)

# Replace: <span className="font-bold text-family-accent text-[11px] ml-1">triệu</span>
# where it's immediately after a span with formatTableMoneyVNDMillion
content = re.sub(r'(<span[^>]*>\{formatTableMoneyVNDMillion\([^}]+\)\}<\/span>)\s*<span[^>]*>triệu<\/span>', r'\1', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated SinkingFundModule.tsx')
