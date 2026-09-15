import React, { useState } from 'react';
import { ShieldCheck, Plus, Trash2, Edit3, CheckCircle2, Info } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import { formatTableMoneyVNDMillion } from '../utils/format';
import type { InsurancePolicy } from '../types/finance';

const generateId = () => Math.random().toString(36).substring(2, 9);

export const InsuranceManager: React.FC = () => {
  const { state, updateAppState } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [currentPolicy, setCurrentPolicy] = useState<Partial<InsurancePolicy>>({});
  
  const policies = state.insurancePolicies || [];

  const handleAddOrUpdate = () => {
    if (!currentPolicy.type || !currentPolicy.provider || !currentPolicy.policyNumber) {
      alert('Vui lòng điền đủ Phân loại, Hãng cung cấp và Mã sổ/Hợp đồng.');
      return;
    }

    let updatedPolicies = [...policies];
    if (currentPolicy.id) {
      updatedPolicies = updatedPolicies.map(p => p.id === currentPolicy.id ? currentPolicy as InsurancePolicy : p);
    } else {
      updatedPolicies.push({
        ...currentPolicy,
        id: `ins_${generateId()}`,
        status: currentPolicy.status || 'active',
        paymentFrequency: currentPolicy.paymentFrequency || 'yearly',
        premium: currentPolicy.premium || 0,
      } as InsurancePolicy);
    }

    updateAppState({ ...state, insurancePolicies: updatedPolicies });
    setIsEditing(false);
    setCurrentPolicy({});
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa hợp đồng bảo hiểm này?')) {
      const updated = policies.filter(p => p.id !== id);
      updateAppState({ ...state, insurancePolicies: updated });
    }
  };

  const getPolicyTypeLabel = (type: string) => {
    switch (type) {
      case 'social': return 'BHXH / BHYT (Nhà nước)';
      case 'life': return 'Bảo hiểm Nhân thọ';
      case 'health': return 'Bảo hiểm Sức khỏe / Phi nhân thọ';
      case 'vehicle': return 'Bảo hiểm Tài sản / Xe cộ';
      default: return 'Khác';
    }
  };

  const getPolicyColor = (type: string) => {
    switch (type) {
      case 'social': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'life': return 'bg-red-50 border-red-200 text-red-800';
      case 'health': return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'vehicle': return 'bg-orange-50 border-orange-200 text-orange-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between border-b border-family-accent/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-family-accent/10 rounded-xl">
            <ShieldCheck className="w-6 h-6 text-family-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-family-text flex items-center gap-2">
              Sổ Quản Lý Bảo Hiểm
              <HelpTooltip text="Quản lý tập trung thông tin hợp đồng bảo hiểm (Prudential, AIA, VssID...). Các khoản phí nhập ở đây chỉ để tra cứu, không tự động cộng trừ vào Dòng tiền chính của dự án." />
            </h1>
            <p className="text-sm text-family-textMuted mt-1">
              Trung tâm lưu trữ hợp đồng và sổ bảo hiểm của toàn gia đình
            </p>
          </div>
        </div>
        <button
          onClick={() => { setCurrentPolicy({}); setIsEditing(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-family-accent text-white rounded-xl hover:bg-family-accentDark transition-colors shadow-sm text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> Thêm hợp đồng
        </button>
      </div>

      {isEditing && (
        <Card className="border-family-accent/30 shadow-md">
          <CardHeader className="bg-family-bgDeep border-b border-family-accent/10">
            <CardTitle>{currentPolicy.id ? 'Sửa thông tin hợp đồng' : 'Khai báo Sổ/Hợp đồng bảo hiểm mới'}</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-family-textLight uppercase mb-2">Loại hình</label>
                <select
                  value={currentPolicy.type || ''}
                  onChange={e => setCurrentPolicy({ ...currentPolicy, type: e.target.value as InsurancePolicy['type'] })}
                  className="w-full h-11 px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-family-accent focus:border-transparent text-sm"
                >
                  <option value="">-- Chọn phân loại --</option>
                  <option value="social">Sổ BHXH / BHYT (Nhà nước)</option>
                  <option value="life">Bảo hiểm Nhân thọ (Life Insurance)</option>
                  <option value="health">Bảo hiểm Sức khỏe / Rời (Non-life)</option>
                  <option value="vehicle">Bảo hiểm Tài sản / Ô tô / Xe máy</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-family-textLight uppercase mb-2">Hãng cung cấp (Cơ quan)</label>
                <Input
                  type="text"
                  placeholder="VD: Cơ quan BHXH, Prudential, AIA..."
                  value={currentPolicy.provider || ''}
                  onChange={e => setCurrentPolicy({ ...currentPolicy, provider: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-family-textLight uppercase mb-2">Số Hợp đồng / Số Sổ (VssID)</label>
                <Input
                  type="text"
                  placeholder="VD: 79162xxxx hoặc PRU-1234..."
                  value={currentPolicy.policyNumber || ''}
                  onChange={e => setCurrentPolicy({ ...currentPolicy, policyNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-family-textLight uppercase mb-2">Người / Tài sản được bảo hiểm</label>
                <Input
                  type="text"
                  placeholder={`VD: ${state.profile.husbandName}, Xe máy 59X1...`}
                  value={currentPolicy.insuredPerson || ''}
                  onChange={e => setCurrentPolicy({ ...currentPolicy, insuredPerson: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-family-textLight uppercase mb-2">Phí đóng định kỳ (Triệu VNĐ)</label>
                <Input
                  type="number"
                  placeholder="VD: 15"
                  value={currentPolicy.premium || ''}
                  onChange={e => setCurrentPolicy({ ...currentPolicy, premium: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-family-textLight uppercase mb-2">Tần suất đóng</label>
                <select
                  value={currentPolicy.paymentFrequency || 'yearly'}
                  onChange={e => setCurrentPolicy({ ...currentPolicy, paymentFrequency: e.target.value as InsurancePolicy['paymentFrequency'] })}
                  className="w-full h-11 px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-family-accent focus:border-transparent text-sm"
                >
                  <option value="yearly">Mỗi Năm</option>
                  <option value="monthly">Mỗi Tháng</option>
                  <option value="one_time">Đóng 1 Lần / Khác</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-family-textLight uppercase mb-2">Ghi chú (Quyền lợi, Nơi cất hợp đồng...)</label>
                <textarea
                  className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-family-accent focus:border-transparent text-sm"
                  rows={3}
                  placeholder="VD: Bản cứng cất trong két sắt phòng ngủ. Quyền lợi nội trú 500tr/năm..."
                  value={currentPolicy.notes || ''}
                  onChange={e => setCurrentPolicy({ ...currentPolicy, notes: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
              <button
                onClick={() => setIsEditing(false)}
                className="px-5 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleAddOrUpdate}
                className="px-6 py-2 text-sm font-semibold bg-family-accent text-white rounded-xl hover:bg-family-accentDark transition-colors shadow-sm"
              >
                Lưu Hợp Đồng
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {policies.length === 0 && !isEditing ? (
        <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-2xl">
          <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-gray-500 font-semibold mb-1">Chưa có hợp đồng bảo hiểm nào</h3>
          <p className="text-sm text-gray-400">Bấm "Thêm hợp đồng" để ghi nhận thông tin Sổ BHXH hoặc Hợp đồng Nhân thọ.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {policies.map(policy => (
            <div key={policy.id} className={`border rounded-2xl p-5 shadow-sm relative group overflow-hidden ${getPolicyColor(policy.type)}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-70 flex items-center gap-1 mb-1">
                    {policy.type === 'social' ? <CheckCircle2 className="w-3 h-3" /> : <Info className="w-3 h-3" />}
                    {getPolicyTypeLabel(policy.type)}
                  </span>
                  <h3 className="text-lg font-bold">{policy.provider}</h3>
                  <div className="text-sm opacity-80 mt-1 font-mono">Sổ/HĐ: {policy.policyNumber}</div>
                </div>
                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setCurrentPolicy(policy); setIsEditing(true); }} className="p-1.5 bg-white/50 hover:bg-white rounded-lg text-gray-700 shadow-sm transition-colors">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(policy.id)} className="p-1.5 bg-red-100 hover:bg-red-200 rounded-lg text-red-600 shadow-sm transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4 bg-white/40 p-3 rounded-xl border border-white/50">
                <div>
                  <div className="text-[10px] uppercase font-bold opacity-60">Người / Tài sản</div>
                  <div className="font-semibold text-sm">{policy.insuredPerson}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold opacity-60">Phí đóng</div>
                  <div className="font-semibold text-sm">
                    {policy.premium > 0 ? formatTableMoneyVNDMillion(policy.premium) : 'Miễn phí'} 
                    {policy.premium > 0 && <span className="text-xs opacity-70 ml-1">/{policy.paymentFrequency === 'yearly' ? 'Năm' : policy.paymentFrequency === 'monthly' ? 'Tháng' : 'Lần'}</span>}
                  </div>
                </div>
              </div>

              {policy.notes && (
                <div className="text-xs opacity-80 bg-black/5 p-3 rounded-xl italic">
                  📝 {policy.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
