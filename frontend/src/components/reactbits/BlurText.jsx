import React from 'react';
import { motion } from 'framer-motion';

/**
 * ReactBits-inspired BlurText: soft blur-to-crisp animated text reveal.
 */
export default function BlurText({
  text = '',
  className = '',
  delay = 0.05,
  direction = 'top',
}) {
  const words = text.split(' ');
  const yOffset = direction === 'top' ? -14 : 14;

  return (
    <span className={`inline-flex flex-wrap ${className}`}>
      {words.map((word, idx) => (
        <motion.span
          key={`${word}-${idx}`}
          initial={{ opacity: 0, y: yOffset, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{
            duration: 0.45,
            delay: idx * delay,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mr-[0.26em] inline-block"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}
