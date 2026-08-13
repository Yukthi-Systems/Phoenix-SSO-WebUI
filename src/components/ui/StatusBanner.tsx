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

export type StatusVariant = 'error' | 'info' | 'success';

const variantClasses: Record<StatusVariant, string> = {
  error: 'bg-error/10 border-error/20 text-error',
  info: 'bg-primary/10 border-primary/20 text-primary',
  success: 'bg-success/10 border-success/20 text-success',
};

interface StatusBannerProps {
  variant: StatusVariant;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
  id?: string;
}

export default function StatusBanner({ variant, children, icon, className = '', id }: StatusBannerProps) {
  return (
    <div
      id={id}
      className={`${variantClasses[variant]} border p-3 rounded-xl text-sm flex items-center gap-2 ${className}`.trim()}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      {icon}
      <span>{children}</span>
    </div>
  );
}
