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

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { buttonClasses, type ButtonVariant } from './buttonStyles';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  loadingText?: string;
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  loading = false,
  loadingText = 'Loading...',
  children,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button className={buttonClasses(variant, className)} disabled={disabled || loading} {...rest}>
      {loading ? (
        <>
          <span
            className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin"
            aria-hidden="true"
          />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
