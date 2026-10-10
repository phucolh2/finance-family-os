import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BudgetHistory } from './BudgetHistory';
import { useAppContext } from '../context/AppContext';
import { DEFAULT_BUDGET_SCHEDULE, DEFAULT_FAMILY_PROFILE, DEFAULT_ASSETS, DEFAULT_ASSUMPTIONS } from '../data/defaultInputs';

// Mock dependencies
vi.mock('../context/AppContext', () => ({
  useAppContext: vi.fn(),
}));

// Mock ObservationControls if needed
vi.mock('../components/ui/ObservationControls', () => ({
  ObservationControls: () => <div data-testid="observation-controls" />,
}));

const mockAddBudgetScheduleItem = vi.fn();
const mockUpdateBudgetScheduleItem = vi.fn();
const mockDeleteBudgetScheduleItem = vi.fn();

const baseState = {
  profile: DEFAULT_FAMILY_PROFILE,
  assets: DEFAULT_ASSETS,
  assumptions: DEFAULT_ASSUMPTIONS,
  budgetSchedule: DEFAULT_BUDGET_SCHEDULE,
  incomeSchedule: [],
  lifeStages: [],
  lifeEvents: [],
  investmentDeals: [],
  savingsDeposits: [],
  sinkingFunds: [],
  debts: [],
  fundTransfers: [],
  expenseSchedule: [],
  resolvedMonthlyDb: [
    {
      periodKey: '2026-10',
      month: 10,
      year: 2026,
      income: 80,
      expense: 50,
      savings: 10,
      investment: 20,
    }
  ],
  resolvedMonthlyDbMap: {
    '2026-10': {
      periodKey: '2026-10',
      month: 10,
      year: 2026,
      income: 80,
      expense: 50,
      savings: 10,
      investment: 20,
    }
  }
};

describe('BudgetHistory Page', () => {
  it('renders without crashing on default charts tab', () => {
    (useAppContext as any).mockReturnValue({
      state: baseState,
      addBudgetScheduleItem: mockAddBudgetScheduleItem,
      updateBudgetScheduleItem: mockUpdateBudgetScheduleItem,
      deleteBudgetScheduleItem: mockDeleteBudgetScheduleItem,
      selectedPeriodKey: '2026-10',
    });

    render(<BudgetHistory />);
    expect(screen.getByText('Phân Bổ Ngân Sách')).toBeInTheDocument();
  });

  it('switches to editor tab when clicking "2. Biên tập Cây tỷ lệ"', () => {
    (useAppContext as any).mockReturnValue({
      state: baseState,
      addBudgetScheduleItem: mockAddBudgetScheduleItem,
      updateBudgetScheduleItem: mockUpdateBudgetScheduleItem,
      deleteBudgetScheduleItem: mockDeleteBudgetScheduleItem,
      selectedPeriodKey: '2026-10',
    });

    render(<BudgetHistory />);
    const editorTabBtn = screen.getByText(/2. Biên tập Cây tỷ lệ/i);
    fireEvent.click(editorTabBtn);

    expect(screen.getByText(/Nhập theo/i)).toBeInTheDocument();
  });

  it('handles clicking toggle between percent and amount mode', () => {
    (useAppContext as any).mockReturnValue({
      state: baseState,
      addBudgetScheduleItem: mockAddBudgetScheduleItem,
      updateBudgetScheduleItem: mockUpdateBudgetScheduleItem,
      deleteBudgetScheduleItem: mockDeleteBudgetScheduleItem,
      selectedPeriodKey: '2026-10',
    });

    render(<BudgetHistory />);
    // Switch to editor tab
    fireEvent.click(screen.getByText(/2. Biên tập Cây tỷ lệ/i));

    // Click "Số tiền (triệu)"
    const amountModeBtn = screen.getByRole('button', { name: /^Số tiền \(triệu\)$/i });
    fireEvent.click(amountModeBtn);

    // Click back to "Tỷ lệ (%)"
    const percentModeBtn = screen.getByRole('button', { name: /^Tỷ lệ \(%\)$/i });
    fireEvent.click(percentModeBtn);
  });

  it('handles empty budgetSchedule without crashing', () => {
    (useAppContext as any).mockReturnValue({
      state: {
        ...baseState,
        budgetSchedule: [],
      },
      addBudgetScheduleItem: mockAddBudgetScheduleItem,
      updateBudgetScheduleItem: mockUpdateBudgetScheduleItem,
      deleteBudgetScheduleItem: mockDeleteBudgetScheduleItem,
      selectedPeriodKey: undefined,
    });

    expect(() => render(<BudgetHistory />)).not.toThrow();
  });

  it('handles undefined selectedPeriodKey without crashing', () => {
    (useAppContext as any).mockReturnValue({
      state: baseState,
      addBudgetScheduleItem: mockAddBudgetScheduleItem,
      updateBudgetScheduleItem: mockUpdateBudgetScheduleItem,
      deleteBudgetScheduleItem: mockDeleteBudgetScheduleItem,
      selectedPeriodKey: undefined,
    });

    render(<BudgetHistory />);
    expect(screen.getByText('Phân Bổ Ngân Sách')).toBeInTheDocument();
  });

  it('handles clicking AI Advisor button', () => {
    (useAppContext as any).mockReturnValue({
      state: baseState,
      addBudgetScheduleItem: mockAddBudgetScheduleItem,
      updateBudgetScheduleItem: mockUpdateBudgetScheduleItem,
      deleteBudgetScheduleItem: mockDeleteBudgetScheduleItem,
      selectedPeriodKey: '2026-10',
    });

    render(<BudgetHistory />);
    fireEvent.click(screen.getByText(/2. Biên tập Cây tỷ lệ/i));

    const aiBtn = screen.getByText(/AI Gợi Ý Phân Bổ/i);
    fireEvent.click(aiBtn);
  });

  it('handles adding a new root group without crashing', () => {
    (useAppContext as any).mockReturnValue({
      state: baseState,
      addBudgetScheduleItem: mockAddBudgetScheduleItem,
      updateBudgetScheduleItem: mockUpdateBudgetScheduleItem,
      deleteBudgetScheduleItem: mockDeleteBudgetScheduleItem,
      selectedPeriodKey: '2026-10',
    });

    render(<BudgetHistory />);
    fireEvent.click(screen.getByText(/2. Biên tập Cây tỷ lệ/i));

    const addGroupBtn = screen.getByText(/Tạo nhóm phân bổ mới/i);
    fireEvent.click(addGroupBtn);

    expect(screen.getByText(/^Nhóm phân bổ mới$/i)).toBeInTheDocument();
  });

  it('handles legacy or unknown classifications gracefully without crashing', () => {
    const legacyState = {
      ...baseState,
      budgetSchedule: [
        {
          id: 'b_legacy',
          effectiveMonth: 10,
          effectiveYear: 2026,
          rootGroups: [
            {
              id: 'g_legacy',
              name: 'Nhóm cũ',
              ratioPercent: 100,
              isActive: true,
              sortOrder: 1,
              classification: 'saving', // legacy singular
              children: [
                {
                  id: 'item_legacy',
                  parentId: 'g_legacy',
                  name: 'Mục cũ',
                  ratioPercent: 100,
                  isActive: true,
                  classification: 'unknown_type' as any,
                }
              ]
            }
          ]
        }
      ]
    };

    (useAppContext as any).mockReturnValue({
      state: legacyState,
      addBudgetScheduleItem: mockAddBudgetScheduleItem,
      updateBudgetScheduleItem: mockUpdateBudgetScheduleItem,
      deleteBudgetScheduleItem: mockDeleteBudgetScheduleItem,
      selectedPeriodKey: '2026-10',
    });

    expect(() => render(<BudgetHistory />)).not.toThrow();

    // Switch to editor
    fireEvent.click(screen.getByText(/2. Biên tập Cây tỷ lệ/i));
    expect(screen.getByText(/Nhóm cũ/i)).toBeInTheDocument();
  });
});
