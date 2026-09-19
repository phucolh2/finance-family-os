import type { AppState } from '../../types/finance';

export interface PromptSuggestion {
  id: string;
  label: string;
  prompt: string;
  forceSearch?: boolean;
  tag?: string;
}

// Bảng ánh xạ tên màn hình sang tiếng Việt thân thiện
export const TAB_NAMES: Record<string, string> = {
  dashboard: 'Tổng quan tài chính',
  cashflow: 'Bức tranh tài chính RDPD',
  event_ledger: 'Nhật ký sự kiện & Chung tay',
  income: 'Kế hoạch Thu nhập',
  budget_history: 'Phân Bổ Ngân Sách',
  life_stages: 'Quản lý Chi tiêu',
  portfolio: 'Danh mục Đầu tư',
  debts: 'Quản lý Nợ & Vay',
  debt_management: 'Quản lý Nợ & Vay',
  savings: 'Sổ Tiết kiệm',
  reserves: 'Quỹ Dự phòng Khẩn cấp',
  child_growth: 'Con cái & Gia đình',
  child_cost_estimator: 'Dự toán Chi phí Nuôi con',
  fire: 'Tự Do Tài Chính (FIRE)',
  fire_center: 'Tự Do Tài Chính (FIRE)',
  vacation_planner: 'Kế hoạch Du lịch',
  insurance: 'Quản lý Bảo hiểm',
  health_tracker: 'Sức khỏe & Y tế',
  giving_ledger: 'Quỹ Báo hiếu & Cho đi',
  document_vault: 'Kho tài liệu quan trọng',
  settings: 'Cài đặt hệ thống',
};

/**
 * Tạo danh sách câu hỏi gợi ý thông minh dựa trên:
 * 1. Màn hình người dùng đang đứng (activeTab)
 * 2. Dữ liệu thực tế của gia đình (quỹ sinh con, nợ, số dư tiết kiệm, v.v.)
 */
export function getSmartContextPrompts(activeTab: string = 'dashboard', state: AppState): PromptSuggestion[] {
  const tabName = TAB_NAMES[activeTab] || 'Tổng quan';
  const prompts: PromptSuggestion[] = [];

  // 1. Gợi ý gắn liền với màn hình đang mở (Tab Contextual)
  switch (activeTab) {
    case 'life_stages':
      prompts.push(
        {
          id: 'tab_expense_top',
          label: '🛒 Khoản nào chi nhiều nhất tháng qua?',
          prompt: 'Trong tháng qua, khoản chi tiêu nào của gia đình chiếm tỷ trọng lớn nhất và có vượt định mức ngân sách không?',
          tag: tabName,
        },
        {
          id: 'tab_expense_optimize',
          label: '💡 Cách tối ưu chi phí tháng tới?',
          prompt: 'Dựa vào cơ cấu chi tiêu thực tế, hai vợ chồng có thể cắt giảm hoặc tối ưu khoản nào để tăng tích lũy mà không giảm chất lượng sống?',
          tag: tabName,
        },
        {
          id: 'tab_rent_ratio',
          label: '🏠 Tiền thuê nhà chiếm bao nhiêu %?',
          prompt: 'Chi phí tiền thuê nhà (khoảng 9 triệu/tháng) hiện đang chiếm bao nhiêu % tổng chi tiêu và tổng thu nhập của gia đình?',
          tag: tabName,
        }
      );
      break;

    case 'budget_history':
    case 'cashflow':
      prompts.push(
        {
          id: 'tab_budget_pillars',
          label: '⚖️ Tỷ lệ 4 Trụ Cột tháng này hợp lý chưa?',
          prompt: 'Tỷ lệ phân bổ ngân sách 4 Trụ Cột (Thiết yếu, Tích lũy mục tiêu, Đầu tư, Hưởng thụ) tháng này của gia đình đã cân bằng và tối ưu chưa?',
          tag: tabName,
        },
        {
          id: 'tab_budget_surplus',
          label: '💵 Tháng này thặng dư dòng tiền bao nhiêu?',
          prompt: 'Sau khi trừ hết các chi phí sinh hoạt và các khoản trích quỹ theo kế hoạch, tháng này gia đình còn lại bao nhiêu dòng tiền dôi dư?',
          tag: tabName,
        }
      );
      break;

    case 'portfolio':
      prompts.push(
        {
          id: 'tab_portfolio_alloc',
          label: '📊 Cơ cấu danh mục đầu tư hiện tại?',
          prompt: 'Phân tích giúp tôi cơ cấu danh mục đầu tư hiện tại (Bất động sản, Cổ phiếu, Vàng, Tiền mặt). Tỷ trọng các kênh đã an toàn chưa?',
          tag: tabName,
        },
        {
          id: 'tab_portfolio_perf',
          label: '🚀 Kênh đầu tư nào hiệu quả nhất?',
          prompt: 'Dựa trên các thương vụ đang nắm giữ, kênh đầu tư nào đang đem lại tỷ suất sinh lời tốt nhất cho gia đình?',
          tag: tabName,
        }
      );
      break;

    case 'debts':
    case 'debt_management':
      prompts.push(
        {
          id: 'tab_debt_summary',
          label: '💳 Tổng dư nợ & số tiền trả mỗi tháng?',
          prompt: 'Tổng dư nợ hiện tại của gia đình là bao nhiêu? Mỗi tháng gia đình đang phải trích bao nhiêu tiền để trả gốc và lãi?',
          tag: tabName,
        },
        {
          id: 'tab_debt_strategy',
          label: '⚡ Chiến lược tất toán nợ nhanh nhất?',
          prompt: 'Nên áp dụng chiến lược nào (Tuyết lăn - Snowball hay Lãi cao trước - Avalanche) để gia đình sớm dứt điểm các khoản nợ?',
          tag: tabName,
        }
      );
      break;

    case 'savings':
    case 'reserves':
      prompts.push(
        {
          id: 'tab_reserve_months',
          label: '🛡️ Quỹ dự phòng đủ dùng mấy tháng?',
          prompt: 'Với mức chi phí sinh hoạt hiện tại, Quỹ dự phòng khẩn cấp của gia đình hiện tại đủ duy trì cuộc sống trong bao nhiêu tháng nếu có biến cố?',
          tag: tabName,
        },
        {
          id: 'tab_savings_interest',
          label: '💰 Tối ưu lãi suất các sổ tiết kiệm?',
          prompt: 'Các sổ tiết kiệm hiện có lãi suất ra sao? Khi đáo hạn nên tái tục như thế nào để tối ưu dòng tiền và tiền lãi?',
          tag: tabName,
        }
      );
      break;

    case 'child_growth':
    case 'child_cost_estimator':
      prompts.push(
        {
          id: 'tab_baby_fund_timeline',
          label: '👶 Bao lâu gom đủ quỹ đón em bé?',
          prompt: 'Với tốc độ tích lũy hiện tại, dự kiến bao lâu nữa gia đình tôi gom đủ quỹ đón thiên thần nhỏ (mục tiêu ~80 - 100 triệu)?',
          tag: tabName,
        },
        {
          id: 'tab_baby_cost_search',
          label: '🌐 Chi phí sinh con Vinmec / Từ Dũ?',
          prompt: 'Tra cứu giúp tôi: Chi phí gói sinh trọn gói tại bệnh viện Vinmec hoặc Từ Dũ hiện nay khoảng bao nhiêu và gồm những quyền lợi gì?',
          forceSearch: true,
          tag: 'Tra cứu Internet',
        }
      );
      break;

    case 'fire':
    case 'fire_center':
      prompts.push(
        {
          id: 'tab_fire_target',
          label: '🏖️ Bao lâu vợ chồng tôi đạt FIRE?',
          prompt: 'Dựa trên tài sản ròng, chi phí sinh hoạt và thặng dư tiết kiệm hiện tại, dự kiến bao lâu nữa vợ chồng tôi đạt Tự Do Tài Chính (FIRE)?',
          tag: tabName,
        },
        {
          id: 'tab_fire_speedup',
          label: '⏳ Cách rút ngắn 3-5 năm đạt FIRE?',
          prompt: 'Nếu hai vợ chồng muốn rút ngắn thời gian đạt tự do tài chính thêm 3-5 năm, chúng tôi cần tăng thu nhập hay tối ưu khoản đầu tư nào?',
          tag: tabName,
        }
      );
      break;

    case 'vacation_planner':
      prompts.push(
        {
          id: 'tab_vacation_budget',
          label: '🏖️ Ngân sách du lịch bao nhiêu là hợp lý?',
          prompt: 'Với thu nhập và kế hoạch tài chính gia đình hiện tại, ngân sách cho một chuyến du lịch cả nhà hàng năm nên ở mức bao nhiêu triệu là an toàn?',
          tag: tabName,
        }
      );
      break;

    default:
      // Mặc định tab Dashboard
      prompts.push(
        {
          id: 'tab_general_spent',
          label: '📊 Tháng qua sài nhiêu tiền?',
          prompt: 'Tháng qua vợ chồng tôi đã chi tiêu hết bao nhiêu tiền? Khoản nào chiếm nhiều nhất và có vượt ngân sách không?',
          tag: 'Tổng quan',
        },
        {
          id: 'tab_general_networth',
          label: '💎 Tài sản ròng hiện tại phân bổ ra sao?',
          prompt: 'Tổng tài sản ròng của gia đình hiện tại ước tính bao nhiêu triệu VNĐ và phân bổ giữa tích lũy, đầu tư, nhà ở như thế nào?',
          tag: 'Tài sản',
        }
      );
      break;
  }

  // 2. Gợi ý theo dữ liệu đặc thù của gia đình (Data-Driven Prompts)
  // Nếu có quỹ sinh con hoặc kế hoạch con cái mà chưa có trong danh sách
  const hasBabyFund = state.sinkingFunds?.some(f => f.name.toLowerCase().includes('con') || f.name.toLowerCase().includes('bé'));
  if (hasBabyFund && !prompts.some(p => p.id.includes('baby'))) {
    prompts.push({
      id: 'data_baby_fund',
      label: '👶 Tiến độ Quỹ sinh con thế nào?',
      prompt: 'Tiến độ tích lũy Quỹ sinh con của gia đình hiện tại đang đạt bao nhiêu %, còn thiếu bao nhiêu triệu và dự kiến khi nào đủ?',
      tag: 'Kế hoạch con cái',
    });
  }

  // Nếu có khoản nợ mà chưa có trong danh sách
  const hasDebts = Boolean(state.debts && state.debts.length > 0);
  if (hasDebts && !prompts.some(p => p.id.includes('debt'))) {
    prompts.push({
      id: 'data_debts',
      label: '💳 Kế hoạch trả nợ tối ưu?',
      prompt: 'Phân tích các khoản nợ hiện có của gia đình và gợi ý kế hoạch trả nợ tối ưu nhất để giảm tiền lãi phải trả.',
      tag: 'Nợ & Vay',
    });
  }

  // Luôn bổ sung câu hỏi FIRE nếu chưa có
  if (!prompts.some(p => p.id.includes('fire'))) {
    prompts.push({
      id: 'general_fire',
      label: '🏖️ Bao lâu tự do tài chính (FIRE)?',
      prompt: 'Dựa trên tài sản ròng và thặng dư tiết kiệm hiện tại, dự kiến bao lâu nữa vợ chồng tôi đạt Tự Do Tài Chính (FIRE)?',
      tag: 'Tương lai',
    });
  }

  // Luôn có 1 câu hỏi tra cứu Internet thông minh (bắt buộc forceSearch = true để tránh dữ liệu lỗi thời)
  if (!prompts.some(p => p.forceSearch)) {
    prompts.push({
      id: 'general_search_gold_rates',
      label: '🌐 Giá vàng & lãi suất hôm nay (thời gian thực)',
      prompt: 'Tra cứu ngay giá vàng SJC và vàng nhẫn 9999 hôm nay tại Việt Nam (mua vào/bán ra), đồng thời cho biết lãi suất tiết kiệm tốt nhất tại các ngân hàng lớn hiện nay là bao nhiêu?',
      forceSearch: true,
      tag: 'Tra cứu thời gian thực',
    });
  }

  return prompts.slice(0, 5);
}

/**
 * Bóc tách câu hỏi gợi mở tiếp theo từ phản hồi của Gemini
 * Mẫu thẻ:
 * [GỢI Ý TIẾP THEO]
 * - Câu hỏi 1
 * - Câu hỏi 2
 * - Câu hỏi 3
 */
export function extractFollowUpQuestions(text: string): { cleanText: string; followUps: string[] } {
  if (!text) return { cleanText: '', followUps: [] };

  const marker = '[GỢI Ý TIẾP THEO]';
  const markerIndex = text.indexOf(marker);

  if (markerIndex === -1) {
    return { cleanText: text.trim(), followUps: [] };
  }

  const cleanText = text.substring(0, markerIndex).trim();
  const suggestionsPart = text.substring(markerIndex + marker.length);

  const followUps = suggestionsPart
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('- ') || line.startsWith('* ') || /^\d+[\.\)]\s+/.test(line))
    .map(line => line.replace(/^[-*]\s+|\d+[\.\)]\s+/, '').replace(/^\[|\]$/g, '').trim())
    .filter(line => line.length > 5 && !line.includes('---'));

  return { cleanText, followUps: followUps.slice(0, 3) };
}

/**
 * Dự phòng câu hỏi gợi mở thông minh theo từ khóa trong câu hỏi gần nhất của người dùng
 */
export function getFallbackFollowUps(lastUserQuestion: string): string[] {
  const q = (lastUserQuestion || '').toLowerCase();

  if (q.includes('chi tiêu') || q.includes('sài') || q.includes('tiêu') || q.includes('tiền')) {
    return [
      '💡 Có cách nào tối ưu chi phí nhà ở & sinh hoạt tháng tới không?',
      '📊 Tháng qua gia đình có bị vượt định mức ngân sách không?',
      '📈 Dự báo chi tiêu 3 tháng tới của gia đình sẽ như thế nào?',
    ];
  }

  if (q.includes('con') || q.includes('bé') || q.includes('sinh')) {
    return [
      '🍼 Chi phí nuôi con trong năm đầu tiên ước tính khoảng bao nhiêu?',
      '⚡ Nếu tăng mức trích thêm 5 triệu/tháng thì bao lâu gom đủ quỹ?',
      '🌐 Chi phí gói sinh nở trọn gói tại Từ Dũ hoặc Vinmec hiện nay?',
    ];
  }

  if (q.includes('fire') || q.includes('tự do') || q.includes('hưu')) {
    return [
      '📈 Nếu lãi suất tái đầu tư đạt 12%/năm thì đạt FIRE sớm hơn mấy năm?',
      '🛡️ Cần chuẩn bị Quỹ dự phòng bao nhiêu trước khi nghỉ hưu sớm?',
      '💡 Gợi ý các nguồn thu nhập thụ động phù hợp với vợ chồng tôi?',
    ];
  }

  if (q.includes('nợ') || q.includes('vay') || q.includes('lãi')) {
    return [
      '⚡ Chiến lược Snowball (Tuyết lăn) sẽ giúp tiết kiệm bao nhiêu tiền lãi?',
      '🏦 Có nên vay thêm để đầu tư nếu lãi suất đang thấp không?',
      '💳 Thứ tự ưu tiên tất toán các khoản nợ hiện tại như thế nào?',
    ];
  }

  if (q.includes('đầu tư') || q.includes('cổ phiếu') || q.includes('bất động sản')) {
    return [
      '⚖️ Tỷ lệ phân bổ tài sản an toàn vs mạo hiểm hiện nay đã hợp lý chưa?',
      '🚀 Thời điểm này có nên mua tích sản vàng hoặc gửi tiết kiệm thêm không?',
      '📊 Hiệu suất đầu tư bình quân hàng năm kỳ vọng nên đặt bao nhiêu %?',
    ];
  }

  return [
    '💡 Trợ lý Gia đình có lời khuyên tài chính quan trọng nào cho gia đình lúc này?',
    '📊 Cơ cấu tài sản ròng hiện tại có an toàn trước lạm phát không?',
    '🎯 Mục tiêu tài chính tiếp theo gia đình nên ưu tiên là gì?',
  ];
}
