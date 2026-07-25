import os

file_path = 'src/pages/LifeStages.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'label="Nguồn trừ/Cộng tài sản"',
    'label="Nguồn chi trả"'
)

content = content.replace(
    'Chi phí (hoặc thu nhập) phát sinh <strong>đều đặn mỗi tháng</strong>',
    'Chi phí phát sinh <strong>đều đặn mỗi tháng</strong>'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Text replaced successfully.")
