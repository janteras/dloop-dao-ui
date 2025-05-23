/**
 * Unit tests for the UnifiedProposalList component
 * 
 * Tests both Ethers and Wagmi implementations to ensure consistent behavior
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { UnifiedProposalList } from '../UnifiedProposalList';
import { useUnifiedAssetDaoContract } from '@/hooks/unified/useUnifiedAssetDaoContract';
import { useUnifiedWallet } from '@/hooks/unified';
import { ProposalState, ProposalType } from '@/services/enhanced-assetDaoService';

// Mock the hooks
jest.mock('@/hooks/unified/useUnifiedAssetDaoContract', () => ({
  useUnifiedAssetDaoContract: jest.fn()
}));

jest.mock('@/hooks/unified', () => ({
  useUnifiedWallet: jest.fn()
}));

// Mock the card component to simplify testing
jest.mock('../UnifiedProposalCard', () => ({
  UnifiedProposalCard: ({ proposal, onVote, onExecute }) => (
    <div data-testid={`proposal-card-${proposal.id}`}>
      <div>Title: {proposal.title}</div>
      <div>Type: {proposal.type}</div>
      <div>State: {proposal.state}</div>
      <button onClick={() => onVote(proposal.id, true)}>Vote Yes</button>
      <button onClick={() => onVote(proposal.id, false)}>Vote No</button>
      <button onClick={() => onExecute(proposal.id)}>Execute</button>
    </div>
  )
}));

describe('UnifiedProposalList Component', () => {
  // Mock proposal data
  const mockProposals = [
    {
      id: 1,
      title: 'Test Proposal 1',
      description: 'This is a test proposal',
      proposer: '0x1234567890123456789012345678901234567890',
      amount: 1000,
      token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
      type: ProposalType.Investment,
      state: ProposalState.Active,
      createdAt: new Date(),
      votingEnds: new Date(Date.now() + 86400000),
      yesVotes: 100,
      noVotes: 50,
      abstainVotes: 10,
      executed: false,
      canceled: false
    },
    {
      id: 2,
      title: 'Test Proposal 2',
      description: 'This is another test proposal',
      proposer: '0x1234567890123456789012345678901234567890',
      amount: 2000,
      token: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
      type: ProposalType.Divestment,
      state: ProposalState.Succeeded,
      createdAt: new Date(),
      votingEnds: new Date(Date.now() - 86400000),
      yesVotes: 200,
      noVotes: 50,
      abstainVotes: 20,
      executed: false,
      canceled: false
    }
  ];

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
      getProposals: jest.fn().mockResolvedValue(mockProposals),
      voteOnProposal: jest.fn().mockResolvedValue('0xtxhash'),
      executeProposal: jest.fn().mockResolvedValue('0xtxhash'),
      implementation: 'ethers',
      telemetry: { responseTime: 150 }
    });
  });

  it('renders with loading state', () => {
    // Mock the contract hook to return loading state
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      getProposals: jest.fn().mockResolvedValue(null),
      voteOnProposal: jest.fn(),
      executeProposal: jest.fn(),
      implementation: 'ethers',
      telemetry: {}
    });
    
    render(<UnifiedProposalList />);
    
    // Check for loading indicator
    expect(screen.getByText(/loading proposals/i)).toBeInTheDocument();
  });

  it('renders with error state', async () => {
    // Mock the contract hook to throw an error
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      getProposals: jest.fn().mockRejectedValue(new Error('Test error')),
      voteOnProposal: jest.fn(),
      executeProposal: jest.fn(),
      implementation: 'ethers',
      telemetry: {}
    });
    
    render(<UnifiedProposalList />);
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
      expect(screen.getByText(/test error/i)).toBeInTheDocument();
    });
  });

  it('renders with empty state', async () => {
    // Mock the contract hook to return empty proposals
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      getProposals: jest.fn().mockResolvedValue([]),
      voteOnProposal: jest.fn(),
      executeProposal: jest.fn(),
      implementation: 'ethers',
      telemetry: {}
    });
    
    render(<UnifiedProposalList />);
    
    // Wait for empty message to appear
    await waitFor(() => {
      expect(screen.getByText(/no proposals found/i)).toBeInTheDocument();
    });
  });

  it('renders proposals correctly with Ethers implementation', async () => {
    // Mock the contract hook with Ethers implementation
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      getProposals: jest.fn().mockResolvedValue(mockProposals),
      voteOnProposal: jest.fn().mockResolvedValue('0xtxhash'),
      executeProposal: jest.fn().mockResolvedValue('0xtxhash'),
      implementation: 'ethers',
      telemetry: { responseTime: 150 }
    });
    
    render(<UnifiedProposalList />);
    
    // Wait for proposals to appear
    await waitFor(() => {
      expect(screen.getByText(/using ethers implementation/i)).toBeInTheDocument();
      expect(screen.getByText(/Test Proposal 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Test Proposal 2/i)).toBeInTheDocument();
    });
  });

  it('renders proposals correctly with Wagmi implementation', async () => {
    // Mock the contract hook with Wagmi implementation
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      getProposals: jest.fn().mockResolvedValue(mockProposals),
      voteOnProposal: jest.fn().mockResolvedValue('0xtxhash'),
      executeProposal: jest.fn().mockResolvedValue('0xtxhash'),
      implementation: 'wagmi',
      telemetry: { responseTime: 120 }
    });
    
    render(<UnifiedProposalList implementation="wagmi" />);
    
    // Wait for proposals to appear
    await waitFor(() => {
      expect(screen.getByText(/using wagmi implementation/i)).toBeInTheDocument();
      expect(screen.getByText(/Test Proposal 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Test Proposal 2/i)).toBeInTheDocument();
    });
  });

  it('handles voting correctly', async () => {
    const mockVoteOnProposal = jest.fn().mockResolvedValue('0xtxhash');
    const mockGetProposals = jest.fn().mockResolvedValue(mockProposals);
    
    // Mock the contract hook
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      getProposals: mockGetProposals,
      voteOnProposal: mockVoteOnProposal,
      executeProposal: jest.fn().mockResolvedValue('0xtxhash'),
      implementation: 'ethers',
      telemetry: {}
    });
    
    // Render the component
    render(<UnifiedProposalList />);
    
    // Wait for proposals to appear
    await waitFor(() => {
      expect(screen.getByText(/Test Proposal 1/i)).toBeInTheDocument();
    });
    
    // Find the Vote Yes button for the first proposal and click it
    const voteYesButton = screen.getAllByText(/Vote Yes/i)[0];
    await act(async () => {
      fireEvent.click(voteYesButton);
    });
    
    // Verify the vote function was called with correct parameters
    expect(mockVoteOnProposal).toHaveBeenCalledWith(1, true);
    
    // Verify that getProposals was called again to refresh the data
    expect(mockGetProposals).toHaveBeenCalledTimes(2);
  });

  it('handles execution correctly', async () => {
    const mockExecuteProposal = jest.fn().mockResolvedValue('0xtxhash');
    const mockGetProposals = jest.fn().mockResolvedValue(mockProposals);
    
    // Mock the contract hook
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      getProposals: mockGetProposals,
      voteOnProposal: jest.fn().mockResolvedValue('0xtxhash'),
      executeProposal: mockExecuteProposal,
      implementation: 'ethers',
      telemetry: {}
    });
    
    // Render the component
    render(<UnifiedProposalList />);
    
    // Wait for proposals to appear
    await waitFor(() => {
      expect(screen.getByText(/Test Proposal 2/i)).toBeInTheDocument();
    });
    
    // Find the Execute button for the second proposal and click it
    const executeButton = screen.getAllByText(/Execute/i)[1];
    await act(async () => {
      fireEvent.click(executeButton);
    });
    
    // Verify the execute function was called with correct parameters
    expect(mockExecuteProposal).toHaveBeenCalledWith(2);
    
    // Verify that getProposals was called again to refresh the data
    expect(mockGetProposals).toHaveBeenCalledTimes(2);
  });

  it('handles pagination correctly', async () => {
    const mockGetProposals = jest.fn()
      .mockImplementation((options) => {
        // Return different data based on pagination
        if (options.offset === 0) {
          return Promise.resolve(mockProposals);
        } else {
          return Promise.resolve([
            {
              id: 3,
              title: 'Test Proposal 3',
              description: 'This is the third test proposal',
              proposer: '0x1234567890123456789012345678901234567890',
              amount: 3000,
              token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
              type: ProposalType.ParameterChange,
              state: ProposalState.Executed,
              createdAt: new Date(),
              votingEnds: new Date(Date.now() - 86400000 * 2),
              yesVotes: 300,
              noVotes: 100,
              abstainVotes: 50,
              executed: true,
              canceled: false
            }
          ]);
        }
      });
    
    // Mock the contract hook
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      getProposals: mockGetProposals,
      voteOnProposal: jest.fn().mockResolvedValue('0xtxhash'),
      executeProposal: jest.fn().mockResolvedValue('0xtxhash'),
      implementation: 'ethers',
      telemetry: {}
    });
    
    // Render the component
    render(<UnifiedProposalList totalCount={3} />);
    
    // Wait for initial proposals to appear
    await waitFor(() => {
      expect(screen.getByText(/Test Proposal 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Test Proposal 2/i)).toBeInTheDocument();
    });
    
    // Find the Next button and click it
    const nextButton = screen.getByText(/Next/i);
    await act(async () => {
      fireEvent.click(nextButton);
    });
    
    // Verify that getProposals was called with the correct pagination
    expect(mockGetProposals).toHaveBeenCalledWith(expect.objectContaining({
      limit: 5,
      offset: 5 // Default page size is 5
    }));
    
    // Wait for the new proposal to appear
    await waitFor(() => {
      expect(screen.getByText(/Test Proposal 3/i)).toBeInTheDocument();
    });
  });

  it('calls onLoad callback when proposals are loaded', async () => {
    const onLoadMock = jest.fn();
    
    // Mock the contract hook
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      getProposals: jest.fn().mockResolvedValue(mockProposals),
      voteOnProposal: jest.fn(),
      executeProposal: jest.fn(),
      implementation: 'ethers',
      telemetry: {}
    });
    
    // Render the component with onLoad callback
    render(<UnifiedProposalList onLoad={onLoadMock} />);
    
    // Wait for proposals to load
    await waitFor(() => {
      expect(onLoadMock).toHaveBeenCalledWith(mockProposals);
    });
  });

  it('calls onActionComplete callback when actions are completed', async () => {
    const onActionCompleteMock = jest.fn();
    
    // Mock the contract hook
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      getProposals: jest.fn().mockResolvedValue(mockProposals),
      voteOnProposal: jest.fn().mockResolvedValue('0xtxhash'),
      executeProposal: jest.fn().mockResolvedValue('0xtxhash'),
      implementation: 'ethers',
      telemetry: {}
    });
    
    // Render the component with onActionComplete callback
    render(<UnifiedProposalList onActionComplete={onActionCompleteMock} />);
    
    // Wait for proposals to appear
    await waitFor(() => {
      expect(screen.getByText(/Test Proposal 1/i)).toBeInTheDocument();
    });
    
    // Find the Vote Yes button for the first proposal and click it
    const voteYesButton = screen.getAllByText(/Vote Yes/i)[0];
    await act(async () => {
      fireEvent.click(voteYesButton);
    });
    
    // Verify the callback was called
    expect(onActionCompleteMock).toHaveBeenCalled();
  });
});
