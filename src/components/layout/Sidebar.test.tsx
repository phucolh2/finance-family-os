import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Sidebar } from './Sidebar';

describe('Sidebar', () => {
  const defaultProps = {
    activeTab: 'dashboard',
    setActiveTab: vi.fn(),
    onCloseMobile: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all main navigation links', () => {
    render(<Sidebar {...defaultProps} />);
    
    // Check if main categories are rendered
    expect(screen.getByText('Tổng quan tài chính gia đình')).toBeInTheDocument();
    expect(screen.getByText('Kế hoạch Thu nhập')).toBeInTheDocument();
    expect(screen.getByText('Phân Bổ Ngân Sách')).toBeInTheDocument();
    expect(screen.getByText('FIRE Center')).toBeInTheDocument();
    expect(screen.getByText('Cấu hình hệ thống')).toBeInTheDocument();
  });

  it('highlights the active tab', () => {
    render(<Sidebar {...defaultProps} activeTab="income" />);
    
    const incomeBtn = screen.getByText('Kế hoạch Thu nhập').closest('button');
    expect(incomeBtn).toHaveClass('bg-family-accent'); // Active state class in Sidebar
  });

  it('calls setActiveTab when a navigation item is clicked', () => {
    render(<Sidebar {...defaultProps} />);
    
    const settingsBtn = screen.getByText('Cấu hình hệ thống');
    fireEvent.click(settingsBtn);
    
    expect(defaultProps.setActiveTab).toHaveBeenCalledWith('settings');
  });

  it('calls onCloseMobile when a navigation item is clicked (for mobile)', () => {
    render(<Sidebar {...defaultProps} />);
    
    const incomeBtn = screen.getByText('Kế hoạch Thu nhập');
    fireEvent.click(incomeBtn);
    
    expect(defaultProps.onCloseMobile).toHaveBeenCalledTimes(1);
  });
});
