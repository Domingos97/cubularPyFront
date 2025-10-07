import { useState, useEffect, useCallback, useRef } from 'react';
import { authenticatedFetch } from '@/utils/api';

interface ProcessingStatus {
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  updated_at: string;
  embeddings_count: number;
  dictionary_count: number;
  is_processing_complete: boolean;
}

interface UseProcessingStatusOptions {
  surveyId: string | null;
  pollInterval?: number;
  enabled?: boolean;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export const useProcessingStatus = ({
  surveyId,
  pollInterval = 3000, // Increased to 3 seconds to be more reasonable
  enabled = true,
  onComplete,
  onError
}: UseProcessingStatusOptions) => {
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPollingActive, setIsPollingActive] = useState(false);
  const callbacksRef = useRef({ onComplete, onError });
  const enabledRef = useRef(enabled);

  // Update refs when props change
  useEffect(() => {
    callbacksRef.current = { onComplete, onError };
    enabledRef.current = enabled;
  }, [onComplete, onError, enabled]);

  // Reset polling state when surveyId changes
  useEffect(() => {
    setIsPollingActive(false);
    setStatus(null);
    setError(null);
  }, [surveyId]);

  useEffect(() => {
    if (!surveyId || !enabled || isPollingActive) return;

    let intervalId: NodeJS.Timeout;
    let shouldContinuePolling = true;

    const internalFetchStatus = async (retryCount = 0) => {
      if (!surveyId || !enabledRef.current) return false;

      try {
        setIsLoading(true);
        if (retryCount === 0) setError(null);

        const response = await authenticatedFetch(
          `http://localhost:3000/api/surveys/${surveyId}/processing-status`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch processing status: ${response.status}`);
        }

        const statusData: ProcessingStatus = await response.json();
        setStatus(statusData);
        setError(null);

        console.log(`Processing status for ${surveyId}:`, statusData.processing_status, 
                   `Embeddings: ${statusData.embeddings_count}, Dictionary: ${statusData.dictionary_count}`);

        // Call completion callback if processing is complete
        if (statusData.is_processing_complete && callbacksRef.current.onComplete) {
          console.log(`Processing complete for survey ${surveyId}`);
          setIsPollingActive(false);
          callbacksRef.current.onComplete();
          return false;
        }

        // Stop polling if failed
        if (statusData.processing_status === 'failed') {
          console.log(`Processing failed for survey ${surveyId}`);
          setIsPollingActive(false);
          if (callbacksRef.current.onError) {
            callbacksRef.current.onError('Semantic processing failed');
          }
          return false;
        }

        // Continue polling if still processing or pending
        return statusData.processing_status === 'processing' || statusData.processing_status === 'pending';
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.warn(`Error fetching processing status (attempt ${retryCount + 1}):`, errorMessage);
        
        if (retryCount < 3) {
          console.log(`Retrying status fetch in 5 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          return await internalFetchStatus(retryCount + 1);
        }
        
        setError(errorMessage);
        if (callbacksRef.current.onError) {
          callbacksRef.current.onError(errorMessage);
        }
        return false;
      } finally {
        setIsLoading(false);
      }
    };

    const poll = async () => {
      if (!shouldContinuePolling || !enabledRef.current) return;
      
      const continuePolling = await internalFetchStatus();
      
      if (continuePolling && shouldContinuePolling && enabledRef.current) {
        intervalId = setTimeout(poll, pollInterval);
      } else {
        console.log(`Stopped polling for survey ${surveyId}`);
        setIsPollingActive(false);
      }
    };

    // Start polling immediately
    console.log(`Starting status polling for survey ${surveyId}`);
    setIsPollingActive(true);
    poll();

    return () => {
      shouldContinuePolling = false;
      setIsPollingActive(false);
      if (intervalId) {
        clearTimeout(intervalId);
      }
      console.log(`Cleanup: stopped polling for survey ${surveyId}`);
    };
  }, [surveyId, enabled, pollInterval, isPollingActive]);

  const refetch = useCallback(async (retryCount = 0) => {
    if (!surveyId || !enabledRef.current) return false;

    try {
      setIsLoading(true);
      if (retryCount === 0) setError(null);

      const response = await authenticatedFetch(
        `http://localhost:3000/api/surveys/${surveyId}/processing-status`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch processing status: ${response.status}`);
      }

      const statusData: ProcessingStatus = await response.json();
      setStatus(statusData);
      setError(null);

      return statusData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.warn(`Error fetching processing status:`, errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [surveyId]);

  return {
    status,
    isLoading,
    error,
    refetch,
    isComplete: status?.is_processing_complete || false,
    isProcessing: status?.processing_status === 'processing',
    isFailed: status?.processing_status === 'failed',
    isPollingActive
  };
};