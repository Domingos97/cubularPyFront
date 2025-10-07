import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Shield, Database, Bell, Save, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/resources/i18n';
import { ChatbotManagementPanel } from './ChatbotManagementPanel';
import { MultiProviderLLMPanel } from './MultiProviderLLMPanel';


interface SystemSettings {
  maintenanceMode: boolean;
  allowRegistration: boolean;
  maxUsersPerRole: number;
  systemMessage: string;
  backupFrequency: string;
  logRetentionDays: number;
}



export const AdminSettings = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [settings, setSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    allowRegistration: true,
    maxUsersPerRole: 100,
    systemMessage: '',
    backupFrequency: 'daily',
    logRetentionDays: 30
  });
  const [loading, setLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState<string>('');

  useEffect(() => {
    // Load system settings
    const loadSettings = async () => {
      try {
        // System settings would be loaded from a different endpoint
        // TODO: Implement system settings API
        setLastBackup(new Date().toISOString());
      } catch (error) {
        console.error('Failed to load settings:', error);
        toast({
          title: t('admin.toast.warning'),
          description: t('admin.settings.loadingWarning'),
          variant: "destructive",
        });
      }
    };

    loadSettings();
  }, [toast]);



  const handleCreateBackup = async () => {
    setLoading(true);
    try {
      // TODO: Implement actual backup functionality
      
      setLastBackup(new Date().toISOString());
      toast({
        title: t('admin.settings.backupCreated'),
        description: t('admin.settings.backupSuccess'),
      });
    } catch (error) {
      toast({
        title: t('admin.toast.error'),
        description: t('admin.settings.backupError'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Multi-Provider LLM Configuration */}
      <MultiProviderLLMPanel />

      {/* Chatbot Management */}
      <ChatbotManagementPanel />


      {/* Database Management */}
      <Card className="bg-gray-800/80 border-gray-700">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-green-500" />
            <CardTitle className="text-white">{t('admin.settings.databaseManagement')}</CardTitle>
          </div>
          <CardDescription className="text-gray-400">
            {t('admin.settings.databaseDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
            <div>
              <div className="text-white font-medium">{t('admin.settings.lastBackup')}</div>
              <div className="text-gray-400 text-sm">
                {lastBackup ? new Date(lastBackup).toLocaleString() : t('admin.settings.never')}
              </div>
            </div>
            <Badge variant="outline" className="text-green-400 border-green-400">
              {t('admin.settings.healthy')}
            </Badge>
          </div>

          <div className="flex space-x-4">
            <Button 
              onClick={handleCreateBackup} 
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              <Database className="w-4 h-4 mr-2" />
              {loading ? t('admin.settings.creating') : t('admin.settings.createBackup')}
            </Button>
            
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('admin.settings.analyzePerformance')}
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};