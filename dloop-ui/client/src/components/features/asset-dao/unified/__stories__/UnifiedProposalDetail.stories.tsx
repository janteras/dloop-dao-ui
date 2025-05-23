import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { UnifiedProposalDetail } from '../UnifiedProposalDetail';
import { useUnifiedAssetDaoContract } from '@/hooks/unified/useUnifiedAssetDaoContract';
import { ProposalState, ProposalType } from '@/services/enhanced-assetDaoService';
import { TokenSymbolResolver } from '@/services/tokenSymbolResolver';

// Mock the hooks and services
jest.mock('@/hooks/unified/useUnifiedAssetDaoContract', () => ({
  useUnifiedAssetDaoContract: jest.fn(),
}));

jest.mock('@/services/tokenSymbolResolver', () => ({
  TokenSymbolResolver: {
    getTokenSymbol: jest.fn().mockResolvedValue('USDC'),
    getTokenDecimals: jest.fn().mockResolvedValue(6)
  }
}));

// Create mock proposal
const mockProposal = {
  id: 1,
  title: 'Treasury diversification with USDC',
  description: 'This proposal aims to diversify the DAO treasury by allocating 25% to USDC stablecoin to reduce volatility exposure.\n\nRationale:\n- Stablecoins provide a hedge against market volatility\n- USDC is a regulated stablecoin with high liquidity\n- This allocation maintains sufficient ETH exposure while reducing overall portfolio risk\n\nImplementation:\n1. Convert 25% of ETH holdings to USDC\n2. Distribute purchases over 2 weeks to minimize slippage\n3. Hold USDC in the treasury multisig wallet',
  proposer: '0x1234567890123456789012345678901234567890',
  amount: 50000000000, // 50,000 USDC with 6 decimals
  token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
  type: ProposalType.Investment,
  state: ProposalState.Active,
  createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
  votingEnds: new Date(Date.now() + 86400000 * 5), // 5 days from now
  yesVotes: 120,
  noVotes: 30,
  abstainVotes: 10,
  executed: false,
  canceled: false
};

// Succeeded proposal
const succeededProposal = {
  ...mockProposal,
  id: 2,
  title: 'Fund DeFi development grant',
  state: ProposalState.Succeeded,
  createdAt: new Date(Date.now() - 86400000 * 10), // 10 days ago
  votingEnds: new Date(Date.now() - 86400000 * 3), // 3 days ago
  yesVotes: 200,
  noVotes: 50,
  abstainVotes: 15,
};

// Executed proposal
const executedProposal = {
  ...mockProposal,
  id: 3,
  title: 'Invest in ETH staking pool',
  state: ProposalState.Executed,
  createdAt: new Date(Date.now() - 86400000 * 20), // 20 days ago
  votingEnds: new Date(Date.now() - 86400000 * 13), // 13 days ago
  executed: true,
  executedAt: new Date(Date.now() - 86400000 * 12), // 12 days ago
};

export default {
  title: 'Components/Unified/UnifiedProposalDetail',
  component: UnifiedProposalDetail,
  parameters: {
    layout: 'padded',
    controls: { expanded: true },
  },
  argTypes: {
    proposalId: {
      control: 'number',
      description: 'ID of the proposal to display'
    },
    implementation: {
      control: 'radio',
      options: ['ethers', 'wagmi'],
      description: 'The Web3 implementation to use'
    },
    showVotingHistory: {
      control: 'boolean',
      description: 'Whether to show voting history'
    },
    showTelemetry: {
      control: 'boolean',
      description: 'Whether to show telemetry information'
    },
    onVote: { action: 'onVote' },
    onExecute: { action: 'onExecute' }
  },
} as ComponentMeta<typeof UnifiedProposalDetail>;

// Create a template for the component
const Template: ComponentStory<typeof UnifiedProposalDetail> = (args) => {
  // Mock the implementation based on the story controls
  (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
    getProposal: jest.fn().mockResolvedValue(
      args.proposalId === 2 ? succeededProposal : 
      args.proposalId === 3 ? executedProposal : 
      mockProposal
    ),
    hasVoted: jest.fn().mockResolvedValue(false),
    voteOnProposal: jest.fn().mockResolvedValue('0xtxhash'),
    executeProposal: jest.fn().mockResolvedValue('0xtxhash'),
    implementation: args.implementation || 'ethers',
    telemetry: { 
      responseTime: args.implementation === 'wagmi' ? 120 : 150,
      gasUsed: 85000,
      blockNumber: 15481234
    }
  });
  
  return <UnifiedProposalDetail {...args} />;
};

// Default story - Active proposal
export const ActiveProposal = Template.bind({});
ActiveProposal.args = {
  proposalId: 1,
  implementation: 'ethers',
  showVotingHistory: false,
  showTelemetry: false
};

// Succeeded proposal story
export const SucceededProposal = Template.bind({});
SucceededProposal.args = {
  proposalId: 2,
  implementation: 'ethers',
  showVotingHistory: false,
  showTelemetry: false
};

// Executed proposal story
export const ExecutedProposal = Template.bind({});
ExecutedProposal.args = {
  proposalId: 3,
  implementation: 'ethers',
  showVotingHistory: true,
  showTelemetry: false
};

// Wagmi implementation story
export const WagmiImplementation = Template.bind({});
WagmiImplementation.args = {
  proposalId: 1,
  implementation: 'wagmi',
  showVotingHistory: false,
  showTelemetry: true
};

// Loading state story
export const LoadingState = Template.bind({});
LoadingState.args = {
  proposalId: 1,
  implementation: 'ethers'
};
LoadingState.decorators = [
  (Story) => {
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      getProposal: jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockProposal), 10000))),
      hasVoted: jest.fn().mockResolvedValue(false),
      voteOnProposal: jest.fn().mockResolvedValue('0xtxhash'),
      executeProposal: jest.fn().mockResolvedValue('0xtxhash'),
      implementation: 'ethers',
      telemetry: { responseTime: 150 }
    });
    
    return <Story />;
  }
];

// Error state story
export const ErrorState = Template.bind({});
ErrorState.args = {
  proposalId: 999, // Non-existent proposal
  implementation: 'ethers'
};
ErrorState.decorators = [
  (Story) => {
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      getProposal: jest.fn().mockRejectedValue(new Error('Failed to fetch proposal')),
      hasVoted: jest.fn().mockResolvedValue(false),
      voteOnProposal: jest.fn().mockResolvedValue('0xtxhash'),
      executeProposal: jest.fn().mockResolvedValue('0xtxhash'),
      implementation: 'ethers',
      telemetry: { responseTime: 150 }
    });
    
    return <Story />;
  }
];

// User has voted story
export const UserHasVoted = Template.bind({});
UserHasVoted.args = {
  proposalId: 1,
  implementation: 'ethers'
};
UserHasVoted.decorators = [
  (Story) => {
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      getProposal: jest.fn().mockResolvedValue(mockProposal),
      hasVoted: jest.fn().mockResolvedValue(true),
      voteOnProposal: jest.fn().mockResolvedValue('0xtxhash'),
      executeProposal: jest.fn().mockResolvedValue('0xtxhash'),
      implementation: 'ethers',
      telemetry: { responseTime: 150 }
    });
    
    return <Story />;
  }
];
