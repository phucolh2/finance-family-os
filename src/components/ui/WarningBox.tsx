import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface WarningBoxProps {
  type?: 'info' | 'warning' | 'danger' | 'success';
  message: string;
  className?: string;
}

export const WarningBox: React.FC<WarningBoxProps> = ({
  type = 'warning',
  message,
  className = '',
}) => {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-family-accent/20 text-family-accentDark',
    danger: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-green-50 border-green-200 text-green-800',
  };

  const icons = {
    info: <Info className="w-5 h-5 shrink-0 text-blue-600" />,
    warning: <AlertTriangle className="w-5 h-5 shrink-0 text-family-accent" />,
    danger: <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />,
    success: <CheckCircle className="w-5 h-5 shrink-0 text-green-600" />,
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-2xl border text-sm font-medium ${styles[type]} ${className}`}>
      {icons[type]}
      <div className="leading-relaxed">{message}</div>
    </div>
  );
};
