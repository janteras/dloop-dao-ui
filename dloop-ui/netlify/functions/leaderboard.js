const { mockData } = require('./mockData');

exports.handler = async (event, context) => {
  // Set CORS headers for all responses
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json' // Ensure Content-Type is set
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
      // Transform data to match expected client structure
      const transformedData = mockData.leaderboardParticipants.map(participant => ({
        address: participant.address,
        name: participant.name || null,
        type: participant.nodeId ? 'AI Node' : 'Human',
        votingPower: participant.delegatedAmount,
        accuracy: participant.successRate,
        isCurrentUser: false
      }));
      
      console.log('Returning transformed leaderboard data');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(transformedData)
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
    console.error('Error in leaderboard function:', error);
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
