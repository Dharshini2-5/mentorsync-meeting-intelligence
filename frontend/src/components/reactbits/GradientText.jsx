import React from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * ReactBits-inspired GradientText: flowing bioluminescent gradient typography.
 */
export default function GradientText({
  children,
  colors,
  className = '',
}) {
  const { isLight } = useTheme();
  const palette =
    colors ||
    (isLight
      ? ['#0D9488', '#4F46E5', '#EA580C', '#0D9488']
      : ['#14B8A6', '#6366F1', '#FB923C', '#14B8A6']);

  return (
    <span
      className={`animate-gradient-flow inline-block bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: `linear-gradient(95deg, ${palette.join(', ')})`,
      }}
    >
      {children}
    </span>
  );
}
