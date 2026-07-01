import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  isKpi?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', isKpi = false, ...props }) => {
  return (
    <div
      className={`glass-panel rounded-2xl p-6 transition-all duration-200 ${
        isKpi ? 'border-l-4' : 'glass-panel-hover shadow-xl shadow-[#2f241d]/3'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => {
  return <div className={`mb-3 ${className}`} {...props}>{children}</div>;
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className = '', ...props }) => {
  return <h3 className={`text-lg font-serif font-bold text-family-text ${className}`} {...props}>{children}</h3>;
};

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ children, className = '', ...props }) => {
  return <p className={`text-xs text-family-textMuted mt-1 ${className}`} {...props}>{children}</p>;
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => {
  return <div className={`${className}`} {...props}>{children}</div>;
};
