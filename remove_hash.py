import os

files = [
    ('src/components/portfolio/fund-cards/LifestyleFundCard.tsx', '                  #{fund.fundGroup}', '                  {fund.fundGroup}'),
    ('src/components/portfolio/fund-cards/ReservesFundCard.tsx', '                # {fund.fundGroup}', '                {fund.fundGroup}')
]

for file_path, old, new in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    if old in content:
        content = content.replace(old, new)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Replaced in {file_path}")
    else:
        print(f"Not found in {file_path}")
