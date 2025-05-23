import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { UnifiedProposalList } from '../UnifiedProposalList';
import { useUnifiedAssetDaoContract } from '@/hooks/unified/useUnifiedAssetDaoContract';
import { ProposalState, ProposalType } from '@/services/enhanced-assetDaoService';

// Mock the useUnifiedAssetDaoContract hook
jest.mock('@/hooks/unified/useUnifiedAssetDaoContract', () => ({
  useUnifiedAssetDaoContract: jest.fn(),
}));

// Create mock proposals
const mockProposals = [
  {
    id: 1,
    title: 'Treasury diversification with USDC',
    description: 'This proposal aims to diversify the DAO treasury by allocating 25% to USDC stablecoin to reduce volatility exposure.',
    proposer: '0x1234567890123456789012345678901234567890',
    amount: 50000,
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
  },
  {
    id: 2,
    title: 'Fund DeFi development grant',
    description: 'This proposal requests funding for a developer grant to build DeFi tools that will integrate with our platform.',
    proposer: '0x2345678901234567890123456789012345678901',
    amount: 25000,
    token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    type: ProposalType.Grant,
    state: ProposalState.Succeeded,
    createdAt: new Date(Date.now() - 86400000 * 10), // 10 days ago
    votingEnds: new Date(Date.now() - 86400000 * 3), // 3 days ago
    yesVotes: 200,
    noVotes: 50,
    abstainVotes: 15,
    executed: false,
    canceled: false
  },
  {
    id: 3,
    title: 'Reduce voting threshold to 3%',
    description: 'This proposal suggests reducing the voting threshold from 5% to 3% to increase governance participation.',
    proposer: '0x3456789012345678901234567890123456789012',
    amount: 0,
    token: null,
    type: ProposalType.ParameterChange,
    state: ProposalState.Defeated,
    createdAt: new Date(Date.now() - 86400000 * 15), // 15 days ago
    votingEnds: new Date(Date.now() - 86400000 * 8), // 8 days ago
    yesVotes: 80,
    noVotes: 150,
    abstainVotes: 20,
    executed: false,
    canceled: false
  },
  {
    id: 4,
    title: 'Invest in ETH staking pool',
    description: 'This proposal suggests investing 100 ETH in a staking pool to generate additional revenue for the DAO.',
    proposer: '0x4567890123456789012345678901234567890123',
    amount: 100000000000000000000, // 100 ETH
    token: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
    type: ProposalType.Investment,
    state: ProposalState.Executed,
    createdAt: new Date(Date.now() - 86400000 * 20), // 20 days ago
    votingEnds: new Date(Date.now() - 86400000 * 13), // 13 days ago
    yesVotes: 250,
    noVotes: 40,
    abstainVotes: 5,
    executed: true,
    canceled: false
  }
];

export default {
  title: 'Components/Unified/UnifiedProposalList',
  component: UnifiedProposalList,
  parameters: {
    // Optional parameter to center the component
    layout: 'centered',
    // Display a table with the component's props
    controls: { expanded: true },
  },
  // Define controls for component props
  argTypes: {
    implementation: {
      control: 'radio',
      options: ['ethers', 'wagmi'],
      description: 'The Web3 implementation to use'
    },
    totalCount: {
      control: 'number',
      description: 'Total number of proposals'
    },
    onLoad: { action: 'onLoad' },
    onActionComplete: { action: 'onActionComplete' }
  },
} as ComponentMeta<typeof UnifiedProposalList>;

// Create a template for the component
const Template: ComponentStory<typeof UnifiedProposalList> = (args) => {
  // Mock the implementation based on the story controls
  (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
    getProposals: jest.fn().mockResolvedValue(mockProposals),
    voteOnProposal: jest.fn().mockResolvedValue('0xtxhash'),
    executeProposal: jest.fn().mockResolvedValue('0xtxhash'),
    implementation: args.implementation || 'ethers',
    telemetry: { responseTime: args.implementation === 'wagmi' ? 120 : 150 }
  });
  
  return <UnifiedProposalList {...args} />;
};

// Default story
export const Default = Template.bind({});
Default.args = {
  implementation: 'ethers',
  totalCount: mockProposals.length
};

// Wagmi implementation story
export const WagmiImplementation = Template.bind({});
WagmiImplementation.args = {
  implementation: 'wagmi',
  totalCount: mockProposals.length
};

// Empty state story
export const EmptyState = Template.bind({});
EmptyState.args = {
  implementation: 'ethers',
  totalCount: 0
};
EmptyState.decorators = [
  (Story) => {
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      getProposals: jest.fn().mockResolvedValue([]),
      voteOnProposal: jest.fn().mockResolvedValue('0xtxhash'),
      executeProposal: jest.fn().mockResolvedValue('0xtxhash'),
      implementation: 'ethers',
      telemetry: { responseTime: 150 }
    });
    
    return <Story />;
  }
];

// Loading state story
export const LoadingState = Template.bind({});
LoadingState.args = {
  implementation: 'ethers'
};
LoadingState.decorators = [
  (Story) => {
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      getProposals: jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockProposals), 10000))),
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
  implementation: 'ethers'
};
ErrorState.decorators = [
  (Story) => {
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      getProposals: jest.fn().mockRejectedValue(new Error('Failed to fetch proposals')),
      voteOnProposal: jest.fn().mockResolvedValue('0xtxhash'),
      executeProposal: jest.fn().mockResolvedValue('0xtxhash'),
      implementation: 'ethers',
      telemetry: { responseTime: 150 }
    });
    
    return <Story />;
  }
];
