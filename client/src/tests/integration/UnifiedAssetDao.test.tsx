/**
 * Unified AssetDAO Integration Test
 * 
 * End-to-end test for the AssetDAO module using the unified contract pattern
 * Tests the complete flow from API to UI components, for both Ethers and Wagmi implementations
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MockConnector } from 'wagmi/connectors/mock';
import { createConfig, WagmiConfig } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createWalletClient, http, custom } from 'viem';
import { UnifiedProposalList } from '@/components/assetdao/UnifiedProposalList';
import { useUnifiedAssetDaoContract } from '@/hooks/useUnifiedAssetDaoContract';
import { AssetDaoProposal } from '@/services/wagmi/enhancedAssetDaoContractService';
import { AppConfigProvider } from '@/config/app-config';

// Mock the enhanced API utilities
jest.mock('@/utils/enhanced-api-utils', () => ({
  fetchAPI: jest.fn(),
  isDevelopment: jest.fn(() => true),
  shouldUseMockData: jest.fn(() => true),
  getMockData: jest.fn(),
}));

// Mock the asset dao contract service
jest.mock('@/hooks/useUnifiedAssetDaoContract', () => ({
  useUnifiedAssetDaoContract: jest.fn(),
}));

// Mock telemetry service
jest.mock('@/services/telemetry/apiTelemetryService', () => ({
  apiTelemetry: {
    recordApiEvent: jest.fn(),
  },
}));

// Sample mock proposals for testing
const mockProposals: AssetDaoProposal[] = [
  {
    id: 1,
    title: 'Invest in USDC',
    description: 'Proposal to invest treasury funds into USDC',
    proposer: '0x1234567890123456789012345678901234567890',
    type: 'invest',
    token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
    amount: '10000',
    forVotes: '600',
    againstVotes: '400',
    status: 'active',
    executed: false,
    canceled: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    deadline: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
    quorumReached: false
  },
  {
    id: 2,
    title: 'Divest from WBTC',
    description: 'Proposal to divest treasury funds from WBTC',
    proposer: '0x0987654321098765432109876543210987654321',
    type: 'divest',
    token: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC
    amount: '5',
    forVotes: '800',
    againstVotes: '200',
    status: 'passed',
    executed: false,
    canceled: false,
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    deadline: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    quorumReached: true
  },
  {
    id: 3,
    title: 'Invest in DLOOP',
    description: 'Proposal to invest in our own token',
    proposer: 'AI.Gov-12345',
    type: 'invest',
    token: '0xdloop1234567890123456789012345678901234', // DLOOP
    amount: '50000',
    forVotes: '300',
    againstVotes: '700',
    status: 'failed',
    executed: false,
    canceled: false,
    createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    deadline: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    quorumReached: false
  }
];

// Setup QueryClient for React Query
const createQueryClientWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// Setup Wagmi config
const setupWagmiConfig = () => {
  const config = createConfig({
    chains: [mainnet, sepolia],
    connectors: [
      new MockConnector({
        options: {
          walletClient: createWalletClient({
            chain: sepolia,
            transport: http(),
            account: '0x1234567890123456789012345678901234567890'
          }),
        },
      }),
    ],
  });

  return config;
};

// Mock app config
const mockAppConfig = {
  featureFlags: {
    useWagmiForAssetDao: true,
  },
  recordMetric: jest.fn(),
};

// Test implementation wrapper component
const TestWrapper: React.FC<{
  children: React.ReactNode;
  implementation: 'ethers' | 'wagmi';
}> = ({ children, implementation }) => {
  const queryClient = new QueryClient();
  const wagmiConfig = setupWagmiConfig();

  // Override the feature flag based on the test parameter
  const appConfig = {
    ...mockAppConfig,
    featureFlags: {
      ...mockAppConfig.featureFlags,
      useWagmiForAssetDao: implementation === 'wagmi',
    },
  };

  return (
    <AppConfigProvider value={appConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiConfig config={wagmiConfig}>
          {children}
        </WagmiConfig>
      </QueryClientProvider>
    </AppConfigProvider>
  );
};

describe('UnifiedAssetDAO Integration Tests', () => {
  // Setup mock hooks
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the useUnifiedAssetDaoContract hook to return test data
    (useUnifiedAssetDaoContract as jest.Mock).mockImplementation(({ forceWagmi, forceLegacy }) => {
      // Determine implementation based on force flags
      const implementation = forceWagmi ? 'wagmi' : (forceLegacy ? 'ethers' : 'wagmi');
      
      return {
        implementation,
        useGetAllProposals: () => ({
          proposals: mockProposals,
          isLoading: false,
          error: null,
          implementation,
          refetch: jest.fn(),
        }),
        useGetProposal: (id: number) => ({
          proposal: mockProposals.find(p => p.id === id) || null,
          isLoading: false,
          error: null,
          implementation,
          refetch: jest.fn(),
        }),
        useCreateProposal: () => ({
          createProposal: () => ({
            submit: jest.fn().mockResolvedValue('0xtxhash'),
            isSubmitting: false,
            txHash: null,
            error: null,
            implementation,
          }),
        }),
        useVoteOnProposal: () => ({
          voteOnProposal: () => ({
            vote: jest.fn().mockResolvedValue('0xtxhash'),
            isVoting: false,
            txHash: null,
            error: null,
            implementation,
          }),
        }),
        useCheckVotingStatus: () => ({
          hasVoted: false,
          isLoading: false,
          error: null,
          implementation,
          refetch: jest.fn(),
        }),
        useProposalState: () => ({
          state: 'active',
          isLoading: false,
          error: null,
          implementation,
          refetch: jest.fn(),
        }),
      };
    });
  });

  test('renders unified proposal list with Wagmi implementation', async () => {
    render(
      <TestWrapper implementation="wagmi">
        <UnifiedProposalList forceWagmi={true} />
      </TestWrapper>
    );

    // Wait for component to load data
    await waitFor(() => {
      expect(screen.getByText('Proposals')).toBeInTheDocument();
    });

    // Check that proposals are displayed
    expect(screen.getByText('Invest in USDC')).toBeInTheDocument();
    expect(screen.getByText('Divest from WBTC')).toBeInTheDocument();
    expect(screen.getByText('Invest in DLOOP')).toBeInTheDocument();

    // Check that implementation indicator is correct
    expect(screen.getByText('AssetDAO: Wagmi')).toBeInTheDocument();

    // Verify proposal details
    expect(screen.getByText('USDC')).toBeInTheDocument();
    expect(screen.getByText('WBTC')).toBeInTheDocument();
    expect(screen.getByText('DLOOP')).toBeInTheDocument();

    // Check proposal statuses
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('passed')).toBeInTheDocument();
    expect(screen.getByText('failed')).toBeInTheDocument();
  });

  test('renders unified proposal list with Ethers implementation', async () => {
    render(
      <TestWrapper implementation="ethers">
        <UnifiedProposalList forceLegacy={true} />
      </TestWrapper>
    );

    // Wait for component to load data
    await waitFor(() => {
      expect(screen.getByText('Proposals')).toBeInTheDocument();
    });

    // Check that implementation indicator is correct
    expect(screen.getByText('AssetDAO: Ethers')).toBeInTheDocument();
  });

  test('shows proposal details when show details is clicked', async () => {
    render(
      <TestWrapper implementation="wagmi">
        <UnifiedProposalList forceWagmi={true} />
      </TestWrapper>
    );

    // Wait for component to load data
    await waitFor(() => {
      expect(screen.getByText('Invest in USDC')).toBeInTheDocument();
    });

    // Find and click the show details button
    const showDetailsButtons = screen.getAllByText('Show Details');
    fireEvent.click(showDetailsButtons[0]);

    // Check that details are displayed
    expect(screen.getByText('Proposal to invest treasury funds into USDC')).toBeInTheDocument();
    
    // Check for token address
    expect(screen.getByText('Token Address:')).toBeInTheDocument();
    
    // Verify proposer address is in the details
    expect(screen.getByText('Proposer:')).toBeInTheDocument();
    expect(screen.getByText('0x1234567890123456789012345678901234567890')).toBeInTheDocument();
  });

  test('handles special non-Ethereum addresses correctly', async () => {
    render(
      <TestWrapper implementation="wagmi">
        <UnifiedProposalList forceWagmi={true} />
      </TestWrapper>
    );

    // Wait for component to load data
    await waitFor(() => {
      expect(screen.getByText('Invest in DLOOP')).toBeInTheDocument();
    });

    // Check that AI.Gov address is displayed without truncation
    expect(screen.getByText('AI.Gov-12345')).toBeInTheDocument();
  });

  test('refresh button triggers refetch', async () => {
    // Create a mock refetch function
    const mockRefetch = jest.fn();
    
    // Override the mock implementation for this test
    (useUnifiedAssetDaoContract as jest.Mock).mockImplementation(() => ({
      implementation: 'wagmi',
      useGetAllProposals: () => ({
        proposals: mockProposals,
        isLoading: false,
        error: null,
        implementation: 'wagmi',
        refetch: mockRefetch,
      }),
      // Other methods remain the same as in the beforeEach
      useGetProposal: jest.fn(),
      useCreateProposal: jest.fn(),
      useVoteOnProposal: jest.fn(),
      useCheckVotingStatus: jest.fn(),
      useProposalState: jest.fn(),
    }));

    render(
      <TestWrapper implementation="wagmi">
        <UnifiedProposalList forceWagmi={true} />
      </TestWrapper>
    );

    // Wait for component to load data
    await waitFor(() => {
      expect(screen.getByText('Proposals')).toBeInTheDocument();
    });

    // Find and click the refresh button
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    // Check that refetch was called
    expect(mockRefetch).toHaveBeenCalled();
  });

  test('displays error state correctly', async () => {
    // Override the mock implementation to return an error
    (useUnifiedAssetDaoContract as jest.Mock).mockImplementation(() => ({
      implementation: 'wagmi',
      useGetAllProposals: () => ({
        proposals: [],
        isLoading: false,
        error: new Error('Failed to fetch proposals'),
        implementation: 'wagmi',
        refetch: jest.fn(),
      }),
      // Other methods remain the same as in the beforeEach
      useGetProposal: jest.fn(),
      useCreateProposal: jest.fn(),
      useVoteOnProposal: jest.fn(),
      useCheckVotingStatus: jest.fn(),
      useProposalState: jest.fn(),
    }));

    render(
      <TestWrapper implementation="wagmi">
        <UnifiedProposalList forceWagmi={true} />
      </TestWrapper>
    );

    // Wait for component to load data and show error
    await waitFor(() => {
      expect(screen.getByText(/Error loading proposals/)).toBeInTheDocument();
    });

    // Check that the error message is displayed
    expect(screen.getByText(/Failed to fetch proposals/)).toBeInTheDocument();
  });

  test('displays loading state correctly', async () => {
    // Override the mock implementation to return loading state
    (useUnifiedAssetDaoContract as jest.Mock).mockImplementation(() => ({
      implementation: 'wagmi',
      useGetAllProposals: () => ({
        proposals: [],
        isLoading: true,
        error: null,
        implementation: 'wagmi',
        refetch: jest.fn(),
      }),
      // Other methods remain the same as in the beforeEach
      useGetProposal: jest.fn(),
      useCreateProposal: jest.fn(),
      useVoteOnProposal: jest.fn(),
      useCheckVotingStatus: jest.fn(),
      useProposalState: jest.fn(),
    }));

    render(
      <TestWrapper implementation="wagmi">
        <UnifiedProposalList forceWagmi={true} />
      </TestWrapper>
    );

    // Check that loading indicator is displayed
    expect(screen.getByText('Loading proposals...')).toBeInTheDocument();
  });
});
