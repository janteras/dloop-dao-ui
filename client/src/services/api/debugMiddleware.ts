/**
 * API Debug Middleware
 * Logs detailed information about API requests and responses to help diagnose issues
 */

export const logApiRequest = async (
  url: string,
  options?: RequestInit
): Promise<Response> => {
  console.log(`🔍 API Request to: ${url}`, {
    method: options?.method || 'GET',
    headers: options?.headers,
  });
  
  try {
    const response = await fetch(url, options);
    
    // Clone the response so we can read it for debugging without consuming it
    const clonedResponse = response.clone();
    
    // Log status and headers
    console.log(`📥 API Response from: ${url}`, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      contentType: response.headers.get('content-type'),
    });
    
    // Try to get response body for debugging
    try {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await clonedResponse.json();
        console.log(`📋 JSON Response data from: ${url}`, data);
      } else {
        const text = await clonedResponse.text();
        console.log(`⚠️ Non-JSON Response from: ${url}`, {
          contentType,
          textPreview: text.substring(0, 500) + (text.length > 500 ? '...' : ''),
        });
      }
    } catch (parseError) {
      console.error(`⛔ Error parsing response from: ${url}`, parseError);
    }
    
    return response;
  } catch (fetchError) {
    console.error(`🔴 Fetch error for: ${url}`, fetchError);
    throw fetchError;
  }
};

export default { logApiRequest };
