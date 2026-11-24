import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * ReactBits-inspired RotatingText: vertical spring text cycler.
 */
export default function RotatingText({
  texts = [],
  interval = 2600,
  className = '',
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (texts.length <= 1) return;
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % texts.length);
    }, interval);
    return () => clearInterval(id);
  }, [texts.length, interval]);

  if (!texts.length) return null;

  return (
    <span className={`relative inline-flex overflow-hidden align-bottom ${className}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={texts[index]}
          initial={{ y: '100%', opacity: 0, filter: 'blur(4px)' }}
          animate={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: '-100%', opacity: 0, filter: 'blur(4px)' }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="inline-block whitespace-nowrap"
        >
          {texts[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
