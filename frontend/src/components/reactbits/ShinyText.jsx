import React from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * ReactBits-inspired ShinyText: sweeping metallic light highlight across text.
 */
export default function ShinyText({
  text,
  children,
  className = '',
  speed = 4.5,
}) {
  const { isLight } = useTheme();

  return (
    <span
      className={`animate-shiny inline-block bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: isLight
          ? 'linear-gradient(120deg, rgba(15,23,42,0.82) 35%, rgba(13,148,136,1) 50%, rgba(79,70,229,0.92) 65%)'
          : 'linear-gradient(120deg, rgba(226,232,240,0.68) 35%, rgba(94,234,212,1) 50%, rgba(226,232,240,0.68) 65%)',
        backgroundSize: '250% 100%',
        animationDuration: `${speed}s`,
      }}
    >
      {children || text}
    </span>
  );
}
