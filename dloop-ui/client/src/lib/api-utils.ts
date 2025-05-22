/**
 * API utility functions for handling Netlify deployments
 */

// Detect if we're running in development mode
const isDevelopment = () => {
  return process.env.NODE_ENV === 'development' || 
         window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1';
};

// Detect if Netlify Functions are available by checking if we're served via Netlify Dev
const isNetlifyDevAvailable = () => {
  // Netlify Dev typically runs on port 8888 or is served through Netlify
  const isNetlifyDevPort = window.location.port === '8888' || 
                         window.location.port === '3000';
  const isNetlifyDomain = window.location.hostname.includes('netlify.app');
  
  return isNetlifyDevPort || isNetlifyDomain;
};

/**
 * Returns the correct API path based on the environment
 * @param path The API path
 * @returns The correctly formatted path for the current environment
 */
export const getAPIPath = (path: string): string => {
  if (path.startsWith('/api/')) {
    // Map specific API endpoints to their function names
    const apiMappings: Record<string, string> = {
      '/api/protocol/proposals': 'protocol-proposals',
      '/api/protocol/metrics': 'protocol-metrics',
      '/api/leaderboard': 'leaderboard',
      '/api/leaderboard-delegations': 'leaderboard-delegations',
      '/api/ainodes': 'ainodes',
      '/api/ainodes-performance': 'ainodes-performance',
      '/api/ainodes-sentiments': 'ainodes-sentiments',
    };
    
    // Check for direct mapping first
    if (apiMappings[path]) {
      return `/.netlify/functions/${apiMappings[path]}`;
    }
    
    // For other API paths, convert format
    const endpoint = path.replace('/api/', '').replace(/\//g, '-');
    return `/.netlify/functions/${endpoint}`;
  }
  
  return path; // Return unchanged for non-API paths
};

/**
 * Fetches data from the API with error handling and fallbacks
 * @param path The API path
 * @param options Fetch options
 * @param mockData Optional mock data to use if fetch fails in development
 * @returns The fetched data
 */
export const fetchAPI = async <T>(
  path: string, 
  options?: RequestInit, 
  mockData?: T
): Promise<T> => {
  const apiPath = getAPIPath(path);
  console.log(`Fetching from: ${apiPath}`);
  
  try {
    const response = await fetch(apiPath, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Expected JSON response but got ${contentType}`);
    }
    
    return await response.json() as T;
  } catch (error) {
    console.error(`Error fetching from ${apiPath}:`, error);
    
    // In development mode, use mock data if provided
    if (isDevelopment() && mockData) {
      console.log(`Using mock data for ${path} in development mode`);
      return mockData;
    }
    
    throw error;
  }
};
