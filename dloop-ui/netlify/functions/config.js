exports.handler = async (event, context) => {
  // Set CORS headers for all responses
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };
  
  // Handle OPTIONS requests for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }
  
  if (event.httpMethod === 'GET') {
    try {
      // Use explicit API keys as in the original server
      const infuraApiKey = "ca485bd6567e4c5fb5693ee66a5885d8"; // Infura Project ID
      const walletConnectProjectId = "6f23ad7f41333ccb23a5b2b6d330509a"; // WalletConnect Project ID
      
      console.log("Sending API configuration to client:", { 
        infuraApiKey: infuraApiKey.substring(0, 5) + "...", 
        walletConnectProjectId: walletConnectProjectId.substring(0, 5) + "..." 
      });
      
      // Send API keys to the client
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          infuraApiKey,
          walletConnectProjectId
        })
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to retrieve API configuration',
          message: error.message || 'Unknown error'
        })
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
