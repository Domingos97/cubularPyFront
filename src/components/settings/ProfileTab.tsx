import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/resources/i18n';
import { useAuth } from '@/hooks/useAuth';
import { fetchEnabledLanguages, updateUserLanguagePreference, updateUserProfile, authenticatedFetch } from '@/utils/api';
import { buildApiUrl } from '@/config';
import type { SupportedLanguage } from '@/types/language';
import { UserIcon, Camera, Languages } from 'lucide-react';

interface ProfileTabProps {
  className?: string;
}

export const ProfileTab = ({ className }: ProfileTabProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [availableLanguages, setAvailableLanguages] = useState<SupportedLanguage[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const { toast } = useToast();
  const { t, currentLanguage, setLanguage } = useTranslation();
  const { user, updateUser } = useAuth();

  // Initialize profile data from user
  useEffect(() => {
    if (user) {
      setName(user.username || user.email.split('@')[0] || 'User');
      setEmail(user.email);
    }
  }, [user]);
  // Normalize any incoming language value (from user object or API) to frontend locale
  // Convert backend short codes (e.g. 'en') to frontend locale codes (e.g. 'en-US')
  const convertToFrontendLocale = (backendCode: string): string => {
    const codeMap: Record<string, string> = {
      'en': 'en-US',
      'es': 'es-ES',
      'pt': 'pt-PT',
      'sv': 'sv-SE',
      // allow passthrough for already full locale codes
      'en-US': 'en-US',
      'es-ES': 'es-ES',
      'pt-PT': 'pt-PT',
      'sv-SE': 'sv-SE'
    };
    return codeMap[backendCode] || backendCode;
  };

  const normalizeLocale = (value?: string): string => {
    if (!value) return '';
    // If it's already a full locale we keep it, otherwise try to convert
    return convertToFrontendLocale(value);
  };

  // Load available languages and user's current preference
  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const languages = await fetchEnabledLanguages();
        setAvailableLanguages(languages);
        
        // Set current user's language preference or default to current language
        const userLangPreference = normalizeLocale(user?.language_preference) || currentLanguage;
        setSelectedLanguage(userLangPreference);
      } catch (error) {
        console.error('Failed to load languages:', error);
      }
    };

    loadLanguages();
  }, [user, currentLanguage]);

  // Get flag for language
  const getFlagForLanguage = (code: string): string => {
    const flagMap: Record<string, string> = {
      'en': '🇺🇸', 'es': '🇪🇸', 'pt': '🇵🇹', 'sv': '🇸🇪',
      'fr': '🇫🇷', 'de': '🇩🇪', 'it': '🇮🇹', 'ru': '🇷🇺',
      'zh': '🇨🇳', 'ja': '🇯🇵', 'ko': '🇰🇷', 'ar': '🇸🇦',
    };
    return flagMap[code] || '🌐';
  };

  // Handle language preference change
  const handleLanguageChange = async (languageCode: string) => {
    try {
      setSelectedLanguage(languageCode);
      
      // Update backend
      await updateUserLanguagePreference(languageCode);
      
      // Update frontend language
      setLanguage(languageCode as any);
      
      // Update user object
      if (user) {
        updateUser({ language_preference: languageCode });
      }
      
      toast({
        title: t('settings.profile.languageUpdated'),
        description: t('settings.profile.languageUpdateSuccess'),
      });
    } catch (error) {
      console.error('Failed to update language preference:', error);
      toast({
        title: t('settings.profile.updateError'),
        description: t('settings.profile.languageUpdateError'),
        variant: 'destructive'
      });
      // Revert the selection
      setSelectedLanguage(user?.language_preference || currentLanguage);
    }
  };

  const handleSaveProfile = async () => {
    // Basic validation
    if (!name.trim()) {
      toast({
        title: t('settings.profile.validationError'),
        description: t('settings.profile.nameRequired'),
        variant: 'destructive'
      });
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      toast({
        title: t('settings.profile.validationError'),
        description: t('settings.profile.emailRequired'),
        variant: 'destructive'
      });
      return;
    }

    // Check if anything changed
    const currentName = user?.username || user?.email?.split('@')[0] || '';
    const currentEmail = user?.email || '';
    
    if (name.trim() === currentName && email.trim() === currentEmail) {
      toast({
        title: t('settings.profile.noChanges'),
        description: t('settings.profile.noChangesMessage'),
        variant: 'default'
      });
      return;
    }

    setIsLoading(true);
    try {
      const profileData = {
        username: name.trim(),
        email: email.trim()
      };
      
      await updateUserProfile(profileData);
      
      // Update the local user state
      if (user) {
        updateUser({ 
          username: name.trim(),
          email: email.trim()
        });
      }
      
      toast({
        title: t('settings.profile.profileUpdated'),
        description: t('settings.profile.profileUpdateSuccess'),
      });
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({
        title: t('settings.profile.updateError'),
        description: error.message || t('settings.profile.updateErrorMessage'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = () => {
    // trigger file input click
    const input = document.getElementById('avatar-file-input') as HTMLInputElement | null;
    input?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    // Client-side validation
    const maxBytes = 2 * 1024 * 1024; // 2MB
    if (file.size > maxBytes) {
      toast({ title: t('settings.profile.updateError'), description: t('settings.profile.avatarFileTooLarge') || 'File too large', variant: 'destructive' });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({ title: t('settings.profile.updateError'), description: t('settings.profile.avatarInvalidType') || 'Invalid file type', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);

      // Upload to API endpoint
      const resp = await authenticatedFetch(buildApiUrl('/users/me/avatar'), {
        method: 'POST',
        body: form
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || `Upload failed: ${resp.status}`);
      }

      const data = await resp.json();

      // Update local user state
      if (data?.avatar && user) {
        updateUser({ avatar: data.avatar });
      }

      toast({ title: t('settings.profile.profileUpdated'), description: t('settings.profile.avatarUpdateSuccess') });
    } catch (error: any) {
      console.error('Avatar upload failed', error);
      toast({ title: t('settings.profile.updateError'), description: error?.message || t('settings.profile.avatarUploadError'), variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Profile Information */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100 flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            {t('settings.profile.title')}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {t('settings.profile.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
            <div className="relative group">
              <Avatar className="h-20 w-20 mb-4 md:mb-0">
                <AvatarImage src={user?.avatar || '/placeholder.svg'} alt="Profile" />
                <AvatarFallback className="bg-blue-600 text-white text-lg">
                  {name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 
                   email ? email[0].toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer mb-4 md:mb-0">
                <Camera className="h-6 w-6 text-white" onClick={handleAvatarChange} />
              </div>
            </div>
            <div>

              {/* hidden file input for avatar upload */}
              <input id="avatar-file-input" type="file" accept="image/*" className="hidden" onChange={handleFileSelected} />

              <p className="text-xs text-gray-500 mt-2">
                {t('settings.profile.avatarFileInfo')}
              </p>
            </div>
          </div>
          
          <Separator className="bg-gray-700" />
          
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-y-4 md:gap-x-4 items-center">
              <Label htmlFor="name" className="md:text-right text-gray-300 font-medium">
                {t('settings.profile.fullName')}
              </Label>
              <div className="md:col-span-3">
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="bg-gray-700/50 border-gray-600 text-gray-200 focus:border-blue-500"
                  placeholder={t('settings.profile.fullNamePlaceholder')}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-y-4 md:gap-x-4 items-center">
              <Label htmlFor="email" className="md:text-right text-gray-300 font-medium">
                {t('settings.profile.emailAddress')}
              </Label>
              <div className="md:col-span-3">
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="bg-gray-700/50 border-gray-600 text-gray-200 focus:border-blue-500"
                  placeholder={t('settings.profile.emailPlaceholder')}
                />
              </div>
            </div>

            {/* Account Created */}
            {user?.created_at && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-y-4 md:gap-x-4 items-center">
                <Label className="md:text-right text-gray-300 font-medium">
                  Member Since
                </Label>
                <div className="md:col-span-3">
                  <div className="bg-gray-700/50 border border-gray-600 rounded-md px-3 py-2 text-gray-200">
                    {new Date(user.created_at).toLocaleDateString('pt-PT', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            )}


            <div className="grid grid-cols-1 md:grid-cols-4 gap-y-4 md:gap-x-4 items-start">
              <Label htmlFor="language" className="md:text-right text-gray-300 font-medium md:pt-2">
                {t('settings.profile.language')}
              </Label>
              <div className="md:col-span-3">
                <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="bg-gray-700/50 border-gray-600 text-gray-200 focus:border-blue-500">
                    <SelectValue placeholder={t('settings.profile.selectLanguage')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLanguages && availableLanguages.length > 0 ? (
                      availableLanguages.map((language) => (
                        <SelectItem key={language.code} value={convertToFrontendLocale(language.code)}>
                          <div className="flex items-center gap-2">
                            <span>{getFlagForLanguage(language.code)}</span>
                            <span>{language.native_name}</span>
                            <span className="text-gray-500 text-sm">({language.name})</span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="loading" disabled>Loading languages...</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {t('settings.profile.languageHelpText')}
                </p>
              </div>
            </div>
          </div>
          
          <Separator className="bg-gray-700" />
          
          <div className="flex justify-end">
            <Button 
              onClick={handleSaveProfile}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                  {t('settings.profile.saving')}
                </>
              ) : (
                t('settings.profile.saveChanges')
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Security */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">{t('settings.profile.accountSecurity')}</CardTitle>
          <CardDescription className="text-gray-400">
            {t('settings.profile.securityDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-y-4 md:gap-x-4 items-center">
              <Label htmlFor="current-password" className="md:text-right text-gray-300 font-medium">
                {t('settings.profile.currentPassword')}
              </Label>
              <div className="md:col-span-3">
                <Input 
                  id="current-password" 
                  type="password"
                  className="bg-gray-700/50 border-gray-600 text-gray-200 focus:border-blue-500"
                  placeholder={t('settings.profile.currentPasswordPlaceholder')}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-y-4 md:gap-x-4 items-center">
              <Label htmlFor="new-password" className="md:text-right text-gray-300 font-medium">
                {t('settings.profile.newPassword')}
              </Label>
              <div className="md:col-span-3">
                <Input 
                  id="new-password" 
                  type="password"
                  className="bg-gray-700/50 border-gray-600 text-gray-200 focus:border-blue-500"
                  placeholder={t('settings.profile.newPasswordPlaceholder')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-y-4 md:gap-x-4 items-center">
              <Label htmlFor="confirm-password" className="md:text-right text-gray-300 font-medium">
                {t('settings.profile.confirmPassword')}
              </Label>
              <div className="md:col-span-3">
                <Input 
                  id="confirm-password" 
                  type="password"
                  className="bg-gray-700/50 border-gray-600 text-gray-200 focus:border-blue-500"
                  placeholder={t('settings.profile.confirmPasswordPlaceholder')}
                />
              </div>
            </div>
          </div>
          
          <Separator className="bg-gray-700" />
          
          <div className="flex justify-end">
            <Button 
              variant="outline"
              className="text-gray-300 border-gray-600 hover:bg-gray-700"
            >
              {t('settings.profile.updatePassword')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};