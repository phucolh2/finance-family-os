// Types for the Vacation Planner tool
// Data stored entirely in state.toolConfigs.vacationPlanner — zero impact on core financial data

export type VacationCategory = 'transport' | 'accommodation' | 'food' | 'activities' | 'gifts' | 'misc';

export interface VacationBudgetItem {
  category: VacationCategory;
  planned: number;    // triệu VND
  actual: number;     // triệu VND
  note?: string;
}

export type VacationStatus = 'dreaming' | 'planning' | 'ongoing' | 'completed';

export interface VacationTrip {
  id: string;
  name: string;
  destination: string;
  emoji: string;
  startDate: string;   // ISO date string
  endDate: string;
  adults: number;
  children: number;
  status: VacationStatus;
  budgetItems: VacationBudgetItem[];
  notes?: string;
  createdAt: number;
}

export interface ChecklistItem {
  id: string;
  label: string;
  category: string;
}

export interface VacationPlannerConfig {
  trips: VacationTrip[];
  tipsChecklist?: Record<string, boolean>;
  customChecklist?: ChecklistItem[];
}

export const VACATION_CATEGORIES: { id: VacationCategory; label: string; emoji: string; hint: string }[] = [
  { id: 'transport', label: 'Di chuyển', emoji: '✈️', hint: 'Vé máy bay, xe khách, xăng, grab, taxi' },
  { id: 'accommodation', label: 'Nơi nghỉ ngơi', emoji: '🏨', hint: 'Khách sạn, homestay, resort, camping' },
  { id: 'food', label: 'Ẩm thực & Đặc sản', emoji: '🍜', hint: 'Ăn sáng, trưa, tối, café, đặc sản' },
  { id: 'activities', label: 'Trải nghiệm & Khám phá', emoji: '🎢', hint: 'Vé tham quan, tour, giải trí' },
  { id: 'gifts', label: 'Quà & Lưu niệm', emoji: '🛍️', hint: 'Quà cho ông bà, bạn bè, đồ lưu niệm' },
  { id: 'misc', label: 'Chuẩn bị & Khác', emoji: '🧳', hint: 'Vali, kem chống nắng, bảo hiểm, tips' },
];

export const VACATION_STATUS_MAP: Record<VacationStatus, { label: string; emoji: string; color: string }> = {
  dreaming: { label: 'Đang mơ ước', emoji: '💭', color: 'text-purple-500 bg-purple-50' },
  planning: { label: 'Đang chuẩn bị', emoji: '📋', color: 'text-blue-500 bg-blue-50' },
  ongoing: { label: 'Đang đi', emoji: '🛫', color: 'text-emerald-500 bg-emerald-50' },
  completed: { label: 'Kỷ niệm đẹp', emoji: '✨', color: 'text-amber-500 bg-amber-50' },
};

export const TRIP_EMOJIS = ['🌴', '🏖️', '🌸', '⛰️', '🏯', '🗼', '🎪', '🌊', '🏕️', '✈️', '🚢', '🎡', '🌺', '🦋', '🌅'];
