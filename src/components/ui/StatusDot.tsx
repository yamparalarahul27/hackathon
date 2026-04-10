'use client';

import { cn } from '@/lib/utils';

interface StatusDotProps {
  variant?: 'live' | 'success' | 'danger' | 'warning';
  pulse?: boolean;
  className?: string;
}

const colors = {
  live: 'bg-[#0fa87a]',
  success: 'bg-[#0fa87a]',
  danger: 'bg-[#ef4444]',
  warning: 'bg-[#f59e0b]',
};

/** Simple status dot */
export function StatusDot({ variant = 'live', pulse = false, className }: StatusDotProps) {
  return (
    <span className={cn('relative inline-flex w-1.5 h-1.5', className)}>
      {pulse && <span className={cn('absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping', colors[variant])} />}
      <span className={cn('relative inline-flex rounded-full w-1.5 h-1.5', colors[variant])} />
    </span>
  );
}
