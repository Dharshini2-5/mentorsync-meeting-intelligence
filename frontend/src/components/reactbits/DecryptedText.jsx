import React, { useEffect, useState } from 'react';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+<>';

/**
 * ReactBits-inspired DecryptedText: cryptographic cipher scramble decode effect.
 */
export default function DecryptedText({
  text = '',
  speed = 34,
  className = '',
  revealOnHover = false,
}) {
  const [display, setDisplay] = useState(text);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    let frame = 0;
    const totalFrames = Math.max(12, text.length * 2);
    const id = setInterval(() => {
      frame += 1;
      const revealedCount = Math.floor((frame / totalFrames) * text.length);
      const next = text
        .split('')
        .map((ch, idx) => {
          if (ch === ' ') return ' ';
          if (idx < revealedCount) return ch;
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        })
        .join('');
      setDisplay(next);
      if (frame >= totalFrames) {
        setDisplay(text);
        clearInterval(id);
      }
    }, speed);

    return () => clearInterval(id);
  }, [text, speed, trigger]);

  return (
    <span
      onMouseEnter={revealOnHover ? () => setTrigger((n) => n + 1) : undefined}
      className={`font-mono ${className}`}
    >
      {display}
    </span>
  );
}
