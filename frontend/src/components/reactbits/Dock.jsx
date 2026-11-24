import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

/**
 * ReactBits-inspired Dock: floating magnifying bottom navigation bar.
 * Theme-aware for both Dark Obsidian and Light Editorial Frost surfaces.
 */
export default function Dock({ items = [], activeId, onSelect, className = '' }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const { isLight } = useTheme();

  return (
    <div
      className={`no-print fixed bottom-5 left-1/2 z-50 -translate-x-1/2 ${className}`}
      role="navigation"
      aria-label="Primary Workspace Dock"
    >
      <div
        className={`flex items-end gap-2 rounded-2xl border px-3 py-2 backdrop-blur-xl transition-colors duration-300 ${
          isLight
            ? 'border-slate-200/90 bg-white/92 shadow-[0_14px_40px_rgba(15,23,42,0.14),0_2px_8px_rgba(15,23,42,0.06)]'
            : 'border-slate-700/60 bg-[#081220]/90 shadow-[0_14px_50px_rgba(0,0,0,0.65)]'
        }`}
      >
        {items.map((item, idx) => {
          const isActive = item.id === activeId;
          const dist = hoveredIdx === null ? 99 : Math.abs(hoveredIdx - idx);
          const scale = dist === 0 ? 1.2 : dist === 1 ? 1.08 : 1;
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              className="relative flex flex-col items-center"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {hoveredIdx === idx && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`pointer-events-none absolute -top-10 whitespace-nowrap rounded-lg border px-2.5 py-1 text-xs font-medium shadow-lg ${
                    isLight
                      ? 'preserve-white border-slate-800 bg-slate-900 text-white'
                      : 'border-teal-500/30 bg-[#0B1728]/95 text-teal-200'
                  }`}
                >
                  {item.label}
                </motion.div>
              )}

              <motion.button
                type="button"
                onClick={() => onSelect(item.id)}
                animate={{ scale, y: dist === 0 ? -5 : 0 }}
                transition={{ type: 'spring', stiffness: 360, damping: 24 }}
                className={`relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border transition-colors sm:h-11 sm:w-auto sm:gap-2 sm:px-3.5 ${
                  isActive
                    ? isLight
                      ? 'preserve-white border-teal-600/30 bg-gradient-to-br from-teal-600 to-indigo-600 text-white shadow-[0_6px_20px_rgba(13,148,136,0.32)]'
                      : 'border-teal-400/50 bg-gradient-to-br from-teal-500/25 to-indigo-500/25 text-teal-200 shadow-[0_0_24px_rgba(20,184,166,0.28)]'
                    : isLight
                    ? 'border-slate-200/80 bg-slate-50/90 text-slate-600 hover:border-teal-500/40 hover:bg-teal-50/70 hover:text-slate-900'
                    : 'border-slate-700/50 bg-slate-900/70 text-slate-400 hover:border-slate-600 hover:text-slate-100'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden text-xs font-semibold sm:inline">
                  {item.shortLabel || item.label}
                </span>
                {item.badge > 0 && (
                  <span
                    className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      isActive && isLight
                        ? 'bg-white/25 text-white'
                        : 'bg-orange-500/95 text-white preserve-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </motion.button>

              {isActive && (
                <span
                  className={`mt-1 h-1 w-4 rounded-full ${
                    isLight
                      ? 'bg-teal-600 shadow-[0_0_8px_rgba(13,148,136,0.5)]'
                      : 'bg-teal-400 shadow-[0_0_10px_#14B8A6]'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
