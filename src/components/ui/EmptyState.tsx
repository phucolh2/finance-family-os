import React from 'react';
import { Database } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Chưa có dữ liệu',
  description = 'Khu vực này hiện trống. Hãy bổ sung thông tin để ứng dụng có thể phân tích cho gia đình mình nhé.',
  icon = <Database className="w-8 h-8 text-family-accent/50" />,
  children,
  className = '',
}) => {
  return (
    <div className={`relative flex flex-col items-center justify-center text-center p-12 border border-dashed border-family-accent/20 rounded-2xl bg-white/50 backdrop-blur-sm overflow-hidden ${className}`}>
      {/* Abstract Background Illustration */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center">
        <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="200" cy="200" r="150" stroke="currentColor" strokeWidth="2" strokeDasharray="10 10"/>
          <circle cx="200" cy="200" r="100" stroke="currentColor" strokeWidth="2" strokeDasharray="10 10"/>
          <circle cx="200" cy="200" r="50" stroke="currentColor" strokeWidth="2" strokeDasharray="10 10"/>
          <path d="M50 200 H350 M200 50 V350" stroke="currentColor" strokeWidth="2" strokeDasharray="5 15"/>
        </svg>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="w-16 h-16 bg-gradient-to-br from-white to-family-accent/5 rounded-2xl border border-family-accent/10 shadow-sm flex items-center justify-center mb-4 text-family-accent animate-fade-up">
          {icon}
        </div>
        <h4 className="text-base font-bold text-family-text mb-2">{title}</h4>
        <p className="text-sm text-family-textMuted max-w-sm mb-6 leading-relaxed">{description}</p>
        
        {children && (
          <div className="mt-2">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};
