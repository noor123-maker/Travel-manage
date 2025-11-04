"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';

export default function SettingsContact() {
  const router = useRouter();
  const { user: authUser, loading, refresh } = useAuth();

  const [contactNumber, setContactNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!loading && !authUser) {
      router.replace('/login?mode=signin');
      return;
    }
    if (authUser) {
      setContactNumber((authUser as any).contact_number ?? (authUser as any).user_metadata?.contact_number ?? '');
    }
  }, [authUser, loading, router]);

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setMessage(null);
    setIsError(false);
    setSaving(true);
    try {
      if (supabase) {
        const opts: any = { data: { contact_number: contactNumber } };
        const { error } = await (supabase as any).auth.updateUser(opts);
        if (error) throw new Error(error.message || 'Failed to update');
      } else {
        const res = await fetch('/api/auth/update', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contact_number: contactNumber }) });
        const txt = await res.text();
        let data: any = null;
        try { data = txt ? JSON.parse(txt) : null; } catch {}
        if (!res.ok) throw new Error(data?.error || txt || 'Failed to update');
      }

      try { await refresh(); } catch {}
      setMessage('Changes saved');
      setIsError(false);
      router.replace('/dashboard');
    } catch (err: any) {
      setMessage(err?.message || String(err));
      setIsError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-4">Contact Number</h2>
        <GlassCard className="p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm text-white/80 mb-1">Contact Number</label>
              <input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-white" />
            </div>

            {message && <div className={`p-3 rounded ${isError ? 'bg-red-500/20 text-red-200' : 'bg-green-500/20 text-green-200'}`}>{message}</div>}

            <div className="flex justify-end">
              <GlassButton type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</GlassButton>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
