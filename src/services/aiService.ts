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

export const analyzeAllocationOffline = (
  inputData: {
    thu_nhap_du_phong: number;
    goc_phan_bo: number;
    cay_ngan_sach: any[];
    chi_phi_hang_thang: number;
  }
) => {
  const { thu_nhap_du_phong, goc_phan_bo, cay_ngan_sach, chi_phi_hang_thang } = inputData;
  const thang_du = Math.max(0, thu_nhap_du_phong - goc_phan_bo);

  const benchmarks = {
    muc_tieu_tu_do_tai_chinh: thu_nhap_du_phong * 300,
    dau_tu_toi_thieu: goc_phan_bo * 0.20,
    quy_khan_cap_can: chi_phi_hang_thang * 3,
    chi_phi_toi_da: goc_phan_bo * 0.50
  };

  const canh_bao: any[] = [];
  let totalPercent = 0;
  let allGood = true;

  cay_ngan_sach.forEach(item => {
    const percent = item.ty_le_phan_tram;
    totalPercent += percent;
    const name = item.ten_muc.toLowerCase();

    if (name.includes('sinh hoạt') || name.includes('thiết yếu') || name.includes('cố định')) {
      if (percent > 50) {
        allGood = false;
        canh_bao.push({
          muc_do: 'cao',
          tieu_de: 'Chi phí sinh hoạt quá cao',
          noi_dung: `Chi phí thiết yếu đang chiếm ${percent.toFixed(1)}%, vượt ngưỡng an toàn khuyến nghị 50%.`,
          de_xuat_hanh_dong: 'Cân nhắc cắt giảm các khoản chi tiêu không cần thiết hoặc tối ưu hóa chi phí cố định.'
        });
      }
    }

    if (name.includes('đầu tư') || name.includes('tích lũy')) {
      if (percent < 20) {
        allGood = false;
        canh_bao.push({
          muc_do: 'trung_binh',
          tieu_de: 'Tỷ lệ đầu tư thấp',
          noi_dung: `Đầu tư hiện tại chỉ ${percent.toFixed(1)}%, dưới mức tối thiểu 20% để đạt tự do tài chính đúng lộ trình.`,
          de_xuat_hanh_dong: 'Cố gắng trích lập thêm quỹ đầu tư ngay khi nhận lương (Pay Yourself First).'
        });
      }
    }
  });

  if (Math.abs(totalPercent - 100) > 0.1) {
    allGood = false;
    canh_bao.push({
      muc_do: 'cao',
      tieu_de: 'Cấu hình tỷ lệ lỗi',
      noi_dung: `Cây ngân sách đang phân bổ ${totalPercent.toFixed(1)}%, chưa khớp 100% Gốc phân bổ.`,
      de_xuat_hanh_dong: 'Vào cấu hình Cây ngân sách để điều chỉnh lại tổng tỷ lệ các quỹ về chuẩn 100%.'
    });
  }

  // Chú ý: Ở hệ thống offline này, ta không có số dư hiện tại của quỹ khẩn cấp trực tiếp,
  // nhưng nếu cần ta có thể mô phỏng hoặc dựa trên đầu vào tỷ lệ, hiện tại ta chỉ tạo cảnh báo nếu không có quỹ này trong budget.
  const hasEmergency = cay_ngan_sach.some(item => item.ten_muc.toLowerCase().includes('khẩn cấp') || item.ten_muc.toLowerCase().includes('dự phòng'));
  if (!hasEmergency) {
    allGood = false;
    canh_bao.push({
      muc_do: 'trung_binh',
      tieu_de: 'Thiếu quỹ dự phòng',
      noi_dung: `Ngân sách chưa có khoản mục cho quỹ khẩn cấp. Bạn cần chuẩn bị tối thiểu ${formatTableMoneyVNDMillionOffline(benchmarks.quy_khan_cap_can)} (3 tháng chi phí).`,
      de_xuat_hanh_dong: 'Tạo một mục dự phòng/khẩn cấp trong cây ngân sách để tích lũy dần.'
    });
  }

  if (thang_du > 0) {
    canh_bao.push({
      muc_do: 'thong_tin',
      tieu_de: 'Tối ưu hóa thặng dư',
      noi_dung: `Bạn đang có dư ${formatTableMoneyVNDMillionOffline(thang_du)}, số tiền này có thể bị hao hụt nếu để không.`,
      de_xuat_hanh_dong: 'Có thể chuyển ngay thặng dư này sang Quỹ tích lũy hoặc Đầu tư qua chức năng Điều chuyển dòng tiền.'
    });
  }

  return {
    goc_phan_bo,
    thang_du,
    benchmarks,
    canh_bao: canh_bao.sort((a, b) => {
      const rank = { cao: 0, trung_binh: 1, thong_tin: 2 };
      return rank[a.muc_do as keyof typeof rank] - rank[b.muc_do as keyof typeof rank];
    }).slice(0, 3), // Lấy top 3
    tong_ket: allGood ? 
      "Xin chúc mừng! Cơ cấu phân bổ ngân sách của bạn đang đạt mức tối ưu theo các quy chuẩn tài chính cá nhân. Hãy tiếp tục duy trì kỷ luật này nhé." : 
      "Dựa trên các chuẩn mực tài chính, dòng tiền của bạn cần được tinh chỉnh đôi chút để tối ưu hóa khả năng tích lũy và phòng vệ rủi ro. Hãy xem các cảnh báo bên dưới."
  };
};

function formatTableMoneyVNDMillionOffline(amount: number): string {
  if (amount >= 1000) {
    return (amount / 1000).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + ' Tỷ';
  }
  return amount.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + ' Tr';
}
