import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AppState } from '../types/finance';

// Helper format tiền tệ tiếng Việt
export function formatTableMoneyVNDMillionOffline(amount: number): string {
  if (amount >= 1000) {
    return (amount / 1000).toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + ' Tỷ';
  }
  return amount.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + ' Tr';
}

// Hàm dịch toàn bộ dữ liệu AppContext thành Markdown Prompt toàn diện cho AI
export const buildSystemContext = (state: AppState): string => {
  const { 
    profile, 
    incomeSchedule, 
    budgetSchedule, 
    lifeEvents, 
    investmentDeals = [], 
    assumptions,
    savingsDeposits = [],
    sinkingFunds = [],
    debts = [],
    resolvedMonthlyDb = []
  } = state;

  const currentIncome = incomeSchedule.length > 0 ? incomeSchedule[0].incomeMonthly : 80;
  const currentBudget = budgetSchedule.length > 0 ? budgetSchedule[0] : null;

  let budgetText = '';
  if (currentBudget && currentBudget.rootGroups) {
    budgetText = currentBudget.rootGroups
      .map(group => `- ${group.name}: ${group.ratioPercent}% (~${((currentIncome * group.ratioPercent) / 100).toFixed(1)} tr/tháng)`)
      .join('\n');
  }

  // 1. Tổng hợp Tài sản ròng (Net Worth) & Tiết kiệm
  const totalSavings = savingsDeposits
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + (s.principal || 0), 0);

  const totalSinkingFunds = sinkingFunds
    .filter(f => f.status === 'active')
    .reduce((sum, f) => sum + ((f as any).currentBalance ?? f.initialDeposit ?? 0), 0);

  const totalInvestedDeals = investmentDeals
    .filter(d => d.status === 'active')
    .reduce((sum, d) => sum + (d.capital || 0), 0);

  const totalDebts = debts
    .filter(d => d.status === 'active')
    .reduce((sum, d) => sum + ((d as any).remainingBalance ?? d.principal ?? 0), 0);

  const startingCapital = profile?.startingCapital || 0;
  const estimatedNetWorth = Math.round((startingCapital + totalSavings + totalSinkingFunds + totalInvestedDeals - totalDebts) * 10) / 10;

  // 2. Lịch sử Chi Tiêu Thực Tế Hàng Tháng (Lấy các tháng gần nhất)
  const recentMonthlyRecords = [...resolvedMonthlyDb]
    .filter(item => (item.totalActualExpenseMonthly !== undefined && item.totalActualExpenseMonthly > 0) || item.income > 0)
    .slice(-12); // 12 tháng gần nhất

  let monthlyHistoryText = '';
  if (recentMonthlyRecords.length > 0) {
    monthlyHistoryText = recentMonthlyRecords.map(m => {
      const actualExp = m.totalActualExpenseMonthly || 0;
      const surplus = Math.round((m.income - actualExp) * 10) / 10;
      let groupDetails = '';
      if (m.actualExpenseByGroup && Object.keys(m.actualExpenseByGroup).length > 0) {
        groupDetails = Object.entries(m.actualExpenseByGroup)
          .filter(([_, val]) => val > 0)
          .map(([k, val]) => `${k}: ${val} tr`)
          .join(', ');
      }
      return `- Tháng ${m.month}/${m.year} (${m.periodKey}): Thu nhập ${m.income} tr | Chi tiêu thực tế: ${actualExp} tr | Dư tích lũy: ${surplus} tr ${groupDetails ? `[Chi tiết: ${groupDetails}]` : ''}`;
    }).join('\n');
  } else {
    monthlyHistoryText = 'Chưa có bản ghi chi tiêu tháng cũ được lưu. (Mặc định thu nhập hiện tại 80 tr/tháng, tiền thuê nhà 9 tr/tháng).';
  }

  // 3. Quỹ Tích Lũy Mục Tiêu (Sinking Funds - Quỹ sinh con, mua sắm...)
  let sinkingFundsText = '';
  if (sinkingFunds.length > 0) {
    sinkingFundsText = sinkingFunds.map(f => {
      const current = (f as any).currentBalance ?? f.initialDeposit ?? 0;
      const gap = Math.max(0, f.targetAmount - current);
      const monthsNeeded = f.monthlyContribution > 0 ? Math.ceil(gap / f.monthlyContribution) : 'Chưa đặt góp đều';
      const targetTime = (f as any).targetDate || `Bắt đầu: ${f.startMonth}/${f.startYear}`;
      return `- ${f.name}: Hiện có ${current} tr / Mục tiêu ${f.targetAmount} tr (Còn thiếu: ${gap} tr). Góp hàng tháng: ${f.monthlyContribution} tr/tháng. Thời điểm: ${targetTime}. Dự kiến cần: ${monthsNeeded} tháng nữa.`;
    }).join('\n');
  } else {
    sinkingFundsText = 'Gia đình đang chuẩn bị kế hoạch tích lũy quỹ đón thiên thần nhỏ (mục tiêu ~80 - 100 triệu).';
  }

  // 4. Sổ tiết kiệm (Savings Deposits)
  let savingsText = '';
  if (savingsDeposits.length > 0) {
    savingsText = savingsDeposits.map(s => 
      `- ${s.name}: Gốc ${s.principal} tr | Lãi suất ${s.interestRateAnnual}%/năm | Kỳ hạn ${s.termMonths} tháng | Bắt đầu: ${s.startMonth}/${s.startYear} | Trạng thái: ${s.status === 'active' ? 'Đang gửi' : 'Đã tất toán'}`
    ).join('\n');
  } else {
    savingsText = 'Chưa có sổ tiết kiệm cá nhân.';
  }

  // 5. Nợ & Khoản vay (Debts)
  let debtsText = '';
  if (debts.length > 0) {
    debtsText = debts.map(d => {
      const rem = (d as any).remainingBalance ?? d.principal ?? 0;
      const monthlyPay = (d as any).monthlyPayment ? `${(d as any).monthlyPayment} tr/tháng` : 'Theo kỳ hạn';
      return `- ${d.name} (${d.type}): Dư nợ ${rem} tr (Gốc ban đầu ${d.principal} tr) | Trả góp: ${monthlyPay} | Lãi suất ${d.interestRateAnnual}%/năm | Kỳ hạn ${d.termMonths} tháng từ ${d.startMonth}/${d.startYear}`;
    }).join('\n');
  } else {
    debtsText = 'Gia đình hiện tại không có nợ xấu hoặc khoản vay lớn.';
  }

  // 6. Tính toán Chỉ số Độc lập tài chính (FIRE)
  // Ước tính chi tiêu hàng năm: Lấy trung bình chi tiêu hoặc 35 tr/tháng (420 tr/năm)
  const estimatedMonthlyLivingExpense = recentMonthlyRecords.length > 0 
    ? (recentMonthlyRecords.reduce((s, r) => s + (r.totalActualExpenseMonthly || 30), 0) / recentMonthlyRecords.length)
    : 30;
  const annualLivingExpense = estimatedMonthlyLivingExpense * 12;
  const fireTarget = Math.round((annualLivingExpense / 0.04) * 10) / 10; // Quy tắc 4%
  const fireGap = Math.max(0, fireTarget - estimatedNetWorth);
  const monthlySurplus = Math.max(0, currentIncome - estimatedMonthlyLivingExpense);
  const yearsToFire = monthlySurplus > 0 ? (fireGap / (monthlySurplus * 12)).toFixed(1) : 'Chưa xác định';

  return `Bạn là "Trợ lý Gia đình" - Người bạn đồng hành và Chuyên gia hoạch định tài chính gia đình thân thiết, tri kỷ của hai vợ chồng.
Bạn trả lời trực tiếp các câu hỏi của người dùng dựa trên CHÍNH DỮ LIỆU TÀI CHÍNH THỰC TẾ của gia đình được cung cấp dưới đây.

============================================================
BỨC TRANH TÀI CHÍNH TOÀN DIỆN CỦA GIA ĐÌNH:
============================================================
- Tổng tài sản ròng ước tính (Net Worth): ${estimatedNetWorth} triệu VNĐ
- Vốn khởi điểm: ${startingCapital} triệu VNĐ
- Thu nhập hiện tại: ${currentIncome} triệu VNĐ/tháng
- Tiền thuê nhà cố định: Khoảng 9 triệu VNĐ/tháng
- Lạm phát dự kiến: ${assumptions.generalInflationRateAnnual}% / năm
- Lãi suất đầu tư kỳ vọng: ${assumptions.investmentYieldExpectationAnnual}% / năm

1. DỮ LIỆU CHI TIÊU THỰC TẾ TỪNG THÁNG (LỊCH SỬ THỰC):
${monthlyHistoryText}

2. CƠ CẤU PHÂN BỔ NGÂN SÁCH DỰ KIẾN (4 TRỤ CỘT):
${budgetText || 'Chưa cấu hình chi tiết.'}

3. TIẾN ĐỘ CÁC QUỸ TÍCH LŨY MỤC TIÊU (SINKING FUNDS):
Tổng tích lũy hiện có: ${totalSinkingFunds} triệu VNĐ
${sinkingFundsText}

4. DANH MỤC SỔ TIẾT KIỆM (SAVINGS DEPOSITS):
Tổng tiền gửi tiết kiệm: ${totalSavings} triệu VNĐ
${savingsText}

5. NỢ & NGHĨA VỤ TÀI CHÍNH (DEBTS):
Tổng dư nợ còn lại: ${totalDebts} triệu VNĐ
${debtsText}

6. DANH MỤC ĐẦU TƯ & TÀI SẢN (INVESTMENT DEALS):
Tổng vốn đầu tư: ${totalInvestedDeals} triệu VNĐ
${investmentDeals.length === 0 ? 'Chưa có thương vụ đầu tư lớn.' : investmentDeals.map(d => `- [${d.assetType}] ${d.name}: Vốn ${d.capital} tr (Trạng thái: ${d.status}, Lợi nhuận: ${d.realizedProfit || 0} tr).`).join('\n')}

7. KẾ HOẠCH TƯƠNG LAI & CHI TIÊU LINH HOẠT (LIFE EVENTS):
${lifeEvents.length === 0 ? 'Kế hoạch trọng tâm: Chuẩn bị tài chính đón thiên thần nhỏ.' : lifeEvents.map(e => `- ${e.name} (${e.type}): Tháng ${e.month}/${e.year}, Số tiền: ${e.amount} tr. Ghi chú: ${e.note || 'Không'}`).join('\n')}

8. CHỈ SỐ TỰ DO TÀI CHÍNH (FIRE TARGET):
- Chi phí sinh hoạt ước tính: ${estimatedMonthlyLivingExpense.toFixed(1)} tr/tháng (~${annualLivingExpense.toFixed(1)} tr/năm).
- Số tiền cần có để đạt Tự Do Tài Chính (quy tắc 4%): ${fireTarget} triệu VNĐ (~${(fireTarget / 1000).toFixed(2)} Tỷ).
- Khoảng cách còn lại (FIRE Gap): ${fireGap} triệu VNĐ.
- Tốc độ tích lũy thặng dư hàng tháng: ~${monthlySurplus.toFixed(1)} triệu VNĐ/tháng.
- Dự kiến thời gian đạt FIRE: khoảng ${yearsToFire} năm nữa (nếu giữ vững kỷ luật tài chính và tái đầu tư sinh lời ${assumptions.investmentYieldExpectationAnnual}%/năm).

============================================================
QUY TẮC PHẢN HỒI & TƯ VẤN (BẮT BUỘC TUÂN THỦ):
============================================================
1. KHI ĐƯỢC HỎI VỀ CHI TIÊU QUÁ KHỨ (VD: "Tháng qua sài nhiêu tiền?", "Tháng nào chi nhiều nhất?"):
   - Đọc NGAY từ mục 1 (DỮ LIỆU CHI TIÊU THỰC TẾ).
   - Nêu chính xác con số: Thu nhập bao nhiêu, tổng chi thực tế bao nhiêu, dư tiết kiệm bao nhiêu.
   - Chỉ ra khoản chi lớn nhất (VD: Tiền nhà 9 triệu, ăn uống...).
   - So sánh với ngân sách kế hoạch: Tiết kiệm tốt hay vượt mức, lời động viên chân thành.

2. KHI ĐƯỢC HỎI VỀ DỰ ĐOÁN THỜI GIAN ĐẠT MỤC TIÊU (VD: "Bao lâu tôi đạt được...", "Khi nào gom đủ quỹ sinh con?", "Bao lâu nữa tự do tài chính?"):
   - Tính toán rõ ràng:
     + Mục tiêu cần bao nhiêu (Target), hiện có bao nhiêu (Current) -> Còn thiếu bao nhiêu (Gap).
     + Với tốc độ tích lũy / trích quỹ hiện tại (X triệu/tháng): Số tháng = Gap / X.
     + Quy đổi ra mốc thời gian cụ thể: "Sau X tháng nữa, dự kiến vào khoảng Tháng MM/YYYY".
     + Đưa ra kịch bản tối ưu: "Nếu hai vợ chồng tăng trích thêm Y triệu/tháng thì sẽ rút ngắn được Z tháng".

3. KHI ĐƯỢC HỎI TRA CỨU KIẾN THỨC / THÔNG TIN ĐỜI SỐNG / INTERNET (VD: Chi phí sinh con viện Từ Dũ/Vinmec, bảo hiểm thai sản, giá vàng, lãi suất ngân hàng):
   - Cung cấp thông tin thực tế, cập nhật, chi tiết từng gói chi phí (sinh thường, sinh mổ, chi phí phòng dịch vụ, quyền lợi bảo hiểm).
   - Luôn đối chiếu với bức tranh tài chính của gia đình (VD: "Gói sinh khoảng 40-55 triệu, với quỹ hiện tại X triệu và tốc độ góp Y triệu/tháng thì hoàn toàn nằm trong tầm kiểm soát an toàn của gia đình").

4. PHONG CÁCH GIAO TIẾP:
   - Xưng hô lịch sự, ấm áp, đồng cảm như một người bạn tri kỷ am hiểu tài chính gia đình.
   - Định dạng Markdown rõ ràng, dễ đọc (bullet points, in đậm con số tiền Triệu VNĐ, bảng nếu cần).

5. QUY TẮC GỢI MỞ CÂU HỎI TIẾP THEO (BẮT BUỘC):
   - Ở cuối cùng của MỌI câu trả lời, bạn hãy LUÔN gợi ý chính xác 2 đến 3 câu hỏi ngắn gọn, gợi mở sâu sắc và thực tế nhất mà hai vợ chồng có thể muốn hỏi tiếp dựa trên chính câu trả lời bạn vừa cung cấp.
   - Định dạng chuẩn xác ở cuối phản hồi như sau:
   [GỢI Ý TIẾP THEO]
   - [Câu hỏi gợi ý tiếp theo 1]
   - [Câu hỏi gợi ý tiếp theo 2]
   - [Câu hỏi gợi ý tiếp theo 3]`;
};

// Hàm gửi tin nhắn tới Gemini API
/**
 * Helper gọi Gemini API với cơ chế fallback model tự động:
 * 1. Thử gemini-1.5-flash (chuẩn ổn định nhất của Google AI Studio)
 * 2. Thử gemini-2.0-flash
 * 3. Thử gemini-1.5-pro
 */
async function generateGeminiContentWithFallback(
  apiKey: string,
  systemInstruction: string,
  prompt: string
): Promise<string> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error("Chưa cấu hình Gemini API Key.");
  }

  const cleanKey = apiKey.trim();
  const genAI = new GoogleGenerativeAI(cleanKey);
  const candidateModels = [
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.6-flash'
  ];

  let lastError: any = null;
  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
        }
      });
      const res = await model.generateContent(prompt);
      const text = res.response.text();
      if (text && text.trim().length > 0) {
        return text;
      }
    } catch (err) {
      lastError = err;
      console.warn(`[Gemini API] Thử model ${modelName} thất bại, thử model tiếp theo...`, err);
    }
  }

  throw new Error(`Không thể kết nối Gemini API: ${(lastError as Error)?.message || 'Vui lòng kiểm tra lại API Key.'}`);
}

/**
 * Chuẩn hóa lịch sử trò chuyện cho Gemini SDK:
 * 1. Bắt buộc bắt đầu bằng role 'user' (nếu lịch sử bắt đầu bằng lời chào của model, phải loại bỏ phần chào đầu đó).
 * 2. Các lượt trò chuyện phải luân phiên xen kẽ user -> model -> user -> model.
 * 3. Lịch sử đưa vào startChat phải kết thúc bằng role 'model' để lượt gửi kế tiếp (sendMessage) là role 'user'.
 */
export function sanitizeGeminiHistory(
  rawHistory: { role: 'user' | 'model'; parts: { text: string }[] }[]
): { role: 'user' | 'model'; parts: { text: string }[] }[] {
  if (!rawHistory || rawHistory.length === 0) return [];

  // 1. Lọc các mục không có nội dung text hợp lệ
  const valid = rawHistory.filter(
    item => item.parts && item.parts.length > 0 && item.parts.some(p => p.text && p.text.trim())
  );

  // 2. Tìm vị trí tin nhắn đầu tiên của 'user'
  const firstUserIndex = valid.findIndex(item => item.role === 'user');
  if (firstUserIndex === -1) {
    // Chưa có tin nhắn user nào trước đó -> history phải rỗng []
    return [];
  }

  // 3. Lấy từ tin nhắn user đầu tiên trở đi
  const fromFirstUser = valid.slice(firstUserIndex);

  // 4. Đảm bảo luân phiên user -> model (gộp nội dung nếu trùng role liên tiếp)
  const alternating: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
  for (const item of fromFirstUser) {
    if (alternating.length === 0) {
      alternating.push({ role: item.role, parts: [{ text: item.parts.map(p => p.text).join('\n') }] });
    } else {
      const last = alternating[alternating.length - 1];
      if (last.role === item.role) {
        last.parts[0].text += '\n' + item.parts.map(p => p.text).join('\n');
      } else {
        alternating.push({ role: item.role, parts: [{ text: item.parts.map(p => p.text).join('\n') }] });
      }
    }
  }

  // 5. startChat yêu cầu turn cuối cùng trong history là 'model' (để turn gửi sendMessage tiếp theo là 'user')
  while (alternating.length > 0 && alternating[alternating.length - 1].role !== 'model') {
    alternating.pop();
  }

  return alternating;
}

// Hàm gửi tin nhắn tới Gemini API (Copilot Chat) với hỗ trợ tra cứu Internet & Fallback Model thông minh
export const sendChatMessage = async (
  apiKey: string,
  message: string,
  chatHistory: { role: 'user' | 'model'; parts: { text: string }[] }[],
  state: AppState,
  useWebSearch: boolean = false
): Promise<string> => {
  if (!apiKey) throw new Error("Chưa cấu hình Gemini API Key.");

  const cleanKey = apiKey.trim();
  const genAI = new GoogleGenerativeAI(cleanKey);
  const systemInstruction = buildSystemContext(state);
  const cleanHistory = sanitizeGeminiHistory(chatHistory);

  // 1. Nếu người dùng bật chế độ tra cứu Internet, thử gọi Gemini kèm Google Search Grounding tool
  if (useWebSearch) {
    const searchCandidateModels = ['gemini-3-flash-preview', 'gemini-3.6-flash'];
    for (const searchModelName of searchCandidateModels) {
      try {
        const searchModel = genAI.getGenerativeModel({ 
          model: searchModelName,
          systemInstruction,
          tools: [{ googleSearch: {} } as any]
        });

        const chat = searchModel.startChat({
          history: cleanHistory,
          generationConfig: {
            maxOutputTokens: 2000,
            temperature: 0.7,
          },
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();
        if (text && text.trim().length > 0) {
          return text;
        }
      } catch (searchError) {
        console.warn(`[Google Search ${searchModelName}] Thử tra cứu thất bại hoặc quá tải, chuyển sang model tiếp theo:`, searchError);
      }
    }
  }

  // 2. Danh sách các model ứng cử viên thế hệ 3 có sẵn
  const candidateModels = [
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.6-flash'
  ];

  let lastError: any = null;
  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        systemInstruction
      });

      const chat = model.startChat({
        history: cleanHistory,
        generationConfig: {
          maxOutputTokens: 2000,
          temperature: 0.7,
        },
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      const text = response.text();
      if (text && text.trim().length > 0) {
        return text;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Trợ lý Gia đình API] Model ${modelName} gặp lỗi (${err?.status || err?.message}), chuyển model dự phòng tiếp theo...`);
      // Đợi 250ms giảm xung đột nếu server Google đang tạm bận (503/429)
      await new Promise(resolve => setTimeout(resolve, 250));
      continue;
    }
  }

  throw new Error(`Không thể kết nối Trợ lý Gia đình: ${(lastError as Error)?.message || 'Máy chủ AI đang bận, vui lòng thử lại sau giây lát.'}`);
};

/**
 * AI Gemini: Phân tích sâu Phân bổ Ngân Sách 4 Trụ Cột (Hạnh phúc - An toàn - Đón con - Đầu tư)
 */
export const analyzeBudgetWithGemini = async (
  apiKey: string,
  state: AppState,
  targetIncome: number,
  notes?: string
): Promise<string> => {
  const prompt = `Gia đình chúng tôi có mức thu nhập quan sát tháng này là **${targetIncome} triệu VNĐ**.
Chi phí cố định tiền thuê nhà: **9 triệu VNĐ/tháng**.
Gia đình đang trong giai đoạn đặc biệt: **Chuẩn bị kế hoạch đón thiên thần nhỏ (em bé)**.
${notes ? `Yêu cầu thêm từ vợ chồng tôi: "${notes}"` : ''}

Hãy đưa ra lời tư vấn cụ thể, rõ ràng, sâu sắc theo mô hình **4 Trụ Cột Hạnh Phúc Chuẩn Quốc Tế**:
1. **Trụ cột 1: Chi phí Thiết yếu (~25% = ${(targetIncome * 0.25).toFixed(1)} tr)**
   - Bảo đảm tiền thuê nhà 9 triệu.
   - Ngân sách ăn uống dinh dưỡng thực phẩm sạch bồi bổ sức khỏe cho mẹ bầu tương lai.
2. **Trụ cột 2: Kết nối & Giữ lửa Hôn nhân (~12.5% = ${(targetIncome * 0.125).toFixed(1)} tr)**
   - Hẹn hò lãng mạn cuối tuần, quỹ du lịch nghỉ dưỡng (Babymoon) và hiếu kính cha mẹ.
3. **Trụ cột 3: Quỹ Đón Con & Dự Phòng An Toàn (~20% = ${(targetIncome * 0.20).toFixed(1)} tr)**
   - Quỹ Chào Đời (8-10 tr/tháng tích lũy cho viện quốc tế, đồ sơ sinh, vắc-xin).
   - Quỹ Y tế & khẩn cấp bảo vệ mẹ và bé.
4. **Trụ cột 4: Đầu tư Tích sản Bền vững (~42.5% = ${(targetIncome * 0.425).toFixed(1)} tr)**
   - Đầu tư dài hạn tạo lãi kép tự do tài chính, tuyệt đối an tâm, không phải rút non.

Vui lòng viết lời khuyên bằng tiếng Việt, phân tích rành mạch từng số tiền, kèm lời chúc ấm áp gửi tới hai vợ chồng!`;

  return generateGeminiContentWithFallback(apiKey, buildSystemContext(state), prompt);
};

/**
 * AI Gemini: Tư vấn cấu trúc Trả góp Khoản chi lớn an toàn
 */
export const analyzeExpenseFinancingWithGemini = async (
  apiKey: string,
  state: AppState,
  expenseName: string,
  amount: number,
  availableLiquidity: number,
  monthlySurplus: number
): Promise<string> => {
  const prompt = `Gia đình chúng tôi đang cân nhắc một khoản chi lớn: **"${expenseName}"** với tổng chi phí **${amount} triệu VNĐ**.
Dữ liệu tài chính hiện tại của gia đình:
- Thanh khoản an toàn hiện có: **${availableLiquidity} triệu VNĐ**.
- Dòng tiền thặng dư hàng tháng trung bình: **${monthlySurplus} triệu VNĐ/tháng**.

Hãy giúp hai vợ chồng tôi:
1. **Đánh giá tính khả thi:** Gia đình có nên thực hiện khoản chi này vào thời điểm này không?
2. **Đề xuất cấu trúc chi trả tối ưu:** 
   - Trả trước (upfront): Bao nhiêu triệu từ quỹ thanh khoản dư mà không làm thủng sàn khẩn cấp 3 tháng?
   - Trả góp (monthly payment): Chia đều trong bao nhiêu tháng và mỗi tháng trích bao nhiêu triệu từ thặng dư để cuộc sống vẫn thoải mái?
3. **Lời khuyên tài chính:** Cách quản lý dòng tiền để không bị áp lực nợ nần sau khi mua sắm.`;

  return generateGeminiContentWithFallback(apiKey, buildSystemContext(state), prompt);
};

/**
 * Offline Smart Advisor: Thuật toán AI nội tại thông minh, tức thì, bảo mật 100%
 */
export interface SmartAllocationOfflineResult {
  goc_phan_bo: number;
  thang_du: number;
  benchmarks: {
    muc_tieu_tu_do_tai_chinh: number;
    dau_tu_de_xuat: number;
    quy_khan_cap_can: number;
    chi_phi_thiet_yeu_de_xuat: number;
  };
  canh_bao: {
    muc_do: 'cao' | 'trung_binh' | 'thong_tin';
    tieu_de: string;
    noi_dung: string;
    de_xuat_hanh_dong: string;
  }[];
  de_xuat_phan_bo: {
    needs: { percent: number; amount: number; label: string; details: string };
    romance_family: { percent: number; amount: number; label: string; details: string };
    baby_reserve: { percent: number; amount: number; label: string; details: string };
    investment: { percent: number; amount: number; label: string; details: string };
    ly_do: string;
  };
  // Mapping tương thích để bấm nút "Áp dụng vào Cây Ngân Sách"
  targetGroupRatios: Record<string, number>;
  tong_ket: string;
}

export const analyzeAllocationOffline = (
  inputData: {
    thu_nhap_du_phong: number;
    goc_phan_bo: number;
    cay_ngan_sach: { ten_muc: string; ty_le_phan_tram: number; so_tien: number; classification?: string }[];
    chi_phi_hang_thang: number;
    current_liquidity: number;
    hasBabyPlan?: boolean;
    housingCost?: number; // Tiền nhà cố định, mặc định 9tr nếu có
  }
): SmartAllocationOfflineResult => {
  const { thu_nhap_du_phong, goc_phan_bo, current_liquidity } = inputData;
  const income = goc_phan_bo > 0 ? goc_phan_bo : (thu_nhap_du_phong > 0 ? thu_nhap_du_phong : 80);
  const housingCost = inputData.housingCost || 9; // 9 triệu cố định
  const monthlyExpenseEst = Math.max(inputData.chi_phi_hang_thang, 25); // Ước tính sinh hoạt chuẩn

  const benchmarks = {
    muc_tieu_tu_do_tai_chinh: income * 300,
    dau_tu_de_xuat: income * 0.40, // 40% đầu tư bền vững
    quy_khan_cap_can: monthlyExpenseEst * 3, // Sàn 3 tháng
    chi_phi_thiet_yeu_de_xuat: income * 0.25 // 25% thiết yếu
  };

  const canh_bao: SmartAllocationOfflineResult['canh_bao'] = [];

  // 1. Kiểm tra tiền thuê nhà
  const housingRatio = (housingCost / income) * 100;
  if (housingRatio > 25) {
    canh_bao.push({
      muc_do: 'trung_binh',
      tieu_de: 'Tỷ trọng chi phí nhà ở',
      noi_dung: `Tiền thuê nhà hiện tại (${housingCost} triệu) chiếm ${housingRatio.toFixed(1)}% thu nhập.`,
      de_xuat_hanh_dong: 'Nên kiểm soát các chi phí sinh hoạt điện nước khác để tổng chi phí thiết yếu không vượt quá 35%.'
    });
  } else {
    canh_bao.push({
      muc_do: 'thong_tin',
      tieu_de: 'Chi phí nhà ở an toàn',
      noi_dung: `Tiền thuê nhà ${housingCost} triệu chiếm ${housingRatio.toFixed(1)}% thu nhập, đạt tỷ lệ vàng theo chuẩn quốc tế (<20%).`,
      de_xuat_hanh_dong: 'Duy trì sự ổn định không gian sống thoải mái để giữ gìn sức khỏe gia đình.'
    });
  }

  // 2. Kiểm tra thanh khoản khẩn cấp
  if (current_liquidity < benchmarks.quy_khan_cap_can) {
    canh_bao.push({
      muc_do: 'cao',
      tieu_de: 'Củng cố Quỹ Khẩn Cấp',
      noi_dung: `Thanh khoản hiện tại (${formatTableMoneyVNDMillionOffline(current_liquidity)}) dưới mức sàn an toàn 3 tháng (${formatTableMoneyVNDMillionOffline(benchmarks.quy_khan_cap_can)}).`,
      de_xuat_hanh_dong: 'Ưu tiên trích lập quỹ khẩn cấp trước khi dồn quá nhiều tiền vào các kênh đầu tư khó thanh khoản.'
    });
  }

  // 3. Kế hoạch đón con
  canh_bao.push({
    muc_do: 'thong_tin',
    tieu_de: 'Chuẩn bị chào đón thiên thần nhỏ',
    noi_dung: 'Gia đình đang chuẩn bị đón bé, cần thiết lập riêng Quỹ Chào Đời (8-10 triệu/tháng) tích lũy trong 12 tháng.',
    de_xuat_hanh_dong: 'Trích riêng quỹ này để chi trả viện phí quốc tế, đồ dùng sơ sinh và vắc-xin mà không chạm vào tiền đầu tư.'
  });

  // TÍNH TOÁN CƠ CẤU 4 TRỤ CỘT HẠNH PHÚC & BỀN VỮNG (Chuẩn 100%)
  // - Thiết yếu (Needs): 25% (gồm thuê nhà 9tr + ăn uống dinh dưỡng bồi bổ)
  // - Cảm xúc & Gia đình (Wants & Connection): 12.5% (hẹn hò, du lịch, gắn kết cha mẹ)
  // - Dự phòng & Đón con (Safety & Baby): 20% (Quỹ đón con 10% + Dự phòng y tế 10%)
  // - Đầu tư bền vững (Sustainable Wealth): 42.5% (tích sản tự do tài chính)
  const needsPercent = 25.0;
  const romancePercent = 12.5;
  const babyReservePercent = 20.0;
  const investmentPercent = 42.5;

  const de_xuat_phan_bo = {
    needs: {
      percent: needsPercent,
      amount: (income * needsPercent) / 100,
      label: 'Chi phí Thiết yếu',
      details: `Gồm tiền thuê nhà (${housingCost}tr) + Ăn uống dinh dưỡng, di chuyển, điện nước.`
    },
    romance_family: {
      percent: romancePercent,
      amount: (income * romancePercent) / 100,
      label: 'Hạnh phúc & Yêu thương',
      details: 'Hẹn hò cuối tuần vợ chồng, tích lũy du lịch nghỉ dưỡng và hiếu kính cha mẹ.'
    },
    baby_reserve: {
      percent: babyReservePercent,
      amount: (income * babyReservePercent) / 100,
      label: 'Đón con & Dự phòng an toàn',
      details: 'Quỹ Chào Đời cho bé (sinh viện quốc tế, đồ sơ sinh) + Quỹ Y tế, khẩn cấp.'
    },
    investment: {
      percent: investmentPercent,
      amount: (income * investmentPercent) / 100,
      label: 'Đầu tư Bền vững',
      details: 'Tích sản dài hạn tạo lãi kép tự do tài chính, an tâm không lo rút non.'
    },
    ly_do: 'Mô hình cân bằng chuẩn quốc tế: Sống thoải mái hôm nay, chuẩn bị chu đáo nhất cho con, và tài sản vẫn tăng trưởng vượt trội.'
  };

  // Tỷ lệ ánh xạ tương ứng vào cây ngân sách mặc định
  const targetGroupRatios: Record<string, number> = {
    'housing_basic': 25.0,     // Chi phí cần thiết
    'family_experience': 7.0,   // Kết nối & Yêu thương
    'wants': 5.5,               // Chi phí không cần thiết / Tận hưởng
    'safety_reserve': 10.0,     // Dự phòng y tế & khẩn cấp
    'baby_fund': 10.0,          // Quỹ các em bé đáng géc
    'future_investing': 42.5,   // Đầu tư
  };

  return {
    goc_phan_bo: income,
    thang_du: 0,
    benchmarks,
    canh_bao,
    de_xuat_phan_bo,
    targetGroupRatios,
    tong_ket: `Dựa trên thu nhập ${income} triệu và tiền nhà cố định ${housingCost} triệu, AI đề xuất cấu trúc "Hạnh phúc & Đón con": Dành trọn vẹn 37.5% cho cuộc sống gia đình ấm cúng, 20% sẵn sàng cho bé chào đời và duy trì 42.5% đầu tư tích sản tăng trưởng vững vàng.`
  };
};
