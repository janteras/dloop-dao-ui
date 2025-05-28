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
 * Get the base URL for API requests
 * In development, use the current origin
 * In production, use the deployed URL
 */
export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:5003';
}

/**
 * Fetches data from the API with enhanced error handling and logging
 * @param path The API path
 * @param options Fetch options
 * @returns The fetched data
 */
export async function fetchAPI(endpoint: string, options: RequestInit = {}): Promise<any> {
  // In development, check if we're trying to fetch Netlify functions
  const isDev = process.env.NODE_ENV === 'development';
  const isNetlifyFunction = endpoint.includes('/.netlify/functions/');

  let url = endpoint.startsWith('http') ? endpoint : `${getBaseUrl()}${endpoint}`;

  // In development, redirect Netlify function calls to our Express server
  if (isDev && isNetlifyFunction) {
    const functionName = endpoint.split('/').pop();
    url = `${getBaseUrl()}/api/${functionName}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Check if the response is ok
    if (!response.ok) {
      // In development, if API route doesn't exist, return mock data
      if (isDev && response.status === 404) {
        console.warn(`API route ${url} not found, returning mock data`);
        if (endpoint.includes('protocol-metrics')) {
          return {
            totalProposals: 85,
            activeProposals: 5,
            totalValueLocked: "1250000",
            governanceTokenSupply: "10000000"
          };
        }
        if (endpoint.includes('protocol-proposals')) {
          return { proposals: [], total: 0 };
        }
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();

      // In development, if we get HTML instead of JSON, it means the route doesn't exist
      if (isDev && contentType?.includes('text/html')) {
        console.warn(`Got HTML response from ${url}, likely route doesn't exist. Using mock data.`);
        if (endpoint.includes('protocol-metrics')) {
          return {
            totalProposals: 85,
            activeProposals: 5,
            totalValueLocked: "1250000",
            governanceTokenSupply: "10000000"
          };
        }
        if (endpoint.includes('protocol-proposals')) {
          return { proposals: [], total: 0 };
        }
      }

      console.error(`Invalid content type: ${contentType}. Response preview:`, text.substring(0, 500));
      throw new Error(`Expected JSON response but got ${contentType}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error);
    throw error;
  }
}