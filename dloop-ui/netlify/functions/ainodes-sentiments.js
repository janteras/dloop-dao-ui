const { mockData, generateSentimentReasoning } = require('./mockData');

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
    // Generate sentiments for each node and proposal
    const sentiments = [];
    
    mockData.aiNodes.forEach(node => {
      mockData.proposals.slice(0, 5).forEach(proposal => {
        // Generate pseudo-random sentiment based on node id and proposal id
        const nodeIdSum = node.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        const baseSentiment = ((nodeIdSum + proposal.id) % 200) - 100; // -100 to +100
        const baseConfidence = 50 + ((nodeIdSum * proposal.id) % 50); // 50 to 100
        
        sentiments.push({
          nodeId: node.id,
          proposalId: proposal.id,
          sentiment: baseSentiment,
          confidence: baseConfidence,
          reasoning: generateSentimentReasoning(baseSentiment, proposal.type),
          lastUpdated: new Date().toISOString()
        });
      });
    });
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(sentiments)
    };
  }
  
  // Default response for unsupported methods
  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};
