"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AndroidBackButtonHandler() {
  const router = useRouter();

  useEffect(() => {
    let handle: any = null;

    // Try multiple strategies to attach an Android back button handler.
    // 1) Dynamic import of @capacitor/app (preferred)
    // 2) Fallback to global Capacitor runtime (Capacitor.Plugins.App or Capacitor.App)
    // 3) Fallback to Cordova-style 'backbutton' event
    (async () => {
      const handler = () => {
        try {
          if (window.history.length > 1) {
            router.back();
          } else {
            router.push('/');
          }
        } catch (err) {
          router.push('/');
        }
      };

      // 1) Try dynamic import
      try {
        // @ts-ignore
        const mod = await import('@capacitor/app');
        const CapacitorApp = (mod as any).App;
        if (CapacitorApp && typeof CapacitorApp.addListener === 'function') {
          handle = CapacitorApp.addListener('backButton', handler);
          return;
        }
      } catch (e) {
        // import failed, continue to fallbacks
      }

      // 2) Try global Capacitor runtime (when module import isn't available)
      try {
        const g: any = window as any;
        const maybeApp = g.Capacitor?.App || g.Capacitor?.Plugins?.App || g.App;
        if (maybeApp && typeof maybeApp.addListener === 'function') {
          handle = maybeApp.addListener('backButton', handler);
          return;
        }
      } catch (e) {
        // continue
      }

      // 3) Cordova-style fallback
      try {
        const cb = () => handler();
        window.addEventListener('backbutton', cb as EventListener);
        handle = {
          remove: () => window.removeEventListener('backbutton', cb as EventListener),
        } as any;
        return;
      } catch (e) {
        // nothing else we can do
      }
    })();

    return () => {
      try {
        handle?.remove?.();
      } catch (e) {
        // ignore cleanup errors
      }
    };
  }, [router]);

  return null;
}
