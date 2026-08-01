import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface HelpTooltipProps {
  text: string | React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: 'dark' | 'light';
  iconClassName?: string;
}

/**
 * Reusable premium help tooltip component.
 * Displays a styled floating explainer card on hover.
 */
export const HelpTooltip: React.FC<HelpTooltipProps> = ({ text, position = 'bottom', theme = 'light', iconClassName = '' }) => {
  const [visible, setVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    'bottom-right': 'top-full right-0 mt-2',
    'bottom-left': 'top-full left-0 mt-2',
    'top-right': 'bottom-full right-0 mb-2',
    'top-left': 'bottom-full left-0 mb-2',
  };

  const themeClasses = theme === 'dark' 
    ? 'bg-family-bgDark/95 backdrop-blur-md border border-family-accent/20 shadow-xl text-family-textMuted' 
    : 'bg-white/95 backdrop-blur-md border border-gray-200 shadow-xl text-gray-800';

  return (
    <div
      className="relative inline-block ml-2 select-none"
      onMouseEnter={() => { setVisible(true); }}
      onMouseLeave={() => { setVisible(false); }}
      onFocus={() => { setVisible(true); }}
      onBlur={() => { setVisible(false); }}
    >
      <HelpCircle className={`w-4 h-4 text-family-textLight hover:text-family-accent transition-colors cursor-help ${iconClassName}`} />
      {visible && (
        <div
          className={`absolute z-50 w-56 p-3 rounded-xl text-[10px] font-medium leading-relaxed transition-opacity duration-150 ${themeClasses} ${positionClasses[position]}`}
        >
          {text}
        </div>
      )}
    </div>
  );
};
