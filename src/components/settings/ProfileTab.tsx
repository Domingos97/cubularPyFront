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
import { fetchEnabledLanguages, updateUserLanguagePreference } from '@/utils/api';
import type { SupportedLanguage } from '@/types/language';
import { UserIcon, Camera, Languages } from 'lucide-react';

interface ProfileTabProps {
  className?: string;
}

export const ProfileTab = ({ className }: ProfileTabProps) => {
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john.doe@example.com");
  const [isLoading, setIsLoading] = useState(false);
  const [availableLanguages, setAvailableLanguages] = useState<SupportedLanguage[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const { toast } = useToast();
  const { t, currentLanguage, setLanguage } = useTranslation();
  const { user, updateUser } = useAuth();

  // Load available languages and user's current preference
  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const languages = await fetchEnabledLanguages();
        setAvailableLanguages(languages);
        
        // Set current user's language preference or default to current language
        const userLangPreference = user?.language_preference || currentLanguage;
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
    setIsLoading(true);
    try {
      // TODO: Implement actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: t('settings.profile.profileUpdated'),
        description: t('settings.profile.profileUpdateSuccess'),
      });
    } catch (error) {
      toast({
        title: t('settings.profile.updateError'),
        description: t('settings.profile.updateErrorMessage'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = () => {
    // TODO: Implement avatar upload
    toast({
      title: t('settings.profile.comingSoon'),
      description: t('settings.profile.avatarUploadSoon'),
    });
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
                <AvatarImage src="/placeholder.svg" alt="Profile" />
                <AvatarFallback className="bg-blue-600 text-white text-lg">JD</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer mb-4 md:mb-0">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-gray-300 border-gray-600 hover:bg-gray-700"
                onClick={handleAvatarChange}
              >
                <Camera className="h-4 w-4 mr-2" />
                {t('settings.profile.changeAvatar')}
              </Button>
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-y-4 md:gap-x-4 items-start">
              <Label htmlFor="timezone" className="md:text-right text-gray-300 font-medium md:pt-2">
                {t('settings.profile.timezone')}
              </Label>
              <div className="md:col-span-3">
                <select 
                  id="timezone"
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 text-gray-200 rounded-md focus:border-blue-500 focus:outline-none"
                  defaultValue="America/New_York"
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="UTC">UTC</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-y-4 md:gap-x-4 items-start">
              <Label htmlFor="language" className="md:text-right text-gray-300 font-medium md:pt-2">
                {t('settings.profile.language')}
              </Label>
              <div className="md:col-span-3">
                <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="bg-gray-700/50 border-gray-600 text-gray-200 focus:border-blue-500">
                    <SelectValue placeholder="Select language..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLanguages.map((language) => (
                      <SelectItem key={language.code} value={language.code}>
                        <div className="flex items-center gap-2">
                          <span>{getFlagForLanguage(language.code)}</span>
                          <span>{language.native_name}</span>
                          <span className="text-gray-500 text-sm">({language.name})</span>
                        </div>
                      </SelectItem>
                    ))}
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