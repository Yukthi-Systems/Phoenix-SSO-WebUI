import React from 'react';

/**
 * Loading skeleton visual component matching index.css styles.
 */
export default function LoadingSkeleton({ lines = 3 }) {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <div className="w-[60px] h-[60px] bg-white/5 rounded-full mx-auto mb-4"></div>
      {Array.from({ length: lines }).map((_, index) => (
        <div 
          key={index} 
          className={`bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] animate-skeleton-shimmer rounded-lg mx-auto ${
            index === lines - 1 ? 'h-9 w-[80%]' : 'h-12 w-full'
          }`}
        ></div>
      ))}
    </div>
  );
}
