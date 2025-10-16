// Enhanced translation utility with React context support

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

// Static imports for language files

import enTranslations from './en.json';
import esTranslations from './es.json';
import ptTranslations from './pt.json';
import svTranslations from './sv.json';

// Type definitions
export type TranslationVariables = Record<string, string | number>;
export type SupportedLanguage = 'en-US' | 'es-ES' | 'pt-PT' | 'sv-SE';

// Map full locale codes to resource files (using short codes for file names)
const localeToResourceMap: Record<SupportedLanguage, string> = {
  'en-US': 'en',
  'es-ES': 'es', 
  'pt-PT': 'pt',
  'sv-SE': 'sv'
};

// Resource storage with pre-loaded translations
const resources: Record<string, Record<string, string>> = {
  en: enTranslations,
  es: esTranslations,
  pt: ptTranslations,
  sv: svTranslations
};

// Load language resource files (now synchronous since they're pre-loaded)
export function loadLanguage(lang: SupportedLanguage): void {
  // Languages are now pre-loaded via static imports, so this function
  // is mainly for compatibility but could be used for validation
  const resourceKey = localeToResourceMap[lang];
  if (!resources[resourceKey]) {
    console.error(`Unsupported language: ${lang}`);
    return;
  }
}

// Translation function with pluralization support
export function translate(
  key: string, 
  lang: SupportedLanguage = 'en-US', 
  vars?: TranslationVariables,
  count?: number
): string {
  const resourceKey = localeToResourceMap[lang] || 'en';
  const dict = resources[resourceKey] || resources.en;
  
  // Handle pluralization
  let translationKey = key;
  if (count !== undefined) {
    const pluralKey = count === 1 ? `${key}.singular` : `${key}.plural`;
    if (dict[pluralKey]) {
      translationKey = pluralKey;
    }
  }
  
  let text = dict[translationKey] || dict[key] || key;
  
  // Replace variables
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      const regex = new RegExp(`\\{${k}\\}`, 'g');
      text = text.replace(regex, String(v));
    });
  }
  
  // Replace count in pluralization
  if (count !== undefined) {
    text = text.replace(/\{count\}/g, String(count));
  }
  
  return text;
}

// Language Context
interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  setUserLanguagePreference: (lang: SupportedLanguage) => void;
  t: (key: string, vars?: TranslationVariables, count?: number) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Language Provider Component
interface LanguageProviderProps {
  children: ReactNode;
  defaultLanguage?: SupportedLanguage;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ 
  children, 
  defaultLanguage = 'en-US' 
}) => {
  // Initialize with saved language or default, preventing race condition
  const getInitialLanguage = (): SupportedLanguage => {
    try {
      const savedLang = localStorage.getItem('preferred-language') as SupportedLanguage;
      
      if (savedLang && ['en-US', 'es-ES', 'pt-PT', 'sv-SE'].includes(savedLang)) {
        return savedLang;
      } else {
      }
    } catch (error) {
    }
    return defaultLanguage;
  };

  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(getInitialLanguage);
  const [isLoading, setIsLoading] = useState(false); // Changed to false for immediate availability

  // Initialize language files only once on mount
  useEffect(() => {
    let isMounted = true;
    
    const initializeLanguage = () => {
      if (!isMounted) return;
      
      
      // Initialize all language files (they're pre-loaded via static imports)
  loadLanguage('en-US');
  loadLanguage('es-ES');
  loadLanguage('pt-PT');
  loadLanguage('sv-SE');
      
      // Verify current language is still correct after mount
      try {
        const savedLang = localStorage.getItem('preferred-language') as SupportedLanguage;
        console.log('🔍 Re-checking localStorage after mount:', { 
          savedLang, 
          currentLanguage, 
          isValid: savedLang && ['en', 'es', 'pt', 'sv'].includes(savedLang),
          needsUpdate: savedLang !== currentLanguage 
        });
        
        if (savedLang && ['en-US', 'es-ES', 'pt-PT', 'sv-SE'].includes(savedLang) && savedLang !== currentLanguage) {
          setCurrentLanguage(savedLang);
        } else {
        }
      } catch (error) {
      }
      
      if (isMounted) {
        setIsLoading(false);
      }
    };

    initializeLanguage();
    
    return () => {
      isMounted = false;
    };
  }, []); // Only run once on mount, no dependencies to avoid loops

  // Save language preference when changed
  const setLanguage = (lang: SupportedLanguage) => {
    try {
      setCurrentLanguage(lang);
      localStorage.setItem('preferred-language', lang);
    } catch (error) {
      // Still update the current language even if storage fails
      setCurrentLanguage(lang);
    }
  };

  // Function to set user language preference from auth (e.g., from JWT token)
  const setUserLanguagePreference = (lang: SupportedLanguage) => {
    if (['en-US', 'es-ES', 'pt-PT', 'sv-SE'].includes(lang)) {
      console.log('🔍 Setting user language preference from token:', lang);
      setLanguage(lang);
    }
  };

  // Debug localStorage state on mount
  useEffect(() => {
    console.log('🔍 LanguageProvider Debug Info:', {
      currentLanguage,
      defaultLanguage,
      storedLanguage: localStorage.getItem('preferred-language'),
      isLoading
    });
  }, [currentLanguage, defaultLanguage, isLoading]);

  // Translation function bound to current language
  const t = useCallback((key: string, vars?: TranslationVariables, count?: number): string => {
    const result = translate(key, currentLanguage, vars, count);
    return result;
  }, [currentLanguage]);

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    setUserLanguagePreference,
    t,
    isLoading
  };

  // Only show loading spinner if truly needed (shouldn't happen with pre-loaded translations)
  if (isLoading) {
    return React.createElement('div', {
      className: 'min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center'
    }, 
      React.createElement('div', {
        className: 'flex flex-col items-center space-y-4'
      },
        React.createElement('div', {
          className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500'
        }),
        React.createElement('p', {
          className: 'text-gray-300 text-sm'
        }, 'Loading translations...')
      )
    );
  }

  return React.createElement(LanguageContext.Provider, { value }, children);
};

// Custom hook to use translation
export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};

// Legacy function for backwards compatibility
export const t = translate;