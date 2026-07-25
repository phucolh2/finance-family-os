import os
import re

lifestages_file = 'src/pages/LifeStages.tsx'
with open(lifestages_file, 'r', encoding='utf-8') as f:
    content = f.read()

old_source_types = """  const sourceTypes: { value: LifeEvent['source']; label: string }[] = [
    { value: 'housing_basic', label: 'Sinh hoạt & Cố định' },
    { value: 'future_investing', label: 'Tương lai & Đầu tư' },
    { value: 'safety_reserve', label: 'Bình an & Dự phòng' },
    { value: 'family_experience', label: 'Yêu thương & Sự kiện' },
    { value: 'health_growth', label: 'Sức khỏe & Phát triển' },
    { value: 'debt', label: 'Vay nợ' },
    { value: 'external', label: 'Nguồn tài trợ bên ngoài' },
  ];"""

new_source_types = """  const sourceTypes = React.useMemo(() => {
    const groups = activeBudget?.rootGroups.map(g => ({
      value: g.groupId,
      label: g.name
    })) || [];
    return [
      ...groups,
      { value: 'debt', label: 'Vay nợ' },
      { value: 'external', label: 'Nguồn tài trợ bên ngoài' },
    ];
  }, [activeBudget]);"""

content = content.replace(old_source_types, new_source_types)

# Also update the default form data to use the first group if available, else 'debt'
# The form data has `source: 'safety_reserve',`
old_form_data = """  const [formData, setFormData] = useState<Omit<LifeEvent, 'id'>>({
    name: '',
    type: 'other',
    month: 1,
    year: 2030,
    amount: 0,
    source: 'safety_reserve',
    recurringMonthlyImpact: 0,
    affectsNetWorth: true,
    note: '',
    isMilestone: false,
    spendingCategory: '',
  });"""

new_form_data = """  const [formData, setFormData] = useState<Omit<LifeEvent, 'id'>>({
    name: '',
    type: 'other',
    month: 1,
    year: 2030,
    amount: 0,
    source: activeBudget?.rootGroups[0]?.groupId || 'debt',
    recurringMonthlyImpact: 0,
    affectsNetWorth: true,
    note: '',
    isMilestone: false,
    spendingCategory: '',
  });"""

content = content.replace(old_form_data, new_form_data)

# And in handleAddClick:
old_handle_add = """    setFormData({
      name: '',
      type: 'other',
      month: 1,
      year: 2030,
      amount: 0,
      source: 'safety_reserve',
      recurringMonthlyImpact: 0,
      affectsNetWorth: true,
      note: '',
      isMilestone: false,
      spendingCategory: '',
    });"""

new_handle_add = """    setFormData({
      name: '',
      type: 'other',
      month: 1,
      year: 2030,
      amount: 0,
      source: activeBudget?.rootGroups[0]?.groupId || 'debt',
      recurringMonthlyImpact: 0,
      affectsNetWorth: true,
      note: '',
      isMilestone: false,
      spendingCategory: '',
    });"""

content = content.replace(old_handle_add, new_handle_add)

with open(lifestages_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated LifeStages.tsx sourceTypes to be dynamic.")
