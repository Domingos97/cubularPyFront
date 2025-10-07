// Utility functions for making authenticated API requests

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