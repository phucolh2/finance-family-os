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
    ? 'bg-[#2f241d]/95 backdrop-blur-md border border-family-accent/20 shadow-xl text-[#d4c6b6]' 
    : 'bg-white/95 backdrop-blur-md border border-gray-200 shadow-xl text-gray-800';

  return (
    <div
      className="relative inline-block ml-1.5 select-none group"
      onMouseEnter={() => { setVisible(true); }}
      onMouseLeave={() => { setVisible(false); }}
      onFocus={() => { setVisible(true); }}
      onBlur={() => { setVisible(false); }}
      onClick={(e) => {
        e.preventDefault();
        setVisible(!visible);
      }}
      tabIndex={0}
      role="button"
      aria-expanded={visible}
    >
      <HelpCircle className={`w-[14px] h-[14px] text-family-textLight/70 group-hover:text-family-accent transition-colors cursor-help ${iconClassName}`} />
      
      <div
        className={`absolute z-50 w-64 p-3.5 rounded-xl text-xs font-medium leading-relaxed transition-all duration-200 ease-out origin-top ${themeClasses} ${positionClasses[position]} ${
          visible ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 translate-y-1 pointer-events-none'
        }`}
      >
        {text}
      </div>
    </div>
  );
};
