// Enhanced translation utility with React context support

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

// Static imports for language files
import enTranslations from './en.json';
import esTranslations from './es.json';
import ptTranslations from './pt.json';

// Type definitions
export type TranslationVariables = Record<string, string | number>;
export type SupportedLanguage = 'en' | 'es' | 'pt';

// Resource storage with pre-loaded translations
const resources: Record<SupportedLanguage, Record<string, string>> = {
  en: enTranslations,
  es: esTranslations,
  pt: ptTranslations
};

// Load language resource files (now synchronous since they're pre-loaded)
export function loadLanguage(lang: SupportedLanguage): void {
  // Languages are now pre-loaded via static imports, so this function
  // is mainly for compatibility but could be used for validation
  if (!resources[lang]) {
    console.error(`Unsupported language: ${lang}`);
    return;
  }
  console.log(`Language ${lang} is ready (pre-loaded)`);
}

// Translation function with pluralization support
export function translate(
  key: string, 
  lang: SupportedLanguage = 'en', 
  vars?: TranslationVariables,
  count?: number
): string {
  const dict = resources[lang] || resources.en;
  
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
  defaultLanguage = 'en' 
}) => {
  // Initialize with saved language or default, preventing race condition
  const getInitialLanguage = (): SupportedLanguage => {
    try {
      const savedLang = localStorage.getItem('preferred-language') as SupportedLanguage;
      console.log('🔍 getInitialLanguage - Raw localStorage value:', savedLang);
      console.log('🔍 getInitialLanguage - Type of savedLang:', typeof savedLang);
      console.log('🔍 getInitialLanguage - Is supported language?', ['en', 'es', 'pt'].includes(savedLang));
      
      if (savedLang && ['en', 'es', 'pt'].includes(savedLang)) {
        console.log(`🌐 ✅ Initializing with saved language: ${savedLang}`);
        return savedLang;
      } else {
        console.log(`🌐 ❌ Saved language "${savedLang}" not valid, using default: ${defaultLanguage}`);
      }
    } catch (error) {
      console.error('🌐 ❌ Failed to read language preference from localStorage:', error);
    }
    console.log(`🌐 🔄 Initializing with default language: ${defaultLanguage}`);
    return defaultLanguage;
  };

  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(getInitialLanguage);
  const [isLoading, setIsLoading] = useState(false); // Changed to false for immediate availability

  // Initialize language files only once on mount
  useEffect(() => {
    let isMounted = true;
    
    const initializeLanguage = () => {
      if (!isMounted) return;
      
      console.log('🌐 🚀 Starting language initialization...');
      console.log('🌐 Current state:', { currentLanguage, defaultLanguage });
      
      // Initialize all language files (they're pre-loaded via static imports)
      loadLanguage('en');
      loadLanguage('es');
      loadLanguage('pt');
      
      // Verify current language is still correct after mount
      try {
        const savedLang = localStorage.getItem('preferred-language') as SupportedLanguage;
        console.log('🔍 Re-checking localStorage after mount:', { 
          savedLang, 
          currentLanguage, 
          isValid: savedLang && ['en', 'es', 'pt'].includes(savedLang),
          needsUpdate: savedLang !== currentLanguage 
        });
        
        if (savedLang && ['en', 'es', 'pt'].includes(savedLang) && savedLang !== currentLanguage) {
          console.log(`🌐 🔄 Correcting language from ${currentLanguage} to ${savedLang}`);
          setCurrentLanguage(savedLang);
        } else {
          console.log(`🌐 ✅ Language ${currentLanguage} is correct, no change needed`);
        }
      } catch (error) {
        console.error('🌐 ❌ Failed to verify language preference:', error);
      }
      
      if (isMounted) {
        setIsLoading(false);
        console.log('🌐 ✅ Language initialization complete');
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
      console.log(`🌐 Language changing from ${currentLanguage} to ${lang}`);
      setCurrentLanguage(lang);
      localStorage.setItem('preferred-language', lang);
      console.log(`✅ Language saved to localStorage: ${lang}`);
    } catch (error) {
      console.error('❌ Failed to save language preference:', error);
      // Still update the current language even if storage fails
      setCurrentLanguage(lang);
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
    console.log(`🔍 Translation called: key="${key}", currentLanguage="${currentLanguage}"`);
    const result = translate(key, currentLanguage, vars, count);
    console.log(`🔍 Translation result: "${result}"`);
    return result;
  }, [currentLanguage]);

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
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