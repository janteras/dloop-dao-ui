// Mock data for development/demo
exports.mockData = {
  // Mock proposals data
  proposals: [
    {
      id: 1,
      title: "Increase WBTC Allocation",
      description: "Invest 10% more into WBTC",
      proposer: "0x3F8a81d2db95F13507a82531596aDEFE898ac78e2",
      createdAt: Math.floor(Date.now() / 1000) - 86400,
      endTime: Math.floor(Date.now() / 1000) + 172800, // 2 days from now
      endTimeISO: new Date(Date.now() + 172800 * 1000).toISOString(), // 2 days from now in ISO format
      forVotes: 70,
      againstVotes: 30,
      executed: false,
      canceled: false,
      status: "active",
      type: "invest",
      amount: 250000,
      token: "USDC",
      endsIn: "2d 5h"
    },
    {
      id: 2,
      title: "Add LINK Token",
      description: "Add Chainlink (LINK) to asset pool",
      proposer: "AI.Gov#03",
      createdAt: Math.floor(Date.now() / 1000) - 43200,
      endTime: Math.floor(Date.now() / 1000) + 450000, // 5+ days from now
      endTimeISO: new Date(Date.now() + 450000 * 1000).toISOString(), // 5+ days from now in ISO format
      forVotes: 45,
      againstVotes: 55,
      executed: false,
      canceled: false,
      status: "active",
      type: "invest",
      amount: 100000,
      token: "USDC",
      endsIn: "5d 12h"
    },
    {
      id: 3,
      title: "Reduce PAXG Exposure",
      description: "Divest 5% of PAXG holdings",
      proposer: "0xA114f53B7Ad1c21b8808C54790cDC0221F8496B2",
      createdAt: Math.floor(Date.now() / 1000) - 129600,
      endTime: Math.floor(Date.now() / 1000) + 259200, // 3 days from now
      endTimeISO: new Date(Date.now() + 259200 * 1000).toISOString(), // 3 days from now in ISO format
      forVotes: 65,
      againstVotes: 35,
      executed: false,
      canceled: false,
      status: "active",
      type: "divest",
      amount: 25,
      token: "PAXG",
      endsIn: "3d 8h"
    },
    {
      id: 4,
      title: "Increase USDC Reserves",
      description: "Add more stable reserves",
      proposer: "AI.Gov#01",
      createdAt: Math.floor(Date.now() / 1000) - 604800,
      endTime: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
      endTimeISO: new Date(Date.now() - 86400 * 1000).toISOString(), // 1 day ago in ISO format
      forVotes: 82,
      againstVotes: 18,
      executed: false,
      canceled: false,
      status: "passed",
      type: "invest",
      amount: 500000,
      token: "USDC",
      endsIn: "Ended"
    }
  ],
  
  // Mock protocol proposals
  protocolProposals: [
    {
      id: 12,
      title: "Update Fee Structure",
      description: "Proposal to adjust the performance fee structure for AI nodes.",
      proposer: "0xD4c35e65b1e473dfeC3da98B5fC110f0a78D3e7F",
      createdAt: Math.floor(Date.now() / 1000) - 864000,
      updatedAt: Math.floor(Date.now() / 1000) - 864000,
      forVotes: 65,
      againstVotes: 35,
      voteCount: 320450,
      executed: false,
      canceled: false,
      status: "active",
      endTimestamp: Math.floor(Date.now() / 1000) + 172800, // 2 days from now in seconds
      endTimeISO: new Date(Date.now() + 172800 * 1000).toISOString()
    }
  ],
  
  // Mock protocol metrics
  protocolMetrics: {
    totalProtocolValue: 45890000,
    d_ai_price: 1.01,
    d_ai_supply: 45880000,
    dloop_price: 2.76,
    dloop_supply: 10000000,
    dloop_circulating: 3250000,
    proposal_count: 42,
    active_nodes: 18
  },
  
  // Mock leaderboard data
  leaderboardParticipants: [
    {
      address: "0x7C3fA98507fFcD22A62264AeC6afA82099d96DE1",
      delegatedAmount: 425000,
      proposalsVoted: 38,
      successRate: 92,
      rewardsEarned: 15230,
      rank: 1
    },
    {
      address: "0x9E23fA851681545894f3B3c33BD1E7D22239BDE8",
      delegatedAmount: 375000,
      proposalsVoted: 35,
      successRate: 88,
      rewardsEarned: 12840,
      rank: 2
    }
  ],
  
  // Mock delegation data for current user
  delegations: [
    {
      nodeId: "node-1",
      address: "0x7C3fA98507fFcD22A62264AeC6afA82099d96DE1", // Added address field
      amount: 12500,
      since: "2025-03-15T12:00:00Z"
    },
    {
      nodeId: "node-3",
      address: "0x9E23fA851681545894f3B3c33BD1E7D22239BDE8", // Added address field
      amount: 7500,
      since: "2025-04-02T15:30:00Z"
    }
  ],
  
  // Mock AI nodes
  aiNodes: [
    {
      id: "node-1",
      name: "AI.Gov#01",
      address: "0x7C3fA98507fFcD22A62264AeC6afA82099d96DE1",
      category: "governance",
      votingPower: 245000,
      responseTime: "3.2 hours",
      accuracy: 92,
      description: "Specialized in parameter optimization and risk assessment for the protocol.",
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
      description: "Focuses on monetary policy and protocol economic parameters.",
      proposals: 8,
      participation: 92,
      reputation: 760
    }
  ],
  
  // Mock AI node performance metrics
  aiNodePerformance: {
    totalDelegated: 486870,
    totalRewards: 86445,
    avgResponseTime: 3.5,
    avgSuccessRate: 89
  }
};

// Helper function to generate reasoning text based on sentiment
exports.generateSentimentReasoning = function(sentiment, proposalType) {
  if (sentiment > 70) {
    return `Strongly supports this ${proposalType} proposal as it aligns with optimal protocol parameters and is likely to increase capital efficiency.`;
  } else if (sentiment > 30) {
    return `Generally favorable toward this ${proposalType} initiative, with minor reservations about implementation timing.`;
  } else if (sentiment > -30) {
    return `Neutral position on this ${proposalType} with mixed analysis. Should monitor market conditions before proceeding.`;
  } else if (sentiment > -70) {
    return `Concerns about this ${proposalType} proposal's impact on protocol stability and risk profile. Suggesting modifications.`;
  } else {
    return `Strong opposition to this ${proposalType} proposal based on quantitative risk modeling and historical performance data.`;
  }
};
