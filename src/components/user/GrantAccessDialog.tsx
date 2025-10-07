import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Database, 
  FileText, 
  Eye, 
  Settings, 
  Shield, 
  X 
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Survey {
  id: string;
  title: string;
  category: string;
  survey_files: Array<{
    id: string;
    filename: string;
  }>;
}

interface GrantAccessDialogProps {
  isOpen: boolean;
  grantAccessType: 'survey' | 'file';
  selectedAccessType: 'read' | 'write' | 'admin';
  selectedSurveyId: string;
  selectedFileId: string;
  expiresAt: string;
  surveys: Survey[];
  onClose: () => void;
  onGrantAccessTypeChange: (type: 'survey' | 'file') => void;
  onAccessTypeChange: (type: 'read' | 'write' | 'admin') => void;
  onSurveyIdChange: (surveyId: string) => void;
  onFileIdChange: (fileId: string) => void;
  onExpiresAtChange: (expiresAt: string) => void;
  onGrantAccess: () => Promise<void>;
}

const GrantAccessDialog: React.FC<GrantAccessDialogProps> = ({
  isOpen,
  grantAccessType,
  selectedAccessType,
  selectedSurveyId,
  selectedFileId,
  expiresAt,
  surveys,
  onClose,
  onGrantAccessTypeChange,
  onAccessTypeChange,
  onSurveyIdChange,
  onFileIdChange,
  onExpiresAtChange,
  onGrantAccess
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-gray-100">Grant Access</CardTitle>
                <CardDescription className="text-gray-400">
                  Grant user access to surveys or files
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-gray-400 hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Access Type</Label>
              <div className="flex gap-2">
                <Button
                  variant={grantAccessType === 'survey' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onGrantAccessTypeChange('survey')}
                  className="text-xs"
                >
                  <Database className="h-4 w-4 mr-1" />
                  Survey
                </Button>
                <Button
                  variant={grantAccessType === 'file' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onGrantAccessTypeChange('file')}
                  className="text-xs"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  File
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Permission Level</Label>
              <Select 
                value={selectedAccessType} 
                onValueChange={(value: 'read' | 'write' | 'admin') => onAccessTypeChange(value)}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="read">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Read Only
                    </div>
                  </SelectItem>
                  <SelectItem value="write">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Read & Write
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Full Admin
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {grantAccessType === 'survey' && (
              <div>
                <Label className="text-sm font-medium text-gray-300 mb-2 block">Survey</Label>
                <Select value={selectedSurveyId} onValueChange={onSurveyIdChange}>
                  <SelectTrigger className="bg-gray-700 border-gray-600">
                    <SelectValue placeholder="Select a survey" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {surveys.map((survey) => (
                      <SelectItem key={survey.id} value={survey.id}>
                        {survey.title} ({survey.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {grantAccessType === 'file' && (
              <div>
                <Label className="text-sm font-medium text-gray-300 mb-2 block">File</Label>
                <Select value={selectedFileId} onValueChange={onFileIdChange}>
                  <SelectTrigger className="bg-gray-700 border-gray-600">
                    <SelectValue placeholder="Select a file" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {surveys.flatMap((survey) =>
                      survey.survey_files.map((file) => (
                        <SelectItem key={file.id} value={file.id}>
                          {file.filename} (from {survey.title})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label className="text-sm font-medium text-gray-300 mb-2 block">
                Expires At (Optional)
              </Label>
              <Input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => onExpiresAtChange(e.target.value)}
                className="bg-gray-700 border-gray-600"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="flex-1 text-gray-300 border-gray-600"
              >
                Cancel
              </Button>
              <Button 
                onClick={onGrantAccess}
                disabled={!selectedSurveyId && !selectedFileId}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Grant Access
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GrantAccessDialog;