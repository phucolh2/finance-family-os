import os

file_path = 'src/utils/format.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_logic = """    if (absNum < 1000) {
      scaledValue = num;
      unit = shortUnit ? 'tr' : (isTooltip ? 'triệu đồng' : 'triệu');
    } else if (absNum < 1000000) {
      scaledValue = num / 1000;
      unit = shortUnit ? 'tỷ' : (isTooltip ? 'tỷ đồng' : 'tỷ');
    } else {
      scaledValue = num / 1000000;
      unit = shortUnit ? 'k tỷ' : (isTooltip ? 'nghìn tỷ đồng' : 'nghìn tỷ');
    }
  } else if (mode === 'million') {
    scaledValue = num;
    unit = shortUnit ? 'tr' : (isTooltip ? 'triệu đồng' : 'triệu');
  }"""

new_logic = """    if (absNum < 1000) {
      scaledValue = num;
      unit = shortUnit ? 'triệu' : (isTooltip ? 'triệu đồng' : 'triệu');
    } else if (absNum < 1000000) {
      scaledValue = num / 1000;
      unit = shortUnit ? 'tỷ' : (isTooltip ? 'tỷ đồng' : 'tỷ');
    } else {
      scaledValue = num / 1000000;
      unit = shortUnit ? 'nghìn tỷ' : (isTooltip ? 'nghìn tỷ đồng' : 'nghìn tỷ');
    }
  } else if (mode === 'million') {
    scaledValue = num;
    unit = shortUnit ? 'triệu' : (isTooltip ? 'triệu đồng' : 'triệu');
  }"""

content = content.replace(old_logic, new_logic)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
