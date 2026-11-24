import React, { useRef, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * ReactBits-inspired TiltedCard: smooth 3D perspective tilt with specular highlight.
 */
export default function TiltedCard({
  children,
  className = '',
  maxTilt = 9,
}) {
  const cardRef = useRef(null);
  const { isLight } = useTheme();
  const [style, setStyle] = useState({
    transform: 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)',
  });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const onMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotY = (px - 0.5) * maxTilt * 2;
    const rotX = (0.5 - py) * maxTilt * 2;
    setStyle({
      transform: `perspective(900px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.015,1.015,1.015)`,
    });
    setGlare({ x: px * 100, y: py * 100, opacity: isLight ? 0.14 : 0.22 });
  };

  const onLeave = () => {
    setStyle({
      transform: 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)',
    });
    setGlare((g) => ({ ...g, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={style}
      className={`glass-panel relative overflow-hidden rounded-2xl transition-transform duration-200 ease-out will-change-transform ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: glare.opacity,
          background: isLight
            ? `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(13, 148, 136, 0.24), transparent 60%)`
            : `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(99, 102, 241, 0.35), transparent 60%)`,
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
