import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * ReactBits-inspired DotGrid: cursor-rippling interactive dot matrix background.
 * Dynamically adapts dot tones & hover glow for Dark and Light Mode.
 */
export default function DotGrid({
  dotSize = 2.2,
  gap = 28,
  baseColor,
  activeColor,
  lightBaseColor = 'rgba(15, 23, 42, 0.12)',
  lightActiveColor = 'rgba(13, 148, 136, 0.85)',
  proximity = 135,
  className = '',
}) {
  const canvasRef = useRef(null);
  const { isLight } = useTheme();

  const resolvedBase = isLight
    ? lightBaseColor
    : baseColor || 'rgba(148, 163, 184, 0.16)';
  const resolvedActive = isLight
    ? lightActiveColor
    : activeColor || 'rgba(20, 184, 166, 0.85)';
  const resolvedMid = isLight
    ? 'rgba(79, 70, 229, 0.48)'
    : 'rgba(99, 102, 241, 0.55)';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId = 0;
    let width = 0;
    let height = 0;
    const pointer = { x: -9999, y: -9999 };
    let pulse = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = parent ? parent.clientWidth : window.innerWidth;
      height = parent ? parent.clientHeight : window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    };

    const onLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);

    const draw = () => {
      pulse += 0.03;
      ctx.clearRect(0, 0, width, height);

      for (let y = gap / 2; y < height; y += gap) {
        for (let x = gap / 2; x < width; x += gap) {
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const dist = Math.hypot(dx, dy);

          if (dist < proximity) {
            const ratio = 1 - dist / proximity;
            const ripple = Math.sin(dist * 0.08 - pulse * 2.5) * 3.5 * ratio;
            const r = dotSize + ratio * 2.2;
            ctx.beginPath();
            ctx.arc(x + (dx / (dist + 1)) * ripple, y + (dy / (dist + 1)) * ripple, r, 0, Math.PI * 2);
            ctx.fillStyle = ratio > 0.45 ? resolvedActive : resolvedMid;
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(x, y, dotSize * 0.72, 0, Math.PI * 2);
            ctx.fillStyle = resolvedBase;
            ctx.fill();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, [dotSize, gap, resolvedBase, resolvedActive, resolvedMid, proximity]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
