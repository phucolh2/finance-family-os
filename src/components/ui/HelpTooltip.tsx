import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface HelpTooltipProps {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Reusable premium help tooltip component.
 * Displays a styled floating explainer card on hover.
 */
export const HelpTooltip: React.FC<HelpTooltipProps> = ({ text, position = 'bottom' }) => {
  const [visible, setVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-block ml-2 select-none"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <HelpCircle className="w-4 h-4 text-family-textLight hover:text-family-accent transition-colors cursor-help" />
      {visible && (
        <div
          className={`absolute z-50 w-56 p-3 bg-family-bgDark/95 backdrop-blur-md border border-family-accent/20 rounded-xl shadow-xl text-[10px] text-family-textMuted font-medium leading-relaxed transition-opacity duration-150 ${positionClasses[position]}`}
        >
          {text}
        </div>
      )}
    </div>
  );
};
