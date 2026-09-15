import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { CarFront, PenLine, Trash2, Plus, MonitorSmartphone, Sofa, Gem, Sparkles, TrendingDown, Target, Info } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { formatMoneyVNDMillion, formatKpiMoneyVNDMillion } from '../utils/format';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Legend, Line, PieChart, Pie, Cell } from 'recharts';
import { CustomChartTooltip } from '../components/ui/CustomChartTooltip';
import type { LifestyleAsset } from '../types/finance';
import { safeNumber } from '../utils/math';
import { HelpTooltip } from '../components/ui/HelpTooltip';

const typeIcons: Record<string, React.ReactNode> = {
  vehicle: <CarFront className="w-5 h-5 text-indigo-500" />,
  electronics: <MonitorSmartphone className="w-5 h-5 text-sky-500" />,
  furniture: <Sofa className="w-5 h-5 text-amber-500" />,
  other: <Gem className="w-5 h-5 text-rose-500" />,
};

const typeLabels: Record<string, string> = {
  vehicle: 'Phương tiện',
  electronics: 'Đồ điện tử',
  furniture: 'Nội thất',
  other: 'Khác',
};

const TYPE_COLORS: Record<string, string> = {
  vehicle: '#6366f1',
  electronics: '#0ea5e9',
  furniture: '#f59e0b',
  other: '#f43f5e',
};

export const LifestyleAssets: React.FC = () => {
  const { state, updateAppState } = useAppContext();
  const assets = state.lifestyleAssets || [];
  
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<LifestyleAsset>>({});
  const [selectedAssetId, setSelectedAssetId] = useState<string>('all');

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const handleAdd = () => {
    const newAsset: LifestyleAsset = {
      id: `ls_${Date.now()}`,
      name: 'Ví dụ: Ô tô gia đình',
      type: 'vehicle',
      purchasePrice: 1000,
      purchaseMonth: currentMonth,
      purchaseYear: currentYear,
      depreciationRateAnnual: 10,
      maintenanceCostMonthly: 5,
      status: 'active',
    };
    setIsEditing(newAsset.id);
    setFormData(newAsset);
  };

  const handleSave = () => {
    if (!formData.id || !formData.name) return;
    
    let newAssets = [...assets];
    const index = newAssets.findIndex(a => a.id === formData.id);
    
    if (index >= 0) {
      newAssets[index] = formData as LifestyleAsset;
    } else {
      newAssets.push(formData as LifestyleAsset);
    }
    
    updateAppState({
      ...state,
      lifestyleAssets: newAssets
    });
    setIsEditing(null);
    setFormData({});
  };

  const handleDelete = (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tài sản này?')) return;
    updateAppState({
      ...state,
      lifestyleAssets: assets.filter(a => a.id !== id)
    });
  };

  const activeAssets = assets.filter(a => a.status === 'active');
  const assetsToAnalyze = selectedAssetId === 'all' ? activeAssets : activeAssets.filter(a => a.id === selectedAssetId);

  // Calculations
  let totalInitialValue = 0;
  let totalCurrentValue = 0;
  let totalMonthlyMaintenance = 0;
  let totalMaintenancePaid = 0;
  let totalDailyBurnRate = 0; // In VND (not millions)
  
  const categoryDataMap: Record<string, number> = { vehicle: 0, electronics: 0, furniture: 0, other: 0 };

  assetsToAnalyze.forEach(a => {
    const elapsedMonths = Math.max(0, (currentYear - a.purchaseYear) * 12 + (currentMonth - a.purchaseMonth));
    const elapsedYears = elapsedMonths / 12;
    
    const rate = safeNumber(a.depreciationRateAnnual, 0) / 100;
    const currentVal = a.purchasePrice * Math.pow(1 - rate, elapsedYears);
    
    totalInitialValue += a.purchasePrice;
    totalCurrentValue += currentVal;
    
    const maintMonthly = safeNumber(a.maintenanceCostMonthly, 0);
    totalMonthlyMaintenance += maintMonthly;
    totalMaintenancePaid += maintMonthly * elapsedMonths;
    
    // Daily burn rate = (Annual depreciation of CURRENT year + Annual maintenance) / 365
    // Simplify: Use linear approximation of depreciation for burn rate feeling
    const dailyDepreciationVnd = (a.purchasePrice * rate * 1_000_000) / 365;
    const dailyMaintenanceVnd = (maintMonthly * 12 * 1_000_000) / 365;
    totalDailyBurnRate += (dailyDepreciationVnd + dailyMaintenanceVnd);

    categoryDataMap[a.type] += a.purchasePrice;
  });

  const totalLostValue = totalInitialValue - totalCurrentValue;
  const trueSunkCost = totalLostValue + totalMaintenancePaid; // Total money "vaporized"

  const pieChartData = Object.keys(categoryDataMap)
    .filter(k => categoryDataMap[k] > 0)
    .map(k => ({
      name: typeLabels[k],
      value: categoryDataMap[k],
      color: TYPE_COLORS[k]
    }));

  // Chart Data: Projecting 10 years into the future from today
  const chartData = useMemo(() => {
    const data = [];
    for (let i = 0; i <= 10; i++) {
      const projYear = currentYear + i;
      let totalValueAtYear = 0;
      let totalMaintPaidAtYear = 0;

      assetsToAnalyze.forEach(a => {
        const elapsedMonths = Math.max(0, (projYear - a.purchaseYear) * 12 + (currentMonth - a.purchaseMonth));
        const elapsedYears = elapsedMonths / 12;
        
        const rate = safeNumber(a.depreciationRateAnnual, 0) / 100;
        const projVal = a.purchasePrice * Math.pow(1 - rate, elapsedYears);
        
        totalValueAtYear += projVal;
        totalMaintPaidAtYear += safeNumber(a.maintenanceCostMonthly, 0) * elapsedMonths;
      });

      data.push({
        year: projYear,
        totalValue: Math.round(totalValueAtYear),
        totalMaint: Math.round(totalMaintPaidAtYear),
      });
    }
    return data;
  }, [assetsToAnalyze, currentYear, currentMonth]);

  // Find cross point year
  const crossPoint = chartData.find(d => d.totalMaint > d.totalValue);

  const renderForm = () => (
    <Card className="glass-panel overflow-hidden border-indigo-300 shadow-lg animate-in fade-in zoom-in-95 duration-200">
      <CardHeader className="bg-indigo-50/50 pb-4 border-b border-indigo-100">
        <CardTitle className="text-lg text-indigo-900 flex items-center gap-2">
          {formData.id && assets.find(a => a.id === formData.id) ? <PenLine className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {formData.id && assets.find(a => a.id === formData.id) ? 'Cập nhật tiện nghi gia đình' : 'Thêm tiện nghi gia đình mới'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-family-textMuted uppercase">Tên tiện nghi <span className="text-rose-500">*</span></label>
            <Input 
              placeholder="VD: Xe Mazda CX5, iPhone 15 Pro..."
              value={formData.name || ''} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-family-textMuted uppercase">Phân loại</label>
            <Select 
              value={formData.type || 'other'}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              options={[
                { value: 'vehicle', label: typeLabels['vehicle'] },
                { value: 'electronics', label: typeLabels['electronics'] },
                { value: 'furniture', label: typeLabels['furniture'] },
                { value: 'other', label: typeLabels['other'] },
              ]}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-family-textMuted uppercase">Giá mua ban đầu (Triệu VNĐ)</label>
            <Input 
              type="number"
              value={formData.purchasePrice || ''} 
              onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="flex gap-3">
            <div className="w-1/2 space-y-1">
              <label className="text-xs font-semibold text-family-textMuted uppercase">Tháng mua</label>
              <Input 
                type="number" min="1" max="12"
                value={formData.purchaseMonth || ''} 
                onChange={(e) => setFormData({ ...formData, purchaseMonth: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="w-1/2 space-y-1">
              <label className="text-xs font-semibold text-family-textMuted uppercase">Năm mua</label>
              <Input 
                type="number"
                value={formData.purchaseYear || ''} 
                onChange={(e) => setFormData({ ...formData, purchaseYear: parseInt(e.target.value) || 2024 })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-family-textMuted uppercase">Tỷ lệ hao mòn ước tính (% / Năm)</label>
            <div className="relative">
              <Input 
                type="number"
                value={formData.depreciationRateAnnual || ''} 
                onChange={(e) => setFormData({ ...formData, depreciationRateAnnual: parseFloat(e.target.value) || 0 })}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-family-textMuted uppercase">Chi phí chăm sóc & vận hành (Triệu VNĐ / Tháng)</label>
            <Input 
              type="number"
              placeholder="Tiền xăng xe, bảo dưỡng, gói cước, linh kiện..."
              value={formData.maintenanceCostMonthly || ''} 
              onChange={(e) => setFormData({ ...formData, maintenanceCostMonthly: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button variant="outline" onClick={() => setIsEditing(null)}>Hủy bỏ</Button>
          <Button onClick={handleSave} className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-md">
            {formData.id && assets.find(a => a.id === formData.id) ? 'Lưu thay đổi' : 'Thêm tiện nghi'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-24 fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 relative z-10">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-family-text flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0 shadow-sm border border-indigo-200">
              <CarFront className="w-7 h-7 text-indigo-600" />
            </div>
            Tiêu sản & Tiện nghi gia đình
            <HelpTooltip text="Không gian quản lý các tài sản tiện nghi phục vụ đời sống gia đình (xe cộ, đồ công nghệ, nội thất). Giúp tổ ấm cân bằng giữa việc tận hưởng cuộc sống và chủ động kế hoạch tài chính bền vững." />
          </h1>
          <p className="text-family-textMuted text-base max-w-3xl leading-relaxed">
            Mỗi tiện nghi đều góp phần nâng cao chất lượng cuộc sống và mang lại niềm vui cho cả nhà. Góc nhìn thấu đáo này giúp gia đình mình hiểu rõ mức độ hao mòn tự nhiên và chi phí chăm sóc định kỳ, để an tâm tận hưởng trọn vẹn sự tiện nghi của tổ ấm.
          </p>
        </div>

        {activeAssets.length > 0 && (
          <div className="shrink-0 flex items-center gap-2 bg-white/60 p-1.5 rounded-lg border border-gray-200 shadow-sm">
            <span className="text-sm font-medium text-gray-500 pl-2">Lọc theo:</span>
            <Select 
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              className="bg-transparent border-none shadow-none font-semibold text-indigo-700 min-w-[180px] focus:ring-0 cursor-pointer"
              options={[
                { value: 'all', label: 'Tất cả danh mục' },
                ...activeAssets.map(a => ({ value: a.id, label: a.name }))
              ]}
            />
          </div>
        )}
      </div>

      {/* Insight KPIs Row */}
      {activeAssets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card className="glass-panel overflow-hidden group">
            <CardContent className="p-5 flex flex-col justify-between h-full relative">
              <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-indigo-50 to-transparent rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-sm font-semibold text-family-textMuted uppercase tracking-wide">Tổng chi phí mua sắm</span>
                  <HelpTooltip text="Tổng ngân sách ban đầu gia đình đã đầu tư cho các tiện nghi" />
                </div>
                <p className="text-3xl font-bold text-family-text mt-2">{formatKpiMoneyVNDMillion(totalInitialValue)}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs text-family-textMuted flex items-center gap-1">
                  Giá trị còn lại: <span className="font-semibold text-indigo-600">{formatMoneyVNDMillion(totalCurrentValue)}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel overflow-hidden border-rose-200 shadow-sm shadow-rose-100 group">
            <CardContent className="p-5 flex flex-col justify-between h-full relative">
              <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-rose-50 to-transparent rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-sm font-semibold text-rose-600/80 uppercase tracking-wide">Hao mòn theo thời gian</span>
                  <HelpTooltip text="Giá trị hao mòn tự nhiên của tài sản qua năm tháng đồng hành cùng gia đình" />
                </div>
                <div className="flex items-end gap-2 mt-2">
                  <p className="text-3xl font-bold text-rose-600">{formatKpiMoneyVNDMillion(totalLostValue)}</p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-rose-100/50">
                <div className="w-full bg-rose-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-rose-500 h-full rounded-full" 
                    style={{ width: `${Math.min(100, (totalLostValue / totalInitialValue) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-rose-600 font-medium mt-1.5 text-right">Đã khấu hao {((totalLostValue / totalInitialValue) * 100).toFixed(0)}% giá trị ban đầu</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel overflow-hidden border-orange-200 shadow-sm shadow-orange-100 group">
            <CardContent className="p-5 flex flex-col justify-between h-full relative">
              <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-orange-50 to-transparent rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-sm font-semibold text-orange-600/80 uppercase tracking-wide">Chi phí chăm sóc tích lũy</span>
                  <HelpTooltip text="Tổng chi phí gia đình đã dành cho bảo dưỡng, xăng xe, phụ kiện... để duy trì tài sản phục vụ đời sống" />
                </div>
                <p className="text-3xl font-bold text-orange-600 mt-2">{formatKpiMoneyVNDMillion(totalMaintenancePaid)}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-orange-100/50">
                <p className="text-xs text-orange-700 flex items-center gap-1">
                  Ngân sách chăm sóc: <span className="font-semibold">{formatMoneyVNDMillion(totalMonthlyMaintenance)} / tháng</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel overflow-hidden border-indigo-200 bg-indigo-50/20 group">
            <CardContent className="p-5 flex flex-col justify-between h-full relative">
              <div className="absolute right-0 top-0 w-32 h-32 opacity-10 -z-10 transition-transform group-hover:rotate-12">
                <Sparkles className="w-full h-full text-indigo-500" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-sm font-bold text-indigo-700 uppercase tracking-wide">Chi phí phục vụ mỗi ngày</span>
                  <HelpTooltip text="Chi phí bình quân mỗi ngày để tiện nghi phục vụ cuộc sống gia đình (gồm hao mòn và phí vận hành)" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-indigo-600 mt-2">
                  {new Intl.NumberFormat('vi-VN').format(Math.round(totalDailyBurnRate))}
                  <span className="text-sm font-bold text-indigo-500/70 ml-1">/ ngày</span>
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-rose-200/50">
                <p className="text-xs font-semibold text-indigo-700">
                  Khoản chi phí xứng đáng cho sự tiện nghi và nụ cười của cả gia đình mỗi ngày.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Analytics & Charts */}
        <div className="lg:col-span-7 space-y-6 flex flex-col">
          {activeAssets.length > 0 ? (
            <>
              {/* Combine Chart */}
              <Card className="glass-panel flex-1 flex flex-col">
                <CardHeader className="pb-2 border-b border-gray-100 bg-white/50">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg text-family-text flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-indigo-500" /> Vòng đời tiện nghi & Chi phí chăm sóc (10 Năm)
                      </CardTitle>
                      <p className="text-xs text-family-textMuted mt-1">Biểu đồ đối chiếu Giá trị tiện nghi còn lại & Chi phí chăm sóc tích lũy</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 flex-1 flex flex-col">
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis 
                          dataKey="year" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 12, fill: '#6B7280' }} 
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 12, fill: '#6B7280' }}
                          tickFormatter={(val) => `${val}`}
                        />
                        <Tooltip content={<CustomChartTooltip />} />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }}/>
                        
                        <Area 
                          type="monotone" 
                          dataKey="totalValue" 
                          name="Giá trị tài sản còn lại" 
                          stroke="#6366f1" 
                          fill="#6366f1" 
                          fillOpacity={0.15} 
                          strokeWidth={3}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="totalMaint" 
                          name="Tổng chi phí chăm sóc tích lũy" 
                          stroke="#f97316" 
                          strokeWidth={3}
                          strokeDasharray="5 5"
                          dot={{ r: 4, fill: '#f97316', strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 6 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {crossPoint ? (
                    <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                      <Info className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-amber-900">Điểm cân bằng chi phí: Năm {crossPoint.year}</h4>
                        <p className="text-sm text-amber-800 mt-1 leading-relaxed">
                          Dự kiến vào năm này, <strong>tổng chi phí chăm sóc & vận hành tích lũy</strong> ({formatMoneyVNDMillion(crossPoint.totalMaint)}) sẽ tương đương hoặc vượt qua <strong>giá trị còn lại của tiện nghi</strong> ({formatMoneyVNDMillion(crossPoint.totalValue)}). Đây là thời điểm lý tưởng để gia đình cân nhắc kế hoạch bảo dưỡng lớn, chuyển nhượng hoặc nâng cấp trải nghiệm mới cho tổ ấm.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
                      <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-emerald-800 leading-relaxed">
                        Tuyệt vời! Trong 10 năm tới, tổng chi phí vận hành vẫn được duy trì ở mức tối ưu so với giá trị tài sản. Gia đình mình hãy tiếp tục chăm sóc và bảo dưỡng tốt nhé!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Breakdown Chart */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Card className="glass-panel">
                  <CardHeader className="pb-0">
                    <CardTitle className="text-sm font-bold text-family-text text-center">Cơ cấu Mua sắm</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 pb-4 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => formatMoneyVNDMillion(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card className="glass-panel">
                  <CardContent className="p-5 flex flex-col justify-center h-full">
                    <h4 className="text-sm font-bold text-family-text mb-4 border-b pb-2">Tổng chi phí trải nghiệm & sử dụng</h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs text-family-textMuted mb-1">
                          <span>Hao mòn theo thời gian</span>
                          <span className="font-semibold text-rose-600">{formatMoneyVNDMillion(totalLostValue)}</span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-rose-500 h-full" style={{ width: `${(totalLostValue / trueSunkCost) * 100}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-family-textMuted mb-1">
                          <span>Chi phí chăm sóc (Đã chi)</span>
                          <span className="font-semibold text-orange-600">{formatMoneyVNDMillion(totalMaintenancePaid)}</span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-orange-500 h-full" style={{ width: `${(totalMaintenancePaid / trueSunkCost) * 100}%` }}></div>
                        </div>
                      </div>
                      <div className="pt-2 border-t flex justify-between items-center">
                        <span className="text-xs font-bold text-family-text uppercase">Tổng chi phí trải nghiệm</span>
                        <span className="font-black text-rose-700">{formatMoneyVNDMillion(trueSunkCost)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card className="glass-panel flex-1 flex flex-col items-center justify-center p-12 border-dashed bg-white/40">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                <Target className="w-10 h-10 text-indigo-300" />
              </div>
              <h3 className="text-xl font-bold text-family-text mb-2">Góc nhìn thấu đáo & Yêu thương</h3>
              <p className="text-center text-family-textMuted max-w-md text-sm">
                Thêm tiện nghi vào danh sách để cùng gia đình theo dõi chi phí sử dụng mỗi ngày và biểu đồ 10 năm dự báo vòng đời tài sản, giúp tổ ấm luôn chủ động và an tâm trong kế hoạch chi tiêu.
              </p>
            </Card>
          )}
        </div>

        {/* Right Column: Asset List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center sticky top-0 z-10 bg-family-bg/80 backdrop-blur-md py-2">
            <h2 className="text-lg font-bold text-family-text flex items-center gap-2">
              Danh mục ({assets.length})
            </h2>
            <Button onClick={handleAdd} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm rounded-full px-4">
              <Plus className="w-4 h-4 mr-1.5" />
              Thêm mới
            </Button>
          </div>

          <div className="space-y-4">
            {isEditing && !assets.find(a => a.id === isEditing) && renderForm()}

            {assets.length === 0 && !isEditing ? (
              <div className="text-center py-8 px-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <CarFront className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Gia đình chưa thêm tiện nghi nào vào danh mục</p>
              </div>
            ) : (
              assets.map(asset => {
                const elapsedMonths = Math.max(0, (currentYear - asset.purchaseYear) * 12 + (currentMonth - asset.purchaseMonth));
                const elapsedYears = elapsedMonths / 12;
                const rate = safeNumber(asset.depreciationRateAnnual, 0) / 100;
                const currentVal = asset.purchasePrice * Math.pow(1 - rate, elapsedYears);
                const maintPaid = asset.maintenanceCostMonthly * elapsedMonths;
                
                // Asset burn rate
                const dailyDep = (asset.purchasePrice * rate * 1_000_000) / 365;
                const dailyMaint = (asset.maintenanceCostMonthly * 12 * 1_000_000) / 365;
                const burnRate = dailyDep + dailyMaint;

                if (isEditing === asset.id) return <div key={asset.id}>{renderForm()}</div>;

                return (
                  <Card key={asset.id} className="glass-panel overflow-hidden transition-all duration-200 hover:shadow-md border-transparent hover:border-indigo-100">
                    <CardContent className="p-0">
                      <div className="p-4 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                          {typeIcons[asset.type]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-family-text truncate pr-2">{asset.name}</h3>
                            <div className="flex gap-1 shrink-0">
                              <button 
                                onClick={() => { setFormData(asset); setIsEditing(asset.id); }}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                              >
                                <PenLine className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDelete(asset.id)}
                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-xs text-family-textMuted mb-3">
                            Mua T{asset.purchaseMonth}/{asset.purchaseYear} • Nguyên giá: <span className="font-semibold text-gray-700">{formatMoneyVNDMillion(asset.purchasePrice)}</span>
                          </p>

                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="bg-rose-50/50 p-2 rounded-lg border border-rose-100/50">
                              <p className="text-[10px] uppercase font-semibold text-rose-500 mb-0.5">Giá trị còn lại</p>
                              <p className="font-bold text-rose-700">{formatMoneyVNDMillion(currentVal)}</p>
                              <p className="text-[10px] text-rose-600/70 mt-0.5">(-{rate * 100}%/năm)</p>
                            </div>
                            <div className="bg-orange-50/50 p-2 rounded-lg border border-orange-100/50">
                              <p className="text-[10px] uppercase font-semibold text-orange-500 mb-0.5">Phí chăm sóc đã chi</p>
                              <p className="font-bold text-orange-700">{formatMoneyVNDMillion(maintPaid)}</p>
                              <p className="text-[10px] text-orange-600/70 mt-0.5">({formatMoneyVNDMillion(asset.maintenanceCostMonthly)}/th)</p>
                            </div>
                          </div>

                          <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 flex justify-between items-center">
                            <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Chi phí mỗi ngày
                            </span>
                            <span className="text-xs font-bold text-indigo-600">{new Intl.NumberFormat('vi-VN').format(Math.round(burnRate))}/ngày</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
