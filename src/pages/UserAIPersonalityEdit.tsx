import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { buildApiUrl } from '@/config';
import { 
  ArrowLeft, 
  Save, 
  Brain, 
  User, 
  MessageSquare, 
  FileText, 
  CheckCircle2, 
  XCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useTranslation } from '@/resources/i18n';
import { authenticatedFetch } from '@/utils/api';

const UserAIPersonalityEdit = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    detailed_analysis_prompt: '',
    is_active: true
  });

  const isEditing = !!id;

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      authenticatedFetch(buildApiUrl(`/personalities/${id}`))
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          return res.json();
        })
        .then(data => {
          setFormData({
            name: data.name || '',
            description: data.description || '',
            detailed_analysis_prompt: data.detailed_analysis_prompt || '',
            is_active: data.is_active ?? true
          });
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Error fetching personality:', error);
          toast.error(t('personality.loadError') || 'Failed to load personality');
          setIsLoading(false);
        });
    }
  }, [id, t]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Personality name is required');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Personality description is required');
      return;
    }

    setIsSaving(true);
    const payload = { ...formData };
    try {
      const url = id ? buildApiUrl(`/personalities/${id}`) : buildApiUrl('/personalities');
      const method = id ? 'PUT' : 'POST';
      const response = await authenticatedFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }
      toast.success(
        isEditing 
          ? t('personality.updateSuccess') || 'Personality updated successfully!'
          : t('personality.createSuccess') || 'Personality created successfully!'
      );
      navigate('/personalization');
    } catch (error) {
      console.error('Error saving personality:', error);
      toast.error(t('personality.saveError') || 'Failed to save personality');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/personalization');
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-3 text-blue-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-lg">Loading personality...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="w-full">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleCancel}
              className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
                <Brain className="w-8 h-8 text-pink-400" />
                <span>
                  {isEditing 
                    ? t('personality.editTitle') || 'Edit AI Personality'
                    : t('personality.createTitle') || 'Create AI Personality'
                  }
                </span>
              </h1>
              <p className="text-gray-400 mt-2">
                {isEditing 
                  ? 'Modify the AI personality configuration and behavior'
                  : 'Configure a new AI personality with custom prompts and settings'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant={formData.is_active ? "default" : "secondary"}
              className={`px-3 py-1 ${
                formData.is_active 
                  ? 'bg-green-600/20 text-green-400 border-green-600/30' 
                  : 'bg-gray-600/20 text-gray-400 border-gray-600/30'
              }`}
            >
              {formData.is_active ? (
                <>
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Active
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3 mr-1" />
                  Inactive
                </>
              )}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card className="bg-gray-800/80 border-gray-700 h-fit">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center space-x-2">
                  <User className="w-5 h-5 text-blue-400" />
                  <span>Basic Information</span>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Configure the personality identity and status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300 font-medium">
                    Personality Name *
                  </Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={(e) => updateFormData('name', e.target.value)}
                    placeholder="Enter personality name"
                    className="bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-300 font-medium">
                    Description *
                  </Label>
                  <Textarea 
                    id="description" 
                    value={formData.description} 
                    onChange={(e) => updateFormData('description', e.target.value)}
                    placeholder="Describe the personality characteristics and use case"
                    rows={6}
                    className="bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500 resize-none" 
                  />
                </div>

                <Separator className="bg-gray-700" />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="is_active" className="text-gray-300 font-medium">
                      Active Status
                    </Label>
                    <p className="text-sm text-gray-400">
                      Enable this personality for use in surveys
                    </p>
                  </div>
                  <Switch 
                    id="is_active" 
                    checked={formData.is_active} 
                    onCheckedChange={(checked) => updateFormData('is_active', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card className="bg-gray-800/80 border-gray-700 h-full">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                  <span>Prompt Configuration</span>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Define how this AI personality behaves in different contexts
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[calc(100vh-20rem)]">
                <div className="h-full flex flex-col gap-6">
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center space-x-2 mb-3">
                      <FileText className="w-4 h-4 text-green-400" />
                      <Label htmlFor="detailed_analysis_prompt" className="text-gray-300 font-medium text-base">
                        {t('personality.detailedAnalysis') || 'Detailed Analysis'}
                      </Label>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">
                      {t('personality.detailedAnalysisPlaceholder') || 'This prompt guides how the AI performs detailed analysis of survey data'}
                    </p>
                    <Textarea 
                      id="detailed_analysis_prompt" 
                      value={formData.detailed_analysis_prompt} 
                      onChange={(e) => updateFormData('detailed_analysis_prompt', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500 font-mono text-sm resize-none flex-1 min-h-0"
                      placeholder={t('personality.detailedAnalysisPlaceholder') || 'Enter the prompt that will guide detailed analysis...'}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <Button 
            variant="outline" 
            size="lg" 
            onClick={handleCancel}
            disabled={isSaving}
            className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white px-6"
          >
            Cancel
          </Button>
          <Button 
            size="lg" 
            onClick={handleSave} 
            disabled={isSaving || !formData.name.trim() || !formData.description.trim()}
            className="bg-blue-600 text-white hover:bg-blue-700 px-6 min-w-[120px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? 'Update' : 'Create'}
              </>
            )}
          </Button>
        </div>

        {(!formData.name.trim() || !formData.description.trim()) && (
          <div className="mt-4">
            <Card className="bg-amber-900/20 border-amber-700/50">
              <CardContent className="pt-4">
                <div className="flex items-center space-x-2 text-amber-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">
                    Please fill in all required fields (marked with *) before saving.
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserAIPersonalityEdit;
