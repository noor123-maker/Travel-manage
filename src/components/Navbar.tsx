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
      className="backdrop-blur-md bg-white/10 dark:bg-black/10 border-b border-white/20 dark:border-white/10 relative z-50"
      style={{ zIndex: 50 }}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <motion.div className="flex items-center" whileHover={{ scale: 1.05 }}>
            <Link href="/" className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight">
              {t('busTravelManager')}
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
                className="flex items-center justify-center w-10 h-10 rounded-md bg-white/8 dark:bg-black/10 border border-white/10 dark:border-white/10 text-white hover:scale-105 transition-transform shadow-sm"
                title="Menu"
              >
                {/* Professional hamburger icon (SVG) */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                  <rect x="3" y="6" width="18" height="2" rx="1" fill="currentColor" />
                  <rect x="3" y="11" width="18" height="2" rx="1" fill="currentColor" opacity="0.9" />
                  <rect x="3" y="16" width="18" height="2" rx="1" fill="currentColor" opacity="0.7" />
                </svg>
              </button>

              {createPortal(
                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.99 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.99 }}
                      transition={{ duration: 0.18 }}
                        style={{ position: 'absolute', top: menuPos.top, left: menuPos.left, width: menuPos.width, zIndex: 99999 }}
                        className={`rounded-2xl p-4 backdrop-blur-lg shadow-2xl bg-black/60 border border-white/10`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Support & Contact</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Get help or contact the app admin</p>
                        </div>
                        <button onClick={() => setIsMenuOpen(false)} className="text-gray-600 dark:text-gray-300">✕</button>
                      </div>

                      <div className="mt-3 pt-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Ehsas</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">App administrator</p>
                          </div>
                          <a href="tel:0703783076" className="ml-4 inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm shadow-sm hover:brightness-95">{t('callNow') || 'Call'}</a>
                        </div>

                        <div className="mt-3">
                          <a href="/contact" className="block w-full text-center px-3 py-2 bg-white/5 dark:bg-white/5 rounded-md border border-white/10 dark:border-white/20 text-sm hover:bg-white/10">{t('contact')}</a>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>,
                document.body
              )}
            </div>
            {/* Language Switcher */}
            <div className="relative z-50" ref={languageDropdownRef} style={{ zIndex: 50 }}>
                <button
                  ref={languageBtnRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLanguageDropdown();
                  }}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg backdrop-blur-md bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 text-white cursor-pointer hover:bg-white/20 dark:hover:bg-black/20 transition-colors"
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

            {/* User Menu area */}
            <div className="hidden sm:flex items-center space-x-2">
              {/* When authenticated show Dashboard, Settings and Logout. Otherwise show Sign in */}
              {authUser ? (
                <>
                  <Link href="/dashboard" className="px-3 py-2 text-sm text-white/80 hover:text-white rounded-md">{t('dashboard') || 'Dashboard'}</Link>
                  <Link href="/settings" className="px-3 py-2 text-sm text-white/80 hover:text-white rounded-md">{t('settings') || 'Settings'}</Link>
                  <button
                    onClick={async () => {
                      try {
                        await signOut();
                      } catch (e) {
                        // ignore
                      } finally {
                        if (onSignOut) onSignOut();
                        router.replace('/');
                      }
                    }}
                    className="px-3 py-2 bg-white/5 rounded-md text-sm text-white/90 hover:bg-white/10"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link href="/login?mode=signin" className="px-3 py-2 text-sm text-white/80 hover:text-white rounded-md">Sign in</Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
