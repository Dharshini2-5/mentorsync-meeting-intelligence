import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

/**
 * ReactBits-inspired PillNav: morphing spring-animated pill tab switcher.
 * Theme-aware for Dark Obsidian and Light Editorial Frost surfaces.
 */
export default function PillNav({
  items = [],
  activeId,
  onChange,
  layoutId = 'pill-nav-indicator',
  className = '',
}) {
  const { isLight } = useTheme();

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-1 rounded-xl border p-1 backdrop-blur-md transition-colors ${
        isLight
          ? 'border-slate-200/90 bg-slate-100/90 shadow-inner'
          : 'border-slate-700/60 bg-[#081220]/80'
      } ${className}`}
    >
      {items.map((item) => {
        const active = item.id === activeId;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`relative flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors sm:text-sm ${
              active
                ? isLight
                  ? 'text-slate-900'
                  : 'text-white'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                className={`absolute inset-0 rounded-lg border ${
                  isLight
                    ? 'border-teal-500/35 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.08)]'
                    : 'border-teal-400/40 bg-gradient-to-r from-teal-500/25 via-indigo-500/25 to-teal-500/20 shadow-[0_0_20px_rgba(20,184,166,0.22)]'
                }`}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {Icon && (
                <Icon
                  className={`h-3.5 w-3.5 ${
                    active && isLight ? 'text-teal-600' : ''
                  }`}
                />
              )}
              {item.label}
              {typeof item.count === 'number' && (
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-mono ${
                    isLight
                      ? active
                        ? 'bg-teal-50 text-teal-700'
                        : 'bg-slate-200/80 text-slate-600'
                      : 'bg-slate-800/90 text-teal-300'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
