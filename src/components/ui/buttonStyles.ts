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

export type ButtonVariant = 'primary' | 'secondary';

const baseClasses =
  'w-full py-3 px-6 text-base font-semibold rounded-xl cursor-pointer transition-colors flex justify-center items-center gap-2 focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white shadow-sm hover:bg-primary-hover',
  secondary: 'bg-card border border-card-border text-text-sub hover:bg-white/5 hover:text-text-main',
};

export function buttonClasses(variant: ButtonVariant = 'primary', extra = ''): string {
  return `${baseClasses} ${variantClasses[variant]} ${extra}`.trim();
}
