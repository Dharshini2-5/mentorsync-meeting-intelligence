import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

/**
 * ReactBits-inspired TrueFocus: luminous corner-bracket focus frame cycling across words.
 */
export default function TrueFocus({
  sentence = 'Capture Summarize Track',
  separator = ' ',
  borderColor = '#14B8A6',
  interval = 2200,
  className = '',
}) {
  const { isLight } = useTheme();
  const words = sentence.split(separator);
  const [activeIndex, setActiveIndex] = useState(0);
  const resolvedBorder = isLight ? '#0D9488' : borderColor;

  useEffect(() => {
    if (words.length <= 1) return;
    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % words.length);
    }, interval);
    return () => clearInterval(id);
  }, [words.length, interval]);

  return (
    <div className={`inline-flex flex-wrap items-center gap-3 ${className}`}>
      {words.map((word, idx) => {
        const isActive = idx === activeIndex;
        return (
          <button
            key={`${word}-${idx}`}
            type="button"
            onMouseEnter={() => setActiveIndex(idx)}
            onClick={() => setActiveIndex(idx)}
            className="relative cursor-pointer px-2.5 py-1 font-display text-sm font-semibold tracking-wide transition-all duration-300"
            style={{
              filter: isActive ? 'blur(0px)' : 'blur(1.1px)',
              opacity: isActive ? 1 : 0.52,
              color: isLight
                ? isActive
                  ? '#0F172A'
                  : '#64748B'
                : isActive
                ? '#F8FAFC'
                : '#94A3B8',
            }}
          >
            {isActive && (
              <motion.span
                layoutId="true-focus-frame"
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                className="pointer-events-none absolute inset-0"
              >
                <span
                  className="absolute left-0 top-0 h-2.5 w-2.5 border-l-2 border-t-2"
                  style={{ borderColor: resolvedBorder }}
                />
                <span
                  className="absolute right-0 top-0 h-2.5 w-2.5 border-r-2 border-t-2"
                  style={{ borderColor: resolvedBorder }}
                />
                <span
                  className="absolute bottom-0 left-0 h-2.5 w-2.5 border-b-2 border-l-2"
                  style={{ borderColor: resolvedBorder }}
                />
                <span
                  className="absolute bottom-0 right-0 h-2.5 w-2.5 border-b-2 border-r-2"
                  style={{ borderColor: resolvedBorder }}
                />
              </motion.span>
            )}
            {word}
          </button>
        );
      })}
    </div>
  );
}
