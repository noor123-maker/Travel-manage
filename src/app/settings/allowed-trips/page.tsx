"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import { useTranslation } from '@/hooks/useTranslation';

export default function AllowedTripsPage() {
  const router = useRouter();
  const { user: authUser, loading, refresh } = useAuth();
  const { t } = useTranslation();

  const [allowedTrips, setAllowedTrips] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!loading && !authUser) {
      router.replace('/login?mode=signin');
      return;
    }
    if (authUser) {
      const at = (authUser as any).allowed_trips ?? (authUser as any).user_metadata?.allowed_trips ?? null;
      setAllowedTrips(typeof at === 'number' ? at : '');
    }
  }, [authUser, loading, router]);

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setMessage(null);
    setIsError(false);
    setSaving(true);
    try {
      // Require signup code prompt for changing allowed trips
      const code = typeof window !== 'undefined' ? window.prompt(t('enterSignupCode') || 'Enter signup code to confirm allowed trips change') : null;
      if (!code) throw new Error(t('signupCodeRequired') || 'Signup code required to change allowed trips');

      if (supabase) {
        // Attempt to update user metadata in Supabase (if used)
        const opts: any = { data: { allowed_trips: typeof allowedTrips === 'number' ? allowedTrips : null } };
        const { error } = await (supabase as any).auth.updateUser(opts);
        if (error) throw new Error(error.message || 'Failed to update');
      } else {
        const body: any = { allowed_trips: typeof allowedTrips === 'number' ? allowedTrips : null, signup_code: code };
        const res = await fetch('/api/auth/update', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const txt = await res.text();
        let data: any = null;
        try { data = txt ? JSON.parse(txt) : null; } catch {}
        if (!res.ok) throw new Error(data?.error || txt || 'Failed to update');
      }

      try { await refresh(); } catch {}
      setMessage(t('changesSaved') || 'Changes saved');
      setIsError(false);
      router.replace('/settings');
    } catch (err: any) {
      setMessage(err?.message || String(err));
      setIsError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-4">{t('allowedTripsSection') || 'Allowed Trips'}</h2>
        <GlassCard className="p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm text-white/80 mb-1">{t('allowedTripsLabel') || 'Allowed Trips'}</label>
              <input type="number" min={1} value={allowedTrips as any} onChange={(e) => setAllowedTrips(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Leave empty for unlimited" className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-white" />
              <p className="text-xs text-white/60 mt-1">{t('allowedTripsHelp') || 'Leave empty for unlimited'}</p>
            </div>

            {message && <div className={`p-3 rounded ${isError ? 'bg-red-500/20 text-red-200' : 'bg-green-500/20 text-green-200'}`}>{message}</div>}

            <div className="flex justify-end">
              <GlassButton type="submit" disabled={saving}>{saving ? (t('saving') || 'Saving...') : (t('saveChanges') || 'Save Changes')}</GlassButton>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
