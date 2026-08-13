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

import type { SSOAppearance } from '../types';

/** Appends theme/themeColor as query params (if provided) to an SSO service URL, in place. */
export function applyAppearanceParams(url: URL, appearance?: SSOAppearance): void {
  if (!appearance) return;
  if (appearance.theme) url.searchParams.set('theme', appearance.theme);
  if (appearance.themeColor) url.searchParams.set('theme_color', appearance.themeColor);
}
