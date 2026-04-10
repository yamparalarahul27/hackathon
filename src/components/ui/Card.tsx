'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  style?: React.CSSProperties;
}

/** Asgard-style white card on light bg — raised frosted shadow, rounded-sm */
export function Card({ children, className, onClick, hover = false, style }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={cn(
        'bg-white rounded-sm overflow-hidden raised-frosted',
        hover && 'cursor-pointer active:scale-[0.98] transition-all duration-150 ease-in-out',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

/** Card footer tint section */
export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('bg-frost-tint px-3.5 py-2.5', className)}>
      {children}
    </div>
  );
}
