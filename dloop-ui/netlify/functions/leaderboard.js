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
      const transformedParticipants = mockData.leaderboardParticipants.map(participant => ({
        address: participant.address,
        name: participant.name || null,
        type: participant.nodeId ? 'AI Node' : 'Human',
        votingPower: participant.delegatedAmount,
        accuracy: participant.successRate,
        isCurrentUser: false,
        // Add additional fields that might be expected by the UI
        rank: participant.rank || 0,
        delegators: participant.delegators || 0,
        performance: participant.performance || 0,
        proposalsCreated: participant.proposalsCreated || 0,
        proposalsVoted: participant.proposalsVoted || 0
      }));
      
      // Create the response object with the expected structure
      const responseData = {
        participants: transformedParticipants,
        delegations: mockData.delegations || []
      };
      
      console.log('Returning transformed leaderboard data with structure:', 
        `{ participants: Array(${transformedParticipants.length}), delegations: Array(${(mockData.delegations || []).length}) }`);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(responseData)
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
