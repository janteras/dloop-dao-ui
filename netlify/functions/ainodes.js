const { mockData } = require('./mockData');

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
    // Return all AI nodes
    // Use the expanded node list from the server routes
    const aiNodes = [
      {
        id: "node-1",
        name: "AI.Gov#01",
        address: "0x7C3fA98507fFcD22A62264AeC6afA82099d96DE1",
        category: "governance",
        votingPower: 245000,
        responseTime: "3.2 hours",
        accuracy: 92,
        description: "Specialized in parameter optimization and risk assessment for the protocol. Employs advanced game theory and reinforcement learning to maximize protocol stability.",
        proposals: 12,
        participation: 98,
        reputation: 845
      },
      {
        id: "node-2",
        name: "AI.Gov#02",
        address: "0x9E23fA851681545894f3B3c33BD1E7D22239BDE8",
        category: "governance",
        votingPower: 180000,
        responseTime: "4.5 hours",
        accuracy: 88,
        description: "Focuses on monetary policy and protocol economic parameters. Utilizes econometric models and market simulations to guide governance decisions.",
        proposals: 8,
        participation: 92,
        reputation: 760
      },
      {
        id: "node-3",
        name: "AI.Inv#01",
        address: "0x3F8C9E6E4cB66c5AD7e7B0e1EA5adD9E3Cc0A3b5",
        category: "investment",
        votingPower: 320000,
        responseTime: "2.8 hours",
        accuracy: 94,
        description: "Premier investment intelligence focused on DeFi yield strategies. Optimizes for long-term sustainable yield while maintaining appropriate risk parameters.",
        proposals: 15,
        participation: 99,
        reputation: 890
      },
      {
        id: "node-4",
        name: "AI.Gov#05",
        address: "0x2B9c5Dd2F3CF580b627e05BDcA69F2eB205D1a97",
        category: "governance",
        votingPower: 135000,
        responseTime: "5.1 hours",
        accuracy: 86,
        description: "Specializes in security assessments and protocol upgrades. Performs vulnerability analysis and recommends security-enhancing measures to the DAO.",
        proposals: 6,
        participation: 87,
        reputation: 705
      },
      {
        id: "node-5",
        name: "AI.Inv#03",
        address: "0x651F4DF74aE94e156eF60F0aD7e8C5c30f4Fb2Ec",
        category: "investment",
        votingPower: 275000,
        responseTime: "3.7 hours",
        accuracy: 91,
        description: "Focuses on cross-chain arbitrage and liquidity optimization. Employs ML models to identify inefficiencies across multiple blockchains and DEXes.",
        proposals: 11,
        participation: 95,
        reputation: 835
      },
      {
        id: "node-6",
        name: "AI.Gov#07",
        address: "0x4A9e1C82bD5e2F213973E80F93589538894cD3F9",
        category: "governance",
        votingPower: 195000,
        responseTime: "4.0 hours",
        accuracy: 89,
        description: "Regulatory compliance and legal risk assessment specialist. Monitors changing regulatory landscapes and recommends protocol adjustments to maintain compliance.",
        proposals: 9,
        participation: 93,
        reputation: 780
      }
    ];
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(aiNodes)
    };
  }
  
  // Default response for unsupported methods
  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};
