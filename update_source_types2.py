import os

lifestages_file = 'src/pages/LifeStages.tsx'
with open(lifestages_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update sourceTypes
old_source_types = """  const sourceTypes = React.useMemo(() => {
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

new_source_types = """  const sourceTypes = React.useMemo(() => {
    const expenseGroups = activeBudget?.rootGroups.filter(g => g.classification === 'expense') || [];
    const groups = expenseGroups.map(g => ({
      value: g.groupId,
      label: `Quỹ dư: ${g.name}`
    }));
    return [
      ...groups,
      { value: 'debt', label: 'Vay nợ' },
      { value: 'external', label: 'Nguồn tài trợ bên ngoài' },
    ];
  }, [activeBudget]);"""

content = content.replace(old_source_types, new_source_types)

# 2. Update initial formData and handleAddClick
old_source_fallback = "source: activeBudget?.rootGroups[0]?.groupId || 'debt',"
new_source_fallback = "source: activeBudget?.rootGroups.find(g => g.classification === 'expense')?.groupId || 'debt',"

content = content.replace(old_source_fallback, new_source_fallback)

with open(lifestages_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated LifeStages.tsx to only list expense root groups for sourceTypes.")
