"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/mockData.js
var mockData_exports = {};
__export(mockData_exports, {
  generateSentimentReasoning: () => generateSentimentReasoning,
  mockData: () => mockData
});
function generateSentimentReasoning(sentiment, proposalType) {
  const reasonings = {
    positive: {
      expansion: "The proposal aligns with our long-term growth strategy and provides sufficient risk management.",
      governance: "The governance changes promote transparency and community participation while maintaining operational efficiency.",
      default: "This proposal demonstrates strong fundamentals and a clear benefit to the ecosystem."
    },
    neutral: {
      expansion: "While the initiative has merit, there are questions about timing and resource allocation.",
      governance: "The governance modifications are reasonable but may need refinement in implementation details.",
      default: "The proposal has both benefits and drawbacks that need careful consideration."
    },
    negative: {
      expansion: "The expansion plan lacks adequate risk assessment and may overextend our resources.",
      governance: "The proposed changes could centralize power and reduce community oversight.",
      default: "This proposal introduces significant risks that outweigh potential benefits."
    }
  };
  return reasonings[sentiment][proposalType] || reasonings[sentiment].default;
}
var mockData;
var init_mockData = __esm({
  "netlify/functions/mockData.js"() {
    "use strict";
    mockData = {
      // Mock proposals data
      proposals: [
        {
          id: 1,
          title: "Increase WBTC Allocation",
          description: "Invest 10% more into WBTC",
          proposer: "0x3F8a81d2db95F13507a82531596aDEFE898ac78e2",
          createdAt: Math.floor(Date.now() / 1e3) - 86400,
          endTime: Math.floor(Date.now() / 1e3) + 172800,
          // 2 days from now
          endTimeISO: new Date(Date.now() + 172800 * 1e3).toISOString(),
          // 2 days from now in ISO format
          forVotes: 70,
          againstVotes: 30,
          executed: false,
          canceled: false,
          status: "active",
          type: "invest",
          amount: 25e4,
          token: "USDC",
          endsIn: "2d 5h"
        },
        {
          id: 2,
          title: "Add LINK Token",
          description: "Add Chainlink (LINK) to asset pool",
          proposer: "AI.Gov#03",
          createdAt: Math.floor(Date.now() / 1e3) - 43200,
          endTime: Math.floor(Date.now() / 1e3) + 45e4,
          // 5+ days from now
          endTimeISO: new Date(Date.now() + 45e4 * 1e3).toISOString(),
          // 5+ days from now in ISO format
          forVotes: 45,
          againstVotes: 55,
          executed: false,
          canceled: false,
          status: "active",
          type: "invest",
          amount: 1e5,
          token: "USDC",
          endsIn: "5d 12h"
        },
        {
          id: 3,
          title: "Reduce PAXG Exposure",
          description: "Divest 5% of PAXG holdings",
          proposer: "0xA114f53B7Ad1c21b8808C54790cDC0221F8496B2",
          createdAt: Math.floor(Date.now() / 1e3) - 129600,
          endTime: Math.floor(Date.now() / 1e3) + 259200,
          // 3 days from now
          endTimeISO: new Date(Date.now() + 259200 * 1e3).toISOString(),
          // 3 days from now in ISO format
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
          createdAt: Math.floor(Date.now() / 1e3) - 604800,
          endTime: Math.floor(Date.now() / 1e3) - 86400,
          // 1 day ago
          endTimeISO: new Date(Date.now() - 86400 * 1e3).toISOString(),
          // 1 day ago in ISO format
          forVotes: 82,
          againstVotes: 18,
          executed: false,
          canceled: false,
          status: "passed",
          type: "invest",
          amount: 5e5,
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
          createdAt: Math.floor(Date.now() / 1e3) - 864e3,
          updatedAt: Math.floor(Date.now() / 1e3) - 864e3,
          forVotes: 65,
          againstVotes: 35,
          voteCount: 320450,
          executed: false,
          canceled: false,
          status: "active",
          endTimestamp: Math.floor(Date.now() / 1e3) + 172800,
          // 2 days from now in seconds
          endTimeISO: new Date(Date.now() + 172800 * 1e3).toISOString()
        }
      ],
      // Mock protocol metrics
      protocolMetrics: {
        totalProtocolValue: 4589e4,
        d_ai_price: 1.01,
        d_ai_supply: 4588e4,
        dloop_price: 2.76,
        dloop_supply: 1e7,
        dloop_circulating: 325e4,
        proposal_count: 42,
        active_nodes: 18
      },
      // Mock leaderboard data
      leaderboardParticipants: [
        {
          address: "0x7C3fA98507fFcD22A62264AeC6afA82099d96DE1",
          delegatedAmount: 425e3,
          proposalsVoted: 38,
          successRate: 92,
          rewardsEarned: 15230,
          rank: 1
        },
        {
          address: "0x9E23fA851681545894f3B3c33BD1E7D22239BDE8",
          delegatedAmount: 375e3,
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
          address: "0x7C3fA98507fFcD22A62264AeC6afA82099d96DE1",
          // Added address field
          amount: 12500,
          since: "2025-03-15T12:00:00Z"
        },
        {
          nodeId: "node-3",
          address: "0x9E23fA851681545894f3B3c33BD1E7D22239BDE8",
          // Added address field
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
          votingPower: 245e3,
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
          votingPower: 18e4,
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
  }
});

// netlify/functions/proposals.js
var { mockData: mockData2 } = (init_mockData(), __toCommonJS(mockData_exports));
exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, x-wallet-address",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
  };
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
      body: ""
    };
  }
  if (event.httpMethod === "GET") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(mockData2.proposals)
    };
  }
  if (event.httpMethod === "POST") {
    try {
      const body = JSON.parse(event.body);
      const { title, description, type, amount, token, duration } = body;
      if (!title || !description || !type || !amount || !token || !duration) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Missing required fields" })
        };
      }
      const newProposal = {
        id: mockData2.proposals.length + 1,
        title: String(title),
        description: String(description),
        proposer: event.headers["x-wallet-address"] || "0x7F5Ae2",
        createdAt: Math.floor(Date.now() / 1e3),
        endTime: Math.floor(Date.now() / 1e3) + Number(duration) * 86400,
        // duration in days
        endTimeISO: new Date(Date.now() + Number(duration) * 86400 * 1e3).toISOString(),
        // duration in days, in ISO format
        forVotes: 0,
        againstVotes: 0,
        executed: false,
        canceled: false,
        status: "active",
        type: String(type),
        amount: parseFloat(amount.toString()),
        token: String(token),
        endsIn: `${duration}d`
      };
      mockData2.proposals.unshift(newProposal);
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(newProposal)
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Failed to create proposal", message: error.message })
      };
    }
  }
  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: "Method not allowed" })
  };
};
//# sourceMappingURL=proposals.js.map
