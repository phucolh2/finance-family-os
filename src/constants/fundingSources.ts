export type FundingSourceId = 'unallocated' | 'saving' | 'debt_reserve' | 'investment' | 'expense_surplus';

export interface FundingSourceDef {
  id: FundingSourceId;
  label: string;
  shortLabel: string;
  description: string;
}

export const FUNDING_SOURCES: Record<FundingSourceId, FundingSourceDef> = {
  unallocated: {
    id: 'unallocated',
    label: 'Ngân sách Dòng tiền (Chưa phân bổ)',
    shortLabel: 'Tiền chưa phân bổ',
    description: 'Dòng tiền tự do còn lại sau khi đã phân bổ các quỹ theo ngân sách.'
  },
  saving: {
    id: 'saving',
    label: 'Số dư Quỹ Tiết Kiệm & Dự phòng',
    shortLabel: 'Quỹ Tiết Kiệm',
    description: 'Số dư tích luỹ từ ngân sách Tiết kiệm.'
  },
  debt_reserve: {
    id: 'debt_reserve',
    label: 'Ngân sách Dự phòng',
    shortLabel: 'Ngân sách Dự phòng',
    description: 'Ngân sách Dự phòng trích hàng tháng.'
  },
  investment: {
    id: 'investment',
    label: 'Ngân sách Đầu tư (Chưa có kế hoạch)',
    shortLabel: 'Ngân sách Đầu tư',
    description: 'Ngân sách đầu tư tích luỹ nhàn rỗi.'
  },
  expense_surplus: {
    id: 'expense_surplus',
    label: 'Quỹ sinh hoạt dư (Lifestyle)',
    shortLabel: 'Quỹ sinh hoạt dư',
    description: 'Khoản tiền dư ra từ ngân sách chi tiêu sinh hoạt hàng tháng.'
  }
};

export const SCREEN_FUNDING_CONSTRAINTS = {
  portfolio: ['investment'] as FundingSourceId[],
  savings_deposit: ['saving', 'unallocated'] as FundingSourceId[],
  debt_prep: ['debt_reserve', 'saving'] as FundingSourceId[],
  lifestyle: ['expense_surplus'] as FundingSourceId[]
};
