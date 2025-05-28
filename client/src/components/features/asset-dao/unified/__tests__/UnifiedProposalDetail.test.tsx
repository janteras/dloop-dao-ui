/**
 * Unit tests for the UnifiedProposalDetail component
 * 
 * Tests both Ethers and Wagmi implementations to ensure consistent behavior
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { UnifiedProposalDetail } from '../UnifiedProposalDetail';
import { useUnifiedAssetDaoContract } from '@/hooks/unified/useUnifiedAssetDaoContract';
import { useUnifiedWallet } from '@/hooks/unified';
import { ProposalState, ProposalType } from '@/services/enhanced-assetDaoService';
import { TokenSymbolResolver } from '@/services/tokenSymbolResolver';

// Mock the hooks
jest.mock('@/hooks/unified/useUnifiedAssetDaoContract', () => ({
  useUnifiedAssetDaoContract: jest.fn()
}));

jest.mock('@/hooks/unified', () => ({
  useUnifiedWallet: jest.fn()
}));

// Mock the token symbol resolver
jest.mock('@/services/tokenSymbolResolver', () => ({
  TokenSymbolResolver: {
    getTokenSymbol: jest.fn().mockResolvedValue('USDC'),
    getTokenDecimals: jest.fn().mockResolvedValue(6)
  }
}));

// Mock child components to simplify testing
jest.mock('../UnifiedProposalVoting', () => ({
  UnifiedProposalVoting: ({ proposalId, onVote }) => (
    <div data-testid="unified-proposal-voting">
      <button onClick={() => onVote(proposalId, true)}>Mock Vote Yes</button>
    </div>
  )
}));

jest.mock('../UnifiedProposalExecution', () => ({
  UnifiedProposalExecution: ({ proposalId, onExecute }) => (
    <div data-testid="unified-proposal-execution">
      <button onClick={() => onExecute(proposalId)}>Mock Execute</button>
    </div>
  )
}));

describe('UnifiedProposalDetail Component', () => {
  // Mock proposal data
  const mockProposal = {
    id: 1,
    title: 'Test Proposal',
    description: 'This is a test proposal with detailed information about what the proposal aims to achieve.',
    proposer: '0x1234567890123456789012345678901234567890',
    amount: 1000000,
    token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    type: ProposalType.Investment,
    state: ProposalState.Active,
    createdAt: new Date('2025-05-01T10:00:00Z'),
    votingEnds: new Date('2025-05-08T10:00:00Z'),
    yesVotes: 100,
    noVotes: 50,
    abstainVotes: 10,
    executed: false,
    canceled: false
  };

  // Setup default mocks
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the wallet hook
    (useUnifiedWallet as jest.Mock).mockReturnValue({
      isConnected: true,
      address: '0x1234567890123456789012345678901234567890'
    });
    
    // Mock the contract hook with default implementation
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      getProposal: jest.fn().mockResolvedValue(mockProposal),
      voteOnProposal: jest.fn().mockResolvedValue('0xtxhash'),
      executeProposal: jest.fn().mockResolvedValue('0xtxhash'),
      implementation: 'ethers',
      telemetry: { responseTime: 150 }
    });
  });

  it('renders loading state initially', () => {
    render(<UnifiedProposalDetail proposalId={1} />);
    
    // Check for loading indicator
    expect(screen.getByText(/loading proposal/i)).toBeInTheDocument();
  });

  it('renders error state when proposal fetch fails', async () => {
    // Mock getProposal to throw an error
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      getProposal: jest.fn().mockRejectedValue(new Error('Failed to fetch proposal')),
      implementation: 'ethers',
      telemetry: {}
    });
    
    render(<UnifiedProposalDetail proposalId={1} />);
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/error loading proposal/i)).toBeInTheDocument();
      expect(screen.getByText(/failed to fetch proposal/i)).toBeInTheDocument();
    });
  });

  it('renders proposal details correctly with Ethers implementation', async () => {
    render(<UnifiedProposalDetail proposalId={1} />);
    
    // Wait for proposal details to load
    await waitFor(() => {
      // Title should be displayed
      expect(screen.getByText(/test proposal/i)).toBeInTheDocument();
      
      // Description should be displayed
      expect(screen.getByText(/this is a test proposal/i)).toBeInTheDocument();
      
      // Proposer address should be displayed
      expect(screen.getByText(/0x123456/i)).toBeInTheDocument();
      
      // Amount and token should be displayed
      expect(screen.getByText(/1,000,000/i)).toBeInTheDocument();
      expect(screen.getByText(/usdc/i)).toBeInTheDocument();
      
      // Proposal type should be displayed
      expect(screen.getByText(/investment/i)).toBeInTheDocument();
      
      // Voting status should be displayed
      expect(screen.getByText(/active/i)).toBeInTheDocument();
      
      // Voting statistics should be displayed
      expect(screen.getByText(/yes: 100/i)).toBeInTheDocument();
      expect(screen.getByText(/no: 50/i)).toBeInTheDocument();
      
      // Implementation info should be displayed
      expect(screen.getByText(/ethers implementation/i)).toBeInTheDocument();
      
      // Child components should be rendered
      expect(screen.getByTestId('unified-proposal-voting')).toBeInTheDocument();
      expect(screen.getByTestId('unified-proposal-execution')).toBeInTheDocument();
    });
  });

  it('renders proposal details correctly with Wagmi implementation', async () => {
    // Mock contract hook with Wagmi implementation
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      getProposal: jest.fn().mockResolvedValue(mockProposal),
      voteOnProposal: jest.fn().mockResolvedValue('0xtxhash'),
      executeProposal: jest.fn().mockResolvedValue('0xtxhash'),
      implementation: 'wagmi',
      telemetry: { responseTime: 120 }
    });
    
    render(<UnifiedProposalDetail proposalId={1} implementation="wagmi" />);
    
    // Wait for proposal details to load
    await waitFor(() => {
      // Implementation info should indicate Wagmi
      expect(screen.getByText(/wagmi implementation/i)).toBeInTheDocument();
      
      // Child components should be rendered
      expect(screen.getByTestId('unified-proposal-voting')).toBeInTheDocument();
      expect(screen.getByTestId('unified-proposal-execution')).toBeInTheDocument();
    });
  });

  it('handles vote action correctly', async () => {
    const onVoteMock = jest.fn();
    
    render(<UnifiedProposalDetail proposalId={1} onVote={onVoteMock} />);
    
    // Wait for proposal to load
    await waitFor(() => {
      expect(screen.getByText(/test proposal/i)).toBeInTheDocument();
    });
    
    // Find the Vote button in the mocked child component and click it
    const voteButton = screen.getByText(/mock vote yes/i);
    await act(async () => {
      fireEvent.click(voteButton);
    });
    
    // Verify callback was called
    expect(onVoteMock).toHaveBeenCalledWith(1, true, expect.any(String));
  });

  it('handles execute action correctly', async () => {
    const onExecuteMock = jest.fn();
    
    render(<UnifiedProposalDetail proposalId={1} onExecute={onExecuteMock} />);
    
    // Wait for proposal to load
    await waitFor(() => {
      expect(screen.getByText(/test proposal/i)).toBeInTheDocument();
    });
    
    // Find the Execute button in the mocked child component and click it
    const executeButton = screen.getByText(/mock execute/i);
    await act(async () => {
      fireEvent.click(executeButton);
    });
    
    // Verify callback was called
    expect(onExecuteMock).toHaveBeenCalledWith(1, expect.any(String));
  });

  it('refreshes proposal data after voting', async () => {
    const mockGetProposal = jest.fn()
      .mockResolvedValueOnce(mockProposal)
      .mockResolvedValueOnce({
        ...mockProposal,
        yesVotes: 101, // Vote count increased
      });
    
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      getProposal: mockGetProposal,
      voteOnProposal: jest.fn().mockResolvedValue('0xtxhash'),
      executeProposal: jest.fn().mockResolvedValue('0xtxhash'),
      implementation: 'ethers',
      telemetry: {}
    });
    
    render(<UnifiedProposalDetail proposalId={1} />);
    
    // Wait for initial proposal to load
    await waitFor(() => {
      expect(screen.getByText(/yes: 100/i)).toBeInTheDocument();
    });
    
    // Find the Vote button and click it
    const voteButton = screen.getByText(/mock vote yes/i);
    await act(async () => {
      fireEvent.click(voteButton);
    });
    
    // Wait for updated proposal data
    await waitFor(() => {
      expect(screen.getByText(/yes: 101/i)).toBeInTheDocument();
    });
    
    // Verify getProposal was called twice
    expect(mockGetProposal).toHaveBeenCalledTimes(2);
  });

  it('refreshes proposal data after execution', async () => {
    const mockGetProposal = jest.fn()
      .mockResolvedValueOnce(mockProposal)
      .mockResolvedValueOnce({
        ...mockProposal,
        state: ProposalState.Executed,
        executed: true
      });
    
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      getProposal: mockGetProposal,
      voteOnProposal: jest.fn().mockResolvedValue('0xtxhash'),
      executeProposal: jest.fn().mockResolvedValue('0xtxhash'),
      implementation: 'ethers',
      telemetry: {}
    });
    
    render(<UnifiedProposalDetail proposalId={1} />);
    
    // Wait for initial proposal to load
    await waitFor(() => {
      expect(screen.getByText(/active/i)).toBeInTheDocument();
    });
    
    // Find the Execute button and click it
    const executeButton = screen.getByText(/mock execute/i);
    await act(async () => {
      fireEvent.click(executeButton);
    });
    
    // Wait for updated proposal data
    await waitFor(() => {
      expect(screen.getByText(/executed/i)).toBeInTheDocument();
    });
    
    // Verify getProposal was called twice
    expect(mockGetProposal).toHaveBeenCalledTimes(2);
  });

  it('formats dates correctly', async () => {
    render(<UnifiedProposalDetail proposalId={1} />);
    
    // Wait for proposal to load
    await waitFor(() => {
      // Creation date should be formatted
      expect(screen.getByText(/may 1, 2025/i)).toBeInTheDocument();
      
      // Voting end date should be formatted
      expect(screen.getByText(/may 8, 2025/i)).toBeInTheDocument();
    });
  });

  it('formats token amounts correctly with decimals', async () => {
    // Mock proposal with a different token amount
    const proposalWithLargeAmount = {
      ...mockProposal,
      amount: 1234567890, // 1,234.56789 USDC with 6 decimals
    };
    
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      getProposal: jest.fn().mockResolvedValue(proposalWithLargeAmount),
      voteOnProposal: jest.fn().mockResolvedValue('0xtxhash'),
      executeProposal: jest.fn().mockResolvedValue('0xtxhash'),
      implementation: 'ethers',
      telemetry: {}
    });
    
    render(<UnifiedProposalDetail proposalId={1} />);
    
    // Wait for proposal to load
    await waitFor(() => {
      // Amount should be formatted with commas and correct decimals
      expect(screen.getByText(/1,234.56789/i)).toBeInTheDocument();
    });
  });

  it('handles null proposal data gracefully', async () => {
    // Mock getProposal to return null
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      getProposal: jest.fn().mockResolvedValue(null),
      implementation: 'ethers',
      telemetry: {}
    });
    
    render(<UnifiedProposalDetail proposalId={1} />);
    
    // Wait for not found message
    await waitFor(() => {
      expect(screen.getByText(/proposal not found/i)).toBeInTheDocument();
    });
  });

  it('shows telemetry data when enabled', async () => {
    // Mock telemetry data
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      getProposal: jest.fn().mockResolvedValue(mockProposal),
      voteOnProposal: jest.fn().mockResolvedValue('0xtxhash'),
      executeProposal: jest.fn().mockResolvedValue('0xtxhash'),
      implementation: 'ethers',
      telemetry: { 
        responseTime: 150,
        gasUsed: 50000,
        blockNumber: 12345678
      }
    });
    
    render(<UnifiedProposalDetail proposalId={1} showTelemetry={true} />);
    
    // Wait for telemetry data to appear
    await waitFor(() => {
      expect(screen.getByText(/response time: 150ms/i)).toBeInTheDocument();
      expect(screen.getByText(/gas used: 50,000/i)).toBeInTheDocument();
      expect(screen.getByText(/block: 12,345,678/i)).toBeInTheDocument();
    });
  });
});
