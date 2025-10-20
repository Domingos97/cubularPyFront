import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Edit, Trash2, Eye, EyeOff, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/resources/i18n';
import { authenticatedApiRequest } from '@/utils/api';
import { API_CONFIG, buildApiUrl } from '@/config';
import type { AIPersonality } from '@/hooks/usePersonalities';
import { useAuth } from '@/hooks/useAuth';

export const UserAIPersonalityManager: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [personalities, setPersonalities] = useState<AIPersonality[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [personalityToDelete, setPersonalityToDelete] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadPersonalities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadPersonalities = async () => {
    try {
      const data = await authenticatedApiRequest<AIPersonality[]>(buildApiUrl(API_CONFIG.ENDPOINTS.PERSONALITIES));
      let filtered: AIPersonality[] = data || [];

      const currentUserId = user?.id || null;
      if (currentUserId) {
        filtered = filtered.filter((p: any) => {
          return p?.created_by === currentUserId || p?.owner_id === currentUserId || p?.user_id === currentUserId;
        });
      } else {
        filtered = [];
      }

      setPersonalities(filtered);
    } catch (error) {
      console.error('Error loading personalities:', error);
      toast.error(t('personalization.loadFailed') || 'Failed to load personalities');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (personality: AIPersonality) => {
    navigate(`/personalization/personalities/${personality.id}/edit`);
  };

  const openDeleteConfirm = (id: string) => {
    setPersonalityToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!personalityToDelete) return;
    try {
  await authenticatedApiRequest(`${buildApiUrl(API_CONFIG.ENDPOINTS.PERSONALITIES)}${personalityToDelete}`, {
        method: 'DELETE'
      });
      toast.success(t('personalization.deleteSuccess') || 'Personality deleted');
      loadPersonalities();
      setDeleteConfirmOpen(false);
      setPersonalityToDelete(null);
    } catch (error) {
      console.error('Error deleting personality:', error);
      toast.error(t('personalization.deleteFailed') || 'Failed to delete');
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
  await authenticatedApiRequest(`${buildApiUrl(API_CONFIG.ENDPOINTS.PERSONALITIES)}${id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !isActive })
      });

      setPersonalities(prev => 
        prev.map(personality => 
          personality.id === id 
            ? { ...personality, is_active: !isActive }
            : personality
        )
      );

      const status = !isActive ? t('admin.personalities.activated') : t('admin.personalities.deactivated');
      toast.success(t('personalization.statusUpdateSuccess', { status }) || 'Status updated');
    } catch (error) {
      console.error('Error toggling personality status:', error);
      toast.error(t('personalization.statusUpdateFailed') || 'Failed to update status');
    }
  };

  const setAsDefault = async (id: string) => {
    try {
  await authenticatedApiRequest(`${buildApiUrl(API_CONFIG.ENDPOINTS.PERSONALITIES)}${id}/set-default`, {
        method: 'POST'
      });
      toast.success(t('personalization.defaultUpdated') || 'Default updated');
      loadPersonalities();
    } catch (error) {
      console.error('Error setting default personality:', error);
      toast.error(t('personalization.defaultUpdateFailed') || 'Failed to set default');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">{t('personalization.loading') || 'Loading...'}</div>;
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{t('personalization.myPersonalitiesTitle') || t('personalization.managerTitle') || 'My Personalities'}</h2>
            <p className="text-muted-foreground">{t('personalization.myPersonalitiesDescription') || 'Personal AI personalities you created.'}</p>
          </div>
          <Button 
            onClick={() => navigate('/personalization/personalities/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('personalization.addNew') || 'Add New'}
          </Button>
        </div>

        <div className="grid gap-4">
          {personalities.map((personality) => (
            <Card key={personality.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CardTitle className="text-lg">{personality.name}</CardTitle>
                    {personality.is_default && (
                      <Badge variant="secondary">
                        <Star className="h-3 w-3 mr-1" />
                        {t('admin.personalities.default')}
                      </Badge>
                    )}
                    <Badge variant={personality.is_active ? "default" : "secondary"}>
                      {personality.is_active ? t('admin.personalities.active') : t('admin.personalities.inactive')}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAsDefault(personality.id)}
                          disabled={personality.is_default}
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t('admin.personalities.setAsDefault')}</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleActive(personality.id, personality.is_active)}
                        >
                          {personality.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{personality.is_active ? t('admin.personalities.deactivate') : t('admin.personalities.activate')} personality</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(personality)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t('admin.personalities.edit')}</TooltipContent>
                    </Tooltip>
                    <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteConfirm(personality.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('personalization.delete')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('personalization.deleteConfirm') || 'Are you sure you want to delete this personality?'}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('personalization.cancel') || 'Cancel'}</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {t('common.delete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <CardDescription>{personality.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <p><strong>{t('admin.personalities.model')}:</strong> {personality.model_override || t('admin.personalities.default')}</p>
                  <p><strong>{t('admin.personalities.temperature')}:</strong> {personality.temperature_override || t('admin.personalities.default')}</p>
                  <p><strong>{t('admin.personalities.detailedAnalysis')}:</strong> {personality.detailed_analysis_prompt?.substring(0, 100) || t('admin.personalities.default')}...</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
};
