'use client';

import { cn } from '@/lib/utils';

interface PillProps {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

/** Asgard-style filter pill — fully rounded */
export function Pill({ active = false, children, onClick, className }: PillProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
        active
          ? 'bg-[#3B7DDD] text-white'
          : 'bg-transparent border border-white/12 text-[#9CA3AF] hover:border-white/20 hover:text-white',
        className
      )}
    >
      {children}
    </button>
  );
}
