export interface SurveyFile {
  id: string;
  survey_id: string;
  filename: string;
  storage_path: string;
  file_size?: number;
  file_hash?: string;
  upload_date: string;
  created_at: string;
  updated_at: string;
}

export interface Survey {
  id: string; // Primary key (required)
  fileid?: string; // For backward compatibility
  title?: string; // New field for survey title
  filename?: string; // Keep for backward compatibility
  createdat?: string; // For backward compatibility
  created_at?: string; // New timestamp field
  storage_path?: string; // Keep for backward compatibility
  primary_language?: string; // ISO 639-1 language code for survey's primary language
  category?: string;
  description?: string;
  ai_suggestions?: string[];
  number_participants?: number;
  total_files?: number; // New field for file count
  files?: SurveyFile[]; // Associated files
}

export interface SurveyStats {
  totalFiles: number;
  totalSize: number;
  fileTypes: Record<string, number>;
  averageSize?: number;
}

export interface ParsedSurveyData {
  headers: string[];
  rows: string[][];
  totalResponses: number;
}

export interface CreateSurveyRequest {
  title: string;
  category?: string;
  description?: string;
  primary_language?: string; // ISO 639-1 language code for survey's primary language
  number_participants?: number;
  ai_suggestions?: string[];
}

export interface AddFileToSurveyResponse {
  message: string;
  file: SurveyFile;
}