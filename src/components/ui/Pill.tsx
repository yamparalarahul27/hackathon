'use client';

import { cn } from '@/lib/utils';

interface PillProps {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

/** Asgard-style filter pill — rounded-sm, white bg inactive */
export function Pill({ active = false, children, onClick, icon, className }: PillProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center justify-center gap-1 h-9 lg:h-10 py-1.5 lg:py-2 text-xs lg:text-sm font-ibm-plex-sans font-medium whitespace-nowrap transition-all duration-150 shrink-0 rounded-sm cursor-pointer px-4 lg:px-4.5',
        active
          ? 'bg-[#19549b] text-white raised-frosted-active'
          : 'bg-white text-[#11274d]/50 raised-frosted-tab hover:text-[#11274d]/70',
        className
      )}
    >
      {icon}
      {children}
    </button>
  );
}
