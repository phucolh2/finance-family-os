import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { HelpTooltip } from '../ui/HelpTooltip';
import { Button } from '../ui/Button';
import {
  Cloud,
  RefreshCw,
  Camera,
  RotateCcw,
  Trash2,
  Download,
  ShieldCheck,
  Clock,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import {
  listCloudSnapshots,
  deleteCloudSnapshot,
  restoreCloudSnapshot,
  downloadSnapshotAsJson,
  type CloudSnapshotItem,
} from '../../services/cloudBackup';
import { getActiveActor } from '../../config/familyMembers';

export const CloudSnapshotVault: React.FC<{ onRestoreSuccess?: () => void }> = ({ onRestoreSuccess }) => {
  const { createCloudSnapshot, state } = useAppContext();
  const [snapshots, setSnapshots] = useState<CloudSnapshotItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSnapshots = useCallback(async () => {
    setLoading(true);
    try {
      const items = await listCloudSnapshots(20);
      setSnapshots(items);
    } catch {
      setActionMsg({ type: 'error', text: 'Không thể tải danh sách bản sao lưu từ Cloud' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  const handleCreateSnapshot = async () => {
    setCreating(true);
    setActionMsg(null);
    try {
      const label = customLabel.trim() || undefined;
      const res = await createCloudSnapshot(label);
      if (res) {
        setActionMsg({ type: 'success', text: `Đã chụp và lưu thành công bản sao lưu "${res.label}" lên Cloud!` });
        setCustomLabel('');
        setShowInput(false);
        fetchSnapshots();
      } else {
        setActionMsg({ type: 'error', text: 'Lưu bản sao lưu lên Cloud thất bại' });
      }
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err?.message || 'Có lỗi xảy ra khi sao lưu' });
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (snap: CloudSnapshotItem) => {
    const actorRole = getActiveActor();
    const actorName = actorRole === 'wife'
      ? (state.profile?.wifeName ? `Vợ (${state.profile.wifeName})` : 'Vợ (Diệu Hồng)')
      : (state.profile?.husbandName ? `Chồng (${state.profile.husbandName})` : 'Chồng (Hoài Phước)');

    const confirmMsg = `Bạn có chắc chắn muốn khôi phục dữ liệu về bản sao lưu "${snap.label}" do ${snap.createdBy} tạo lúc ${new Date(snap.createdAt).toLocaleString('vi-VN')}?\n\nDữ liệu hiện tại của cả 2 vợ chồng sẽ được đồng bộ về mốc này.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setLoading(true);
      await restoreCloudSnapshot(snap.id, actorName);
      setActionMsg({
        type: 'success',
        text: `Đã khôi phục thành công về bản sao lưu "${snap.label}". Hệ thống đang tự động làm mới dữ liệu...`,
      });
      if (onRestoreSuccess) onRestoreSuccess();
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err?.message || 'Khôi phục bản sao lưu thất bại' });
      setLoading(false);
    }
  };

  const handleDelete = async (snap: CloudSnapshotItem) => {
    if (!window.confirm(`Xóa bản sao lưu Cloud "${snap.label}"?`)) return;
    try {
      const ok = await deleteCloudSnapshot(snap.id);
      if (ok) {
        setSnapshots((prev) => prev.filter((s) => s.id !== snap.id));
        setActionMsg({ type: 'success', text: 'Đã xóa bản sao lưu' });
      }
    } catch {
      setActionMsg({ type: 'error', text: 'Lỗi khi xóa bản sao lưu' });
    }
  };

  const getReasonBadge = (reason: CloudSnapshotItem['reason']) => {
    switch (reason) {
      case 'pre_sync_safety':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
            <ShieldCheck className="w-3 h-3 text-emerald-700" />
            Lưới an toàn (Tự chụp trước khi đè)
          </span>
        );
      case 'auto_schedule':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-300">
            <Clock className="w-3 h-3 text-blue-700" />
            Tự động định kỳ
          </span>
        );
      case 'conflict_backup':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300">
            <AlertCircle className="w-3 h-3 text-amber-700" />
            Sao lưu khi xung đột
          </span>
        );
      case 'manual':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-stone-100 text-stone-800 px-2 py-0.5 rounded-full border border-stone-300">
            <Camera className="w-3 h-3 text-stone-700" />
            Chụp thủ công
          </span>
        );
    }
  };

  return (
    <div className="border-t border-family-accent/10 pt-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-sm text-family-text flex items-center gap-2">
            <Cloud className="w-4 h-4 text-emerald-600" />
            Lịch sử Sao lưu Đám mây (Cloud Snapshot Vault)
            <HelpTooltip text="Bản sao lưu toàn vẹn JSON được lưu tự động trên Cloud Firestore. Cả 2 vợ chồng đều có thể xem danh sách, tải về tệp JSON, hoặc khôi phục 1 chạm bất kỳ lúc nào nếu lỡ tay xóa nhầm hoặc nghi ngờ bị ghi đè." />
          </h4>
          <p className="text-[11px] text-family-textMuted mt-0.5">
            Lưu trữ tối đa 20 bản mốc gần nhất. Tự động chụp lưới an toàn mỗi khi người này chuẩn bị cập nhật đè lên bản của người kia.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchSnapshots}
            disabled={loading}
            className="text-xs h-8 px-2.5 gap-1.5"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => setShowInput((prev) => !prev)}
            className="text-xs h-8 px-3 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Camera className="w-3.5 h-3.5" />
            Chụp mốc mới
          </Button>
        </div>
      </div>

      {actionMsg && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            actionMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {actionMsg.type === 'success' ? (
            <Sparkles className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {showInput && (
        <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 animate-in fade-in duration-200">
          <input
            type="text"
            placeholder="Đặt tên gợi nhớ cho mốc này (VD: Trước khi chốt mua xe, Sau khi vợ nhập chi tiêu...)"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            className="flex-1 bg-white border border-emerald-300 rounded-xl px-3 py-1.5 text-xs text-family-text focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
          />
          <div className="flex items-center gap-2 justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowInput(false);
                setCustomLabel('');
              }}
              className="text-xs h-8 px-3"
            >
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleCreateSnapshot}
              disabled={creating}
              className="text-xs h-8 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {creating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              Lưu lên Cloud ngay
            </Button>
          </div>
        </div>
      )}

      {loading && snapshots.length === 0 ? (
        <div className="p-6 text-center text-xs text-family-textMuted bg-family-bgDark/10 rounded-2xl flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
          Đang tải danh sách bản sao lưu từ Cloud...
        </div>
      ) : snapshots.length > 0 ? (
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {snapshots.map((snap) => (
            <div
              key={snap.id}
              className="p-3 bg-white/80 hover:bg-white border border-family-accent/15 rounded-2xl shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-xs text-family-text">{snap.label}</span>
                  {getReasonBadge(snap.reason)}
                  <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                    👤 {snap.createdBy}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-family-textMuted">
                  <span>⏱️ {new Date(snap.createdAt).toLocaleString('vi-VN')}</span>
                  {snap.summary && (
                    <span>
                      📊 {snap.summary.incomeScheduleCount} mốc TN · {snap.summary.budgetScheduleCount} mốc NS · {snap.summary.assetsCount} tài sản · {snap.summary.savingsDepositsCount} sổ TK
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                <button
                  type="button"
                  onClick={() => downloadSnapshotAsJson(snap)}
                  className="px-2.5 py-1.5 text-[11px] font-semibold rounded-xl border border-family-accent/20 bg-white hover:bg-family-accent/5 text-family-text flex items-center gap-1 transition-colors cursor-pointer"
                  title="Tải tệp JSON của bản sao lưu này về máy"
                >
                  <Download className="w-3.5 h-3.5 text-family-accent" />
                  <span>Tải JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRestore(snap)}
                  className="px-2.5 py-1.5 text-[11px] font-semibold rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Khôi phục dữ liệu toàn hệ thống về mốc này"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Khôi phục</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(snap)}
                  className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                  title="Xóa bản sao lưu này khỏi Cloud"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center rounded-2xl bg-family-bgDark/15 border border-dashed border-family-accent/20">
          <p className="text-xs text-family-textMuted">
            Chưa có bản sao lưu nào trên Cloud. Bấm <strong>"Chụp mốc mới"</strong> ở trên để tạo điểm phục hồi an toàn đầu tiên!
          </p>
        </div>
      )}
    </div>
  );
};
