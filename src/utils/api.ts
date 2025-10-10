// Utility functions for making authenticated API requests

import type { 
  SupportedLanguage, 
  SupportedLanguagesResponse, 
  PromptTranslation, 
  PromptTranslationsResponse,
  CreatePromptTranslationRequest,
  UpdatePromptTranslationRequest 
} from '@/types/language';

export const getAuthHeaders = (includeContentType: boolean = true) => {
  const token = localStorage.getItem('authToken');
  const headers: Record<string, string> = {};
  
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Function to refresh access token
export const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch('http://localhost:3000/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to refresh token');
  }

  if (data.accessToken && data.refreshToken) {
    localStorage.setItem('authToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('tokenExpiry', (Date.now() + (data.expiresIn * 1000)).toString());
    return data.accessToken;
  }

  throw new Error('Invalid refresh response');
};

// Check if token needs refresh (refresh if expires within 5 minutes)
export const shouldRefreshToken = (): boolean => {
  const tokenExpiry = localStorage.getItem('tokenExpiry');
  if (!tokenExpiry) return false;
  
  const expiryTime = parseInt(tokenExpiry);
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  return (expiryTime - now) <= fiveMinutes;
};

export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const makeRequest = async () => {
    // Check if we're sending FormData - if so, don't set Content-Type
    const isFormData = options.body instanceof FormData;
    let token = localStorage.getItem('authToken');
    
    // Check if token needs refresh before making the request
    if (token && shouldRefreshToken()) {
      try {
        token = await refreshAccessToken();
      } catch (refreshError) {
        // If refresh fails, clear tokens and let the 401 handler redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tokenExpiry');
        console.error('Token refresh failed:', refreshError);
      }
    }
    
    const authHeaders = getAuthHeaders(!isFormData);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...authHeaders,
        ...options.headers,
      },
    });
    
    // If we get a 401, try to refresh token once and retry
    if (response.status === 401 && token) {
      try {
        const newToken = await refreshAccessToken();
        
        // Retry the request with the new token
        const retryHeaders = getAuthHeaders(!isFormData);
        return fetch(url, {
          ...options,
          headers: {
            ...retryHeaders,
            ...options.headers,
          },
        });
      } catch (refreshError) {
        // Refresh failed, clear tokens
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tokenExpiry');
        console.error('Token refresh failed on 401 retry:', refreshError);
        // Return the original 401 response
        return response;
      }
    }
    
    return response;
  };

  // For non-GET requests, make the request directly
  return makeRequest();
};

/**
 * Makes an authenticated API request and returns parsed JSON data
 * Includes deduplication for GET requests to prevent multiple simultaneous calls
 * @param url The URL to fetch
 * @param options Fetch options
 * @returns Promise that resolves to the parsed JSON data
 */
export const authenticatedApiRequest = async <T = any>(url: string, options: RequestInit = {}): Promise<T> => {
  const method = (options.method || 'GET').toUpperCase();
  
  // For GET requests, use deduplication at the data level
  if (method === 'GET') {
    const { deduplicatedRequest } = await import('./requestDeduplication');
    const cacheKey = `API-${method}-${url}`;
    
    return deduplicatedRequest({
      cacheKey,
      cacheDuration: 30000, // Cache for 30 seconds for GET requests
      request: async () => {
        const response = await authenticatedFetch(url, options);
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }
        return response.json();
      },
    });
  }
  
  // For non-GET requests, make the request directly
  const response = await authenticatedFetch(url, options);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }
  return response.json();
};

// Language Management API Functions

/**
 * Fetch all supported languages from the backend
 */
export const fetchSupportedLanguages = async (): Promise<SupportedLanguagesResponse> => {
  const response = await authenticatedFetch('http://localhost:3000/api/languages/supported');
  if (!response.ok) {
    throw new Error(`Failed to fetch supported languages: ${response.status}`);
  }
  return response.json();
};

/**
 * Fetch enabled languages only
 */
export const fetchEnabledLanguages = async (): Promise<SupportedLanguage[]> => {
  const response = await authenticatedFetch('http://localhost:3000/api/languages/enabled');
  if (!response.ok) {
    throw new Error(`Failed to fetch enabled languages: ${response.status}`);
  }
  return response.json();
};

/**
 * Get user settings
 */
export const getUserSettings = async (userId: string): Promise<any> => {
  const response = await authenticatedFetch(`http://localhost:3000/api/users/${userId}/settings`);
  if (!response.ok) {
    throw new Error(`Failed to fetch user settings: ${response.status}`);
  }
  return response.json();
};

/**
 * Update user's language preference
 */
export const updateUserLanguagePreference = async (languageCode: string): Promise<void> => {
  // Get current user info from JWT token
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  // Decode token to get user ID
  const { jwtDecode } = await import('jwt-decode');
  const decoded: any = jwtDecode(token);
  const userId = decoded.id;
  
  if (!userId) {
    throw new Error('User ID not found in token');
  }
  
  try {
    // First, get current user settings to preserve other settings
    const currentSettings = await getUserSettings(userId);
    
    // Update the settings with new language preference
    const updatedSettings = {
      ...currentSettings,
      language_preference: languageCode
    };
    
    const response = await authenticatedFetch(`http://localhost:3000/api/users/${userId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(updatedSettings)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update language preference: ${response.status}`);
    }
  } catch (fetchError) {
    // If getting current settings fails, try to update with just the language preference
    console.warn('Could not fetch current settings, updating language preference only:', fetchError);
    const response = await authenticatedFetch(`http://localhost:3000/api/users/${userId}/settings`, {
      method: 'PUT',
      body: JSON.stringify({ language_preference: languageCode })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update language preference: ${response.status}`);
    }
  }
};

// Prompt Translations API Functions

/**
 * Fetch prompt translations for a specific personality and language
 */
export const fetchPromptTranslations = async (
  personalityId: string, 
  languageCode?: string
): Promise<PromptTranslationsResponse> => {
  const params = new URLSearchParams({ personality_id: personalityId });
  if (languageCode) {
    params.append('language_code', languageCode);
  }
  
  const response = await authenticatedFetch(
    `http://localhost:3000/api/prompts/translations?${params.toString()}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch prompt translations: ${response.status}`);
  }
  return response.json();
};

/**
 * Create a new prompt translation
 */
export const createPromptTranslation = async (
  data: CreatePromptTranslationRequest
): Promise<PromptTranslation> => {
  const response = await authenticatedFetch('http://localhost:3000/api/prompts/translations', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error(`Failed to create prompt translation: ${response.status}`);
  }
  return response.json();
};

/**
 * Update an existing prompt translation
 */
export const updatePromptTranslation = async (
  translationId: string,
  data: UpdatePromptTranslationRequest
): Promise<PromptTranslation> => {
  const response = await authenticatedFetch(`http://localhost:3000/api/prompts/translations/${translationId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error(`Failed to update prompt translation: ${response.status}`);
  }
  return response.json();
};

/**
 * Delete a prompt translation
 */
export const deletePromptTranslation = async (translationId: string): Promise<void> => {
  const response = await authenticatedFetch(`http://localhost:3000/api/prompts/translations/${translationId}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new Error(`Failed to delete prompt translation: ${response.status}`);
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (profileData: { username?: string; email?: string; [key: string]: any }): Promise<any> => {
  const response = await authenticatedFetch(`http://localhost:3000/api/users/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileData)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Failed to update profile: ${response.status}`);
  }
  
  return response.json();
};

// ========================
// Notification API Functions
// ========================

/**
 * Mark a specific notification as read
 */
export const markNotificationAsRead = async (notificationId: string): Promise<any> => {
  const response = await authenticatedFetch(`http://localhost:3000/api/notifications/my/${notificationId}/read`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Failed to mark notification as read: ${response.status}`);
  }
  
  return response.json();
};

/**
 * Mark all notifications as read for the current user
 */
export const markAllNotificationsAsRead = async (): Promise<any> => {
  const response = await authenticatedFetch(`http://localhost:3000/api/notifications/my/read-all`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Failed to mark all notifications as read: ${response.status}`);
  }
  
  return response.json();
};

/**
 * Get unread notification count for the current user
 */
export const getUnreadNotificationCount = async (): Promise<{ unread_count: number }> => {
  const response = await authenticatedFetch(`http://localhost:3000/api/notifications/my/unread-count`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Failed to get unread notification count: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data;
};