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
  selectedAccessType: 'read' | 'write' | 'admin';
  selectedSurveyId: string;
  selectedFileIds: string[];
  expiresAt: string;
  surveys: Survey[];
  onClose: () => void;
  onAccessTypeChange: (type: 'read' | 'write' | 'admin') => void;
  onSurveyIdChange: (surveyId: string) => void;
  onFileIdsChange: (fileIds: string[]) => void;
  onExpiresAtChange: (expiresAt: string) => void;
  onGrantAccess: () => Promise<void>;
}

const GrantAccessDialog: React.FC<GrantAccessDialogProps> = ({
  isOpen,
  selectedAccessType,
  selectedSurveyId,
  selectedFileIds,
  expiresAt,
  surveys,
  onClose,
  onAccessTypeChange,
  onSurveyIdChange,
  onFileIdsChange,
  onExpiresAtChange,
  onGrantAccess
}) => {
  const selectedSurvey = surveys.find(s => s.id === selectedSurveyId);
  
  const handleFileToggle = (fileId: string) => {
    if (selectedFileIds.includes(fileId)) {
      onFileIdsChange(selectedFileIds.filter(id => id !== fileId));
    } else {
      onFileIdsChange([...selectedFileIds, fileId]);
    }
  };

  const handleSelectAllFiles = () => {
    if (selectedSurvey) {
      const allFileIds = selectedSurvey.survey_files.map(f => f.id);
      onFileIdsChange(allFileIds);
    }
  };

  const handleDeselectAllFiles = () => {
    onFileIdsChange([]);
  };
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
              <Label className="text-sm font-medium text-gray-300 mb-2 block">Survey</Label>
              <Select value={selectedSurveyId} onValueChange={onSurveyIdChange}>
                <SelectTrigger className="bg-gray-700 border-gray-600">
                  <SelectValue placeholder="Select a survey" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {surveys.map((survey) => (
                    <SelectItem key={survey.id} value={survey.id}>
                      {survey.title} ({survey.category}) - {survey.survey_files?.length || 0} files
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            {selectedSurvey && selectedSurvey.survey_files && selectedSurvey.survey_files.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium text-gray-300">Files to Grant Access</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllFiles}
                      className="text-xs text-gray-300 border-gray-600"
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDeselectAllFiles}
                      className="text-xs text-gray-300 border-gray-600"
                    >
                      Deselect All
                    </Button>
                  </div>
                </div>
                
                <div className="max-h-48 overflow-y-auto border border-gray-600 rounded-lg bg-gray-700/30">
                  {selectedSurvey.survey_files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 p-3 border-b border-gray-600 last:border-b-0 hover:bg-gray-600/20"
                    >
                      <input
                        type="checkbox"
                        id={`file-${file.id}`}
                        checked={selectedFileIds.includes(file.id)}
                        onChange={() => handleFileToggle(file.id)}
                        className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`file-${file.id}`}
                        className="flex-1 text-sm text-gray-200 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-green-400" />
                          {file.filename}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
                
                <div className="mt-2 p-3 bg-blue-600/10 border border-blue-600/20 rounded-lg">
                  <p className="text-xs text-blue-400">
                    Survey access will be granted automatically. Selected files: {selectedFileIds.length} of {selectedSurvey.survey_files.length}
                  </p>
                </div>
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
                disabled={!selectedSurveyId}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
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
