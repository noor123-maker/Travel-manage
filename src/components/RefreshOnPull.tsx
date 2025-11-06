"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Lightweight pull-to-refresh / refresh-on-scroll-up helper.
 *
 * Behavior:
 * - For desktop: when at top of page (scrollY === 0) and a wheel event with
 *   deltaY < -50 occurs (fast upward scroll), trigger router.refresh().
 * - For touch devices: when touch starts at the top and the user pulls down
 *   more than `threshold` pixels, trigger router.refresh().
 *
 * This component is intentionally minimal and unobtrusive. It debounces
 * refreshes to avoid repeated triggers.
 */
export default function RefreshOnPull({ threshold = 60, cooldownMs = 2000 }: { threshold?: number; cooldownMs?: number }) {
  const router = useRouter();
  const lastTriggered = useRef<number>(0);
  const touchStartY = useRef<number | null>(null);
  const [pulling, setPulling] = useState(false);

  useEffect(() => {
    const now = () => Date.now();

    const tryTrigger = () => {
      const t = now();
      if (t - lastTriggered.current < cooldownMs) return;
      lastTriggered.current = t;
      try {
        router.refresh();
      } catch (e) {
        // fallback to full reload if refresh fails
        window.location.reload();
      }
    };

    const onWheel = (e: WheelEvent) => {
      // upward wheel at top
      if (window.scrollY <= 0 && e.deltaY < -50) {
        tryTrigger();
      }
    };

    let touchHandled = false;

    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY <= 0) {
        touchStartY.current = e.touches[0]?.clientY ?? null;
        touchHandled = true;
      } else {
        touchStartY.current = null;
        touchHandled = false;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touchHandled || touchStartY.current == null) return;
      const currentY = e.touches[0]?.clientY ?? 0;
      const delta = currentY - touchStartY.current;
      // positive delta = pulling down
      if (delta > 0) setPulling(true);
      if (delta > threshold) {
        setPulling(false);
        touchStartY.current = null;
        tryTrigger();
      }
    };

    const onTouchEnd = () => {
      touchStartY.current = null;
      setPulling(false);
    };

    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [router, threshold, cooldownMs]);

  // Simple visual indicator (subtle) when user is pulling on touch devices
  if (!pulling) return null;
  return (
    <div aria-hidden className="fixed top-16 left-0 right-0 flex justify-center pointer-events-none">
      <div className="px-3 py-1 bg-white/10 text-white rounded-md text-sm shadow">Pull to refresh</div>
    </div>
  );
}
