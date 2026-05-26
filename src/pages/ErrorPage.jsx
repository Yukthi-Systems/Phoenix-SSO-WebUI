import React from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { getBrandName } from '../utils/security';

export default function ErrorPage() {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <div className="text-center">
        {/* Error icon wrapper */}
        <div 
          className="w-14 h-14 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto mb-5"
        >
          <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
        </div>

        <h2 className="text-xl font-semibold mb-2 text-text-main">
          Authentication Error
        </h2>
        <p className="text-[0.875rem] text-text-sub mb-6">
          An unexpected authentication error occurred. Please verify your connection and try again.
        </p>

        <div className="flex flex-col gap-2">
          <button 
            type="button" 
            className="w-full py-3 px-6 text-base font-semibold rounded-xl cursor-pointer transition-all flex justify-center items-center gap-2 relative overflow-hidden bg-primary text-white shadow-sm hover:bg-primary-hover hover:shadow-[0_0_20px_rgba(99,102,241,0.25)] focus:outline-none focus:ring-4 focus:ring-primary/20"
            onClick={() => navigate('/login')}
          >
            Return to Login
          </button>
          
          <a 
            href={`https://support.${getBrandName()}`}
            className="w-full py-3 px-6 text-base font-semibold rounded-xl cursor-pointer transition-all flex justify-center items-center gap-2 relative overflow-hidden bg-white/5 text-text-main border border-card-border hover:bg-white/10 no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Contact Support
          </a>
        </div>
      </div>
    </AuthLayout>
  );
}
