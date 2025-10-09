// Language-related types for multilingual support

export interface SupportedLanguage {
  code: string; // ISO 639-1 language code
  name: string; // English name
  native_name: string; // Native language name
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromptTranslation {
  id: string;
  personality_id: string;
  language_code: string;
  prompt_type: 'system' | 'suggestions' | 'analysis' | string;
  prompt_text: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CreatePromptTranslationRequest {
  personality_id: string;
  language_code: string;
  prompt_type: string;
  prompt_text: string;
}

export interface UpdatePromptTranslationRequest {
  prompt_text: string;
}

// Language API response types
export interface SupportedLanguagesResponse {
  languages: SupportedLanguage[];
  total: number;
}

export interface PromptTranslationsResponse {
  translations: PromptTranslation[];
  total: number;
}

// For backward compatibility with existing i18n system
export type LegacySupportedLanguage = 'en' | 'es' | 'pt' | 'sv';

// Helper function to convert backend language to legacy type
export function toLegacyLanguageCode(code: string): LegacySupportedLanguage {
  const legacyCodes = ['en', 'es', 'pt', 'sv'] as const;
  return legacyCodes.includes(code as LegacySupportedLanguage) 
    ? code as LegacySupportedLanguage 
    : 'en';
}