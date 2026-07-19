import React, { useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { WarningBox } from '../components/ui/WarningBox';
import { Download, Upload, ShieldAlert, CheckCircle2, Plus, Trash2, Edit2, X, Save } from 'lucide-react';
import { validateAppState } from '../utils/migration';
import type { NonTermInterestRatePeriod, IncomeCategory } from '../types/finance';

const IncomeCategoriesSettings: React.FC = () => {
  const { state, addIncomeCategory, updateIncomeCategory, deleteIncomeCategory } = useAppContext();
  const categories = state.incomeCategories || [];

  const [newCat, setNewCat] = useState<Omit<IncomeCategory, 'id'>>({
    name: '',
    type: 'active',
  });

  const handleAdd = () => {
    if (!newCat.name) return;
    addIncomeCategory(newCat);
    setNewCat({ name: '', type: 'active' });
  };

  const handleToggleType = (cat: IncomeCategory) => {
    updateIncomeCategory({
      ...cat,
      type: cat.type === 'active' ? 'passive' : 'active',
    });
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCat, setEditingCat] = useState<IncomeCategory | null>(null);

  const handleEditClick = (cat: IncomeCategory) => {
    setEditingId(cat.id);
    setEditingCat(cat);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingCat(null);
  };

  const handleSaveEdit = () => {
    if (editingCat && editingCat.name) {
      updateIncomeCategory(editingCat);
      setEditingId(null);
      setEditingCat(null);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa danh mục này? Các mốc thu nhập đang sử dụng danh mục này sẽ tự động chuyển thành "Thu nhập không cố định".')) {
      deleteIncomeCategory(id);
    }
  };

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>Cấu hình Danh mục Thu nhập</CardTitle>
        <CardDescription>Quản lý các loại thu nhập và phân loại Chủ động/Thụ động để phục vụ báo cáo Dòng tiền.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-family-bgDark/20 p-4 rounded-xl border border-family-accent/10">
          <h4 className="font-semibold text-sm mb-3">Thêm loại thu nhập mới</h4>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-64">
              <Input label="Tên danh mục" type="text" value={newCat.name} placeholder="VD: Thuê nhà, Cổ tức..." onChange={e => { setNewCat({...newCat, name: e.target.value}); }} />
            </div>
            <div className="w-48">
              <label className="block text-xs font-semibold text-family-textMuted uppercase mb-1.5">Loại (Chủ động/Thụ động)</label>
              <select 
                className="w-full bg-family-bgDeep border border-family-accent/20 rounded-xl px-4 py-2.5 text-family-text focus:outline-none focus:border-family-accent/60 transition-colors text-xs h-[42px]"
                value={newCat.type}
                onChange={(e) => { setNewCat({...newCat, type: e.target.value as 'active' | 'passive'}); }}
              >
                <option value="active">Chủ động (Active)</option>
                <option value="passive">Thụ động (Passive)</option>
              </select>
            </div>
            <Button onClick={handleAdd} size="sm" className="h-[42px] mb-[2px] gap-1"><Plus className="w-4 h-4"/> Thêm</Button>
          </div>
        </div>

        {categories.length > 0 ? (
          <table className="w-full text-left text-sm mt-4 border-collapse">
            <thead>
              <tr className="border-b border-family-accent/10 text-family-textMuted text-xs uppercase">
                <th className="py-2 font-semibold">Tên danh mục</th>
                <th className="py-2 font-semibold">Phân loại</th>
                <th className="py-2 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, idx) => (
                <tr key={idx} className="border-b border-family-accent/5 hover:bg-family-bgDark/10">
                  <td className="py-3 font-medium">
                    {editingId === cat.id && editingCat ? (
                      <input 
                        type="text" 
                        value={editingCat.name} 
                        onChange={(e) => setEditingCat({...editingCat, name: e.target.value})}
                        className="w-full bg-family-bg border border-family-accent/30 rounded px-2 py-1 text-xs outline-none"
                      />
                    ) : (
                      <>
                        {cat.name}
                        {cat.isDefault && <span className="ml-2 text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">Mặc định</span>}
                      </>
                    )}
                  </td>
                  <td className="py-3">
                    {editingId === cat.id && editingCat ? (
                      <select 
                        value={editingCat.type}
                        onChange={(e) => setEditingCat({...editingCat, type: e.target.value as 'active' | 'passive'})}
                        className="bg-family-bg border border-family-accent/30 rounded px-2 py-1 text-xs outline-none"
                      >
                        <option value="active">Chủ động</option>
                        <option value="passive">Thụ động</option>
                      </select>
                    ) : (
                      <button onClick={() => { handleToggleType(cat); }} className={`text-xs px-2 py-1 rounded font-bold cursor-pointer hover:opacity-80 ${cat.type === 'passive' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {cat.type === 'passive' ? 'Thụ động' : 'Chủ động'}
                      </button>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-1">
                      {editingId === cat.id ? (
                          <>
                            <Button variant="outline" size="sm" onClick={handleSaveEdit} className="text-green-600 hover:text-green-800 hover:bg-green-50 px-2 h-8">
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleCancelEdit} className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 px-2 h-8">
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleEditClick(cat)} className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 px-2 h-8">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(cat.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2 h-8">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-family-textMuted italic pt-2">Chưa có danh mục thu nhập nào.</p>
        )}
      </CardContent>
    </Card>
  );
};

const AssumptionsSettings: React.FC = () => {
  const { state, updateAssumptions } = useAppContext();
  const schedule = state.assumptions.nonTermInterestRateSchedule || [];
  
  const [newPeriod, setNewPeriod] = useState<NonTermInterestRatePeriod>({
    startMonth: 1,
    startYear: 2024,
    rateAnnual: 0.1,
  });
  
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingPeriod, setEditingPeriod] = useState<NonTermInterestRatePeriod | null>(null);

  const handleAdd = () => {
    updateAssumptions({
      ...state.assumptions,
      nonTermInterestRateSchedule: [...schedule, newPeriod].sort((a, b) => 
        (a.startYear * 12 + a.startMonth) - (b.startYear * 12 + b.startMonth)
      ),
    });
    setNewPeriod({ startMonth: 1, startYear: 2024, rateAnnual: 0.1 });
  };

  const handleRemove = (index: number) => {
    const updated = [...schedule];
    updated.splice(index, 1);
    updateAssumptions({
      ...state.assumptions,
      nonTermInterestRateSchedule: updated,
    });
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editingPeriod) {
      const updated = [...schedule];
      updated[editingIndex] = editingPeriod;
      updateAssumptions({
        ...state.assumptions,
        nonTermInterestRateSchedule: updated.sort((a, b) => 
          (a.startYear * 12 + a.startMonth) - (b.startYear * 12 + b.startMonth)
        ),
      });
      setEditingIndex(null);
      setEditingPeriod(null);
    }
  };

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>Cấu hình Tham số Dòng tiền (Assumptions)</CardTitle>
        <CardDescription>Cấu hình Lịch sử Lãi suất không kỳ hạn để hệ thống tự động tính toán số tiền lãi khi rút gốc từng phần hoặc tất toán trước hạn.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-family-bgDark/20 p-4 rounded-xl border border-family-accent/10">
          <h4 className="font-semibold text-sm mb-3">Thêm mốc Lãi suất không kỳ hạn</h4>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-24">
              <Input label="Tháng" type="number" min={1} max={12} value={newPeriod.startMonth} onChange={e => { setNewPeriod({...newPeriod, startMonth: Number(e.target.value)}); }} />
            </div>
            <div className="w-28">
              <Input label="Năm" type="number" min={2000} max={2060} value={newPeriod.startYear} onChange={e => { setNewPeriod({...newPeriod, startYear: Number(e.target.value)}); }} />
            </div>
            <div className="w-32">
              <Input label="Lãi suất (%/năm)" type="number" step="0.1" value={newPeriod.rateAnnual || ''} placeholder="VD: 0.1" onChange={e => { setNewPeriod({...newPeriod, rateAnnual: Number(e.target.value)}); }} />
            </div>
            <Button onClick={handleAdd} size="sm" className="h-10 mb-[2px] gap-1"><Plus className="w-4 h-4"/> Thêm</Button>
          </div>
        </div>

        {schedule.length > 0 ? (
          <table className="w-full text-left text-sm mt-4 border-collapse">
            <thead>
              <tr className="border-b border-family-accent/10 text-family-textMuted text-xs uppercase">
                <th className="py-2 font-semibold">Thời điểm áp dụng</th>
                <th className="py-2 font-semibold">Lãi suất (%/năm)</th>
                <th className="py-2 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((p, idx) => (
                <tr key={idx} className="border-b border-family-accent/5 hover:bg-family-bgDark/10">
                  <td className="py-3">
                    {editingIndex === idx && editingPeriod ? (
                       <div className="flex gap-2">
                         <input type="number" min={1} max={12} value={editingPeriod.startMonth} onChange={e => setEditingPeriod({...editingPeriod, startMonth: Number(e.target.value)})} className="w-16 bg-family-bg border border-family-accent/30 rounded px-2 py-1 text-xs outline-none" />
                         <span>/</span>
                         <input type="number" min={2000} max={2060} value={editingPeriod.startYear} onChange={e => setEditingPeriod({...editingPeriod, startYear: Number(e.target.value)})} className="w-20 bg-family-bg border border-family-accent/30 rounded px-2 py-1 text-xs outline-none" />
                       </div>
                    ) : (
                      `Từ Tháng ${p.startMonth}/${p.startYear}`
                    )}
                  </td>
                  <td className="py-3 text-emerald-500 font-semibold">
                    {editingIndex === idx && editingPeriod ? (
                       <input type="number" step="0.1" value={editingPeriod.rateAnnual} onChange={e => setEditingPeriod({...editingPeriod, rateAnnual: Number(e.target.value)})} className="w-20 bg-family-bg border border-family-accent/30 rounded px-2 py-1 text-xs outline-none text-emerald-500" />
                    ) : (
                      `${p.rateAnnual}%`
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-1">
                      {editingIndex === idx ? (
                        <>
                          <Button variant="outline" size="sm" onClick={handleSaveEdit} className="text-green-600 hover:text-green-800 hover:bg-green-50 px-2 h-8">
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setEditingIndex(null)} className="text-gray-500 hover:text-gray-700 hover:bg-gray-50 px-2 h-8">
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="outline" size="sm" onClick={() => { setEditingIndex(idx); setEditingPeriod(p); }} className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 px-2 h-8">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => { handleRemove(idx); }} className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2 h-8">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-family-textMuted italic pt-2">Chưa có cấu hình lãi suất. Hệ thống sẽ mặc định lãi suất 0% cho phần rút trước hạn nếu không có dữ liệu.</p>
        )}
      </CardContent>
    </Card>
  );
};

export const Settings: React.FC = () => {
  const { state, lastSaved, schemaVersion, importState, resetToDefault, updateAssumptions } = useAppContext();

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Export state to JSON file download
  const handleExport = () => {
    try {
      const backup = {
        schemaVersion,
        updatedAt: new Date().toISOString(),
        data: state,
      };
      
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
      const downloadAnchor = document.createElement('a');
      
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `finance_family_os_backup_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      
      downloadAnchor.click();
      downloadAnchor.remove();
      
      setSuccessMsg('Xuất bản tệp sao lưu JSON thành công!');
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(`Lỗi xuất tệp: ${err.message}`);
      setSuccessMsg(null);
    }
  };

  // 2. Import state from JSON file reader
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        
        // 1. Zod schema validation first
        const validation = validateAppState(parsed.data || parsed);
        if (!validation.success) {
          setErrorMsg(validation.error || 'Dữ liệu JSON không đúng cấu trúc (Zod validation failed).');
          setSuccessMsg(null);
          return;
        }

        // 2. Execute safe import with schema validation
        const result = importState(parsed);
        if (result.success) {
          setSuccessMsg('Nhập khẩu dữ liệu thành công! Bản sao lưu đã được khôi phục.');
          setErrorMsg(null);
        } else {
          setErrorMsg(result.error || 'Dữ liệu JSON không đúng cấu trúc.');
          setSuccessMsg(null);
        }
      } catch (err: any) {
        setErrorMsg(`Lỗi cú pháp tệp JSON: ${err.message}`);
        setSuccessMsg(null);
      }
    };
    reader.readAsText(file);
    // Reset file input value to allow re-importing the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu hiện tại và khôi phục cài đặt gốc của gia đình?')) {
      resetToDefault();
      setSuccessMsg('Khôi phục cài đặt gốc và cơ sở dữ liệu mẫu thành công!');
      setErrorMsg(null);
    }
  };

  // Format timestamp nicely
  const formatSavedTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('vi-VN');
    } catch (_) {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-family-text">Cấu hình hệ thống</h1>
        <p className="text-sm text-family-textMuted mt-1">
          Quản lý LocalStorage, sao lưu dữ liệu và kiểm soát phiên bản của Hệ điều hành tài chính gia đình.
        </p>
      </div>

      {successMsg && <WarningBox type="info" message={successMsg} className="bg-green-50/50 border-green-200 text-green-800" />}
      {errorMsg && <WarningBox type="danger" message={errorMsg} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <IncomeCategoriesSettings />
        <AssumptionsSettings />
        {/* Local storage controls */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Bảo mật & Sao lưu dữ liệu</CardTitle>
            <CardDescription>
              Xuất tệp dự phòng JSON để lưu trữ ngoại tuyến hoặc khôi phục dữ liệu từ tệp sao lưu cũ.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Export action */}
              <div className="p-4 border border-family-accent/10 rounded-2xl bg-family-bgDark/20 flex flex-col justify-between h-40">
                <div>
                  <h4 className="font-bold text-xs text-family-text flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-family-accent" /> Xuất dữ liệu (Export)
                  </h4>
                  <p className="text-[11px] text-family-textMuted mt-1.5 leading-relaxed">
                    Tải về toàn bộ cấu hình, lịch trình thu nhập, danh mục tài sản và các kịch bản đang chạy của hai vợ chồng dưới dạng tệp JSON.
                  </p>
                </div>
                <Button onClick={handleExport} className="w-full text-xs">Tải xuống tệp sao lưu (.json)</Button>
              </div>

              {/* Import action */}
              <div className="p-4 border border-family-accent/10 rounded-2xl bg-family-bgDark/20 flex flex-col justify-between h-40">
                <div>
                  <h4 className="font-bold text-xs text-family-text flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-family-accent" /> Nhập dữ liệu (Import)
                  </h4>
                  <p className="text-[11px] text-family-textMuted mt-1.5 leading-relaxed">
                    Khôi phục dữ liệu từ tệp sao lưu JSON đã tải về trước đó. Hệ thống sẽ tự động đối soát phiên bản và cấu trúc dữ liệu.
                  </p>
                </div>
                <div>
                  <input
                    type="file"
                    accept=".json"
                    ref={fileInputRef}
                    onChange={handleImport}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="secondary"
                    className="w-full text-xs"
                  >
                    Tải lên tệp sao lưu
                  </Button>
                </div>
              </div>
            </div>

            {/* Danger Zone: Reset Default */}
            <div className="border-t border-red-100 pt-6">
              <h4 className="font-bold text-xs text-red-700 flex items-center gap-1.5 mb-2">
                <ShieldAlert className="w-4 h-4" /> Vùng kiểm soát nguy hiểm (Danger Zone)
              </h4>
              <p className="text-[11px] text-family-textMuted mb-3 leading-relaxed">
                Khôi phục cài đặt gốc sẽ xóa sạch toàn bộ các tùy chỉnh hiện tại của bạn trong LocalStorage và đưa hệ điều hành về trạng thái mẫu ban đầu. Hành động này không thể hoàn tác.
              </p>
              <Button onClick={handleReset} variant="secondary" className="border-red-200 text-red-700 hover:bg-red-50 text-xs">
                Xóa tất cả dữ liệu & Khôi phục mẫu gốc
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Database metadata information */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin Cơ sở dữ liệu</CardTitle>
            <CardDescription>Chi tiết phiên bản lưu trữ hiện tại.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs text-family-textMuted">
            <div className="flex justify-between border-b border-family-accent/5 pb-2">
              <span>Phiên bản Schema:</span>
              <strong className="text-family-text">Phiên bản {schemaVersion}</strong>
            </div>
            <div className="flex justify-between border-b border-family-accent/5 pb-2">
              <span>Trạng thái lưu trữ:</span>
              <span className="text-green-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Tự động lưu (Auto-save)
              </span>
            </div>
            <div className="flex justify-between border-b border-family-accent/5 pb-2">
              <span>Mốc cập nhật cuối:</span>
              <strong className="text-family-text">{formatSavedTime(lastSaved)}</strong>
            </div>
            <div className="p-3 bg-family-bgDark/40 rounded-xl border border-family-accent/5 text-[10px] leading-relaxed">
              *Hệ thống tự động lưu giữ thay đổi của bạn sau mỗi 500ms dừng gõ để tránh nghẽn luồng xử lý và tối ưu hóa thời lượng pin cho thiết bị di động.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
