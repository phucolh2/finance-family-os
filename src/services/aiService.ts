import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AppState } from '../types/finance';

// Helper format tiền tệ tiếng Việt
export function formatTableMoneyVNDMillionOffline(amount: number): string {
  if (amount >= 1000) {
    return (amount / 1000).toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + ' Tỷ';
  }
  return amount.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + ' Tr';
}

// Hàm dịch toàn bộ dữ liệu AppContext thành Markdown Prompt cho AI
export const buildSystemContext = (state: AppState): string => {
  const { profile, incomeSchedule, budgetSchedule, lifeEvents, investmentDeals, assumptions } = state;

  const currentIncome = incomeSchedule.length > 0 ? incomeSchedule[0].incomeMonthly : 80;
  const currentBudget = budgetSchedule.length > 0 ? budgetSchedule[0] : null;

  let budgetText = '';
  if (currentBudget && currentBudget.rootGroups) {
    budgetText = currentBudget.rootGroups
      .map(group => `- ${group.name}: ${group.ratioPercent}%`)
      .join('\n');
  }

  return `Bạn là "Finance Family OS AI Advisor" - Chuyên gia hoạch định tài chính gia đình cao cấp (Certified Financial Planner - CFP) kiêm Cố vấn hạnh phúc gia đình.
Nhiệm vụ của bạn là tư vấn phân bổ ngân sách và dòng tiền một cách thông minh, cân bằng giữa:
1. Hạnh phúc & Thoải mái hiện tại (Ăn uống dinh dưỡng, hẹn hò vợ chồng, du lịch, hiếu kính cha mẹ).
2. Dự phòng an toàn & Chào đón thiên thần nhỏ (Quỹ thai sản, tiêm chủng, bảo hiểm y tế).
3. Đầu tư tích sản dài hạn bền vững (Tự do tài chính, không đầu tư mạo hiểm khi chuẩn bị sinh nở).

DƯỚI ĐÂY LÀ BỨC TRANH TÀI CHÍNH CỦA GIA ĐÌNH:
- Vốn khởi điểm: ${profile?.startingCapital || 0} triệu VNĐ
- Thu nhập hàng tháng: ${currentIncome} triệu VNĐ
- Tiền thuê nhà cố định: Khoảng 9 triệu VNĐ/tháng
- Lạm phát dự kiến: ${assumptions.generalInflationRateAnnual}% / năm
- Lãi suất kỳ vọng: ${assumptions.investmentYieldExpectationAnnual}% / năm

CƠ CẤU NGÂN SÁCH HIỆN TẠI:
${budgetText || 'Chưa cấu hình chi tiết.'}

KẾ HOẠCH & SỰ KIỆN TƯƠNG LAI:
${!lifeEvents || lifeEvents.length === 0 ? 'Gia đình đang lên kế hoạch chuẩn bị sinh em bé.' : lifeEvents.map(e => `- ${e.name} (${e.type}): Tháng ${e.month}/${e.year}, Số tiền: ${e.amount} triệu.`).join('\n')}

DANH MỤC TÀI SẢN & ĐẦU TƯ:
${!investmentDeals || investmentDeals.length === 0 ? 'Chưa có khoản đầu tư lớn.' : investmentDeals.map(d => `- [${d.assetType}] ${d.name}: Vốn ${d.capital} triệu.`).join('\n')}

NGUYÊN TẮC TƯ VẤN:
- Giọng văn ấm áp, tôn trọng, gần gũi như một người bạn tri kỷ am hiểu tài chính của gia đình.
- Luôn chỉ ra con số cụ thể (Triệu VNĐ và %).
- Đưa ra lời khuyên thực tế, tránh sáo rỗng.`;
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
  const candidateModels = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];

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

// Hàm gửi tin nhắn tới Gemini API (Copilot Chat)
export const sendChatMessage = async (
  apiKey: string,
  message: string,
  chatHistory: { role: 'user' | 'model'; parts: { text: string }[] }[],
  state: AppState
) => {
  if (!apiKey) throw new Error("Chưa cấu hình Gemini API Key.");

  const cleanKey = apiKey.trim();
  const genAI = new GoogleGenerativeAI(cleanKey);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    systemInstruction: buildSystemContext(state)
  });

  const chat = model.startChat({
    history: chatHistory,
    generationConfig: {
      maxOutputTokens: 1500,
      temperature: 0.7,
    },
  });

  const result = await chat.sendMessage(message);
  const response = await result.response;
  return response.text();
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
