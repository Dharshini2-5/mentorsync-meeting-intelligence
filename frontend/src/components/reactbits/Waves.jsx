import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * ReactBits-inspired Waves: interactive acoustic & perlin-like flowing canvas waves
 * evoking voice intelligence and mentor-mentee dialogue cadence.
 * Dynamically adapts palette & opacity for Dark and Light Mode.
 */
export default function Waves({
  lineColor,
  secondaryColor,
  lightLineColor = 'rgba(13, 148, 136, 0.20)',
  lightSecondaryColor = 'rgba(79, 70, 229, 0.14)',
  backgroundColor = 'transparent',
  waveSpeedX = 0.012,
  waveSpeedY = 0.006,
  waveAmpX = 32,
  waveAmpY = 18,
  xGap = 18,
  yGap = 34,
  className = '',
}) {
  const canvasRef = useRef(null);
  const { isLight } = useTheme();

  const resolvedLine = isLight
    ? lightLineColor
    : lineColor || 'rgba(20, 184, 166, 0.22)';
  const resolvedSecondary = isLight
    ? lightSecondaryColor
    : secondaryColor || 'rgba(99, 102, 241, 0.16)';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId = 0;
    let width = 0;
    let height = 0;
    const mouse = { x: -9999, y: -9999, vx: 0, vy: 0, active: false };
    let tick = 0;

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

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const nx = e.clientX - rect.left;
      const ny = e.clientY - rect.top;
      mouse.vx = (nx - mouse.x) * 0.25;
      mouse.vy = (ny - mouse.y) * 0.25;
      mouse.x = nx;
      mouse.y = ny;
      mouse.active = true;
    };

    const onMouseLeave = () => {
      mouse.active = false;
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);

    const pseudoNoise = (x, y, t) =>
      Math.sin(x * 0.014 + t) * Math.cos(y * 0.018 - t * 0.6) +
      0.5 * Math.sin((x + y) * 0.009 + t * 1.3);

    const draw = () => {
      tick += waveSpeedX;
      ctx.clearRect(0, 0, width, height);
      if (backgroundColor !== 'transparent') {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
      }

      const rows = Math.ceil(height / yGap) + 2;
      const cols = Math.ceil(width / xGap) + 2;

      for (let r = 0; r < rows; r++) {
        const baseY = r * yGap;
        ctx.beginPath();
        ctx.strokeStyle = r % 2 === 0 ? resolvedLine : resolvedSecondary;
        ctx.lineWidth = r % 3 === 0 ? 1.35 : 0.9;

        for (let c = 0; c <= cols; c++) {
          const baseX = c * xGap;
          const n = pseudoNoise(baseX, baseY, tick + r * waveSpeedY * 14);
          let dx = Math.cos(n * Math.PI) * waveAmpX * 0.35;
          let dy = Math.sin(n * Math.PI) * waveAmpY;

          if (mouse.active) {
            const distX = baseX - mouse.x;
            const distY = baseY - mouse.y;
            const dist = Math.hypot(distX, distY);
            if (dist < 170) {
              const force = (1 - dist / 170) * 28;
              dy += Math.sin(dist * 0.05 - tick * 4) * force;
              dx += (distX / (dist + 1)) * force * 0.35;
            }
          }

          const px = baseX + dx;
          const py = baseY + dy;
          if (c === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [
    resolvedLine,
    resolvedSecondary,
    backgroundColor,
    waveSpeedX,
    waveSpeedY,
    waveAmpX,
    waveAmpY,
    xGap,
    yGap,
  ]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
