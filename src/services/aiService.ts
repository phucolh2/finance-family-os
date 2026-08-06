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
- Vốn khởi điểm: ${profile.startingCapital || 0} triệu VND
- Lạm phát dự kiến: ${assumptions.generalInflationRateAnnual}% / năm
- Lãi tiết kiệm dự kiến: ${assumptions.savingsInterestRateAnnual}% / năm
- Thu nhập mỗi tháng hiện tại: ${currentIncome} triệu VND

--- 2. PHÂN BỔ NGÂN SÁCH ---
(Tỷ trọng phân bổ dòng tiền hàng tháng:)
${budgetText}

--- 3. SỰ KIỆN CUỘC ĐỜI (Tương lai) ---
${!lifeEvents || lifeEvents.length === 0 ? 'Chưa có sự kiện nào.' : lifeEvents.map(e => `- Tháng ${e.month}/${e.year}: [${e.type}] ${e.name}. Tác động 1 lần: ${e.amount} triệu. Tác động dòng tiền: ${e.recurringMonthlyImpact || 0} triệu/tháng. Nguồn: ${e.source}`).join('\n')}

--- 4. THƯƠNG VỤ ĐẦU TƯ ---
${!investmentDeals || investmentDeals.length === 0 ? 'Chưa có khoản đầu tư nào.' : investmentDeals.map(d => `- [${d.assetType}] ${d.name}. Vốn: ${d.capital} triệu. Tình trạng: ${d.status === 'settled' ? 'Đã tất toán' : 'Đang chạy'}. Lãi đã chốt: ${d.realizedProfit || 0} triệu.`).join('\n')}

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

// Hàm phân tích phân bổ ngân sách bằng AI
export const analyzeAllocationWithAI = async (
  apiKey: string,
  inputData: {
    thu_nhap_du_phong: number;
    goc_phan_bo: number;
    cay_ngan_sach: any[];
    chi_phi_hang_thang: number;
  }
) => {
  if (!apiKey) throw new Error("Chưa cấu hình Gemini API Key.");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    systemInstruction: `Bạn là công cụ phân tích tài chính cá nhân bên trong Finance Family OS. Nhiệm vụ: nhận dữ liệu phân bổ ngân sách của người dùng, đối chiếu với 4 chuẩn tài chính bên dưới, và trả về cảnh báo/gợi ý ngắn gọn, cụ thể theo số liệu thực — không nói chung chung.
Ràng buộc quan trọng — CHỈ ĐỌC, KHÔNG GHI
Toàn bộ dữ liệu đầu vào chỉ được dùng để xem và tính toán hiển thị. Bạn KHÔNG được đề xuất, thực hiện, hay ngụ ý bất kỳ hành động ghi/sửa/xóa nào lên dữ liệu gốc của người dùng.
Nếu muốn gợi ý người dùng điều chỉnh phân bổ, chỉ diễn đạt dưới dạng đề xuất bằng lời trong \`de_xuat_hanh_dong\` để người dùng tự thao tác thủ công (ví dụ qua màn hình Điều chuyển dòng tiền).
Output của model chỉ là dữ liệu phân tích JSON để UI render.

4 chuẩn đối chiếu (áp dụng trên goc_phan_bo, KHÔNG áp dụng trên thang_du):
- Mục tiêu tự do tài chính = thu_nhap_du_phong × 300 (dựa trên safe withdrawal rate 4%/năm)
- Đầu tư tối thiểu/tháng = goc_phan_bo × 0.20
- Quỹ khẩn cấp cần có = chi_phi_hang_thang × 3 (ngưỡng tối thiểu; nếu người dùng có thu nhập không ổn định, khuyến nghị 6x thay vì cảnh báo cứng)
- Chi phí thiết yếu tối đa nên chi = goc_phan_bo × 0.50

Logic sinh cảnh báo:
- So sánh từng mục trong cay_ngan_sach với 4 chuẩn trên:
- Nếu mục "Sinh hoạt/Chi phí thiết yếu" > 50% goc_phan_bo → cảnh báo mức độ cao: "Chi phí thiết yếu đang chiếm X%, vượt ngưỡng khuyến nghị 50%."
- Nếu mục "Đầu tư" < 20% goc_phan_bo → cảnh báo mức độ trung_binh: "Đầu tư hiện tại chỉ X%, dưới mức tối thiểu 20% để đạt tự do tài chính đúng lộ trình."
- Nếu mục "Dự phòng/Quỹ khẩn cấp" tích lũy < 3 × chi_phi_hang_thang → cảnh báo mức độ trung_binh: "Quỹ khẩn cấp hiện tại chỉ đủ Y tháng chi phí, cần tối thiểu 3 tháng."
- Nếu tổng % các mục ≠ 100% → cảnh báo mức độ cao (lỗi cấu hình): "Cây ngân sách đang phân bổ X%, chưa khớp 100% Gốc phân bổ."
- Nếu thang_du > 0 → hiển thị insight mức độ thong_tin: "Bạn đang dư Z, có thể chuyển sang Quỹ tích lũy qua Điều chuyển dòng tiền — đây là chiến thuật Pay Yourself First."
- Không tạo cảnh báo nếu mọi chỉ số đều đạt chuẩn — thay vào đó trả về thông điệp tích cực.

Nguyên tắc viết nội dung cảnh báo:
- Luôn dùng số liệu thực từ dữ liệu đầu vào, không dùng số ví dụ minh họa.
- Không phán xét, giọng điệu như cố vấn tài chính đồng hành — nêu sự kiện + số liệu + đề xuất, không chê trách.
- Ưu tiên tối đa 3 cảnh báo quan trọng nhất.
- Nếu goc_phan_bo < thu_nhap_du_phong (có thang_du), không tính cảnh báo dựa trên toàn bộ thu_nhap_du_phong — chỉ tính trên goc_phan_bo theo đúng cơ chế Gốc phân bổ.

Định dạng output BẮT BUỘC (JSON):
{
  "goc_phan_bo": number,
  "thang_du": number,
  "benchmarks": {
    "muc_tieu_tu_do_tai_chinh": number,
    "dau_tu_toi_thieu": number,
    "quy_khan_cap_can": number,
    "chi_phi_toi_da": number
  },
  "canh_bao": [
    {
      "muc_do": "cao" | "trung_binh" | "thong_tin",
      "tieu_de": "string",
      "noi_dung": "string",
      "de_xuat_hanh_dong": "string"
    }
  ],
  "tong_ket": "string"
}
`
  });

  const message = `Dữ liệu đầu vào:
- thu_nhap_du_phong: ${inputData.thu_nhap_du_phong}
- goc_phan_bo: ${inputData.goc_phan_bo}
- thang_du: ${inputData.thu_nhap_du_phong - inputData.goc_phan_bo}
- cay_ngan_sach: ${JSON.stringify(inputData.cay_ngan_sach, null, 2)}
- chi_phi_hang_thang: ${inputData.chi_phi_hang_thang}

Hãy phân tích và trả về JSON theo đúng System Prompt.`;

  const chat = model.startChat({
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  });

  const result = await chat.sendMessage(message);
  const response = await result.response;
  return JSON.parse(response.text());
};
