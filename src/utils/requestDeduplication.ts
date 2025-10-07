/**
 * Request deduplication utility to prevent multiple simultaneous calls to the same endpoint
 * Now includes retry logic for rate limiting (429 errors)
 */

// Map to store ongoing requests by their cache key
const ongoingRequests = new Map<string, Promise<any>>();

// Map to store cached responses with timestamps
const responseCache = new Map<string, { data: any; timestamp: number; expiresAt: number }>();

interface DeduplicatedRequestOptions {
  cacheKey: string;
  cacheDuration?: number; // in milliseconds
  request: () => Promise<any>;
  maxRetries?: number; // Maximum number of retries for 429 errors
  retryDelay?: number; // Base delay in milliseconds for exponential backoff
}

/**
 * Sleep function for delays
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Exponential backoff delay calculation
 */
const calculateDelay = (attempt: number, baseDelay: number = 1000): number => {
  return Math.min(baseDelay * Math.pow(2, attempt), 30000); // Max 30 seconds
};

/**
 * Execute request with retry logic for 429 errors
 */
const executeWithRetry = async (
  request: () => Promise<any>, 
  maxRetries: number = 3, 
  baseDelay: number = 1000
): Promise<any> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await request();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a 429 error (rate limiting)
      if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('Too Many Requests')) {
        if (attempt < maxRetries) {
          const delay = calculateDelay(attempt, baseDelay);
          console.log(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
          await sleep(delay);
          continue;
        }
      }
      
      // For non-429 errors, don't retry
      throw error;
    }
  }
  
  throw lastError;
};

/**
 * Deduplicates requests by caching ongoing requests and results
 * @param options Configuration object with cache key, duration, and request function
 * @returns Promise resolving to the request result
 */
export const deduplicatedRequest = async <T = any>({
  cacheKey,
  cacheDuration = 0, // Default: no caching, only deduplication
  request,
  maxRetries = 3,
  retryDelay = 1000,
}: DeduplicatedRequestOptions): Promise<T> => {
  const now = Date.now();
  
  // Check if we have a valid cached response
  if (cacheDuration > 0) {
    const cached = responseCache.get(cacheKey);
    if (cached && now < cached.expiresAt) {
      console.log(`Using cached response for: ${cacheKey}`);
      return cached.data;
    }
  }

  // Check if there's already an ongoing request for this cache key
  const ongoingRequest = ongoingRequests.get(cacheKey);
  if (ongoingRequest) {
    console.log(`Deduplicating request for: ${cacheKey}`);
    return ongoingRequest;
  }

  // Create and store the new request with retry logic
  console.log(`Making new request for: ${cacheKey}`);
  const requestPromise = executeWithRetry(request, maxRetries, retryDelay)
    .then((result) => {
      // Cache the successful result if caching is enabled
      if (cacheDuration > 0) {
        responseCache.set(cacheKey, {
          data: result,
          timestamp: now,
          expiresAt: now + cacheDuration,
        });
      }
      return result;
    })
    .finally(() => {
      // Remove the ongoing request regardless of success/failure
      ongoingRequests.delete(cacheKey);
    });

  ongoingRequests.set(cacheKey, requestPromise);
  return requestPromise;
};

/**
 * Clears cached response for a specific key
 * @param cacheKey The cache key to clear
 */
export const clearCache = (cacheKey: string): void => {
  responseCache.delete(cacheKey);
  console.log(`Cleared cache for: ${cacheKey}`);
};

/**
 * Clears all cached responses
 */
export const clearAllCache = (): void => {
  responseCache.clear();
  console.log('Cleared all cached responses');
};

/**
 * Gets cache statistics
 */
export const getCacheStats = () => {
  const now = Date.now();
  const cacheEntries = Array.from(responseCache.entries());
  
  return {
    totalEntries: cacheEntries.length,
    validEntries: cacheEntries.filter(([_, entry]) => now < entry.expiresAt).length,
    expiredEntries: cacheEntries.filter(([_, entry]) => now >= entry.expiresAt).length,
    ongoingRequests: ongoingRequests.size,
  };
};

/**
 * Cleans up expired cache entries
 */
export const cleanupExpiredCache = (): void => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [key, entry] of responseCache.entries()) {
    if (now >= entry.expiresAt) {
      responseCache.delete(key);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} expired cache entries`);
  }
};