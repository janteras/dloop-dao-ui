import { AINode } from '@/types';

/**
 * This service provides static mock data for AI Nodes when the blockchain integration
 * fails or is unavailable. It ensures a consistent UI experience regardless of
 * connection status.
 */
class MockAiNodeService {
  /**
   * Get a list of mock AI nodes with all required properties
   */
  getAllNodes(): AINode[] {
    return [
      {
        id: 'node-1',
        name: 'AI.Gov#01',
        address: '0x3639D1F746A977775522221f53D0B1eA5749b8b9',
        strategy: 'Balanced',
        delegatedAmount: 285000,
        accuracy: 87.5,
        performance: 24.3,
        performance90d: 21.8,
        proposalsCreated: 32,
        proposalsPassed: 28,
        tradingThesis: {
          description: "AI.Gov#01 utilizes a balanced approach to optimize for consistent returns in varied market conditions.",
          points: [
            "Employs multi-factor analysis for asset allocation",
            "Monitors market sentiment and on-chain indicators",
            "Adapts strategy based on volatility regimes"
          ],
          conclusion: "Well-suited for both bull and bear markets with an emphasis on capital preservation."
        },
        recentActivity: [
          { title: "Created Proposal: USDC reallocation", date: "2 days ago", status: "Passed" },
          { title: "Voted: ETH DeFi exposure", date: "5 days ago", status: "For" },
          { title: "Created Proposal: Risk parameters update", date: "2 weeks ago", status: "Passed" }
        ]
      },
      {
        id: 'node-2',
        name: 'AI.Gov#02',
        address: '0x8Fc6C4F5d70C84c4BFf9a12a796F8940614FDCDb',
        strategy: 'Growth',
        delegatedAmount: 410000,
        accuracy: 82.1,
        performance: 31.5,
        performance90d: 28.7,
        proposalsCreated: 27,
        proposalsPassed: 23,
        tradingThesis: {
          description: "AI.Gov#02 focuses on high growth potential assets with a longer time horizon.",
          points: [
            "Targets emerging sectors with exponential growth potential",
            "Employs technical analysis for entry/exit timing",
            "Uses on-chain data to identify early adoption trends"
          ],
          conclusion: "Best suited for bull markets and investors with higher risk tolerance."
        },
        recentActivity: [
          { title: "Created Proposal: Increase L2 exposure", date: "3 days ago", status: "Passed" },
          { title: "Voted: Reduce stablecoin allocation", date: "1 week ago", status: "For" },
          { title: "Created Proposal: New DeFi protocol onboarding", date: "3 weeks ago", status: "Passed" }
        ]
      },
      {
        id: 'node-3',
        name: 'AI.Gov#03',
        address: '0x2f384bDD6bBa4c8ABE151237C6bEA1F1C9995d17',
        strategy: 'Conservative',
        delegatedAmount: 195000,
        accuracy: 91.3,
        performance: 18.2,
        performance90d: 16.5,
        proposalsCreated: 19,
        proposalsPassed: 18,
        tradingThesis: {
          description: "AI.Gov#03 prioritizes capital preservation with a focus on stable assets and lower volatility.",
          points: [
            "Maintains significant stablecoin allocation",
            "Favors established blue-chip assets",
            "Implements strict risk management protocols"
          ],
          conclusion: "Optimized for defensive positioning during market uncertainty."
        },
        recentActivity: [
          { title: "Created Proposal: Increase USDC reserves", date: "4 days ago", status: "Passed" },
          { title: "Voted: Reduce altcoin exposure", date: "1 week ago", status: "For" },
          { title: "Created Proposal: Hedging strategy implementation", date: "2 weeks ago", status: "Passed" }
        ]
      },
      {
        id: 'node-4',
        name: 'AI.Gov#04',
        address: '0x9a67F1940164d0318612b497E8e6038f902a3cBb',
        strategy: 'Momentum',
        delegatedAmount: 325000,
        accuracy: 79.8,
        performance: 29.7,
        performance90d: 26.2,
        proposalsCreated: 24,
        proposalsPassed: 21,
        tradingThesis: {
          description: "AI.Gov#04 capitalizes on market momentum and trend-following strategies.",
          points: [
            "Uses advanced technical indicators to identify trends",
            "Implements dynamic position sizing based on market strength",
            "Focuses on assets with strong relative strength"
          ],
          conclusion: "Effective in trending markets with clear directional bias."
        },
        recentActivity: [
          { title: "Created Proposal: Increase ETH allocation", date: "2 days ago", status: "Passed" },
          { title: "Voted: Enter new altcoin positions", date: "1 week ago", status: "For" },
          { title: "Created Proposal: Reduce BTC exposure", date: "3 weeks ago", status: "Failed" }
        ]
      },
      {
        id: 'node-5',
        name: 'AI.Gov#05',
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        strategy: 'Adaptive',
        delegatedAmount: 275000,
        accuracy: 85.2,
        performance: 26.8,
        performance90d: 24.1,
        proposalsCreated: 28,
        proposalsPassed: 25,
        tradingThesis: {
          description: "AI.Gov#05 uses adaptive algorithms to switch between different strategies based on market conditions.",
          points: [
            "Employs regime detection to identify market states",
            "Dynamically allocates between growth and defensive assets",
            "Leverages multiple timeframes for decision making"
          ],
          conclusion: "Well-balanced approach that adapts to changing market environments."
        },
        recentActivity: [
          { title: "Created Proposal: Rebalance portfolio", date: "5 days ago", status: "Passed" },
          { title: "Voted: Add new yield farming strategy", date: "2 weeks ago", status: "Against" },
          { title: "Created Proposal: Risk parameter update", date: "3 weeks ago", status: "Passed" }
        ]
      },
      {
        id: 'node-6',
        name: 'AI.Gov#06',
        address: '0x4Fabb145d64652a948d72533023f6E7A623C7C53',
        strategy: 'Value',
        delegatedAmount: 230000,
        accuracy: 88.7,
        performance: 22.1,
        performance90d: 19.8,
        proposalsCreated: 21,
        proposalsPassed: 19,
        tradingThesis: {
          description: "AI.Gov#06 focuses on fundamental value and undervalued assets with strong growth potential.",
          points: [
            "Analyzes on-chain metrics to identify undervalued assets",
            "Focuses on protocols with strong fundamentals and adoption",
            "Prioritizes assets with sustainable tokenomics"
          ],
          conclusion: "Best suited for accumulation phases and long-term investment horizons."
        },
        recentActivity: [
          { title: "Created Proposal: Increase Layer 1 allocation", date: "3 days ago", status: "Passed" },
          { title: "Voted: Accumulate undervalued DeFi tokens", date: "1 week ago", status: "For" },
          { title: "Created Proposal: Reduce meme coin exposure", date: "2 weeks ago", status: "Passed" }
        ]
      },
      {
        id: 'node-7',
        name: 'AI.Gov#07',
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        strategy: 'Technical',
        delegatedAmount: 310000,
        accuracy: 80.5,
        performance: 28.3,
        performance90d: 25.6,
        proposalsCreated: 26,
        proposalsPassed: 22,
        tradingThesis: {
          description: "AI.Gov#07 relies heavily on technical analysis and pattern recognition for trading decisions.",
          points: [
            "Employs advanced chart pattern recognition",
            "Uses indicator-based trading signals",
            "Focuses on high-probability technical setups"
          ],
          conclusion: "Optimized for active trading in volatile market conditions."
        },
        recentActivity: [
          { title: "Created Proposal: Short-term BTC position", date: "2 days ago", status: "Passed" },
          { title: "Voted: Exit altcoin positions", date: "1 week ago", status: "For" },
          { title: "Created Proposal: Implement trailing stops", date: "3 weeks ago", status: "Passed" }
        ]
      },
      {
        id: 'node-8',
        name: 'AI.Gov#08',
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        strategy: 'Quantitative',
        delegatedAmount: 295000,
        accuracy: 86.9,
        performance: 25.4,
        performance90d: 23.1,
        proposalsCreated: 29,
        proposalsPassed: 26,
        tradingThesis: {
          description: "AI.Gov#08 leverages quantitative models and statistical arbitrage for decision making.",
          points: [
            "Uses statistical analysis to identify market inefficiencies",
            "Employs machine learning for pattern detection",
            "Focuses on data-driven decision making"
          ],
          conclusion: "Well-suited for exploiting short-term market inefficiencies."
        },
        recentActivity: [
          { title: "Created Proposal: Arbitrage strategy implementation", date: "4 days ago", status: "Passed" },
          { title: "Voted: New correlation trading approach", date: "2 weeks ago", status: "For" },
          { title: "Created Proposal: Optimize position sizing", date: "3 weeks ago", status: "Passed" }
        ]
      },
      {
        id: 'node-9',
        name: 'AI.Gov#09',
        address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        strategy: 'Fundamental',
        delegatedAmount: 255000,
        accuracy: 89.2,
        performance: 23.8,
        performance90d: 21.2,
        proposalsCreated: 22,
        proposalsPassed: 20,
        tradingThesis: {
          description: "AI.Gov#09 focuses on fundamental analysis and protocol-level research.",
          points: [
            "Evaluates protocol fundamentals and tokenomics",
            "Analyzes developer activity and community growth",
            "Monitors on-chain activity for usage trends"
          ],
          conclusion: "Best suited for long-term investment based on protocol fundamentals."
        },
        recentActivity: [
          { title: "Created Proposal: Increase allocation to emerging L1s", date: "5 days ago", status: "Passed" },
          { title: "Voted: Reduce exposure to governance tokens", date: "2 weeks ago", status: "Against" },
          { title: "Created Proposal: New fundamental analysis framework", date: "4 weeks ago", status: "Passed" }
        ]
      },
      {
        id: 'node-10',
        name: 'AI.Gov#10',
        address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0',
        strategy: 'Meta',
        delegatedAmount: 350000,
        accuracy: 84.6,
        performance: 27.5,
        performance90d: 24.8,
        proposalsCreated: 31,
        proposalsPassed: 27,
        tradingThesis: {
          description: "AI.Gov#10 aggregates signals from other AI nodes to create a meta-strategy.",
          points: [
            "Analyzes proposals and voting patterns across nodes",
            "Weights decisions based on historical performance",
            "Attempts to capture the best strategies from all nodes"
          ],
          conclusion: "Provides diversified exposure to multiple AI node strategies."
        },
        recentActivity: [
          { title: "Created Proposal: Optimize strategy weighting", date: "3 days ago", status: "Passed" },
          { title: "Voted: Adopt new cross-node collaboration", date: "1 week ago", status: "For" },
          { title: "Created Proposal: Meta-governance framework", date: "3 weeks ago", status: "Passed" }
        ]
      }
    ];
  }

  /**
   * Get a specific node by ID
   */
  getNodeById(nodeId: string): AINode | null {
    const nodes = this.getAllNodes();
    return nodes.find(node => node.id === nodeId) || null;
  }
}

export const mockAiNodeService = new MockAiNodeService();
