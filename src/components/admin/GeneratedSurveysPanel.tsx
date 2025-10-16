import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  CheckCircle, 
  Download,
  Calendar,
  FileText,
  Trash2,
  Search,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { authenticatedApiRequest } from '@/utils/api';
import { Input } from '@/components/ui/input';
import { FileViewer } from './FileViewer';
import { buildApiUrl, API_CONFIG } from '@/config';

interface GeneratedSurveyRecord {
  id: string;
  title: string;
  category: string;
  description: string;
  number_participants: number;
  total_files: number;
  processing_status: string;
  primary_language: string;
  created_at: string;
  files: {
    id: string;
    filename: string;
    storage_path: string;
    file_size: number;
  }[];
}

export const GeneratedSurveysPanel = () => {
  const [generatedSurveys, setGeneratedSurveys] = useState<GeneratedSurveyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSurveys, setFilteredSurveys] = useState<GeneratedSurveyRecord[]>([]);
  const [viewingFile, setViewingFile] = useState<{
    file: GeneratedSurveyRecord['files'][0];
    surveyId: string;
  } | null>(null);

  // Load generated surveys
  const loadGeneratedSurveys = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await authenticatedApiRequest(buildApiUrl(API_CONFIG.ENDPOINTS.SURVEY_BUILDER.GENERATED_SURVEYS));
      
      if (response.success) {
        setGeneratedSurveys(response.surveys || []);
        console.log('📋 Loaded generated surveys:', response.surveys?.length || 0);
      } else {
        console.error('Failed to load generated surveys:', response);
        toast.error('Failed to load generated surveys');
      }
    } catch (error) {
      console.error('Error loading generated surveys:', error);
      toast.error('Error loading generated surveys');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load generated surveys on component mount
  useEffect(() => {
    loadGeneratedSurveys();
  }, [loadGeneratedSurveys]);

  // Filter surveys based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredSurveys(generatedSurveys);
    } else {
      const filtered = generatedSurveys.filter(survey =>
        survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        survey.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSurveys(filtered);
    }
  }, [generatedSurveys, searchTerm]);

  // Download survey file
  const downloadSurveyFile = async (fileId: string, filename: string) => {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.SURVEY_BUILDER.DOWNLOAD_FILE(fileId)), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Downloaded ${filename}`);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  // View file content
  const viewFileContent = (file: GeneratedSurveyRecord['files'][0], surveyId: string) => {
    setViewingFile({ file, surveyId });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toUpperCase() || 'FILE';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Generated Surveys</h2>
          <p className="text-gray-400">Manage surveys created with the AI Survey Builder</p>
        </div>
        <Button
          onClick={loadGeneratedSurveys}
          disabled={isLoading}
          variant="outline"
          className="border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="bg-gray-800/80 border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search surveys by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div className="text-sm text-gray-400">
              {filteredSurveys.length} of {generatedSurveys.length} surveys
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Surveys List */}
      <Card className="bg-gray-800/80 border-gray-700">
        <CardHeader className="border-b border-gray-700">
          <CardTitle className="text-white flex items-center">
            <FileSpreadsheet className="w-5 h-5 mr-2" />
            Survey Library ({filteredSurveys.length})
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mr-3" />
              <span className="text-gray-400 text-lg">Loading surveys...</span>
            </div>
          ) : filteredSurveys.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 opacity-50" />
              {generatedSurveys.length === 0 ? (
                <>
                  <h3 className="text-lg font-medium mb-2">No surveys generated yet</h3>
                  <p className="text-sm">Use the Survey Builder to create your first AI-generated survey!</p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium mb-2">No surveys match your search</h3>
                  <p className="text-sm">Try adjusting your search terms</p>
                </>
              )}
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="p-4 space-y-4">
                {filteredSurveys.map((survey, index) => (
                  <Card key={survey.id} className="bg-gray-700/50 border-gray-600 hover:border-gray-500 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-2">{survey.title}</h3>
                          <p className="text-sm text-gray-300 mb-3">{survey.description}</p>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-400">
                            <div className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(survey.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            <div className="flex items-center">
                              <FileText className="w-3 h-3 mr-1" />
                              {survey.total_files} files
                            </div>
                            <div className="flex items-center text-green-400">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {survey.processing_status}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <span className="inline-block px-2 py-1 text-xs rounded bg-blue-600/20 text-blue-300 border border-blue-600/30">
                            #{(index + 1).toString().padStart(3, '0')}
                          </span>
                        </div>
                      </div>
                      
                      {/* Files */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Available Files:</h4>
                        {survey.files.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-3 bg-gray-600/30 rounded-lg border border-gray-600/50 hover:bg-gray-600/50 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded bg-blue-600/20 border border-blue-600/30">
                                <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{file.filename}</p>
                                <p className="text-xs text-gray-400">
                                  {getFileExtension(file.filename)} • {formatFileSize(file.file_size)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Button
                                onClick={() => viewFileContent(file, survey.id)}
                                size="sm"
                                variant="outline"
                                className="border-blue-600 text-blue-300 hover:bg-blue-600/20 hover:text-blue-200"
                              >
                                <Eye className="w-3 h-3 mr-2" />
                                View
                              </Button>
                              <Button
                                onClick={() => downloadSurveyFile(file.id, file.filename)}
                                size="sm"
                                variant="outline"
                                className="border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                              >
                                <Download className="w-3 h-3 mr-2" />
                                Download
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* File Viewer Modal */}
      {viewingFile && (
        <FileViewer
          file={viewingFile.file}
          surveyId={viewingFile.surveyId}
          onClose={() => setViewingFile(null)}
          onDownload={() => downloadSurveyFile(viewingFile.file.id, viewingFile.file.filename)}
        />
      )}
    </div>
  );
};

export default GeneratedSurveysPanel;