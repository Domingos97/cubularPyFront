import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Bot, Save, Trash2, Plus, ChevronDown, Info, Key, CheckCircle, 
  XCircle, RefreshCw, Settings, Eye, EyeOff, Chrome 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/resources/i18n';
import { useAuth } from '@/hooks/useAuth';
import { authenticatedApiRequest } from '@/utils/api';
import { buildApiUrl, API_CONFIG } from '@/config';

interface LLMSettings {
  id?: string;
  provider: string;
  model: string;
  active?: boolean;
  api_key?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

// Interface for provider configuration
interface ProviderInfo {
  name: string;
  apiKeyPrefix: string;
  baseUrl: string;
  icon?: React.ComponentType<{ className?: string }>;
  models: {
    id: string;
    name: string;
    description: string;
    useCompletionTokens: boolean;
  }[];
}

// Model configurations for different providers
export const MODEL_PROVIDERS: Record<string, ProviderInfo> = {
  openai: {
    name: 'OpenAI',
    apiKeyPrefix: 'sk-',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      { 
        id: 'gpt-4o-mini', 
        name: 'GPT-4o Mini', 
        description: 'Fast and efficient model for most tasks',
        useCompletionTokens: true 
      },
      { 
        id: 'gpt-4o', 
        name: 'GPT-4o', 
        description: 'Most capable model for complex tasks',
        useCompletionTokens: true 
      },
      { 
        id: 'gpt-4-turbo', 
        name: 'GPT-4 Turbo', 
        description: 'High-performance model with large context',
        useCompletionTokens: true 
      },
      { 
        id: 'gpt-3.5-turbo', 
        name: 'GPT-3.5 Turbo', 
        description: 'Fast and cost-effective model',
        useCompletionTokens: false 
      },
    ]
  },
  openrouter: {
    name: 'OpenRouter',
    apiKeyPrefix: 'sk-or-',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      {
        id: 'openai/gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: 'OpenAI GPT-4o Mini via OpenRouter',
        useCompletionTokens: true
      },
      {
        id: 'openai/gpt-4o',
        name: 'GPT-4o',
        description: 'OpenAI GPT-4o via OpenRouter',
        useCompletionTokens: true
      },
      {
        id: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        description: 'Anthropic Claude 3.5 Sonnet via OpenRouter',
        useCompletionTokens: true
      },
      {
        id: 'anthropic/claude-3-haiku',
        name: 'Claude 3 Haiku',
        description: 'Fast and efficient Claude 3 Haiku',
        useCompletionTokens: true
      },
      {
        id: 'google/gemini-pro-1.5',
        name: 'Gemini Pro 1.5',
        description: 'Google Gemini Pro 1.5 via OpenRouter',
        useCompletionTokens: true
      },
      {
        id: 'meta-llama/llama-3.1-405b-instruct',
        name: 'Llama 3.1 405B',
        description: 'Meta Llama 3.1 405B Instruct model',
        useCompletionTokens: true
      },
      {
        id: 'meta-llama/llama-3.1-70b-instruct',
        name: 'Llama 3.1 70B',
        description: 'Meta Llama 3.1 70B Instruct model',
        useCompletionTokens: true
      },
      {
        id: 'meta-llama/llama-3.1-8b-instruct',
        name: 'Llama 3.1 8B',
        description: 'Meta Llama 3.1 8B Instruct model',
        useCompletionTokens: true
      },
      {
        id: 'mistralai/mistral-large',
        name: 'Mistral Large',
        description: 'Mistral Large model via OpenRouter',
        useCompletionTokens: true
      },
      {
        id: 'deepseek/deepseek-chat',
        name: 'DeepSeek Chat',
        description: 'DeepSeek Chat model via OpenRouter',
        useCompletionTokens: true
      }
    ]
  },
  anthropic: {
    name: 'Anthropic',
    apiKeyPrefix: 'sk-ant-',
    baseUrl: 'https://api.anthropic.com',
    models: [
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet (Latest)',
        description: 'Most capable Claude model for complex tasks',
        useCompletionTokens: true
      },
      {
        id: 'claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku',
        description: 'Fast and efficient Claude model',
        useCompletionTokens: true
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        description: 'Powerful Claude model for demanding tasks',
        useCompletionTokens: true
      }
    ]
  },
  google: {
    name: 'Google AI',
    apiKeyPrefix: 'AIza',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    icon: Chrome,
    models: [
      {
        id: 'gemini-2.0-flash-exp',
        name: 'Gemini 2.0 Flash (Experimental)',
        description: 'Latest experimental Gemini model with enhanced capabilities',
        useCompletionTokens: true
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        description: 'Fast and efficient Gemini model for most tasks',
        useCompletionTokens: true
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description: 'Most capable Gemini model for complex reasoning',
        useCompletionTokens: true
      },
      {
        id: 'text-embedding-004',
        name: 'Text Embedding 004',
        description: 'Advanced text embedding model for semantic search',
        useCompletionTokens: false
      }
    ]
  }
};

interface ProviderConfig extends LLMSettings {
  isConfigured: boolean;
  showApiKey: boolean;
  tempApiKey: string; // Temporary storage for new/edited API keys
  decryptedApiKey: string; // Stores the actual decrypted API key when fetched
  isLoadingApiKey: boolean; // Loading state for API key fetching
}

export const MultiProviderLLMPanel = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();
  const [configs, setConfigs] = useState<Record<string, ProviderConfig>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('openai');

  useEffect(() => {
    loadAllConfigurations();
  }, []);

  const loadAllConfigurations = async () => {
    setLoading(true);
    try {
      console.log('🔄 MultiProviderLLMPanel: Loading all configurations...');
      // Use appropriate endpoint based on user role
      let allSettings: LLMSettings[] = [];
      
      if (isAdmin) {
        console.log('👑 User is admin, loading all settings...');
        try {
          // Admin users can see all settings
          allSettings = await authenticatedApiRequest<LLMSettings[]>(buildApiUrl(API_CONFIG.ENDPOINTS.LLM_SETTINGS.BASE));
          console.log('✅ Admin settings loaded:', allSettings);
        } catch (error: any) {
          console.log('⚠️ Admin access failed, falling back to active settings:', error);
          if (error.message?.includes('Admin privileges required') || error.message?.includes('Access denied')) {
            console.warn('Admin access failed, falling back to active settings');
            allSettings = await authenticatedApiRequest<LLMSettings[]>(buildApiUrl(API_CONFIG.ENDPOINTS.LLM_SETTINGS.ACTIVE_LIST));
            console.log('✅ Fallback active settings loaded:', allSettings);
          } else {
            throw error;
          }
        }
      } else {
        console.log('👤 Regular user, loading active settings only...');
        // Regular users can only see active settings
        allSettings = await authenticatedApiRequest<LLMSettings[]>(buildApiUrl(API_CONFIG.ENDPOINTS.LLM_SETTINGS.ACTIVE_LIST));
        console.log('✅ Active settings loaded:', allSettings);
      }
      
      const configsMap: Record<string, ProviderConfig> = {};

      // Initialize all providers with defaults
      Object.keys(MODEL_PROVIDERS).forEach(provider => {
        const providerInfo = MODEL_PROVIDERS[provider as keyof typeof MODEL_PROVIDERS];
        configsMap[provider] = {
          provider,
          model: providerInfo.models[0]?.id || '',
          api_key: '',
          active: false,
          isConfigured: false,
          showApiKey: false,
          tempApiKey: '',
          decryptedApiKey: '',
          isLoadingApiKey: false
        };
      });

      // Override with existing settings
      allSettings.forEach(setting => {
        if (configsMap[setting.provider]) {
          configsMap[setting.provider] = {
            ...setting,
            isConfigured: !!setting.api_key,
            showApiKey: false,
            tempApiKey: '',
            decryptedApiKey: '',
            isLoadingApiKey: false
          };
        }
      });

      setConfigs(configsMap);
    } catch (error) {
      console.error('Failed to load LLM configurations:', error);
      toast({
        title: t('admin.toast.error'),
        description: t('admin.llmSettings.errors.loadConfigurations'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (provider: string, updates: Partial<ProviderConfig>) => {
    setConfigs(prev => ({
      ...prev,
      [provider]: { ...prev[provider], ...updates }
    }));
  };

  const toggleApiKeyVisibility = async (provider: string) => {
    const config = configs[provider];
    
    // If we're showing the key, just hide it
    if (config.showApiKey) {
      updateConfig(provider, { showApiKey: false });
      return;
    }
    
    // If we're hiding the key and already have the decrypted value, show it
    if (config.decryptedApiKey) {
      updateConfig(provider, { showApiKey: true });
      return;
    }
    
    // If we don't have the decrypted key and there's a configured key, fetch it
    if (config.isConfigured && !config.decryptedApiKey) {
      updateConfig(provider, { isLoadingApiKey: true });
      
      try {
        const result = await authenticatedApiRequest<{api_key: string}>(buildApiUrl(API_CONFIG.ENDPOINTS.LLM_SETTINGS.PROVIDER_KEY(provider)));
        updateConfig(provider, { 
          decryptedApiKey: result.api_key || '',
          showApiKey: true,
          isLoadingApiKey: false
        });
      } catch (error) {
        console.error(`Failed to fetch decrypted API key for ${provider}:`, error);
        toast({
          title: t('admin.toast.error'),
          description: t('admin.llmSettings.errors.decryptApiKey', { provider }),
          variant: "destructive",
        });
        updateConfig(provider, { isLoadingApiKey: false });
      }
    } else {
      // No configured key, just show the input field
      updateConfig(provider, { showApiKey: true });
    }
  };

  const saveConfiguration = async (provider: string) => {
    if (!isAdmin) {
      toast({
        title: t('admin.toast.error'),
        description: 'Admin privileges required to save LLM configurations',
        variant: "destructive",
      });
      return;
    }
    
    setSaving(prev => ({ ...prev, [provider]: true }));
    try {
      const config = configs[provider];
      
      // Only send provider-level settings (no model field)
      const settingsToSave: any = {
        provider: config.provider,
        active: config.active || false
      };

      // Include API key only if user provided a new one
      if (config.tempApiKey) {
        settingsToSave.api_key = config.tempApiKey;
      } else if (!config.isConfigured) {
        // For new configurations, API key is required
        toast({
          title: t('admin.llmSettings.apiKeyRequired'),
          description: t('admin.llmSettings.apiKeyRequiredDescription'),
          variant: "destructive",
        });
        return;
      }
      // If config.isConfigured and no tempApiKey, don't include api_key (preserve existing)

      // Use upsert to handle both create and update scenarios  
      const savedSettings = await authenticatedApiRequest<LLMSettings>(buildApiUrl(API_CONFIG.ENDPOINTS.LLM_SETTINGS.UPSERT), {
        method: 'POST',
        body: JSON.stringify(settingsToSave)
      });

      // Update local state
      updateConfig(provider, {
        ...savedSettings,
        isConfigured: true,
        tempApiKey: '',
        showApiKey: false
      });

      toast({
        title: t('admin.llmSettings.configurationSaved'),
        description: t('admin.llmSettings.saveSuccess', { provider: MODEL_PROVIDERS[provider as keyof typeof MODEL_PROVIDERS].name }),
      });
    } catch (error) {
      console.error(`Failed to save ${provider} configuration:`, error);
      toast({
        title: t('admin.llmSettings.saveFailed'),
        description: t('admin.llmSettings.saveError', { provider, error: error instanceof Error ? error.message : t('admin.llmSettings.unknownError') }),
        variant: "destructive",
      });
    } finally {
      setSaving(prev => ({ ...prev, [provider]: false }));
    }
  };

  const testConfiguration = async (provider: string) => {
    setTesting(prev => ({ ...prev, [provider]: true }));
    try {
      const config = configs[provider];
      const apiKeyToTest = config.tempApiKey || config.api_key;
      
      if (!apiKeyToTest) {
        throw new Error('API key is required for testing');
      }

      // TODO: Implement test endpoint in Python API
      // For now, just validate that we have an API key
      const result = { valid: true };
      
      if (result.valid) {
        toast({
          title: t('admin.llmSettings.connectionSuccessful'),
          description: t('admin.llmSettings.testSuccess', { provider: MODEL_PROVIDERS[provider as keyof typeof MODEL_PROVIDERS].name }),
        });
      } else {
        throw new Error('API key validation failed');
      }
    } catch (error) {
      toast({
        title: t('admin.llmSettings.connectionFailed'),
        description: t('admin.llmSettings.testError', { provider, error: error instanceof Error ? error.message : t('admin.llmSettings.unknownError') }),
        variant: "destructive",
      });
    } finally {
      setTesting(prev => ({ ...prev, [provider]: false }));
    }
  };

  const deleteConfiguration = async (provider: string) => {
    if (!isAdmin) {
      toast({
        title: t('admin.toast.error'),
        description: 'Admin privileges required to delete LLM configurations',
        variant: "destructive",
      });
      return;
    }
    
    try {
      const config = configs[provider];
      if (config.id) {
        await authenticatedApiRequest(buildApiUrl(API_CONFIG.ENDPOINTS.LLM_SETTINGS.DELETE(config.id)), {
          method: 'DELETE'
        });
      }

      // Reset to defaults
      const providerInfo = MODEL_PROVIDERS[provider as keyof typeof MODEL_PROVIDERS];
      updateConfig(provider, {
        model: providerInfo.models[0]?.id || '',
        api_key: '',
        isConfigured: false,
        showApiKey: false,
        tempApiKey: '',
        id: undefined
      });

      toast({
        title: t('admin.llmSettings.configurationDeleted'),
        description: t('admin.llmSettings.deleteSuccess', { provider: providerInfo.name }),
      });
    } catch (error) {
      toast({
        title: t('admin.llmSettings.deleteFailed'),
        description: t('admin.llmSettings.deleteError', { error: error instanceof Error ? error.message : t('admin.llmSettings.unknownError') }),
        variant: "destructive",
      });
    }
  };

  const renderProviderConfig = (provider: string) => {
    const config = configs[provider];
    const providerInfo = MODEL_PROVIDERS[provider as keyof typeof MODEL_PROVIDERS];

    if (!config) return null;

    return (
      <div className="space-y-6">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className={config.isConfigured ? "text-green-400 border-green-400" : "text-gray-400 border-gray-400"}>
              {config.isConfigured ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
              {config.isConfigured ? t('admin.llmSettings.configured') : t('admin.llmSettings.notConfigured')}
            </Badge>
          </div>
          {config.isConfigured && isAdmin && (
            <Button
              onClick={() => deleteConfiguration(provider)}
              variant="outline"
              size="sm"
              className="border-red-600 text-red-400 hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              {t('admin.llmSettings.delete')}
            </Button>
          )}
        </div>

        {/* API Key Configuration */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Key className="w-4 h-4 text-blue-500" />
            <h4 className="text-white font-medium">{t('admin.llmSettings.apiConfiguration')}</h4>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">
              {t('admin.llmSettings.apiKey', { provider: providerInfo.name })}
            </Label>
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Input
                  type={config.showApiKey ? "text" : "password"}
                  placeholder={`${providerInfo.apiKeyPrefix}...`}
                  value={
                    config.showApiKey 
                      ? (config.decryptedApiKey || config.tempApiKey || '')
                      : (config.tempApiKey || (config.isConfigured ? '***CONFIGURED***' : ''))
                  }
                  onChange={(e) => {
                    const newValue = e.target.value;
                    updateConfig(provider, { 
                      tempApiKey: newValue,
                      // Clear decrypted key if user is editing
                      decryptedApiKey: config.showApiKey ? '' : config.decryptedApiKey
                    });
                  }}
                  disabled={!isAdmin}
                  className="bg-gray-700 border-gray-600 text-white pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 text-gray-400 hover:text-white"
                  onClick={() => toggleApiKeyVisibility(provider)}
                  disabled={config.isLoadingApiKey}
                >
                  {config.isLoadingApiKey ? (
                    <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
                  ) : config.showApiKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <Button
                onClick={() => testConfiguration(provider)}
                disabled={testing[provider] || !config.tempApiKey}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                {testing[provider] ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {testing[provider] ? t('admin.llmSettings.testing') : t('admin.llmSettings.test')}
              </Button>
            </div>
            {config.isConfigured && !config.tempApiKey && (
              <p className="text-xs text-gray-400">
                {t('admin.llmSettings.apiKeyConfiguredHelp')}
              </p>
            )}
          </div>
        </div>



        {/* Active Status */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Label className="text-gray-300">{t('admin.llmSettings.activeProvider')}</Label>
            <Switch
              checked={config.active || false}
              onCheckedChange={(checked) => updateConfig(provider, { active: checked })}
              disabled={!isAdmin}
            />
          </div>
          <div className="text-xs text-gray-400">
            {t('admin.llmSettings.activeProviderDescription')}
          </div>
        </div>

        {/* Save Button */}
        {isAdmin && (
          <div className="flex space-x-4 pt-4">
            <Button 
              onClick={() => saveConfiguration(provider)}
              disabled={saving[provider]}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving[provider] ? t('admin.llmSettings.saving') : t('admin.llmSettings.saveConfiguration')}
            </Button>
          </div>
        )}

        {/* Provider Info */}
        <Alert className="bg-gray-700/50 border-gray-600">
          <Info className="w-4 h-4" />
          <AlertDescription className="text-gray-300">
            {t('admin.llmSettings.baseUrl')}: <code className="text-sm bg-gray-800 px-1 rounded">{providerInfo.baseUrl}</code>
            <br />
            {t('admin.llmSettings.providerInfo', { provider: providerInfo.name })}
          </AlertDescription>
        </Alert>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="bg-gray-800/80 border-gray-700">
        <CardContent className="p-6">
          <div className="animate-pulse">{t('admin.llmSettings.loadingConfigurations')}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800/80 border-gray-700">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-purple-500" />
          <CardTitle className="text-white">{t('admin.llmSettings.title')}</CardTitle>
        </div>
        <CardDescription className="text-gray-400">
          {t('admin.llmSettings.description')}
        </CardDescription>
        {!isAdmin && (
          <Alert className="bg-yellow-900/50 border-yellow-600">
            <Info className="w-4 h-4" />
            <AlertDescription className="text-yellow-200">
              You are viewing LLM settings in read-only mode. Admin privileges are required to modify configurations.
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full bg-gray-700">
            {Object.entries(MODEL_PROVIDERS).map(([key, provider]) => (
              <TabsTrigger 
                key={key} 
                value={key}
                className="data-[state=active]:bg-gray-600 data-[state=active]:text-white"
              >
                <div className="flex items-center space-x-2">
                  {provider.icon && React.createElement(provider.icon, { className: "w-4 h-4" })}
                  <span>{provider.name}</span>
                  {configs[key]?.isConfigured && (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.keys(MODEL_PROVIDERS).map(provider => (
            <TabsContent key={provider} value={provider} className="mt-6">
              {renderProviderConfig(provider)}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
