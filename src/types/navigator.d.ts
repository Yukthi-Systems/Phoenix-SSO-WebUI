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

// Client-hint / device-fingerprint APIs used by src/services/authService.ts
// that aren't in the standard DOM lib types yet.
export {};

declare global {
  interface NavigatorUABrandVersion {
    brand: string;
    version: string;
  }

  interface NavigatorUAData {
    brands: NavigatorUABrandVersion[];
    mobile: boolean;
    platform: string;
  }

  interface NetworkInformation {
    effectiveType?: string;
  }

  interface Navigator {
    userLanguage?: string;
    userAgentData?: NavigatorUAData;
    deviceMemory?: number;
    connection?: NetworkInformation;
    pdfViewerEnabled?: boolean;
  }
}
