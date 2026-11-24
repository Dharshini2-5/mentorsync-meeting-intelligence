import React, { useEffect, useState } from 'react';

/**
 * ReactBits-inspired CountUp: smooth eased numeric counter.
 */
export default function CountUp({
  to = 0,
  from = 0,
  duration = 1100,
  decimals = 0,
  prefix = '',
  suffix = '',
  separator = ',',
  className = '',
}) {
  const [value, setValue] = useState(from);

  useEffect(() => {
    const start = performance.now();
    const target = Number(to) || 0;
    const initial = Number(from) || 0;
    let raf = 0;

    const step = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(initial + (target - initial) * eased);
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      } else {
        setValue(target);
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, from, duration]);

  const formatted = value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, separator);

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
