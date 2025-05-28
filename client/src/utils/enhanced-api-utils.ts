/**
 * Enhanced API Utilities
 * 
 * Provides robust API fetching capabilities with error handling, caching,
 * telemetry tracking, and type safety for AssetDAO functionality.
 */

import { MOCK_PROTOCOL_METRICS, MOCK_PROTOCOL_PROPOSALS } from '@/mocks/api-mock-data';
import { ApiResponse } from '@/types/api-types';
import { apiTelemetry } from '@/services/telemetry/apiTelemetryService';
import { validateApiResponse } from '@/utils/type-validators';

// Environment detection helper
export const isDevelopment = () => 
  process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';

// Cache for API responses to minimize redundant network requests
const apiCache: Record<string, { 
  data: any; 
  timestamp: number;
  etag?: string;
}> = {};

// Default cache settings
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache time-to-live
const DEFAULT_STALE_TTL = 30 * 60 * 1000; // 30 minutes stale-while-revalidate

/**
 * Determines if mock data should be used based on env and feature flags
 * @param forceMock Override to force mock data usage
 * @returns Whether mock data should be used
 */
export const shouldUseMockData = (forceMock: boolean = false): boolean => {
  // Always use mock if explicitly forced
  if (forceMock) return true;
  
  // Use mock data in development by default
  if (isDevelopment()) {
    // Can be overridden by env var if needed
    if (process.env.REACT_APP_USE_REAL_API === 'true') return false;
    return true;
  }
  
  // Never use mock data in production
  return false;
};

/**
 * Gets mock data for a specific endpoint
 * @param endpoint The API endpoint path
 * @returns Mock data for the endpoint or null if not available
 */
export const getMockData = async (endpoint?: string): Promise<any> => {
  // Default mock is proposals if no endpoint specified
  if (!endpoint || endpoint.includes('proposals')) {
    return { data: MOCK_PROTOCOL_PROPOSALS };
  }
  
  // Return metrics data for metrics endpoint
  if (endpoint.includes('metrics')) {
    return { data: MOCK_PROTOCOL_METRICS };
  }
  
  // Handle other potential mock endpoints here
  
  // No mock data available for this endpoint
  console.warn(`No mock data available for endpoint: ${endpoint}`);
  return null;
};

/**
 * Fetches data from an API with enhanced error handling, caching, telemetry, and type safety
 * @param endpoint The API endpoint to fetch from
 * @param options Fetch options and configuration
 * @returns Promise resolving to the API response data
 */
export const fetchAPI = async <T>(
  endpoint: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    forceMock?: boolean;
    skipCache?: boolean;
    cacheTTL?: number;
    staleTTL?: number;
    recordTelemetry?: boolean;
    validator?: (data: any) => boolean;
    retries?: number;
    retryDelay?: number;
  } = {}
): Promise<ApiResponse<T>> => {
  const {
    method = 'GET',
    headers = {},
    body,
    forceMock = false,
    skipCache = false,
    cacheTTL = DEFAULT_CACHE_TTL,
    staleTTL = DEFAULT_STALE_TTL,
    recordTelemetry = true,
    validator,
    retries = 2,
    retryDelay = 1000
  } = options;

  // Start measuring performance
  const startTime = performance.now();
  let isCached = false;
  let statusCode = 200;
  let errorMessage: string | undefined;

  try {
    // Check if mock data should be used
    if (shouldUseMockData(forceMock)) {
      const mockResult = await getMockData(endpoint);
      if (mockResult) {
        if (isDevelopment()) {
          console.debug('Using mock data for:', endpoint);
        }
        
        // Record telemetry for mock data usage
        if (recordTelemetry) {
          apiTelemetry.recordApiEvent({
            endpoint,
            method,
            status: 200,
            responseTime: performance.now() - startTime,
            timestamp: Date.now(),
            cached: false
          });
        }
        
        return mockResult;
      }
    }
    
    // Check cache for GET requests
    const cacheKey = `${method}-${endpoint}-${JSON.stringify(body)}`;
    if (method === 'GET' && !skipCache && apiCache[cacheKey]) {
      const cached = apiCache[cacheKey];
      
      // Use cached data if it's still fresh
      if (Date.now() - cached.timestamp < cacheTTL) {
        if (isDevelopment()) {
          console.debug('Using cached data for:', endpoint);
        }
        
        // Record telemetry for cache hit
        if (recordTelemetry) {
          apiTelemetry.recordApiEvent({
            endpoint,
            method,
            status: 200,
            responseTime: performance.now() - startTime,
            timestamp: Date.now(),
            cached: true
          });
        }
        
        isCached = true;
        return cached.data;
      }
      
      // Use stale data while revalidating if within stale TTL
      if (Date.now() - cached.timestamp < staleTTL) {
        // Revalidate in background
        setTimeout(() => {
          fetchAPI(endpoint, { 
            ...options, 
            skipCache: true, 
            recordTelemetry: false 
          }).catch(() => {
            // Silently fail background revalidation
          });
        }, 0);
        
        // Record telemetry for stale cache hit
        if (recordTelemetry) {
          apiTelemetry.recordApiEvent({
            endpoint,
            method,
            status: 200,
            responseTime: performance.now() - startTime,
            timestamp: Date.now(),
            cached: true
          });
        }
        
        isCached = true;
        return cached.data;
      }
    }

    // Prepare request headers with conditional GET if we have an ETag
    let requestHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };
    
    if (method === 'GET' && apiCache[cacheKey]?.etag) {
      requestHeaders['If-None-Match'] = apiCache[cacheKey].etag;
    }

    // Make the actual API request
    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      ...(body ? { body: JSON.stringify(body) } : {}),
    };

    // Add debug information in development
    if (isDevelopment()) {
      console.debug(`API Request to ${endpoint}`, {
        method,
        headers: requestOptions.headers,
        body: body ? body : undefined
      });
    }

    // Function to execute fetch with retry logic
    const executeFetchWithRetries = async (retriesLeft: number): Promise<Response> => {
      try {
        const response = await fetch(endpoint, requestOptions);
        
        // If we get a 304 Not Modified, use the cached data
        if (response.status === 304 && apiCache[cacheKey]) {
          // Update timestamp to extend cache life
          apiCache[cacheKey].timestamp = Date.now();
          
          // Record telemetry for 304 response
          if (recordTelemetry) {
            apiTelemetry.recordApiEvent({
              endpoint,
              method,
              status: 304,
              responseTime: performance.now() - startTime,
              timestamp: Date.now(),
              cached: true
            });
          }
          
          isCached = true;
          return new Response(JSON.stringify(apiCache[cacheKey].data), {
            status: 200,
            headers: response.headers
          });
        }
        
        // If response is not ok and we have retries left, retry
        if (!response.ok && retriesLeft > 0) {
          // Only retry for specific status codes that might be temporary
          if ([408, 429, 500, 502, 503, 504].includes(response.status)) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            return executeFetchWithRetries(retriesLeft - 1);
          }
        }
        
        return response;
      } catch (error) {
        // Network errors are retryable
        if (retriesLeft > 0) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return executeFetchWithRetries(retriesLeft - 1);
        }
        throw error;
      }
    };

    // Execute fetch with retry logic
    const response = await executeFetchWithRetries(retries);
    statusCode = response.status;

    // Handle HTTP errors
    if (!response.ok) {
      const errorText = await response.text();
      errorMessage = `API Error (${response.status}): ${errorText}`;
      throw new Error(errorMessage);
    }

    // Store ETag if provided
    const etag = response.headers.get('ETag');

    // Parse JSON response
    const data = await response.json();
    
    // Validate response if validator provided
    if (validator && !validateApiResponse<T>(data, validator)) {
      errorMessage = `API Response validation failed for ${endpoint}`;
      throw new Error(errorMessage);
    }
    
    // Cache successful GET responses
    if (method === 'GET' && !skipCache) {
      apiCache[cacheKey] = {
        data,
        timestamp: Date.now(),
        ...(etag ? { etag } : {})
      };
    }
    
    // Record successful API call telemetry
    if (recordTelemetry) {
      apiTelemetry.recordApiEvent({
        endpoint,
        method,
        status: statusCode,
        responseTime: performance.now() - startTime,
        timestamp: Date.now(),
        cached: isCached
      });
    }

    return data;
  } catch (error) {
    // Log detailed error information
    console.error(`API Error for ${endpoint}:`, error);
    
    // Record error telemetry
    if (recordTelemetry) {
      apiTelemetry.recordApiEvent({
        endpoint,
        method,
        status: statusCode !== 200 ? statusCode : 500,
        responseTime: performance.now() - startTime,
        timestamp: Date.now(),
        error: errorMessage || (error instanceof Error ? error.message : String(error)),
        cached: isCached
      });
    }
    
    // Fall back to mock data in development if real request failed
    if (isDevelopment() && !forceMock) {
      console.warn(`Falling back to mock data for ${endpoint} after fetch error`);
      const mockResult = await getMockData(endpoint);
      if (mockResult) return mockResult;
    }
    
    // Re-throw the error for the caller to handle
    throw error;
  }
};

/**
 * Clears the API cache
 * @param endpoint Optional specific endpoint to clear, or all if not specified
 */
export const clearApiCache = (endpoint?: string): void => {
  if (endpoint) {
    // Clear cache for specific endpoint
    Object.keys(apiCache).forEach(key => {
      if (key.includes(endpoint)) {
        delete apiCache[key];
      }
    });
  } else {
    // Clear entire cache
    Object.keys(apiCache).forEach(key => {
      delete apiCache[key];
    });
  }
};

/**
 * Prefetches data into the cache
 * @param endpoints Array of endpoints to prefetch
 */
export const prefetchData = async (endpoints: string[]): Promise<void> => {
  const promises = endpoints.map(endpoint => 
    fetchAPI(endpoint, { recordTelemetry: false }).catch(() => null)
  );
  await Promise.all(promises);
};

export default {
  fetchAPI,
  clearApiCache,
  prefetchData,
  isDevelopment,
  shouldUseMockData,
  getMockData
};
