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
      mockData.proposals.unshift(newProposal);
      
      // Return the created proposal
      res.status(201).json(newProposal);
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
    res.json(mockData.aiNodes);
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
  
  // API Config for environment variables
  app.get('/api/config', (req, res) => {
    // Use the correct Infura API key for Sepolia and WalletConnect Project ID
    res.json({
      infuraApiKey: process.env.INFURA_API_KEY || 'ca485bd6567e4c5fb5693ee66a5885d8',
      walletConnectProjectId: process.env.WALLETCONNECT_PROJECT_ID || '6f23ad7f41333ccb23a5b2b6d330509a'
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
