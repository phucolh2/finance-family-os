import React, { useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { WarningBox } from '../components/ui/WarningBox';
import { Download, Upload, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const Settings: React.FC = () => {
  const { state, lastSaved, schemaVersion, importState, resetToDefault } = useAppContext();

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
        
        // Execute safe import with schema validation
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
