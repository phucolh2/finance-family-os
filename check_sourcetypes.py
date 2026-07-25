import os

lifestages_file = 'src/pages/LifeStages.tsx'
with open(lifestages_file, 'r', encoding='utf-8') as f:
    content = f.read()

# We need to find the static sourceTypes array and remove it.
# It looks like this:
old_source_types = """  const sourceTypes: { value: LifeEvent['source']; label: string }[] = [
    { value: 'housing_basic', label: 'Sinh hoạt & Cố định' },
    { value: 'future_investing', label: 'Tương lai & Đầu tư' },
    { value: 'safety_reserve', label: 'Bình an & Dự phòng' },
    { value: 'family_experience', label: 'Yêu thương & Sự kiện' },
    { value: 'health_growth', label: 'Sức khỏe & Phát triển' },
    { value: 'debt', label: 'Vay nợ' },
    { value: 'external', label: 'Nguồn tài trợ bên ngoài' },
  ];"""

content = content.replace(old_source_types, "")

# Now we need to insert the dynamic sourceTypes inside the component, near activeBudget.
# activeBudget is around line 43-44:
# const activeBudget = state.budgetSchedule.length > 0 ? state.budgetSchedule[state.budgetSchedule.length - 1] : null;

active_budget_line = "const activeBudget = state.budgetSchedule.length > 0 ? state.budgetSchedule[state.budgetSchedule.length - 1] : null;"

dynamic_source_types = """const activeBudget = state.budgetSchedule.length > 0 ? state.budgetSchedule[state.budgetSchedule.length - 1] : null;

  const sourceTypes = React.useMemo(() => {
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

content = content.replace(active_budget_line, dynamic_source_types)

# Wait, `getSourceLabel` uses `sourceTypes` outside the component scope if it was static.
# Let's check where `getSourceLabel` is. It was inside the component? 
# Oh, in LifeStages.tsx, let's see where getSourceLabel is defined.
