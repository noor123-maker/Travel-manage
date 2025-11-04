"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import GlassCard from '@/components/GlassCard';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

export default function SettingsIndex() {
  const router = useRouter();
  const { user: authUser, loading } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading && !authUser) {
      router.replace('/login?mode=signin');
    }
  }, [authUser, loading, router]);

  // Redirect to /settings/profile as the default settings subpage
  // NOTE: removed automatic redirect so clicking "Settings" shows the section chooser
  // Users can choose which settings section to open (profile/contact/password).

  return (
    <div className="min-h-screen gradient-bg py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.h1 initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-white mb-6">Settings</motion.h1>

          <GlassCard className="p-6">
          <p className="text-white/80 mb-4">{t('chooseSettingsSection') || 'Choose a section to edit:'}</p>
          <div className="flex gap-3 flex-wrap">
            <Link href="/settings/profile" className="px-4 py-2 bg-white/5 rounded text-white">{t('companyName') || 'Company Name'}</Link>
            <Link href="/settings/contact" className="px-4 py-2 bg-white/5 rounded text-white">{t('contactNumber') || 'Contact Number'}</Link>
            <Link href="/settings/password" className="px-4 py-2 bg-white/5 rounded text-white">{t('changePassword') || 'Change Password'}</Link>
            <Link href="/settings/allowed-trips" className="px-4 py-2 bg-white/5 rounded text-white">{t('allowedTripsSection') || 'Allowed Trips'}</Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
