'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

/** Asgard-style elevated surface card */
export function Card({ children, className, onClick, hover = false }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-[#1A2332] border border-white/8 rounded-lg p-4',
        hover && 'hover:border-white/20 transition-colors duration-200 cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

/** Panel variant — slightly darker for dense data areas */
export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('bg-[#151C28] border border-white/8 rounded-lg p-4', className)}>
      {children}
    </div>
  );
}
