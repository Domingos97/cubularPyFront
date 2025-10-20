import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Save, 
  RotateCcw, 
  Info, 
  Settings,
  Database,
  Search,
  MessageSquare,
  Lightbulb
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/resources/i18n';
import { authenticatedApiRequest } from '@/utils/api';
import { API_CONFIG, buildApiUrl } from '@/config';

interface ModuleConfiguration {
  id: string;
  module_name: string;
  llm_setting_id: string;
  model: string; // Now stored directly in module_configurations
  temperature?: number;
  max_tokens?: number;
  max_completion_tokens?: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  ai_personality_id?: string;
  llm_settings?: {
    id: string;
    provider: string;
    api_key_configured: boolean;
  }; // model field removed from llm_settings
  ai_personality?: {
    name: string;
    detailed_analysis_prompt: string;
  };
}

interface LlmSetting {
  id: string;
  provider: string;
  active: boolean;
}

interface Module {
  name: string;
  display_name: string;
  description: string;
}

const DEFAULT_CONFIGURATION = {
  temperature: 0.7,
  max_tokens: 1000,
  active: true,
  ai_personality_id: 'none'
};

const MODULE_ICONS: Record<string, React.ReactNode> = {
  'semantic_search_engine': <Search className="w-5 h-5" />,
  'ai_chat_integration': <MessageSquare className="w-5 h-5" />,
  'survey_suggestions_generation': <Lightbulb className="w-5 h-5" />,
  'survey_builder': <Settings className="w-5 h-5" />
};

export const ModelConfigurationPanel = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [configurations, setConfigurations] = useState<ModuleConfiguration[]>([]);
  const [llmSettings, setLlmSettings] = useState<LlmSetting[]>([]);
  const [personalities, setPersonalities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState<string>('ai_chat_integration');
  const [expandedConfigs, setExpandedConfigs] = useState<Set<string>>(new Set());

  // Form states for each module
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Static modules definition since we removed the backend endpoint
  const modules: Module[] = [
    {
      name: 'semantic_search_engine', 
      display_name: 'Semantic Search Engine',
      description: 'AI model for semantic search and embeddings'
    },
    {
      name: 'ai_chat_integration',
      display_name: 'AI Chat Integration',
      description: 'AI model for chat and conversation features'
    },
    {
      name: 'survey_suggestions_generation',
      display_name: 'Survey Suggestions Generation',
      description: 'AI model for generating survey analysis suggestions and insights'
    },
    {
      name: 'survey_builder',
      display_name: 'Survey Builder',
      description: 'AI model for building surveys through conversation'
    }
  ];

  useEffect(() => {
    loadData();
  }, []);

  // Reinitialize form data when llmSettings or configurations change
  useEffect(() => {
    if (llmSettings.length > 0 && configurations.length >= 0) {
      initializeFormData(configurations);
    }
  }, [llmSettings, configurations]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadLlmSettings(),
        loadPersonalities(),
        loadConfigurations()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadLlmSettings = async () => {
    try {
      console.log('🔄 Loading LLM settings...');
      const data = await authenticatedApiRequest<LlmSetting[]>(buildApiUrl(API_CONFIG.ENDPOINTS.LLM_SETTINGS.BASE));
      console.log('✅ LLM settings loaded:', data);
      setLlmSettings(data || []);
      console.log('✅ LLM settings state updated:', data?.length || 0, 'items');
    } catch (error) {
      console.error('❌ Error loading LLM settings:', error);
      toast({
        title: t('admin.toast.error'),
        description: t('admin.aiModels.errors.loadLlmSettings'),
        variant: "destructive",
      });
    }
  };

  const loadPersonalities = async () => {
    try {
      const data = await authenticatedApiRequest<any[]>(buildApiUrl(API_CONFIG.ENDPOINTS.PERSONALITIES));
      setPersonalities(data || []);
    } catch (error) {
      console.error('Error loading personalities:', error);
      toast({
        title: t('admin.toast.error'),
        description: t('admin.aiModels.errors.loadPersonalities'),
        variant: "destructive",
      });
    }
  };

  const loadConfigurations = async () => {
    try {
      console.log('🔄 Loading module configurations...');
      const data = await authenticatedApiRequest<ModuleConfiguration[]>(buildApiUrl(API_CONFIG.ENDPOINTS.MODULE_CONFIGURATIONS.BASE));
      console.log('✅ Module configurations loaded:', data);
      
      setConfigurations(data || []);
      console.log('✅ Module configurations state updated:', data?.length || 0, 'items');
      
      // Initialize form data with existing configurations or defaults
      // This will be called again after modules are loaded to ensure proper initialization
      initializeFormData(data || []);
    } catch (error) {
      console.error('❌ Error loading configurations:', error);
      toast({
        title: t('admin.toast.error'),
        description: t('admin.aiModels.errors.loadConfigurations'),
        variant: "destructive",
      });
    }
  };

  // Separate function to initialize form data
  const initializeFormData = (configurations: ModuleConfiguration[]) => {
    const newFormData: Record<string, any> = {};
    
    modules.forEach(module => {
      const existingConfig = configurations.find(
        (config: ModuleConfiguration) => config.module_name === module.name
      );
      
      if (existingConfig) {
        // Use existing configuration from database
        // The backend returns only llm_setting_id (no nested llm_settings), so resolve provider from loaded llmSettings
        const providerFromSetting = getLlmSettingById(existingConfig.llm_setting_id || '')?.provider || 'openai';
        const normalizedModel = findBestModelForProvider(providerFromSetting, module.name, existingConfig.model);

        newFormData[module.name] = {
          ...existingConfig,
          // Provider comes from the linked LLM setting, model comes from module_configurations
          provider: providerFromSetting,
          model: normalizedModel || getDefaultModelForModule(module.name),
          // Ensure ai_personality_id uses 'none' for display if null/undefined
          ai_personality_id: existingConfig.ai_personality_id || 'none'
        };
      } else {
        // Use defaults for new configurations with first available LLM setting
        const defaultLlmSetting = getDefaultLlmSettingForModule(module.name);
        newFormData[module.name] = {
          ...DEFAULT_CONFIGURATION,
          module_name: module.name,
          provider: defaultLlmSetting?.provider || 'openai',
          model: getDefaultModelForModule(module.name),
          llm_setting_id: defaultLlmSetting?.id || '',
          ai_personality_id: 'none'
        };
      }
    });
    
    setFormData(newFormData);
  };

  const getDefaultModelForModule = (moduleName: string): string => {
    const defaults: Record<string, string> = {
      'survey_suggestions_generation': 'gpt-4o-mini',
      'semantic_search_engine': 'text-embedding-3-small',
      'ai_chat_integration': 'gpt-4o'
    };
    return defaults[moduleName] || 'gpt-4o-mini';
  };

  const getDefaultLlmSettingForModule = (moduleName: string): LlmSetting | undefined => {
    // Since LlmSetting no longer has model, we just find by provider
    const defaultProvider = 'openai'; // Default to OpenAI
    
    return llmSettings.find(setting => 
      setting.provider === defaultProvider
    ) || (llmSettings.length > 0 ? llmSettings[0] : undefined);
  };

  // Get unique providers from LLM settings
  const getAvailableProviders = (): string[] => {
    const providers = [...new Set(llmSettings.map(setting => setting.provider))];
    return providers.sort();
  };

  // Get providers to show for a specific module (hide openrouter for semantic search since it
  // doesn't provide native embeddings in our config)
  const getProvidersForModule = (moduleName: string): string[] => {
    const providers = getAvailableProviders();
    if (moduleName === 'semantic_search_engine') {
      return providers.filter(p => p !== 'openrouter');
    }
    return providers;
  };

  // Hardcoded model lists per provider
  const getProviderModels = (provider: string): { chat: string[], embeddings: string[] } => {
    const modelLists: Record<string, { chat: string[], embeddings: string[] }> = {
      'openai': {
        chat: [
          'gpt-4o',
          'gpt-4o-mini', 
          'gpt-4-turbo',
          'gpt-4',
          'gpt-3.5-turbo',
          'gpt-3.5-turbo-16k'
        ],
        embeddings: [
          'text-embedding-3-large',
          'text-embedding-3-small',
          'text-embedding-ada-002'
        ]
      },
      'anthropic': {
        chat: [
          'claude-3-5-sonnet-20241022',
          'claude-3-5-haiku-20241022',
          'claude-3-opus-20240229',
          'claude-3-sonnet-20240229',
          'claude-3-haiku-20240307'
        ],
        embeddings: [] // Anthropic doesn't offer embedding models directly
      },
      'openrouter': {
        chat: [
          'openai/gpt-4o',
          'openai/gpt-4o-mini',
          'anthropic/claude-3.5-sonnet',
          'meta-llama/llama-3.1-70b-instruct',
          'meta-llama/llama-3.1-8b-instruct',
          'google/gemini-pro-1.5',
          'mistralai/mixtral-8x7b-instruct',
          'cohere/command-r-plus'
        ],
        embeddings: [
          'openai/text-embedding-3-large',
          'openai/text-embedding-3-small',
          'openai/text-embedding-ada-002',
          'sentence-transformers/all-MiniLM-L6-v2',
          'BAAI/bge-large-en-v1.5',
          'BAAI/bge-base-en-v1.5',
          'thenlper/gte-large',
          'voyage-ai/voyage-large-2'
        ]
      },
      'cohere': {
        chat: [
          'command-r-plus',
          'command-r',
          'command',
          'command-light'
        ],
        embeddings: [
          'embed-english-v3.0',
          'embed-multilingual-v3.0',
          'embed-english-v2.0'
        ]
      },
      'google': {
        chat: [
          'gemini-1.5-pro',
          'gemini-1.5-flash',
          'gemini-pro'
        ],
        embeddings: [
          'text-embedding-004',
          'textembedding-gecko'
        ]
      }
    };
    
    return modelLists[provider] || { chat: [], embeddings: [] };
  };

  // Get models for a specific provider, filtered by module type
  const getAvailableModels = (provider: string, moduleName: string): string[] => {
    const providerModels = getProviderModels(provider);
    
    if (moduleName === 'semantic_search_engine') {
      return providerModels.embeddings.sort();
    } else {
      return providerModels.chat.sort();
    }
  };

  // Helpers to handle mixed model naming formats (e.g. "openai/gpt-4o-mini" vs "gpt-4o-mini")
  const splitModelString = (modelStr?: string) => {
    if (!modelStr) return { provider: null as string | null, name: '' };
    const parts = modelStr.split('/');
    if (parts.length > 1) {
      return { provider: parts[0], name: parts.slice(1).join('/') };
    }
    return { provider: null as string | null, name: modelStr };
  };

  const findBestModelForProvider = (provider: string, moduleName: string, storedModel?: string) => {
    const available = getAvailableModels(provider, moduleName) || [];
    if (!storedModel) return available[0] || '';

    // Exact match first
    if (available.includes(storedModel)) return storedModel;

    const parsed = splitModelString(storedModel);

    // If storedModel was stored as 'provider/name' and provider matches -> use the name
    if (parsed.provider && parsed.provider === provider && parsed.name) {
      // The dropdown for this provider may list either 'name' or 'provider/name'
      if (available.includes(parsed.name)) return parsed.name;
      const prefixed = `${parsed.provider}/${parsed.name}`;
      if (available.includes(prefixed)) return prefixed;
      return parsed.name;
    }

    // Try to match by right-most segment: some providers (like openrouter) list entries as 'provider/name'
    const rightPart = parsed.name || storedModel;
    const byRight = available.find(m => m.split('/').pop() === rightPart);
    if (byRight) return byRight;

    // Fallback to stored value (so it still gets saved back) or first available
    return available[0] || storedModel || '';
  };

  // Find LLM setting ID based on provider (model is now stored separately)
  const findLlmSettingId = (provider: string, model: string): string => {
    // Find setting by provider only since model is no longer in llm_settings
    const setting = llmSettings.find(s => s.provider === provider);
    
    return setting?.id || '';
  };

  // Check if a provider is configured (regardless of model)
  const isProviderConfigured = (provider: string): boolean => {
    return llmSettings.some(s => s.provider === provider);
  };

  // Get status for a provider (not specific to model)
  const getProviderStatus = (provider: string): { configured: boolean, active: boolean } => {
    const providerSettings = llmSettings.filter(s => s.provider === provider);
    const hasActiveSetting = providerSettings.some(s => s.active);
    
    return {
      configured: providerSettings.length > 0,
      active: hasActiveSetting
    };
  };

  // Get status for a specific provider/model combination
  const getModelStatus = (provider: string, model: string): { configured: boolean, active: boolean, needsModelSetup: boolean } => {
    const providerMatch = llmSettings.find(s => s.provider === provider);
    
    if (providerMatch) {
      return {
        configured: true,
        active: providerMatch.active,
        needsModelSetup: false // Provider exists, model is handled separately
      };
    } else {
      return {
        configured: false,
        active: false,
        needsModelSetup: false
      };
    }
  };

  // Update provider and automatically select appropriate model
  const updateProvider = (moduleName: string, provider: string) => {
    const currentModel = getCurrentModuleConfig(moduleName).model;
    const newModel = findBestModelForProvider(provider, moduleName, currentModel);
    const llmSettingId = findLlmSettingId(provider, newModel);

    updateFormData(moduleName, 'provider', provider);
    updateFormData(moduleName, 'model', newModel);
    updateFormData(moduleName, 'llm_setting_id', llmSettingId);
  };

  // Update model and find corresponding LLM setting
  const updateModel = (moduleName: string, model: string) => {
    const provider = getCurrentModuleConfig(moduleName).provider;
    const llmSettingId = findLlmSettingId(provider, model);
    
    updateFormData(moduleName, 'model', model);
    updateFormData(moduleName, 'llm_setting_id', llmSettingId);
  };

  const updateFormData = (moduleName: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [moduleName]: {
        ...prev[moduleName],
        [field]: value
      }
    }));
  };

  const updatePersonality = (moduleName: string, personalityId: string | null) => {
    setFormData(prev => ({
      ...prev,
      [moduleName]: {
        ...prev[moduleName],
        ai_personality_id: personalityId
      }
    }));
  };

  const saveConfiguration = async (moduleName: string) => {
    try {
      setSaving(moduleName);

      const config = formData[moduleName];
      
      // Validation: Check if model type matches module requirements
      if (moduleName === 'semantic_search_engine') {
        const providerModels = getProviderModels(config.provider || 'openai');
        const isEmbedding = providerModels.embeddings.includes(config.model || '');
        
        if (!isEmbedding) {
          throw new Error('Semantic Search Engine requires an embedding model. Please select an embedding model from the dropdown.');
        }
      }
      
      // Recompute LLM setting id from selected provider/model to ensure provider changes persist
      const computedLlmSettingId = findLlmSettingId(config.provider || '', config.model || '');

      // Check if provider is configured (model doesn't need to be)
      if (!isProviderConfigured(config.provider || '')) {
        throw new Error(`Provider "${config.provider}" is not configured in LLM Settings. Please add this provider first.`);
      }

      // Ensure we have a valid LLM setting ID (computed) and model
      if (!computedLlmSettingId) {
        throw new Error('Please select a valid AI model configuration.');
      }

      if (!config.model) {
        throw new Error('Please select a model.');
      }

      const payload = {
        module_name: config.module_name,
        // Use recomputed llm_setting_id so changing provider updates module configuration
        llm_setting_id: computedLlmSettingId,
        model: config.model, // Now required field
        temperature: config.temperature,
        max_tokens: config.max_tokens,
        max_completion_tokens: config.max_completion_tokens,
        ai_personality_id: config.ai_personality_id === 'none' ? null : config.ai_personality_id
      };

      const data = await authenticatedApiRequest<ModuleConfiguration>(buildApiUrl(API_CONFIG.ENDPOINTS.MODULE_CONFIGURATIONS.BASE), {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      // Update local state
      setConfigurations(prev => {
        const existingIndex = prev.findIndex(config => 
          config.module_name === moduleName
        );
        
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = data;
          return updated;
        } else {
          return [...prev, data];
        }
      });

      // Ensure formData reflects the llm_setting_id (use returned value or computed one)
      setFormData(prev => ({
        ...prev,
        [moduleName]: {
          ...prev[moduleName],
          llm_setting_id: data.llm_setting_id || payload.llm_setting_id,
          model: data.model || payload.model
        }
      }));

      toast({
        title: t('admin.toast.success'),
        description: t('admin.aiModels.saveSuccess', { module: modules.find(m => m.name === moduleName)?.display_name }),
      });
    } catch (error: any) {
      console.error('Error saving configuration:', error);
      toast({
        title: t('admin.toast.error'),
        description: error.message || t('admin.aiModels.errors.saveConfiguration'),
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const resetConfiguration = (moduleName: string) => {
    const defaultLlmSetting = getDefaultLlmSettingForModule(moduleName);
    setFormData(prev => ({
      ...prev,
      [moduleName]: {
        ...DEFAULT_CONFIGURATION,
        module_name: moduleName,
        provider: defaultLlmSetting?.provider || 'openai',
        model: getDefaultModelForModule(moduleName),
        llm_setting_id: defaultLlmSetting?.id || ''
      }
    }));
  };

  // Helper function to get current module configuration
  const getCurrentModuleConfig = (moduleName: string) => {
    const config = formData[moduleName] || {
      ...DEFAULT_CONFIGURATION,
      module_name: moduleName,
      provider: 'openai',
      model: getDefaultModelForModule(moduleName),
      llm_setting_id: ''
    };
    return config;
  };

  // Helper function to get LLM setting details by ID
  const getLlmSettingById = (id: string): LlmSetting | undefined => {
    return llmSettings.find(setting => setting.id === id);
  };

  // Helper function to get display name for LLM setting
  const getLlmSettingDisplayName = (setting: LlmSetting): string => {
    return `${setting.provider}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-400">{t('admin.aiModels.loadingConfigurations')}</span>
      </div>
    );
  }

  if (llmSettings.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Alert className="bg-yellow-900/20 border-yellow-500/50">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-yellow-200">
            {t('admin.aiModels.noLlmSettings')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800/80 border-gray-700">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-500" />
            <CardTitle className="text-white">{t('admin.aiModels.title')}</CardTitle>
          </div>
          <CardDescription className="text-gray-400">
            {t('admin.aiModels.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeModule} onValueChange={setActiveModule} className="space-y-6">
            <TabsList className="grid grid-cols-3 w-full bg-gray-700/50">
              {modules.map((module) => (
                <TabsTrigger 
                  key={module.name} 
                  value={module.name}
                  className="data-[state=active]:bg-gray-600"
                >
                  <div className="flex items-center space-x-2">
                    {MODULE_ICONS[module.name]}
                    <span className="hidden sm:inline">{module.display_name}</span>
                    <span className="sm:hidden">{module.display_name.split(' ')[0]}</span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>

            {modules.map((module) => (
              <TabsContent key={module.name} value={module.name} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-white">{module.display_name}</h3>
                    <p className="text-sm text-gray-400">{module.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Provider Selection */}
                    <div className="space-y-2">
                      <Label className="text-gray-300">{t('admin.aiModels.provider')}</Label>
                      <Select
                        value={getCurrentModuleConfig(module.name).provider || 'openai'}
                        onValueChange={(value) => updateProvider(module.name, value)}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder={t('admin.aiModels.selectProvider')} />
                        </SelectTrigger>
                        <SelectContent>
                          {getProvidersForModule(module.name).map((provider) => (
                            <SelectItem key={provider} value={provider}>
                              <div className="flex items-center justify-between w-full">
                                <span className="capitalize">{provider}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Model Selection */}
                    <div className="space-y-2">
                      <Label className="text-gray-300">{t('admin.aiModels.model')}</Label>
                      <Select
                        value={getCurrentModuleConfig(module.name).model || ''}
                        onValueChange={(value) => updateModel(module.name, value)}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder={t('admin.aiModels.selectModel')} />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableModels(getCurrentModuleConfig(module.name).provider || 'openai', module.name).map((model) => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Temperature */}
                    <div className="space-y-3">
                      <Label className="text-gray-300">
                        {t('admin.aiModels.temperature')}: {getCurrentModuleConfig(module.name).temperature || 0.7}
                      </Label>
                      <Slider
                        value={[getCurrentModuleConfig(module.name).temperature || 0.7]}
                        onValueChange={([value]) => updateFormData(module.name, 'temperature', value)}
                        max={2}
                        min={0}
                        step={0.1}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500">
                        {t('admin.aiModels.temperatureDescription')}
                      </p>
                    </div>

                    {/* Max Tokens */}
                    <div className="space-y-2">
                      <Label className="text-gray-300">{t('admin.aiModels.maxTokens')}</Label>
                      <Input
                        type="number"
                        value={getCurrentModuleConfig(module.name).max_tokens || 1000}
                        onChange={(e) => updateFormData(module.name, 'max_tokens', parseInt(e.target.value))}
                        className="bg-gray-700 border-gray-600 text-white"
                        min={1}
                        max={32000}
                      />
                    </div>

                    {/* Max Completion Tokens */}
                    <div className="space-y-2">
                      <Label className="text-gray-300">{t('admin.aiModels.maxCompletionTokens')}</Label>
                      <Input
                        type="number"
                        value={getCurrentModuleConfig(module.name).max_completion_tokens || 500}
                        onChange={(e) => updateFormData(module.name, 'max_completion_tokens', parseInt(e.target.value))}
                        className="bg-gray-700 border-gray-600 text-white"
                        min={1}
                        max={8000}
                      />
                    </div>

                    {/* Active Status */}
                    <div className="flex items-center space-x-3 md:col-span-2">
                      <Switch
                        checked={getCurrentModuleConfig(module.name).active !== false}
                        onCheckedChange={(checked) => updateFormData(module.name, 'active', checked)}
                      />
                      <Label className="text-gray-300">{t('admin.aiModels.activeConfiguration')}</Label>
                    </div>

                    {/* Model filtering info */}
                    {module.name === 'semantic_search_engine' && (
                      <div className="md:col-span-2">
                        <Alert className="bg-blue-900/20 border-blue-500/50">
                          <Info className="h-4 w-4" />
                          <AlertDescription className="text-blue-200">
                            {t('admin.aiModels.semanticSearchInfo')}
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                    
                    {/* API key management note */}
                    <div className="md:col-span-2">
                      <Alert className="bg-gray-900/20 border-gray-600/50">
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-gray-400">
                          {t('admin.aiModels.apiKeyNote')}
                        </AlertDescription>
                      </Alert>
                    </div>

                    {/* AI Personality Selection */}
                    <div className="md:col-span-2">
                      <div className="space-y-2">
                        <Label className="text-gray-300">{t('admin.aiModels.aiPersonality')}</Label>
                        <Select
                          value={getCurrentModuleConfig(module.name).ai_personality_id || 'none'}
                          onValueChange={(value) => updatePersonality(module.name, value === 'none' ? null : value)}
                        >
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue placeholder={t('admin.aiModels.selectPersonality')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">{t('admin.aiModels.noPersonality')}</SelectItem>
                            {personalities.map((personality) => (
                              <SelectItem key={personality.id} value={personality.id}>
                                {personality.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {getCurrentModuleConfig(module.name).ai_personality_id && getCurrentModuleConfig(module.name).ai_personality_id !== 'none' && personalities.find(p => p.id === getCurrentModuleConfig(module.name).ai_personality_id) && (
                          <div className="mt-2 p-3 bg-gray-700/50 rounded-lg">
                            <div className="text-sm text-gray-300">
                              <strong>{t('admin.aiModels.selectedPersonality')}:</strong> {personalities.find(p => p.id === getCurrentModuleConfig(module.name).ai_personality_id)?.name}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {personalities.find(p => p.id === getCurrentModuleConfig(module.name).ai_personality_id)?.detailed_analysis_prompt?.substring(0, 100)}...
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => resetConfiguration(module.name)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      {t('admin.aiModels.reset')}
                    </Button>
                    <Button
                      onClick={() => saveConfiguration(module.name)}
                      disabled={saving === module.name}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {saving === module.name ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {saving === module.name ? t('admin.aiModels.saving') : t('admin.aiModels.saveConfiguration')}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          <Alert className="bg-blue-900/50 border-blue-700 mt-6">
            <Info className="w-4 h-4" />
            <AlertDescription className="text-blue-200">
              {t('admin.aiModels.finalNote')}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
