import React, { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { useTranslation, SupportedLanguage } from '@/resources/i18n';
import { fetchEnabledLanguages, updateUserLanguagePreference } from '@/utils/api';
import type { SupportedLanguage as BackendLanguage } from '@/types/language';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const LanguageSwitcher: React.FC = () => {
  const { currentLanguage, setLanguage, t } = useTranslation();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [availableLanguages, setAvailableLanguages] = useState<BackendLanguage[]>([]);
  const [loading, setLoading] = useState(true);

  // Fallback languages for offline/error scenarios
  const fallbackLanguages: Array<{ code: SupportedLanguage; name: string; native_name: string; flag: string }> = [
    { code: 'en', name: 'English', native_name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', native_name: 'Español', flag: '🇪🇸' },
    { code: 'pt', name: 'Portuguese', native_name: 'Português', flag: '🇵🇹' },
    { code: 'sv', name: 'Swedish', native_name: 'Svenska', flag: '🇸🇪' },
  ];

  // Language to flag mapping - expand as needed
  const getFlagForLanguage = (code: string): string => {
    const flagMap: Record<string, string> = {
      'en': '🇺🇸',
      'es': '🇪🇸', 
      'pt': '🇵🇹',
      'sv': '🇸🇪',
      'fr': '🇫🇷',
      'de': '🇩🇪',
      'it': '🇮🇹',
      'ru': '🇷🇺',
      'zh': '🇨🇳',
      'ja': '🇯🇵',
      'ko': '🇰🇷',
      'ar': '🇸🇦',
      'hi': '🇮🇳',
    };
    return flagMap[code] || '🌐';
  };

  // Fetch supported languages from backend on component mount
  useEffect(() => {
    const loadLanguages = async () => {
      try {
        setLoading(true);
        const languages = await fetchEnabledLanguages();
        console.log('🔍 DEBUG: fetchEnabledLanguages returned:', languages, 'Type:', typeof languages, 'Is Array:', Array.isArray(languages));
        // Ensure we have a valid array
        if (Array.isArray(languages)) {
          setAvailableLanguages(languages);
        } else {
          console.warn('API returned non-array response for languages:', languages);
          setAvailableLanguages([]);
        }
      } catch (error) {
        console.error('Failed to fetch supported languages:', error);
        // Ensure state remains as empty array on error
        setAvailableLanguages([]);
        // Use fallback languages if backend is unavailable
        toast({
          title: 'Language Loading Issue',
          description: 'Using cached language options. Some languages may not be available.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadLanguages();
  }, [toast]);

  // Handle language change with backend sync
  const handleLanguageChange = async (languageCode: SupportedLanguage) => {
    try {
      // Update frontend immediately for better UX
      setLanguage(languageCode);
      
      // Sync with backend (don't block UI)
      await updateUserLanguagePreference(languageCode);
      
      // Update user object in auth context
      if (user) {
        updateUser({ language_preference: languageCode });
      }
      
      toast({
        title: t('admin.languageChanged'),
        description: t('admin.languageChangedDescription', { language: getLanguageName(languageCode) }),
      });
    } catch (error) {
      console.error('Failed to update language preference:', error);
      // Language change still works locally, just warn about sync
      toast({
        title: 'Language Updated Locally',
        description: 'Language changed but could not sync with server. Changes may not persist.',
        variant: 'destructive'
      });
    }
  };

  // Get display name for a language
  const getLanguageName = (code: string): string => {
    // Ensure availableLanguages is an array before using find
    if (Array.isArray(availableLanguages)) {
      const backendLang = availableLanguages.find(lang => lang.code === code);
      if (backendLang) return backendLang.native_name;
    }
    
    const fallbackLang = fallbackLanguages.find(lang => lang.code === code);
    return fallbackLang?.native_name || code;
  };

  // Prepare languages for display (prefer backend, fallback to hardcoded)
  const displayLanguages = loading ? fallbackLanguages : 
    (Array.isArray(availableLanguages) && availableLanguages.length > 0) ? 
      availableLanguages.map(lang => ({
        code: lang.code as SupportedLanguage,
        name: lang.name,
        native_name: lang.native_name,
        flag: getFlagForLanguage(lang.code)
      })).filter(lang => ['en', 'es', 'pt', 'sv'].includes(lang.code)) // Only show languages supported by frontend i18n
      : fallbackLanguages;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          disabled={loading}
        >
          <Globe className="h-4 w-4" />
          <span className="sr-only">{t('admin.language')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {displayLanguages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={`flex items-center gap-2 cursor-pointer ${
              currentLanguage === language.code ? 'bg-gray-100 dark:bg-gray-800' : ''
            }`}
          >
            <span className="text-lg">{language.flag}</span>
            <span className="flex-1">{language.native_name}</span>
            {currentLanguage === language.code && (
              <span className="text-xs text-blue-600 dark:text-blue-400">✓</span>
            )}
          </DropdownMenuItem>
        ))}
        {loading && (
          <DropdownMenuItem disabled className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
            <span className="text-sm text-gray-500">Loading languages...</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;