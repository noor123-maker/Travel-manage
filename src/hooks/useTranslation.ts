'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';

interface TranslationData {
  [key: string]: string;
}

export function useTranslation() {
  const { language } = useLanguage();
  const [translations, setTranslations] = useState<TranslationData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const response = await fetch(`/locales/${language}/common.json`);
        const data = await response.json();
        setTranslations(data);
      } catch (error) {
        console.error('Failed to load translations:', error);
        // Fallback to English
        if (language !== 'en') {
          const response = await fetch('/locales/en/common.json');
          const data = await response.json();
          setTranslations(data);
        }
      } finally {
        setLoading(false);
      }
    };

    loadTranslations();
  }, [language]);

  const t = (key: string, params?: Record<string, string | number>): string => {
    let translation = translations[key] || key;
    
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        translation = translation.replace(`{{${paramKey}}}`, String(value));
      });
    }
    
    return translation;
  };

  return { t, loading };
}
