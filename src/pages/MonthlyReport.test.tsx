import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MonthlyReport } from './MonthlyReport';
import { useAppContext } from '../context/AppContext';
import { DEFAULT_FAMILY_PROFILE, DEFAULT_ASSUMPTIONS } from '../data/defaultInputs';

// Mock AppContext
vi.mock('../context/AppContext', () => ({
  useAppContext: vi.fn(),
}));

describe('MonthlyReport Component', () => {
  const setSelectedPeriodKeyMock = vi.fn();
  const isPeriodLockedMock = vi.fn().mockReturnValue(false);

  const mockState = {
    profile: { ...DEFAULT_FAMILY_PROFILE, lockedUntilPeriod: undefined },
    assumptions: DEFAULT_ASSUMPTIONS,
    incomeSchedule: [
      {
        id: 'inc-1',
        name: 'Lương vợ chồng',
        startMonth: 1,
        startYear: 2026,
        amount: 85,
        growthRateAnnual: 5,
      },
    ],
    budgetSchedule: [
      {
        id: 'b-1',
        effectiveMonth: 1,
        effectiveYear: 2026,
        rootGroups: [],
      },
    ],
    lifeEvents: [],
    assets: [],
    investmentDeals: [],
    savingsDeposits: [],
    sinkingFunds: [
      {
        id: 'sf-1',
        name: 'Quỹ Học Phí Con',
        targetAmount: 50,
        monthlyContribution: 5,
        currentBalance: 20,
        status: 'active',
        priority: 'high',
        category: 'education',
        sourceOfFund: 'expense_surplus_family',
      },
    ],
    fundTransfers: [],
    debts: [],
    expenseSchedule: [],
    lifeStages: [],
    projectionAdjustments: [],
    resolvedMonthlyDb: [
      {
        periodKey: '2026-10',
        month: 10,
        year: 2026,
        income: 85,
        expectedReturnAnnual: 8,
        budgetRatios: { expense: 0.5, investment: 0.25, saving: 0.15, debt_reserve: 0.1 },
        budgetAmounts: { expense: 42.5, investment: 21.25, saving: 12.75, debt_reserve: 8.5 },
        totalActualExpenseMonthly: 38,
        actualExpenseCategories: {
          'Nhà cửa & Sinh hoạt': 18,
          'Ăn uống': 12,
          'Con cái': 8,
        },
      },
    ],
    resolvedMonthlyDbMap: {
      '2026-10': {
        periodKey: '2026-10',
        month: 10,
        year: 2026,
        income: 85,
        expectedReturnAnnual: 8,
        budgetRatios: { expense: 0.5, investment: 0.25, saving: 0.15, debt_reserve: 0.1 },
        budgetAmounts: { expense: 42.5, investment: 21.25, saving: 12.75, debt_reserve: 8.5 },
        totalActualExpenseMonthly: 38,
        actualExpenseCategories: {
          'Nhà cửa & Sinh hoạt': 18,
          'Ăn uống': 12,
          'Con cái': 8,
        },
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAppContext as any).mockReturnValue({
      state: mockState,
      selectedPeriodKey: '2026-10',
      setSelectedPeriodKey: setSelectedPeriodKeyMock,
      isPeriodLocked: isPeriodLockedMock,
    });
  });

  it('renders the monthly report header and core title', () => {
    render(<MonthlyReport />);
    expect(screen.getByText(/Báo Cáo Tài Chính Hàng Tháng/i)).toBeInTheDocument();
    expect(screen.getByText(/Kỳ: Tháng 10\/2026/i)).toBeInTheDocument();
  });

  it('renders 5 executive KPI cards', () => {
    render(<MonthlyReport />);
    expect(screen.getByText('Tổng Thu Nhập')).toBeInTheDocument();
    expect(screen.getByText('Chi Tiêu Thực Tế')).toBeInTheDocument();
    expect(screen.getByText('Thặng Dư Ròng')).toBeInTheDocument();
    expect(screen.getByText('Tỷ Lệ Tích Lũy')).toBeInTheDocument();
    expect(screen.getByText('Tài Sản Ròng')).toBeInTheDocument();
  });

  it('renders the 4 Pillars section and classifications', () => {
    render(<MonthlyReport />);
    expect(screen.getByText(/Hiệu Suất 4 Trụ Cột Ngân Sách/i)).toBeInTheDocument();
    expect(screen.getByText(/1\. Chi Tiêu Sinh Hoạt/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Đầu Tư Tăng Trưởng/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. Tiết Kiệm & Tích Lũy/i)).toBeInTheDocument();
    expect(screen.getByText(/4\. Dự Phòng & Trả Nợ/i)).toBeInTheDocument();
  });

  it('renders top expense categories and sinking funds progress', () => {
    render(<MonthlyReport />);
    expect(screen.getByText(/Top 5 Hạng Mục Chi Tiêu Lớn Nhất/i)).toBeInTheDocument();
    expect(screen.getByText('Nhà cửa & Sinh hoạt')).toBeInTheDocument();
    expect(screen.getByText('Ăn uống')).toBeInTheDocument();
    expect(screen.getByText(/Tiến Độ Quỹ Mục Tiêu/i)).toBeInTheDocument();
    expect(screen.getByText('Quỹ Học Phí Con')).toBeInTheDocument();
  });

  it('handles month navigation buttons', () => {
    render(<MonthlyReport />);
    const prevBtn = screen.getByTitle('Tháng trước');
    fireEvent.click(prevBtn);
    expect(setSelectedPeriodKeyMock).toHaveBeenCalledWith('2026-09');

    const nextBtn = screen.getByTitle('Tháng sau');
    fireEvent.click(nextBtn);
    expect(setSelectedPeriodKeyMock).toHaveBeenCalledWith('2026-11');
  });

  it('handles print button click', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<MonthlyReport />);
    const printBtn = screen.getByTitle('In hoặc Lưu PDF báo cáo');
    fireEvent.click(printBtn);
    expect(printSpy).toHaveBeenCalledTimes(1);
    printSpy.mockRestore();
  });
});
