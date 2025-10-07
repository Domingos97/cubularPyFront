import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/resources/i18n';
import { 
  Eye, 
  EyeOff,
  Mail,
  UserIcon as User,
  Settings
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
  language?: string;
  roleId: string;
  preferred_personality?: string;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
  is_active?: boolean;
}

interface UserProfileProps {
  user: UserData;
  newPassword: string;
  showPassword: boolean;
  onUserChange: (updates: Partial<UserData>) => void;
  onPasswordChange: (password: string) => void;
  onPasswordVisibilityToggle: () => void;
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
  onUserChange,
  onPasswordChange,
  onPasswordVisibilityToggle
}) => {
  const { t } = useTranslation();
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
            <div>
              <Label className="text-xs text-gray-400 uppercase tracking-wide">{t('admin.userEdit.status')}</Label>
              <Badge 
                variant="outline" 
                className={user.is_active !== false ? 'text-green-400 border-green-600' : 'text-red-400 border-red-600'}
              >
                {user.is_active !== false ? t('admin.userEdit.active') : t('admin.userEdit.inactive')}
              </Badge>
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
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-gray-100 pl-10"
                  placeholder={t('admin.userEdit.enterEmail')}
                />
              </div>
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
                value={user.language || 'en'} 
                onValueChange={(value) => handleInputChange('language', value)}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="pt">Portuguese</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label className="text-gray-300">{t('admin.userEdit.role')}</Label>
              <Select 
                value={user.roleId || 'user'} 
                onValueChange={(value) => handleInputChange('roleId', value)}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="admin">{t('admin.userEdit.administrator')}</SelectItem>
                  <SelectItem value="user">{t('admin.userEdit.user')}</SelectItem>
                  <SelectItem value="moderator">{t('admin.userEdit.moderator')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preferred Personality */}
          <div className="space-y-2">
            <Label className="text-gray-300">{t('admin.userEdit.preferredAI')}</Label>
            <Textarea
              value={user.preferred_personality || ''}
              onChange={(e) => handleInputChange('preferred_personality', e.target.value)}
              className="bg-gray-700 border-gray-600 text-gray-100 min-h-[80px]"
              placeholder={t('admin.userEdit.describePreferred')}
            />
          </div>

          {/* Account Status */}
          <div className="space-y-2">
            <Label className="text-gray-300">{t('admin.userEdit.accountStatus')}</Label>
            <div className="flex items-center gap-4">
              <Button
                variant={user.is_active !== false ? "default" : "outline"}
                size="sm"
                onClick={() => handleInputChange('is_active', true)}
                className="text-xs"
              >
                {t('admin.userEdit.active')}
              </Button>
              <Button
                variant={user.is_active === false ? "destructive" : "outline"}
                size="sm"
                onClick={() => handleInputChange('is_active', false)}
                className="text-xs"
              >
                {t('admin.userEdit.inactive')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;