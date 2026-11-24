import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, SkipForward } from 'lucide-react';
import { DecryptedText, GradientText } from './reactbits';

export default function BootPreloader({ onComplete }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 1450;
    let raf = 0;

    const tick = (now) => {
      const pct = Math.min(100, ((now - start) / duration) * 100);
      setProgress(pct);
      if (pct < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        setTimeout(() => onComplete(), 120);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onComplete]);

  const bars = [0.4, 0.85, 1, 0.65, 0.95, 0.55, 0.9, 0.7, 0.45];

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03, filter: 'blur(8px)' }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#060D16] px-6"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 42%, rgba(20,184,166,0.16), transparent 50%), radial-gradient(circle at 60% 60%, rgba(99,102,241,0.14), transparent 45%)',
        }}
      />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
        {/* Acoustic Soundwave Pulse Emblem */}
        <div className="mb-7 flex h-24 w-24 items-center justify-center rounded-3xl border border-teal-400/30 bg-[#0B1626]/90 shadow-[0_0_50px_rgba(20,184,166,0.22)]">
          <div className="flex h-12 items-center gap-1.5">
            {bars.map((h, i) => (
              <span
                key={i}
                className="w-1.5 rounded-full bg-gradient-to-t from-teal-400 via-indigo-400 to-orange-400"
                style={{
                  height: `${Math.round(h * 42)}px`,
                  animation: `eq-bar ${0.65 + (i % 4) * 0.16}s ease-in-out ${i * 0.08}s infinite`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="mb-2 flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-[11px] font-mono uppercase tracking-[0.2em] text-teal-300">
          <Sparkles className="h-3 w-3" />
          <DecryptedText text="INITIALIZING NLP ENGINE" speed={24} />
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          <GradientText>MentorSync AI</GradientText>
        </h1>
        <p className="mt-1.5 text-xs font-mono tracking-wider text-slate-400">
          <DecryptedText text="TEXTRANK · TF-IDF · JWT ACADEMIC VAULT" speed={22} />
        </p>

        {/* Progress Bar */}
        <div className="mt-8 w-full overflow-hidden rounded-full border border-slate-800 bg-slate-900/90 p-0.5">
          <div
            className="h-1.5 rounded-full bg-gradient-to-r from-teal-400 via-indigo-500 to-orange-400 transition-[width] duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2.5 flex w-full items-center justify-between text-[11px] font-mono text-slate-400">
          <span>CALIBRATING CONVERSATION GRAPH</span>
          <span className="text-teal-300">{Math.round(progress)}%</span>
        </div>

        <button
          type="button"
          onClick={onComplete}
          className="mt-8 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-700/70 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:border-teal-500/40 hover:text-teal-200"
        >
          <SkipForward className="h-3.5 w-3.5" />
          Skip Intro
        </button>
      </div>
    </motion.div>
  );
}
