// ===================================
// CUBULAR FRONTEND CONFIGURATION
// ===================================
// Centralized configuration for local development

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_BASE_URL || 'http://localhost:3000',
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  
  // Timeout settings
  REQUEST_TIMEOUT: 30000, // 30 seconds
  
  // Endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      REFRESH: '/auth/refresh',
      LOGOUT: '/auth/logout',
    },
    USERS: {
      ME: '/users/me',
      PROFILE: '/users/profile',
      LANGUAGE: '/users/me/language',
      PREFERRED_PERSONALITY: '/users/me/preferred-personality',
      WELCOME_POPUP_DISMISSED: '/users/welcome-popup-dismissed',
      BASE: '/users',
      DELETE_ACCOUNT: '/users/me',
    },
    SURVEYS: {
      BASE: '/surveys',
      UPLOAD: '/surveys/upload',
      DETAILS: (id: string) => `/surveys/${id}`,
      WITH_FILES: (id: string) => `/surveys/${id}/with-files`,
      SUGGESTIONS: (id: string) => `/surveys/${id}/suggestions`,
      GENERATE_SUGGESTIONS: '/surveys/generate-suggestions',
      ACCESS_CHECK: (id: string) => `/surveys/${id}/access-check`,
      FILES: {
        BASE: (surveyId: string) => `/surveys/${surveyId}/files`,
        ROWS: (surveyId: string, fileId: string) => `/surveys/${surveyId}/files/${fileId}/rows`,
        UPDATE: (surveyId: string, fileId: string) => `/surveys/${surveyId}/files/${fileId}/update`,
        DELETE: (fileId: string) => `/surveys/files/${fileId}`,
      },
      MY_FILE_ACCESS: (id: string) => `/surveys/${id}/my-file-access`,
      SEMANTIC_CHAT: '/surveys/semantic-chat',
    },
    LANGUAGES: {
      SUPPORTED: '/languages/supported',
      ENABLED: '/languages/enabled',
    },
    PROMPTS: {
      TRANSLATIONS: '/prompts/translations',
    },
    NOTIFICATIONS: {
      BASE: '/notifications',
      MY: '/notifications/my',
      READ: (id: string) => `/notifications/${id}/read`,
      MARK_ALL_READ: '/notifications/mark-all-read',
      UNREAD_COUNT: '/notifications/my/unread-count',
      ADMIN: {
        ALL: '/notifications/admin/all',
        USER: (userId: string) => `/notifications/admin/user/${userId}`,
      },
    },
    ADMIN: {
      ACCESS_SURVEYS_FILES: '/admin/access/surveys-files',
      MY_SURVEYS: '/admin/access/my-surveys',
      SURVEY_GRANT: '/admin/access/survey/grant',
      SURVEY_REVOKE: '/admin/access/survey/revoke',
      FILE_GRANT: '/admin/access/file/grant',
      FILE_REVOKE: '/admin/access/file/revoke',
    },
    CHAT: {
      SESSIONS: '/chat/sessions',
      SESSION_QUICK: (id: string) => `/chat/sessions/${id}/quick`,
      SESSION_MESSAGES: (id: string) => `/chat/sessions/${id}/messages`,
      SESSION_DETAILS: (id: string) => `/chat/sessions/${id}`,
    },
    PERSONALITIES: '/personalities',
    LLM_SETTINGS: {
      BASE: '/llm-settings',
      ACTIVE_LIST: '/llm-settings/active/list',
      UPSERT: '/llm-settings/upsert',
      PROVIDER_KEY: (provider: string) => `/llm-settings/provider/${provider}/decrypted-api-key`,
      DELETE: (id: string) => `/llm-settings/${id}`,
    },
    PLANS: {
      BASE: '/plans',
      AVAILABLE: '/plans/available',
      USER_CURRENT: '/user-plans/current',
      USER_UPGRADE: '/user-plans/upgrade',
      USER_CANCEL: '/user-plans/cancel',
      ASSIGN: (userId: string) => `/users/${userId}/assign-plan`,
      REVOKE: (userId: string) => `/users/${userId}/revoke-plan`,
    },
    LOGS: '/logs',
    MODULE_CONFIGURATIONS: {
      BASE: '/module-configurations',
    },
    SURVEY_BUILDER: {
      BASE: '/survey-builder',
      GENERATED_SURVEYS: '/survey-builder/generated-surveys',
      DOWNLOAD_FILE: (fileId: string) => `/survey-builder/download-survey-file/${fileId}`,
      VIEW_FILE: (fileId: string) => `/survey-builder/view-file/${fileId}`,
      CHAT: '/v1/survey-builder/chat',
    },
  }
} as const;

// Application Configuration
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || 'Cubular',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Development settings
  IS_DEVELOPMENT: import.meta.env.MODE === 'development',
  ENABLE_DEBUG_LOGS: import.meta.env.MODE === 'development',
  
  // UI Configuration
  DEFAULT_LANGUAGE: import.meta.env.VITE_DEFAULT_LANGUAGE || 'en',
  THEME: import.meta.env.VITE_THEME || 'system', // 'light' | 'dark' | 'system'
  
  // File Upload
  MAX_FILE_SIZE: Number(import.meta.env.VITE_MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  SUPPORTED_FILE_TYPES: (import.meta.env.VITE_SUPPORTED_FILE_TYPES ? import.meta.env.VITE_SUPPORTED_FILE_TYPES.split(',') : ['.csv', '.xlsx', '.json']),
  
  // Local Storage Keys
  STORAGE_KEYS: {
    AUTH_TOKEN: 'authToken',
    REFRESH_TOKEN: 'refreshToken',
    TOKEN_EXPIRY: 'tokenExpiry',
    LANGUAGE: 'selectedLanguage',
    THEME: 'theme',
  }
} as const;

// Helper function to build full API URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.API_BASE_URL}${endpoint}`;
};

// Helper function to build full URL
export const buildUrl = (path: string): string => {
  return `${API_CONFIG.BASE_URL}${path}`;
};

export default {
  API_CONFIG,
  APP_CONFIG,
  buildApiUrl,
  buildUrl,
};