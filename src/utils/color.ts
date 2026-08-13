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

interface Hsl {
  h: number;
  s: number;
  l: number;
}

/** Parses a strict 6-digit hex color ("#4f46e5" or "4f46e5"). Returns null for anything else. */
function hexToHsl(hex: string): Hsl | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;

  const r = parseInt(match[1].slice(0, 2), 16) / 255;
  const g = parseInt(match[1].slice(2, 4), 16) / 255;
  const b = parseInt(match[1].slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;
  const d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r: h = ((g - b) / d) % 6; break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/**
 * Overrides the app's primary/accent CSS variables with a caller-supplied brand
 * color. Invalid input is ignored, leaving the default branding in place.
 */
export function applyBrandColor(hex: string): void {
  const hsl = hexToHsl(hex);
  if (!hsl) return;

  const { h, s, l } = hsl;
  // Lighten dark colors for their hover state, darken light ones — mirrors the
  // direction the app's own default tokens already shift in dark vs. light mode.
  const hoverL = l < 60 ? Math.min(l + 8, 92) : Math.max(l - 8, 8);

  const root = document.documentElement.style;
  root.setProperty('--primary', `hsl(${h}, ${s}%, ${l}%)`);
  root.setProperty('--primary-hover', `hsl(${h}, ${s}%, ${hoverL}%)`);
  root.setProperty('--accent', `hsl(${h}, ${s}%, ${l}%)`);
  root.setProperty('--primary-focus', `hsl(${h}, ${s}%, ${l}%, 0.2)`);
}
