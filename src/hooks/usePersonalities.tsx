import { useState, useEffect } from 'react';
import { deduplicatedRequest } from '../utils/requestDeduplication';
import { useAuth } from './useAuth';

export interface AIPersonality {
  id: string;
  name: string;
  description: string;
  detailed_analysis_prompt: string;
  suggestions_prompt: string;
  model_override?: string;
  temperature_override?: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPersonalityPreference {
  id: string;
  user_id: string;
  personality_id: string;
  is_preferred: boolean;
  last_used_at: string;
}

export const usePersonalities = () => {
  const { user, loading: authLoading } = useAuth();
  const [personalities, setPersonalities] = useState<AIPersonality[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPersonalityPreference[]>([]);
  const [selectedPersonality, setSelectedPersonality] = useState<AIPersonality | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Cache duration in milliseconds (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  useEffect(() => {
    // Don't fetch if auth is still loading
    if (authLoading) {
      return;
    }
    
    // Only fetch personalities if user is authenticated
    if (user) {
      loadPersonalities();
    } else {
      // User is not authenticated, clear data and set loading to false
      setPersonalities([]);
      setUserPreferences([]);
      setSelectedPersonality(null);
      setIsLoading(false);
    }
  }, [user, authLoading]);

  // Separate effect to load user preferences after personalities are loaded
  useEffect(() => {
    // Only load user preferences if user is authenticated and personalities exist
    if (user && personalities.length > 0) {
      loadUserPreferences(personalities);
    }
  }, [user, personalities.length]); // Only depend on length and user to avoid unnecessary calls

  const loadPersonalities = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:3000/api/personalities', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to load personalities');
      const data = await response.json();
      setPersonalities(data || []);
    } catch (error) {
      setIsLoading(false);
    }
  };

  const loadUserPreferences = async (currentPersonalities: AIPersonality[] = personalities, forceRefresh: boolean = false) => {
    
    try {
      const data = await deduplicatedRequest({
        cacheKey: 'user-preferred-personality',
        cacheDuration: forceRefresh ? 0 : CACHE_DURATION,
        request: async () => {
          const token = localStorage.getItem('authToken');
          const response = await fetch('http://localhost:3000/api/users/me/preferred-personality', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (!response.ok) throw new Error('Failed to load preferences');
          return response.json();
        },
      });

      setUserPreferences(data || []);
      setLastFetchTime(Date.now());

      // Set the selected personality based on user's preferred_personality
      if (data?.preferred_personality && currentPersonalities.length > 0) {
        const preferredPersonality = currentPersonalities.find(p => p.id === data.preferred_personality);
        if (preferredPersonality) {
          setSelectedPersonality(preferredPersonality);
        }
      } else if (!selectedPersonality && currentPersonalities.length > 0) {
        // If no preferred personality is set, use default or first available
        const defaultPersonality = currentPersonalities.find(p => p.is_default) || currentPersonalities[0];
        if (defaultPersonality) {
          setSelectedPersonality(defaultPersonality);
        }
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserPreference = async (personalityId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      await fetch('http://localhost:3000/api/users/me/preferred-personality', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ personalityId }),
      });
      
      // Update local state
      const personality = personalities.find(p => p.id === personalityId);
      if (personality) {
        setSelectedPersonality(personality);
      }

      // Clear cache and force refresh to get updated data
      const { clearCache } = await import('../utils/requestDeduplication');
      clearCache('user-preferred-personality');
      setLastFetchTime(0);
      loadUserPreferences(personalities, true);
    } catch (error) {
      console.error('Error updating user preference:', error);
    }
  };

  const setPreferredPersonality = async (personalityId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      await fetch('http://localhost:3000/api/users/me/preferred-personality', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ personalityId }),
      });
      
      // Clear cache and force refresh to get updated data
      const { clearCache } = await import('../utils/requestDeduplication');
      clearCache('user-preferred-personality');
      setLastFetchTime(0);
      loadUserPreferences(personalities, true);
    } catch (error) {
      console.error('Error setting preferred personality:', error);
    }
  };

  const getPersonalityConfig = (personalityId?: string) => {
    const personality = personalityId 
      ? personalities.find(p => p.id === personalityId)
      : selectedPersonality;
    
    if (!personality) return null;

    return {
      detailed_analysis_prompt: personality.detailed_analysis_prompt,
      suggestions_prompt: personality.suggestions_prompt,
      model_override: personality.model_override,
      temperature_override: personality.temperature_override
    };
  };

  const getPersonalityById = (personalityId: string | undefined) => {
    if (!personalityId) return null;
    return personalities.find(p => p.id === personalityId) || null;
  };

  return {
    personalities,
    userPreferences,
    selectedPersonality,
    isLoading,
    updateUserPreference,
    setPreferredPersonality,
    getPersonalityConfig,
    getPersonalityById,
    loadPersonalities,
    loadUserPreferences
  };
};