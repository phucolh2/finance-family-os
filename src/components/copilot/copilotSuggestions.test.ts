import { describe, it, expect } from 'vitest';
import { 
  getSmartContextPrompts, 
  extractFollowUpQuestions, 
  getFallbackFollowUps 
} from './copilotSuggestions';
import type { AppState } from '../../types/finance';

const mockState = {
  profile: {
    husbandName: 'Chồng',
    wifeName: 'Vợ',
    startingCapital: 100,
  },
  incomeSchedule: [{ incomeMonthly: 80 }],
  budgetSchedule: [],
  lifeEvents: [],
  investmentDeals: [],
  assumptions: {
    generalInflationRateAnnual: 4,
    investmentYieldExpectationAnnual: 10,
  },
  savingsDeposits: [{ name: 'VCB', principal: 50, interestRateAnnual: 6, termMonths: 12, startMonth: 1, startYear: 2026, status: 'active' }],
  sinkingFunds: [{ name: 'Quỹ sinh con', targetAmount: 100, currentBalance: 40, monthlyContribution: 10, startMonth: 1, startYear: 2026, status: 'active' }],
  debts: [{ name: 'Vay mua xe', principal: 200, remainingBalance: 150, monthlyPayment: 5, interestRateAnnual: 8, termMonths: 48, startMonth: 1, startYear: 2025, status: 'active', type: 'car' }],
  resolvedMonthlyDb: [
    { month: 8, year: 2026, periodKey: '2026-08', income: 80, totalActualExpenseMonthly: 22.4, actualExpenseByGroup: { housing_basic: 20.4, family_experience: 2 } }
  ]
} as unknown as AppState;

describe('copilotSuggestions', () => {
  it('generates context-aware prompts for life_stages tab', () => {
    const prompts = getSmartContextPrompts('life_stages', mockState);
    expect(prompts.length).toBeGreaterThan(0);
    expect(prompts.some(p => p.prompt.includes('chi tiêu'))).toBe(true);
    expect(prompts.some(p => p.tag === 'Quản lý Chi tiêu')).toBe(true);
  });

  it('generates context-aware prompts for portfolio tab', () => {
    const prompts = getSmartContextPrompts('portfolio', mockState);
    expect(prompts.some(p => p.prompt.includes('đầu tư'))).toBe(true);
    expect(prompts.some(p => p.tag === 'Danh mục Đầu tư')).toBe(true);
  });

  it('extracts follow-up questions from AI response correctly', () => {
    const responseWithMarker = `Trong tháng vừa qua, gia đình chi tiêu 22.4 triệu VNĐ.
---
[GỢI Ý TIẾP THEO]
- Có cách nào cắt giảm chi phí nhà ở tháng tới không?
- Dự báo chi tiêu 3 tháng tới của gia đình ra sao?
- Tháng này có bị vượt định mức ngân sách không?`;

    const { cleanText, followUps } = extractFollowUpQuestions(responseWithMarker);
    expect(cleanText).toContain('Trong tháng vừa qua');
    expect(cleanText).not.toContain('[GỢI Ý TIẾP THEO]');
    expect(followUps.length).toBe(3);
    expect(followUps[0]).toBe('Có cách nào cắt giảm chi phí nhà ở tháng tới không?');
    expect(followUps[1]).toBe('Dự báo chi tiêu 3 tháng tới của gia đình ra sao?');
    expect(followUps[2]).toBe('Tháng này có bị vượt định mức ngân sách không?');
  });

  it('returns empty follow-ups and intact text when marker is absent', () => {
    const plainResponse = 'Đây là câu trả lời thông thường không có thẻ.';
    const { cleanText, followUps } = extractFollowUpQuestions(plainResponse);
    expect(cleanText).toBe(plainResponse);
    expect(followUps).toEqual([]);
  });

  it('generates fallback follow-up questions for spending queries', () => {
    const followUps = getFallbackFollowUps('Tháng qua sài nhiều tiền không?');
    expect(followUps.length).toBe(3);
    expect(followUps.some(f => f.includes('chi phí') || f.includes('chi tiêu'))).toBe(true);
  });

  it('generates fallback follow-up questions for baby fund queries', () => {
    const followUps = getFallbackFollowUps('Bao lâu gom đủ quỹ sinh con?');
    expect(followUps.length).toBe(3);
    expect(followUps.some(f => f.includes('nuôi con') || f.includes('quỹ'))).toBe(true);
  });
});
