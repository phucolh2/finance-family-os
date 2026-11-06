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
  Search,
  ArrowRight,
  Loader2,
  CheckSquare,
  MessageSquare,
  Clock,
  Bell,
  HeartHandshake,
} from 'lucide-react';
import type { FamilyDecisionRecord, DecisionOption } from '../types/finance';
import { FAMILY_DECISION_TEMPLATES, type DecisionTemplate } from '../data/decisionTemplates';
import {
  extractFamilyFinancialFacts,
  computeDecisionScorecard,
  type FinancialFactItem,
} from '../engines/decisionIntelligenceEngine';
import { consultFamilyDecisionWithGemini } from '../services/decisionAiService';
import { getActiveActor } from '../config/familyMembers';
import { sendBrowserNotification } from '../utils/reminderEngine';

export const DecisionIntelligence: React.FC = () => {
  const { state, addDecisionRecord, updateDecisionRecord, deleteDecisionRecord, pushSystemLog } = useAppContext();
  const husbandName = state.profile.husbandName || 'Chồng (Hoài Phước)';
  const wifeName = state.profile.wifeName || 'Vợ (Diệu Hồng)';
  const activeActor = getActiveActor(); // 'husband' | 'wife'
  const currentActorName = activeActor === 'husband' ? husbandName : wifeName;
  const partnerActorName = activeActor === 'husband' ? wifeName : husbandName;

  const decisions = state.familyDecisions || [];

  const [activeSubTab, setActiveSubTab] = useState<'wizard' | 'vault' | 'templates'>('wizard');
  const [vaultStatusFilter, setVaultStatusFilter] = useState<'all' | 'initiated' | 'discussing' | 'agreed'>('all');

  // Form State cho Session phân tích (mới hoặc chỉnh sửa từ vault)
  const [activeDecisionId, setActiveDecisionId] = useState<string | null>(null);
  const [decisionStatus, setDecisionStatus] = useState<'initiated' | 'discussing' | 'agreed'>('initiated');
  const [createdByRole, setCreatedByRole] = useState<'husband' | 'wife'>(activeActor);

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

  const [tenderLetter, setTenderLetter] = useState('');
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

  // Nội dung chốt thỏa thuận
  const [agreedSummary, setAgreedSummary] = useState('');
  const [keyCommitments, setKeyCommitments] = useState('');
  const [isFinalizingConsensus, setIsFinalizingConsensus] = useState(false);

  // Trạng thái tư vấn Gemini AI
  const [isConsultingAi, setIsConsultingAi] = useState(false);
  const [aiSource, setAiSource] = useState<'gemini' | 'offline_fallback' | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Kiểm tra xem vợ/chồng có gửi phiên quyết định mới chờ thảo luận không
  const partnerPendingDecision = useMemo(() => {
    return decisions.find(
      (d) =>
        (d.status === 'initiated' || d.status === 'discussing') &&
        d.createdBy &&
        d.createdBy !== activeActor
    );
  }, [decisions, activeActor]);

  // Đếm số lượng theo trạng thái cho bộ lọc Vault
  const statusCounts = useMemo(() => {
    return {
      all: decisions.length,
      initiated: decisions.filter((d) => d.status === 'initiated' || d.status === 'draft').length,
      discussing: decisions.filter((d) => d.status === 'discussing').length,
      agreed: decisions.filter((d) => d.status === 'agreed' || d.status === 'decided').length,
    };
  }, [decisions]);

  // Auto-sync facts from family digital twin
  const handleAutoExtractFacts = () => {
    const facts = extractFamilyFinancialFacts(state);
    setEvidenceItems(facts);
    setSuccessNotice('Đã trích xuất số liệu thật từ Bản sao số tài chính của gia đình!');
    setTimeout(() => setSuccessNotice(null), 3500);
  };

  // Nạp kịch bản mẫu
  const handleApplyTemplate = (tmpl: DecisionTemplate) => {
    setActiveDecisionId(null);
    setDecisionStatus('initiated');
    setCreatedByRole(activeActor);
    setTitle(tmpl.title);
    setCategory(tmpl.category);
    setContextType(tmpl.contextType);

    setHusbandWants(tmpl.defaultHusband.wants);
    setHusbandConcerns(tmpl.defaultHusband.concerns);
    setHusbandTarget(tmpl.defaultHusband.targetOutcome);

    setWifeWants(tmpl.defaultWife.wants);
    setWifeConcerns(tmpl.defaultWife.concerns);
    setWifeTarget(tmpl.defaultWife.targetOutcome);

    const realFacts = extractFamilyFinancialFacts(state).slice(0, 3);
    setEvidenceItems([...realFacts, ...tmpl.sampleEvidence]);

    setPerspectives(tmpl.samplePerspectives);
    setOptions(tmpl.sampleOptions);
    setChosenOptionId(tmpl.sampleOptions[0]?.id || '');
    setGuardrails(tmpl.recommendedGuardrails);
    setTenderLetter('');
    setAgreedSummary('');
    setKeyCommitments('');

    setActiveSubTab('wizard');
    setSuccessNotice(`Đã tải kịch bản mẫu: "${tmpl.title}"`);
    setTimeout(() => setSuccessNotice(null), 3500);
  };

  // Mở quyết định từ Vault để cùng thảo luận hoặc chốt
  const handleLoadDecisionForDiscussion = (rec: FamilyDecisionRecord) => {
    setActiveDecisionId(rec.id);
    setDecisionStatus((rec.status as any) || 'initiated');
    setCreatedByRole(rec.createdBy || 'husband');
    setTitle(rec.title);
    setCategory(rec.category);
    setContextType(rec.contextType);

    setHusbandWants(rec.husbandPerspective.wants);
    setHusbandConcerns(rec.husbandPerspective.concerns);
    setHusbandTarget(rec.husbandPerspective.targetOutcome);

    setWifeWants(rec.wifePerspective.wants);
    setWifeConcerns(rec.wifePerspective.concerns);
    setWifeTarget(rec.wifePerspective.targetOutcome);

    setEvidenceItems(rec.evidenceItems || []);
    setPerspectives(rec.perspectives || { analystView: '', skepticView: '', strategistView: '', mediatorView: '' });
    setTenderLetter(rec.tenderLetter || '');
    setOptions(rec.options || []);
    setChosenOptionId(rec.chosenOptionId || (rec.options && rec.options[0]?.id) || '');
    setChosenRationale(rec.chosenRationale || '');

    setDecider(rec.governance?.decider || 'both');
    setExecutor(rec.governance?.executor || 'Chồng & Vợ cùng thực hiện');
    setReviewDate(rec.governance?.reviewDate || new Date().toISOString().slice(0, 10));
    setGuardrails(rec.governance?.guardrails || '');

    if (rec.finalResolution) {
      setAgreedSummary(rec.finalResolution.agreedSummary || '');
      setKeyCommitments((rec.finalResolution.keyCommitments || []).join('\n'));
    } else {
      setAgreedSummary('');
      setKeyCommitments('');
    }

    setActiveSubTab('wizard');
    setSuccessNotice(`Đã mở phiên: "${rec.title}" để tiếp tục đối thoại!`);
    setTimeout(() => setSuccessNotice(null), 3500);
  };

  // Xóa phiên quyết định hiện tại
  const handleDeleteCurrentDecision = () => {
    const decisionTitle = title.trim() || 'này';
    if (window.confirm(`Bạn có chắc chắn muốn xóa phiên quyết định "${decisionTitle}" không? Thao tác này không thể hoàn tác.`)) {
      if (activeDecisionId) {
        deleteDecisionRecord(activeDecisionId);
        if (pushSystemLog) {
          pushSystemLog('XÓA', 'Quyết định', `${currentActorName} đã xóa phiên: "${decisionTitle}"`);
        }
      }
      handleResetFormNew();
      setSuccessNotice(`Đã xóa phiên "${decisionTitle}" thành công!`);
      setTimeout(() => setSuccessNotice(null), 3000);
    }
  };

  // Reset form để tạo phiên mới
  const handleResetFormNew = () => {
    setActiveDecisionId(null);
    setDecisionStatus('initiated');
    setCreatedByRole(activeActor);
    setTitle('');
    setCategory('lifestyle');
    setContextType('complicated');
    setHusbandWants('');
    setHusbandConcerns('');
    setHusbandTarget('');
    setWifeWants('');
    setWifeConcerns('');
    setWifeTarget('');
    setEvidenceItems([]);
    setPerspectives({ analystView: '', skepticView: '', strategistView: '', mediatorView: '' });
    setTenderLetter('');
    setOptions([]);
    setChosenOptionId('');
    setChosenRationale('');
    setGuardrails('');
    setAgreedSummary('');
    setKeyCommitments('');
    setIsFinalizingConsensus(false);
    setActiveSubTab('wizard');
  };

  // TƯ VẤN TRỰC TIẾP TỪ GEMINI AI (BỎ QUA LỚP 1)
  const handleConsultGeminiDirect = async () => {
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề bài toán/quyết định cần giải quyết.');
      return;
    }

    const facts = evidenceItems.length > 0 ? evidenceItems : extractFamilyFinancialFacts(state);
    if (evidenceItems.length === 0) {
      setEvidenceItems(facts);
    }

    setIsConsultingAi(true);
    setSuccessNotice('Gemini AI đang lắng nghe và suy ngẫm giải pháp thấu cảm cho hai vợ chồng...');

    try {
      const result = await consultFamilyDecisionWithGemini({
        title,
        category,
        contextType,
        husbandName,
        wifeName,
        husbandPerspective: {
          wants: husbandWants,
          concerns: husbandConcerns,
          targetOutcome: husbandTarget,
        },
        wifePerspective: {
          wants: wifeWants,
          concerns: wifeConcerns,
          targetOutcome: wifeTarget,
        },
        facts,
      });

      setPerspectives(result.perspectives);
      setOptions(result.options);
      if (result.options.length > 0) {
        setChosenOptionId(result.options[0].id);
      }
      setGuardrails(result.guardrails);
      setChosenRationale(result.chosenRationale);
      setTenderLetter(result.tenderLetter);
      setAiSource(result.source);

      // Tự động chuyển trạng thái sang "Đang thảo luận"
      if (decisionStatus === 'initiated') {
        setDecisionStatus('discussing');
      }

      setSuccessNotice(
        result.source === 'gemini'
          ? '✨ Trí tuệ Gemini AI đã hoàn tất phân tích đa chiều và gửi tâm thư yêu thương!'
          : 'Đã hoàn tất phân tích tổng hợp phương án dung hòa!'
      );

      // Thông báo cho người bạn đời
      sendBrowserNotification(
        '🧭 La Bàn Đồng Thuận',
        `${currentActorName} vừa nhờ Gemini AI phân tích bài toán: "${title}". Hãy vào cùng xem nhé!`
      );
      if (pushSystemLog) {
        pushSystemLog('PHÂN_TÍCH', 'Quyết định', `${currentActorName} đã nhờ Gemini AI tư vấn phiên: "${title}"`);
      }
    } catch (err: any) {
      console.error('Lỗi tư vấn Gemini AI:', err);
      alert('Không thể kết nối Gemini AI. Vui lòng kiểm tra lại mạng hoặc khóa API.');
    } finally {
      setIsConsultingAi(false);
      setTimeout(() => setSuccessNotice(null), 4500);
    }
  };

  // Tính điểm chất lượng quyết định (Scorecard 100 điểm)
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

  // Lưu phiên quyết định (ở trạng thái Khởi tạo hoặc Đang thảo luận)
  const handleSaveDecisionProgress = (newStatus?: 'initiated' | 'discussing') => {
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề quyết định.');
      return;
    }

    const targetStatus = newStatus || decisionStatus;
    const isNew = !activeDecisionId;

    const recordPayload = {
      title,
      category,
      contextType,
      createdBy: createdByRole,
      createdByName: createdByRole === 'husband' ? husbandName : wifeName,
      lastUpdatedBy: activeActor,
      husbandPerspective: { wants: husbandWants, concerns: husbandConcerns, targetOutcome: husbandTarget },
      wifePerspective: { wants: wifeWants, concerns: wifeConcerns, targetOutcome: wifeTarget },
      evidenceItems,
      perspectives,
      tenderLetter,
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
      status: targetStatus,
    };

    if (isNew) {
      const created = addDecisionRecord(recordPayload);
      setActiveDecisionId(created.id);
      setDecisionStatus(targetStatus);

      // Gửi thông báo cho bạn đời
      sendBrowserNotification(
        '🧭 La Bàn Đồng Thuận',
        `${currentActorName} vừa khởi tạo phiên quyết định mới: "${title}". Hãy vào cùng đối thoại nhé!`
      );
      if (pushSystemLog) {
        pushSystemLog('TẠO', 'Quyết định', `${currentActorName} đã mở phiên quyết định: "${title}"`);
      }
      setSuccessNotice(`Đã lưu phiên "${title}". Thông báo đã được gửi tới ${partnerActorName}!`);
    } else {
      updateDecisionRecord({
        ...recordPayload,
        id: activeDecisionId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setDecisionStatus(targetStatus);

      sendBrowserNotification(
        '🧭 La Bàn Đồng Thuận',
        `${currentActorName} vừa cập nhật nội dung thảo luận: "${title}".`
      );
      if (pushSystemLog) {
        pushSystemLog('CẬP_NHẬT', 'Quyết định', `${currentActorName} cập nhật phiên: "${title}"`);
      }
      setSuccessNotice(`Đã cập nhật phiên thảo luận "${title}" thành công!`);
    }

    setTimeout(() => setSuccessNotice(null), 4000);
  };

  // CHỐT QUYẾT ĐỊNH ĐỒNG THUẬN (AGREED CONSENSUS)
  const handleLockInConsensus = () => {
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề quyết định.');
      return;
    }
    if (!agreedSummary.trim()) {
      alert('Vui lòng nhập tóm tắt "Nội dung chốt là gì" để lưu lại cam kết của hai vợ chồng.');
      return;
    }

    const selectedOpt = options.find((o) => o.id === chosenOptionId) || options[0];
    const commitmentsList = keyCommitments
      .split('\n')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const finalRes = {
      agreedOptionId: selectedOpt?.id || 'opt_consensus',
      agreedOptionName: selectedOpt?.name || 'Phương án đồng thuận',
      agreedSummary: agreedSummary.trim(),
      keyCommitments: commitmentsList.length > 0 ? commitmentsList : ['Cả hai vợ chồng cùng đồng lòng thực hiện'],
      guardrails: guardrails || 'Bảo toàn quỹ khẩn cấp sinh hoạt gia đình.',
      agreedAt: new Date().toISOString(),
      agreedBy: `Cả hai vợ chồng (${husbandName} & ${wifeName})`,
      executor: executor || 'Chồng & Vợ cùng thực hiện',
      reviewDate: reviewDate,
    };

    const recordPayload = {
      title,
      category,
      contextType,
      createdBy: createdByRole,
      createdByName: createdByRole === 'husband' ? husbandName : wifeName,
      lastUpdatedBy: activeActor,
      husbandPerspective: { wants: husbandWants, concerns: husbandConcerns, targetOutcome: husbandTarget },
      wifePerspective: { wants: wifeWants, concerns: wifeConcerns, targetOutcome: wifeTarget },
      evidenceItems,
      perspectives,
      tenderLetter,
      options,
      chosenOptionId: selectedOpt?.id,
      chosenRationale: chosenRationale || agreedSummary,
      finalResolution: finalRes,
      governance: {
        decider: 'both' as const,
        approver: `Cả hai vợ chồng cùng ký duyệt`,
        executor: executor || 'Chồng & Vợ',
        reviewDate,
        guardrails: guardrails || 'Bảo toàn đệm an toàn tài chính',
      },
      qualityScore: currentScorecard,
      status: 'agreed' as const,
    };

    if (activeDecisionId) {
      updateDecisionRecord({
        ...recordPayload,
        id: activeDecisionId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      addDecisionRecord(recordPayload);
    }

    setDecisionStatus('agreed');
    setIsFinalizingConsensus(false);

    // Gửi thông báo chúc mừng đồng thuận
    sendBrowserNotification(
      '🎉 Quyết Định Đồng Thuận!',
      `Tổ ấm đã cùng thống nhất chốt quyết định: "${title}"!`
    );
    if (pushSystemLog) {
      pushSystemLog('CHỐT', 'Quyết định', `Hai vợ chồng đã ký duyệt đồng thuận phiên: "${title}"`);
    }

    setSuccessNotice(`🎉 Chúc mừng tổ ấm! Quyết định "${title}" đã được ký duyệt đồng thuận và lưu vào Sổ tay!`);
    setTimeout(() => {
      setSuccessNotice(null);
      setActiveSubTab('vault');
      setVaultStatusFilter('agreed');
    }, 2500);
  };

  const getVerdictBadge = (verdict: FamilyDecisionRecord['qualityScore']['verdict']) => {
    switch (verdict) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" /> ĐỒNG THUẬN AN TOÀN (APPROVED)
          </span>
        );
      case 'PROCEED_WITH_CAUTION':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-700" /> CÂN NHẮC THẬN TRỌNG
          </span>
        );
      case 'NEEDS_REVISION':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-800 bg-rose-100 px-3 py-1 rounded-full border border-rose-300">
            <ShieldAlert className="w-4 h-4 text-rose-700" /> CẦN BỔ SUNG BẰNG CHỨNG
          </span>
        );
    }
  };

  const getStatusBadge = (status: FamilyDecisionRecord['status']) => {
    switch (status) {
      case 'agreed':
      case 'decided':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
            <CheckSquare className="w-3.5 h-3.5 text-emerald-700" /> ĐÃ CHỐT ĐỒNG THUẬN
          </span>
        );
      case 'discussing':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-300">
            <MessageSquare className="w-3.5 h-3.5 text-blue-700" /> ĐANG THẢO LUẬN
          </span>
        );
      case 'initiated':
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-700" /> KHỞI TẠO (CHỜ ĐỐI THOẠI)
          </span>
        );
    }
  };

  const filteredDecisions = useMemo(() => {
    if (vaultStatusFilter === 'all') return decisions;
    if (vaultStatusFilter === 'agreed') return decisions.filter((d) => d.status === 'agreed' || d.status === 'decided');
    if (vaultStatusFilter === 'discussing') return decisions.filter((d) => d.status === 'discussing');
    if (vaultStatusFilter === 'initiated') return decisions.filter((d) => d.status === 'initiated' || d.status === 'draft');
    return decisions;
  }, [decisions, vaultStatusFilter]);

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
              La Bàn Đồng Thuận & Quyết Định Tổ Ấm
              <HelpTooltip text="La Bàn Đồng Thuận giúp hai vợ chồng cùng ngồi lại, đối thoại cởi mở, thấu hiểu nỗi lo và mong muốn của nhau dựa trên số liệu thực tế để đưa ra quyết định an tâm, êm ấm cho cả nhà." />
            </h1>
          </div>
          <p className="text-xs md:text-sm text-family-textMuted max-w-3xl">
            Quy trình hòa hợp 3 bước: <strong className="text-family-text">Khởi tạo băn khoăn → Hai vợ chồng thảo luận cùng Cố vấn Gemini AI → Chốt nội dung đồng thuận & Lưu giữ cam kết</strong>.
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
            <Compass className="w-4 h-4" /> Phiên Đồng Thuận
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('vault')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'vault' ? 'bg-white text-family-accent shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Bookmark className="w-4 h-4" /> Sổ Tay Đồng Thuận ({decisions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('templates')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'templates' ? 'bg-white text-family-accent shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" /> Tình Huống Điển Hình
          </button>
        </div>
      </div>

      {/* BANNER THÔNG BÁO TỪ BẠN ĐỜI NẾU CÓ PHIÊN CẦN THẢO LUẬN */}
      {partnerPendingDecision && (
        <div className="p-4 bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border border-amber-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-700 shrink-0">
              <Bell className="w-5 h-5 animate-bounce" />
            </span>
            <div className="text-xs">
              <span className="font-bold text-amber-950 block text-sm">
                💌 Lời nhắn gửi từ {partnerActorName}:
              </span>
              <span className="text-stone-700 leading-relaxed">
                Đang có phiên băn khoăn: <strong>"{partnerPendingDecision.title}"</strong> ({partnerPendingDecision.status === 'initiated' ? 'vừa khởi tạo' : 'đang thảo luận'}). Hãy vào sẻ chia góc nhìn của bạn để cùng tìm tiếng nói chung!
              </span>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => handleLoadDecisionForDiscussion(partnerPendingDecision)}
            className="text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1.5 shrink-0 shadow-xs cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" /> Vào Thảo Luận Ngay
          </Button>
        </div>
      )}

      {/* Success Notification Bar */}
      {successNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-900 font-medium shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* SUB-TAB 1: PHIÊN ĐỒNG THUẬN (WIZARD) */}
      {activeSubTab === 'wizard' && (
        <div className="space-y-6">
          {/* Status Bar of Current Decision */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="text-xs">
                <span className="text-stone-400 block text-[10px] uppercase font-semibold">Trạng thái phiên</span>
                <div className="flex items-center gap-2 mt-0.5">
                  {getStatusBadge(decisionStatus)}
                  {activeDecisionId && (
                    <span className="text-[11px] text-stone-500 font-mono">ID: {activeDecisionId.slice(-6)}</span>
                  )}
                </div>
              </div>
              <div className="h-6 w-px bg-stone-200 hidden sm:block" />
              <div className="text-xs hidden sm:block">
                <span className="text-stone-400 block text-[10px] uppercase font-semibold">Người khởi tạo</span>
                <span className="font-semibold text-family-text">
                  {createdByRole === 'husband' ? `👨‍💼 ${husbandName}` : `👩‍💼 ${wifeName}`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetFormNew}
                className="text-xs text-stone-600 hover:text-stone-900"
              >
                <Plus className="w-3.5 h-3.5" /> Tạo Phiên Mới
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDeleteCurrentDecision}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 gap-1 cursor-pointer"
                title="Xóa phiên quyết định này"
              >
                <Trash2 className="w-3.5 h-3.5" /> Xóa Phiên
              </Button>

              {decisionStatus !== 'agreed' ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSaveDecisionProgress(decisionStatus)}
                    className="text-xs text-stone-700"
                  >
                    Lưu Tiến Trình
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setIsFinalizingConsensus(true)}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
                  >
                    <HeartHandshake className="w-3.5 h-3.5" /> Chốt Quyết Định Đồng Thuận
                  </Button>
                </>
              ) : (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Đã Ký Duyệt Đồng Thuận
                </span>
              )}
            </div>
          </div>

          {/* Form Card 1: Khởi tạo vấn đề */}
          <Card className="border-stone-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-600" />
                  1. Khởi Tạo Vấn Đề & Bối Cảnh Quyết Định
                </span>
                <span className="text-[11px] font-normal text-stone-500">
                  Bạn đang thao tác với vai trò: <strong>{currentActorName}</strong>
                </span>
              </CardTitle>
              <CardDescription>
                Đặt tên rõ ràng cho vấn đề cần quyết định để hai vợ chồng cùng tập trung vào mục tiêu chung.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-family-text uppercase tracking-wider mb-1.5">
                  Tiêu đề quyết định / Vấn đề cần đồng thuận: *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Mua ô tô 7 chỗ che mưa nắng cho con hay tiếp tục tích lũy mua nhà?"
                  className="w-full bg-family-bgDeep border border-family-accent/20 rounded-xl px-4 py-2.5 text-xs text-family-text font-medium focus:outline-none focus:border-family-accent/60"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-family-textMuted uppercase mb-1.5">
                    Lĩnh vực quyết định:
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-family-bgDeep border border-family-accent/20 rounded-xl px-4 py-2 text-xs text-family-text"
                  >
                    <option value="lifestyle">Tiện nghi & Tiêu sản đời sống (Mua xe, Du lịch...)</option>
                    <option value="property">Bất động sản & Nhà ở (Mua nhà, Đất đai...)</option>
                    <option value="investment">Đầu tư & Vốn kinh doanh (Cổ phiếu, Mở quán...)</option>
                    <option value="education">Giáo dục con cái (Trường quốc tế, Khóa học...)</option>
                    <option value="career">Sự nghiệp & Chuyển việc (Nghỉ việc, Khởi nghiệp...)</option>
                    <option value="relatives">Quan hệ nội ngoại & Cho vay (Giúp người thân...)</option>
                    <option value="dispute_resolution">Hòa giải mâu thuẫn tài chính khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-family-textMuted uppercase mb-1.5">
                    Độ phức tạp bối cảnh:
                  </label>
                  <select
                    value={contextType}
                    onChange={(e) => setContextType(e.target.value as any)}
                    className="w-full bg-family-bgDeep border border-family-accent/20 rounded-xl px-4 py-2 text-xs text-family-text"
                  >
                    <option value="complicated">Phức tạp (Cần tính toán dòng tiền & lãi suất)</option>
                    <option value="complex">Bất định (Nhiều cảm xúc & rủi ro khó lường)</option>
                    <option value="clear">Rõ ràng (Có quy tắc an toàn đối chiếu sẵn)</option>
                    <option value="chaotic">Cấp bách (Biến cố đột xuất cần xử lý ngay)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Card 2: Lắng nghe 2 chiều (Chồng vs Vợ) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chồng */}
            <Card className="border-blue-200/60 bg-blue-50/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-blue-900 flex items-center justify-between">
                  <span>👨‍💼 Góc nhìn & Tiếng nói của {husbandName}</span>
                  {activeActor === 'husband' && (
                    <span className="text-[10px] font-bold uppercase bg-blue-600 text-white px-2 py-0.5 rounded-full">
                      Bạn đang nhập
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-blue-950 mb-1">
                    Mong muốn / Kế hoạch của Chồng:
                  </label>
                  <textarea
                    rows={2}
                    value={husbandWants}
                    onChange={(e) => setHusbandWants(e.target.value)}
                    placeholder="VD: Muốn mua xe 800tr để đi lại an toàn cho con, ngoại giao làm ăn..."
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
                    placeholder="VD: Lo chi phí nuôi xe hàng tháng tốn kém, sợ tạo áp lực trả góp..."
                    className="w-full bg-white border border-blue-200 rounded-xl p-2.5 text-xs text-family-text focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-blue-950 mb-1">Kết quả kỳ vọng lớn nhất:</label>
                  <input
                    type="text"
                    value={husbandTarget}
                    onChange={(e) => setHusbandTarget(e.target.value)}
                    placeholder="VD: Gia đình có phương tiện an toàn che mưa nắng, an tâm khi đi xa"
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
                  {activeActor === 'wife' && (
                    <span className="text-[10px] font-bold uppercase bg-pink-600 text-white px-2 py-0.5 rounded-full">
                      Bạn đang nhập
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-pink-950 mb-1">
                    Mong muốn / Kế hoạch của Vợ:
                  </label>
                  <textarea
                    rows={2}
                    value={wifeWants}
                    onChange={(e) => setWifeWants(e.target.value)}
                    placeholder="VD: Muốn giữ tiền mặt an toàn trong sổ tiết kiệm để tích lũy mua nhà..."
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
                    placeholder="VD: Sợ xe mất giá nhanh, chi phí bảo dưỡng làm hụt quỹ khẩn cấp của con..."
                    className="w-full bg-white border border-pink-200 rounded-xl p-2.5 text-xs text-family-text focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-pink-950 mb-1">Kết quả kỳ vọng lớn nhất:</label>
                  <input
                    type="text"
                    value={wifeTarget}
                    onChange={(e) => setWifeTarget(e.target.value)}
                    placeholder="VD: Quỹ sinh hoạt và dự phòng an toàn vững vàng, không phải lo nghĩ"
                    className="w-full bg-white border border-pink-200 rounded-xl px-2.5 py-1.5 text-xs text-family-text focus:outline-none"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form Card 3: Số liệu thật (Digital Twin) */}
          <Card className="border-stone-200">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                    2. Sự Thật Dữ Liệu & Bằng Chứng Số (Digital Twin Facts)
                  </CardTitle>
                  <CardDescription>
                    Quyết định dựa trên sự thật thực tế của gia đình, không suy đoán cảm tính.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoExtractFacts}
                  className="text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-300 gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
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

              {/* ACTION: NHỜ GEMINI AI TƯ VẤN TRỰC TIẾP */}
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-stone-200">
                <span className="text-[11px] text-stone-500 italic">
                  💡 Tư vấn trực tiếp từ Trí tuệ Gemini AI theo Bộ Khung Quyết Định & Thấu Cảm Gia Đình.
                </span>
                <Button
                  type="button"
                  onClick={handleConsultGeminiDirect}
                  disabled={isConsultingAi}
                  className="w-full sm:w-auto text-xs bg-amber-600 hover:bg-amber-700 text-white gap-2 shadow-md cursor-pointer"
                >
                  {isConsultingAi ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Gemini Đang Suy Ngẫm Giải Pháp...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-200" />
                      🧠 Nhờ Trí Tuệ Gemini Soi Đường & Phân Tích Đa Chiều
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Form Card 4: Tâm Thư Đồng Thuận Yêu Thương từ Gemini AI (nếu có) */}
          {tenderLetter && (
            <Card className="border-rose-200 bg-gradient-to-r from-rose-50/70 via-amber-50/50 to-rose-50/70 shadow-md">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                  <Heart className="w-5 h-5 text-rose-600 fill-rose-500" />
                  <span>💌 Tâm Thư Đồng Thuận & Lời Nhắn Gửi Yêu Thương Từ Cố Vấn Gemini AI</span>
                  {aiSource === 'gemini' && (
                    <span className="text-[10px] bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full uppercase font-mono">
                      Gemini Live AI
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-700 leading-relaxed italic bg-white/70 p-4 rounded-xl border border-rose-200/60 shadow-2xs">
                  {tenderLetter}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Form Card 5: 4 Lăng Kính Phân Tích Đa Chiều */}
          {perspectives.analystView && (
            <Card className="border-amber-200/80 bg-stone-50/40 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BrainCircuit className="w-5 h-5 text-amber-600" />
                  3. Tổng Hợp 4 Lăng Kính Phân Tích & Đối Thoại Đa Chiều
                  <HelpTooltip text="Bao gồm 4 vai trò: Chuyên gia số liệu (Analyst), Kẻ hoài nghi (Skeptic), Chiến lược gia (Strategist) và Sứ giả hòa giải (Mediator)." />
                </CardTitle>
                <CardDescription>
                  Phân tích giúp hai vợ chồng nhìn thấu điểm mù rủi ro và cùng đứng về một phía để giải bài toán.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Analyst */}
                  <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200 text-xs space-y-1.5">
                    <div className="font-bold text-blue-900 flex items-center gap-1.5">
                      <Search className="w-4 h-4 text-blue-600" /> 1. Chuyên gia Phân tích (Analyst View)
                    </div>
                    <p className="text-slate-700 leading-relaxed">{perspectives.analystView}</p>
                  </div>

                  {/* Skeptic */}
                  <div className="p-3.5 bg-rose-50/80 rounded-2xl border border-rose-200 text-xs space-y-1.5">
                    <div className="font-bold text-rose-900 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-600" /> 2. Kẻ Hoài nghi & Rủi ro (Skeptic View)
                    </div>
                    <p className="text-slate-700 leading-relaxed">{perspectives.skepticView}</p>
                  </div>

                  {/* Strategist */}
                  <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-xs space-y-1.5">
                    <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" /> 3. Chiến lược gia Cuộc sống (Strategist View)
                    </div>
                    <p className="text-slate-700 leading-relaxed">{perspectives.strategistView}</p>
                  </div>

                  {/* Mediator */}
                  <div className="p-3.5 bg-purple-50/80 rounded-2xl border border-purple-200 text-xs space-y-1.5">
                    <div className="font-bold text-purple-900 flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-purple-600" /> 4. Sứ giả Yêu thương & Hòa giải (Mediator View)
                    </div>
                    <p className="text-slate-700 leading-relaxed">{perspectives.mediatorView}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Form Card 6: Các Phương Án Lựa Chọn May Đo Riêng */}
          {options.length > 0 && (
            <Card className="border-stone-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-amber-600" />
                    4. Các Phương Án Hành Động Được Thiết Kế Riêng
                  </span>
                  <span className="text-xs text-stone-500 font-normal">
                    Chọn phương án hai vợ chồng thấy phù hợp nhất
                  </span>
                </CardTitle>
                <CardDescription>
                  Các phương án đã được định lượng chi phí, mức độ rủi ro và khả năng đảo ngược.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {options.map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => setChosenOptionId(opt.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        chosenOptionId === opt.id
                          ? 'border-amber-600 bg-amber-50/40 ring-2 ring-amber-500/30 shadow-md'
                          : 'border-stone-200 bg-white hover:border-amber-300 hover:bg-stone-50/60'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-xs text-family-text leading-tight">{opt.name}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                              opt.riskLevel === 'low'
                                ? 'bg-emerald-100 text-emerald-800'
                                : opt.riskLevel === 'medium'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            Rủi ro: {opt.riskLevel.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 leading-relaxed">{opt.description}</p>

                        <div className="space-y-1 pt-1 text-[11px]">
                          <div className="text-emerald-700 font-medium">
                            {opt.pros.map((p, i) => (
                              <div key={i}>✓ {p}</div>
                            ))}
                          </div>
                          {opt.cons && opt.cons.length > 0 && (
                            <div className="text-rose-700 font-medium">
                              {opt.cons.map((c, i) => (
                                <div key={i}>✗ {c}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-stone-200/80 flex items-center justify-between text-xs">
                        <span className="font-bold text-stone-700">
                          Chi phí: {opt.costEstimate > 0 ? `${opt.costEstimate.toLocaleString('vi-VN')} tr` : '0 đ'}
                        </span>
                        <span className="font-bold text-amber-700 text-xs">Điểm: {opt.score}/100</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Hàng rào an toàn & Điểm dừng */}
                <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-1.5 text-xs">
                  <label className="block font-bold text-family-text text-xs">
                    🛡️ Hàng rào an toàn & Điểm dừng (Guardrails & Stop-loss):
                  </label>
                  <input
                    type="text"
                    value={guardrails}
                    onChange={(e) => setGuardrails(e.target.value)}
                    placeholder="VD: Chi phí phát sinh không vượt quá 10 tr/tháng, kiểm tra lại sau 3 tháng..."
                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-family-text focus:outline-none"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Form Card 7: Bảng Điểm Chất Lượng Quyết Định (Scorecard 100 điểm) */}
          {options.length > 0 && (
            <Card className="border-emerald-200/80 bg-stone-50/40">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      5. Bảng Điểm Chất Lượng Quyết Định (AI Quality Scorecard)
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
                    <span className="text-[10px] text-stone-500 block">Giới hạn rủi ro</span>
                    <span className="font-bold text-sm text-family-text">{currentScorecard.executionGuardrails}/10</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-stone-200">
                    <span className="text-[10px] text-stone-500 block">Lắng nghe & Thấu cảm</span>
                    <span className="font-bold text-sm text-family-text">{currentScorecard.communicationFairness}/10</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-stone-200 bg-emerald-50/50">
                    <span className="text-[10px] text-emerald-800 block font-semibold">TỔNG ĐIỂM</span>
                    <span className="font-extrabold text-base text-emerald-700">{currentScorecard.total}/100</span>
                  </div>
                </div>

                {/* NÚT KÍCH HOẠT CHỐT ĐỒNG THUẬN */}
                <div className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-xs text-family-textMuted">
                    Khi hai vợ chồng đã thống nhất, hãy bấm nút chốt để lưu giữ bản cam kết đồng lòng vào Sổ Tay.
                  </p>
                  <Button
                    type="button"
                    onClick={() => setIsFinalizingConsensus(true)}
                    className="w-full sm:w-auto text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg cursor-pointer"
                  >
                    <HeartHandshake className="w-4 h-4" />
                    Chốt Quyết Định Đồng Thuận Này
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION CHỐT QUYẾT ĐỊNH ĐỒNG THUẬN (CONSENSUS LOCK-IN) */}
          {isFinalizingConsensus && (
            <Card className="border-2 border-emerald-500 bg-gradient-to-br from-emerald-50/40 via-white to-amber-50/30 shadow-xl animate-in zoom-in-95">
              <CardHeader className="bg-emerald-600 text-white rounded-t-xl p-4">
                <CardTitle className="flex items-center gap-2 text-base text-white">
                  <HeartHandshake className="w-5 h-5 text-emerald-200" />
                  Ký Duyệt & Lưu Quyết Định Đồng Thuận Tổ Ấm
                </CardTitle>
                <CardDescription className="text-emerald-100 text-xs">
                  Lưu lại nội dung chốt cụ thể, phân công thực thi và mốc thời gian hai vợ chồng cùng ngồi lại rà soát.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-emerald-950 uppercase mb-1">
                    1. Nội dung chốt cụ thể là gì? (Consensus Resolution) *
                  </label>
                  <textarea
                    rows={3}
                    value={agreedSummary}
                    onChange={(e) => setAgreedSummary(e.target.value)}
                    placeholder="VD: Hai vợ chồng thống nhất mua xe lướt 500 triệu trả thẳng (không vay nợ ngân hàng). Anh Phước phụ trách tìm xe và đăng kiểm, vợ phụ trách hạch toán chi phí bảo dưỡng. Trích 300tr từ tiết kiệm và 200tr từ thưởng..."
                    className="w-full bg-white border border-emerald-300 rounded-xl p-3 text-xs text-family-text focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-950 uppercase mb-1">
                    2. Các cam kết then chốt & Phân công trách nhiệm (Key Commitments):
                  </label>
                  <textarea
                    rows={2}
                    value={keyCommitments}
                    onChange={(e) => setKeyCommitments(e.target.value)}
                    placeholder="Mỗi dòng một cam kết:&#10;- Chồng cam kết giữ chi phí nuôi xe dưới 8 triệu/tháng&#10;- Vợ vẫn duy trì đều đặn 15 triệu/tháng vào quỹ tiết kiệm"
                    className="w-full bg-white border border-emerald-300 rounded-xl p-3 text-xs text-family-text focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-emerald-900 mb-1">Người phụ trách thực thi:</label>
                    <input
                      type="text"
                      value={executor}
                      onChange={(e) => setExecutor(e.target.value)}
                      className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs text-family-text focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-emerald-900 mb-1">
                      Mốc thời gian ngồi lại rà soát (Review Date):
                    </label>
                    <input
                      type="date"
                      value={reviewDate}
                      onChange={(e) => setReviewDate(e.target.value)}
                      className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs text-family-text focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsFinalizingConsensus(false)}
                    className="text-xs text-stone-600"
                  >
                    Quay lại thảo luận thêm
                  </Button>
                  <Button
                    type="button"
                    onClick={handleLockInConsensus}
                    className="w-full sm:w-auto text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg"
                  >
                    <CheckSquare className="w-4 h-4" />
                    Xác Nhận Ký Duyệt & Chốt Quyết Định
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-family-text flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-amber-600" />
                Sổ Tay Kỷ Lục Quyết Định Tổ Ấm ({decisions.length})
              </h3>
              <p className="text-xs text-family-textMuted mt-0.5">
                Nơi lưu giữ mọi băn khoăn đang thảo luận và các thỏa thuận đồng thuận đã được hai vợ chồng ký duyệt.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleResetFormNew}
              className="text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white shrink-0 self-start sm:self-center"
            >
              <Plus className="w-3.5 h-3.5" /> Tạo Quyết Định Mới
            </Button>
          </div>

          {/* Bộ lọc trạng thái */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {[
              { id: 'all', label: `Tất cả (${statusCounts.all})` },
              { id: 'initiated', label: `🟡 Khởi tạo (${statusCounts.initiated})` },
              { id: 'discussing', label: `🔵 Đang thảo luận (${statusCounts.discussing})` },
              { id: 'agreed', label: `🟢 Đã chốt (${statusCounts.agreed})` },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setVaultStatusFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  vaultStatusFilter === f.id
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredDecisions.length > 0 ? (
            <div className="space-y-3 pt-2">
              {filteredDecisions.map((dec) => (
                <Card key={dec.id} className="hover:shadow-md transition-shadow border-stone-200">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-family-text">{dec.title}</span>
                          {getStatusBadge(dec.status)}
                          <span className="text-[10px] font-semibold bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md border border-stone-200">
                            {dec.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-family-textMuted flex flex-wrap items-center gap-3">
                          <span>📅 Ngày: {new Date(dec.createdAt).toLocaleDateString('vi-VN')}</span>
                          <span>
                            👤 Khởi tạo: {dec.createdBy === 'husband' ? `👨‍💼 ${husbandName}` : `👩‍💼 ${wifeName}`}
                          </span>
                          <span>🔍 Rà soát: {dec.governance?.reviewDate || 'Chưa đặt'}</span>
                          <span className="font-bold text-emerald-700">Điểm: {dec.qualityScore?.total || 90}/100</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleLoadDecisionForDiscussion(dec)}
                          className="text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-50 border-amber-300 gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          {dec.status === 'agreed' || dec.status === 'decided' ? 'Xem Chi Tiết' : 'Vào Thảo Luận'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (window.confirm(`Bạn có chắc chắn muốn xóa quyết định "${dec.title}" khỏi sổ tay? Thao tác này sẽ đồng bộ xóa trên Cloud của cả hai vợ chồng.`)) {
                              deleteDecisionRecord(dec.id);
                              if (pushSystemLog) {
                                pushSystemLog('XÓA', 'Quyết định', `${currentActorName} đã xóa quyết định: "${dec.title}"`);
                              }
                              setSuccessNotice(`Đã xóa quyết định "${dec.title}" khỏi sổ tay.`);
                              setTimeout(() => setSuccessNotice(null), 3000);
                            }
                          }}
                          className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 gap-1 cursor-pointer"
                          title="Xóa quyết định khỏi sổ tay"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Xóa
                        </Button>
                      </div>
                    </div>

                    {/* NỘI DUNG CHỐT ĐỒNG THUẬN NẾU ĐÃ CHỐT */}
                    {dec.finalResolution ? (
                      <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs space-y-2">
                        <div className="font-bold text-emerald-950 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <CheckSquare className="w-4 h-4 text-emerald-700" />
                            Nội dung chốt đồng thuận:
                          </span>
                          <span className="text-[10px] text-emerald-700 font-normal">
                            Ký ngày: {new Date(dec.finalResolution.agreedAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <p className="text-emerald-900 font-medium leading-relaxed bg-white/60 p-2.5 rounded-lg border border-emerald-200/50">
                          {dec.finalResolution.agreedSummary}
                        </p>
                        {dec.finalResolution.keyCommitments && dec.finalResolution.keyCommitments.length > 0 && (
                          <div className="text-[11px] text-slate-700 space-y-0.5 pt-1">
                            <span className="font-bold text-emerald-900 block">Cam kết thực thi:</span>
                            {dec.finalResolution.keyCommitments.map((c, i) => (
                              <div key={i}>• {c}</div>
                            ))}
                          </div>
                        )}
                        {dec.finalResolution.guardrails && (
                          <div className="text-[11px] text-rose-800 font-semibold pt-1">
                            🛡️ Giới hạn an toàn (Guardrails): {dec.finalResolution.guardrails}
                          </div>
                        )}
                      </div>
                    ) : dec.chosenOptionId ? (
                      <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs space-y-1">
                        <div className="font-bold text-amber-950 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                          Phương án đang hướng tới:{' '}
                          <span className="text-amber-800">
                            {dec.options.find((o) => o.id === dec.chosenOptionId)?.name || 'Phương án tối ưu'}
                          </span>
                        </div>
                        {dec.chosenRationale && <p className="text-slate-700 italic">{dec.chosenRationale}</p>}
                      </div>
                    ) : (
                      <div className="p-2.5 bg-stone-50 rounded-xl text-[11px] text-stone-500 italic">
                        Phiên đang mở, hai vợ chồng chưa chốt phương án. Bấm "Vào Thảo Luận" để cùng trao đổi.
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
                Không tìm thấy quyết định nào trong mục này. Hãy mở tab <strong>"Phiên Đồng Thuận"</strong> hoặc chọn <strong>"Tình Huống Điển Hình"</strong> để bắt đầu!
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
                onClick={() => handleApplyTemplate(tmpl)}
                className="p-4 bg-white rounded-2xl border border-stone-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      {tmpl.category}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">{tmpl.contextType}</span>
                  </div>
                  <h4 className="font-bold text-sm text-family-text leading-snug">{tmpl.title}</h4>
                  <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">{tmpl.description}</p>
                </div>

                <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between text-xs text-amber-700 font-semibold">
                  <span>Mở kịch bản này</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
