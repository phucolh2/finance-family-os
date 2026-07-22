import re

with open("src/pages/LifeStages.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Change default tab
content = content.replace(
    "const [activeTab, setActiveTab] = useState<'timeline' | 'monthly_reconciliation'>('timeline');",
    "const [activeTab, setActiveTab] = useState<'timeline' | 'monthly_reconciliation'>('monthly_reconciliation');"
)

# 2. Extract Tabs block
tabs_regex = re.compile(r"(      \{/\* Tabs \*/\}.*?      </div>\n)", re.DOTALL)
tabs_match = tabs_regex.search(content)
if tabs_match:
    tabs_block = tabs_match.group(1)
    content = content.replace(tabs_block, "")
    
    # 3. Insert Tabs block right after the Header div ends.
    # The header ends with: </div>\n      </div>\n\n      <ExpenseDashboard
    header_end = "      </div>\n\n      <ExpenseDashboard"
    content = content.replace(header_end, "      </div>\n\n" + tabs_block + "\n      <ExpenseDashboard")
    
    # 4. Wrap ExpenseDashboard and Dashboard Summary inside timeline tab
    # Find ExpenseDashboard and Dashboard Summary
    summary_regex = re.compile(r"(      <ExpenseDashboard.*?      </div>\n\n      \{formError)", re.DOTALL)
    summary_match = summary_regex.search(content)
    if summary_match:
        summary_block = summary_match.group(1)
        wrapped_summary = "      {activeTab === 'timeline' && (\n        <div className=\"space-y-6\">\n" + "\n".join(["          " + line if line.strip() else line for line in summary_block.replace("      {formError", "").split("\n")]) + "\n        </div>\n      )}\n\n      {formError"
        content = content.replace(summary_match.group(1), wrapped_summary)

with open("src/pages/LifeStages.tsx", "w", encoding="utf-8") as f:
    f.write(content)
