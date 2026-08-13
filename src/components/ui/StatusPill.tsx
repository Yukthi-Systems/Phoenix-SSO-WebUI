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

interface StatusPillProps {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

export default function StatusPill({ active, activeLabel = 'Active', inactiveLabel = 'Inactive' }: StatusPillProps) {
  if (active) {
    return (
      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-success/10 text-success border border-success/20 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-success" aria-hidden="true"></span>
        {activeLabel}
      </span>
    );
  }
  return (
    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-card text-text-muted border border-card-border">
      {inactiveLabel}
    </span>
  );
}
