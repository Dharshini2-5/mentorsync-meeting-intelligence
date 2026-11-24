import React from 'react';

/**
 * ReactBits-inspired BorderBeam: animated luminous light beam tracing card borders.
 */
export default function BorderBeam({
  colorFrom = '#14B8A6',
  colorTo = '#6366F1',
  className = '',
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] ${className}`}
      style={{
        padding: '1.5px',
        mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        maskComposite: 'exclude',
        WebkitMaskComposite: 'xor',
      }}
    >
      <div
        className="animate-border-beam absolute left-1/2 top-1/2 h-[220%] w-[220%] -translate-x-1/2 -translate-y-1/2"
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg 260deg, ${colorFrom} 305deg, ${colorTo} 345deg, transparent 360deg)`,
        }}
      />
    </div>
  );
}
