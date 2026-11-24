import React, { useRef, useState } from 'react';

/**
 * ReactBits-inspired Magnet: subtle cursor-attracting magnetic CTA wrapper.
 */
export default function Magnet({
  children,
  strength = 0.28,
  padding = 36,
  className = '',
}) {
  const ref = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  const handleMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    if (Math.abs(dx) < rect.width / 2 + padding && Math.abs(dy) < rect.height / 2 + padding) {
      setActive(true);
      setOffset({ x: dx * strength, y: dy * strength });
    }
  };

  const handleLeave = () => {
    setActive(false);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`inline-block ${className}`}
    >
      <div
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
          transition: active ? 'transform 0.12s ease-out' : 'transform 0.45s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
