import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { useProposals } from '@/hooks/useProposals';
import { AssetDAOService } from '@/services/assetDaoService';
import { ProposalType } from '@/types';

// Create wrapper with QueryClientProvider
const createWrapper = () => {
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

// Mock dependencies
jest.mock('@/hooks/useWallet', () => ({
  useWallet: jest.fn(() => ({
    isConnected: true,
    signer: {
      getAddress: jest.fn().mockResolvedValue('0x1234567890abcdef1234567890abcdef12345678'),
    },
  })),
}));

jest.mock('@/contexts/EthersContext', () => ({
  useEthers: jest.fn(() => ({
    provider: new ethers.JsonRpcProvider(),
    signer: {
      getAddress: jest.fn().mockResolvedValue('0x1234567890abcdef1234567890abcdef12345678'),
    },
  })),
}));

jest.mock('@/hooks/useToast', () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn(),
  })),
}));

jest.mock('@/services/assetDaoService', () => ({
  AssetDAOService: {
    getAllProposals: jest.fn(),
    createProposal: jest.fn(),
    voteOnProposal: jest.fn(),
    executeProposal: jest.fn(),
  },
  ProposalState: {
    Pending: 0,
    Active: 1,
    Defeated: 2,
    Succeeded: 3,
    Queued: 4,
    Executed: 5,
    Expired: 6,
  },
  ProposalType: {
    Investment: 0,
    Divestment: 1,
    ParameterChange: 2,
    Other: 3,
  },
}));

jest.mock('@/lib/contracts', () => ({
  getContract: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
  })),
}));

describe('useProposals Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches proposals successfully', async () => {
    // Setup mock proposal data
    const mockProposals = [
      {
        id: 1,
        type: 0, // Investment
        assetAddress: '0x1234567890abcdef1234567890abcdef12345678',
        amount: ethers.parseEther('1000'),
        description: 'Test Proposal',
        proposer: '0x1234567890abcdef1234567890abcdef12345678',
        createdAt: new Date(),
        votingEnds: new Date(Date.now() + 86400000),
        forVotes: ethers.parseEther('600'),
        againstVotes: ethers.parseEther('400'),
        state: 1, // Active
        executed: false,
        token: 'USDC',
      },
    ];

    // Mock the service method
    (AssetDAOService.getAllProposals as jest.Mock).mockResolvedValue(mockProposals);

    // Render the hook
    const { result, waitFor } = renderHook(() => useProposals(), {
      wrapper: createWrapper(),
    });

    // Wait for the hook to fetch data
    await waitFor(() => {
      return result.current.proposals !== undefined;
    });

    // Check that the proposals were fetched correctly
    expect(AssetDAOService.getAllProposals).toHaveBeenCalled();
    expect(result.current.proposals).toHaveLength(1);
    expect(result.current.proposals?.[0].id).toBe(1);
    expect(result.current.proposals?.[0].type).toBe('invest');
  });

  it('creates a proposal successfully', async () => {
    // Mock the service method to return a transaction hash
    (AssetDAOService.createProposal as jest.Mock).mockResolvedValue({
      hash: '0x123456789abcdef',
      wait: jest.fn().mockResolvedValue({}),
    });

    // Render the hook
    const { result, waitFor } = renderHook(() => useProposals(), {
      wrapper: createWrapper(),
    });

    // Create a proposal
    let success = false;
    await act(async () => {
      success = await result.current.createProposal({
        type: 'invest' as ProposalType,
        assetAddress: '0x1234567890abcdef1234567890abcdef12345678',
        amount: '1000',
        description: 'Test Proposal',
      });
    });

    // Check that the proposal was created successfully
    expect(success).toBe(true);
    expect(AssetDAOService.createProposal).toHaveBeenCalledWith(
      expect.anything(),
      0, // Investment type
      '0x1234567890abcdef1234567890abcdef12345678',
      expect.anything(),
      'Test Proposal'
    );
  });

  it('handles voting on a proposal', async () => {
    // Mock the service method to return a transaction hash
    (AssetDAOService.voteOnProposal as jest.Mock).mockResolvedValue({
      hash: '0x123456789abcdef',
      wait: jest.fn().mockResolvedValue({}),
    });

    // Render the hook
    const { result, waitFor } = renderHook(() => useProposals(), {
      wrapper: createWrapper(),
    });

    // Vote on a proposal
    let success = false;
    await act(async () => {
      success = await result.current.voteOnProposal(1, true);
    });

    // Check that the vote was cast successfully
    expect(success).toBe(true);
    expect(AssetDAOService.voteOnProposal).toHaveBeenCalledWith(
      expect.anything(),
      1,
      true
    );
  });

  it('handles executing a proposal', async () => {
    // Mock the service method to return a transaction hash
    (AssetDAOService.executeProposal as jest.Mock).mockResolvedValue({
      hash: '0x123456789abcdef',
      wait: jest.fn().mockResolvedValue({}),
    });

    // Render the hook
    const { result, waitFor } = renderHook(() => useProposals(), {
      wrapper: createWrapper(),
    });

    // Execute a proposal
    let success = false;
    await act(async () => {
      success = await result.current.executeProposal(1);
    });

    // Check that the proposal was executed successfully
    expect(success).toBe(true);
    expect(AssetDAOService.executeProposal).toHaveBeenCalledWith(
      expect.anything(),
      1
    );
  });

  it('handles errors gracefully', async () => {
    // Mock the service method to throw an error
    (AssetDAOService.getAllProposals as jest.Mock).mockRejectedValue(
      new Error('Failed to fetch proposals')
    );

    // Render the hook
    const { result, waitFor } = renderHook(() => useProposals(), {
      wrapper: createWrapper(),
    });

    // Wait for the hook to attempt to fetch data
    await waitFor(() => {
      return result.current.error !== undefined;
    });

    // Check that the error was handled gracefully
    expect(result.current.proposals).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });
});
