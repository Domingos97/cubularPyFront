import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Download, 
  FileSpreadsheet, 
  AlertCircle,
  Loader2,
  FileText,
  BarChart3
} from 'lucide-react';
import { authenticatedApiRequest } from '@/utils/api';
import { API_CONFIG, buildApiUrl } from '@/config';
import { toast } from 'sonner';

interface FileData {
  filename: string;
  headers: string[];
  rows: any[][];
  total_rows: number;
  total_columns: number;
}

interface FileViewerProps {
  file: {
    id: string;
    filename: string;
    storage_path: string;
    file_size: number;
  };
  surveyId: string;
  onClose: () => void;
  onDownload?: () => void;
}

export const FileViewer: React.FC<FileViewerProps> = ({
  file,
  surveyId,
  onClose,
  onDownload
}) => {
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [columnWidth, setColumnWidth] = useState<'compact' | 'normal' | 'wide'>('normal');
  const rowsPerPage = 50;

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

  useEffect(() => {
    const loadFileContent = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await authenticatedApiRequest(
          buildApiUrl(API_CONFIG.ENDPOINTS.SURVEY_BUILDER.VIEW_FILE(file.id))
        );

        if (response.success !== false && response.filename) {
          setFileData(response);
        } else {
          throw new Error(response.error || 'Failed to load file content');
        }
      } catch (err: any) {
        console.error('Error loading file content:', err);
        setError(err.message || 'Failed to load file content');
        toast.error('Failed to load file content');
      } finally {
        setLoading(false);
      }
    };

    loadFileContent();
  }, [file.id, surveyId]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    }
  };

  const totalPages = fileData ? Math.ceil(fileData.rows.length / rowsPerPage) : 0;
  const currentRows = fileData ? fileData.rows.slice(
    currentPage * rowsPerPage,
    (currentPage + 1) * rowsPerPage
  ) : [];

  const getColumnWidth = () => {
    switch (columnWidth) {
      case 'compact': return '120px';
      case 'wide': return '250px';
      default: return '180px';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2">
      <Card className="bg-gray-800 border-gray-700 w-full max-w-[95vw] max-h-[95vh] flex flex-col">
        <CardHeader className="border-b border-gray-700 flex-shrink-0 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-600/30">
                <FileSpreadsheet className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-white text-lg">{file.filename}</CardTitle>
                <div className="flex items-center space-x-3 text-sm text-gray-400">
                  <span>{getFileExtension(file.filename)}</span>
                  <span>•</span>
                  <span>{formatFileSize(file.file_size)}</span>
                  {fileData && (
                    <>
                      <span>•</span>
                      <span>{fileData.total_rows.toLocaleString()} rows</span>
                      <span>•</span>
                      <span>{fileData.total_columns} columns</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {onDownload && (
                <Button
                  onClick={handleDownload}
                  size="sm"
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
              <Button
                onClick={onClose}
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400 mr-3" />
              <span className="text-gray-400 text-lg">Loading file content...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Failed to load file</h3>
                <p className="text-gray-400 text-sm max-w-md">{error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="mt-4"
                  variant="outline"
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : fileData ? (
            <div className="flex flex-col h-full">
              {/* Statistics Bar */}
              <div className="bg-gray-700/50 border-b border-gray-600 p-4 flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">
                      Showing rows {(currentPage * rowsPerPage + 1).toLocaleString()} - {Math.min((currentPage + 1) * rowsPerPage, fileData.total_rows).toLocaleString()} of {fileData.total_rows.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">
                      {fileData.total_columns} columns
                    </span>
                  </div>
                </div>
                
                {totalPages > 1 && (
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                      size="sm"
                      variant="outline"
                      className="border-gray-600 text-gray-300"
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-400 px-3">
                      Page {currentPage + 1} of {totalPages}
                    </span>
                    <Button
                      onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                      disabled={currentPage === totalPages - 1}
                      size="sm"
                      variant="outline"
                      className="border-gray-600 text-gray-300"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>

              {/* Data Table */}
              <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-auto">
                  {fileData.headers.length > 0 ? (
                    <div className="p-4">
                      <div className="border border-gray-600 rounded-lg overflow-x-auto">
                        <table className="w-full min-w-max">
                          <thead className="bg-gray-700 sticky top-0 z-10">
                            <tr>
                              <th className="text-left p-3 text-xs font-medium text-gray-300 border-r border-gray-600 bg-gray-600 w-16 sticky left-0 z-20">
                                #
                              </th>
                              {fileData.headers.map((header, index) => (
                              <th
                                key={index}
                                className="text-left p-3 text-xs font-medium text-gray-300 border-r border-gray-600 last:border-r-0 whitespace-nowrap"
                                style={{ minWidth: getColumnWidth() }}
                              >
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium">{header || `Column ${index + 1}`}</span>
                                    <Badge variant="secondary" className="text-xs bg-gray-600 text-gray-300 px-1">
                                      {index + 1}
                                    </Badge>
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-gray-800">
                            {currentRows.map((row, rowIndex) => {
                              const actualRowNumber = currentPage * rowsPerPage + rowIndex + 1;
                              return (
                                <tr
                                  key={rowIndex}
                                  className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors"
                                >
                                  <td className="p-3 text-xs text-gray-400 border-r border-gray-600 bg-gray-700/30 font-mono sticky left-0 z-10">
                                    {actualRowNumber}
                                  </td>
                                  {row.map((cell, cellIndex) => (
                                    <td
                                      key={cellIndex}
                                      className="p-3 text-sm text-gray-200 border-r border-gray-700 last:border-r-0 whitespace-nowrap"
                                      style={{ minWidth: getColumnWidth() }}
                                    >
                                      <div 
                                        className="max-w-sm overflow-hidden text-ellipsis"
                                        title={String(cell || '')}
                                      >
                                        {cell !== null && cell !== undefined && cell !== '' 
                                          ? String(cell) 
                                          : <span className="text-gray-500 italic">empty</span>
                                        }
                                      </div>
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Horizontal scroll hint */}
                      {fileData.total_columns > 5 && (
                        <div className="mt-2 text-center">
                          <span className="text-xs text-gray-500 bg-gray-700/50 px-3 py-1 rounded-full">
                            💡 Scroll horizontally to see all {fileData.total_columns} columns
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No data found</h3>
                      <p className="text-sm">This file appears to be empty or could not be parsed.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};

export default FileViewer;