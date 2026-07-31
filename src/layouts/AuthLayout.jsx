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

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getBrandName } from '../utils/security';

/**
 * Visual Layout Wrapper implementing HSL Theme triggers and responsiveness.
 */
export default function AuthLayout({ children }) {
  const [searchParams] = useSearchParams();
  const [theme, setTheme] = useState('dark');
  
  // Detect if SSO page is loaded in a compact login popup
  const isPopup = searchParams.get('mode') === 'popup';
  const appName = searchParams.get('app') || 'App';

  useEffect(() => {
    // Initial theme set on root document element
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className={`flex flex-col min-h-screen justify-center items-center relative z-10 w-full ${isPopup ? 'p-0' : 'p-4'}`}>
      {/* Visual background overlays */}
      <div className="flex justify-center w-full">
        <div 
          className={
            isPopup 
              ? "w-full max-w-full bg-transparent border-none p-5 shadow-none backdrop-blur-none translate-y-0 opacity-100" 
              : "w-full max-w-[440px] bg-card backdrop-blur-md border border-card-border rounded-[20px] p-10 shadow-2xl transition-all duration-300 animate-slide-up hover:border-white/12"
          }
        >
          {/* Header branding */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center gap-2.5">
              <div 
                className="w-[42px] h-[42px] rounded-[10px] bg-gradient-to-br from-primary to-accent flex items-center justify-center font-extrabold text-white text-xl shadow-[0_0_20px_rgba(99,102,241,0.25)]"
              >
                {getBrandName().charAt(0).toUpperCase()}
              </div>
              <span className="text-2xl font-bold tracking-tight text-text-main">
                {getBrandName()}
              </span>
            </div>
            {appName && appName !== 'App' && (
              <p className="text-[0.85rem] mt-2 text-text-muted">
                Sign in to continue to <strong className="text-text-sub font-bold">{appName}</strong>
              </p>
            )}
          </div>

          {/* Render page contents */}
          {children}

          {/* Card footer */}
          {!isPopup && (
            <div className="text-center mt-6 text-[0.8rem] text-text-muted">
              <span>&copy; {new Date().getFullYear()} {getBrandName()}. All rights reserved.</span>
            </div>
          )}
        </div>
      </div>

      {/* Static Floating Theme Toggle Button */}
      <button 
        onClick={toggleTheme} 
        className="fixed bottom-5 right-5 bg-white/5 border border-card-border rounded-full w-10 h-10 flex items-center justify-center cursor-pointer text-text-sub hover:bg-white/10 hover:text-text-main transition-all duration-150 backdrop-blur-sm z-50"
        title="Toggle Theme"
        aria-label="Toggle Theme"
      >
        {theme === 'dark' ? (
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="5"></circle>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
          </svg>
        ) : (
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        )}
      </button>
    </div>
  );
}
