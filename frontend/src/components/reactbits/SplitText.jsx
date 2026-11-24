import React from 'react';
import { motion } from 'framer-motion';

/**
 * ReactBits-inspired SplitText: staggered spring character or word reveal.
 */
export default function SplitText({
  text = '',
  className = '',
  delay = 0.035,
  by = 'words',
}) {
  const segments = by === 'chars' ? Array.from(text) : text.split(' ');

  return (
    <span className={`inline-flex flex-wrap ${className}`} aria-label={text}>
      {segments.map((seg, idx) => (
        <motion.span
          key={`${seg}-${idx}`}
          initial={{ opacity: 0, y: 22, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{
            type: 'spring',
            damping: 20,
            stiffness: 180,
            delay: idx * delay,
          }}
          className={by === 'words' ? 'mr-[0.28em] inline-block' : 'inline-block'}
        >
          {seg === ' ' ? '\u00A0' : seg}
        </motion.span>
      ))}
    </span>
  );
}
