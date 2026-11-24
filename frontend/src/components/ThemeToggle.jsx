import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

/**
 * Sleek animated Dark / Light Mode pill switch with Framer Motion spring Sun/Moon morph.
 */
export default function ThemeToggle({ className = '', compact = false }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={!isDark}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      title={isDark ? 'Switch to Editorial Light Mode' : 'Switch to Obsidian Dark Mode'}
      className={`group relative inline-flex cursor-pointer items-center rounded-full border transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/60 ${
        compact ? 'h-8 w-[58px] p-1' : 'h-9 w-[66px] p-1'
      } ${
        isDark
          ? 'border-slate-700/80 bg-[#0B1626]/90 shadow-[inset_0_1px_2px_rgba(0,0,0,0.45)] hover:border-teal-400/50'
          : 'border-slate-300/90 bg-white/95 shadow-[0_2px_10px_rgba(15,23,42,0.07),inset_0_1px_2px_rgba(15,23,42,0.05)] hover:border-teal-500/50'
      } ${className}`}
    >
      {/* Subtle background track icons */}
      <span className="pointer-events-none flex w-full items-center justify-between px-1.5">
        <Sun
          className={`h-3 w-3 transition-opacity duration-300 ${
            isDark ? 'text-slate-500 opacity-55' : 'text-amber-500 opacity-0'
          }`}
        />
        <Moon
          className={`h-3 w-3 transition-opacity duration-300 ${
            isDark ? 'text-teal-300 opacity-0' : 'text-slate-400 opacity-60'
          }`}
        />
      </span>

      {/* Spring-animated morphing knob */}
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 460, damping: 30 }}
        className={`preserve-white absolute top-1 flex items-center justify-center rounded-full shadow-md ${
          compact ? 'h-6 w-6' : 'h-7 w-7'
        } ${
          isDark
            ? 'left-1 bg-gradient-to-br from-teal-500 to-indigo-600 text-white shadow-[0_0_14px_rgba(20,184,166,0.45)]'
            : 'right-1 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white shadow-[0_2px_12px_rgba(234,88,12,0.38)]'
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.span
              key="moon"
              initial={{ rotate: -80, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 80, scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="flex items-center justify-center"
            >
              <Moon className="h-3.5 w-3.5 stroke-[2.2]" />
            </motion.span>
          ) : (
            <motion.span
              key="sun"
              initial={{ rotate: 80, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -80, scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="flex items-center justify-center"
            >
              <Sun className="h-3.5 w-3.5 stroke-[2.2]" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.span>
    </button>
  );
}
