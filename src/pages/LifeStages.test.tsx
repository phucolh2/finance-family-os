import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LifeStages } from './LifeStages';
import { useAppContext } from '../context/AppContext';
import { DEFAULT_BUDGET_SCHEDULE, DEFAULT_LIFE_STAGES, DEFAULT_FAMILY_PROFILE, DEFAULT_ASSETS, DEFAULT_ASSUMPTIONS } from '../data/defaultInputs';

// Mock the dependencies
vi.mock('../context/AppContext', () => ({
  useAppContext: vi.fn(),
}));

vi.mock('../hooks/useLiquidityBreakdown', () => ({
  useLiquidityBreakdown: () => ({
    liquidityBreakdownData: [],
    totalBudgetSum: 0,
    totalActualSum: 0,
    totalDeductedSum: 0,
    totalFlexibleSum: 0,
    totalRemainingSum: 0,
    selectedPeriodKey: '2027-04'
  }),
}));

const mockAddLifeEvent = vi.fn();
const mockUpdateLifeEvent = vi.fn();
const mockDeleteLifeEvent = vi.fn();

const baseState = {
  profile: DEFAULT_FAMILY_PROFILE,
  assets: DEFAULT_ASSETS,
  assumptions: DEFAULT_ASSUMPTIONS,
  lifeEvents: [
    {
      id: 'test-event-1',
      name: 'Test Event 1',
      year: 2027,
      month: 3, // April (0-indexed)
      type: 'event',
      amount: -10,
      spendingCategory: 'housing/rent',
      recurringMonthlyImpact: -1,
      recurringDurationMonths: 12,
      recurringFundingSource: 'living',
    }
  ],
  sinkingFunds: [],
  budgetSchedule: DEFAULT_BUDGET_SCHEDULE,
  expenseSchedule: [],
  lifeStages: DEFAULT_LIFE_STAGES,
  incomeSchedules: [],
  incomeSchedule: [],
  resolvedMonthlyDb: [
    {
      periodKey: '2027-04',
      budgetAmounts: { housing: 8, living: 16 },
      actualExpenseByGroup: { housing: 8, living: 16 },
      _monthlyActual: { housing: 8, living: 16 },
      _groupBalances: { housing: 0, living: 0 },
    }
  ]
};

describe('LifeStages Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAppContext as any).mockReturnValue({
      state: baseState,
      addLifeEvent: mockAddLifeEvent,
      updateLifeEvent: mockUpdateLifeEvent,
      deleteLifeEvent: mockDeleteLifeEvent,
      selectedPeriodKey: '2027-04'
    });
  });

  it('renders without crashing', () => {
    render(<LifeStages />);
    expect(screen.getByText(/Quản lý Chi tiêu/i)).toBeInTheDocument();
  });

  it('opens add event modal when clicking "Thêm khoản chi linh hoạt"', () => {
    render(<LifeStages />);
    
    // Switch to timeline tab
    const timelineTab = screen.getByText('Chi tiêu linh hoạt');
    fireEvent.click(timelineTab);

    const addButton = screen.getByText('Thêm khoản chi linh hoạt');
    fireEvent.click(addButton);
    
    expect(screen.getByText('Tên khoản chi / sự kiện')).toBeInTheDocument();
  });

  it('allows clicking the edit button on an existing event', () => {
    render(<LifeStages />);
    
    // Switch to timeline tab
    const timelineTab = screen.getByText('Chi tiêu linh hoạt');
    fireEvent.click(timelineTab);
    
    // We expect the event name to be rendered
    expect(screen.getByText('Test Event 1')).toBeInTheDocument();
    
    // Click the edit button. Since we use Lucide Edit3, the button might have title "Chỉnh sửa" or just be the only primary action button.
    // Let's find it by aria-label or just assume it's in the document.
    // In LifeStages.tsx: `<button onClick={() => { ... setEditingId(event.id); }} ... title="Chỉnh sửa"`
    const editButton = screen.getByTitle('Chỉnh sửa');
    fireEvent.click(editButton);
    
    // The form should appear with "Lưu khoản chi" button
    expect(screen.getByText('Lưu khoản chi')).toBeInTheDocument();
  });
  
});
