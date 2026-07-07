import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AppState } from '../types/finance';

// Hàm dịch toàn bộ dữ liệu AppContext thành Markdown Prompt
export const buildSystemContext = (state: AppState): string => {
  const { profile, incomeSchedule, budgetSchedule, lifeEvents, investmentDeals, assumptions } = state;

  const currentIncome = incomeSchedule.length > 0 ? incomeSchedule[0].incomeMonthly : 0;
  const currentBudget = budgetSchedule.length > 0 ? budgetSchedule[0] : null;

  let budgetText = '';
  if (currentBudget && currentBudget.rootGroups) {
    budgetText = currentBudget.rootGroups
      .map(group => `- ${group.name}: ${group.ratioPercent}%`)
      .join('\n');
  }

  return `Bạn là "Finance Family OS Copilot" - một trợ lý tài chính AI thông minh được nhúng trực tiếp vào phần mềm quản lý gia đình.
Nhiệm vụ của bạn là trả lời các câu hỏi tài chính dựa trên DỮ LIỆU HIỆN TẠI của người dùng.
Luôn trả lời bằng tiếng Việt, ngắn gọn, súc tích, chuyên nghiệp và có sự đồng cảm.
Khi tính toán, hãy cẩn thận và chỉ ra các con số rõ ràng. Dùng Markdown để định dạng câu trả lời cho đẹp (in đậm số tiền, dùng danh sách).

DƯỚI ĐÂY LÀ DỮ LIỆU HIỆN TẠI CỦA GIA ĐÌNH:

--- 1. TỔNG QUAN ---
- Vốn khởi điểm: ${profile.startingCapital || 0} Tr VND
- Lạm phát dự kiến: ${assumptions.generalInflationRateAnnual}% / năm
- Lãi tiết kiệm dự kiến: ${assumptions.savingsInterestRateAnnual}% / năm
- Thu nhập mỗi tháng hiện tại: ${currentIncome} Tr VND

--- 2. PHÂN BỔ NGÂN SÁCH ---
(Tỷ trọng phân bổ dòng tiền hàng tháng:)
${budgetText}

--- 3. SỰ KIỆN CUỘC ĐỜI (Tương lai) ---
${!lifeEvents || lifeEvents.length === 0 ? 'Chưa có sự kiện nào.' : lifeEvents.map(e => `- Tháng ${e.month}/${e.year}: [${e.type}] ${e.name}. Tác động 1 lần: ${e.amount} Tr. Tác động dòng tiền: ${e.recurringMonthlyImpact || 0} Tr/tháng. Nguồn: ${e.source}`).join('\n')}

--- 4. THƯƠNG VỤ ĐẦU TƯ ---
${!investmentDeals || investmentDeals.length === 0 ? 'Chưa có khoản đầu tư nào.' : investmentDeals.map(d => `- [${d.assetType}] ${d.name}. Vốn: ${d.capital} Tr. Tình trạng: ${d.status === 'settled' ? 'Đã tất toán' : 'Đang chạy'}. Lãi đã chốt: ${d.realizedProfit || 0} Tr.`).join('\n')}

HƯỚNG DẪN TRẢ LỜI:
1. Luôn ưu tiên dùng dữ liệu ở trên để trả lời.
2. Trừ khi được yêu cầu, hãy luôn dùng dữ liệu TỔNG QUAN và SỰ KIỆN CUỘC ĐỜI để nhẩm tính tình hình tài chính trong tương lai.
3. Không khuyên những thứ sáo rỗng, hãy nói thẳng vào con số của người dùng.`;
};

// Hàm gửi tin nhắn tới Gemini API
export const sendChatMessage = async (
  apiKey: string,
  message: string,
  chatHistory: { role: 'user' | 'model'; parts: { text: string }[] }[],
  state: AppState
) => {
  if (!apiKey) throw new Error("Chưa cấu hình Gemini API Key.");

  const genAI = new GoogleGenerativeAI(apiKey);
  // Dùng gemini-2.5-flash để hỗ trợ hạn mức Free Tier tốt nhất
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    systemInstruction: buildSystemContext(state)
  });

  const chat = model.startChat({
    history: chatHistory,
    generationConfig: {
      maxOutputTokens: 1000,
      temperature: 0.7,
    },
  });

  const result = await chat.sendMessage(message);
  const response = await result.response;
  return response.text();
};
