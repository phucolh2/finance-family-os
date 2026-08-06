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
    cay_ngan_sach: { ten_muc: string; ty_le_phan_tram: number; so_tien: number; classification?: string }[];
    chi_phi_hang_thang: number;
    current_liquidity: number;
  }
) => {
  const { thu_nhap_du_phong, goc_phan_bo, cay_ngan_sach, chi_phi_hang_thang, current_liquidity } = inputData;
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

  let totalExpense = 0;
  let totalInvestment = 0;

  let totalSavings = 0;
  let totalReserve = 0;

  cay_ngan_sach.forEach(item => {
    const percent = item.ty_le_phan_tram;
    totalPercent += percent;
    
    // Nếu không có phân loại cứng thì tự đoán dựa trên tên
    const cls = item.classification || (
      item.ten_muc.toLowerCase().includes('sinh hoạt') || item.ten_muc.toLowerCase().includes('thiết yếu') ? 'expense' :
      item.ten_muc.toLowerCase().includes('đầu tư') || item.ten_muc.toLowerCase().includes('tích lũy') ? 'investment' :
      item.ten_muc.toLowerCase().includes('tiết kiệm') ? 'savings' : 'debt_reserve'
    );

    if (cls === 'expense') totalExpense += percent;
    if (cls === 'investment') totalInvestment += percent;
    if (cls === 'savings') totalSavings += percent;
    if (cls === 'debt_reserve') totalReserve += percent;
  });

  if (totalExpense > 50) {
    allGood = false;
    canh_bao.push({
      muc_do: 'cao',
      tieu_de: 'Chi phí sinh hoạt quá cao',
      noi_dung: `Chi phí thiết yếu đang phân bổ chiếm ${totalExpense.toFixed(1)}%, vượt ngưỡng an toàn khuyến nghị 50%.`,
      de_xuat_hanh_dong: 'Cân nhắc cắt giảm các khoản chi tiêu không cần thiết hoặc tối ưu hóa chi phí cố định.'
    });
  }

  if (totalInvestment < 20) {
    allGood = false;
    canh_bao.push({
      muc_do: 'trung_binh',
      tieu_de: 'Tỷ lệ đầu tư thấp',
      noi_dung: `Đầu tư hiện tại chỉ phân bổ ${totalInvestment.toFixed(1)}%, dưới mức tối thiểu 20% để đạt tự do tài chính đúng lộ trình.`,
      de_xuat_hanh_dong: 'Cố gắng trích lập thêm quỹ đầu tư ngay khi nhận lương (Pay Yourself First).'
    });
  }

  if (Math.abs(totalPercent - 100) > 0.1) {
    allGood = false;
    canh_bao.push({
      muc_do: 'cao',
      tieu_de: 'Cấu hình tỷ lệ lỗi',
      noi_dung: `Cây ngân sách đang phân bổ ${totalPercent.toFixed(1)}%, chưa khớp 100% Gốc phân bổ.`,
      de_xuat_hanh_dong: 'Vào cấu hình Cây ngân sách để điều chỉnh lại tổng tỷ lệ các quỹ về chuẩn 100%.'
    });
  }

  if (current_liquidity < benchmarks.quy_khan_cap_can) {
    allGood = false;
    canh_bao.push({
      muc_do: 'trung_binh',
      tieu_de: 'Số dư quỹ khẩn cấp thấp',
      noi_dung: `Thanh khoản thực tế tích lũy của bạn là ${formatTableMoneyVNDMillionOffline(current_liquidity)}, chưa đạt mức tối thiểu an toàn (${formatTableMoneyVNDMillionOffline(benchmarks.quy_khan_cap_can)} - 3 tháng chi phí).`,
      de_xuat_hanh_dong: 'Ưu tiên dùng tiền dư và tăng tỷ lệ phân bổ vào quỹ Dự phòng trước khi đầu tư rủi ro.'
    });
    if (totalSavings + totalReserve === 0) {
      canh_bao.push({
        muc_do: 'cao',
        tieu_de: 'Thiếu trích lập dự phòng',
        noi_dung: `Bạn đang thiếu tiền dự phòng nhưng Cây ngân sách lại đang trích 0% cho Tiết kiệm/Dự phòng.`,
        de_xuat_hanh_dong: 'Chỉnh sửa Cây ngân sách ngay để tự động chảy tiền vào quỹ Khẩn cấp hàng tháng.'
      });
    }
  } else if (current_liquidity < chi_phi_hang_thang * 6) {
    canh_bao.push({
      muc_do: 'thong_tin',
      tieu_de: 'Tối ưu số dư dự phòng',
      noi_dung: `Quỹ khẩn cấp đã qua mức tối thiểu nhưng chưa đạt mức lý tưởng 6 tháng (${formatTableMoneyVNDMillionOffline(chi_phi_hang_thang * 6)}).`,
      de_xuat_hanh_dong: 'Nên trích một phần thặng dư để tiếp tục bồi đắp quỹ này cho an tâm tuyệt đối.'
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

  let idealExpense = 50;
  let idealInvestment = 30;
  let idealSavings = 10;
  let idealReserve = 10;
  let reason = "Mô hình Tự do Tài chính (FIRE) tối ưu: Giữ chi phí cơ bản ở mức 50%, dành 10% Tiết kiệm phòng rủi ro, 10% Dự phòng hưởng thụ/cơ hội. Quan trọng nhất: Dồn tối đa 30% (thay vì 20% tối thiểu) vào Đầu tư để tăng tốc độ đạt Tự do tài chính.";

  const de_xuat_phan_bo = {
    expense: { percent: idealExpense, amount: goc_phan_bo * idealExpense / 100 },
    investment: { percent: idealInvestment, amount: goc_phan_bo * idealInvestment / 100 },
    savings: { percent: idealSavings, amount: goc_phan_bo * idealSavings / 100 },
    reserve: { percent: idealReserve, amount: goc_phan_bo * idealReserve / 100 },
    ly_do: reason
  };

  return {
    goc_phan_bo,
    thang_du,
    benchmarks,
    canh_bao: canh_bao.sort((a, b) => {
      const rank = { cao: 0, trung_binh: 1, thong_tin: 2 };
      return rank[a.muc_do as keyof typeof rank] - rank[b.muc_do as keyof typeof rank];
    }).slice(0, 3), // Lấy top 3
    de_xuat_phan_bo,
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
