// Test script to verify our API endpoints are working
export const handler = async (event, context) => {
  console.log('API Test function called - checking all endpoints');
  
  // Set CORS headers for the response
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };
  
  try {
    // Test all our API endpoints and collect results
    const results = {};
    
    // Test leaderboard endpoint
    try {
      console.log('Testing leaderboard endpoint...');
      const leaderboardUrl = 'http://localhost:9000/.netlify/functions/leaderboard';
      const leaderboardResponse = await fetch(leaderboardUrl);
      
      if (!leaderboardResponse.ok) {
        results.leaderboard = {
          status: leaderboardResponse.status,
          error: `Failed with status: ${leaderboardResponse.status}`
        };
      } else {
        const data = await leaderboardResponse.json();
        results.leaderboard = {
          status: 'success',
          dataStructure: {
            hasParticipants: Boolean(data.participants && Array.isArray(data.participants)),
            participantCount: data.participants ? data.participants.length : 0,
            hasDelegations: Boolean(data.delegations && Array.isArray(data.delegations)),
            delegationCount: data.delegations ? data.delegations.length : 0
          }
        };
      }
    } catch (error) {
      results.leaderboard = {
        status: 'error',
        message: error.message
      };
    }
    
    // Test protocol-proposals endpoint
    try {
      console.log('Testing protocol-proposals endpoint...');
      const proposalsUrl = 'http://localhost:9000/.netlify/functions/protocol-proposals';
      const proposalsResponse = await fetch(proposalsUrl);
      
      if (!proposalsResponse.ok) {
        results.protocolProposals = {
          status: proposalsResponse.status,
          error: `Failed with status: ${proposalsResponse.status}`
        };
      } else {
        const data = await proposalsResponse.json();
        results.protocolProposals = {
          status: 'success',
          dataStructure: {
            isArray: Array.isArray(data),
            itemCount: Array.isArray(data) ? data.length : 0,
            firstItemFields: Array.isArray(data) && data.length > 0 ? Object.keys(data[0]) : []
          }
        };
      }
    } catch (error) {
      results.protocolProposals = {
        status: 'error',
        message: error.message
      };
    }
    
    // Test protocol-metrics endpoint
    try {
      console.log('Testing protocol-metrics endpoint...');
      const metricsUrl = 'http://localhost:9000/.netlify/functions/protocol-metrics';
      const metricsResponse = await fetch(metricsUrl);
      
      if (!metricsResponse.ok) {
        results.protocolMetrics = {
          status: metricsResponse.status,
          error: `Failed with status: ${metricsResponse.status}`
        };
      } else {
        const data = await metricsResponse.json();
        results.protocolMetrics = {
          status: 'success',
          dataStructure: {
            isObject: typeof data === 'object' && data !== null && !Array.isArray(data),
            fields: typeof data === 'object' && data !== null ? Object.keys(data).sort() : []
          }
        };
      }
    } catch (error) {
      results.protocolMetrics = {
        status: 'error',
        message: error.message
      };
    }
    
    // Return all results
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'API Test Results',
        results,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Error in test-api function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'An error occurred during API testing',
        message: error.message
      })
    };
  }
};
