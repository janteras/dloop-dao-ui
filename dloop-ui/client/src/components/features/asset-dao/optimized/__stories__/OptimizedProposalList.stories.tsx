import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { OptimizedProposalList } from '../OptimizedProposalList';
import { useProposalsQuery, useProposalVoteMutation, useProposalExecuteMutation } from '@/hooks/query/useAssetDaoQueries';
import { ProposalState, ProposalType } from '@/services/enhanced-assetDaoService';
import { QueryClient, QueryClientProvider } from 'react-query';

// Mock the React Query hooks
jest.mock('@/hooks/query/useAssetDaoQueries', () => ({
  useProposalsQuery: jest.fn(),
  useProposalVoteMutation: jest.fn(),
  useProposalExecuteMutation: jest.fn(),
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

// Create a fresh QueryClient for each story
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: Infinity,
    },
  },
});

export default {
  title: 'Components/Optimized/OptimizedProposalList',
  component: OptimizedProposalList,
  parameters: {
    layout: 'padded',
    controls: { expanded: true },
    docs: {
      description: {
        component: 'Optimized proposal list component using React Query for improved performance and caching.'
      }
    }
  },
  argTypes: {
    implementation: {
      control: 'radio',
      options: ['ethers', 'wagmi'],
      description: 'The Web3 implementation to use'
    },
    paginationOptions: {
      control: 'object',
      description: 'Options for pagination'
    },
    filters: {
      control: 'object',
      description: 'Filters to apply to the proposal list'
    },
    onLoad: { action: 'onLoad' },
    onActionComplete: { action: 'onActionComplete' }
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      
      return (
        <QueryClientProvider client={queryClient}>
          <div className="p-4 max-w-4xl mx-auto">
            <Story />
          </div>
        </QueryClientProvider>
      );
    }
  ]
} as ComponentMeta<typeof OptimizedProposalList>;

// Create a template for the component
const Template: ComponentStory<typeof OptimizedProposalList> = (args) => {
  // Mock the implementation based on the story controls
  (useProposalsQuery as jest.Mock).mockReturnValue({
    data: args.isLoading ? undefined : args.isError ? undefined : args.isEmpty ? [] : mockProposals,
    isLoading: args.isLoading || false,
    isError: args.isError || false,
    error: args.isError ? new Error('Failed to fetch proposals') : null,
    refetch: jest.fn(),
  });
  
  (useProposalVoteMutation as jest.Mock).mockReturnValue({
    mutateAsync: jest.fn().mockResolvedValue({ proposalId: 1, tx: '0xtxhash' }),
    isLoading: false,
  });
  
  (useProposalExecuteMutation as jest.Mock).mockReturnValue({
    mutateAsync: jest.fn().mockResolvedValue({ proposalId: 2, tx: '0xtxhash' }),
    isLoading: false,
  });
  
  return <OptimizedProposalList {...args} />;
};

// Default story
export const Default = Template.bind({});
Default.args = {
  implementation: 'ethers',
  paginationOptions: { limit: 10, offset: 0 },
  filters: {}
};

// Wagmi implementation story
export const WagmiImplementation = Template.bind({});
WagmiImplementation.args = {
  implementation: 'wagmi',
  paginationOptions: { limit: 10, offset: 0 },
  filters: {}
};

// With filters story
export const WithFilters = Template.bind({});
WithFilters.args = {
  implementation: 'ethers',
  paginationOptions: { limit: 10, offset: 0 },
  filters: {
    states: [ProposalState.Active, ProposalState.Succeeded],
    types: [ProposalType.Investment]
  }
};

// Empty state story
export const EmptyState = Template.bind({});
EmptyState.args = {
  implementation: 'ethers',
  isEmpty: true
};

// Loading state story
export const LoadingState = Template.bind({});
LoadingState.args = {
  implementation: 'ethers',
  isLoading: true
};

// Error state story
export const ErrorState = Template.bind({});
ErrorState.args = {
  implementation: 'ethers',
  isError: true
};

// Voting in progress story
export const VotingInProgress = Template.bind({});
VotingInProgress.args = {
  implementation: 'ethers'
};
VotingInProgress.decorators = [
  (Story) => {
    (useProposalsQuery as jest.Mock).mockReturnValue({
      data: mockProposals,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    
    (useProposalVoteMutation as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ proposalId: 1, tx: '0xtxhash' }), 5000))),
      isLoading: true,
    });
    
    return <Story />;
  }
];
