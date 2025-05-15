// Simple test function to verify API routing is working correctly
exports.handler = async (event, context) => {
  // Set CORS headers and ensure JSON content type for all responses
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json' // Always set Content-Type for all responses
  };
  
  try {
    // Handle OPTIONS requests for CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 204,
        headers,
        body: ''
      };
    }
    
    // Return a simple test response for any method
    console.log('API test function called successfully');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'API test successful',
        timestamp: new Date().toISOString(),
        requestPath: event.path,
        requestMethod: event.httpMethod
      })
    };
  } catch (error) {
    // Log the error but still return valid JSON
    console.error('Error in api-test function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'An error occurred processing your request',
        message: error.message || 'Unknown error'
      })
    };
  }
};
