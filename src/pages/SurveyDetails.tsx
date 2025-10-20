import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SurveyDetailsHeader from '@/components/SurveyDetailsHeader';
import { useTranslation } from '@/resources/i18n';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Calendar, FileText, Users, BarChart3, Tag, MessageSquare, Edit, Check, X, Trash2, Plus, Minus, Lightbulb, Upload, FileSpreadsheet, Eye } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { MultiFileDataTable } from '@/components/survey/MultiFileDataTable';
import { AddFileUpload } from '@/components/admin/AddFileUpload';
import { API_CONFIG, buildApiUrl } from '@/config';
import * as XLSX from 'xlsx';
import { authenticatedFetch, authenticatedApiRequest } from '@/utils/api';
import { Survey, SurveyFile, ParsedSurveyData, SurveyStats } from '@/types/survey';

// Utility function to count unique participants based on 'Pessoa' column
const getUniqueParticipantCount = (data: ParsedSurveyData, participantColumn: string = 'Pessoa') => {
  if (!data || !data.headers || !data.rows || data.rows.length === 0) return 0;
  const colIndex = data.headers.findIndex(h => h.trim().toLowerCase() === participantColumn.trim().toLowerCase());
  if (colIndex === -1) return 0;
  const participants = new Set<string>();
  for (const row of data.rows) {
    if (row[colIndex]) {
      participants.add(row[colIndex].trim());
    }
  }
  return participants.size;
};

interface AIPersonality {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  is_default?: boolean;
}

const SurveyDetails = () => {
  const { t } = useTranslation();
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingSuggestions, setIsEditingSuggestions] = useState(false);
  const [editCategoryValue, setEditCategoryValue] = useState('');
  const [editDescriptionValue, setEditDescriptionValue] = useState('');
  const [editSuggestionsValue, setEditSuggestionsValue] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [personalities, setPersonalities] = useState<AIPersonality[]>([]);
  const [selectedPersonalityId, setSelectedPersonalityId] = useState<string>('');
  
  // Multi-file support
  const [surveyFiles, setSurveyFiles] = useState<SurveyFile[]>([]);
  const [surveyStats, setSurveyStats] = useState<SurveyStats | null>(null);
  const [showAddFiles, setShowAddFiles] = useState(false);
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<SurveyFile | null>(null);
  
  // Multi-file data management
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [fileDataMap, setFileDataMap] = useState<Record<string, ParsedSurveyData>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isLoadingFileData, setIsLoadingFileData] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<Record<string, boolean>>({});

  // Utility function to check if there are any unsaved changes
  const hasAnyUnsavedChanges = () => {
    return Object.values(hasUnsavedChanges).some(hasChanges => hasChanges);
  };

  // Handle beforeunload event to warn about page refresh/close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasAnyUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (hasAnyUnsavedChanges()) {
        const proceed = window.confirm(
          'You have unsaved changes. Are you sure you want to leave this page?'
        );
        if (!proceed) {
          // Push the current state back to prevent navigation
          window.history.pushState(null, '', window.location.href);
        }
      }
    };

    // Push a state to detect back button
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges]);

  // Custom navigation warning using navigate override
  const originalNavigate = navigate;
  
  // Override navigate function to check for unsaved changes
  const safeNavigate = (to: any, options?: any) => {
    if (hasAnyUnsavedChanges()) {
      const proceed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave this page?'
      );
      if (proceed) {
        originalNavigate(to, options);
      }
    } else {
      originalNavigate(to, options);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S to save changes
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (hasAnyUnsavedChanges()) {
          if (selectedFileId && hasUnsavedChanges[selectedFileId]) {
            handleSaveChanges(selectedFileId);
          } else {
            handleSaveAllChanges();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasUnsavedChanges, selectedFileId]);

  useEffect(() => {
    if (surveyId) {
      fetchSurveyDetails();
      fetchPersonalities();
    }
  }, [surveyId]);

  useEffect(() => {
    // Modern surveys only use multi-file approach
    // Data is loaded via handleFileSelection when files are available
  }, [survey]);

  // Auto-select first file when files are loaded
  useEffect(() => {
    if (surveyFiles.length > 0 && !selectedFileId) {
      handleFileSelection(surveyFiles[0].id);
    }
  }, [surveyFiles, selectedFileId]);

  const fetchSurveyDetails = async () => {
    try {
      // Get survey with files (modern API only)
      const response = await authenticatedFetch(buildApiUrl(API_CONFIG.ENDPOINTS.SURVEYS.WITH_FILES(surveyId)));
      
      if (!response.ok) {
        throw new Error('Failed to fetch survey details');
      }
      
      const data = await response.json();
      setSurvey(data);
      setEditCategoryValue(data.category || 'none');
      setEditDescriptionValue(data.description || '');
      setSuggestions(data.ai_suggestions || []);
      setEditSuggestionsValue(data.ai_suggestions || []);
      
      // Set multi-file data if available
      if (data.files) {
        setSurveyFiles(data.files);
      }
      if (data.stats) {
        setSurveyStats(data.stats);
      }
    } catch (error) {
      toast({
        title: t('survey.error'),
        description: t('survey.failedToLoad'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonalities = async () => {
    try {
      const data: AIPersonality[] = await authenticatedApiRequest(buildApiUrl(API_CONFIG.ENDPOINTS.PERSONALITIES));
      const activePersonalities = data.filter(p => p.is_active);
      setPersonalities(activePersonalities);
      
      // Set default personality if available
      const defaultPersonality = activePersonalities.find(p => p.is_default);
      if (defaultPersonality) {
        setSelectedPersonalityId(defaultPersonality.id);
      } else if (activePersonalities.length > 0) {
        setSelectedPersonalityId(activePersonalities[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch personalities:', error);
      toast({
        title: t('survey.warning'),
        description: t('survey.failedToLoadPersonalities'),
        variant: 'destructive',
      });
    }
  };

  const [deleting, setDeleting] = useState(false);

  const handleDeleteSurvey = async () => {
    if (!survey) return;
    if (!window.confirm(t('survey.deleteConfirmation'))) return;
    setDeleting(true);
    try {
      const surveyId = survey.id;
      const response = await authenticatedFetch(buildApiUrl(API_CONFIG.ENDPOINTS.SURVEYS.DETAILS(surveyId)), {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete survey');
      
      // Clear the surveys cache so the admin page refreshes correctly
      const { clearCache } = await import('../utils/requestDeduplication');
      clearCache(`API-GET-${buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN.ACCESS_SURVEYS_FILES)}`);
      
      // Clear unsaved changes since we're deleting the survey
      setHasUnsavedChanges({});
      
      toast({
        title: t('survey.deleted'),
        description: t('survey.deleteSuccess'),
      });
      
      // Use original navigate to bypass unsaved changes warning
      originalNavigate('/admin');
    } catch (error) {
      console.error('Error deleting survey:', error);
      toast({
        title: t('survey.error'),
        description: t('survey.failedToDelete'),
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  // File management functions
  const handleFilesUploaded = (newFiles: SurveyFile[]) => {
    setSurveyFiles(prev => [...prev, ...newFiles]);
    setShowAddFiles(false);
    fetchSurveyDetails(); // Refresh to get updated counts and stats
  };

  const handleFileAdded = () => {
    setShowAddFiles(false);
    fetchSurveyDetails(); // Refresh to get updated counts and stats
  };

  // Multi-file data management functions
  const handleFileSelection = async (fileId: string) => {
    setSelectedFileId(fileId);
    setCurrentPage(1); // Reset to first page
    
    // Check if we already have data for this file
    if (fileDataMap[fileId]) {
      return;
    }

    // Fetch data for the selected file
    setIsLoadingFileData(true);
    try {
  const response = await authenticatedFetch(buildApiUrl(API_CONFIG.ENDPOINTS.SURVEYS.FILES.ROWS(survey?.id, fileId)));
      if (!response.ok) {
        throw new Error('Failed to fetch file data');
      }
      const data = await response.json();
      
      // Clean and validate the data
      const cleanHeaders = data.headers?.map((header: any) => 
        String(header || '').trim().replace(/[\x00-\x1F\x7F-\x9F]/g, '')
      ) || [];
      
      const cleanRows = data.rows?.map((row: any[]) => 
        row.map((cell: any) => {
          let cleanCell = String(cell || '').trim();
          cleanCell = cleanCell.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
          cleanCell = cleanCell.replace(/â€™/g, "'").replace(/â€œ/g, '"').replace(/â€/g, '"');
          return cleanCell;
        })
      ) || [];
      
      setFileDataMap(prev => ({
        ...prev,
        [fileId]: {
          headers: cleanHeaders,
          rows: cleanRows,
          totalResponses: cleanRows.length
        }
      }));
    } catch (error) {
      console.error('Error fetching file data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load file data',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingFileData(false);
    }
  };

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleSaveChanges = async (fileId: string) => {
    const fileData = fileDataMap[fileId];
    if (!fileData) {
      toast({
        title: 'Error',
        description: 'No data to save',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Convert data back to CSV format for saving
      const csvContent = [
        fileData.headers.join(','),
        ...fileData.rows.map(row => row.map(cell => 
          // Escape cells that contain commas, quotes, or newlines
          cell.includes(',') || cell.includes('"') || cell.includes('\n') 
            ? `"${cell.replace(/"/g, '""')}"` 
            : cell
        ).join(','))
      ].join('\n');

      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.SURVEYS.FILES.UPDATE(survey?.id, fileId)), {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/csv',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: csvContent
      });

      if (!response.ok) {
        throw new Error('Failed to save changes');
      }

      // Clear the unsaved changes flag
      setHasUnsavedChanges(prev => ({
        ...prev,
        [fileId]: false
      }));

      toast({
        title: 'Success',
        description: 'Changes saved successfully',
      });
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: 'Error',
        description: 'Failed to save changes. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveAllChanges = async () => {
    const filesToSave = Object.keys(hasUnsavedChanges).filter(fileId => hasUnsavedChanges[fileId]);
    
    if (filesToSave.length === 0) {
      toast({
        title: 'Info',
        description: 'No unsaved changes to save',
      });
      return;
    }

    const savePromises = filesToSave.map(fileId => handleSaveChanges(fileId));
    
    try {
      await Promise.all(savePromises);
      toast({
        title: 'Success',
        description: `Saved changes for ${filesToSave.length} file(s)`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Some files failed to save. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveFile = async (fileId: string) => {
    const fileToRemove = surveyFiles.find(f => f.id === fileId);
    if (!fileToRemove) return;
    
    if (!window.confirm(`Remove "${fileToRemove.filename}" from this survey?`)) return;
    
    try {
      const response = await authenticatedFetch(buildApiUrl(API_CONFIG.ENDPOINTS.SURVEYS.FILES.DELETE(fileId)), {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to remove file');
      }
      
      setSurveyFiles(prev => prev.filter(f => f.id !== fileId));
      toast({ title: t('survey.fileRemovedSuccess') });
      
      // Refresh survey data to update counts
      fetchSurveyDetails();
    } catch (error) {
      console.error('Error removing file:', error);
      toast({ 
        title: t('survey.error'), 
        description: error instanceof Error ? error.message : t('survey.failedToRemoveFile'), 
        variant: "destructive" 
      });
    }
  };



  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
    
    // Add the last field
    result.push(current.trim());
    return result;
  };

  const parseFile = async (file: Blob, filename: string): Promise<string[][]> => {
    const fileName = filename.toLowerCase();
    
    if (fileName.endsWith('.csv')) {
      const text = await file.text();
      return text.split('\n').map(row => row.split(',').map(cell => cell.trim().replace(/["']/g, '')));
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
            resolve(jsonData);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
      });
    } else {
      throw new Error('Unsupported file format');
    }
  };


  const handleExportData = async () => {
    if (!survey) return;

    try {
      // Check if we have file data loaded
      if (Object.keys(fileDataMap).length === 0) {
        // Try to load data from survey files if available
        if (surveyFiles.length > 0) {
          toast({
            title: 'Loading Data',
            description: 'Loading survey data for export...',
          });
          
          // Load data for the first file if none is selected
          const fileToLoad = selectedFileId || surveyFiles[0].id;
          await handleFileSelection(fileToLoad);
          
          // Check again after loading
          if (Object.keys(fileDataMap).length === 0) {
            toast({
              title: t('survey.error'),
              description: 'Failed to load survey data for export.',
              variant: "destructive",
            });
            return;
          }
        } else {
          toast({
            title: t('survey.error'),
            description: 'No survey data available to export. Please upload a file first.',
            variant: "destructive",
          });
          return;
        }
      }

      // Export all files or the currently selected file
      if (selectedFileId && fileDataMap[selectedFileId]) {
        // Export single file
        const fileData = fileDataMap[selectedFileId];
        const csvContent = [
          fileData.headers.join(','),
          ...fileData.rows.map(row => row.map(cell => 
            // Escape cells that contain commas, quotes, or newlines
            cell.includes(',') || cell.includes('"') || cell.includes('\n') 
              ? `"${cell.replace(/"/g, '""')}"` 
              : cell
          ).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Find the filename for the selected file
        const selectedFile = surveyFiles.find(f => f.id === selectedFileId);
        const filename = selectedFile?.filename || `${survey.title || 'survey-data'}.csv`;
        a.download = filename;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: t('survey.success'),
          description: `Exported ${filename}`,
        });
      } else {
        // Export all files as a ZIP or combined CSV
        const allCsvData = Object.entries(fileDataMap).map(([fileId, data]) => {
          const fileName = surveyFiles.find(f => f.id === fileId)?.filename || `file-${fileId}.csv`;
          const csvContent = [
            data.headers.join(','),
            ...data.rows.map(row => row.map(cell => 
              cell.includes(',') || cell.includes('"') || cell.includes('\n') 
                ? `"${cell.replace(/"/g, '""')}"` 
                : cell
            ).join(','))
          ].join('\n');
          return { fileName, csvContent };
        });

        if (allCsvData.length === 1) {
          // Single file export
          const { fileName, csvContent } = allCsvData[0];
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          toast({
            title: t('survey.success'),
            description: `Exported ${fileName}`,
          });
        } else {
          // Multiple files - create a combined export
          const combinedContent = allCsvData.map(({ fileName, csvContent }) => 
            `# File: ${fileName}\n${csvContent}`
          ).join('\n\n');

          const blob = new Blob([combinedContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${survey.title || 'survey-data'}-combined.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          toast({
            title: t('survey.success'),
            description: `Exported ${allCsvData.length} files as combined CSV`,
          });
        }
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: t('survey.error'),
        description: t('survey.exportError') || 'Failed to export data',
        variant: "destructive",
      });
    }
  };

  const handleSaveCategory = async () => {
    if (!survey) return;
    try {
      const surveyId = survey.id;
      const response = await authenticatedFetch(buildApiUrl(API_CONFIG.ENDPOINTS.SURVEYS.DETAILS(surveyId)), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: editCategoryValue === 'none' ? null : editCategoryValue }),
      });
      if (!response.ok) throw new Error('Failed to update category');
      const updatedSurvey = await response.json();
      setSurvey(updatedSurvey);
      setIsEditingCategory(false);
      toast({
        title: 'Success',
        description: 'Category updated successfully',
      });
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: 'Error',
        description: 'Failed to update category',
        variant: 'destructive',
      });
    }
  };

  const handleSaveDescription = async () => {
    if (!survey) return;
    try {
      const surveyId = survey.id;
      const response = await authenticatedFetch(buildApiUrl(API_CONFIG.ENDPOINTS.SURVEYS.DETAILS(surveyId)), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: editDescriptionValue || null }),
      });
      if (!response.ok) throw new Error('Failed to update description');
      const updatedSurvey = await response.json();
      setSurvey(updatedSurvey);
      setIsEditingDescription(false);
      toast({
        title: 'Success',
        description: 'Description updated successfully',
      });
    } catch (error) {
      console.error('Error updating description:', error);
      toast({
        title: 'Error',
        description: 'Failed to update description',
        variant: 'destructive',
      });
    }
  };

  const handleCancelCategoryEdit = () => {
    setEditCategoryValue(survey?.category || 'none');
    setIsEditingCategory(false);
  };

  const handleCancelDescriptionEdit = () => {
    setEditDescriptionValue(survey?.description || '');
    setIsEditingDescription(false);
  };

  const handleSaveSuggestions = async () => {
    if (!survey) return;
    try {
      const surveyId = survey.id;
      const response = await authenticatedFetch(buildApiUrl(API_CONFIG.ENDPOINTS.SURVEYS.DETAILS(surveyId)), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_suggestions: editSuggestionsValue }),
      });
      if (!response.ok) throw new Error('Failed to update AI suggestions');
      const updatedSurvey = await response.json();
      setSurvey(updatedSurvey);
      setSuggestions(editSuggestionsValue);
      setIsEditingSuggestions(false);
      toast({
        title: 'Success',
        description: 'AI suggestions updated successfully',
      });
    } catch (error) {
      console.error('Error updating AI suggestions:', error);
      toast({
        title: 'Error',
        description: 'Failed to update AI suggestions',
        variant: 'destructive',
      });
    }
  };

  const handleCancelSuggestionsEdit = () => {
    setEditSuggestionsValue(survey?.ai_suggestions || []);
    setIsEditingSuggestions(false);
  };

  const handleAddSuggestion = () => {
    setEditSuggestionsValue([...editSuggestionsValue, '']);
  };

  const handleUpdateSuggestion = (index: number, value: string) => {
    const newSuggestions = [...editSuggestionsValue];
    newSuggestions[index] = value;
    setEditSuggestionsValue(newSuggestions);
  };

  const handleRemoveSuggestion = (index: number) => {
    const newSuggestions = editSuggestionsValue.filter((_, i) => i !== index);
    setEditSuggestionsValue(newSuggestions);
  };

  const handleGenerateSuggestions = async () => {
    setIsGenerating(true);
    setSuggestionError(null);
    
    try {
      if (!survey) throw new Error('No survey loaded');
      if (!selectedPersonalityId) throw new Error('Please select an AI personality');
      
      // Use the survey ID
      const surveyId = survey.id;
      if (!surveyId) throw new Error('Survey ID not available');
      
      // Call the backend to generate new suggestions (replaces existing ones)
      const res = await authenticatedFetch(buildApiUrl(API_CONFIG.ENDPOINTS.SURVEYS.SUGGESTIONS(surveyId)), {
        method: 'POST',
        body: JSON.stringify({ 
          personalityId: selectedPersonalityId 
        })
      });
      
      if (!res.ok) {
        throw new Error(`Failed to generate suggestions: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        // Update all related states with the new suggestions
        setSuggestions(data.suggestions);
        setEditSuggestionsValue(data.suggestions);
        
        // Update the survey state to reflect the new suggestions
        setSurvey(prev => prev ? { ...prev, ai_suggestions: data.suggestions } : null);
        
        // Refresh survey details from backend to ensure consistency with saved data
        try {
          const refreshResponse = await authenticatedFetch(buildApiUrl(API_CONFIG.ENDPOINTS.SURVEYS.DETAILS(surveyId)));
          if (refreshResponse.ok) {
            const refreshedSurvey = await refreshResponse.json();
            setSurvey(refreshedSurvey);
            // Ensure edit state is also updated with the refreshed data
            setEditSuggestionsValue(refreshedSurvey.ai_suggestions || []);
          }
        } catch (refreshError) {
          console.warn('Failed to refresh survey details after generating suggestions:', refreshError);
          // This is not critical, we already have the data from the generation response
        }
        
        toast({
          title: 'Success',
          description: `${data.suggestions.length} new AI suggestions generated and saved successfully. Previous suggestions have been replaced.`,
        });
      } else {
        // Clear suggestions if none returned
        setSuggestions([]);
        setEditSuggestionsValue([]);
        setSurvey(prev => prev ? { ...prev, ai_suggestions: [] } : null);
        setSuggestionError('No suggestions returned from AI.');
        
        toast({
          title: 'Warning',
          description: 'No AI suggestions were generated. Please check your survey description and category.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Error generating suggestions:', err);
      setSuggestionError('Error generating suggestions. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to generate AI suggestions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-background">
        <SurveyDetailsHeader surveyTitle="Loading..." />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen gradient-background">
        <SurveyDetailsHeader surveyTitle={t('common.notFound')} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">{t('survey.notFound')}</h1>
            <Button onClick={() => safeNavigate('/admin')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('survey.backToAdmin')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-background">
      <SurveyDetailsHeader 
        surveyTitle={survey.title || survey.filename || 'Unnamed Survey'} 
        onExport={handleExportData}
        rightContent={
          <Button 
            variant="destructive" 
            onClick={handleDeleteSurvey} 
            disabled={deleting}
            className="ml-2"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            {deleting ? 'Deleting...' : 'Delete Survey'}
          </Button>
        }
      />
      
      {/* Global Unsaved Changes Warning */}
      {hasAnyUnsavedChanges() && (
        <div className="container mx-auto px-4">
          <div className="bg-amber-900/30 border border-amber-500/50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></div>
              <div className="flex-1">
                <p className="text-amber-300 font-medium">Unsaved Changes Detected</p>
                <p className="text-amber-200/80 text-sm">
                  You have unsaved changes in your survey data. Don't forget to save before leaving this page.
                </p>
              </div>
              <Button
                onClick={handleSaveAllChanges}
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Save All Changes
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8 space-y-6">

        {/* Survey Overview */}
        <GlassCard title={t('common.surveyOverview')}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-sm text-white/70">Filename</p>
                  <p className="font-semibold text-white">{survey.title || survey.filename || 'Unnamed Survey'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Calendar className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-sm text-white/70">Upload Date</p>
                  <p className="font-semibold text-white">
                    {new Date(survey.createdat).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Users className="w-8 h-8 text-purple-400" />
                <div>
                  <p className="text-sm text-white/70">Total Responses</p>
                  <p className="font-semibold text-white">
                    {selectedFileId && fileDataMap[selectedFileId] ? fileDataMap[selectedFileId].totalResponses : 0}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <BarChart3 className="w-8 h-8 text-orange-400" />
                <div>
                  <p className="text-sm text-white/70">Data Fields</p>
                  <p className="font-semibold text-white">
                    {selectedFileId && fileDataMap[selectedFileId] ? fileDataMap[selectedFileId].headers.length : 0}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Tag className="w-8 h-8 text-cyan-400" />
                <div className="flex-1">
                  <p className="text-sm text-white/70">Category</p>
                  {isEditingCategory ? (
                    <div className="flex items-center space-x-2 mt-1">
                      <Select value={editCategoryValue} onValueChange={setEditCategoryValue}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white min-w-[150px]">
                          <SelectValue placeholder={t('common.selectCategory')} />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600 z-50">
                          <SelectItem value="none">{t('common.noCategory')}</SelectItem>
                          <SelectItem value="sports">{t('categories.sports')}</SelectItem>
                          <SelectItem value="betting">{t('categories.betting')}</SelectItem>
                          <SelectItem value="cooking">{t('categories.cooking')}</SelectItem>
                          <SelectItem value="technology">{t('categories.technology')}</SelectItem>
                          <SelectItem value="health">{t('categories.health')}</SelectItem>
                          <SelectItem value="travel">{t('categories.travel')}</SelectItem>
                          <SelectItem value="education">{t('categories.education')}</SelectItem>
                          <SelectItem value="entertainment">{t('categories.entertainment')}</SelectItem>
                          <SelectItem value="gaming">{t('categories.gaming')}</SelectItem>
                          <SelectItem value="finance">{t('categories.finance')}</SelectItem>
                          <SelectItem value="fashion">{t('categories.fashion')}</SelectItem>
                          <SelectItem value="automotive">{t('categories.automotive')}</SelectItem>
                          <SelectItem value="real-estate">{t('categories.realEstate')}</SelectItem>
                          <SelectItem value="food-delivery">{t('categories.foodDelivery')}</SelectItem>
                          <SelectItem value="music">{t('categories.music')}</SelectItem>
                          <SelectItem value="movies">{t('categories.movies')}</SelectItem>
                          <SelectItem value="books">{t('categories.books')}</SelectItem>
                          <SelectItem value="news">{t('categories.news')}</SelectItem>
                          <SelectItem value="politics">{t('categories.politics')}</SelectItem>
                          <SelectItem value="social-media">{t('categories.socialMedia')}</SelectItem>
                          <SelectItem value="e-commerce">{t('categories.ecommerce')}</SelectItem>
                          <SelectItem value="healthcare">{t('categories.healthcare')}</SelectItem>
                          <SelectItem value="insurance">{t('categories.insurance')}</SelectItem>
                          <SelectItem value="cryptocurrency">{t('categories.cryptocurrency')}</SelectItem>
                          <SelectItem value="business">{t('categories.business')}</SelectItem>
                          <SelectItem value="marketing">{t('categories.marketing')}</SelectItem>
                          <SelectItem value="other">{t('categories.other')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" onClick={handleSaveCategory} className="bg-green-600 hover:bg-green-700">
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelCategoryEdit} className="border-gray-600 text-gray-300 hover:bg-gray-700">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" className="capitalize bg-blue-500/20 text-blue-300">
                        {survey.category ? survey.category.replace('-', ' ') : t('common.uncategorized')}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => setIsEditingCategory(true)}
                        className="text-gray-400 hover:text-white h-8 w-8 p-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            
            <div className="flex items-start space-x-3">
              <MessageSquare className="w-8 h-8 text-yellow-400 mt-1" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-white/70">Description</p>
                  {!isEditingDescription && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setIsEditingDescription(true)}
                      className="text-gray-400 hover:text-white h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {isEditingDescription ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editDescriptionValue}
                      onChange={(e) => setEditDescriptionValue(e.target.value)}
                      placeholder="Add a description for this survey..."
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      rows={3}
                    />
                    <div className="flex items-center space-x-2">
                      <Button size="sm" onClick={handleSaveDescription} className="bg-green-600 hover:bg-green-700">
                        <Check className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelDescriptionEdit} className="border-gray-600 text-gray-300 hover:bg-gray-700">
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-white leading-relaxed">
                    {survey.description || 'No description provided'}
                  </p>
                )}
              </div>
            </div>
            
            {/* AI Suggestions Section */}
            <div className="flex items-start space-x-3">
              <Lightbulb className="w-8 h-8 text-purple-400 mt-1" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-white/70">AI Suggestions</p>
                  {!isEditingSuggestions && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setIsEditingSuggestions(true)}
                      className="text-gray-400 hover:text-white h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {isEditingSuggestions ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      {editSuggestionsValue.map((suggestion, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Textarea
                            value={suggestion}
                            onChange={(e) => handleUpdateSuggestion(index, e.target.value)}
                            placeholder={`Suggestion ${index + 1}...`}
                            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 flex-1"
                            rows={2}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveSuggestion(index)}
                            className="border-red-600 text-red-400 hover:bg-red-600/20 h-auto"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleAddSuggestion}
                        className="border-purple-600 text-purple-400 hover:bg-purple-600/20"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Suggestion
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" onClick={handleSaveSuggestions} className="bg-green-600 hover:bg-green-700">
                        <Check className="w-4 h-4 mr-1" />
                        Save Suggestions
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelSuggestionsEdit} className="border-gray-600 text-gray-300 hover:bg-gray-700">
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {suggestions && suggestions.length > 0 ? (
                      <div className="space-y-2">
                        {suggestions.map((suggestion, index) => (
                          <div key={index} className="bg-gray-700/50 rounded-lg p-3 border border-purple-500/30">
                            <div className="flex items-start space-x-2">
                              <span className="text-purple-400 font-semibold text-sm mt-0.5">{index + 1}.</span>
                              <p className="text-white leading-relaxed flex-1">{suggestion}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-white/70">No AI suggestions available. Generate some using the button below or add them manually.</p>
                    )}
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-white/80">AI Personality:</label>
                        <Select value={selectedPersonalityId} onValueChange={setSelectedPersonalityId}>
                          <SelectTrigger className="w-48 bg-gray-800 border-gray-600 text-white">
                            <SelectValue placeholder="Select personality..." />
                          </SelectTrigger>
                          <SelectContent>
                            {personalities.map((personality) => (
                              <SelectItem key={personality.id} value={personality.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{personality.name}</span>
                                  <span className="text-xs text-gray-400">{personality.description}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          onClick={handleGenerateSuggestions} 
                          disabled={isGenerating || !selectedPersonalityId} 
                          className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                        >
                          {isGenerating 
                            ? 'Generating New Suggestions...' 
                            : suggestions.length > 0 
                              ? 'Re-Generate AI Suggestions (Replace Current)'
                              : 'Generate AI Suggestions'
                          }
                        </Button>
                        {suggestionError && (
                          <p className="text-red-400">{suggestionError}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Survey Files Section */}
        <GlassCard title="Survey Files">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="text-white font-medium">Files ({surveyFiles.length || 0})</h3>
                  <p className="text-gray-400 text-sm">
                    {surveyStats ? (
                      <>
                        Total size: {formatFileSize(surveyStats.totalSize)} • 
                        Types: {Object.entries(surveyStats.fileTypes).map(([ext, count]) => 
                          `${count} ${ext.toUpperCase()}`
                        ).join(', ')}
                      </>
                    ) : (
                      'Survey file information'
                    )}
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => setShowAddFiles(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Files
              </Button>
            </div>

            {surveyFiles.length > 0 ? (
              <div className="grid gap-3">
                {surveyFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-white font-medium">{file.filename}</p>
                        <p className="text-gray-400 text-sm">
                          {file.file_size ? formatFileSize(file.file_size) : 'Size unknown'} • 
                          Uploaded {new Date(file.upload_date).toLocaleDateString()} at {new Date(file.upload_date).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedFileForPreview(file)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveFile(file.id)}
                        className="text-red-400 border-red-600 hover:bg-red-600/20"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-600 rounded-lg">
                <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-lg font-medium">No files uploaded yet</p>
                <p className="text-sm">Add files to this survey to start analyzing data</p>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Add Files Dialog */}
        {showAddFiles && (
          <Dialog open={showAddFiles} onOpenChange={setShowAddFiles}>
            <DialogContent className="max-w-md bg-transparent border-none p-0 shadow-none">
              <AddFileUpload 
                surveyId={survey?.id || ''}
                onFileAdded={handleFileAdded}
                onClose={() => setShowAddFiles(false)}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Survey Data */}
        <GlassCard title="Survey Data">
          <div className="space-y-4">
            {/* Save Changes Button */}
            {selectedFileId && fileDataMap[selectedFileId] && (
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  {hasUnsavedChanges[selectedFileId] && (
                    <div className="flex items-center gap-2 text-amber-400 text-sm">
                      <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                      <span>Unsaved changes</span>
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => handleSaveChanges(selectedFileId)}
                  className={hasUnsavedChanges[selectedFileId] ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 hover:bg-gray-700"}
                  size="sm"
                  disabled={!hasUnsavedChanges[selectedFileId]}
                >
                  {hasUnsavedChanges[selectedFileId] ? 'Save Changes' : 'No Changes'}
                </Button>
              </div>
            )}

            {/* File Selector */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <Label className="text-gray-300 text-sm">Select File</Label>
                  <Select value={selectedFileId || ''} onValueChange={handleFileSelection}>
                    <SelectTrigger className="w-80 bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Choose a file to view data" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {surveyFiles.map((file) => {
                        const fileData = fileDataMap[file.id];
                        const participantCount = fileData ? getUniqueParticipantCount(fileData) : 0;
                        const responseCount = fileData ? fileData.totalResponses : 0;
                        
                        return (
                          <SelectItem key={file.id} value={file.id} className="text-white hover:bg-gray-700">
                            {file.filename} - {participantCount} participants, {responseCount} responses ({formatFileSize(file.file_size || 0)})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                {selectedFileId && fileDataMap[selectedFileId] && (
                  <div className="text-sm text-gray-400">
                    {fileDataMap[selectedFileId].totalResponses} responses • {getUniqueParticipantCount(fileDataMap[selectedFileId])} participants
                  </div>
                )}
              </div>
            </div>

            {/* Data Display */}
            {surveyFiles.length > 0 ? (
              <>
                {isLoadingFileData ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-300">Loading file data...</span>
                  </div>
                ) : selectedFileId && fileDataMap[selectedFileId] ? (
                  <MultiFileDataTable
                    data={fileDataMap[selectedFileId]}
                    currentPage={currentPage}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onDataChange={(newRows) => {
                      setFileDataMap(prev => ({
                        ...prev,
                        [selectedFileId]: {
                          ...prev[selectedFileId],
                          rows: newRows,
                          totalResponses: newRows.length
                        }
                      }));
                      setHasUnsavedChanges(prev => ({
                        ...prev,
                        [selectedFileId]: true
                      }));
                    }}
                  />
                ) : selectedFileId ? (
                  <div className="text-center py-8">
                    <p className="text-white/70">Failed to load file data</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-600 rounded-lg">
                    <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-lg font-medium">Select a file to view data</p>
                    <p className="text-sm">Choose a file from the dropdown above to see its data</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-600 rounded-lg">
                <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-lg font-medium">No files uploaded yet</p>
                <p className="text-sm">Add files to this survey to start analyzing data</p>
              </div>
            )}
          </div>
        </GlassCard>


      </div>
    </div>
  );
};

export default SurveyDetails;
