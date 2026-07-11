import React, { useEffect, useState } from 'react';

interface CountUpProps {
  end: number | string;
  prefix?: string;
  duration?: number;
}

export function CountUp({ end, prefix = '', duration = 800 }: CountUpProps) {
  const isString = typeof end === 'string';
  // Check if we can extract a number
  const numericStr = String(end).replace(/[^0-9]/g, '');
  const numericEnd = parseInt(numericStr, 10);

  if (isNaN(numericEnd)) {
    return <span>{prefix}{end}</span>;
  }

  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    let startTimestamp: number | null = null;
    
    const step = (timestamp: number) => {
      if (!active) return;
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * numericEnd));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    
    window.requestAnimationFrame(step);
    return () => {
      active = false;
    };
  }, [numericEnd, duration]);

  // Helper to reconstruct format
  const getFormatted = (num: number) => {
    const original = String(end);
    if (original.includes(',')) {
      return num.toLocaleString('en-US');
    }
    if (original.toUpperCase().includes('VND')) {
      return `${num.toLocaleString('vi-VN')} VND`;
    }
    if (original.includes('%')) {
      return `${num}%`;
    }
    return num.toString();
  };

  return <span>{prefix}{getFormatted(count)}</span>;
}
