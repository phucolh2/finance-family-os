import os
import re

# 1. Update types/finance.ts
finance_file = 'src/types/finance.ts'
with open(finance_file, 'r', encoding='utf-8') as f:
    content = f.read()

old_types = """  type:
    | 'child_birth'
    | 'buy_property'
    | 'sell_property'
    | 'buy_car'
    | 'medical'
    | 'job_loss'
    | 'bonus'
    | 'inheritance'
    | 'retirement'
    | 'travel'
    | 'other';"""

new_types = """  type:
    | 'child_birth'
    | 'buy_property'
    | 'buy_car'
    | 'medical'
    | 'travel'
    | 'education'
    | 'home_renovation'
    | 'wedding'
    | 'large_purchase'
    | 'family_support'
    | 'other';"""

content = content.replace(old_types, new_types)
with open(finance_file, 'w', encoding='utf-8') as f:
    f.write(content)

# 2. Update pages/LifeStages.tsx
lifestages_file = 'src/pages/LifeStages.tsx'
with open(lifestages_file, 'r', encoding='utf-8') as f:
    content = f.read()

old_event_types = """    const eventTypes: { value: LifeEvent['type']; label: string }[] = [
    { value: 'buy_property', label: 'Mua bất động sản' },
    { value: 'buy_car', label: 'Mua xe ô tô' },
    { value: 'child_birth', label: 'Sinh con' },
    { value: 'medical', label: 'Sự kiện y tế hiểm nghèo' },
    { value: 'job_loss', label: 'Mất việc làm tạm thời' },
    { value: 'retirement', label: 'Nghỉ hưu' },
    { value: 'travel', label: 'Du lịch trải nghiệm lớn' },
    { value: 'other', label: 'Sự kiện khác' },
  ];"""

new_event_types = """    const eventTypes: { value: LifeEvent['type']; label: string }[] = [
    { value: 'buy_property', label: 'Mua / Đổi nhà, chung cư' },
    { value: 'buy_car', label: 'Mua / Đổi xe ô tô, xe máy' },
    { value: 'child_birth', label: 'Sinh con / Chăm sóc mẹ và bé' },
    { value: 'education', label: 'Nuôi con ăn học / Đóng học phí' },
    { value: 'home_renovation', label: 'Sửa chữa / Cải tạo nhà cửa' },
    { value: 'wedding', label: 'Đám cưới / Đám hỏi' },
    { value: 'large_purchase', label: 'Mua sắm trang thiết bị lớn' },
    { value: 'travel', label: 'Du lịch nghỉ dưỡng gia đình' },
    { value: 'medical', label: 'Biến cố y tế / Chữa bệnh' },
    { value: 'family_support', label: 'Hỗ trợ tài chính người thân' },
    { value: 'other', label: 'Sự kiện khác' },
  ];"""
content = content.replace(old_event_types, new_event_types)

old_get_label = """  const getEventLabel = (type: string) => {
    switch (type) {
      case 'buy_property': return 'Mua nhà / BĐS';
      case 'buy_car': return 'Mua Ô tô';
      case 'child_birth': return 'Sinh con';
      case 'medical': return 'Sự kiện y tế';
      case 'job_loss': return 'Mất việc / Giảm thu nhập';
      case 'retirement': return 'Nghỉ hưu';
      case 'travel': return 'Du lịch / Trải nghiệm';
      case 'other': return 'Sự kiện khác';
      default: return 'Sự kiện';
    }
  };"""

new_get_label = """  const getEventLabel = (type: string) => {
    switch (type) {
      case 'buy_property': return 'Mua nhà / BĐS';
      case 'buy_car': return 'Mua Ô tô / Xe máy';
      case 'child_birth': return 'Sinh con';
      case 'education': return 'Giáo dục / Học phí';
      case 'home_renovation': return 'Sửa nhà';
      case 'wedding': return 'Đám cưới / Đám hỏi';
      case 'large_purchase': return 'Mua sắm lớn';
      case 'travel': return 'Du lịch / Trải nghiệm';
      case 'medical': return 'Sự kiện y tế';
      case 'family_support': return 'Hỗ trợ người thân';
      case 'other': return 'Sự kiện khác';
      default: return 'Sự kiện';
    }
  };"""
content = content.replace(old_get_label, new_get_label)

old_get_icon = """  const getEventIcon = (type: string) => {
    switch (type) {
      case 'buy_property': return <Home className="w-5 h-5 text-white" />;
      case 'buy_car': return <Car className="w-5 h-5 text-white" />;
      case 'child_birth': return <Baby className="w-5 h-5 text-white" />;
      case 'medical': return <HeartPulse className="w-5 h-5 text-white" />;
      case 'job_loss': return <Briefcase className="w-5 h-5 text-white" />;
      case 'retirement': return <Milestone className="w-5 h-5 text-white" />;
      case 'travel': return <Plane className="w-5 h-5 text-white" />;
      default: return <CalendarRange className="w-5 h-5 text-white" />;
    }
  };"""

new_get_icon = """  const getEventIcon = (type: string) => {
    switch (type) {
      case 'buy_property': return <Home className="w-5 h-5 text-white" />;
      case 'buy_car': return <Car className="w-5 h-5 text-white" />;
      case 'child_birth': return <Baby className="w-5 h-5 text-white" />;
      case 'education': return <Briefcase className="w-5 h-5 text-white" />; // Will use a generic or Briefcase for now
      case 'home_renovation': return <Home className="w-5 h-5 text-white" />;
      case 'wedding': return <HeartPulse className="w-5 h-5 text-white" />;
      case 'large_purchase': return <Gift className="w-5 h-5 text-white" />;
      case 'travel': return <Plane className="w-5 h-5 text-white" />;
      case 'medical': return <HeartPulse className="w-5 h-5 text-white" />;
      case 'family_support': return <Gift className="w-5 h-5 text-white" />;
      default: return <CalendarRange className="w-5 h-5 text-white" />;
    }
  };"""
content = content.replace(old_get_icon, new_get_icon)

with open(lifestages_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated LifeEvent types.")
