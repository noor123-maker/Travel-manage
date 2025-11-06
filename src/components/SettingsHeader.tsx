"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsHeader() {
  const router = useRouter();

  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="max-w-3xl mx-auto mb-4 flex items-center gap-3">
      <button
        onClick={goBack}
        className="px-3 py-1 bg-white/5 rounded text-white flex items-center gap-2"
        aria-label="Go back"
      >
        ← Back
      </button>

      <button
        onClick={() => router.push('/dashboard')}
        className="px-3 py-1 bg-white/5 rounded text-white flex items-center gap-2"
        aria-label="Go home"
      >
        Home
      </button>
    </div>
  );
}
