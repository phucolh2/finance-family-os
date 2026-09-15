import React, { useEffect, useState, useRef } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  formatFn?: (val: number) => string | React.ReactNode;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ 
  value, 
  duration = 800, 
  formatFn = (v) => v.toString(),
  className = ''
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrameId: number;
    
    const startValue = prevValueRef.current;
    const targetValue = value;
    const change = targetValue - startValue;

    if (change === 0) {
      setDisplayValue(targetValue);
      return;
    }

    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const current = startValue + change * easeOutQuart(progress);
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setDisplayValue(targetValue);
        prevValueRef.current = targetValue;
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [value, duration]);

  return <span className={className}>{formatFn(displayValue)}</span>;
};
