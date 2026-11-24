import React from 'react';
import { motion } from 'framer-motion';

/**
 * ReactBits-inspired AnimatedList: staggered physics list with gradient edge masks.
 */
export default function AnimatedList({
  items = [],
  renderItem,
  keyExtractor,
  emptyMessage = 'No items to display yet.',
  maxHeight = '420px',
  className = '',
}) {
  if (!items.length) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-700/70 bg-slate-900/30 py-10 text-sm text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div
        className="space-y-2.5 overflow-y-auto pr-1"
        style={{ maxHeight }}
      >
        {items.map((item, idx) => (
          <motion.div
            key={keyExtractor ? keyExtractor(item, idx) : idx}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.28,
              delay: Math.min(idx * 0.045, 0.35),
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {renderItem(item, idx)}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
