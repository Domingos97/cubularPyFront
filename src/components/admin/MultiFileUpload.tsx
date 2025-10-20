import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, X, Upload, AlertCircle, FileSpreadsheet, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/utils/api';
import { API_CONFIG, buildApiUrl } from '@/config';
import { SurveyFile, Survey, CreateSurveyRequest, AddFileToSurveyResponse } from '@/types/survey';
import type { AIPersonality } from '@/hooks/usePersonalities';
import { useTranslation } from '@/resources/i18n';
import * as XLSX from 'xlsx';

interface MultiFileUploadProps {
  surveyId?: string; // If provided, files will be added to existing survey
  onSurveyCreated?: (survey: Survey) => void;
  onFilesUploaded?: (files: SurveyFile[]) => void;
  onUploadComplete?: () => void;
  maxFiles?: number;
  allowedExtensions?: string[];
}

interface FileWithPreview {
  file: File;
  id: string;
  preview?: {
    headers: string[];
    sampleRows: string[][];
    totalRows: number;
  };
}

export const MultiFileUpload: React.FC<MultiFileUploadProps> = ({
  surveyId,
  onSurveyCreated,
  onFilesUploaded,
  onUploadComplete,
  maxFiles = 10,
  allowedExtensions = ['.csv', '.xlsx', '.xls']
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  // Survey creation fields
  const [surveyTitle, setSurveyTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [numberParticipants, setNumberParticipants] = useState<number | undefined>();
  
  // AI Suggestions functionality
  const [personalities, setPersonalities] = useState<AIPersonality[]>([]);
  const [selectedPersonality, setSelectedPersonality] = useState<string>('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);
  
  // File handling
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [currentSurveyId, setCurrentSurveyId] = useState(surveyId);
  const [createdSurveyId, setCreatedSurveyId] = useState<string | null>(null);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [showCreationForm, setShowCreationForm] = useState(!surveyId); // Show form if no surveyId provided
  
  // Reset form function
  const resetForm = useCallback(() => {
    setSelectedFiles([]);
    setSurveyTitle('');
    setCategory('');
    setDescription('');
    setNumberParticipants(undefined);
    setAiSuggestions([]);
    setSelectedPersonality(personalities.find(p => p.is_default)?.id || '');
    setCreatedSurveyId(null);
    setProcessingComplete(false);
    setProgress(0);
    setError('');
    // Only reset showCreationForm if we're not in an existing survey context
    if (!surveyId) {
      setShowCreationForm(true);
      setCurrentSurveyId(undefined);
    }
  }, [personalities, surveyId]);

  // Fetch AI personalities on component mount
  React.useEffect(() => {
    const fetchPersonalities = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.PERSONALITIES), {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch personalities');
        }
        const data = await response.json();
        setPersonalities(data);
        const defaultPersonality = data.find((p: AIPersonality) => p.is_default);
        if (defaultPersonality) {
          setSelectedPersonality(defaultPersonality.id);
        }
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "Could not load AI personalities.",
          variant: "destructive",
        });
      }
    };

    fetchPersonalities();
  }, [toast]);

  // Validate file type and size
  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 50MB limit' };
    }
    
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      return { 
        valid: false, 
        error: `Invalid file type. Allowed: ${allowedExtensions.join(', ')}` 
      };
    }
    
    return { valid: true };
  }, [allowedExtensions]);

  // Generate preview for supported file types
  const generateFilePreview = useCallback(async (file: File): Promise<FileWithPreview['preview']> => {
    return new Promise((resolve) => {
      const fileName = file.name.toLowerCase();
      
      if (fileName.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            const lines = content.split('\n').filter(line => line.trim());
            const headers = lines[0]?.split(',').map(h => h.replace(/[\"']/g, '').trim()) || [];
            const sampleRows = lines.slice(1, 6).map(line => 
              line.split(',').map(cell => cell.replace(/[\"']/g, '').trim())
            );
            
            resolve({
              headers,
              sampleRows,
              totalRows: lines.length - 1
            });
          } catch (error) {
            resolve({
              headers: ['Preview Error'],
              sampleRows: [['Could not generate preview']],
              totalRows: 0
            });
          }
        };
        reader.readAsText(file);
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        // Handle Excel files with XLSX library
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            
            if (!firstSheetName) {
              resolve({
                headers: ['No sheets found'],
                sampleRows: [['Empty workbook']],
                totalRows: 0
              });
              return;
            }
            
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
            
            const headers = jsonData[0]?.map(h => String(h || '').trim()) || [];
            const dataRows = jsonData.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== ''));
            const sampleRows = dataRows.slice(0, 5).map(row => 
              row.map(cell => String(cell || '').trim())
            );
            
            resolve({
              headers: headers.length > 0 ? headers : ['Column 1'],
              sampleRows,
              totalRows: dataRows.length
            });
          } catch (error) {
            console.error('Excel parsing error:', error);
            resolve({
              headers: ['Excel Parse Error'],
              sampleRows: [['Could not read Excel file']],
              totalRows: 0
            });
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        // Unsupported file type
        resolve({
          headers: ['Unsupported file type'],
          sampleRows: [['Preview not available']],
          totalRows: 0
        });
      }
    });
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (selectedFiles.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }
    
    const newFiles: FileWithPreview[] = [];
    
    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(`${file.name}: ${validation.error}`);
        continue;
      }
      
      // Check for duplicates
      if (selectedFiles.some(f => f.file.name === file.name && f.file.size === file.size)) {
        setError(`File already selected: ${file.name}`);
        continue;
      }
      
      const fileWithPreview: FileWithPreview = {
        file: file,
        id: `${Date.now()}-${Math.random()}`,
      };
      
      // Generate preview
      try {
        fileWithPreview.preview = await generateFilePreview(file);
      } catch (error) {
        console.warn(`Failed to generate preview for ${file.name}:`, error);
      }
      
      newFiles.push(fileWithPreview);
    }
    
    setSelectedFiles(prev => [...prev, ...newFiles]);
    setError('');
    
    // Clear the input value to allow selecting the same file again if removed
    e.target.value = '';
  }, [selectedFiles, maxFiles, validateFile, generateFilePreview]);

  // Remove file from selection
  const removeFile = useCallback((fileId: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  // Create survey (if needed)
  const createSurvey = useCallback(async (): Promise<string> => {
    // Return existing survey ID if we have one
    if (currentSurveyId) return currentSurveyId;
    if (createdSurveyId) return createdSurveyId;
    
    if (!surveyTitle.trim()) {
      throw new Error('Survey title is required');
    }
    
    const surveyData: CreateSurveyRequest = {
      title: surveyTitle.trim(),
      category: category.trim() || undefined,
      description: description.trim() || undefined,
      number_participants: numberParticipants
      // Note: ai_suggestions will be generated and saved separately after survey creation
    };
    
    // Ensure empty strings become undefined
    if (surveyData.category === '') surveyData.category = undefined;
    if (surveyData.description === '') surveyData.description = undefined;
    
    const response = await authenticatedFetch(buildApiUrl(API_CONFIG.ENDPOINTS.SURVEYS.BASE), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(surveyData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create survey');
    }
    
    const survey = await response.json();
    setCurrentSurveyId(survey.id);
    setCreatedSurveyId(survey.id);
    
    if (onSurveyCreated) {
      onSurveyCreated(survey);
    }
    
    return survey.id;
  }, [currentSurveyId, createdSurveyId, surveyTitle, category, description, numberParticipants, onSurveyCreated]);

  // Generate AI suggestions based on description, category, and file content
  const generateAISuggestions = useCallback(async () => {
    if (selectedFiles.length === 0 || !selectedPersonality) {
      toast({
        title: "Missing Information",
        description: "Please select at least one file and choose a personality before generating questions.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingSuggestions(true);
    setError('');

    try {
      // Create survey first if needed to get survey_id
      const activeSurveyId = await createSurvey();
      
      // Use the first file for content sample
      const firstFile = selectedFiles[0];
      let sampleContent = { headers: [], sampleRows: [] };
      
      // Try to get file content from preview if available
      if (firstFile.preview) {
        sampleContent = {
          headers: firstFile.preview.headers,
          sampleRows: firstFile.preview.sampleRows
        };
      }

      // Generate suggestions with survey_id
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.SURVEYS.SUGGESTIONS(activeSurveyId))}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          personalityId: selectedPersonality,
          fileContent: sampleContent,
          surveyId: activeSurveyId,
        })
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to generate suggestions';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If response is not JSON (like HTML error page), use status text
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      setAiSuggestions(data.suggestions || []);
      
      toast({
        title: "Analysis Questions Generated",
        description: "AI has generated specific analysis questions for your survey data.",
      });
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to generate analysis questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingSuggestions(false);
    }
  }, [description, category, selectedFiles, selectedPersonality, toast]);

  // Upload files
  const uploadFiles = useCallback(async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file');
      return;
    }
    
    setUploading(true);
    setError('');
    setProgress(0);
    
    try {
      // Create survey if needed
      const activeSurveyId = await createSurvey();
      setCreatedSurveyId(activeSurveyId);
      
      // Generate and save AI suggestions if personality is selected and we have required data
      if (selectedPersonality && description.trim() && category && selectedFiles.length > 0) {
        try {
          // Use the same approach as SurveyDetails - generate and save suggestions via the proper endpoint
          // Get sample content from first file for the AI generation
          const firstFile = selectedFiles[0];
          let fileContent = { headers: [], sampleRows: [] };
          
          if (firstFile?.preview) {
            fileContent = {
              headers: firstFile.preview.headers,
              sampleRows: firstFile.preview.sampleRows
            };
          }
          
          const response = await authenticatedFetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.SURVEYS.SUGGESTIONS(activeSurveyId))}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              personalityId: selectedPersonality,
              fileContent: fileContent,
              surveyId: activeSurveyId
            })
          });
          
          if (!response.ok) {
            // Don't throw here, continue with file upload even if suggestions save fails
          } else {
            const suggestionData = await response.json();
          }
        } catch (suggestionError) {
          // Don't throw here, continue with file upload even if suggestions save fails
        }
      }
      
      // Upload files one by one
      const uploadedFiles: SurveyFile[] = [];
      const totalFiles = selectedFiles.length;
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        const formData = new FormData();
        formData.append('file', file.file);
        
        const response = await authenticatedFetch(
          buildApiUrl(API_CONFIG.ENDPOINTS.SURVEYS.FILES.BASE(activeSurveyId)),
          {
            method: 'POST',
            body: formData
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Failed to upload ${file.file.name}: ${errorData.error || 'Unknown error'}`);
        }
        
        const result: AddFileToSurveyResponse = await response.json();
        uploadedFiles.push(result.file);
        
        // Update progress
        setProgress(((i + 1) / totalFiles) * 100);
      }
      
      // All files uploaded successfully - processing will happen in background
      setProgress(100); // Mark upload as complete
      
      let successMessage = `Successfully uploaded ${uploadedFiles.length} files`;
      if (selectedPersonality && description.trim() && category) {
        successMessage += " and generated AI analysis questions";
      }
      successMessage += ". Processing will continue in background.";

      toast({
        title: "Files Uploaded Successfully",
        description: successMessage,
      });

      if (onFilesUploaded) {
        onFilesUploaded(uploadedFiles);
      }

      // Mark processing as complete
      setProcessingComplete(true);
      // Stop uploading state (processing continues in background)
      setUploading(false);

      // Hide creation form after successful upload (but not when just generating suggestions)
      setShowCreationForm(false);

      // Clear selected files and some form fields but preserve createdSurveyId and processingComplete
      setSelectedFiles([]);
      setSurveyTitle('');
      setCategory('');
      setDescription('');
      setNumberParticipants(undefined);
      setAiSuggestions([]);
      setSelectedPersonality(personalities.find(p => p.is_default)?.id || '');

      if (onUploadComplete) {
        onUploadComplete();
      }
      
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
      setUploading(false);
      setCreatedSurveyId(null);
      setProgress(0);
      
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    }
    // Don't reset uploading state in finally - it will be reset when processing completes
  }, [selectedFiles, createSurvey, onFilesUploaded, onUploadComplete, toast, resetForm, personalities, selectedPersonality, description, category]);

  return (
    <div className="space-y-6">
      {/* Survey Information (only if creating new survey) */}
      {showCreationForm && (
        <Card className="bg-gray-800/50 border-gray-600">
          <CardHeader>
            <CardTitle className="text-white">Survey Information</CardTitle>
            <CardDescription className="text-gray-300">
              Basic information about your survey
              {currentSurveyId && (
                <span className="block text-green-400 text-sm mt-1">
                  ✓ Survey created successfully
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="survey-title" className="text-white">Survey Title *</Label>
              <Input
                id="survey-title"
                value={surveyTitle}
                onChange={(e) => setSurveyTitle(e.target.value)}
                placeholder="Enter survey title..."
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="category-select" className="text-white">Category</Label>
              <Select value={category} onValueChange={setCategory} disabled={uploading}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder={t('common.selectCategory')} />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
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
              <p className="text-xs text-gray-400 mt-1">
                Choose the category that best describes your survey data
              </p>
            </div>
            
            <div>
              <Label htmlFor="description" className="text-white">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Survey description (optional)..."
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
            
            <div>
              <Label htmlFor="participants" className="text-white">Expected Participants</Label>
              <Input
                id="participants"
                type="number"
                value={numberParticipants || ''}
                onChange={(e) => setNumberParticipants(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Number of participants (optional)..."
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                min="0"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Suggestions Section */}
      {showCreationForm && (
        <Card className="bg-gray-800/50 border-gray-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              AI Analysis Questions
            </CardTitle>
            <CardDescription className="text-gray-300">
              Generate specific analysis questions for your survey data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="personality-select" className="text-white">AI Personality</Label>
              <Select value={selectedPersonality} onValueChange={setSelectedPersonality} disabled={uploading}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Select a personality" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {personalities.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{p.name}</span>
                        <span className="text-xs text-gray-400">{p.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400 mt-1">
                Choose the AI personality for generating analysis questions
              </p>
            </div>

            <Button 
              onClick={generateAISuggestions} 
              disabled={generatingSuggestions || !description.trim() || !category || selectedFiles.length === 0 || !selectedPersonality}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {generatingSuggestions ? 'Generating...' : 'Generate Analysis Questions'}
            </Button>

            {aiSuggestions.length > 0 && (
              <div className="bg-gray-700/50 p-4 rounded-md">
                <p className="text-sm font-semibold text-white mb-2">Suggested Questions:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                  {aiSuggestions.map((q, i) => <li key={i}>{q}</li>)}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* File Selection */}
      <Card className="bg-gray-800/50 border-gray-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Select Files
          </CardTitle>
          <CardDescription className="text-gray-300">
            Upload CSV, XLS, or XLSX files (max {maxFiles} files, 50MB each)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Input
                type="file"
                multiple
                accept={allowedExtensions.join(',')}
                onChange={handleFileSelect}
                className="bg-gray-700 border-gray-600 text-white file:bg-gray-600 file:text-white file:border-0 file:rounded file:px-4 file:py-2"
              />
            </div>
            
            {error && (
              <Alert className="border-red-600 bg-red-900/20">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-300">{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <Card className="bg-gray-800/50 border-gray-600">
          <CardHeader>
            <CardTitle className="text-white">Selected Files ({selectedFiles.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedFiles.map((file) => (
              <div key={file.id} className="bg-gray-700/50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-white font-medium">{file.file.name}</p>
                      <p className="text-gray-400 text-sm">
                        {file.file.size ? (file.file.size / 1024 / 1024).toFixed(2) : '0.00'} MB
                        {file.preview && ` • ${file.preview.totalRows} rows`}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* File preview */}
                {file.preview && file.preview.headers.length > 0 && (
                  <div className="text-sm">
                    <p className="text-gray-300 mb-2">Preview:</p>
                    <div className="bg-gray-800 p-3 rounded overflow-x-auto">
                      <div className="text-xs font-mono">
                        <div className="text-blue-300 mb-1">
                          {file.preview.headers.slice(0, 5).join(' | ')}
                          {file.preview.headers.length > 5 && '...'}
                        </div>
                        {file.preview.sampleRows.slice(0, 2).map((row, i) => (
                          <div key={i} className="text-gray-300">
                            {row.slice(0, 5).join(' | ')}
                            {row.length > 5 && '...'}
                          </div>
                        ))}
                        {file.preview.totalRows > 2 && (
                          <div className="text-gray-500 italic">
                            ... and {file.preview.totalRows - 2} more rows
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Upload Progress */}
      {uploading && (
        <Card className="bg-gray-800/50 border-gray-600">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* File Upload Progress */}
              {progress < 100 ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-300">
                    <span>Uploading files...</span>
                    <span>{progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              ) : (
                // Processing Progress
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-300">
                    <span>
                      {progress < 100 ? 'Uploading files...' : 
                       processingComplete ? 'Upload complete!' :
                       'Processing...'}
                    </span>
                  </div>
                  <Progress 
                    value={processingComplete ? 100 : progress} 
                    className="w-full" 
                  />
                  {progress >= 100 && !processingComplete && (
                    <div className="text-xs text-blue-400 mt-2 italic">
                      💡 Files uploaded successfully. Processing in background.
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Button */}
      <Button 
        onClick={uploadFiles} 
        disabled={uploading || selectedFiles.length === 0 || (showCreationForm && !surveyTitle.trim())}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        size="lg"
      >
        {uploading ? (
          progress < 100 ? (
            <>Uploading {selectedFiles.length} files...</>
          ) : processingComplete ? (
            <>Survey created successfully!</>
          ) : (
            <>Processing...</>
          )
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
            {showCreationForm && ' & Create Survey'}
          </>
        )}
      </Button>
    </div>
  );
};
