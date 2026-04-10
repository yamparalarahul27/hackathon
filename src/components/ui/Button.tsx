'use client';

import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost-dark' | 'ghost-light' | 'execute';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variants = {
  primary: 'bg-[#19549b] hover:bg-[#143f78] text-white',
  secondary: 'bg-white border border-[#cbd5e1] text-[#11274d] hover:bg-[#f1f5f9]',
  'ghost-dark': 'bg-white/10 text-white hover:bg-white/20',
  'ghost-light': 'bg-transparent text-[#6a7282] hover:text-[#212121] hover:bg-[#f1f5f9]',
  execute: 'bg-[#19549b] hover:bg-[#143f78] text-white',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
};

/** Asgard-style button — rounded-sm */
export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'font-semibold rounded-sm transition-all duration-150 inline-flex items-center justify-center gap-2',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        'font-instrument',
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
