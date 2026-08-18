import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Portfolio } from './Portfolio';
import { useAppContext } from '../context/AppContext';
import { DEFAULT_ASSETS, DEFAULT_ASSUMPTIONS, DEFAULT_FAMILY_PROFILE } from '../data/defaultInputs';

// Mock dependencies
vi.mock('../context/AppContext', () => ({
  useAppContext: vi.fn(),
}));

vi.mock('../hooks/useLiquidityBreakdown', () => ({
  useLiquidityBreakdown: () => ({
    selectedPeriodKey: '2026-10',
    liquidityBreakdownData: [],
    totalBudgetSum: 0,
    totalActualSum: 0,
    totalDeductedSum: 0,
    totalFlexibleSum: 0,
    totalRemainingSum: 0,
  }),
}));

vi.mock('recharts', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    PieChart: () => <div data-testid="pie-chart" />,
    Pie: () => <div />,
    Cell: () => <div />,
    Tooltip: () => <div />,
    Legend: () => <div />,
    RadarChart: () => <div data-testid="radar-chart" />,
    PolarGrid: () => <div />,
    PolarAngleAxis: () => <div />,
    PolarRadiusAxis: () => <div />,
    Radar: () => <div />,
    BarChart: () => <div data-testid="bar-chart" />,
    Bar: () => <div />,
    XAxis: () => <div />,
    YAxis: () => <div />,
    CartesianGrid: () => <div />,
    LabelList: () => <div />,
    ReferenceLine: () => <div />,
  };
});

// Avoid scrollTo issues in jsdom
window.scrollTo = vi.fn();

describe('Portfolio Component', () => {
  const mockUpdateAppState = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAppContext as any).mockReturnValue({
      state: {
        profile: DEFAULT_FAMILY_PROFILE,
        assets: DEFAULT_ASSETS,
        assumptions: DEFAULT_ASSUMPTIONS,
        investmentDeals: [],
        sinkingFunds: [],
      },
      updateAppState: mockUpdateAppState,
      projection: {
        monthlyRows: [
          {
            period: { month: 10, year: 2026, key: '2026-10' },
            portfolio: { totalEndingBalance: 1000 },
          }
        ]
      }
    });
  });

  it('renders the title correctly', () => {
    render(<Portfolio />);
    expect(screen.getByText(/Quản lý Thương vụ đầu tư chi tiết/i)).toBeInTheDocument();
  });

  it('opens add deal form when clicking Thêm thương vụ', () => {
    render(<Portfolio />);
    
    expect(screen.queryByText('Tên thương vụ')).not.toBeInTheDocument();
    
    const addButton = screen.getByRole('button', { name: /Thêm thương vụ/i });
    fireEvent.click(addButton);
    
    expect(screen.getByText('Tên thương vụ')).toBeInTheDocument();
    expect(screen.getAllByText('Lớp tài sản').length).toBeGreaterThan(0);
  });

  it('shows quantity and purchase price for non-real-estate assets and auto-calculates capital', () => {
    render(<Portfolio />);
    
    const addButton = screen.getByRole('button', { name: /Thêm thương vụ/i });
    fireEvent.click(addButton);
    
    // Default asset type is 'stocks', so it should show these fields
    expect(screen.getByText('Số lượng (Cổ phiếu)')).toBeInTheDocument();
    expect(screen.getByText('Đơn giá mua (VND)')).toBeInTheDocument();
    
    const quantityInput = screen.getByPlaceholderText('VD: 1000');
    const priceInput = screen.getByPlaceholderText('VD: 25000');
    const capitalInput = screen.getAllByPlaceholderText('VD: 500')[1]; // Second one is Vốn đầu tư

    // Input quantity and price
    fireEvent.change(quantityInput, { target: { value: '1000' } });
    fireEvent.change(priceInput, { target: { value: '15000' } });

    // Capital should be calculated as (1000 * 15000) / 1000000 = 15
    expect(capitalInput).toHaveValue(15);
    expect(capitalInput).toHaveAttribute('readonly');
  });
  
  it('hides quantity and purchase price for real estate', () => {
    render(<Portfolio />);
    
    const addButton = screen.getByRole('button', { name: /Thêm thương vụ/i });
    fireEvent.click(addButton);
    
    const assetSelect = screen.getAllByRole('combobox').find(el => (el as HTMLSelectElement).value === 'stocks');
    expect(assetSelect).toBeDefined();
    
    if (assetSelect) {
      fireEvent.change(assetSelect, { target: { value: 'real_estate' } });
    }
    
    expect(screen.queryByText(/Số lượng/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Đơn giá mua (VND)')).not.toBeInTheDocument();
    
    const capitalInput = screen.getAllByPlaceholderText('VD: 500')[1];
    expect(capitalInput).not.toHaveAttribute('readonly');
  });
});
