'use client';

import Link from 'next/link';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';

export default function ContactPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center py-12">
      <motion.div className="w-full max-w-2xl p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <GlassCard className="p-8">
          <h1 className="text-2xl font-bold text-white mb-2">{t('contact')}</h1>
          <p className="text-white/80 mb-6">{t('contactIntro')}</p>

          <div className="bg-white/5 dark:bg-black/5 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-white">{t('contactName')}</p>
                <p className="text-sm text-white/80">{t('contactLabel')}: {t('contactPhone')}</p>
              </div>
              <div className="text-right">
                <a href="tel:0703783076" className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-md shadow">{t('callNow')}</a>
              </div>
            </div>
            <p className="mt-3 text-white/70 text-sm">{t('contactDescription')}</p>
          </div>

          <div className="flex items-center space-x-3">
            <Link href="/">
              <GlassButton className="px-6 py-2">{t('backToHome') || 'Back to Home'}</GlassButton>
            </Link>
            <a href="tel:0703783076">
              <GlassButton className="px-6 py-2" variant="secondary">{t('callNow') || 'Call Admin'}</GlassButton>
            </a>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
