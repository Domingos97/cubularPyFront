export interface LLMSettings {
  id?: string;
  provider: string;
  model: string;
  active?: boolean;
  api_key?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

class LLMSettingsAPI {
  private baseUrl = 'http://localhost:8000/api/llm-settings';

  // Get authentication token from localStorage
  private async getAuthToken(): Promise<string | null> {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      console.warn('No authentication token found. User may need to log in.');
      return null;
    }
    
    // Check if token is expired (basic check)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (Date.now() >= payload.exp * 1000) {
        console.warn('Authentication token has expired. User needs to log in again.');
        localStorage.removeItem('authToken');
        return null;
      }
    } catch (error) {
      console.warn('Invalid token format. Removing token.');
      localStorage.removeItem('authToken');
      return null;
    }
    
    return token;
  }

  // Make authenticated API request
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    
    // Only add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle authentication errors specifically
    if (response.status === 401) {
      localStorage.removeItem('authToken'); // Clear invalid token
      throw new Error('Authentication required. Please log in again.');
    }
    
    if (response.status === 403) {
      throw new Error('Access denied. Admin privileges required.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        error: `HTTP ${response.status}: ${response.statusText}` 
      }));
      throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  /**
   * Get all LLM settings, optionally filtered by provider (Admin only)
   */
  async getLLMSettings(provider?: string): Promise<LLMSettings[]> {
    const endpoint = provider ? `?provider=${encodeURIComponent(provider)}` : '';
    return this.makeRequest<LLMSettings[]>(endpoint);
  }

  /**
   * Get active LLM settings (available to all authenticated users)
   */
  async getActiveLLMSettings(): Promise<LLMSettings[]> {
    return this.makeRequest<LLMSettings[]>('/active/list');
  }

  /**
   * Get a specific LLM setting by ID
   */
  async getLLMSettingById(id: string): Promise<LLMSettings> {
    return this.makeRequest<LLMSettings>(`/${id}`);
  }

  /**
   * Get LLM settings for a specific provider (convenience method)
   */
  async getLLMSettingByProvider(provider: string): Promise<LLMSettings | null> {
    const settings = await this.getLLMSettings(provider);
    return settings.length > 0 ? settings[0] : null;
  }

  /**
   * Create a new LLM setting
   */
  async createLLMSetting(settings: Omit<LLMSettings, 'id' | 'created_at' | 'updated_at'>): Promise<LLMSettings> {
    return this.makeRequest<LLMSettings>('', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }

  /**
   * Update an existing LLM setting
   */
  async updateLLMSetting(id: string, settings: Partial<LLMSettings>): Promise<LLMSettings> {
    return this.makeRequest<LLMSettings>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  /**
   * Upsert LLM setting (create or update based on provider/model)
   * This is the recommended method for saving settings from the frontend
   */
  async upsertLLMSetting(settings: Omit<LLMSettings, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<LLMSettings> {
    return this.makeRequest<LLMSettings>('/upsert', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }

  /**
   * Delete an LLM setting
   */
  async deleteLLMSetting(id: string): Promise<void> {
    return this.makeRequest<void>(`/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get decrypted API key for a specific LLM setting by ID
   */
  async getDecryptedApiKey(id: string): Promise<{ api_key: string | null }> {
    return this.makeRequest<{ api_key: string | null }>(`/${id}/decrypted-api-key`);
  }

  /**
   * Get decrypted API key by provider
   */
  async getDecryptedApiKeyByProvider(provider: string): Promise<{ api_key: string | null }> {
    return this.makeRequest<{ api_key: string | null }>(`/provider/${provider}/decrypted-api-key`);
  }

  /**
   * Test API key for a provider (if backend supports it)
   */
  async testAPIKey(provider: string, apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      // This would be a backend endpoint to test the API key
      // For now, we'll simulate the test
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { valid: true };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Export singleton instance
export const llmSettingsAPI = new LLMSettingsAPI();

// Convenience functions for common operations
export const saveLLMSettings = (settings: Omit<LLMSettings, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => 
  llmSettingsAPI.upsertLLMSetting(settings);

export const loadLLMSettings = (provider: string = 'openai') => 
  llmSettingsAPI.getLLMSettingByProvider(provider);

export const getAllLLMSettings = () => 
  llmSettingsAPI.getLLMSettings();

export const getActiveLLMSettings = () => 
  llmSettingsAPI.getActiveLLMSettings();

export const deleteLLMSettings = (id: string) => 
  llmSettingsAPI.deleteLLMSetting(id);
