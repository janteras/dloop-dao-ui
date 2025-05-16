/**
 * API utility functions for handling Netlify deployments
 */

/**
 * Returns the correct API path based on the environment
 * @param path The API path
 * @returns The correctly formatted path for the current environment
 */
export const getAPIPath = (path: string): string => {
  // Check if we're in a Netlify deployment
  const isNetlify = window.location.hostname.includes('netlify.app');
  
  // If on Netlify, transform the path to use Netlify functions
  if (isNetlify && path.startsWith('/api/')) {
    // Handle special cases for protocol endpoints
    if (path === '/api/protocol/proposals') {
      return '/.netlify/functions/protocol-proposals';
    } else if (path === '/api/protocol/metrics') {
      return '/.netlify/functions/protocol-metrics';
    } else if (path === '/api/leaderboard') {
      return '/.netlify/functions/leaderboard';
    }
    
    // For other API paths, convert format
    const endpoint = path.replace('/api/', '').replace(/\//g, '-');
    return `/.netlify/functions/${endpoint}`;
  }
  
  return path; // Return unchanged for local development
};

/**
 * Fetches data from the API with the correct path resolution
 * @param path The API path
 * @param options Fetch options
 * @returns The fetched data
 */
export const fetchAPI = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const apiPath = getAPIPath(path);
  console.log(`Fetching from: ${apiPath}`);
  
  try {
    const response = await fetch(apiPath, options);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${path.split('/').pop()}`);
    }
    
    return response.json() as Promise<T>;
  } catch (error) {
    console.error(`Error fetching from ${apiPath}:`, error);
    throw error;
  }
};
