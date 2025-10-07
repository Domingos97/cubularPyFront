// Utility to count unique participants based on 'Pessoa' column
  const getUniqueParticipantCount = (data: string[][], participantColumn: string = 'Pessoa') => {
    if (!data.length) return 0;
    const headers = data[0];
    const rows = data.slice(1);
    const colIndex = headers.findIndex(h => h.trim().toLowerCase() === participantColumn.trim().toLowerCase());
    if (colIndex === -1) return 0;
    const participants = new Set<string>();
    for (const row of rows) {
      if (row[colIndex]) participants.add(row[colIndex].trim());
    }
    return participants.size;
  };
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, AlertCircle, CheckCircle, FileSpreadsheet, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/resources/i18n';
import * as XLSX from 'xlsx';
import { parseCSVFile, downloadCSV, validateCSVHeaders } from '@/utils/csvUtils';
import type { AIPersonality } from '@/hooks/usePersonalities';

interface FileUploadProps {
  onUploadComplete: () => void;
}

export const CSVUpload = ({ onUploadComplete }: FileUploadProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string[][]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);
  const [uploadedSurveyId, setUploadedSurveyId] = useState<string | null>(null);
  const [personalities, setPersonalities] = useState<AIPersonality[]>([]);
  const [selectedPersonality, setSelectedPersonality] = useState<string>('');

  useEffect(() => {
    const fetchPersonalities = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('http://localhost:3000/api/personalities', {
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

  const sanitizeFilename = (filename: string): string => {
    // Get file extension
    const lastDotIndex = filename.lastIndexOf('.');
    const name = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
    const extension = lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';
    
    // Replace spaces with underscores and remove special characters
    const sanitizedName = name
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    
    return sanitizedName + extension;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const fileExtension = selectedFile.name.toLowerCase();
    if (!fileExtension.endsWith('.csv') && !fileExtension.endsWith('.xlsx') && !fileExtension.endsWith('.xls')) {
      setError('Please select a CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }

    setFile(selectedFile);
    setError('');
    try {
      // Preview first few rows using new utility
      const { headers, rows } = await parseCSVFile(selectedFile);
      const previewRows = rows.slice(0, 5);
      setPreview(previewRows);
      // Count unique participants and save for later use
      const participantCount = getUniqueParticipantCount([headers, ...rows]);
      // You can save this in state or pass to parent as needed
      setParticipantCount(participantCount);
    } catch (error) {
      setError('Error reading file. Please check the format.');
    }
  };
  // Add participantCount state
  const [participantCount, setParticipantCount] = useState<number | null>(null);

  const parseFile = async (file: File): Promise<string[][]> => {
    const fileName = file.name.toLowerCase();
    
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

  const parseDataForDatabase = (data: string[][], originalFilename: string): Array<{ filename: string }> => {
    // For CSV uploads, we create one survey record per file
    // The filename will be the original file name, and fileid will be auto-generated
    return [{
      filename: originalFilename
    }];
  };

  const generateAISuggestions = async () => {
    if (!description || !category || !file || !selectedPersonality) {
      toast({
        title: "Missing Information",
        description: "Please fill in category, description, select a file, and choose a personality before generating questions.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingSuggestions(true);

    try {
      // Get sample file content for better question generation
      const fileData = await parseFile(file);
      const sampleContent = {
        headers: fileData[0] || [],
        sampleRows: fileData.slice(1, 4) // Get first 3 data rows as sample
      };

      // Generate suggestions directly without saving survey
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`http://localhost:3000/api/surveys/generate-suggestions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          description,
          category,
          fileContent: sampleContent,
          personalityId: selectedPersonality,
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate suggestions');
      }
      const data = await response.json();
      setAiSuggestions(data.suggestions || []);
      toast({
        title: "Analysis Questions Generated",
        description: "AI has generated specific analysis questions for your survey data.",
      });
    } catch (error) {
      // Handle error silently
      toast({
        title: "Error",
        description: "Failed to generate analysis questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingSuggestions(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError('');

    try {
      // Read and parse file
      const fileData = await parseFile(file);
      const surveyData = parseDataForDatabase(fileData, file.name);

      setProgress(25);

      // Upload original file to storage (no conversion needed)
      const sanitizedFilename = sanitizeFilename(file.name);
      const filename = `survey-${Date.now()}-${sanitizedFilename}`;
      
      // Upload file to backend with metadata and AI suggestions
      const formData = new FormData();
      formData.append('file', file, filename);
      formData.append('category', category || '');
      formData.append('description', description || '');
      formData.append('number_participants', participantCount?.toString() || '');
      formData.append('ai_suggestions', JSON.stringify(aiSuggestions));
      
      const token = localStorage.getItem('authToken');
      const uploadHeaders: Record<string, string> = {};
      
      if (token) {
        uploadHeaders['Authorization'] = `Bearer ${token}`;
      }
      
      const uploadResponse = await fetch('http://localhost:3000/api/surveys/upload', {
        method: 'POST',
        headers: uploadHeaders,
        body: formData
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      const uploadResult = await uploadResponse.json();
      const createdSurvey = uploadResult.survey;
      
      if (!createdSurvey || !createdSurvey.id) {
        throw new Error('Failed to get survey ID from upload response');
      }

      // Store the uploaded survey ID for generating suggestions
      setUploadedSurveyId(createdSurvey.id);

      setProgress(75);

      setProgress(100);

      toast({
        title: "Success",
        description: `Successfully uploaded survey file: ${file.name}`,
      });

      // Reset form
      setFile(null);
      setCategory('');
      setDescription('');
      setPreview([]);
      setAiSuggestions([]);
      setProgress(0);
      setUploadedSurveyId(null);
      setParticipantCount(null);
      onUploadComplete();

    } catch (error) {
      // Handle error silently
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="file-upload" className="text-gray-300">
            Select File
          </Label>
          <div className="mt-2">
            <Input
              id="file-upload"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              disabled={uploading}
              className="bg-gray-700 border-gray-600 text-white file:bg-gray-600 file:text-white file:border-0 file:mr-4 file:py-2 file:px-4 file:rounded-md"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Accepts CSV and Excel files (.csv, .xlsx, .xls) containing survey data
          </p>
        </div>

        <div>
          <Label htmlFor="category-select" className="text-gray-300">
            Category
          </Label>
          <div className="mt-2">
            <Select value={category} onValueChange={setCategory} disabled={uploading}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder={t('common.selectCategory')} />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="sports">Sports</SelectItem>
                <SelectItem value="betting">Betting</SelectItem>
                <SelectItem value="cooking">Cooking</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="health">Health & Fitness</SelectItem>
                <SelectItem value="travel">Travel</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="entertainment">Entertainment</SelectItem>
                <SelectItem value="gaming">Gaming</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="fashion">Fashion</SelectItem>
                <SelectItem value="automotive">Automotive</SelectItem>
                <SelectItem value="real-estate">Real Estate</SelectItem>
                <SelectItem value="food-delivery">Food & Delivery</SelectItem>
                <SelectItem value="music">Music</SelectItem>
                <SelectItem value="movies">Movies & TV</SelectItem>
                <SelectItem value="books">Books & Literature</SelectItem>
                <SelectItem value="news">News & Media</SelectItem>
                <SelectItem value="politics">Politics</SelectItem>
                <SelectItem value="social-media">Social Media</SelectItem>
                <SelectItem value="e-commerce">E-commerce</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
                <SelectItem value="cryptocurrency">Cryptocurrency</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Choose the category that best describes your survey data
          </p>
        </div>

        <div>
          <Label htmlFor="personality-select" className="text-gray-300">
            AI Personality
          </Label>
          <div className="mt-2">
            <Select value={selectedPersonality} onValueChange={setSelectedPersonality} disabled={uploading}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select a personality" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                {personalities.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Choose the AI personality for generating analysis questions.
          </p>
        </div>

        <div>
          <Label htmlFor="description" className="text-gray-300">
            Description (Optional)
          </Label>
          <div className="mt-2">
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Survey on consumer preferences for a new sports drink"
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={generateAISuggestions} 
            disabled={generatingSuggestions || !description || !category}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {generatingSuggestions ? 'Generating...' : 'Generate Analysis Questions'}
          </Button>
          {aiSuggestions.length > 0 && (
            <div className="bg-gray-800/50 p-3 rounded-md">
              <p className="text-sm font-semibold text-white mb-2">Suggested Questions:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                {aiSuggestions.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </div>
          )}
        </div>

        {error && (
          <Alert className="bg-red-900/50 border-red-700">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription className="text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        {file && preview.length > 0 && (
          <>
            <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 mb-3">
                {file?.name.toLowerCase().includes('.xlsx') || file?.name.toLowerCase().includes('.xls') ? (
                  <FileSpreadsheet className="w-4 h-4 text-green-400" />
                ) : (
                  <FileText className="w-4 h-4 text-blue-400" />
                )}
                <span className="text-white font-medium">Preview</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-600">
                      {preview[0]?.map((header, index) => (
                        <th key={index} className="text-left text-gray-300 p-2">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(1).map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-gray-700">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="text-gray-400 p-2">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.length > 4 && (
                <p className="text-xs text-gray-400 mt-2">
                  Showing first 4 rows...
                </p>
              )}
            </div>
            {/* Show number of participants if available */}
            {participantCount !== null && (
              <div className="mb-4">
                <Label className="text-gray-300">Number of Participants</Label>
                <div className="text-lg text-white font-bold mt-1">{participantCount}</div>
                <p className="text-xs text-gray-400">Calculated from unique participant names in the uploaded file.</p>
              </div>
            )}
          </>
        )}

        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Uploading...</span>
              <span className="text-sm text-gray-400">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="flex space-x-4">
          <Button
            onClick={handleUpload}
            disabled={!file || uploading || !category}
            className="bg-green-600 hover:bg-green-700"
          >
            {uploading ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Save new survey
              </>
            )}
          </Button>

          {file && !uploading && (
            <Button
              variant="outline"
              onClick={() => {
                setFile(null);
                setCategory('');
                setDescription('');
                setPreview([]);
                setAiSuggestions([]);
                setError('');
                setUploadedSurveyId(null);
                setParticipantCount(null);
              }}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Clear
            </Button>
          )}
        </div>

        {!uploading && file && (
          <div className="flex items-center space-x-2 text-sm text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span>Ready to upload {file.name}</span>
          </div>
        )}
      </div>
    </div>
  );
};