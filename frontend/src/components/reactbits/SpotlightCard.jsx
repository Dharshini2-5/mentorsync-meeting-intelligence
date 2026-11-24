import React, { useRef, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * ReactBits-inspired SpotlightCard: cursor-tracking radial spotlight surface.
 * Dynamically adapts glow intensity & crisp borders to Dark and Light Mode.
 */
export default function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(20, 184, 166, 0.18)',
  lightSpotlightColor,
  onClick,
}) {
  const ref = useRef(null);
  const { isLight } = useTheme();
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const activeSpot = isLight
    ? lightSpotlightColor || 'rgba(13, 148, 136, 0.10)'
    : spotlightColor;

  return (
    <div
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`glass-panel relative overflow-hidden rounded-2xl transition-all duration-300 ${
        isLight
          ? 'hover:border-teal-500/40 hover:shadow-[0_14px_34px_-12px_rgba(13,148,136,0.18)]'
          : 'hover:border-teal-400/35'
      } ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(420px circle at ${pos.x}px ${pos.y}px, ${activeSpot}, transparent 65%)`,
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
