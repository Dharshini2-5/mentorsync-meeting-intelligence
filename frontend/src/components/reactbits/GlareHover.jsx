import React from 'react';

/**
 * ReactBits-inspired GlareHover: diagonal specular light sweep across element on hover.
 */
export default function GlareHover({ children, className = '' }) {
  return (
    <div className={`group relative overflow-hidden ${className}`}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-full top-0 z-20 h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/15 to-transparent transition-all duration-700 ease-out group-hover:left-[150%]"
      />
      {children}
    </div>
  );
}
