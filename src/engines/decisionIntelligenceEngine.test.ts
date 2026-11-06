import { describe, it, expect } from 'vitest';
import {
  extractFamilyFinancialFacts,
  computeDecisionScorecard,
  synthesizeFamilyPerspectives,
} from './decisionIntelligenceEngine';
import type { AppState, FamilyDecisionRecord } from '../types/finance';

describe('decisionIntelligenceEngine', () => {
  const mockAppState: AppState = {
    profile: {
      husbandName: 'Hoài Phước',
      wifeName: 'Diệu Hồng',
      husbandAgeAtStart: 32,
      wifeAgeAtStart: 30,
      planningStartMonth: 1,
      planningStartYear: 2026,
      planningEndMonth: 12,
      planningEndYear: 2056,
      currency: 'VND_MILLION',
    },
    savingsDeposits: [
      { id: 'sav_1', name: 'Tiết kiệm Techcombank 12T', principal: 200, termMonths: 12, interestRateAnnual: 6.5, startMonth: 1, startYear: 2026, pool: 'emergency', status: 'active' } as any,
    ],
    sinkingFunds: [
      { id: 'sink_1', name: 'Quỹ Dự phòng Khẩn cấp', targetAmount: 180, initialDeposit: 150, startMonth: 1, startYear: 2026, status: 'active' } as any,
    ],
    assets: [
      { id: 'asset_1', type: 'stocks', name: 'Chứng khoán', beginningBalance: 300, targetAllocationPercent: 30, expectedReturnRateAnnual: 10, investmentYear: 2026 },
    ],
    incomeSchedule: [
      { id: 'inc_1', effectiveMonth: 1, effectiveYear: 2026, incomeMonthly: 50 },
    ],
    debts: [],
    budgetSchedule: [],
    expenseSchedule: [],
    lifeStages: [],
    lifeEvents: [],
    assumptions: {
      generalInflationRateAnnual: 4,
      educationInflationRateAnnual: 6,
      medicalInflationRateAnnual: 7,
      investmentYieldExpectationAnnual: 10,
      savingsInterestRateAnnual: 6,
    },
  };

  it('correctly extracts facts and runway calculation from app state', () => {
    const facts = extractFamilyFinancialFacts(mockAppState);
    expect(facts.length).toBeGreaterThanOrEqual(4);

    const factLiquid = facts.find((f) => f.content.includes('tài sản thanh khoản an toàn'));
    expect(factLiquid).toBeDefined();
    expect(factLiquid?.content).toContain('350'); // 200 + 150

    const factDTI = facts.find((f) => f.content.includes('KHÔNG có nợ vay'));
    expect(factDTI).toBeDefined();

    const factRunway = facts.find((f) => f.type === 'CALCULATION');
    expect(factRunway).toBeDefined();
    expect(factRunway?.content).toContain('Emergency Runway');
  });

  it('computes quality score according to decision intelligence scorecard rules', () => {
    const partialRecord: Partial<FamilyDecisionRecord> = {
      title: 'Mua xe ô tô gia đình phục vụ con nhỏ',
      category: 'lifestyle',
      contextType: 'complicated',
      evidenceItems: [
        { type: 'FACT', content: 'Dòng tiền tự do hàng tháng 20 triệu' },
        { type: 'CALCULATION', content: 'Chi phí nuôi xe 8 triệu/tháng' },
        { type: 'EMOTIONAL_CONCERN', content: 'Vợ lo lắng áp lực chi tiêu' },
      ],
      husbandPerspective: { wants: 'Mua xe an toàn', concerns: 'Nuôi xe tốn kém', targetOutcome: 'An toàn gia đình' },
      wifePerspective: { wants: 'Giữ tiền tiết kiệm', concerns: 'Sợ mất an toàn tài chính', targetOutcome: 'Bình yên' },
      options: [
        { id: '1', name: 'Xe cũ', description: 'Mua xe lướt', pros: ['Rẻ'], cons: ['Cũ'], costEstimate: 450, riskLevel: 'low', reversibility: 'moderate', score: 85 },
        { id: '2', name: 'Xe mới', description: 'Vay 50%', pros: ['Mới'], cons: ['Nợ'], costEstimate: 900, riskLevel: 'high', reversibility: 'difficult', score: 60 },
      ],
      perspectives: {
        analystView: 'Khả năng chi trả tốt',
        skepticView: 'Tiêu sản khấu hao cao',
        strategistView: 'Giải pháp xe lướt',
        mediatorView: 'Dung hòa cả hai',
      },
      chosenOptionId: '1',
      governance: {
        decider: 'both',
        approver: 'Cả hai vợ chồng',
        executor: 'Chồng thực hiện',
        reviewDate: '2026-12-31',
        guardrails: 'Không vay quá 200 triệu',
      },
    };

    const scorecard = computeDecisionScorecard(partialRecord);
    expect(scorecard.total).toBeGreaterThanOrEqual(88);
    expect(scorecard.verdict).toBe('APPROVED');
  });

  it('synthesizes balanced perspectives with empathetic mediator voice', () => {
    const perspectives = synthesizeFamilyPerspectives(
      'Mua ô tô',
      'Muốn mua xe gầm cao an toàn cho con',
      'Lo chi phí nuôi xe',
      'Muốn giữ tiền tích lũy mua đất',
      'Sợ áp lực tài chính',
      [{ type: 'FACT', content: 'Quỹ thanh khoản có 400 triệu.' }]
    );

    expect(perspectives.analystView).toContain('số liệu cho bài toán');
    expect(perspectives.skepticView).toContain('Black Hat');
    expect(perspectives.strategistView).toContain('Yellow Hat');
    expect(perspectives.mediatorView).toContain('Red & Blue Hat');
    expect(perspectives.mediatorView).toContain('tổ ấm');
  });
});
