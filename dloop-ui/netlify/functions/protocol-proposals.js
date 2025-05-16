// ESM version of the protocol-proposals function

// Define hardcoded proposals directly to ensure compatibility
const protocolProposals = [
  {
    id: 12,
    title: "Update Fee Structure",
    description: "Proposal to adjust the performance fee structure for AI nodes to better align incentives across the ecosystem. This will encourage more node operators to participate while ensuring high-quality service delivery.",
    proposer: "0xD4c35e65b1e473dfeC3da98B5fC110f0a78D3e7F",
    createdAt: Math.floor(Date.now() / 1000) - 864000,
    updatedAt: Math.floor(Date.now() / 1000) - 864000,
    forVotes: 65,
    againstVotes: 35,
    voteCount: 320450,
    executed: false,
    canceled: false,
    status: "active",
    endTimestamp: Math.floor(Date.now() / 1000) + 172800,
    endTimeISO: new Date(Date.now() + 172800 * 1000).toISOString()
  },
  {
    id: 13,
    title: "Expand AI Node Network",
    description: "Proposal to fund the expansion of our AI node network, adding 10 new specialized nodes with advanced sentiment analysis capabilities.",
    proposer: "0x3A4B670Be17F3a36F8F55BF7C3c7453495A04Ed1",
    createdAt: Math.floor(Date.now() / 1000) - 456000,
    updatedAt: Math.floor(Date.now() / 1000) - 456000,
    forVotes: 78,
    againstVotes: 22,
    voteCount: 289750,
    executed: false,
    canceled: false,
    status: "active",
    endTimestamp: Math.floor(Date.now() / 1000) + 345600,
    endTimeISO: new Date(Date.now() + 345600 * 1000).toISOString()
  },
  {
    id: 11,
    title: "Community Fund Allocation",
    description: "Proposal to allocate 500,000 DLOOP tokens to the community development fund for supporting ecosystem growth initiatives.",
    proposer: "0x9E23fA851681545894f3B3c33BD1E7D22239BDE8",
    createdAt: Math.floor(Date.now() / 1000) - 1296000,
    updatedAt: Math.floor(Date.now() / 1000) - 1296000,
    forVotes: 91,
    againstVotes: 9,
    voteCount: 412200,
    executed: true,
    canceled: false,
    status: "executed",
    endTimestamp: Math.floor(Date.now() / 1000) - 604800,
    endTimeISO: new Date(Date.now() - 604800 * 1000).toISOString()
  }
];

// Converted to ESM-compatible export format
export const handler = async (event, context) => {
  console.log('Protocol proposals function called - ESM version');
  
  // Set CORS headers for all responses
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
    
    if (event.httpMethod === 'GET') {
      // Return all protocol proposals
      console.log('Returning protocol proposals data');
      console.log(`Sending ${protocolProposals.length} protocol proposals`);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(protocolProposals)
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
    console.error('Error in protocol-proposals function:', error);
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
