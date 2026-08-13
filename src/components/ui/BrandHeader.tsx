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

import { getBrandName } from '../../utils/security';

interface BrandHeaderProps {
  appName?: string;
}

export default function BrandHeader({ appName }: BrandHeaderProps) {
  const brand = getBrandName();

  return (
    <div className="text-center mb-7">
      <div className="inline-flex items-center gap-2.5">
        <div className="w-[38px] h-[38px] rounded-[10px] bg-primary flex items-center justify-center font-bold text-white text-base">
          {brand.charAt(0).toUpperCase()}
        </div>
        <span className="text-xl font-bold tracking-tight text-text-main">{brand}</span>
      </div>
      {appName && appName !== 'App' && (
        <p className="text-[0.85rem] mt-2 text-text-muted">
          Sign in to continue to <strong className="text-text-sub font-semibold">{appName}</strong>
        </p>
      )}
    </div>
  );
}
