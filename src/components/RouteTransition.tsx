"use client";

import { motion } from 'framer-motion';
import { useEffect } from 'react';

interface RouteTransitionProps {
  duration?: number; // seconds
  onComplete?: () => void;
}

export default function RouteTransition({ duration = 1.3, onComplete }: RouteTransitionProps) {
  // call onComplete after animation finishes (safety fallback)
  useEffect(() => {
    const t = window.setTimeout(() => onComplete?.(), Math.ceil(duration * 1000) + 150);
    return () => clearTimeout(t);
  }, [duration, onComplete]);

  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { pathLength: 1, opacity: 1 },
  };

  const dotVariants = {
    hidden: { translateX: '-6%' },
    visible: { translateX: '106%' },
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* translucent background to match theme */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.08 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="absolute inset-0 bg-gradient-to-br from-indigo-700 to-purple-600"
        style={{ pointerEvents: 'auto' }}
      />

      <div className="relative w-full max-w-full px-4 pointer-events-none">
        {/* responsive svg: wide line across screen */}
        <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="w-full h-12 sm:h-20">
          <defs>
            <linearGradient id="routeGradient" x1="0%" x2="100%">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="1" />
              <stop offset="100%" stopColor="var(--accent-2)" stopOpacity="1" />
            </linearGradient>
          </defs>

          <motion.path
            d="M2 6 C 30 0, 70 10, 98 4"
            stroke="url(#routeGradient)"
            strokeWidth={0.8}
            strokeLinecap="round"
            strokeDasharray="2 2"
            fill="none"
            variants={pathVariants}
            initial="hidden"
            animate="visible"
            transition={{ duration, ease: 'easeInOut' }}
            onAnimationComplete={() => onComplete?.()}
          />

          {/* moving dot */}
          <motion.circle
            cx="0"
            cy="5"
            r="1"
            fill="white"
            style={{ transformOrigin: 'center' }}
            initial="hidden"
            animate="visible"
            variants={dotVariants}
            transition={{ duration, ease: 'easeInOut' }}
          />
        </svg>

        {/* small caption or nothing */}
      </div>
    </div>
  );
}
