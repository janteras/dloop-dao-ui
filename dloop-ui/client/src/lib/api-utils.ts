/**
 * API utility functions for handling Netlify deployments
 */

/**
 * Resolves the correct API endpoint path based on the environment
 * In Netlify deployments, converts /api/endpoint to /.netlify/functions/endpoint
 * 
 * @param endpoint The API endpoint path (e.g., '/api/protocol/proposals')
 * @returns The properly formatted API path for the current environment
 */
export const getAPIPath = (endpoint: string): string => {
  // Check if we're in a Netlify environment (deployed)
  // Skip localhost and development environments
  if (window.location.hostname !== 'localhost' && 
      !window.location.hostname.includes('.local') &&
      !window.location.hostname.includes('127.0.0.1')) {
    
    // For Netlify deployments, convert /api/something to /.netlify/functions/something
    if (endpoint.startsWith('/api/')) {
      return `/.netlify/functions/${endpoint.replace('/api/', '')}`;
    }
  }
  
  // Local development keeps original path
  return endpoint;
};

/**
 * General API fetching function with proper error handling
 * 
 * @param endpoint The API endpoint path
 * @param options Fetch options
 * @returns The API response data
 */
export const fetchAPI = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
  try {
    const url = getAPIPath(endpoint);
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    return await response.json() as T;
  } catch (error) {
    console.error(`Error fetching from ${endpoint}:`, error);
    throw error;
  }
};
