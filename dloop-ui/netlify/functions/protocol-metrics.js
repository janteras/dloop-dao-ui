// ESM version of the protocol-metrics function

// Define hardcoded metrics data to ensure compatibility
const protocolMetrics = {
  // Enhanced metrics with additional fields for frontend display
  tvl: 12450000,              // Total value locked in USD
  tvlChange: 8.7,            // Percent change in TVL
  dloopPrice: 2.76,          // DLOOP token price in USD
  dloopPriceChange: 3.2,     // Percent change in DLOOP price
  d_ai_price: 1.01,          // D-AI token price in USD
  totalProtocolValue: 45890000, // Total protocol value in USD
  d_ai_supply: 45880000,     // Total D-AI token supply
  dloop_supply: 10000000,    // Total DLOOP token supply
  dloop_circulating: 3250000,// Circulating supply of DLOOP tokens
  proposal_count: 42,        // Number of proposals created
  active_nodes: 18,          // Number of active AI nodes
  treasuryBalance: 5250000,  // Treasury balance in USD
  stakingApy: 12.4,          // Annual percentage yield for staking
  tradingVolume24h: 876500,  // 24-hour trading volume in USD
  userCount: 8750            // Total number of users
};

// Converted to ESM-compatible export format
export const handler = async (event, context) => {
  console.log('Protocol metrics function called - ESM version');
  
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
      // Return protocol metrics
      console.log('Returning protocol metrics data');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(protocolMetrics)
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
    console.error('Error in protocol-metrics function:', error);
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
