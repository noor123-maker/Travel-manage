"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface AuthContextValue {
  user: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      if (supabase) {
        const res = await supabase.auth.getUser();
        const u = res?.data?.user ?? null;
        setUser(u);
      } else {
        const r = await fetch('/api/auth/me', { credentials: 'include' });
        const txt = await r.text();
        let data: any = null;
        try { data = txt ? JSON.parse(txt) : null; } catch {}
        setUser(data?.user ?? null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      await refresh();

      // subscribe to supabase auth state changes when available
      if (supabase && (supabase as any).auth && (supabase as any).auth.onAuthStateChange) {
        const { data } = (supabase as any).auth.onAuthStateChange((_event: any, session: any) => {
          if (!mounted) return;
          const u = session?.user ?? null;
          setUser(u);
        });
        return () => {
          mounted = false;
          try { data?.subscription?.unsubscribe?.(); } catch {}
        };
      }

      return () => { mounted = false; };
    })();
  }, []);

  const signOut = async () => {
    try {
      if (supabase && (supabase as any).auth) {
        await supabase.auth.signOut();
      } else {
        await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' });
      }
    } catch (e) {
      // ignore
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
