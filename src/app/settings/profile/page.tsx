"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import SettingsHeader from '@/components/SettingsHeader';

export default function SettingsProfile() {
  const router = useRouter();
  const { user: authUser, loading, refresh } = useAuth();

  const [companyName, setCompanyName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!loading && !authUser) {
      router.replace('/login?mode=signin');
      return;
    }
    if (authUser) {
      setCompanyName((authUser as any).company_name ?? (authUser as any).user_metadata?.company_name ?? '');
    }
  }, [authUser, loading, router]);

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setMessage(null);
    setIsError(false);
    setSaving(true);
    try {
      if (supabase) {
        const opts: any = { data: { company_name: companyName } };
        const { error } = await (supabase as any).auth.updateUser(opts);
        if (error) throw new Error(error.message || 'Failed to update');
      } else {
        const body: any = { company_name: companyName };
        const res = await fetch('/api/auth/update', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const txt = await res.text();
        let data: any = null;
        try { data = txt ? JSON.parse(txt) : null; } catch {}
        if (!res.ok) throw new Error(data?.error || txt || 'Failed to update');
      }

      try { await refresh(); } catch {}
      setMessage('Changes saved');
      setIsError(false);
      // redirect to dashboard after save
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
        <SettingsHeader />
        <h2 className="text-2xl font-bold text-white mb-4">Company Name</h2>
        <GlassCard className="p-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm text-white/80 mb-1">Company Name</label>
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-white" />
            </div>

            {/* Allowed trips moved to its own settings page */}

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
