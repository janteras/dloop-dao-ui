const { mockData } = require('./mockData');

exports.handler = async (event, context) => {
  // Set CORS headers for all responses
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-wallet-address',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
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
    // Return all proposals
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(mockData.proposals)
    };
  }
  
  if (event.httpMethod === 'POST') {
    try {
      // Parse the request body
      const body = JSON.parse(event.body);
      const { title, description, type, amount, token, duration } = body;
      
      // Validate required fields
      if (!title || !description || !type || !amount || !token || !duration) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing required fields' })
        };
      }
      
      // Create new proposal
      const newProposal = {
        id: mockData.proposals.length + 1,
        title: String(title),
        description: String(description),
        proposer: event.headers['x-wallet-address'] || '0x7F5Ae2',
        createdAt: Math.floor(Date.now() / 1000),
        endTime: Math.floor(Date.now() / 1000) + (Number(duration) * 86400), // duration in days
        endTimeISO: new Date(Date.now() + Number(duration) * 86400 * 1000).toISOString(), // duration in days, in ISO format
        forVotes: 0,
        againstVotes: 0,
        executed: false,
        canceled: false,
        status: 'active',
        type: String(type),
        amount: parseFloat(amount.toString()),
        token: String(token),
        endsIn: `${duration}d`
      };
      
      // Add to mock data
      mockData.proposals.unshift(newProposal);
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(newProposal)
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to create proposal', message: error.message })
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
