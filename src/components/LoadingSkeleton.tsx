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

interface LoadingSkeletonProps {
  lines?: number;
}

/**
 * Loading skeleton visual component matching index.css styles.
 */
export default function LoadingSkeleton({ lines = 3 }: LoadingSkeletonProps) {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <div className="w-[60px] h-[60px] bg-black/10 rounded-full mx-auto mb-4"></div>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`bg-gradient-to-r from-black/5 via-black/10 to-black/5 bg-[length:200%_100%] animate-skeleton-shimmer rounded-lg mx-auto ${
            index === lines - 1 ? 'h-9 w-[80%]' : 'h-12 w-full'
          }`}
        ></div>
      ))}
    </div>
  );
}
