import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/resources/i18n';
import type { SupportedLanguage } from '@/resources/i18n';

/**
 * Component that syncs user's language preference from JWT token 
 * with the language context. This ensures the app uses the user's
 * preferred language as stored in their token.
 */
export const UserLanguageSync = () => {
  const { user, loading } = useAuth();
  const { setUserLanguagePreference, currentLanguage } = useTranslation();

  useEffect(() => {
    if (!loading && user && user.language_preference) {
      const userLang = user.language_preference as SupportedLanguage;
      
      // Only update if it's different from current language to avoid unnecessary re-renders
      if (currentLanguage !== userLang) {
        console.log('🔄 Syncing user language preference:', { 
          from: currentLanguage, 
          to: userLang,
          userId: user.id 
        });
        setUserLanguagePreference(userLang);
      }
    }
  }, [user, loading, setUserLanguagePreference, currentLanguage]);

  // This component doesn't render anything
  return null;
};