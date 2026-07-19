import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { HelpTooltip } from '../ui/HelpTooltip';
import { formatKpiMoneyVNDMillion } from '../../utils/format';
import type { AssetConfig } from '../../types/portfolio';
import type { ProjectionMonthlyRow } from '../../types/projection';
import type { InvestmentDeal, SinkingFund } from '../../types/finance';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  ComposedChart, Cell, ReferenceLine
} from 'recharts';

interface ExpertPortfolioChartsProps {
  assets: AssetConfig[];
  activeRow: ProjectionMonthlyRow | null;
  totalObservedBalance: number;
  genericUnallocatedBalance: number;
  savBal: number;
  observedDeals: InvestmentDeal[];
  observedSinkingFunds: SinkingFund[];
}

// Map Asset Type to Liquidity Tiers
const LIQUIDITY_TIERS: Record<string, number> = {
  'idle_cash': 1,
  'savings': 1,
  'fx_reserve_usd': 2,
  'gold': 2,
  'stocks': 3,
  'crypto': 3,
  'real_estate': 4
};

const TIER_NAMES: Record<number, string> = {
  1: 'Thanh khoản cao nhất (Tiền & TK)',
  2: 'Thanh khoản cao (Ngoại tệ & Vàng)',
  3: 'Thanh khoản trung bình (CK, Crypto)',
  4: 'Thanh khoản thấp (Bất động sản)'
};

const TIER_COLORS: Record<number, string> = {
  1: '#0ea5e9', // sky-500
  2: '#f59e0b', // amber-500
  3: '#8b5cf6', // violet-500
  4: '#10b981'  // emerald-500
};

export const ExpertPortfolioCharts: React.FC<ExpertPortfolioChartsProps> = ({
  assets,
  activeRow,
  totalObservedBalance,
  genericUnallocatedBalance,
  savBal,
  observedDeals,
  observedSinkingFunds
}) => {

  const hasData = totalObservedBalance > 0 && activeRow;

  // 1. Tháp Tài Sản & Thanh Khoản (Liquidity Pyramid)
  const liquidityData = useMemo(() => {
    if (!hasData) return [];
    const tiers = { 1: 0, 2: 0, 3: 0, 4: 0 };
    
    // Tiền mặt nhàn rỗi & Gửi tiết kiệm
    tiers[1] += genericUnallocatedBalance + savBal;
    
    // Tính tài sản (kể cả phần đang chờ phân bổ trong Quỹ)
    assets.forEach(asset => {
      const tier = LIQUIDITY_TIERS[asset.type] || 4;
      const balance = activeRow.portfolio.assets[asset.type].endingBalance || 0;
      const earmarked = activeRow.portfolio.assets[asset.type].earmarkedEndingBalance || 0;
      tiers[tier as 1|2|3|4] += (balance + earmarked);
    });

    return [1, 2, 3, 4].map(t => ({
      tierName: TIER_NAMES[t],
      value: tiers[t as 1|2|3|4],
      percent: totalObservedBalance > 0 ? (tiers[t as 1|2|3|4] / totalObservedBalance) * 100 : 0,
      fill: TIER_COLORS[t]
    })).filter(t => t.value > 0);
  }, [assets, activeRow, genericUnallocatedBalance, savBal, totalObservedBalance, hasData]);

  // 2. Biểu đồ Phân bổ Thực tế vs Kỳ vọng (Diverging Bar Chart)
  const allocationData = useMemo(() => {
    if (!hasData) return [];
    
    return assets.map(asset => {
      const balance = activeRow.portfolio.assets[asset.type].endingBalance || 0;
      const earmarked = activeRow.portfolio.assets[asset.type].earmarkedEndingBalance || 0;
      const total = balance + earmarked;
      const actualPercent = totalObservedBalance > 0 ? (total / totalObservedBalance) * 100 : 0;
      const targetPercent = asset.targetAllocationPercent || 0;
      
      const diff = actualPercent - targetPercent;
      
      return {
        name: asset.name,
        actual: actualPercent,
        target: targetPercent,
        diff: diff,
        balance: total
      };
    });
  }, [assets, activeRow, totalObservedBalance, hasData]);

  // 3. Động cơ Sinh lời (Yield vs Capital)
  const yieldData = useMemo(() => {
    if (!hasData) return [];
    
    return assets.map(asset => {
      const balance = activeRow.portfolio.assets[asset.type].endingBalance || 0;
      const dealsCapital = observedDeals
        .filter(d => d.assetType === asset.type)
        .reduce((sum, d) => sum + d.capital, 0);
        
      const pnl = balance - dealsCapital;
      
      return {
        name: asset.name,
        capital: dealsCapital,
        balance: balance,
        pnl: pnl
      };
    }).filter(d => d.capital > 0 || d.balance > 0);
  }, [assets, activeRow, observedDeals, hasData]);

  const CustomTooltipLiquidity = ({ active, payload }: any) => {
    if (active && payload?.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-700 text-white p-3 rounded-lg shadow-xl text-xs">
          <p className="font-bold text-family-accent mb-1">{data.tierName}</p>
          <p>Quy mô: <span className="font-semibold text-white">{formatKpiMoneyVNDMillion(data.value)}</span></p>
          <p>Tỷ trọng: <span className="font-semibold text-white">{data.percent.toFixed(1)}%</span></p>
        </div>
      );
    }
    return null;
  };

  const CustomTooltipAllocation = ({ active, payload }: any) => {
    if (active && payload?.length) {
      const data = payload[0].payload;
      const isOver = data.diff > 0;
      return (
        <div className="bg-slate-800 border border-slate-700 text-white p-3 rounded-lg shadow-xl text-xs">
          <p className="font-bold text-family-accent mb-1">{data.name}</p>
          <p>Thực tế: <span className="font-semibold">{data.actual.toFixed(1)}%</span> ({formatKpiMoneyVNDMillion(data.balance)})</p>
          <p>Kỳ vọng: <span className="font-semibold">{data.target.toFixed(1)}%</span></p>
          <div className={`mt-2 p-1.5 rounded bg-slate-700/50 ${isOver ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isOver ? '▲ Vượt tỷ trọng: ' : '▼ Thiếu tỷ trọng: '} 
            <span className="font-bold">{Math.abs(data.diff).toFixed(1)}%</span>
          </div>
        </div>
      );
    }
    return null;
  };
  
  const CustomTooltipYield = ({ active, payload }: any) => {
    if (active && payload?.length) {
      const data = payload[0].payload;
      const isProfit = data.pnl >= 0;
      return (
        <div className="bg-slate-800 border border-slate-700 text-white p-3 rounded-lg shadow-xl text-xs">
          <p className="font-bold text-family-accent mb-1">{data.name}</p>
          <p>Vốn đầu tư: <span className="font-semibold text-sky-400">{formatKpiMoneyVNDMillion(data.capital)}</span></p>
          <p>Số dư hiện tại: <span className="font-semibold text-emerald-400">{formatKpiMoneyVNDMillion(data.balance)}</span></p>
          <div className="mt-2 pt-2 border-t border-slate-600">
            Lãi/Lỗ: <span className={`font-bold ${isProfit ? 'text-emerald-500' : 'text-red-500'}`}>
              {isProfit ? '+' : ''}{formatKpiMoneyVNDMillion(data.pnl)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!hasData) {
    return <EmptyState title="Không có dữ liệu" description="Vui lòng thiết lập vốn khởi điểm." />;
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
      {/* 1. Liquidity Pyramid */}
      <Card className="flex flex-col justify-between border-sky-500/20 shadow-lg bg-gradient-to-br from-white to-sky-50/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-sky-800">Tháp Tài Sản & Thanh Khoản</CardTitle>
            <HelpTooltip text="Tháp thanh khoản chia tài sản thành các tầng (Tiers) dựa trên mức độ dễ dàng chuyển đổi thành tiền mặt. Giúp bạn đánh giá khả năng phòng thủ khi có rủi ro khẩn cấp." position="right" />
          </div>
          <CardDescription>Các lớp phòng thủ tài chính (Tier 1 dễ thanh khoản nhất).</CardDescription>
        </CardHeader>
        <CardContent className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={liquidityData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="tierName" 
                type="category" 
                width={120} 
                tick={{fontSize: 10, fill: '#475569', fontWeight: 600}} 
                axisLine={false} 
                tickLine={false}
              />
              <RechartsTooltip content={<CustomTooltipLiquidity />} cursor={{fill: '#f1f5f9'}} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                {liquidityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 2. Diverging Bar Chart */}
      <Card className="flex flex-col justify-between border-amber-500/20 shadow-lg bg-gradient-to-br from-white to-amber-50/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-amber-800">Cân bằng Mục tiêu (Actual vs Target)</CardTitle>
            <HelpTooltip text="Biểu đồ phân kỳ cho thấy lớp tài sản nào đang bị thiếu (cột cam hướng xuống) và lớp nào đang vượt (cột xanh hướng lên) so với kế hoạch mục tiêu, giúp bạn ra quyết định tái cơ cấu (mua thêm/chốt lời)." position="right" />
          </div>
          <CardDescription>Độ lệch % thực tế so với kỳ vọng phân bổ.</CardDescription>
        </CardHeader>
        <CardContent className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={allocationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{fontSize: 10, fill: '#475569'}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize: 10, fill: '#475569'}} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
              <RechartsTooltip content={<CustomTooltipAllocation />} cursor={{fill: '#f1f5f9'}} />
              <ReferenceLine y={0} stroke="#94a3b8" />
              <Bar dataKey="diff" radius={[4, 4, 0, 0]} barSize={40}>
                {allocationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.diff > 0 ? '#10b981' : '#f59e0b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* 3. Yield Engine */}
      <Card className="flex flex-col justify-between xl:col-span-2 border-emerald-500/20 shadow-lg bg-gradient-to-br from-white to-emerald-50/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-emerald-800">Động cơ Sinh lời (Hiệu suất Thương vụ)</CardTitle>
            <HelpTooltip text="So sánh trực quan giữa 'Số vốn gốc đã đổ vào' (cột xám) và 'Số dư trị giá hiện tại' (cột xanh lá). Khoảng chênh lệch chính là Lãi/Lỗ ròng (PnL). Giúp bạn nhận diện 'động cơ' nào đang kéo cả danh mục đi lên." position="right" />
          </div>
          <CardDescription>So sánh Vốn đầu tư và Số dư hiện tại (gồm Lãi/Lỗ) của các Lớp tài sản.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={yieldData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{fontSize: 11, fill: '#475569', fontWeight: 500}} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{fontSize: 10, fill: '#475569'}} axisLine={false} tickLine={false} tickFormatter={(v) => `${v/1000}T`} />
              <RechartsTooltip content={<CustomTooltipYield />} cursor={{fill: '#f1f5f9'}} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar yAxisId="left" dataKey="capital" name="Vốn đầu tư" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={40} />
              <Bar yAxisId="left" dataKey="balance" name="Số dư hiện tại" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
