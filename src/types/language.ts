// Language-related types for multilingual support

export interface SupportedLanguage {
  code: string; // ISO 639-1 language code
  name: string; // English name
  native_name: string; // Native language name
  enabled: boolean;
  created_at: string;
  updated_at: string;
}


// Language API response types
export interface SupportedLanguagesResponse {
  languages: SupportedLanguage[];
  total: number;
}

