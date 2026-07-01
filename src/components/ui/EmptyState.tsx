import React from 'react';
import { Database } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Không có dữ liệu',
  description = 'Vui lòng bổ sung thông tin hoặc cấu hình để hiển thị.',
  icon = <Database className="w-10 h-10 text-family-textLight/40" />,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-family-accent/20 rounded-2xl bg-white/40">
      <div className="mb-3">{icon}</div>
      <h4 className="text-sm font-bold text-family-text">{title}</h4>
      <p className="text-xs text-family-textMuted mt-1 max-w-xs">{description}</p>
    </div>
  );
};
