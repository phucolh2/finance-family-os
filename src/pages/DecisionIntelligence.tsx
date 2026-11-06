import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import {
  Scale,
  BrainCircuit,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Bookmark,
  Compass,
  Heart,
  FileText,
  Search,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import type { FamilyDecisionRecord, DecisionOption } from '../types/finance';
import { FAMILY_DECISION_TEMPLATES, type DecisionTemplate } from '../data/decisionTemplates';
import {
  extractFamilyFinancialFacts,
  computeDecisionScorecard,
  synthesizeFamilyPerspectives,
  type FinancialFactItem,
} from '../engines/decisionIntelligenceEngine';

export const DecisionIntelligence: React.FC = () => {
  const { state, addDecisionRecord, deleteDecisionRecord } = useAppContext();
  const husbandName = state.profile.husbandName || 'Chồng (Hoài Phước)';
  const wifeName = state.profile.wifeName || 'Vợ (Diệu Hồng)';

  const decisions = state.familyDecisions || [];

  const [activeSubTab, setActiveSubTab] = useState<'wizard' | 'vault' | 'templates'>('wizard');
  // template active
  const [, setSelectedTemplate] = useState<string | null>(null);

  // Form State cho Session phân tích mới
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<FamilyDecisionRecord['category']>('lifestyle');
  const [contextType, setContextType] = useState<FamilyDecisionRecord['contextType']>('complicated');

  const [husbandWants, setHusbandWants] = useState('');
  const [husbandConcerns, setHusbandConcerns] = useState('');
  const [husbandTarget, setHusbandTarget] = useState('');

  const [wifeWants, setWifeWants] = useState('');
  const [wifeConcerns, setWifeConcerns] = useState('');
  const [wifeTarget, setWifeTarget] = useState('');

  const [evidenceItems, setEvidenceItems] = useState<FinancialFactItem[]>([]);
  const [perspectives, setPerspectives] = useState<FamilyDecisionRecord['perspectives']>({
    analystView: '',
    skepticView: '',
    strategistView: '',
    mediatorView: '',
  });

  const [options, setOptions] = useState<DecisionOption[]>([]);
  const [chosenOptionId, setChosenOptionId] = useState<string>('');
  const [chosenRationale, setChosenRationale] = useState('');

  const [decider, setDecider] = useState<'husband' | 'wife' | 'both'>('both');
  const [executor, setExecutor] = useState('Chồng & Vợ cùng thực hiện');
  const [reviewDate, setReviewDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().slice(0, 10);
  });
  const [guardrails, setGuardrails] = useState('');

  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Auto-sync facts from family digital twin
  const handleAutoExtractFacts = () => {
    const facts = extractFamilyFinancialFacts(state);
    setEvidenceItems(facts);
    setSuccessNotice('Đã trích xuất số liệu thật từ Bản sao số tài chính của gia đình!');
    setTimeout(() => setSuccessNotice(null), 3500);
  };

  // Áp dụng Template mẫu
  const handleApplyTemplate = (tmpl: DecisionTemplate) => {
    setSelectedTemplate(tmpl.id);
    setTitle(tmpl.title);
    setCategory(tmpl.category);
    setContextType(tmpl.contextType);

    setHusbandWants(tmpl.defaultHusband.wants);
    setHusbandConcerns(tmpl.defaultHusband.concerns);
    setHusbandTarget(tmpl.defaultHusband.targetOutcome);

    setWifeWants(tmpl.defaultWife.wants);
    setWifeConcerns(tmpl.defaultWife.concerns);
    setWifeTarget(tmpl.defaultWife.targetOutcome);

    // Kết hợp bằng chứng template với số liệu thật của gia đình
    const realFacts = extractFamilyFinancialFacts(state).slice(0, 3);
    setEvidenceItems([...realFacts, ...tmpl.sampleEvidence]);

    setPerspectives(tmpl.samplePerspectives);
    setOptions(tmpl.sampleOptions);
    setChosenOptionId(tmpl.sampleOptions[0]?.id || '');
    setGuardrails(tmpl.recommendedGuardrails);

    setActiveSubTab('wizard');
    setSuccessNotice(`Đã tải kịch bản: "${tmpl.title}"`);
    setTimeout(() => setSuccessNotice(null), 3500);
  };

  // Tự động phân tích & sinh giải pháp hòa giải
  const handleAnalyzeAndSynthesize = () => {
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề quyết định cần giải quyết.');
      return;
    }

    const facts = evidenceItems.length > 0 ? evidenceItems : extractFamilyFinancialFacts(state);
    if (evidenceItems.length === 0) {
      setEvidenceItems(facts);
    }

    const syn = synthesizeFamilyPerspectives(title, husbandWants, husbandConcerns, wifeWants, wifeConcerns, facts);
    setPerspectives(syn);

    // Nếu chưa có options, khởi tạo 3 options mẫu
    if (options.length === 0) {
      setOptions([
        {
          id: 'opt_a',
          name: 'Phương án A: Giải pháp dung hòa đề xuất',
          description: 'Kết hợp hài hòa giữa mục tiêu tăng trưởng và sự an tâm tài chính.',
          pros: ['Bảo toàn quỹ khẩn cấp', 'Đáp ứng 70% mong muốn của cả hai', 'Không vay nợ áp lực'],
          cons: ['Cần thêm thời gian chuẩn bị'],
          costEstimate: 200,
          riskLevel: 'low',
          reversibility: 'moderate',
          score: 92,
        },
        {
          id: 'opt_b',
          name: 'Phương án B: Thử nghiệm an toàn (Safe-to-fail experiment)',
          description: 'Triển khai ở quy mô nhỏ 30-50% trong 6 tháng trước khi quyết định lớn.',
          pros: ['Rủi ro thấp', 'Kiểm chứng thực tế', 'Dễ đảo ngược quyết định'],
          cons: ['Hiệu quả chưa đạt tối đa ngay'],
          costEstimate: 50,
          riskLevel: 'low',
          reversibility: 'easy',
          score: 86,
        },
        {
          id: 'opt_c',
          name: 'Phương án C: Giữ nguyên hiện trạng & Tích lũy thêm 12 tháng',
          description: 'Chưa hành động vội, tập trung tối đa dòng tiền nhàn rỗi vào tiết kiệm an toàn.',
          pros: ['An toàn tuyệt đối 100%', 'Tâm lý thảnh thơi'],
          cons: ['Chi phí cơ hội bị bỏ lỡ'],
          costEstimate: 0,
          riskLevel: 'low',
          reversibility: 'easy',
          score: 75,
        },
      ]);
      setChosenOptionId('opt_a');
    }

    setSuccessNotice('AI Decision Intelligence đã hoàn tất tổng hợp 5 lăng kính phân tích!');
    setTimeout(() => setSuccessNotice(null), 3500);
  };

  // Tính điểm chất lượng quyết định (Scorecard)
  const currentScorecard = useMemo(() => {
    return computeDecisionScorecard({
      title,
      category,
      contextType,
      husbandPerspective: { wants: husbandWants, concerns: husbandConcerns, targetOutcome: husbandTarget },
      wifePerspective: { wants: wifeWants, concerns: wifeConcerns, targetOutcome: wifeTarget },
      evidenceItems,
      options,
      chosenOptionId,
      chosenRationale,
      governance: { decider, approver: 'Hai vợ chồng cùng ký duyệt', executor, reviewDate, guardrails },
      perspectives,
    });
  }, [
    title,
    category,
    contextType,
    husbandWants,
    husbandConcerns,
    husbandTarget,
    wifeWants,
    wifeConcerns,
    wifeTarget,
    evidenceItems,
    options,
    chosenOptionId,
    chosenRationale,
    decider,
    executor,
    reviewDate,
    guardrails,
    perspectives,
  ]);

  // Lưu phiên quyết định
  const handleSaveDecision = () => {
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề quyết định.');
      return;
    }

    addDecisionRecord({
      title,
      category,
      contextType,
      husbandPerspective: { wants: husbandWants, concerns: husbandConcerns, targetOutcome: husbandTarget },
      wifePerspective: { wants: wifeWants, concerns: wifeConcerns, targetOutcome: wifeTarget },
      evidenceItems,
      perspectives,
      options,
      chosenOptionId: chosenOptionId || options[0]?.id,
      chosenRationale,
      governance: {
        decider,
        approver: 'Hai vợ chồng cùng đồng thuận',
        executor,
        reviewDate,
        guardrails: guardrails || 'Bảo toàn quỹ khẩn cấp tối thiểu 6 tháng sinh hoạt.',
      },
      qualityScore: currentScorecard,
      status: 'decided',
    });

    setSuccessNotice('Đã lưu quyết định thành công vào Sổ tay Gia đình và tự động đồng bộ Cloud!');
    setTimeout(() => setSuccessNotice(null), 4000);
    setActiveSubTab('vault');
  };

  const getVerdictBadge = (verdict: FamilyDecisionRecord['qualityScore']['verdict']) => {
    switch (verdict) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" /> ĐỦ ĐIỀU KIỆN CHỐT QUYẾT ĐỊNH (APPROVED)
          </span>
        );
      case 'PROCEED_WITH_CAUTION':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-700" /> CÂN NHẮC THẬN TRỌNG (PROCEED WITH CAUTION)
          </span>
        );
      case 'NEEDS_REVISION':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-800 bg-rose-100 px-3 py-1 rounded-full border border-rose-300">
            <ShieldAlert className="w-4 h-4 text-rose-700" /> CẦN BỔ SUNG BẰNG CHỨNG (NEEDS REVISION)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-amber-500/15 text-amber-700">
              <Scale className="w-6 h-6" />
            </span>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-family-text flex items-center gap-2">
              Trí tuệ Quyết định & Hòa giải Gia đình
              <HelpTooltip text="Áp dụng chuẩn mực AI Decision Intelligence (Cynefin, Bằng chứng số liệu thật, Phản biện 5 lăng kính, Ma trận 3 phương án, RAPID + OODA loop) để giải quyết bất đồng và đưa ra quyết định vững chắc cho hai vợ chồng." />
            </h1>
          </div>
          <p className="text-xs md:text-sm text-family-textMuted max-w-3xl">
            Chuyển từ tranh cãi cảm xúc sang quyết định minh bạch & thấu cảm: <strong className="text-family-text">Vấn đề → Bằng chứng số liệu thật → Phản biện độc lập → 3 Phương án dung hòa → Cam kết thực thi & Giới hạn rủi ro</strong>.
          </p>
        </div>

        {/* Action Tabs */}
        <div className="flex items-center gap-1.5 bg-stone-100/80 p-1.5 rounded-2xl border border-stone-200 shrink-0 self-start md:self-center">
          <button
            type="button"
            onClick={() => setActiveSubTab('wizard')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'wizard' ? 'bg-white text-family-accent shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <BrainCircuit className="w-4 h-4" /> Phiên Phân tích
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('vault')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'vault' ? 'bg-white text-family-accent shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Bookmark className="w-4 h-4" /> Sổ tay Quyết định ({decisions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('templates')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'templates' ? 'bg-white text-family-accent shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" /> Kịch bản Mẫu
          </button>
        </div>
      </div>

      {successNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* SUB-TAB 1: PHIÊN PHÂN TÍCH & HÒA GIẢI (WIZARD) */}
      {activeSubTab === 'wizard' && (
        <div className="space-y-6">
          {/* Card 1: Định hình vấn đề */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-600" />
                1. Định hình Vấn đề & Phân loại Bối cảnh (Cynefin)
                <HelpTooltip text="Xác định rõ bản chất vấn đề cần quyết định. Không có phán xét, chỉ có sự rõ ràng." />
              </CardTitle>
              <CardDescription>
                Quyết định này thuộc nhóm vấn đề gì? Mức độ phức tạp ra sao?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-family-text mb-1.5">
                    Câu hỏi / Vấn đề cần quyết định chính xác:
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: Có nên mua xe ô tô 800 triệu trả góp thời điểm này không?"
                    className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-xs text-family-text focus:outline-none focus:ring-2 focus:ring-family-accent/30 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-family-text mb-1.5">Chủ đề quyết định:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-family-text focus:outline-none focus:ring-2 focus:ring-family-accent/30"
                  >
                    <option value="lifestyle">🚗 Tiêu sản & Đời sống (Mua xe, sắm sửa)</option>
                    <option value="property">🏢 Bất động sản (Mua đất, đổi nhà)</option>
                    <option value="investment">📈 Danh mục Đầu tư (Chứng khoán, Vàng, Crypto)</option>
                    <option value="education">🎓 Giáo dục & Tương lai Con cái</option>
                    <option value="relatives">🤝 Tài chính Gia tộc & Cho người thân vay</option>
                    <option value="career">💼 Chuyển đổi Nghề nghiệp & Khởi nghiệp</option>
                    <option value="dispute_resolution">⚖️ Hòa giải Bất đồng quan điểm khác</option>
                  </select>
                </div>
              </div>

              {/* Cynefin Diagnosis */}
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-family-text">Phân loại Bối cảnh Ra quyết định:</span>
                  <div className="flex gap-2">
                    {[
                      { id: 'clear', label: 'Rõ ràng (Clear)' },
                      { id: 'complicated', label: 'Phức tạp (Complicated)' },
                      { id: 'complex', label: 'Bất định (Complex)' },
                      { id: 'chaotic', label: 'Khẩn cấp (Chaotic)' },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setContextType(c.id as any)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                          contextType === c.id
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-family-textMuted italic">
                  {contextType === 'clear' && '• Bối cảnh có quy tắc sẵn: Dễ dàng đối soát theo tiêu chuẩn an toàn tài chính.'}
                  {contextType === 'complicated' && '• Cần tính toán dòng tiền, lãi suất kép và so sánh các phương án khả thi để ra quyết định.'}
                  {contextType === 'complex' && '• Nhiều yếu tố bất định và cảm xúc con người: Khuyến nghị dùng thử nghiệm nhỏ (Safe-to-fail) trước khi chốt.'}
                  {contextType === 'chaotic' && '• Tình huống biến cố cấp bách: Ưu tiên bảo vệ an toàn sinh hoạt gia đình trước tiên.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Lắng nghe 2 chiều (Chồng vs Vợ) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chồng */}
            <Card className="border-blue-200/60 bg-blue-50/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-blue-900 flex items-center justify-between">
                  <span>👨‍💼 Góc nhìn & Tiếng nói của {husbandName}</span>
                  <span className="text-[10px] font-normal uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    Góc nhìn 1
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-blue-950 mb-1">
                    Mong muốn / Kế hoạch của Chồng là gì?
                  </label>
                  <textarea
                    rows={2}
                    value={husbandWants}
                    onChange={(e) => setHusbandWants(e.target.value)}
                    placeholder="VD: Muốn mua xe 800tr để đi lại an toàn cho con, ngoại giao công việc..."
                    className="w-full bg-white border border-blue-200 rounded-xl p-2.5 text-xs text-family-text focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-blue-950 mb-1">
                    Nỗi lo lắng / Băn khoăn của Chồng:
                  </label>
                  <textarea
                    rows={2}
                    value={husbandConcerns}
                    onChange={(e) => setHusbandConcerns(e.target.value)}
                    placeholder="VD: Lo tiền nuôi xe hàng tháng ngốn ngân sách, sợ áp lực trả nợ..."
                    className="w-full bg-white border border-blue-200 rounded-xl p-2.5 text-xs text-family-text focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-blue-950 mb-1">Kết quả kỳ vọng lớn nhất:</label>
                  <input
                    type="text"
                    value={husbandTarget}
                    onChange={(e) => setHusbandTarget(e.target.value)}
                    placeholder="VD: Gia đình có xe che mưa nắng, an toàn và nâng cao chất lượng sống"
                    className="w-full bg-white border border-blue-200 rounded-xl px-2.5 py-1.5 text-xs text-family-text focus:outline-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Vợ */}
            <Card className="border-pink-200/60 bg-pink-50/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-pink-900 flex items-center justify-between">
                  <span>👩‍💼 Góc nhìn & Tiếng nói của {wifeName}</span>
                  <span className="text-[10px] font-normal uppercase bg-pink-100 text-pink-800 px-2 py-0.5 rounded-full">
                    Góc nhìn 2
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-pink-950 mb-1">
                    Mong muốn / Kế hoạch của Vợ là gì?
                  </label>
                  <textarea
                    rows={2}
                    value={wifeWants}
                    onChange={(e) => setWifeWants(e.target.value)}
                    placeholder="VD: Muốn giữ tiền mặt gửi tiết kiệm hoặc tích lũy mua đất an toàn..."
                    className="w-full bg-white border border-pink-200 rounded-xl p-2.5 text-xs text-family-text focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-pink-950 mb-1">
                    Nỗi lo lắng / Băn khoăn của Vợ:
                  </label>
                  <textarea
                    rows={2}
                    value={wifeConcerns}
                    onChange={(e) => setWifeConcerns(e.target.value)}
                    placeholder="VD: Sợ xe mất giá, chi phí cố định phát sinh làm mất quỹ dự phòng con học..."
                    className="w-full bg-white border border-pink-200 rounded-xl p-2.5 text-xs text-family-text focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-pink-950 mb-1">Kết quả kỳ vọng lớn nhất:</label>
                  <input
                    type="text"
                    value={wifeTarget}
                    onChange={(e) => setWifeTarget(e.target.value)}
                    placeholder="VD: Tài chính gia đình an toàn tuyệt đối, ngủ ngon không lo nợ"
                    className="w-full bg-white border border-pink-200 rounded-xl px-2.5 py-1.5 text-xs text-family-text focus:outline-none"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Card 3: Bằng chứng & Số liệu Thật từ Financial Digital Twin */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    2. Kỷ luật Bằng chứng & Số liệu Thực (Evidence Discipline)
                    <HelpTooltip text="Bóc tách rõ ràng: Đâu là SỰ THẬT (FACT) từ số liệu gia đình? Đâu là TÍNH TOÁN (CALCULATION)? Đâu là GIẢ ĐỊNH (ASSUMPTION) và NỖI LO CẢM XÚC?" />
                  </CardTitle>
                  <CardDescription>
                    Tách bạch giữa thực tế khách quan và cảm xúc chủ quan để đưa ra quyết định vững chắc.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAutoExtractFacts}
                  className="text-xs gap-1.5 shrink-0 self-start sm:self-center"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  Đồng bộ số liệu từ Digital Twin
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {evidenceItems.length > 0 ? (
                <div className="space-y-2">
                  {evidenceItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-start gap-2.5 text-xs"
                    >
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] shrink-0 mt-0.5 ${
                          item.type === 'FACT'
                            ? 'bg-blue-100 text-blue-800'
                            : item.type === 'CALCULATION'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.type === 'ASSUMPTION'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.type}
                      </span>
                      <span className="flex-1 text-family-text leading-relaxed font-medium">{item.content}</span>
                      <button
                        type="button"
                        onClick={() => setEvidenceItems((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Xóa dòng bằng chứng này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-family-textMuted bg-stone-50 rounded-2xl border border-dashed border-stone-300">
                  Chưa có dữ liệu bằng chứng. Bấm nút <strong>"Đồng bộ số liệu từ Digital Twin"</strong> ở trên để tự động đưa số liệu tài chính gia đình vào!
                </div>
              )}

              {/* Action Run Analysis */}
              <div className="pt-2 flex justify-end">
                <Button
                  type="button"
                  onClick={handleAnalyzeAndSynthesize}
                  className="text-xs bg-amber-600 hover:bg-amber-700 text-white gap-2 shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  Chạy Phản Biện & Tổng Hợp 5 Lăng Kính AI
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: 5 Lăng Kính Phân Tích & Hòa Giải (Six Thinking Hats / 5 AI Roles) */}
          {perspectives.analystView && (
            <Card className="border-amber-200/80 bg-gradient-to-br from-amber-50/40 via-white to-stone-50/30 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-amber-600" />
                  3. Tổng hợp 5 Lăng kính Tư duy & Phản biện (AI Challenge & Mediator)
                  <HelpTooltip text="5 vai trò phân tích: Chuyên gia số liệu (Analyst), Kẻ hoài nghi (Skeptic), Chiến lược gia (Strategist), Trọng tài hòa giải (Mediator) và Kiểm toán chất lượng (Auditor)." />
                </CardTitle>
                <CardDescription>
                  Phân tích đa chiều giúp hai vợ chồng thấu hiểu nhau và nhìn thấy toàn bộ điểm mù rủi ro.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Analyst */}
                  <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200 text-xs space-y-1.5">
                    <div className="font-bold text-blue-900 flex items-center gap-1.5">
                      <Search className="w-4 h-4 text-blue-600" /> 1. Chuyên gia Phân tích (Analyst View - White Hat)
                    </div>
                    <p className="text-slate-700 leading-relaxed">{perspectives.analystView}</p>
                  </div>

                  {/* Skeptic */}
                  <div className="p-3.5 bg-rose-50/80 rounded-2xl border border-rose-200 text-xs space-y-1.5">
                    <div className="font-bold text-rose-900 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-600" /> 2. Kẻ Hoài nghi & Rủi ro (Skeptic - Black Hat)
                    </div>
                    <p className="text-slate-700 leading-relaxed">{perspectives.skepticView}</p>
                  </div>

                  {/* Strategist */}
                  <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-xs space-y-1.5">
                    <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-emerald-600" /> 3. Chiến lược gia (Strategist - Yellow & Green Hat)
                    </div>
                    <p className="text-slate-700 leading-relaxed">{perspectives.strategistView}</p>
                  </div>

                  {/* Mediator */}
                  <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-300 text-xs space-y-1.5">
                    <div className="font-bold text-amber-950 flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-amber-600" /> 4. Trọng tài Hòa giải Thấu cảm (Mediator - Red & Blue Hat)
                    </div>
                    <p className="text-slate-800 leading-relaxed font-medium">{perspectives.mediatorView}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Card 5: Ma trận 3 Phương án (Options Comparison) */}
          {options.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-emerald-600" />
                  4. Ma trận So sánh 3 Phương án Khả thi (Options & Trade-offs)
                  <HelpTooltip text="Luôn so sánh tối thiểu 3 phương án: Phương án tối ưu dung hòa, Phương án thử nghiệm an toàn (Safe-to-fail), và Phương án giữ nguyên hiện trạng (Status quo)." />
                </CardTitle>
                <CardDescription>
                  Bấm chọn 1 phương án mà cả hai vợ chồng thấy thỏa đáng nhất để chốt quyết định.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {options.map((opt) => {
                    const isSelected = chosenOptionId === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setChosenOptionId(opt.id)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-amber-600 bg-amber-50/40 shadow-md ring-2 ring-amber-500/20'
                            : 'border-stone-200 bg-white hover:border-stone-300'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-family-text">{opt.name}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                opt.riskLevel === 'low'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : opt.riskLevel === 'medium'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              Rủi ro: {opt.riskLevel}
                            </span>
                          </div>

                          <p className="text-[11px] text-family-textMuted leading-relaxed">{opt.description}</p>

                          <div className="text-[11px] space-y-1 pt-1">
                            <div className="font-semibold text-emerald-700">Ưu điểm:</div>
                            {opt.pros.map((p, i) => (
                              <div key={i} className="text-slate-600 flex items-start gap-1">
                                <span className="text-emerald-500">•</span>
                                <span>{p}</span>
                              </div>
                            ))}
                          </div>

                          <div className="text-[11px] space-y-1 pt-1">
                            <div className="font-semibold text-rose-700">Nhược điểm:</div>
                            {opt.cons.map((c, i) => (
                              <div key={i} className="text-slate-600 flex items-start gap-1">
                                <span className="text-rose-500">•</span>
                                <span>{c}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="border-t border-stone-200/80 pt-3 mt-3 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] text-stone-500 block">Chi phí ước tính</span>
                            <span className="font-bold text-family-text">{opt.costEstimate} triệu</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-stone-500 block">Độ khả thi / Điểm</span>
                            <span className="font-bold text-amber-600">{opt.score}/100</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Ghi chú lý do chốt */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-family-text mb-1.5">
                    Lý do lựa chọn phương án này & Thỏa thuận chung của hai vợ chồng:
                  </label>
                  <textarea
                    rows={2}
                    value={chosenRationale}
                    onChange={(e) => setChosenRationale(e.target.value)}
                    placeholder="VD: Hai vợ chồng thống nhất chọn Phương án A vì bảo vệ được Quỹ khẩn cấp, Vợ không bị áp lực nợ nần mà con vẫn có xe che mưa nắng an toàn..."
                    className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs text-family-text focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Card 6: Kế hoạch Thực thi & Điểm giới hạn Rủi ro (RAPID + OODA Guardrails) */}
          {options.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  5. Cam kết Thực thi & Giới hạn Rủi ro (Governance & Guardrails)
                  <HelpTooltip text="Áp dụng nguyên tắc RAPID và vòng lặp OODA: Xác định rõ ai quyết, ai thực hiện, mốc thời gian xem xét lại và điểm giới hạn rủi ro (Stop-loss)." />
                </CardTitle>
                <CardDescription>
                  Quyết định tốt phải đi kèm kế hoạch bảo vệ an toàn và mốc rà soát định kỳ.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-family-text mb-1.5">Quyền quyết định (Decide):</label>
                    <select
                      value={decider}
                      onChange={(e) => setDecider(e.target.value as any)}
                      className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs text-family-text focus:outline-none"
                    >
                      <option value="both">🤝 Cả hai vợ chồng cùng đồng thuận (Khuyến nghị)</option>
                      <option value="husband">👨‍💼 {husbandName} toàn quyền chịu trách nhiệm</option>
                      <option value="wife">👩‍💼 {wifeName} toàn quyền chịu trách nhiệm</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-family-text mb-1.5">Người thực thi (Perform):</label>
                    <input
                      type="text"
                      value={executor}
                      onChange={(e) => setExecutor(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs text-family-text focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-family-text mb-1.5">Mốc rà soát lại (OODA Review):</label>
                    <input
                      type="date"
                      value={reviewDate}
                      onChange={(e) => setReviewDate(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs text-family-text focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-family-text mb-1.5">
                    Điểm giới hạn rủi ro / Cắt lỗ (Guardrails & Stop-loss):
                  </label>
                  <input
                    type="text"
                    value={guardrails}
                    onChange={(e) => setGuardrails(e.target.value)}
                    placeholder="VD: Không được rút vào Quỹ khẩn cấp 150 triệu; Nếu chi phí vận hành vượt quá 10 triệu/tháng thì lập tức thanh lý xe..."
                    className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs text-family-text focus:outline-none font-medium text-rose-800"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Card 7: Bảng Điểm Chất Lượng Quyết Định (Scorecard 100 điểm) */}
          {options.length > 0 && (
            <Card className="border-emerald-200/80 bg-stone-50/40">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      6. Bảng Điểm Chất Lượng Quyết Định (AI Quality Scorecard)
                      <HelpTooltip text="Chấm điểm 100 điểm theo chuẩn mực AI Decision Intelligence để đảm bảo quyết định không bị cảm tính, có bằng chứng và có phương án dự phòng an toàn." />
                    </CardTitle>
                    <CardDescription>
                      Đánh giá 8 khía cạnh cốt lõi trước khi chính thức phê duyệt và lưu vào sổ tay gia đình.
                    </CardDescription>
                  </div>
                  <div>{getVerdictBadge(currentScorecard.verdict)}</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-stone-200">
                    <span className="text-[10px] text-stone-500 block">Định hình vấn đề</span>
                    <span className="font-bold text-sm text-family-text">{currentScorecard.problemFraming}/10</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-stone-200">
                    <span className="text-[10px] text-stone-500 block">Bằng chứng & Số liệu</span>
                    <span className="font-bold text-sm text-family-text">{currentScorecard.evidenceTraceability}/20</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-stone-200">
                    <span className="text-[10px] text-stone-500 block">Tính toán chuẩn xác</span>
                    <span className="font-bold text-sm text-family-text">{currentScorecard.dataIntegrity}/15</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-stone-200">
                    <span className="text-[10px] text-stone-500 block">Tư duy phản biện</span>
                    <span className="font-bold text-sm text-family-text">{currentScorecard.criticalThinking}/15</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-stone-200">
                    <span className="text-[10px] text-stone-500 block">Chất lượng phương án</span>
                    <span className="font-bold text-sm text-family-text">{currentScorecard.decisionQuality}/15</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-stone-200">
                    <span className="text-[10px] text-stone-500 block">Giới hạn rủi ro (Guardrails)</span>
                    <span className="font-bold text-sm text-family-text">{currentScorecard.executionGuardrails}/10</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-stone-200">
                    <span className="text-[10px] text-stone-500 block">Công bằng & Lắng nghe</span>
                    <span className="font-bold text-sm text-family-text">{currentScorecard.communicationFairness}/10</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-stone-200 bg-emerald-50/50">
                    <span className="text-[10px] text-emerald-800 block font-semibold">TỔNG ĐIỂM</span>
                    <span className="font-extrabold text-base text-emerald-700">{currentScorecard.total}/100</span>
                  </div>
                </div>

                {/* Final Actions */}
                <div className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-xs text-family-textMuted">
                    Bản quyết định sẽ được lưu vào cơ sở dữ liệu Cloud của gia đình và đồng bộ thời gian thực cho cả hai vợ chồng.
                  </p>
                  <Button
                    type="button"
                    onClick={handleSaveDecision}
                    className="w-full sm:w-auto text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg cursor-pointer"
                  >
                    <Bookmark className="w-4 h-4" />
                    Lưu Quyết Định Vào Sổ Tay Gia Đình
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* SUB-TAB 2: SỔ TAY QUYẾT ĐỊNH GIA ĐÌNH (VAULT) */}
      {activeSubTab === 'vault' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-family-text flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-amber-600" />
              Sổ Tay Kỷ Lục Quyết Định Đã Chốt ({decisions.length})
            </h3>
            <Button
              type="button"
              size="sm"
              onClick={() => setActiveSubTab('wizard')}
              className="text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="w-3.5 h-3.5" /> Tạo Quyết Định Mới
            </Button>
          </div>

          {decisions.length > 0 ? (
            <div className="space-y-3">
              {decisions.map((dec) => (
                <Card key={dec.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-family-text">{dec.title}</span>
                          <span className="text-[10px] font-semibold bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md border border-stone-200">
                            {dec.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-family-textMuted flex items-center gap-3">
                          <span>📅 Ngày tạo: {new Date(dec.createdAt).toLocaleDateString('vi-VN')}</span>
                          <span>🔍 Rà soát OODA: {dec.governance?.reviewDate || 'Chưa đặt'}</span>
                          <span className="font-bold text-emerald-700">Điểm: {dec.qualityScore?.total || 90}/100</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Xóa quyết định này khỏi sổ tay?')) {
                              deleteDecisionRecord(dec.id);
                            }
                          }}
                          className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="Xóa quyết định"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Phương án đã chọn */}
                    {dec.chosenOptionId && (
                      <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs space-y-1">
                        <div className="font-bold text-amber-950 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                          Phương án đã đồng thuận:{' '}
                          <span className="text-amber-800">
                            {dec.options.find((o) => o.id === dec.chosenOptionId)?.name || 'Phương án tối ưu'}
                          </span>
                        </div>
                        {dec.chosenRationale && <p className="text-slate-700 italic">{dec.chosenRationale}</p>}
                        {dec.governance?.guardrails && (
                          <div className="text-[11px] text-rose-800 font-semibold pt-1">
                            🛡️ Giới hạn rủi ro (Guardrails): {dec.governance.guardrails}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center rounded-2xl bg-stone-50 border border-dashed border-stone-300 space-y-3">
              <Scale className="w-10 h-10 text-stone-400 mx-auto" />
              <p className="text-xs text-family-textMuted">
                Chưa có quyết định nào được lưu trong sổ tay. Hãy mở tab <strong>"Phiên Phân tích"</strong> hoặc chọn một <strong>"Kịch bản Mẫu"</strong> để bắt đầu!
              </p>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: KHO KỊCH BẢN MẪU (TEMPLATES) */}
      {activeSubTab === 'templates' && (
        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-sm text-family-text">
              Kho Kịch bản Mẫu Điển hình của Gia đình (Family Decision Templates)
            </h3>
            <p className="text-xs text-family-textMuted mt-0.5">
              Các bài toán nan giải thường gặp nhất giữa hai vợ chồng đã được chuẩn hóa theo khung AI Decision Intelligence. Bấm vào bất kỳ mẫu nào để nạp dữ liệu và bắt đầu ngay!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FAMILY_DECISION_TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                className="p-5 bg-white border border-stone-200 hover:border-amber-400 hover:shadow-md rounded-2xl transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                      {tmpl.category}
                    </span>
                    <span className="text-[10px] text-stone-400 font-semibold">{tmpl.contextType}</span>
                  </div>
                  <h4 className="font-bold text-xs text-family-text leading-snug">{tmpl.title}</h4>
                  <p className="text-[11px] text-family-textMuted leading-relaxed">{tmpl.description}</p>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[10px] text-stone-500 font-medium">3 Phương án sẵn có</span>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleApplyTemplate(tmpl)}
                    className="text-xs h-7 px-2.5 gap-1 bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                  >
                    <span>Dùng mẫu này</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
