"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
// avoid `useSearchParams` from next/navigation here because it requires a
// suspense boundary during SSR prerendering; instead read URL params on
// the client inside useEffect (prevents build-time prerender errors)
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/lib/supabaseClient";
import * as companyStorage from '@/lib/companyStorage';
import Navbar from "@/components/Navbar";
import GlassCard from "@/components/GlassCard";
import GlassButton from "@/components/GlassButton";

export default function LoginPage() {
  const { t, loading: translationsLoading } = useTranslation();
  const [rawNextState, setRawNextState] = useState<string | null>(null);

  const [isLogin, setIsLogin] = useState(true);
  // Allow opening the page directly in signup mode via ?mode=signup
  // and read an optional `next` redirect param. We read these from
  // window.location.search inside useEffect so nothing runs during SSR.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const m = params.get('mode');
      if (m === 'signup') setIsLogin(false);
      if (m === 'signin') setIsLogin(true);
      const nextParam = params.get('next');
      if (nextParam) setRawNextState(nextParam);
    } catch (e) {
      // ignore
    }
    // only want to run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [signupCode, setSignupCode] = useState("");
  const [allowedTrips, setAllowedTrips] = useState<number | ''>(3);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  // Safe next param handling: only allow same-origin path or relative values
  // use the client-derived next param when available
  const rawNext = (rawNextState || "/dashboard") as string;
  const safeNext = (() => {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost";
      const u = new URL(rawNext, origin);
      if (u.origin === origin) return u.pathname + u.search + u.hash;
    } catch (e) {
      // invalid -> fallback
    }
    return "/dashboard";
  })();

  const handleAuth = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      if (isLogin) {
        if (!email || !password) throw new Error(t("enterEmailPassword") || "Please enter email and password");

        if (supabase) {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw new Error(error.message || "Signin failed");
          // immediately navigate to the desired page
          window.location.replace(safeNext);
          return;
        }

        // Fallback to custom API
        const res = await fetch("/api/auth/signin", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const txt = await res.text();
        let data: any = null;
        try {
          data = txt ? JSON.parse(txt) : null;
        } catch {
          /* ignore parse errors */
        }
        if (!res.ok) throw new Error(data?.error || txt || "Signin failed");
        setMessage(t("loginSuccess") || "Login successful! Redirecting...");
        setTimeout(() => window.location.assign(safeNext), 150);
      } else {
        // Signup flow (signup code required)
        if (!companyName || !contactNumber || !email || !password || !signupCode) {
          throw new Error(t("fillAllFields") || "Please fill in all required fields");
        }

        const PUBLIC_SIGNUP = process.env.NEXT_PUBLIC_SIGNUP_CODE ?? "Noru007";
        if (signupCode !== PUBLIC_SIGNUP) throw new Error(t("invalidSignupCode") || "Invalid signup code");

        if (supabase) {
          const { error: signupError } = await supabase.auth.signUp({ email, password });
          if (signupError) throw new Error(signupError.message || "Signup failed");

          // Try to sign the user in immediately so they don't have to re-enter credentials
          const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (signInError) {
            // Signup succeeded but signin failed (rare). Show success and switch to login view.
            setMessage(t("signupSuccess") || "Account created successfully. Please sign in.");
            setIsLogin(true);
            return;
          }

          // Signed in successfully, redirect immediately
          window.location.replace(safeNext);
          return;
        }

        const res = await fetch("/api/auth/signup", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            signupCode,
            company_name: companyName,
            contact_number: contactNumber,
            allowed_trips: typeof allowedTrips === 'number' ? allowedTrips : null,
          }),
        });
        const txt = await res.text();
        let data: any = null;
        try {
          data = txt ? JSON.parse(txt) : null;
        } catch {
          /* ignore */
        }
        if (!res.ok) throw new Error(data?.error || txt || "Signup failed");

        // If we're in demo mode (no supabase), create a local demo company record so
        // the new account has a currentCompany set and their trips won't be mixed
        // with any pre-existing sample data.
        try {
          if (!supabase && typeof window !== 'undefined') {
            try {
              const created = companyStorage.createCompany({
                name: companyName || email,
                email,
                contact_number: contactNumber || '',
                password: '',
                allowed_trips: typeof allowedTrips === 'number' ? allowedTrips : null,
              });
              sessionStorage.setItem('currentCompany', JSON.stringify(created));
            } catch (e) {
              // ignore create errors (e.g., email already exists in demo storage)
            }
          }
        } catch (e) {
          // ignore
        }
        // After creating the user via our API, immediately sign them in so cookie/session is set
        const signinRes = await fetch("/api/auth/signin", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const signinTxt = await signinRes.text();
        let signinData: any = null;
        try {
          signinData = signinTxt ? JSON.parse(signinTxt) : null;
        } catch {}
        if (!signinRes.ok) {
          // Signup succeeded but signin failed; inform user to sign in manually
          setMessage(t("signupSuccess") || "Account created successfully. You can now sign in.");
          setIsLogin(true);
          // clear form fields
          setCompanyName("");
          setContactNumber("");
          setEmail("");
          setPassword("");
          setSignupCode("");
          return;
        }

  // Signed in via API: redirect immediately
  window.location.replace(safeNext);
      }
    } catch (err: any) {
      setMessage(err?.message || String(err));
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    const userEmail = prompt(t("enterEmailForReset") || "Please enter your email for password reset");
    if (!userEmail) return;
    setLoading(true);
    try {
      const r = await fetch("/api/auth/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: userEmail }) });
      const txt = await r.text();
      let d: any = null;
      try {
        d = txt ? JSON.parse(txt) : null;
      } catch {}
      if (!r.ok) throw new Error(d?.error || txt || "Failed");
      alert(t("resetEmailSent") || "If that email exists we sent a reset link.");
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  if (translationsLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <motion.div className="text-center" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white/80">Loading...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg relative overflow-hidden">
      <Navbar />

      <div className="flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div className="max-w-md w-full" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <GlassCard className="p-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
              <h2 className="text-center text-3xl font-bold text-white mb-2">{isLogin ? t("companyLogin") : t("companySignup")}</h2>
              <p className="text-center text-white/70 mb-6">
                {isLogin ? t("dontHaveAccount") : t("alreadyHaveAccount")}
                <button onClick={() => setIsLogin(!isLogin)} className="font-medium text-blue-300 hover:text-blue-200 ml-1">
                  {isLogin ? t("signup") : t("signIn")}
                </button>
              </p>
            </motion.div>

            <motion.form className="space-y-6" onSubmit={(e) => handleAuth(e)} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}>
              <div className="space-y-4">
                {!isLogin && (
                  <>
                    <div>
                      <label htmlFor="companyName" className="block text-sm font-medium text-white/80 mb-2">{t("companyName")}</label>
                      <input id="companyName" name="companyName" type="text" required className="w-full px-4 py-3 rounded-lg backdrop-blur-md bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder={t("enterCompanyName")} value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                    </div>
                    <div>
                      <label htmlFor="contactNumber" className="block text-sm font-medium text-white/80 mb-2">{t("contactNumber")}</label>
                      <input id="contactNumber" name="contactNumber" type="tel" required className="w-full px-4 py-3 rounded-lg backdrop-blur-md bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder={t("enterContactNumber")} value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
                    </div>
                    <div>
                      <label htmlFor="signupCode" className="block text-sm font-medium text-white/80 mb-2">Signup Code</label>
                      <input id="signupCode" name="signupCode" type="text" required className="w-full px-4 py-3 rounded-lg backdrop-blur-md bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter signup code" value={signupCode} onChange={(e) => setSignupCode(e.target.value)} />
                    </div>
                    <div>
                      <label htmlFor="allowedTrips" className="block text-sm font-medium text-white/80 mb-2">{t('allowedTripsLabel') || 'How many trips allowed'}</label>
                      <input id="allowedTrips" name="allowedTrips" type="number" min={1} placeholder="3" className="w-full px-4 py-3 rounded-lg backdrop-blur-md bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={allowedTrips as any} onChange={(e) => setAllowedTrips(e.target.value === '' ? '' : Number(e.target.value))} />
                      <p className="text-xs text-white/60 mt-1">{t('allowedTripsHelp') || 'Leave empty for unlimited'}</p>
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">{t("email")}</label>
                  <input id="email" name="email" type="email" autoComplete="email" required className="w-full px-4 py-3 rounded-lg backdrop-blur-md bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder={t("email")} value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">{t("password")}</label>
                  <input id="password" name="password" type="password" autoComplete="current-password" required className="w-full px-4 py-3 rounded-lg backdrop-blur-md bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder={t("password")} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </div>

              {message && (
                <motion.div className={`p-3 rounded-lg text-sm ${isError ? "bg-red-500/20 text-red-200 border border-red-500/30" : "bg-green-500/20 text-green-200 border border-green-500/30"}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>{message}</motion.div>
              )}

              <GlassButton type="submit" disabled={loading} className="w-full text-lg py-4">{loading ? t("loading") : (isLogin ? t("signIn") : t("signup"))}</GlassButton>

              <div className="text-center">
                <div className="flex justify-between items-center">
                  <Link href="/" className="text-white/70 hover:text-white transition-colors">{t("backToHome")}</Link>
                  <button type="button" onClick={handleForgot} className="text-sm text-white/70 hover:text-white">{t("forgotPassword") || "Forgot password?"}</button>
                </div>
              </div>
            </motion.form>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
