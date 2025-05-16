// ESM version of leaderboard function

// Define hardcoded data directly to ensure it works regardless of module issues
const leaderboardParticipants = [
  {
    address: "0x7C3fA98507fFcD22A62264AeC6afA82099d96DE1",
    name: "AI.Gov#01",
    type: "Human",
    votingPower: 425000,
    accuracy: 92,
    isCurrentUser: false,
    rank: 1,
    delegators: 15,
    performance: 18.4,
    proposalsCreated: 22,
    proposalsVoted: 38
  },
  {
    address: "0x9E23fA851681545894f3B3c33BD1E7D22239BDE8",
    name: "DeFiWhale",
    type: "Human",
    votingPower: 375000,
    accuracy: 88,
    isCurrentUser: false,
    rank: 2,
    delegators: 8,
    performance: 14.2,
    proposalsCreated: 11,
    proposalsVoted: 35
  },
  {
    address: "0x3A4B670Be17F3a36F8F55BF7C3c7453495A04Ed1",
    name: "AI.Gov#02",
    type: "AI Node",
    votingPower: 310000,
    accuracy: 95,
    isCurrentUser: false,
    rank: 3,
    delegators: 12,
    performance: 22.7,
    proposalsCreated: 14,
    proposalsVoted: 48
  }
];

const delegations = [
  {
    nodeId: "node-1",
    address: "0x7C3fA98507fFcD22A62264AeC6afA82099d96DE1",
    amount: 12500,
    since: "2025-03-15T12:00:00Z"
  },
  {
    nodeId: "node-3",
    address: "0x9E23fA851681545894f3B3c33BD1E7D22239BDE8",
    amount: 7500,
    since: "2025-04-02T15:30:00Z"
  }
];

// Converted to ESM-compatible export format
export const handler = async (event, context) => {
  console.log('Leaderboard function called - ESM version');
  
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
      // Use the pre-formatted data that matches what the frontend expects
      console.log('Sending leaderboard data directly from predefined structures');
      
      // Data is already in the correct format for the frontend
      const responseData = {
        participants: leaderboardParticipants,
        delegations: delegations
      };
      
      console.log('Returning leaderboard data of format:', 
        `{ participants: Array(${leaderboardParticipants.length}), delegations: Array(${delegations.length}) }`);
      
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
    // Log the error but still return valid JSON with more details for debugging
    console.error('Error in leaderboard function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'An error occurred processing your request',
        message: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};

// Using pure ESM exports - we're not using CommonJS compatibility to avoid module conflicts
