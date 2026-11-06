import { describe, it, expect, vi } from 'vitest';
import { consultFamilyDecisionWithGemini } from './decisionAiService';
import * as aiService from './aiService';

describe('consultFamilyDecisionWithGemini', () => {
  it('falls back to offline engine gracefully when API throws', async () => {
    vi.spyOn(aiService, 'generateGeminiContentWithFallback').mockRejectedValue(new Error('Network error'));

    const result = await consultFamilyDecisionWithGemini({
      title: 'Mua ô tô che mưa nắng',
      category: 'lifestyle',
      contextType: 'complicated',
      husbandName: 'Hoài Phước',
      wifeName: 'Diệu Hồng',
      husbandPerspective: {
        wants: 'Mua xe 800tr',
        concerns: 'Chi phí nuôi xe',
        targetOutcome: 'Đi lại an toàn',
      },
      wifePerspective: {
        wants: 'Tích lũy mua nhà',
        concerns: 'Áp lực nợ',
        targetOutcome: 'An toàn tài chính',
      },
      facts: [
        { type: 'FACT', content: 'Tổng tiền mặt hiện có 500 triệu' },
      ],
      apiKey: 'test-key',
    });

    expect(result.source).toBe('offline_fallback');
    expect(result.perspectives.analystView).toBeTruthy();
    expect(result.options.length).toBeGreaterThanOrEqual(1);
    expect(result.tenderLetter).toContain('Hoài Phước');
  });

  it('parses Gemini JSON response successfully when valid', async () => {
    const mockJson = JSON.stringify({
      perspectives: {
        analystView: 'Dòng tiền đáp ứng tốt.',
        skepticView: 'Cần chú ý chi phí bảo dưỡng.',
        strategistView: 'Tạo đòn bẩy công việc 3 năm tới.',
        mediatorView: 'Hai vợ chồng đều hướng tới sự an toàn.',
      },
      options: [
        {
          id: 'opt_1',
          name: 'Mua xe lướt 500tr',
          description: 'Trả thẳng không vay nợ',
          pros: ['Không có nợ'],
          cons: ['Xe đã qua sử dụng'],
          costEstimate: 500,
          riskLevel: 'low',
          reversibility: 'easy',
          score: 95,
        },
      ],
      guardrails: 'Kiểm tra chi phí sau 3 tháng',
      chosenRationale: 'Lựa chọn mua xe lướt trả thẳng tối ưu nhất',
      tenderLetter: 'Hai vợ chồng cùng đồng lòng.',
    });

    vi.spyOn(aiService, 'generateGeminiContentWithFallback').mockResolvedValue(`\`\`\`json\n${mockJson}\n\`\`\``);

    const result = await consultFamilyDecisionWithGemini({
      title: 'Mua xe lướt',
      category: 'lifestyle',
      contextType: 'complicated',
      husbandName: 'Hoài Phước',
      wifeName: 'Diệu Hồng',
      husbandPerspective: {
        wants: 'Mua xe',
        concerns: 'Chi phí',
        targetOutcome: 'An toàn',
      },
      wifePerspective: {
        wants: 'Tiết kiệm',
        concerns: 'Mất vốn',
        targetOutcome: 'An tâm',
      },
      facts: [],
      apiKey: 'test-key',
    });

    expect(result.source).toBe('gemini');
    expect(result.perspectives.analystView).toBe('Dòng tiền đáp ứng tốt.');
    expect(result.options[0].name).toBe('Mua xe lướt 500tr');
    expect(result.options[0].costEstimate).toBe(500);
  });
});
