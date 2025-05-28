/**
 * API Utilities
 * 
 * Provides robust API fetching capabilities with error handling, caching,
 * and graceful fallback to mock data during development.
 */

import { MOCK_PROTOCOL_METRICS, MOCK_PROTOCOL_PROPOSALS } from '@/mocks/api-mock-data';

// Environment detection helper
export const isDevelopment = () => 
  process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';

// Cache for API responses to minimize redundant network requests
const apiCache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache time-to-live

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
 * Fetches data from an API with enhanced error handling and optional mock data fallback
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
  } = {}
): Promise<T> => {
  const {
    method = 'GET',
    headers = {},
    body,
    forceMock = false,
    skipCache = false,
    cacheTTL = CACHE_TTL
  } = options;

  try {
    // Check if mock data should be used
    if (shouldUseMockData(forceMock)) {
      const mockResult = await getMockData(endpoint);
      if (mockResult) {
        if (isDevelopment()) {
          console.debug('Using mock data for:', endpoint);
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
        return cached.data;
      }
    }

    // Make the actual API request
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
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

    const response = await fetch(endpoint, requestOptions);

    // Handle HTTP errors
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    // Parse JSON response
    const data = await response.json();
    
    // Cache successful GET responses
    if (method === 'GET' && !skipCache) {
      apiCache[cacheKey] = {
        data,
        timestamp: Date.now(),
      };
    }

    return data;
  } catch (error) {
    // Log detailed error information
    console.error(`API Error for ${endpoint}:`, error);
    
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

export default {
  fetchAPI,
  clearApiCache,
  isDevelopment,
  shouldUseMockData,
  getMockData
};
