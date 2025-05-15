exports.handler = async (event, context) => {
  // Set CORS headers for all responses
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-wallet-address',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  
  // Handle OPTIONS requests for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }
  
  if (event.httpMethod === 'POST') {
    try {
      // In a real implementation, this would prepare the actual transaction data
      // Mock response with the same hardcoded values as the Express server
      const targets = ["0xa87e662061237a121Ca2E83E77dA8251bc4B3529"];
      const values = ["0"];
      const calldata = ["0x"];
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ targets, values, calldata })
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to prepare proposal', message: error.message })
      };
    }
  }
  
  // Default response for unsupported methods
  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};
