'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const token = params?.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) setMessage('No token provided');
  }, [token]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return setMessage('Missing token');
    if (!password || password.length < 6) return setMessage('Password must be at least 6 characters');
    if (password !== confirm) return setMessage('Passwords do not match');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, newPassword: password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      setMessage('Password reset successful. You can now sign in.');
      setPassword('');
      setConfirm('');
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
      <GlassCard className="max-w-md w-full p-8">
        <h2 className="text-2xl font-bold mb-4">Reset password</h2>
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">New password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 rounded border" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Confirm password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full px-3 py-2 rounded border" />
          </div>
          {message && <div className="text-sm text-red-600">{message}</div>}
          <GlassButton type="submit" disabled={loading} className="w-full">{loading ? 'Saving...' : 'Save new password'}</GlassButton>
        </form>
      </GlassCard>
    </div>
  );
}
