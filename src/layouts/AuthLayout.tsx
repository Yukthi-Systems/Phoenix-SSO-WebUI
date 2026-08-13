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

import { useEffect, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import BrandHeader from '../components/ui/BrandHeader';
import Footer from '../components/ui/Footer';
import ThemeToggle from '../components/ui/ThemeToggle';
import { applyBrandColor } from '../utils/color';

/**
 * Visual Layout Wrapper implementing HSL Theme triggers and responsiveness.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  const [searchParams] = useSearchParams();

  // Detect if SSO page is loaded in a compact login popup
  const isPopup = searchParams.get('mode') === 'popup';
  const appName = searchParams.get('app') || 'App';
  const themeColor = searchParams.get('theme_color');

  useEffect(() => {
    if (themeColor) applyBrandColor(themeColor);
  }, [themeColor]);

  return (
    <div className={`flex flex-col min-h-screen justify-center items-center w-full ${isPopup ? 'p-0' : 'p-4'}`}>
      <div className="flex justify-center w-full">
        <div
          className={
            isPopup
              ? 'w-full max-w-full bg-transparent'
              : 'w-full max-w-[440px] bg-card backdrop-blur-2xl border border-card-border rounded-2xl shadow-lg transition-all duration-300 animate-slide-up'
          }
        >
          <div className={isPopup ? 'p-5' : 'p-10'}>
            <BrandHeader appName={appName} />

            {children}

            {!isPopup && <Footer />}
          </div>
        </div>
      </div>

      <ThemeToggle />
    </div>
  );
}
