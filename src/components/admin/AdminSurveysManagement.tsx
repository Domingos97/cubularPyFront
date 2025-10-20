import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Download, Eye, MoreHorizontal, Trash2, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/resources/i18n';
import { MultiFileUpload } from '@/components/admin/MultiFileUpload';
import { API_CONFIG, buildApiUrl } from '@/config';

interface Survey {
  id: string;
  title?: string;
  filename?: string;
  created_at: string;
  category?: string;
  processing_status?: string;
}

interface AdminSurveysManagementProps {
  surveys: Survey[];
  onSurveyAdded: () => void;
  onSurveyDeleted: (surveyId?: string) => void;
}

export const AdminSurveysManagement = ({ surveys, onSurveyAdded, onSurveyDeleted }: AdminSurveysManagementProps) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isMultiFileUploadOpen, setIsMultiFileUploadOpen] = useState(false);
  const [isUpdatingStatuses, setIsUpdatingStatuses] = useState(false);

  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-600 text-white">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-600 text-white">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-gray-500 text-gray-400">
            Unknown
          </Badge>
        );
    }
  };


  const handleDeleteSurvey = async (surveyId: string) => {
    if (!confirm(t('admin.surveys.confirmDelete'))) return;

    try {
      const res = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.SURVEYS.DETAILS(surveyId)), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete survey');
      }

      // Pass the surveyId to enable optimistic updates
      onSurveyDeleted(surveyId);
      toast({
        title: t('admin.toast.success'),
        description: t('admin.surveys.deleteSuccess')
      });
    } catch (error) {
      console.error('Error deleting survey:', error);
      toast({
        title: t('admin.toast.error'),
        description: error instanceof Error ? error.message : t('admin.surveys.deleteError'),
        variant: 'destructive'
      });
    }
  };

  const handleDownloadSurvey = async (surveyId: string, filename: string) => {
    try {
      const res = await fetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.SURVEYS.DETAILS(surveyId)}/download`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!res.ok) {
        throw new Error('Failed to download survey');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: t('admin.toast.success'),
        description: t('admin.surveys.downloadSuccess')
      });
    } catch (error) {
      console.error('Error downloading survey:', error);
      toast({
        title: t('admin.toast.error'),
        description: t('admin.surveys.downloadError'),
        variant: 'destructive'
      });
    }
  };

  return (
    <Card className="bg-gray-800/80 border-gray-700">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-white">{t('admin.surveys.title')}</CardTitle>
            <CardDescription className="text-gray-400">
              {t('admin.surveys.description')}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={isMultiFileUploadOpen} onOpenChange={setIsMultiFileUploadOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('admin.surveys.createSurvey')}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 border-gray-700 max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-white">{t('admin.surveys.createNew')}</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    {t('admin.surveys.createDescription')}
                  </DialogDescription>
                </DialogHeader>
                <MultiFileUpload 
                  onUploadComplete={() => {
                    setIsMultiFileUploadOpen(false);
                    onSurveyAdded();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-gray-700">
              <TableHead className="text-gray-300">{t('admin.surveys.table.title')}</TableHead>
              <TableHead className="text-gray-300">{t('admin.surveys.table.filename')}</TableHead>
              <TableHead className="text-gray-300">{t('admin.surveys.table.category')}</TableHead>
              <TableHead className="text-gray-300">Status</TableHead>
              <TableHead className="text-gray-300">{t('admin.surveys.table.created')}</TableHead>
              <TableHead className="text-gray-300">{t('admin.surveys.table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {surveys.map((survey) => (
              <TableRow key={survey.id} className="border-gray-700">
                <TableCell className="text-white font-medium">
                  {survey.title || t('admin.surveys.untitled')}
                </TableCell>
                <TableCell className="text-gray-300">
                  {survey.filename || t('admin.surveys.unknown')}
                </TableCell>
                <TableCell className="text-gray-300">
                  {survey.category || t('admin.surveys.general')}
                </TableCell>
                <TableCell>
                  {renderStatusBadge(survey.processing_status)}
                </TableCell>
                <TableCell className="text-gray-300">
                  {new Date(survey.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-white">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                      <DropdownMenuItem 
                        className="text-gray-300 hover:bg-gray-700 cursor-pointer"
                        onClick={() => navigate(`/admin/survey/${survey.id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        {t('admin.surveys.viewDetails')}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-gray-300 hover:bg-gray-700 cursor-pointer"
                        onClick={() => handleDownloadSurvey(survey.id, survey.filename || 'survey.csv')}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {t('admin.surveys.download')}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-400 hover:bg-red-600/20 cursor-pointer"
                        onClick={() => handleDeleteSurvey(survey.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t('admin.surveys.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
