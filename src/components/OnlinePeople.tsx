"use client";

import { useEffect, useState } from 'react';

export default function OnlinePeople({ min = 1000 }: { min?: number }) {
  const [count, setCount] = useState<number>(() => {
    // start with a random number >= min
    return Math.floor(min + Math.random() * 800);
  });

  useEffect(() => {
    let mounted = true;

    const tick = () => {
      setCount(prev => {
        // random walk: change by -20..+40 (smaller fluctuations for smaller base)
        const delta = Math.floor(Math.random() * 61) - 20; // -20..+40
        let next = prev + delta;
        if (next < min) next = min + Math.floor(Math.random() * 20);
        return next;
      });
    };

    // every 1.5 - 4 seconds change
    const schedule = () => {
      const timeout = 1500 + Math.random() * 2500;
      return window.setTimeout(() => {
        if (!mounted) return;
        tick();
        schedule();
      }, timeout);
    };

    const t = schedule();

    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [min]);

    return (
    <div className="inline-flex items-center space-x-2 px-2 py-0.5 rounded-full bg-white/8 dark:bg-black/10 border border-white/10 text-white text-xs">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-90">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" fill="currentColor" />
        <path d="M4 20c0-2.21 3.58-4 8-4s8 1.79 8 4v1H4v-1z" fill="currentColor" opacity="0.9" />
      </svg>
      <span className="font-semibold">{count.toLocaleString()}</span>
      <span className="text-[10px] text-white/70">online</span>
    </div>
  );
}
