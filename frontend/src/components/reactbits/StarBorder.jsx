import React from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * ReactBits-inspired StarBorder: orbiting bioluminescent starlight button border.
 * In Light Mode, renders a crisp high-contrast obsidian-to-teal elevated CTA preserving white text.
 */
export default function StarBorder({
  as: Component = 'button',
  color = '#14B8A6',
  secondaryColor = '#6366F1',
  className = '',
  children,
  ...rest
}) {
  const { isLight } = useTheme();
  const c1 = isLight ? '#0D9488' : color;
  const c2 = isLight ? '#4F46E5' : secondaryColor;

  return (
    <Component
      className={`group relative inline-flex cursor-pointer items-center justify-center overflow-hidden rounded-xl p-[1.5px] transition-all duration-200 active:scale-[0.98] ${
        isLight
          ? 'bg-gradient-to-r from-teal-500/40 via-indigo-500/40 to-teal-500/40 shadow-[0_10px_28px_-8px_rgba(13,148,136,0.38)] hover:shadow-[0_14px_32px_-8px_rgba(79,70,229,0.42)]'
          : ''
      } ${className}`}
      {...rest}
    >
      <span
        aria-hidden="true"
        className="animate-star-bottom pointer-events-none absolute -bottom-2 -right-[150%] h-[55%] w-[260%] rounded-full opacity-85"
        style={{
          background: `radial-gradient(circle, ${c1}, transparent 22%)`,
        }}
      />
      <span
        aria-hidden="true"
        className="animate-star-top pointer-events-none absolute -left-[150%] -top-2 h-[55%] w-[260%] rounded-full opacity-85"
        style={{
          background: `radial-gradient(circle, ${c2}, transparent 22%)`,
        }}
      />
      <span
        className={`preserve-white relative z-10 inline-flex w-full items-center justify-center gap-2 rounded-[10.5px] px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 ${
          isLight
            ? 'bg-gradient-to-r from-teal-600 via-teal-600 to-indigo-600 group-hover:from-teal-500 group-hover:to-indigo-500'
            : 'bg-[#0A1626]/95 group-hover:bg-[#0E1E33]'
        }`}
      >
        {children}
      </span>
    </Component>
  );
}
