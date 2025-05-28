import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ethers } from "ethers";

// Mock data for development/demo - this would be replaced with real blockchain data in production
const mockData = {
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
      // Adding two days from now for the end time
      endTimestamp: Math.floor(Date.now() / 1000) + 172800, // 2 days from now in seconds
      endTimeISO: new Date(Date.now() + 172800 * 1000).toISOString(), // 2 days from now in ISO format
      endsAt: "May 02, 2024",
      details: [
        { label: "Current Fee", value: "2.0%" },
        { label: "Proposed Fee", value: "1.5%" },
        { label: "Impact", value: "+0.3% est. yield", isHighlighted: true }
      ]
    },
    {
      id: 11,
      title: "Add Oracle Support for APE Token",
      description: "Add Chainlink price oracle integration for APE token.",
      proposer: "AI.Gov#01",
      createdAt: Math.floor(Date.now() / 1000) - 1382400,
      updatedAt: Math.floor(Date.now() / 1000) - 604800,
      forVotes: 78,
      againstVotes: 22,
      voteCount: 405320,
      executed: false,
      canceled: false,
      status: "passed",
      // This proposal already ended 5 days ago
      endTimestamp: Math.floor(Date.now() / 1000) - 432000, // 5 days ago in seconds
      endTimeISO: new Date(Date.now() - 432000 * 1000).toISOString(), // 5 days ago in ISO format
      endsAt: "Apr 25, 2024",
      details: [
        { label: "Oracle Address", value: "0x9A...2F4b" },
        { label: "Heartbeat", value: "3600 seconds" },
        { label: "Status", value: "Ready for execution" }
      ]
    },
    {
      id: 10,
      title: "Protocol Upgrade v1.2",
      description: "Security and performance improvements for core contracts.",
      proposer: "0x7F5Ae2",
      createdAt: Math.floor(Date.now() / 1000) - 2592000,
      updatedAt: Math.floor(Date.now() / 1000) - 864000,
      forVotes: 92,
      againstVotes: 8,
      voteCount: 512680,
      executed: true,
      canceled: false,
      status: "executed",
      // This proposal ended 10 days ago
      endTimestamp: Math.floor(Date.now() / 1000) - 864000, // 10 days ago in seconds
      endTimeISO: new Date(Date.now() - 864000 * 1000).toISOString(), // 10 days ago in ISO format
      endsAt: "Apr 20, 2024",
      details: [
        { label: "Contracts Updated", value: "3" },
        { label: "Gas Used", value: "1.24 ETH" },
        { label: "Executor", value: "0xD4...3e7F" }
      ]
    }
  ],

  // Mock protocol metrics
  protocolMetrics: {
    tvl: 12450000,
    tvlChange: 8.7,
    dloopPrice: 1.24,
    priceChange: 3.2,
    activeParticipants: 358,
    newParticipants: 12
  },

  // Mock AI Nodes
  aiNodes: [
    {
      id: "node1",
      name: "AI.Gov#01",
      address: "0x1234567890123456789012345678901234567890",
      strategy: "Conservative Balanced",
      delegatedAmount: 125450,
      accuracy: 89,
      performance: 10.2,
      performance90d: 18.2,
      proposalsCreated: 14,
      proposalsPassed: 11,
      tradingThesis: {
        description: "The Conservative Balanced strategy focuses on capital preservation while seeking modest growth through a diversified portfolio.",
        points: [
          "Maintain at least 60% allocation to stable assets",
          "Strategic allocation to blue-chip crypto assets",
          "Regular rebalancing to manage risk",
          "Focus on assets with strong fundamentals"
        ],
        conclusion: "This strategy aims to provide steady returns with reduced volatility compared to the broader crypto market."
      },
      recentActivity: [
        { title: "Voted: YES on Increase WBTC Allocation", date: "2 days ago", status: "Active" },
        { title: "Executed: Increase USDC Reserves", date: "1 week ago", status: "Executed" },
        { title: "Created: Add Oracle Support for APE Token", date: "2 weeks ago", status: "Passed" }
      ]
    },
    {
      id: "node2",
      name: "AI.Gov#02",
      address: "0x2345678901234567890123456789012345678901",
      strategy: "Aggressive Growth",
      delegatedAmount: 52120,
      accuracy: 72,
      performance: -2.5,
      performance90d: 15.8,
      proposalsCreated: 8,
      proposalsPassed: 5,
      tradingThesis: {
        description: "The Aggressive Growth strategy aims to maximize capital appreciation through strategic allocation to high-potential assets.",
        points: [
          "Focus on emerging protocols with strong growth potential",
          "Higher risk tolerance for greater reward potential",
          "Active monitoring and quick response to market trends",
          "Limited exposure to stablecoins except for tactical opportunities"
        ],
        conclusion: "This strategy seeks to outperform the broader crypto market through calculated, higher-risk positions."
      },
      recentActivity: [
        { title: "Voted: NO on Add LINK Token", date: "1 day ago", status: "Active" },
        { title: "Created: Reduce PAXG Exposure", date: "4 days ago", status: "Active" },
        { title: "Voted: YES on Protocol Upgrade v1.2", date: "2 weeks ago", status: "Executed" }
      ]
    },
    {
      id: "node3",
      name: "AI.Gov#03",
      address: "0x3456789012345678901234567890123456789012",
      strategy: "Diversified Income",
      delegatedAmount: 86750,
      accuracy: 78,
      performance: 7.8,
      performance90d: 22.5,
      proposalsCreated: 16,
      proposalsPassed: 12,
      tradingThesis: {
        description: "The Diversified Income strategy focuses on generating a stable income stream through a balanced portfolio of digital assets.",
        points: [
          "Maintaining at least 50% exposure to stable assets",
          "Targeting yield-generating opportunities within DeFi protocols",
          "Opportunistic rebalancing during market corrections",
          "Risk mitigation through asset diversification"
        ],
        conclusion: "Performance is measured primarily by income generation rather than pure value appreciation, with the goal of delivering consistent returns regardless of market conditions."
      },
      recentActivity: [
        { title: "Proposed: Add LINK Token", date: "3 days ago", status: "Active" },
        { title: "Voted: YES on Reduce PAXG Exposure", date: "5 days ago", status: "Active" },
        { title: "Executed: Increase USDC Reserves", date: "1 week ago", status: "Executed" }
      ]
    },
    {
      id: "node4",
      name: "AI.Gov#04",
      address: "0x4567890123456789012345678901234567890123",
      strategy: "Stability Focused",
      delegatedAmount: 45890,
      accuracy: 83,
      performance: 5.4,
      performance90d: 12.7,
      proposalsCreated: 10,
      proposalsPassed: 9,
      tradingThesis: {
        description: "The Stability Focused strategy prioritizes capital preservation and stable returns.",
        points: [
          "Minimum 70% allocation to stablecoins and low-volatility assets",
          "Conservative yield farming strategies with proven protocols",
          "Focus on capital preservation over growth",
          "Tactical positioning to capitalize on market inefficiencies"
        ],
        conclusion: "This strategy is designed for risk-averse participants seeking predictable returns with minimal drawdowns."
      },
      recentActivity: [
        { title: "Voted: YES on Update Fee Structure", date: "2 days ago", status: "Active" },
        { title: "Voted: YES on Add Oracle Support for APE Token", date: "1 week ago", status: "Passed" },
        { title: "Created: Increase USDC Reserves", date: "2 weeks ago", status: "Passed" }
      ]
    },
    {
      id: "node5",
      name: "AI.Gov#05",
      address: "0x5678901234567890123456789012345678901234",
      strategy: "Market Neutral",
      delegatedAmount: 176660,
      accuracy: 74,
      performance: 9.1,
      performance90d: 16.2,
      proposalsCreated: 12,
      proposalsPassed: 8,
      tradingThesis: {
        description: "The Market Neutral strategy aims to generate returns regardless of market direction through balanced positions.",
        points: [
          "Employing delta-neutral trading strategies",
          "Utilizing arbitrage opportunities across platforms",
          "Balanced long/short positions to hedge market exposure",
          "Focus on relative value rather than directional bets"
        ],
        conclusion: "This approach seeks to deliver consistent performance with minimal correlation to the broader crypto market."
      },
      recentActivity: [
        { title: "Voted: YES on Increase WBTC Allocation", date: "3 days ago", status: "Active" },
        { title: "Created: Update Fee Structure", date: "1 week ago", status: "Active" },
        { title: "Voted: YES on Protocol Upgrade v1.2", date: "3 weeks ago", status: "Executed" }
      ]
    }
  ],

  // Mock AI node performance metrics
  aiNodePerformance: {
    totalDelegated: 486870,
    delegationChange: 12.4,
    averagePerformance: 8.2,
    performanceDelta: 1.5,
    newNodes: 1
  },

  // Mock leaderboard participants
  leaderboardParticipants: [
    {
      address: "0x1234567890123456789012345678901234567890",
      name: "AI.Gov#01",
      type: "AI Node",
      votingPower: 125450,
      accuracy: 89
    },
    {
      address: "0xD4c35e65b1e473dfeC3da98B5fC110f0a78D3e7F",
      type: "Human",
      votingPower: 98230,
      accuracy: 82
    },
    {
      address: "0x3456789012345678901234567890123456789012",
      name: "AI.Gov#03",
      type: "AI Node",
      votingPower: 86750,
      accuracy: 78
    },
    {
      address: "0x7F5Ae2",
      type: "Human",
      votingPower: 65450,
      accuracy: 75
    },
    {
      address: "0x5678901234567890123456789012345678901234",
      name: "AI.Gov#05",
      type: "AI Node",
      votingPower: 52120,
      accuracy: 72
    }
  ],

  // Mock user delegations
  delegations: [
    {
      id: "del1",
      from: "0x7F5Ae2",
      to: "0x3456789012345678901234567890123456789012",
      toName: "AI.Gov#03",
      toType: "AI Node",
      amount: 250,
      date: Date.now() - 3 * 24 * 60 * 60 * 1000 // 3 days ago
    },
    {
      id: "del2",
      from: "0x7F5Ae2",
      to: "0xD4c35e65b1e473dfeC3da98B5fC110f0a78D3e7F",
      toType: "Human",
      amount: 200,
      date: Date.now() - 15 * 24 * 60 * 60 * 1000 // 15 days ago
    }
  ]
};

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes

  // AssetDAO Proposals
  app.get('/api/proposals', (req, res) => {
    res.json(mockData.proposals);
  });

  // Create a new proposal in our database
  app.post('/api/proposals', (req, res) => {
    try {
      const { title, description, type, amount, token, duration } = req.body;

      // Log the proposal creation request for debugging
      console.log('Creating proposal:', { title, type, token, amount });

      // Validate required fields
      if (!title || !description || !type || !amount || !token || !duration) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // In a real implementation, we would save this to our database
      // For now, we'll add it to our mockData
      const newProposal = {
        id: mockData.proposals.length + 1,
        title,
        description,
        proposer: req.headers['x-wallet-address'] || '0x7F5Ae2',
        createdAt: Math.floor(Date.now() / 1000),
        endTime: Math.floor(Date.now() / 1000) + (Number(duration) * 86400), // duration in days
        endTimeISO: new Date(Date.now() + Number(duration) * 86400 * 1000).toISOString(), // duration in days, in ISO format
        forVotes: 0,
        againstVotes: 0,
        executed: false,
        canceled: false,
        status: 'active',
        type,
        amount: parseFloat(amount.toString()),
        token,
        endsIn: `${duration}d`
      };

      // Add to our mock data (in a real app, this would be a database insert)
      // Ensure that proposer is a string
      const sanitizedProposal = {
        ...newProposal,
        proposer: typeof newProposal.proposer === 'string' 
          ? newProposal.proposer 
          : Array.isArray(newProposal.proposer) 
            ? newProposal.proposer[0] 
            : 'Anonymous',
        title: String(newProposal.title),
        description: String(newProposal.description),
        type: String(newProposal.type),
        token: String(newProposal.token),
        endTimeISO: newProposal.endTimeISO
      };

      mockData.proposals.unshift(sanitizedProposal);

      // Return the created proposal
      res.status(201).json(sanitizedProposal);
    } catch (error) {
      console.error('Error creating proposal:', error);
      res.status(500).json({ error: 'Failed to create proposal' });
    }
  });

  // Prepare proposal data for the frontend
  app.post('/api/proposals/prepare', (req, res) => {
    const { type, token, amount } = req.body;

    // In a real implementation, this would prepare the actual transaction data
    // Mock response
    const targets = ["0xa87e662061237a121Ca2E83E77dA8251bc4B3529"];
    const values = ["0"];
    const calldata = ["0x"];

    res.json({ targets, values, calldata });
  });

  // Protocol DAO Proposals
  app.get('/api/protocol/proposals', (req, res) => {
    res.json(mockData.protocolProposals);
  });

  // Protocol metrics
  app.get('/api/protocol/metrics', (req, res) => {
    res.json(mockData.protocolMetrics);
  });

  // AI Nodes
  app.get('/api/ainodes', (req, res) => {
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

    res.json(aiNodes);
  });

  // AI Node Performance
  app.get('/api/ainodes/performance', (req, res) => {
    res.json(mockData.aiNodePerformance);
  });

  // Leaderboard
  app.get('/api/leaderboard', (req, res) => {
    res.json(mockData.leaderboardParticipants);
  });

  // User delegations
  app.get('/api/leaderboard/delegations', (req, res) => {
    res.json(mockData.delegations);
  });

  // AI Node Sentiments
  app.get('/api/ainodes/sentiments', (req, res) => {
    // In a real implementation, this would come from a real API/database
    // For demo purposes, generate sentiments for each node and proposal
    interface SentimentData {
      nodeId: string;
      proposalId: number;
      sentiment: number; // -100 to +100 scale
      confidence: number; // 0 to 100 scale
      reasoning?: string;
      lastUpdated: string;
    }

    const sentiments: SentimentData[] = [];

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
          reasoning: generateSentimentReasoning(baseSentiment, proposal.type as string),
          lastUpdated: new Date().toISOString()
        });
      });
    });

    res.json(sentiments);
  });

  // Helper function to generate reasoning text based on sentiment
  function generateSentimentReasoning(sentiment: number, proposalType: string): string {
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
  }

  // Protocol metrics endpoint - both paths for compatibility
  app.get('/api/protocol/metrics', (req, res) => {
    res.json(mockData.protocolMetrics);
  });
  app.get('/api/protocol-metrics', (req, res) => {
    res.json(mockData.protocolMetrics);
  });

  // Protocol proposals endpoint - both paths for compatibility
  app.get('/api/protocol/proposals', (req, res) => {
    res.json(mockData.protocolProposals);
  });
  app.get('/api/protocol-proposals', (req, res) => {
    res.json(mockData.protocolProposals);
  });

  // API Config for environment variables
  app.get('/api/config', (req, res) => {
    try {
      // Use explicit API keys instead of environment variables which might not be loaded properly
      const infuraApiKey = "ca485bd6567e4c5fb5693ee66a5885d8"; // Infura Project ID
      const walletConnectProjectId = "6f23ad7f41333ccb23a5b2b6d330509a"; // WalletConnect Project ID

      console.log("Sending API configuration to client:", { 
        infuraApiKey: infuraApiKey.substring(0, 5) + "...", 
        walletConnectProjectId: walletConnectProjectId.substring(0, 5) + "..." 
      });

      // Send API keys to the client
      res.json({
        infuraApiKey,
        walletConnectProjectId
      });
    } catch (error) {
      console.error('Error retrieving API config:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve API configuration',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
export function setupRoutes(app: Express) {
  // Serve static files from the client directory
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../dist')));
  }

  // API configuration endpoint
  app.get('/api/config', (req, res) => {
    const config = {
      infuraApiKey: process.env.VITE_INFURA_API_KEY || 'ca485bd6567e4c5fb5693ee66a5885d8',
      walletConnectProjectId: process.env.VITE_WALLETCONNECT_PROJECT_ID || '6f23a7b1234567890abcdef1234567890'
    };

    console.log('Sending API configuration to client:', {
      infuraApiKey: config.infuraApiKey?.substring(0, 5) + '...',
      walletConnectProjectId: config.walletConnectProjectId?.substring(0, 5) + '...'
    });

    res.json(config);
  });

  // Protocol metrics endpoint (development mock)
  app.get('/api/protocol-metrics', (req, res) => {
    const metrics = {
      totalProposals: 85,
      activeProposals: 5,
      passedProposals: 45,
      failedProposals: 35,
      totalValueLocked: "1250000",
      governanceTokenSupply: "10000000",
      totalVotes: 12500,
      uniqueVoters: 350,
      averageProposalDuration: 259200, // 3 days in seconds
      lastUpdated: new Date().toISOString()
    };

    console.log('Sending protocol metrics to client');
    res.json(metrics);
  });

  // Protocol proposals endpoint (development mock)
  app.get('/api/protocol-proposals', (req, res) => {
    const proposals = {
      proposals: [],
      total: 0,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      hasMore: false
    };

    console.log('Sending protocol proposals to client');
    res.json(proposals);
  });
}