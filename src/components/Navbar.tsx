'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import GlassButton from './GlassButton';
import OnlinePeople from './OnlinePeople';

interface NavbarProps {
  user?: any;
  onSignOut?: () => void;
}

export default function Navbar({ user, onSignOut }: NavbarProps) {
  const router = useRouter();
  // Use centralized AuthContext for reactive auth state
  const { user: authUser, loading: authLoading, signOut } = useAuth();
  // Theme is forced to dark-only (no toggle) by ThemeProvider
  const { language, setLanguage } = useLanguage();
  const { t, loading: translationsLoading } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 300 });
  const [afTheme, setAfTheme] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('afTheme') === '1';
  });
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const languageBtnRef = useRef<HTMLButtonElement>(null);
  const [languagePos, setLanguagePos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 180 });
  const languagePortalRef = useRef<HTMLDivElement>(null);

  const languageOptions = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ps', name: 'پښتو', flag: '🇦🇫' },
    { code: 'fa', name: 'دری', flag: '🇦🇫' },
  ];
  const isRtl = language === 'fa' || language === 'ps';

  // Handle clicking outside the language dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If click inside the language button wrapper or the language portal, keep open
      const target = event.target as Node;
      if (languageDropdownRef.current && languageDropdownRef.current.contains(target)) {
        return;
      }
      if (languagePortalRef.current && languagePortalRef.current.contains(target)) {
        return;
      }
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(target)) {
        setIsLanguageDropdownOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isLanguageDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLanguageDropdownOpen]);

  // Update popup position so it sits directly under the hamburger button
  useEffect(() => {
    const updatePos = () => {
      const btn = menuRef.current?.querySelector('button');
      if (!btn) return;
      const rect = (btn as HTMLElement).getBoundingClientRect();
      const padding = 8;
      const desiredWidth = Math.min(320, window.innerWidth - 24);
      // place popup so its right edge aligns with button right edge when possible
      let left = rect.right - desiredWidth;
      if (left < 8) left = 8;
      if (left + desiredWidth > window.innerWidth - 8) left = window.innerWidth - desiredWidth - 8;
      setMenuPos({ top: rect.bottom + padding + window.scrollY, left: left + window.scrollX, width: desiredWidth });
    };

    if (isMenuOpen) {
      updatePos();
      window.addEventListener('resize', updatePos);
      window.addEventListener('scroll', updatePos, true);
    }

    return () => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    // apply af-theme class if enabled
    if (typeof window !== 'undefined') {
      if (afTheme) {
        document.documentElement.classList.add('af-theme');
        localStorage.setItem('afTheme', '1');
      } else {
        document.documentElement.classList.remove('af-theme');
        localStorage.removeItem('afTheme');
      }
    }
  }, [afTheme]);

  const handleLanguageSelect = (langCode: string) => {
    console.log('Language selected:', langCode);
    setLanguage(langCode as any);
    setIsLanguageDropdownOpen(false);
  };

  const toggleLanguageDropdown = () => {
    console.log('Toggle dropdown clicked, current state:', isLanguageDropdownOpen);
    // when opening language dropdown, ensure menu is closed
    setIsMenuOpen(false);
    setIsLanguageDropdownOpen(!isLanguageDropdownOpen);
  };

  // Position language dropdown under the language button
  useEffect(() => {
    const updatePos = () => {
      const btn = languageBtnRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const padding = 6;
      const desiredWidth = Math.min(260, window.innerWidth - 24);
      let left = rect.left + window.scrollX;
      // ensure dropdown doesn't overflow right
      if (left + desiredWidth > window.innerWidth - 8) left = window.innerWidth - desiredWidth - 8;
      if (left < 8) left = 8;
      setLanguagePos({ top: rect.bottom + padding + window.scrollY, left, width: desiredWidth });
    };

    if (isLanguageDropdownOpen) {
      updatePos();
      window.addEventListener('resize', updatePos);
      window.addEventListener('scroll', updatePos, true);
    }

    return () => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
    };
  }, [isLanguageDropdownOpen]);

  if (translationsLoading) {
    return (
      <nav className="backdrop-blur-md bg-white/10 dark:bg-black/10 border-b border-white/20 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="animate-pulse bg-white/20 h-6 w-48 rounded"></div>
            <div className="flex space-x-4">
              <div className="animate-pulse bg-white/20 h-8 w-8 rounded"></div>
              <div className="animate-pulse bg-white/20 h-8 w-8 rounded"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 backdrop-blur-md bg-gradient-to-r from-white/6 via-white/4 to-white/3 dark:from-black/12 dark:via-black/10 dark:to-black/8 border-b border-white/10 dark:border-white/12 shadow-xl"
      style={{ zIndex: 9999 }}
      initial={{ y: -18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.36, ease: 'circOut' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <motion.div className="flex items-center" whileHover={{ scale: 1.02 }}>
            <Link href="/" className="flex items-center gap-3 text-white no-underline">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-gradient-to-br from-purple-500 to-blue-400 text-white shadow-md">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M3 12v4a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-1h6v1a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7 8V5a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="7.5" cy="17.5" r="1.25" fill="currentColor" />
                  <circle cx="16.5" cy="17.5" r="1.25" fill="currentColor" />
                </svg>
              </span>
              <span className="text-lg sm:text-xl md:text-2xl font-bold leading-tight">{t('busTravelManager')}</span>
            </Link>
          </motion.div>

          <div className="flex items-center space-x-4">
            {/* Hamburger / three-lines menu (improved style) */}
            <div className="relative z-50" ref={menuRef}>
              <button
                onClick={() => {
                  setIsMenuOpen(prev => {
                    const next = !prev;
                    if (next) setIsLanguageDropdownOpen(false);
                    return next;
                  });
                }}
                aria-label="Open menu"
                className="flex items-center justify-center w-10 h-10 rounded-md bg-white/6 dark:bg-black/12 border border-white/12 text-white hover:scale-105 transition-transform shadow-lg ring-0 focus:ring-2 focus:ring-blue-400/30"
                title="Menu"
              >
                {/* Professional hamburger icon (SVG) */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                  <rect x="3" y="6" width="18" height="2" rx="1" fill="currentColor" />
                  <rect x="3" y="11" width="18" height="2" rx="1" fill="currentColor" opacity="0.9" />
                  <rect x="3" y="16" width="18" height="2" rx="1" fill="currentColor" opacity="0.7" />
                </svg>
              </button>

              {typeof document !== 'undefined' ? createPortal(
                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div
                      dir={isRtl ? 'rtl' : 'ltr'}
                          initial={{ opacity: 0, y: -8, scale: 0.99 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.99 }}
                          transition={{ duration: 0.18 }}
                            style={{ position: 'absolute', top: menuPos.top, left: menuPos.left, width: menuPos.width, zIndex: 99999 }}
                            className={`rounded-xl p-2 backdrop-blur-lg bg-gradient-to-r from-purple-600/8 via-indigo-500/6 to-blue-400/8 border border-white/10 shadow-lg`}
                        >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <span className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-500 to-blue-400 inline-block" aria-hidden="true" />
                            <h4 className="text-lg font-semibold text-white">{t('supportContact') || 'Support & Contact'}</h4>
                          </div>
                          <p className="text-sm text-white/80 mt-1">{t('contactIntro') || 'Get help or contact the app admin'}</p>
                        </div>
                        <button onClick={() => setIsMenuOpen(false)} className="text-white/80">✕</button>
                      </div>
                      <div className="mt-3 border-t border-white/6" />

                      <div className="mt-3 pt-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-white">Ehsas</p>
                            <p className="text-xs text-white/70">App administrator</p>
                          </div>
                          <a href="tel:0703783076" className="ml-4 inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm shadow-sm hover:brightness-95">{t('callNow') || 'Call'}</a>
                        </div>

                        <div className="mt-3">
                          <a href="/contact" className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors text-white/90 hover:bg-white/5">{t('contact')}</a>
                        </div>
                      </div>

                      {/* Auth navigation moved into this menu */}
                      <div className="mt-4 pt-3 border-t border-white/10">
                        {authUser ? (
                          <div className="flex flex-col gap-2">
                            <Link href="/dashboard" onClick={() => setIsMenuOpen(false)} className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors text-white/90 hover:bg-white/5">{t('dashboard') || 'Dashboard'}</Link>
                            <Link href="/settings" onClick={() => setIsMenuOpen(false)} className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors text-white/90 hover:bg-white/5">{t('settings') || 'Settings'}</Link>
                            <button
                              onClick={async () => {
                                try {
                                  await signOut();
                                } catch (e) {
                                  // ignore
                                } finally {
                                  setIsMenuOpen(false);
                                  if (onSignOut) onSignOut();
                                  router.replace('/');
                                }
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors text-white/90 hover:bg-red-600/10"
                            >
                              {t('logout') || 'Logout'}
                            </button>
                          </div>
                        ) : (
                          <div>
                            <Link href="/login?mode=signin" onClick={() => setIsMenuOpen(false)} className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors text-white/90 hover:bg-white/5">{t('signIn') || 'Sign in'}</Link>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>,
                document.body
              ) : null}
            </div>
                {/* Language Switcher */}
            <div className="relative z-50" ref={languageDropdownRef} style={{ zIndex: 50 }}>
                <button
                  ref={languageBtnRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLanguageDropdown();
                  }}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg backdrop-blur-md bg-white/6 dark:bg-black/12 border border-white/12 text-white cursor-pointer hover:bg-white/12 dark:hover:bg-black/20 transition-colors shadow-sm"
                >
                  <span>{languageOptions.find(lang => lang.code === language)?.flag}</span>
                  <span className="text-sm">{languageOptions.find(lang => lang.code === language)?.name}</span>
                  <span className="text-xs">▼</span>
                </button>
              
              {createPortal(
                <AnimatePresence>
                  {isLanguageDropdownOpen && (
                    <motion.div
                      ref={languagePortalRef}
                      initial={{ opacity: 0, y: -6, scale: 0.995 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.995 }}
                      transition={{ duration: 0.16 }}
                      style={{ position: 'absolute', top: languagePos.top, left: languagePos.left, width: languagePos.width, zIndex: 99999 }}
                      className="backdrop-blur-lg bg-gradient-to-r from-purple-600/8 via-indigo-500/6 to-blue-400/8 border border-white/10 dark:border-white/20 rounded-lg shadow-lg p-2"
                    >
                      <div className="px-2 py-1 border-b border-white/10">
                        <button
                          onClick={() => setIsLanguageDropdownOpen(false)}
                          className="text-xs text-gray-700 dark:text-gray-200 px-2 py-1 rounded hover:bg-white/5"
                        >
                          ✕ {t('close') || 'Close'}
                        </button>
                      </div>

                      <div className="flex flex-col">
                        {languageOptions.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleLanguageSelect(lang.code);
                            }}
                            onMouseDown={(e) => e.preventDefault()}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors ${language === lang.code ? 'bg-white/10 dark:bg-white/10 text-white' : 'hover:bg-white/5 dark:hover:bg-white/5 text-white/80'}`}
                            style={{ zIndex: 1000 }}
                          >
                            <span className="text-lg">{lang.flag}</span>
                            <span className="text-sm">{lang.name}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>,
                document.body
              )}
            </div>

            {/* Online people widget (show on mobile and desktop) */}
            <div className="flex items-center mr-2">
              <OnlinePeople />
            </div>

            {/* Theme is forced to dark via ThemeProvider; toggle removed */}

            {/* User Menu area moved into the hamburger menu for both mobile and desktop */}
            <div className="hidden sm:flex items-center space-x-2">
              {/* Intentionally hidden: auth navigation is now inside the hamburger menu */}
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
