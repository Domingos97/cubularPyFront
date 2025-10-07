// Enhanced translation utility with React context support

import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(defaultLanguage);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial language and saved preference
  useEffect(() => {
    const initializeLanguage = () => {
      // Check for saved language preference
      const savedLang = localStorage.getItem('preferred-language') as SupportedLanguage;
      const langToLoad = savedLang || defaultLanguage;
      
      // Initialize all language files (they're pre-loaded via static imports)
      loadLanguage('en');
      loadLanguage('es');
      loadLanguage('pt');
      
      setCurrentLanguage(langToLoad);
      setIsLoading(false);
    };

    initializeLanguage();
  }, [defaultLanguage]);

  // Save language preference when changed
  const setLanguage = (lang: SupportedLanguage) => {
    setCurrentLanguage(lang);
    localStorage.setItem('preferred-language', lang);
  };

  // Translation function bound to current language
  const t = (key: string, vars?: TranslationVariables, count?: number): string => {
    return translate(key, currentLanguage, vars, count);
  };

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    t,
    isLoading
  };

  // Show loading spinner while initializing
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