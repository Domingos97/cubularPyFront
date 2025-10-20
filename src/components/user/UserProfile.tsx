import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/resources/i18n';
import { usePersonalities } from '@/hooks/usePersonalities';
import { 
  Eye, 
  EyeOff,
  Mail,
  UserIcon as User,
  Settings,
  Save
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UserData {
  id: string;
  email: string;
  username: string;
  password?: string;
  language_preference?: string;  // Changed from language to match backend
  preferred_personality?: string;
  has_ai_personalities_access?: boolean;
  role?: string;  // Add role field
  created_at?: string;
  updated_at?: string;
  last_login?: string;
}

interface UserProfileProps {
  user: UserData;
  newPassword: string;
  showPassword: boolean;
  isSaving: boolean;
  onUserChange: (updates: Partial<UserData>) => void;
  onPasswordChange: (password: string) => void;
  onPasswordVisibilityToggle: () => void;
  onSave: () => void;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Unknown';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const UserProfile: React.FC<UserProfileProps> = ({
  user,
  newPassword,
  showPassword,
  isSaving,
  onUserChange,
  onPasswordChange,
  onPasswordVisibilityToggle,
  onSave
}) => {
  const { t } = useTranslation();
  const { personalities, isLoading: personalitiesLoading } = usePersonalities('all');
  
  const handleInputChange = (field: keyof UserData, value: any) => {
    onUserChange({ [field]: value });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* User Avatar & Basic Info */}
      <Card className="bg-gray-800/50 border-gray-700 lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-gray-100">{t('admin.userEdit.profilePicture')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src="/placeholder.svg" alt={user.username} />
              <AvatarFallback className="bg-blue-600 text-white text-xl">
                {user.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" className="text-gray-300 border-gray-600">
              {t('admin.userEdit.changeAvatar')}
            </Button>
          </div>
          
          <Separator className="bg-gray-700" />
          
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-400 uppercase tracking-wide">{t('admin.userEdit.userId')}</Label>
              <p className="text-gray-300 font-mono text-sm">{user.id}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-400 uppercase tracking-wide">{t('admin.userEdit.created')}</Label>
              <p className="text-gray-300 text-sm">
                {formatDate(user.created_at)}
              </p>
            </div>
            <div>
              <Label className="text-xs text-gray-400 uppercase tracking-wide">{t('admin.userEdit.lastLogin')}</Label>
              <p className="text-gray-300 text-sm">
                {formatDate(user.last_login) || t('admin.userEdit.never')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Details Form */}
      <Card className="bg-gray-800/50 border-gray-700 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-gray-100">{t('admin.userEdit.userDetails')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Username */}
            <div className="space-y-2">
              <Label className="text-gray-300">{t('admin.userEdit.username')}</Label>
              <div className="relative">
                <User className="absolute left-3 top 1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  value={user.username || ''}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-gray-100 pl-10"
                  placeholder={t('admin.userEdit.enterUsername')}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label className="text-gray-300">{t('admin.userEdit.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  value={user.email || ''}
                  readOnly
                  className="bg-gray-700 border-gray-600 text-gray-100 pl-10 cursor-not-allowed opacity-75"
                  placeholder={t('admin.userEdit.enterEmail')}
                />
              </div>
            </div>
          </div>

          {/* AI Personalities Access Checkbox */}
          <div className="space-y-2">
            <Label className="text-gray-300">AI Personalities Access</Label>
            <div className="flex items-center">
              <input
                id="has_ai_personalities_access"
                type="checkbox"
                checked={!!user.has_ai_personalities_access}
                onChange={(e) => handleInputChange('has_ai_personalities_access', e.target.checked)}
                className="mr-2 h-4 w-4"
              />
              <label htmlFor="has_ai_personalities_access" className="text-sm text-gray-300">Allow user to use AI personalities</label>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label className="text-gray-300">{t('admin.userEdit.newPassword')}</Label>
            <p className="text-xs text-gray-500">{t('admin.userEdit.leaveBlankKeepCurrent')}</p>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => onPasswordChange(e.target.value)}
                className="bg-gray-700 border-gray-600 text-gray-100 pr-10"
                placeholder={t('admin.userEdit.enterNewPassword')}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={onPasswordVisibilityToggle}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Language */}
            <div className="space-y-2">
              <Label className="text-gray-300">{t('admin.userEdit.language')}</Label>
              <Select 
                value={user.language_preference || 'en-US'} 
                onValueChange={(value) => handleInputChange('language_preference', value)}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="en-US">English</SelectItem>
                  <SelectItem value="es-ES">Español</SelectItem>
                  <SelectItem value="pt-PT">Português</SelectItem>
                  <SelectItem value="sv-SE">Svenska</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label className="text-gray-300">Role</Label>
              <Select 
                value={user.role || 'user'} 
                onValueChange={(value) => handleInputChange('role', value)}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="super_admin">Super Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preferred Personality */}
          <div className="space-y-2">
            <Label className="text-gray-300">{t('admin.userEdit.preferredAI')}</Label>
            <Select 
              value={user.preferred_personality || 'none'} 
              onValueChange={(value) => handleInputChange('preferred_personality', value === 'none' ? null : value)}
              disabled={personalitiesLoading || isSaving}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                <SelectValue placeholder={
                  personalitiesLoading 
                    ? 'Loading personalities...' 
                    : isSaving 
                      ? 'Saving...'
                      : 'Select preferred AI personality'
                } />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="none" className="text-gray-300">
                  <div className="flex flex-col">
                    <span className="font-medium">No preference</span>
                    <span className="text-sm text-gray-400">Use system default</span>
                  </div>
                </SelectItem>
                {personalities.map((personality) => (
                  <SelectItem key={personality.id} value={personality.id} className="text-white">
                    <div className="flex flex-col">
                      <span className="font-medium">{personality.name}</span>
                      <span className="text-sm text-gray-400 truncate max-w-60">
                        {personality.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {personalitiesLoading && (
              <p className="text-sm text-gray-400">Loading available personalities...</p>
            )}
            {user.preferred_personality && personalities.length > 0 && (
              <p className="text-sm text-blue-400">
                Current: {personalities.find(p => p.id === user.preferred_personality)?.name || 'Unknown personality'}
              </p>
            )}
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <Button
              onClick={onSave}
              disabled={isSaving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;