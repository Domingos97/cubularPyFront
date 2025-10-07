import React, { useState, useEffect } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, FileText, CheckSquare, Square } from "lucide-react";
import { Survey, SurveyFile } from "@/types/survey";
import { FileAccess } from "@/types/fileAccess";
import { authenticatedFetch, authenticatedApiRequest } from "@/utils/api";
import { useTranslation } from "@/resources/i18n";

interface FileSelectionComponentProps {
  selectedSurvey: Survey | null;
  selectedFiles: string[];
  onFileSelectionChange: (fileIds: string[]) => void;
}

export const FileSelectionComponent: React.FC<FileSelectionComponentProps> = ({
  selectedSurvey,
  selectedFiles,
  onFileSelectionChange
}) => {
  const [surveyFiles, setSurveyFiles] = useState<SurveyFile[]>([]);
  const [fileAccessMap, setFileAccessMap] = useState<Record<string, FileAccess>>( {} );
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { t } = useTranslation();

  // Load files when survey changes
  useEffect(() => {
    if (selectedSurvey?.id) {
      loadSurveyFiles(selectedSurvey.id);
      loadFileAccess(selectedSurvey.id);
    } else {
      setSurveyFiles([]);
      setFileAccessMap({});
      onFileSelectionChange([]);
    }
  }, [selectedSurvey?.id]);

  // Auto-select files with write/admin access when both files and access map are loaded
  useEffect(() => {
    if (surveyFiles.length > 0 && Object.keys(fileAccessMap).length > 0) {
      const writableFileIds = surveyFiles
        .filter((file: SurveyFile) => {
          const access = fileAccessMap[file.id]?.accessType;
          return access === 'write' || access === 'admin';
        })
        .map((file: SurveyFile) => file.id);
      onFileSelectionChange(writableFileIds);
    }
  }, [surveyFiles, fileAccessMap]);
  // Fetch file access for current user for this survey
  const loadFileAccess = async (surveyId: string) => {
    try {
      console.log('🔐 Loading file access for surveyId:', surveyId);
      const data = await authenticatedApiRequest(`http://localhost:3000/api/surveys/${surveyId}/my-file-access`);
      console.log('🗝️ File access response:', data);
      // data: Array<{ fileId, accessType }>
      const map: Record<string, FileAccess> = {};
      (data || []).forEach((fa: FileAccess) => {
        map[fa.fileId] = fa;
      });
      console.log('🎯 File access map:', map);
      setFileAccessMap(map);
    } catch (err) {
      console.error('❌ Error loading file access:', err);
      setFileAccessMap({});
    }
  };

  // Auto-expand when survey has files
  useEffect(() => {
    if (surveyFiles.length > 0) {
      setIsExpanded(true);
    }
  }, [surveyFiles.length]);

  const loadSurveyFiles = async (surveyId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🔍 Loading survey files for surveyId:', surveyId);
      const data = await authenticatedApiRequest(`http://localhost:3000/api/surveys/${surveyId}/with-files`);
      console.log('📁 Survey files response:', data);
      const files = data.files || [];
      console.log('📄 Extracted files:', files);
      setSurveyFiles(files);
      // Do not auto-select here; handled in useEffect after both files and access map are loaded
    } catch (error) {
      console.error('❌ Error loading survey files:', error);
      setError('Failed to load survey files');
      setSurveyFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileToggle = (fileId: string) => {
    const updatedSelection = selectedFiles.includes(fileId)
      ? selectedFiles.filter(id => id !== fileId)
      : [...selectedFiles, fileId];
    
    onFileSelectionChange(updatedSelection);
  };

  const handleSelectAll = () => {
    const allFileIds = surveyFiles.map(file => file.id);
    onFileSelectionChange(allFileIds);
  };

  const handleSelectNone = () => {
    onFileSelectionChange([]);
  };

  const formatFileSize = (bytes: number = 0) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (!selectedSurvey) {
    return null;
  }

  return (
    <Card className="w-full bg-gray-800 border-gray-700">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-750 transition-colors pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-200 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t('surveyResults.fileSelection.title')}
                {surveyFiles.length > 0 && (
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                    {t('surveyResults.fileSelection.selectedCount', { selected: selectedFiles.length, total: surveyFiles.length })}
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                {isLoading && (
                  <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full" />
                )}
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {error && (
              <div className="text-red-400 text-sm mb-3 p-2 bg-red-900/20 rounded border border-red-800">
                {error}
              </div>
            )}

            {surveyFiles.length === 0 && !isLoading && !error && (
              <div className="text-gray-400 text-sm text-center py-4">
                {t('surveyResults.fileSelection.noFiles')}
              </div>
            )}

            {surveyFiles.length > 0 && (() => {
              // Only show file list if user has access to at least one file
              // Only show files the user has access to (read/write/admin)
              const filesWithAccess = surveyFiles.filter(file => {
                const access = fileAccessMap[file.id]?.accessType;
                return access === 'read' || access === 'write' || access === 'admin';
              });
              if (filesWithAccess.length === 0) return null;
              return (
                <>
                  {/* Bulk selection controls */}
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-700">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 h-7 px-2 text-xs"
                    >
                      <CheckSquare className="h-3 w-3 mr-1" />
                      {t('surveyResults.fileSelection.all')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectNone}
                      className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 h-7 px-2 text-xs"
                    >
                      <Square className="h-3 w-3 mr-1" />
                      {t('surveyResults.fileSelection.none')}
                    </Button>
                  </div>

                  {/* File list */}
                  <div className="space-y-2">
                    {filesWithAccess.map((file) => {
                      const access = fileAccessMap[file.id]?.accessType;
                      const isWrite = access === 'write' || access === 'admin';
                      const isRead = access === 'read';
                      return (
                        <div
                          key={file.id}
                          className={`flex items-center space-x-3 p-2 rounded border border-gray-700 ${isWrite ? 'hover:bg-gray-750' : ''} transition-colors`}
                        >
                          <Checkbox
                            id={`file-${file.id}`}
                            checked={isWrite ? selectedFiles.includes(file.id) : false}
                            onCheckedChange={() => isWrite ? handleFileToggle(file.id) : undefined}
                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            disabled={isRead || !isWrite}
                          />
                          <div className="flex-1 min-w-0">
                            <label
                              htmlFor={`file-${file.id}`}
                              className={`text-sm font-medium text-gray-200 block truncate ${isRead ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              {file.filename}
                            </label>
                            <div className="flex items-center gap-2 mt-1">
                              {file.file_size && (
                                <span className="text-xs text-gray-400">
                                  {formatFileSize(file.file_size)}
                                </span>
                              )}
                              {file.upload_date && (
                                <span className="text-xs text-gray-500">
                                  {new Date(file.upload_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          {isRead && (
                            <span className="text-xs text-yellow-400 ml-2">{t('surveyResults.fileSelection.readOnly')}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};