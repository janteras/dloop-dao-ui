// API Tester utility for Netlify functions
// This helps test API endpoints directly during development

const { mockData } = require('./mockData');

exports.handler = async (event, context) => {
  // Set CORS headers for all responses
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
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
    
    if (event.httpMethod === 'GET') {
      // Get the endpoint to test
      const queryParams = event.queryStringParameters || {};
      const endpoint = queryParams.endpoint;
      
      if (!endpoint) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Missing endpoint parameter',
            message: 'Please provide an endpoint to test, e.g. ?endpoint=protocol-proposals'
          })
        };
      }
      
      // List of available endpoints for testing
      const availableEndpoints = {
        'protocol-proposals': mockData.protocolProposals,
        'protocol-metrics': mockData.protocolMetrics,
        'leaderboard': mockData.leaderboardParticipants,
        'ainodes': mockData.aiNodes,
        'all': mockData
      };
      
      // Check if endpoint exists
      if (!(endpoint in availableEndpoints)) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ 
            error: 'Endpoint not found',
            message: `Endpoint "${endpoint}" is not available for testing`,
            availableEndpoints: Object.keys(availableEndpoints)
          })
        };
      }
      
      // Return the requested endpoint data
      console.log(`Testing endpoint: ${endpoint}`);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(availableEndpoints[endpoint])
      };
    }
    
    // Default response for unsupported methods
    console.log(`Unsupported method: ${event.httpMethod}`);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  } catch (error) {
    // Log the error but still return valid JSON
    console.error('Error in API tester function:', error);
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
