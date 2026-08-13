/*
 * Copyright (C) 2026 Yukthi Systems Private Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * version 3 along with this program. If not, see
 * <https://www.gnu.org/licenses/>.
 */

import type { ReactNode } from 'react';

export type IconCircleVariant = 'success' | 'error' | 'warning' | 'neutral';

const variantClasses: Record<IconCircleVariant, string> = {
  success: 'bg-success/10 text-success border border-success/20',
  error: 'bg-error/10 text-error border border-error/20',
  warning: 'bg-warning/10 text-warning border border-warning/20',
  neutral: 'bg-card text-text-sub border border-card-border',
};

interface IconCircleProps {
  variant: IconCircleVariant;
  children: ReactNode;
  size?: 'md' | 'lg';
  className?: string;
}

export default function IconCircle({ variant, children, size = 'md', className = '' }: IconCircleProps) {
  const sizeClasses = size === 'lg' ? 'w-16 h-16' : 'w-14 h-14';
  return (
    <div
      className={`${sizeClasses} rounded-full flex items-center justify-center mx-auto ${variantClasses[variant]} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
