import type { AppState, FamilyDecisionRecord } from '../types/finance';

export interface FinancialFactItem {
  type: 'FACT' | 'CALCULATION' | 'ASSUMPTION' | 'EMOTIONAL_CONCERN';
  content: string;
}

/**
 * Tự động trích xuất các dữ liệu sự thật (FACT & CALCULATION)
 * từ Bản sao số tài chính (Financial Digital Twin) của gia đình.
 */
export function extractFamilyFinancialFacts(state: AppState): FinancialFactItem[] {
  const facts: FinancialFactItem[] = [];

  const husband = state.profile.husbandName || 'Chồng';
  const wife = state.profile.wifeName || 'Vợ';

  // 1. Quỹ dự phòng & Sổ tiết kiệm
  const totalSavings = (state.savingsDeposits || []).reduce((sum, s) => sum + (s.principal || 0), 0);
  const totalSinkingFunds = (state.sinkingFunds || []).reduce((sum, s) => sum + (s.initialDeposit || 0), 0);
  const totalLiquidCash = totalSavings + totalSinkingFunds;

  facts.push({
    type: 'FACT',
    content: `Tổng tài sản thanh khoản an toàn (Tiết kiệm + Quỹ tích lũy) hiện có của gia đình: ${totalLiquidCash.toLocaleString('vi-VN')} triệu VNĐ.`,
  });

  // 2. Tài sản đầu tư & Danh mục
  const totalInvested = (state.assets || []).reduce((sum, a) => sum + (a.beginningBalance || 0), 0);
  const totalDeals = (state.investmentDeals || []).reduce((sum, d) => sum + (d.capital || 0), 0);
  facts.push({
    type: 'FACT',
    content: `Tổng giá trị danh mục tài sản đầu tư và thương vụ: ${(totalInvested + totalDeals).toLocaleString('vi-VN')} triệu VNĐ.`,
  });

  // 3. Dòng tiền thu nhập hàng tháng
  const monthlyIncomes = (state.incomeSchedule || []).map((i) => i.incomeMonthly || 0);
  const avgMonthlyIncome = monthlyIncomes.length > 0
    ? monthlyIncomes.reduce((a, b) => a + b, 0) / monthlyIncomes.length
    : 0;

  if (avgMonthlyIncome > 0) {
    facts.push({
      type: 'FACT',
      content: `Thu nhập trung bình hàng tháng của cả hai vợ chồng: ${avgMonthlyIncome.toFixed(1)} triệu VNĐ/tháng.`,
    });
  }

  // 4. Nghĩa vụ nợ hiện tại
  const totalDebts = (state.debts || []).reduce((sum, d) => sum + (d.principal || 0), 0);
  if (totalDebts > 0) {
    facts.push({
      type: 'FACT',
      content: `Gia đình đang có ${state.debts?.length} khoản nợ/vay với tổng dư nợ: ${totalDebts.toLocaleString('vi-VN')} triệu VNĐ.`,
    });
  } else {
    facts.push({
      type: 'FACT',
      content: 'Gia đình hiện tại KHÔNG có nợ vay ngân hàng hoặc nợ tiêu dùng (Tỷ lệ DTI = 0%).',
    });
  }

  // 5. Tính toán sức chịu đựng (Runway)
  const estimatedMonthlyLivingCost = avgMonthlyIncome > 0 ? avgMonthlyIncome * 0.6 : 30; // giả định chi phí 60% thu nhập
  const runwayMonths = estimatedMonthlyLivingCost > 0 ? totalLiquidCash / estimatedMonthlyLivingCost : 0;
  facts.push({
    type: 'CALCULATION',
    content: `Độ đệm an toàn tài chính (Emergency Runway): Khoản tiền thanh khoản hiện tại đủ duy trì sinh hoạt gia đình trong khoảng ${runwayMonths.toFixed(1)} tháng nếu mất hoàn toàn nguồn thu nhập.`,
  });

  // 6. Ghi chú tâm lý & hòa thuận
  facts.push({
    type: 'EMOTIONAL_CONCERN',
    content: `Quyết định lớn cần sự đồng thuận 100% của cả ${husband} và ${wife} để tránh áp lực âm ỉ kéo dài về sau.`,
  });

  return facts;
}

/**
 * Tính toán Scorecard đánh giá chất lượng quyết định (Decision Scorecard - 100 Điểm)
 * dựa theo chuẩn mực AI Decision Intelligence.
 */
export function computeDecisionScorecard(record: Partial<FamilyDecisionRecord>): FamilyDecisionRecord['qualityScore'] {
  let problemFraming = 0;
  let evidenceTraceability = 0;
  let dataIntegrity = 0;
  let criticalThinking = 0;
  let decisionQuality = 0;
  let executionGuardrails = 0;
  let communicationFairness = 0;
  const safetyPrivacy = 5; // mặc định tôn trọng bảo mật dữ liệu gia đình

  // 1. Problem framing (max 10)
  if (record.title && record.title.length > 5) problemFraming += 4;
  if (record.category) problemFraming += 3;
  if (record.contextType) problemFraming += 3;

  // 2. Evidence & Traceability (max 20)
  const evidenceCount = (record.evidenceItems || []).length;
  if (evidenceCount >= 1) evidenceTraceability += 5;
  if (evidenceCount >= 3) evidenceTraceability += 8;
  const hasFacts = (record.evidenceItems || []).some((e) => e.type === 'FACT');
  const hasCalculations = (record.evidenceItems || []).some((e) => e.type === 'CALCULATION');
  if (hasFacts) evidenceTraceability += 4;
  if (hasCalculations) evidenceTraceability += 3;

  // 3. Data & calculation integrity (max 15)
  if (hasCalculations) dataIntegrity += 8;
  const hasValidOptionsCost = (record.options || []).some((o) => typeof o.costEstimate === 'number');
  if (hasValidOptionsCost) dataIntegrity += 7;

  // 4. Critical thinking & alternatives (max 15)
  const optionsCount = (record.options || []).length;
  if (optionsCount >= 2) criticalThinking += 5;
  if (optionsCount >= 3) criticalThinking += 5;
  if (record.perspectives?.skepticView && record.perspectives.skepticView.length > 10) criticalThinking += 5;

  // 5. Decision quality & trade-offs (max 15)
  const optionsHaveProsCons = (record.options || []).every((o) => (o.pros || []).length > 0 && (o.cons || []).length > 0);
  if (optionsHaveProsCons) decisionQuality += 7;
  if (record.chosenOptionId || record.chosenRationale) decisionQuality += 8;

  // 6. Execution guardrails & review (max 10)
  if (record.governance?.guardrails && record.governance.guardrails.length > 5) executionGuardrails += 5;
  if (record.governance?.reviewDate) executionGuardrails += 3;
  if (record.governance?.decider) executionGuardrails += 2;

  // 7. Communication & fairness between Husband and Wife (max 10)
  const hasHusband = !!record.husbandPerspective?.wants || !!record.husbandPerspective?.concerns;
  const hasWife = !!record.wifePerspective?.wants || !!record.wifePerspective?.concerns;
  if (hasHusband) communicationFairness += 4;
  if (hasWife) communicationFairness += 4;
  if (record.perspectives?.mediatorView) communicationFairness += 2;

  const total = Math.min(
    100,
    problemFraming +
      evidenceTraceability +
      dataIntegrity +
      criticalThinking +
      decisionQuality +
      executionGuardrails +
      communicationFairness +
      safetyPrivacy
  );

  let verdict: FamilyDecisionRecord['qualityScore']['verdict'] = 'NEEDS_REVISION';
  if (total >= 88) {
    verdict = 'APPROVED';
  } else if (total >= 70) {
    verdict = 'PROCEED_WITH_CAUTION';
  }

  return {
    problemFraming,
    evidenceTraceability,
    dataIntegrity,
    criticalThinking,
    decisionQuality,
    executionGuardrails,
    communicationFairness,
    safetyPrivacy,
    total,
    verdict,
  };
}

/**
 * Tự động sinh giải pháp hòa giải và 5 lăng kính phân tích
 * dựa trên mong muốn và nỗi lo của 2 vợ chồng.
 */
export function synthesizeFamilyPerspectives(
  title: string,
  husbandWants: string,
  husbandConcerns: string,
  wifeWants: string,
  wifeConcerns: string,
  financialFacts: FinancialFactItem[]
): FamilyDecisionRecord['perspectives'] {
  const factSummary = financialFacts.filter((f) => f.type === 'FACT').map((f) => f.content).join(' ');

  const analystView = `Về mặt số liệu cho bài toán "${title}": ${factSummary || 'Cần đối chiếu số dư thanh khoản và dòng tiền tự do hàng tháng.'} Bất kỳ quyết định chi tiêu hay đầu tư nào cũng không được làm cạn kiệt Quỹ dự phòng tối thiểu 6 tháng sinh hoạt.`;

  const skepticView = `Phản biện rủi ro (Black Hat): Cần lường trước kịch bản xấu nhất: Nếu nguồn thu nhập bị gián đoạn, nỗi lo của Vợ ("${wifeConcerns.slice(0, 60) || 'áp lực tài chính'}") và của Chồng ("${husbandConcerns.slice(0, 60) || 'rủi ro vận hành'}") có trở thành hiện thực không? Tuyệt đối không FOMO chạy theo kỳ vọng quá lạc quan.`;

  const strategistView = `Góc nhìn chiến lược (Yellow Hat): Có thể giải quyết bài toán bằng phương pháp "Chia nhỏ bước đi" (Safe-to-fail experiment): Thay vì dồn toàn bộ nguồn lực vào một quyết định lớn không thể đảo ngược, hãy thử nghiệm ở quy mô nhỏ hơn 30-50% hoặc thiết lập lộ trình 2 giai đoạn với mốc đánh giá trung gian.`;

  const mediatorView = `Trọng tài hòa giải & Gắn kết gia đình (Red & Blue Hat): Mong muốn của Chồng ("${husbandWants.slice(0, 80) || 'Phát triển kinh tế, nâng cao đời sống'}") và nỗi lo của Vợ ("${wifeWants.slice(0, 80) || 'An toàn tài chính, bình yên cho con cái'}") đều xuất phát từ tình yêu thương và trách nhiệm với tổ ấm. Điểm cân bằng hoàn hảo nhất không phải là ai thắng ai thua, mà là tìm ra phương án: Vừa nắm bắt cơ hội tăng trưởng nhưng vẫn đảm bảo Vợ hoàn toàn an tâm ngủ ngon mỗi đêm.`;

  return {
    analystView,
    skepticView,
    strategistView,
    mediatorView,
  };
}
