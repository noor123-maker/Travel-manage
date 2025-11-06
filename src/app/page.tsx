'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/contexts/AuthContext';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import RouteTransition from '@/components/RouteTransition';

export default function Home() {
  const { t, loading } = useTranslation();
  const { user: authUser } = useAuth();
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(false);
  const [showAuthChooser, setShowAuthChooser] = useState(false);
  const [showRoute, setShowRoute] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white/80">Loading...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-blue-400/20 rounded-full blur-lg animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-purple-400/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-screen">
          {/* Left Content */}
          <motion.div
            className="text-center lg:text-left flex flex-col items-center lg:items-start justify-center h-full"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1
              className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {t('busTravelManager')}
            </motion.h1>
            
            <motion.p
              className="text-lg sm:text-xl text-white/80 mb-8 max-w-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {t('manageYourBusTravel')}
            </motion.p>
            
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start w-full max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="w-full sm:w-auto">
                <GlassButton
                  className="w-full sm:w-auto text-lg px-8 py-4"
                  onClick={() => {
                    if (authUser) {
                      router.push('/dashboard');
                    } else {
                      setShowAuthChooser(true);
                    }
                  }}
                >
                  {authUser?.company_name ? authUser.company_name : t('companyLogin')}
                </GlassButton>
              </div>
              <div className="w-full sm:w-auto">
                <GlassButton
                  variant="secondary"
                  className="w-full sm:w-auto text-lg px-8 py-4"
                  onClick={() => {
                    if (isAnimating) return;
                    setIsAnimating(true);
                    setShowRoute(true);
                  }}
                >
                  {t('browseTrips')}
                </GlassButton>
              </div>
            </motion.div>
          </motion.div>

          {/* Right 3D Scene */}
          <motion.div
            className="relative h-80 lg:h-[500px]"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <GlassCard className="h-full p-8 flex items-center justify-center">
              <div className="h-full w-full flex flex-col items-center justify-center text-center px-4">
                <h3 className="text-2xl font-semibold text-white mb-3">{t('yourDigitalTravelTicket')}</h3>
                <p className="text-white/80 max-w-md">{t('whatThisAppDescription')}</p>
              </div>
            </GlassCard>
          </motion.div>
        </div>
        {/* Route animation overlay when navigating to Browse */}
        {showRoute && (
          <RouteTransition
            duration={1.35}
            onComplete={() => {
              // navigate after animation completes
              setShowRoute(false);
              router.push('/browse');
            }}
          />
        )}

        {/* Company auth chooser modal */}
        {showAuthChooser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowAuthChooser(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative z-10 max-w-sm w-full p-6"
            >
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">{t('companyLogin')}</h3>
                <p className="text-white/70 mb-4">{t('chooseSigninOrSignup') || 'Sign in or create an account'}</p>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <GlassButton className="w-full" onClick={() => { setShowAuthChooser(false); router.push('/login?mode=signin'); }}>{t('signIn')}</GlassButton>
                  </div>
                  <div className="flex-1">
                    <GlassButton variant="secondary" className="w-full" onClick={() => { setShowAuthChooser(false); router.push('/login?mode=signup'); }}>{t('signup')}</GlassButton>
                  </div>
                </div>
                <div className="text-right mt-3">
                  <button className="text-sm text-white/60 hover:text-white" onClick={() => setShowAuthChooser(false)}>Close</button>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}

        {/* Features Section */}
        <motion.div
          className="mt-20 grid md:grid-cols-3 gap-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <GlassCard className="p-6 text-center">
            <div className="text-4xl mb-4">🚌</div>
            <h3 className="text-xl font-semibold text-white mb-2">{t('easyAndOrganizedTravel')}</h3>
          </GlassCard>
          
          <GlassCard className="p-6 text-center">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-white mb-2">{t('focusedOnYou')}</h3>
          </GlassCard>
          
          <GlassCard className="p-6 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-white mb-2">{t('stayInformedAboutYourTrip')}</h3>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
