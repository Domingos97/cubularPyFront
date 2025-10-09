import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Languages, Save, X } from 'lucide-react';
import { useTranslation } from '@/resources/i18n';
import { 
  fetchPromptTranslations, 
  createPromptTranslation, 
  updatePromptTranslation, 
  deletePromptTranslation,
  fetchEnabledLanguages 
} from '@/utils/api';
import type { PromptTranslation, SupportedLanguage } from '@/types/language';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface PromptTranslationsManagerProps {
  personalityId: string;
  personalityName: string;
}

interface EditingTranslation {
  id?: string;
  language_code: string;
  prompt_type: string;
  prompt_text: string;
}

const PromptTranslationsManager: React.FC<PromptTranslationsManagerProps> = ({
  personalityId,
  personalityName,
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [translations, setTranslations] = useState<PromptTranslation[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<SupportedLanguage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTranslation, setEditingTranslation] = useState<EditingTranslation | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const promptTypes = [
    { value: 'system', label: 'System Prompt' },
    { value: 'suggestions', label: 'Suggestions Prompt' },
    { value: 'analysis', label: 'Analysis Prompt' },
    { value: 'greeting', label: 'Greeting Prompt' },
    { value: 'clarification', label: 'Clarification Prompt' },
  ];

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [translationsData, languagesData] = await Promise.all([
          fetchPromptTranslations(personalityId),
          fetchEnabledLanguages()
        ]);
        
        setTranslations(translationsData.translations);
        setAvailableLanguages(languagesData);
      } catch (error) {
        console.error('Failed to load prompt translations:', error);
        toast({
          title: 'Loading Error',
          description: 'Failed to load prompt translations. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [personalityId, toast]);

  // Get language name by code
  const getLanguageName = (code: string): string => {
    const language = availableLanguages.find(lang => lang.code === code);
    return language ? language.native_name : code;
  };

  // Get flag for language
  const getFlagForLanguage = (code: string): string => {
    const flagMap: Record<string, string> = {
      'en': '🇺🇸', 'es': '🇪🇸', 'pt': '🇵🇹', 'sv': '🇸🇪',
      'fr': '🇫🇷', 'de': '🇩🇪', 'it': '🇮🇹', 'ru': '🇷🇺',
      'zh': '🇨🇳', 'ja': '🇯🇵', 'ko': '🇰🇷', 'ar': '🇸🇦',
    };
    return flagMap[code] || '🌐';
  };

  // Handle create/edit translation
  const handleSaveTranslation = async () => {
    if (!editingTranslation) return;

    try {
      if (editingTranslation.id) {
        // Update existing translation
        const updated = await updatePromptTranslation(editingTranslation.id, {
          prompt_text: editingTranslation.prompt_text
        });
        setTranslations(prev => 
          prev.map(t => t.id === updated.id ? updated : t)
        );
        toast({
          title: 'Translation Updated',
          description: `Updated ${editingTranslation.prompt_type} prompt for ${getLanguageName(editingTranslation.language_code)}`
        });
      } else {
        // Create new translation
        const created = await createPromptTranslation({
          personality_id: personalityId,
          language_code: editingTranslation.language_code,
          prompt_type: editingTranslation.prompt_type,
          prompt_text: editingTranslation.prompt_text
        });
        setTranslations(prev => [...prev, created]);
        toast({
          title: 'Translation Created',
          description: `Created ${editingTranslation.prompt_type} prompt for ${getLanguageName(editingTranslation.language_code)}`
        });
      }
      
      setEditingTranslation(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save translation:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save prompt translation. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Handle delete translation
  const handleDeleteTranslation = async (translation: PromptTranslation) => {
    if (!confirm(`Delete ${translation.prompt_type} prompt for ${getLanguageName(translation.language_code)}?`)) {
      return;
    }

    try {
      await deletePromptTranslation(translation.id);
      setTranslations(prev => prev.filter(t => t.id !== translation.id));
      toast({
        title: 'Translation Deleted',
        description: `Deleted ${translation.prompt_type} prompt for ${getLanguageName(translation.language_code)}`
      });
    } catch (error) {
      console.error('Failed to delete translation:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete prompt translation. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Start editing a translation
  const startEditing = (translation?: PromptTranslation) => {
    if (translation) {
      setEditingTranslation({
        id: translation.id,
        language_code: translation.language_code,
        prompt_type: translation.prompt_type,
        prompt_text: translation.prompt_text
      });
    } else {
      setEditingTranslation({
        language_code: 'en',
        prompt_type: 'system',
        prompt_text: ''
      });
    }
    setIsDialogOpen(true);
  };

  // Group translations by prompt type
  const translationsByType = translations.reduce((acc, translation) => {
    if (!acc[translation.prompt_type]) {
      acc[translation.prompt_type] = [];
    }
    acc[translation.prompt_type].push(translation);
    return acc;
  }, {} as Record<string, PromptTranslation[]>);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Prompt Translations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="h-5 w-5" />
          Prompt Translations
        </CardTitle>
        <CardDescription>
          Manage AI prompts in different languages for {personalityName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {translations.length} translations across {Object.keys(translationsByType).length} prompt types
          </p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => startEditing()} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Translation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingTranslation?.id ? 'Edit Translation' : 'Add New Translation'}
                </DialogTitle>
                <DialogDescription>
                  {editingTranslation?.id 
                    ? 'Update the prompt text for this language and type combination'
                    : 'Create a new prompt translation for this AI personality'
                  }
                </DialogDescription>
              </DialogHeader>
              
              {editingTranslation && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Language</label>
                      <Select
                        value={editingTranslation.language_code}
                        onValueChange={(value) => 
                          setEditingTranslation(prev => prev ? {...prev, language_code: value} : null)
                        }
                        disabled={!!editingTranslation.id}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableLanguages.map(lang => (
                            <SelectItem key={lang.code} value={lang.code}>
                              <div className="flex items-center gap-2">
                                <span>{getFlagForLanguage(lang.code)}</span>
                                <span>{lang.native_name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Prompt Type</label>
                      <Select
                        value={editingTranslation.prompt_type}
                        onValueChange={(value) => 
                          setEditingTranslation(prev => prev ? {...prev, prompt_type: value} : null)
                        }
                        disabled={!!editingTranslation.id}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {promptTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Prompt Text</label>
                    <Textarea
                      value={editingTranslation.prompt_text}
                      onChange={(e) => 
                        setEditingTranslation(prev => prev ? {...prev, prompt_text: e.target.value} : null)
                      }
                      placeholder="Enter the prompt text in the selected language..."
                      rows={8}
                      className="resize-none"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingTranslation(null);
                        setIsDialogOpen(false);
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSaveTranslation}
                      disabled={!editingTranslation.prompt_text.trim()}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {editingTranslation.id ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {Object.keys(translationsByType).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Languages className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No prompt translations yet</p>
            <p className="text-sm">Add translations to support multiple languages for this AI personality</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(translationsByType).map(([promptType, typeTranslations]) => (
              <div key={promptType} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-medium capitalize">{promptType} Prompts</h3>
                  <Badge variant="secondary">{typeTranslations.length} languages</Badge>
                </div>
                
                <div className="grid gap-3">
                  {typeTranslations.map(translation => (
                    <div key={translation.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded border">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-lg">{getFlagForLanguage(translation.language_code)}</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm">{getLanguageName(translation.language_code)}</div>
                          <div className="text-xs text-gray-500 truncate max-w-md">
                            {translation.prompt_text}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(translation)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTranslation(translation)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PromptTranslationsManager;