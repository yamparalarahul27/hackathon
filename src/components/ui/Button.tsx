'use client';

import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variants = {
  primary: 'bg-[#3B7DDD] hover:bg-[#2B6BC4] text-white',
  secondary: 'bg-transparent border border-white/12 text-[#9CA3AF] hover:bg-white/5 hover:text-white hover:border-white/20',
  success: 'bg-transparent border border-[#10B981] text-[#10B981] hover:bg-[#10B981]/8',
  danger: 'bg-transparent border border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444]/8',
  ghost: 'bg-transparent text-[#9CA3AF] hover:text-white hover:bg-white/5',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-sm',
};

/** Asgard-style button — rounded-lg, no neon, flat colors */
export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'font-semibold rounded-lg transition-all duration-200 inline-flex items-center justify-center gap-2 min-h-[40px]',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
