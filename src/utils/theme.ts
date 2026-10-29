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

export type Theme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'theme';

// A `?theme=` param from a hosting app (e.g. matching its own current theme)
// takes priority over the visitor's saved choice — it reflects the caller's
// intent for *this* session, not a permanent preference override.
export function getInitialTheme(urlTheme: string | null): Theme {
  if (urlTheme === 'dark' || urlTheme === 'light') return urlTheme;
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
