import React, { useEffect, useRef } from 'react';

/**
 * ReactBits-inspired ClickSpark: global radial spark burst on pointer clicks.
 */
export default function ClickSpark({
  sparkColor = '#14B8A6',
  sparkSize = 11,
  sparkRadius = 26,
  sparkCount = 9,
  duration = 420,
  children,
}) {
  const canvasRef = useRef(null);
  const sparksRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = (now) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      sparksRef.current = sparksRef.current.filter((spark) => {
        const elapsed = now - spark.startTime;
        if (elapsed >= duration) return false;

        const progress = elapsed / duration;
        const eased = 1 - Math.pow(1 - progress, 3);
        const dist = eased * sparkRadius;
        const len = sparkSize * (1 - eased);
        const x1 = spark.x + dist * Math.cos(spark.angle);
        const y1 = spark.y + dist * Math.sin(spark.angle);
        const x2 = spark.x + (dist + len) * Math.cos(spark.angle);
        const y2 = spark.y + (dist + len) * Math.sin(spark.angle);

        ctx.strokeStyle = spark.color;
        ctx.globalAlpha = 1 - progress;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        return true;
      });
      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [duration, sparkRadius, sparkSize]);

  const handleClick = (e) => {
    const now = performance.now();
    const palette = [sparkColor, '#6366F1', '#FB923C', '#5EEAD4'];
    const newSparks = Array.from({ length: sparkCount }, (_, i) => ({
      x: e.clientX,
      y: e.clientY,
      angle: (2 * Math.PI * i) / sparkCount + (Math.random() - 0.5) * 0.2,
      startTime: now,
      color: palette[i % palette.length],
    }));
    sparksRef.current.push(...newSparks);
  };

  return (
    <div onClick={handleClick} className="relative min-h-screen w-full">
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[9999]"
      />
      {children}
    </div>
  );
}
