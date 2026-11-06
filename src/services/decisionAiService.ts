import type { DecisionOption, FamilyDecisionRecord } from '../types/finance';
import type { FinancialFactItem } from '../engines/decisionIntelligenceEngine';
import { synthesizeFamilyPerspectives } from '../engines/decisionIntelligenceEngine';
import { generateGeminiContentWithFallback, getActiveGeminiApiKey } from './aiService';

export interface GeminiDecisionConsultParams {
  title: string;
  category: string;
  contextType: string;
  husbandName: string;
  wifeName: string;
  husbandPerspective: {
    wants: string;
    concerns: string;
    targetOutcome: string;
  };
  wifePerspective: {
    wants: string;
    concerns: string;
    targetOutcome: string;
  };
  facts: FinancialFactItem[];
  apiKey?: string;
}

export interface GeminiDecisionConsultResult {
  perspectives: FamilyDecisionRecord['perspectives'];
  options: DecisionOption[];
  guardrails: string;
  chosenRationale: string;
  tenderLetter: string;
  source: 'gemini' | 'offline_fallback';
}

export async function consultFamilyDecisionWithGemini(
  params: GeminiDecisionConsultParams
): Promise<GeminiDecisionConsultResult> {
  const {
    title,
    category,
    contextType,
    husbandName,
    wifeName,
    husbandPerspective,
    wifePerspective,
    facts,
    apiKey = getActiveGeminiApiKey(),
  } = params;

  const factsText = facts.length > 0
    ? facts.map((f, i) => `${i + 1}. [${f.type}] ${f.content}`).join('\n')
    : 'Chưa có thông tin trích xuất từ Digital Twin.';

  const systemInstruction = `Bạn là "Cố Vấn Đồng Thuận & Quyết Định Tổ Ấm" - Trí tuệ AI cố vấn hôn nhân và tài chính gia đình cao cấp, ứng dụng Bộ Khung AI Decision Intelligence kết hợp tâm lý học gắn kết gia đình.

NGUYÊN TẮC CỐT LÕI:
1. Thấu cảm, tôn trọng sâu sắc cả hai vợ chồng (${husbandName} & ${wifeName}), không thiên vị, không phán xét ai đúng ai sai.
2. Bỏ qua tư duy đối đầu nhị nguyên, chuyển từ "Anh vs Em" thành "Vợ chồng mình cùng giải bài toán này".
3. Kết nối hài hòa giữa SỰ THẬT TÀI CHÍNH THỰC TẾ với CẢM XÚC & HẠNH PHÚC GIA ĐÌNH dài hạn.
4. Đưa ra các phương án hành động may đo cụ thể, có số liệu định lượng, chi phí cơ hội, và kịch bản thử nghiệm nhỏ (Safe-to-fail experiment).
5. Luôn trả về ĐÚNG MỘT ĐỊNH DẠNG JSON DUY NHẤT để hệ thống hiển thị trực tiếp.`;

  const prompt = `Hãy phân tích sâu sắc bài toán quyết định sau đây cho gia đình hai vợ chồng:

BỐI CẢNH QUYẾT ĐỊNH:
- Tiêu đề: "${title}"
- Lĩnh vực: ${category}
- Bối cảnh: ${contextType}

GÓC NHÌN & TIẾNG NÓI CỦA CHỒNG (${husbandName}):
- Mong muốn: ${husbandPerspective.wants || 'Chưa chia sẻ'}
- Lo lắng / Băn khoăn: ${husbandPerspective.concerns || 'Chưa chia sẻ'}
- Kết quả kỳ vọng: ${husbandPerspective.targetOutcome || 'Chưa chia sẻ'}

GÓC NHÌN & TIẾNG NÓI CỦA VỢ (${wifeName}):
- Mong muốn: ${wifePerspective.wants || 'Chưa chia sẻ'}
- Lo lắng / Băn khoăn: ${wifePerspective.concerns || 'Chưa chia sẻ'}
- Kết quả kỳ vọng: ${wifePerspective.targetOutcome || 'Chưa chia sẻ'}

SỰ THẬT TÀI CHÍNH TỪ BẢN SAO SỐ (DIGITAL TWIN) CỦA GIA ĐÌNH:
${factsText}

YÊU CẦU: Hãy phân tích và trả về ĐÚNG cấu trúc JSON sau (không thêm văn bản ngoài JSON):
\`\`\`json
{
  "perspectives": {
    "analystView": "Phân tích định lượng số liệu, dòng tiền, chi phí cơ hội, tác động tới quỹ dự phòng và runway (viết 2-3 câu súc tích, sắc bén)",
    "skepticView": "Những câu hỏi chất vấn phản biện sâu sắc, các rủi ro xấu nhất và chi phí ẩn cần lường trước (viết 2-3 câu)",
    "strategistView": "Tầm nhìn chiến lược 3-5 năm, gắn kết sự nghiệp, gia đình và tự do tài chính (viết 2-3 câu)",
    "mediatorView": "Đọc vị cảm xúc, thấu cảm nỗi lòng của vợ và chồng, xoa dịu bất an, chuyển Anh vs Em thành Vợ chồng mình (viết 2-3 câu ấm áp)"
  },
  "options": [
    {
      "id": "opt_a",
      "name": "Phương án A: [Tên phương án dung hòa sáng tạo, cụ thể hóa cho đề tài này]",
      "description": "[Mô tả giải pháp hài hòa 70-80% mong muốn của cả hai]",
      "pros": ["Ưu điểm 1", "Ưu điểm 2", "Ưu điểm 3"],
      "cons": ["Nhược điểm hoặc đánh đổi"],
      "costEstimate": 150,
      "riskLevel": "low",
      "reversibility": "moderate",
      "score": 92
    },
    {
      "id": "opt_b",
      "name": "Phương án B: [Tên phương án thử nghiệm nhỏ - Safe to fail]",
      "description": "[Triển khai ở quy mô nhỏ trong 3-6 tháng trước khi quyết định lớn]",
      "pros": ["Ưu điểm 1", "Ưu điểm 2", "Ưu điểm 3"],
      "cons": ["Nhược điểm"],
      "costEstimate": 30,
      "riskLevel": "low",
      "reversibility": "easy",
      "score": 88
    },
    {
      "id": "opt_c",
      "name": "Phương án C: [Tên phương án an toàn dự phòng / Tích lũy thêm]",
      "description": "[Chưa vội hành động, củng cố đệm tài chính thêm một thời gian]",
      "pros": ["Ưu điểm 1", "Ưu điểm 2"],
      "cons": ["Chi phí cơ hội"],
      "costEstimate": 0,
      "riskLevel": "low",
      "reversibility": "easy",
      "score": 78
    }
  ],
  "guardrails": "[Hàng rào an toàn cụ thể: Giới hạn ngân sách tối đa, điểm dừng nếu vượt ngưỡng, mốc thời gian hai vợ chồng ngồi lại review]",
  "chosenRationale": "[Đề xuất phương án tối ưu nhất và lý do đồng thuận yêu thương]",
  "tenderLetter": "[1-2 đoạn văn ấm áp gửi riêng hai vợ chồng Anh ${husbandName} và Em ${wifeName}, giúp cả hai cảm thấy được lắng nghe và cùng nhìn về một hướng]"
}
\`\`\``;

  try {
    if (!apiKey) {
      throw new Error('Chưa cấu hình Gemini API Key.');
    }

    const rawResponse = await generateGeminiContentWithFallback(apiKey, systemInstruction, prompt);

    // Bóc tách JSON từ phản hồi của Gemini
    let jsonText = rawResponse.trim();
    const markdownMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch) {
      jsonText = markdownMatch[1].trim();
    }

    const parsed = JSON.parse(jsonText);

    // Validate and build sanitized response
    const perspectives = {
      analystView: parsed.perspectives?.analystView || 'Chưa có phân tích số liệu.',
      skepticView: parsed.perspectives?.skepticView || 'Chưa có phản biện rủi ro.',
      strategistView: parsed.perspectives?.strategistView || 'Chưa có tầm nhìn chiến lược.',
      mediatorView: parsed.perspectives?.mediatorView || 'Chưa có góc nhìn hòa giải.',
    };

    const options: DecisionOption[] = Array.isArray(parsed.options) && parsed.options.length > 0
      ? parsed.options.map((opt: any, idx: number) => ({
          id: opt.id || `opt_${idx + 1}`,
          name: opt.name || `Phương án ${idx + 1}`,
          description: opt.description || '',
          pros: Array.isArray(opt.pros) ? opt.pros : [],
          cons: Array.isArray(opt.cons) ? opt.cons : [],
          costEstimate: typeof opt.costEstimate === 'number' ? opt.costEstimate : 0,
          riskLevel: ['low', 'medium', 'high'].includes(opt.riskLevel) ? opt.riskLevel : 'low',
          reversibility: ['easy', 'moderate', 'difficult', 'irreversible'].includes(opt.reversibility) ? opt.reversibility : 'easy',
          score: typeof opt.score === 'number' ? opt.score : 85,
        }))
      : [
          {
            id: 'opt_a',
            name: 'Phương án A: Dung hòa mục tiêu đôi bên',
            description: 'Kết hợp hài hòa giữa mục tiêu tăng trưởng và sự an tâm tài chính.',
            pros: ['Bảo toàn quỹ khẩn cấp', 'Đáp ứng mong muốn đôi bên'],
            cons: ['Cần thêm thời gian chuẩn bị'],
            costEstimate: 100,
            riskLevel: 'low',
            reversibility: 'moderate',
            score: 90,
          },
        ];

    const guardrails = parsed.guardrails || 'Thiết lập điểm dừng nếu chi phí vượt quá 10% ngân sách.';
    const chosenRationale = parsed.chosenRationale || 'Đề xuất lựa chọn phương án dung hòa để đảm bảo an tâm lâu dài.';
    const tenderLetter = parsed.tenderLetter || `Gửi Anh ${husbandName} và Em ${wifeName}: Trong mọi quyết định lớn, điều quan trọng nhất không phải là thắng thua, mà là sau mỗi quyết định, hai vợ chồng lại càng thấu hiểu và tin tưởng nhau hơn.`;

    return {
      perspectives,
      options,
      guardrails,
      chosenRationale,
      tenderLetter,
      source: 'gemini',
    };
  } catch (err) {
    console.warn('[Gemini Decision Intelligence] Gặp sự cố khi gọi API, tự động fallback sang offline engine:', err);

    // Fallback an toàn nếu offline hoặc API key lỗi
    const offlinePerspectives = synthesizeFamilyPerspectives(
      title,
      husbandPerspective.wants,
      husbandPerspective.concerns,
      wifePerspective.wants,
      wifePerspective.concerns,
      facts
    );

    return {
      perspectives: offlinePerspectives,
      options: [
        {
          id: 'opt_a',
          name: 'Phương án A: Giải pháp dung hòa đề xuất',
          description: 'Kết hợp hài hòa giữa mục tiêu phát triển và sự an tâm tài chính cho tổ ấm.',
          pros: ['Bảo toàn quỹ dự phòng khẩn cấp', 'Đáp ứng 70% mong muốn của cả hai', 'Không vay nợ áp lực'],
          cons: ['Cần thêm thời gian chuẩn bị và tích lũy'],
          costEstimate: 100,
          riskLevel: 'low',
          reversibility: 'moderate',
          score: 92,
        },
        {
          id: 'opt_b',
          name: 'Phương án B: Thử nghiệm an toàn (Safe-to-fail experiment)',
          description: 'Triển khai ở quy mô nhỏ 30-50% trong 3-6 tháng trước khi quyết định lớn.',
          pros: ['Rủi ro thấp', 'Kiểm chứng thực tế thói quen', 'Dễ dàng đảo ngược quyết định'],
          cons: ['Hiệu quả chưa đạt tối đa ngay tức thì'],
          costEstimate: 30,
          riskLevel: 'low',
          reversibility: 'easy',
          score: 86,
        },
        {
          id: 'opt_c',
          name: 'Phương án C: Giữ nguyên hiện trạng & Tích lũy thêm 6-12 tháng',
          description: 'Chưa hành động vội, ưu tiên tối đa dòng tiền nhàn rỗi vào tiết kiệm an toàn.',
          pros: ['An toàn tuyệt đối 100%', 'Tâm lý thảnh thơi'],
          cons: ['Chi phí cơ hội bị bỏ lỡ'],
          costEstimate: 0,
          riskLevel: 'low',
          reversibility: 'easy',
          score: 75,
        },
      ],
      guardrails: 'Mốc kiểm tra sau 3 tháng. Giới hạn ngân sách phát sinh tối đa không vượt quá 10 triệu/tháng.',
      chosenRationale: 'Phương án A giúp cân bằng tối ưu giữa mong muốn phát triển và sự an tâm tài chính.',
      tenderLetter: `Gửi Anh ${husbandName} và Em ${wifeName}: Hạnh phúc lớn nhất của tổ ấm là khi hai vợ chồng cùng nhìn về một hướng, lấy sự an tâm và tình yêu thương làm kim chỉ nam soi đường.`,
      source: 'offline_fallback',
    };
  }
}
