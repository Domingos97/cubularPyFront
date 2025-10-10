import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { llmSettingsAPI, LLMSettings } from '@/lib/llmSettingsAPI';
import { useToast } from '@/hooks/use-toast';

export const LLMSettingsTest = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<LLMSettings | null>(null);

  const testLoadSettings = async () => {
    setLoading(true);
    try {
      const loadedSettings = await llmSettingsAPI.getLLMSettingByProvider('openai');
      setSettings(loadedSettings);
      toast({
        title: "Load Success",
        description: `Loaded settings: ${loadedSettings ? 'Found existing' : 'No settings found'}`,
      });
    } catch (error) {
      toast({
        title: "Load Error",
        description: `Failed to load: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testSaveSettings = async () => {
    setLoading(true);
    try {
      const testData: Omit<LLMSettings, 'id' | 'created_at' | 'updated_at' | 'created_by'> = {
        provider: 'openai',
        model: 'gpt-4o-mini'
      };

      const savedSettings = await llmSettingsAPI.upsertLLMSetting(testData);
      setSettings(savedSettings);
      toast({
        title: "Save Success",
        description: `Settings saved with ID: ${savedSettings.id}`,
      });
    } catch (error) {
      toast({
        title: "Save Error",
        description: `Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testGetAllSettings = async () => {
    setLoading(true);
    try {
      const allSettings = await llmSettingsAPI.getLLMSettings();
      toast({
        title: "Get All Success",
        description: `Found ${allSettings.length} settings`,
      });
    } catch (error) {
      toast({
        title: "Get All Error",
        description: `Failed to get all: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gray-800/80 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">LLM Settings API Test</CardTitle>
        <CardDescription className="text-gray-400">
          Test the LLM settings API integration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Button 
            onClick={testLoadSettings} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Loading...' : 'Load Settings'}
          </Button>
          
          <Button 
            onClick={testSaveSettings} 
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Saving...' : 'Save Test Settings'}
          </Button>
          
          <Button 
            onClick={testGetAllSettings} 
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? 'Loading...' : 'Get All Settings'}
          </Button>
        </div>

        {settings && (
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <h4 className="text-white font-medium mb-2">Current Settings:</h4>
            <pre className="text-gray-300 text-sm overflow-auto">
              {JSON.stringify(settings, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};