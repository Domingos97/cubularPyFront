import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authenticatedApiRequest } from '../utils/api';
import { useAuth } from '../hooks/useAuth';

export interface Survey {
  id: string;
  title: string;
  category?: string;
  description?: string;
  filename?: string;
  total_files: number;
  created_at: string;
  updated_at: string;
}

interface SurveyContextType {
  surveys: Survey[];
  isLoading: boolean;
  error: string | null;
  refreshSurveys: () => Promise<void>;
}

const SurveyContext = createContext<SurveyContextType | undefined>(undefined);

interface SurveyProviderProps {
  children: ReactNode;
}

export const SurveyProvider: React.FC<SurveyProviderProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Cache duration in milliseconds (2 minutes for surveys)
  const CACHE_DURATION = 2 * 60 * 1000;

  const fetchSurveys = async (forceRefresh: boolean = false) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('>>> Making API request for user surveys');
      const data = await authenticatedApiRequest('http://localhost:3000/api/surveys/my-surveys');
      console.log('✅ Surveys loaded successfully:', data?.length || 0, 'items');
      
      setSurveys(data || []);
      setLastFetchTime(Date.now());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch surveys';
      console.error('Error fetching surveys:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSurveys = async () => {
    const { clearCache } = await import('../utils/requestDeduplication');
    clearCache('user-surveys');
    setLastFetchTime(0); // Reset cache
    await fetchSurveys(true);
  };

  // Initial load - only when user is authenticated
  useEffect(() => {
    // Don't fetch if auth is still loading
    if (authLoading) {
      return;
    }
    
    // Only fetch surveys if user is authenticated
    if (user) {
      fetchSurveys();
    } else {
      // User is not authenticated, clear surveys and set loading to false
      setSurveys([]);
      setIsLoading(false);
      setError(null);
    }
  }, [user, authLoading]);

  const value: SurveyContextType = {
    surveys,
    isLoading,
    error,
    refreshSurveys,
  };

  return (
    <SurveyContext.Provider value={value}>
      {children}
    </SurveyContext.Provider>
  );
};

export const useSurveys = (): SurveyContextType => {
  const context = useContext(SurveyContext);
  if (context === undefined) {
    throw new Error('useSurveys must be used within a SurveyProvider');
  }
  return context;
};