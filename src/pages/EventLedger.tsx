import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { HeartHandshake, LayoutList, BookHeart } from 'lucide-react';
import { HelpTooltip } from '../components/ui/HelpTooltip';
import { FinancialTimelineTab } from '../components/ledger/FinancialTimelineTab';
import { SystemAuditTab } from '../components/ledger/SystemAuditTab';

export const EventLedger: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'audit'>('timeline');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-family-text flex items-center gap-2">
            <BookHeart className="w-8 h-8 text-family-accent" />
            Nhật ký Yêu thương
            <HelpTooltip text="Nơi lưu giữ từng cột mốc và sự chung tay vun đắp của cả hai vợ chồng cho tổ ấm." />
          </h1>
          <p className="text-family-textMuted mt-1">
            Hành trình xây dựng tương lai và những đóng góp mỗi ngày.
          </p>
        </div>
      </div>

      <Card className="border border-family-accent/10 bg-white/60 backdrop-blur-sm shadow-sm overflow-hidden">
        <CardHeader className="border-b border-family-accent/5 pb-0 px-0 sm:px-6">
          <div className="flex gap-6 px-6 sm:px-0">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'timeline' 
                  ? 'border-family-accent text-family-accent' 
                  : 'border-transparent text-family-textMuted hover:text-family-text hover:border-family-textMuted/30'
              }`}
            >
              <LayoutList className="w-4 h-4" />
              Lộ trình Kế hoạch
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'audit' 
                  ? 'border-family-accent text-family-accent' 
                  : 'border-transparent text-family-textMuted hover:text-family-text hover:border-family-textMuted/30'
              }`}
            >
              <HeartHandshake className="w-4 h-4" />
              Nhật ký Chung tay
            </button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-8 bg-transparent">
          {activeTab === 'timeline' && <FinancialTimelineTab />}
          {activeTab === 'audit' && <SystemAuditTab />}
        </CardContent>
      </Card>
    </div>
  );
};
