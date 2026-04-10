'use client';

import { cn } from '@/lib/utils';

interface StatusDotProps {
  variant?: 'live' | 'success' | 'danger' | 'warning' | 'info';
  pulse?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const colors = {
  live: 'bg-[#10B981]',
  success: 'bg-[#10B981]',
  danger: 'bg-[#EF4444]',
  warning: 'bg-[#F59E0B]',
  info: 'bg-[#3B7DDD]',
};

/** Asgard-style status indicator — simple dot with optional pulse */
export function StatusDot({ variant = 'live', pulse = true, size = 'sm', className }: StatusDotProps) {
  const s = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';

  return (
    <span className={cn('relative inline-flex', s, className)}>
      {pulse && (
        <span className={cn('absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping', colors[variant])} />
      )}
      <span className={cn('relative inline-flex rounded-full', s, colors[variant])} />
    </span>
  );
}
