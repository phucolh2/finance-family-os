import type { FamilyProfile, IncomeScheduleItem, LifeStage, Assumptions, LifeEvent, InvestmentDeal } from '../types/finance';
import type { BudgetRatio, BudgetRatioScheduleItem, BudgetTreeNode } from '../types/budget';
import type { AssetConfig } from '../types/portfolio';

export const DEFAULT_FAMILY_PROFILE: FamilyProfile = {
  husbandName: 'Gia Khánh',
  wifeName: 'Minh Anh',
  husbandAgeAtStart: 30,
  wifeAgeAtStart: 28,
  planningStartMonth: 10,
  planningStartYear: 2026,
  planningEndMonth: 12,
  planningEndYear: 2060,
  childBirthMonth: 10,
  childBirthYear: 2031,
  currency: 'VND_MILLION',
  startingCapital: 100,
};

export const DEFAULT_INCOME_SCHEDULE: IncomeScheduleItem[] = [
  {
    id: 'inc_start',
    effectiveMonth: 10,
    effectiveYear: 2026,
    incomeMonthly: 80, // 80 triệu VND starting
    note: 'Lương khởi điểm hai vợ chồng',
  },
  {
    id: 'inc_promotion_2030',
    effectiveMonth: 1,
    effectiveYear: 2030,
    incomeMonthly: 120, // tăng lên 120 triệu VND
    note: 'Thăng chức trưởng phòng, thu nhập tăng vọt',
  },
  {
    id: 'inc_business_2040',
    effectiveMonth: 1,
    effectiveYear: 2040,
    incomeMonthly: 180, // kinh doanh thêm, thu nhập lên 180 triệu VND
    note: 'Mở cửa hàng kinh doanh gia đình ổn định',
  },
  {
    id: 'inc_retirement_2050',
    effectiveMonth: 1,
    effectiveYear: 2050,
    incomeMonthly: 25, // nghỉ hưu, thu nhập tư vấn phụ thêm
    note: 'Nghỉ hưu sớm, chuyển sang tư vấn bán thời gian',
  },
];

export const DEFAULT_BUDGET_RATIOS: BudgetRatio[] = [
  {
    categoryId: 'housing-basic',
    categoryName: 'Nhà cửa & sinh hoạt cơ bản',
    group: 'housing_basic',
    ratioPercent: 30,
    ruleType: 'percent',
    isActive: true,
  },
  {
    categoryId: 'future-investing',
    categoryName: 'Tương lai & đầu tư',
    group: 'future_investing',
    ratioPercent: 40,
    ruleType: 'percent',
    isActive: true,
  },
  {
    categoryId: 'safety-reserve',
    categoryName: 'Bình an & dự phòng',
    group: 'safety_reserve',
    ratioPercent: 10,
    ruleType: 'percent',
    capTotal: 700, // 700M cap
    isActive: true,
  },
  {
    categoryId: 'family-experience',
    categoryName: 'Gia đình & trải nghiệm',
    group: 'family_experience',
    ratioPercent: 10,
    ruleType: 'percent',
    isActive: true,
  },
  {
    categoryId: 'health-growth',
    categoryName: 'Sức khỏe & phát triển',
    group: 'health_growth',
    ratioPercent: 10,
    ruleType: 'percent',
    isActive: true,
  },
];

export const DEFAULT_BUDGET_TREE: BudgetTreeNode[] = [
  {
    id: 'group_housing_basic',
    parentId: null,
    level: 0,
    nodeType: 'group',
    groupId: 'housing_basic',
    name: 'Nhà cửa & sinh hoạt cơ bản',
    ratioPercent: 30,
    isActive: true,
    sortOrder: 1,
    children: [
      { id: 'item_rent', parentId: 'group_housing_basic', level: 1, nodeType: 'item', groupId: 'housing_basic', name: 'Nhà ở / thuê nhà', ratioPercent: 13, isActive: true, sortOrder: 1 },
      { id: 'item_food', parentId: 'group_housing_basic', level: 1, nodeType: 'item', groupId: 'housing_basic', name: 'Ăn uống gia đình', ratioPercent: 10, isActive: true, sortOrder: 2 },
      { id: 'item_transport', parentId: 'group_housing_basic', level: 1, nodeType: 'item', groupId: 'housing_basic', name: 'Di chuyển', ratioPercent: 2, isActive: true, sortOrder: 3 },
      { id: 'item_telecom', parentId: 'group_housing_basic', level: 1, nodeType: 'item', groupId: 'housing_basic', name: 'Điện thoại + wifi', ratioPercent: 1, isActive: true, sortOrder: 4 },
      { id: 'item_flexible', parentId: 'group_housing_basic', level: 1, nodeType: 'item', groupId: 'housing_basic', name: 'Chi linh hoạt khác', ratioPercent: 4, isActive: true, sortOrder: 5 },
    ]
  },
  {
    id: 'group_future_investing',
    parentId: null,
    level: 0,
    nodeType: 'group',
    groupId: 'future_investing',
    name: 'Tương lai & đầu tư',
    ratioPercent: 40,
    isActive: true,
    sortOrder: 2,
    children: [
      { id: 'item_liquidity', parentId: 'group_future_investing', level: 1, nodeType: 'item', groupId: 'future_investing', name: 'Quỹ thanh khoản', ratioPercent: 5, isActive: true, sortOrder: 1 },
      { id: 'item_medical_fund', parentId: 'group_future_investing', level: 1, nodeType: 'item', groupId: 'future_investing', name: 'Quỹ y tế', ratioPercent: 5, isActive: true, sortOrder: 2 },
      { id: 'item_debt_optim', parentId: 'group_future_investing', level: 1, nodeType: 'item', groupId: 'future_investing', name: 'Tránh / tối ưu nợ', ratioPercent: 0, isActive: true, sortOrder: 3 },
      { id: 'item_growth_assets', parentId: 'group_future_investing', level: 1, nodeType: 'item', groupId: 'future_investing', name: 'Chứng khoán / crypto / tài sản tăng trưởng', ratioPercent: 30, isActive: true, sortOrder: 4 },
    ]
  },
  {
    id: 'group_safety_reserve',
    parentId: null,
    level: 0,
    nodeType: 'group',
    groupId: 'safety_reserve',
    name: 'Bình an & dự phòng',
    ratioPercent: 10,
    isActive: true,
    sortOrder: 3,
    children: [
      { id: 'item_parents_support', parentId: 'group_safety_reserve', level: 1, nodeType: 'item', groupId: 'safety_reserve', name: 'Cha mẹ hàng tháng', ratioPercent: 5, isActive: true, sortOrder: 1 },
      { id: 'item_emergency', parentId: 'group_safety_reserve', level: 1, nodeType: 'item', groupId: 'safety_reserve', name: 'Khẩn cấp', ratioPercent: 5, isActive: true, sortOrder: 2 },
      { id: 'item_special_reserve', parentId: 'group_safety_reserve', level: 1, nodeType: 'item', groupId: 'safety_reserve', name: 'Dự đặc biệt', ratioPercent: 0, isActive: true, sortOrder: 3 },
    ]
  },
  {
    id: 'group_family_experience',
    parentId: null,
    level: 0,
    nodeType: 'group',
    groupId: 'family_experience',
    name: 'Yêu thương & sự kiện',
    ratioPercent: 10,
    isActive: true,
    sortOrder: 4,
    children: [
      { id: 'item_dating', parentId: 'group_family_experience', level: 1, nodeType: 'item', groupId: 'family_experience', name: 'Hẹn hò / trải nghiệm', ratioPercent: 4, isActive: true, sortOrder: 1 },
      { id: 'item_clothing', parentId: 'group_family_experience', level: 1, nodeType: 'item', groupId: 'family_experience', name: 'Khăn / cặp', ratioPercent: 1, isActive: true, sortOrder: 2 },
      { id: 'item_gifts', parentId: 'group_family_experience', level: 1, nodeType: 'item', groupId: 'family_experience', name: 'Quà tặng / kỷ niệm', ratioPercent: 5, isActive: true, sortOrder: 3 },
    ]
  },
  {
    id: 'group_health_growth',
    parentId: null,
    level: 0,
    nodeType: 'group',
    groupId: 'health_growth',
    name: 'Sức khỏe & phát triển',
    ratioPercent: 10,
    isActive: true,
    sortOrder: 5,
    children: [
      { id: 'item_sports', parentId: 'group_health_growth', level: 1, nodeType: 'item', groupId: 'health_growth', name: 'Thể thao & sức khỏe', ratioPercent: 4, isActive: true, sortOrder: 1 },
      { id: 'item_self_care', parentId: 'group_health_growth', level: 1, nodeType: 'item', groupId: 'health_growth', name: 'Chăm sóc bản thân', ratioPercent: 3, isActive: true, sortOrder: 2 },
      { id: 'item_education_growth', parentId: 'group_health_growth', level: 1, nodeType: 'item', groupId: 'health_growth', name: 'Học tập', ratioPercent: 3, isActive: true, sortOrder: 3 },
    ]
  },
];

export const DEFAULT_BUDGET_SCHEDULE: BudgetRatioScheduleItem[] = [
  {
    id: 'budget_start',
    effectiveMonth: 10,
    effectiveYear: 2026,
    note: 'Tỷ lệ phân bổ khởi điểm',
    rootGroups: DEFAULT_BUDGET_TREE,
    ratios: DEFAULT_BUDGET_RATIOS,
  },
];

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  generalInflationRateAnnual: 4, // 4% CPI
  educationInflationRateAnnual: 6, // 6% education
  medicalInflationRateAnnual: 6, // 6% medical
  investmentYieldExpectationAnnual: 8, // 8% expected yield
  savingsInterestRateAnnual: 4, // 4% interest
};

export const DEFAULT_LIFE_STAGES: LifeStage[] = [
  {
    id: 'stage_1',
    name: 'Giai đoạn 1: Vợ chồng son (2026 - 2030)',
    fromYear: 2026,
    toYear: 2030,
    incomeMonthly: 80,
    parentsMonthly: 10,
    hasChild: false,
    childLifestyle: 'premium',
    childBudgetCapMonthly: 35,
    notes: 'Hai vợ chồng son tích lũy, sắm sửa ô tô gia đình.',
  },
  {
    id: 'stage_2',
    name: 'Giai đoạn 2: Đón con đầu lòng (2031 - 2036)',
    fromYear: 2031,
    toYear: 2036,
    incomeMonthly: 120,
    parentsMonthly: 10,
    hasChild: true,
    childLifestyle: 'premium',
    childBudgetCapMonthly: 35,
    notes: 'Bé chào đời năm 2031, gia đình mua nhà chung cư rộng rãi.',
  },
  {
    id: 'stage_3',
    name: 'Giai đoạn 3: Con đi học phổ thông (2037 - 2049)',
    fromYear: 2037,
    toYear: 2049,
    incomeMonthly: 180,
    parentsMonthly: 10,
    hasChild: true,
    childLifestyle: 'premium',
    childBudgetCapMonthly: 35,
    notes: 'Con đi học trường tốt và tích lũy học phí đại học.',
  },
  {
    id: 'stage_4',
    name: 'Giai đoạn 4: Nghỉ hưu sớm & FIRE (2050 - 2060)',
    fromYear: 2050,
    toYear: 2060,
    incomeMonthly: 25,
    parentsMonthly: 0,
    hasChild: true,
    childLifestyle: 'premium',
    childBudgetCapMonthly: 35,
    notes: 'Hai vợ chồng an nhàn nghỉ hưu sớm, con cái tự lập.',
  },
];

export const DEFAULT_ASSETS: AssetConfig[] = [
  {
    id: 'asset_usd',
    type: 'fx_reserve_usd',
    name: 'Dự trữ ngoại hối (USD)',
    beginningBalance: 15,
    targetAllocationPercent: 20,
    expectedReturnRateAnnual: 3,
    investmentYear: 2026,
    notes: 'Tài sản phòng vệ ngoại tệ ổn định',
  },
  {
    id: 'asset_gold',
    type: 'gold',
    name: 'Vàng',
    beginningBalance: 5,
    targetAllocationPercent: 10,
    expectedReturnRateAnnual: 6,
    investmentYear: 2026,
    notes: 'Tài sản phòng thủ truyền thống chống lạm phát',
  },
  {
    id: 'asset_property',
    type: 'real_estate',
    name: 'Bất Động Sản',
    beginningBalance: 40,
    targetAllocationPercent: 35,
    expectedReturnRateAnnual: 8,
    investmentYear: 2026,
    notes: 'Tài sản nhà đất tích lũy giá trị dài hạn',
  },
  {
    id: 'asset_stocks',
    type: 'stocks',
    name: 'Chứng Khoán',
    beginningBalance: 35,
    targetAllocationPercent: 25,
    expectedReturnRateAnnual: 10,
    investmentYear: 2026,
    notes: 'Động cơ chính tạo lãi kép tăng trưởng mạnh mẽ',
  },
  {
    id: 'asset_crypto',
    type: 'crypto',
    name: 'Crypto',
    beginningBalance: 5,
    targetAllocationPercent: 10,
    expectedReturnRateAnnual: 15,
    investmentYear: 2026,
    notes: 'Tài sản số rủi ro cao tìm kiếm bứt phá lợi suất',
  },
];

export const DEFAULT_LIFE_EVENTS: LifeEvent[] = [
  {
    id: 'event_car',
    month: 12,
    year: 2027,
    name: 'Mua xe ô tô gia đình',
    type: 'buy_car',
    amount: -800, // 800 triệu VND
    source: 'saving',
    recurringMonthlyImpact: -4, // -4 triệu VND/tháng cho xăng xe, gửi xe, bảo dưỡng
    affectsNetWorth: true,
    note: 'Mua ô tô che mưa che nắng phục vụ đi lại gia đình',
  },
  {
    id: 'event_baby_one_time',
    month: 10,
    year: 2031,
    name: 'Chi phí sinh em bé & sắm đồ sơ sinh',
    type: 'child_birth',
    amount: -150, // 150 triệu VND một lần
    source: 'saving',
    affectsNetWorth: true,
    note: 'Chi phí chuẩn bị sinh con đầu lòng',
  },
  {
    id: 'event_house_downpayment',
    month: 6,
    year: 2035,
    name: 'Trả trước mua chung cư 3 phòng ngủ',
    type: 'buy_property',
    amount: -1500, // 1.5 tỷ VND rút từ quỹ Chứng Khoán
    source: 'investment',
    affectsNetWorth: false, // chuyển dịch từ Chứng Khoán sang Bất Động Sản tự sở hữu
    note: 'Trị giá căn nhà 3.5 tỷ VND, vay ngân hàng 2 tỷ VND',
  },
  {
    id: 'event_house_mortgage',
    month: 7,
    year: 2035,
    name: 'Nghĩa vụ trả nợ vay mua nhà',
    type: 'other',
    amount: 0,
    source: 'saving',
    recurringMonthlyImpact: -20, // -20 triệu VND/tháng trả nợ vay ngân hàng trong 10 năm
    affectsNetWorth: true,
    note: 'Gói vay trả góp mua nhà ngân hàng, thời hạn 10 năm',
  },
  {
    id: 'event_college_one_time',
    month: 9,
    year: 2049,
    name: 'Chi phí học đại học của con',
    type: 'other',
    amount: -300, // 300 triệu VND một lần
    source: 'saving',
    affectsNetWorth: true,
    note: 'Học phí đại học năm nhất và sắm sửa máy móc đi học',
  },
];

export const DEFAULT_INVESTMENT_DEALS: InvestmentDeal[] = [
  {
    id: 'deal_vix_sample',
    assetType: 'stocks',
    name: 'Cổ phiếu VIX (Sample)',
    capital: 50,
    startMonth: 10,
    startYear: 2026,
    status: 'active',
    notes: 'Thương vụ mua cổ phiếu VIX ban đầu của hai vợ chồng',
  },
];
