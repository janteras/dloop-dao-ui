/**
 * Unit tests for the UnifiedProposalVoting component
 * 
 * Tests both Ethers and Wagmi implementations to ensure consistent behavior
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { UnifiedProposalVoting } from '../UnifiedProposalVoting';
import { useUnifiedAssetDaoContract } from '@/hooks/unified/useUnifiedAssetDaoContract';
import { useUnifiedWallet } from '@/hooks/unified';
import { ProposalState } from '@/services/enhanced-assetDaoService';

// Mock the hooks
jest.mock('@/hooks/unified/useUnifiedAssetDaoContract', () => ({
  useUnifiedAssetDaoContract: jest.fn()
}));

jest.mock('@/hooks/unified', () => ({
  useUnifiedWallet: jest.fn()
}));

// Mock the notification service
jest.mock('@/services/notificationService', () => ({
  NotificationService: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn()
  }
}));

describe('UnifiedProposalVoting Component', () => {
  // Mock proposal data
  const mockProposal = {
    id: 1,
    title: 'Test Proposal',
    description: 'This is a test proposal',
    proposer: '0x1234567890123456789012345678901234567890',
    state: ProposalState.Active,
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
      voteOnProposal: jest.fn().mockResolvedValue('0xtxhash'),
      hasVoted: jest.fn().mockResolvedValue(false),
      implementation: 'ethers',
      telemetry: { responseTime: 150 }
    });
  });

  it('renders the voting component properly', () => {
    render(<UnifiedProposalVoting proposalId={1} />);
    
    // Check for voting buttons
    expect(screen.getByText(/vote yes/i)).toBeInTheDocument();
    expect(screen.getByText(/vote no/i)).toBeInTheDocument();
    expect(screen.getByText(/abstain/i)).toBeInTheDocument();
  });

  it('disables voting when wallet is not connected', () => {
    // Mock wallet as not connected
    (useUnifiedWallet as jest.Mock).mockReturnValue({
      isConnected: false,
      address: null
    });
    
    render(<UnifiedProposalVoting proposalId={1} />);
    
    // Check that buttons are disabled
    const voteYesButton = screen.getByText(/vote yes/i).closest('button');
    const voteNoButton = screen.getByText(/vote no/i).closest('button');
    const abstainButton = screen.getByText(/abstain/i).closest('button');
    
    expect(voteYesButton).toBeDisabled();
    expect(voteNoButton).toBeDisabled();
    expect(abstainButton).toBeDisabled();
  });

  it('disables voting when user has already voted', async () => {
    // Mock hasVoted to return true
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      voteOnProposal: jest.fn().mockResolvedValue('0xtxhash'),
      hasVoted: jest.fn().mockResolvedValue(true),
      implementation: 'ethers',
      telemetry: { responseTime: 150 }
    });
    
    render(<UnifiedProposalVoting proposalId={1} />);
    
    // Wait for the component to check if user has voted
    await waitFor(() => {
      const voteYesButton = screen.getByText(/vote yes/i).closest('button');
      const voteNoButton = screen.getByText(/vote no/i).closest('button');
      const abstainButton = screen.getByText(/abstain/i).closest('button');
      
      expect(voteYesButton).toBeDisabled();
      expect(voteNoButton).toBeDisabled();
      expect(abstainButton).toBeDisabled();
      
      // Should show already voted message
      expect(screen.getByText(/you have already voted/i)).toBeInTheDocument();
    });
  });

  it('disables voting when proposal is not active', () => {
    render(
      <UnifiedProposalVoting 
        proposalId={1} 
        proposalState={ProposalState.Succeeded} 
      />
    );
    
    // Check that buttons are disabled
    const voteYesButton = screen.getByText(/vote yes/i).closest('button');
    const voteNoButton = screen.getByText(/vote no/i).closest('button');
    const abstainButton = screen.getByText(/abstain/i).closest('button');
    
    expect(voteYesButton).toBeDisabled();
    expect(voteNoButton).toBeDisabled();
    expect(abstainButton).toBeDisabled();
    
    // Should show voting closed message
    expect(screen.getByText(/voting is closed/i)).toBeInTheDocument();
  });

  it('handles voting yes correctly with Ethers implementation', async () => {
    const mockVoteOnProposal = jest.fn().mockResolvedValue('0xtxhash');
    
    // Mock the contract hook
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      voteOnProposal: mockVoteOnProposal,
      hasVoted: jest.fn().mockResolvedValue(false),
      implementation: 'ethers',
      telemetry: { responseTime: 150 }
    });
    
    // Mock callback
    const onVoteMock = jest.fn();
    
    // Render the component
    render(
      <UnifiedProposalVoting 
        proposalId={1}
        proposalState={ProposalState.Active}
        onVote={onVoteMock}
      />
    );
    
    // Find the Vote Yes button and click it
    const voteYesButton = screen.getByText(/vote yes/i).closest('button');
    await act(async () => {
      fireEvent.click(voteYesButton);
    });
    
    // Verify the vote function was called with correct parameters
    expect(mockVoteOnProposal).toHaveBeenCalledWith(1, true);
    
    // Verify callback was called
    await waitFor(() => {
      expect(onVoteMock).toHaveBeenCalledWith(1, true, '0xtxhash');
    });
  });

  it('handles voting no correctly with Ethers implementation', async () => {
    const mockVoteOnProposal = jest.fn().mockResolvedValue('0xtxhash');
    
    // Mock the contract hook
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      voteOnProposal: mockVoteOnProposal,
      hasVoted: jest.fn().mockResolvedValue(false),
      implementation: 'ethers',
      telemetry: { responseTime: 150 }
    });
    
    // Mock callback
    const onVoteMock = jest.fn();
    
    // Render the component
    render(
      <UnifiedProposalVoting 
        proposalId={1}
        proposalState={ProposalState.Active}
        onVote={onVoteMock}
      />
    );
    
    // Find the Vote No button and click it
    const voteNoButton = screen.getByText(/vote no/i).closest('button');
    await act(async () => {
      fireEvent.click(voteNoButton);
    });
    
    // Verify the vote function was called with correct parameters
    expect(mockVoteOnProposal).toHaveBeenCalledWith(1, false);
    
    // Verify callback was called
    await waitFor(() => {
      expect(onVoteMock).toHaveBeenCalledWith(1, false, '0xtxhash');
    });
  });

  it('handles abstaining correctly with Ethers implementation', async () => {
    const mockVoteOnProposal = jest.fn().mockResolvedValue('0xtxhash');
    
    // Mock the contract hook
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      voteOnProposal: mockVoteOnProposal,
      hasVoted: jest.fn().mockResolvedValue(false),
      implementation: 'ethers',
      telemetry: { responseTime: 150 }
    });
    
    // Mock callback
    const onVoteMock = jest.fn();
    
    // Render the component
    render(
      <UnifiedProposalVoting 
        proposalId={1}
        proposalState={ProposalState.Active}
        onVote={onVoteMock}
      />
    );
    
    // Find the Abstain button and click it
    const abstainButton = screen.getByText(/abstain/i).closest('button');
    await act(async () => {
      fireEvent.click(abstainButton);
    });
    
    // Verify the vote function was called with correct parameters
    expect(mockVoteOnProposal).toHaveBeenCalledWith(1, null);
    
    // Verify callback was called
    await waitFor(() => {
      expect(onVoteMock).toHaveBeenCalledWith(1, null, '0xtxhash');
    });
  });

  it('handles voting yes correctly with Wagmi implementation', async () => {
    const mockVoteOnProposal = jest.fn().mockResolvedValue('0xtxhash');
    
    // Mock the contract hook with Wagmi implementation
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      voteOnProposal: mockVoteOnProposal,
      hasVoted: jest.fn().mockResolvedValue(false),
      implementation: 'wagmi',
      telemetry: { responseTime: 120 }
    });
    
    // Mock callback
    const onVoteMock = jest.fn();
    
    // Render the component
    render(
      <UnifiedProposalVoting 
        proposalId={1}
        proposalState={ProposalState.Active}
        onVote={onVoteMock}
        implementation="wagmi"
      />
    );
    
    // Find the Vote Yes button and click it
    const voteYesButton = screen.getByText(/vote yes/i).closest('button');
    await act(async () => {
      fireEvent.click(voteYesButton);
    });
    
    // Verify the vote function was called with correct parameters
    expect(mockVoteOnProposal).toHaveBeenCalledWith(1, true);
    
    // Verify callback was called
    await waitFor(() => {
      expect(onVoteMock).toHaveBeenCalledWith(1, true, '0xtxhash');
    });
  });

  it('shows loading state during voting action', async () => {
    // Mock voteOnProposal to return a promise that doesn't resolve immediately
    const votePromise = new Promise<string>((resolve) => {
      setTimeout(() => resolve('0xtxhash'), 500);
    });
    
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      voteOnProposal: jest.fn().mockReturnValue(votePromise),
      hasVoted: jest.fn().mockResolvedValue(false),
      implementation: 'ethers',
      telemetry: {}
    });
    
    render(<UnifiedProposalVoting proposalId={1} proposalState={ProposalState.Active} />);
    
    // Find the Vote Yes button and click it
    const voteYesButton = screen.getByText(/vote yes/i).closest('button');
    fireEvent.click(voteYesButton);
    
    // Check for loading state
    expect(screen.getByText(/voting in progress/i)).toBeInTheDocument();
    
    // Buttons should be disabled during voting
    expect(voteYesButton).toBeDisabled();
    expect(screen.getByText(/vote no/i).closest('button')).toBeDisabled();
    expect(screen.getByText(/abstain/i).closest('button')).toBeDisabled();
    
    // Wait for the voting to complete
    await act(async () => {
      await votePromise;
    });
  });

  it('handles voting errors correctly', async () => {
    // Mock voteOnProposal to throw an error
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      voteOnProposal: jest.fn().mockRejectedValue(new Error('Voting failed')),
      hasVoted: jest.fn().mockResolvedValue(false),
      implementation: 'ethers',
      telemetry: {}
    });
    
    // Mock callback
    const onErrorMock = jest.fn();
    
    render(
      <UnifiedProposalVoting 
        proposalId={1} 
        proposalState={ProposalState.Active}
        onError={onErrorMock}
      />
    );
    
    // Find the Vote Yes button and click it
    const voteYesButton = screen.getByText(/vote yes/i).closest('button');
    await act(async () => {
      fireEvent.click(voteYesButton);
    });
    
    // Verify error callback was called
    await waitFor(() => {
      expect(onErrorMock).toHaveBeenCalledWith(expect.any(Error));
    });
    
    // Error message should be displayed
    expect(screen.getByText(/error occurred while voting/i)).toBeInTheDocument();
  });

  it('allows customizing vote button labels', () => {
    render(
      <UnifiedProposalVoting 
        proposalId={1}
        proposalState={ProposalState.Active}
        voteYesLabel="Support"
        voteNoLabel="Oppose"
        abstainLabel="Skip"
      />
    );
    
    // Check for custom button labels
    expect(screen.getByText(/support/i)).toBeInTheDocument();
    expect(screen.getByText(/oppose/i)).toBeInTheDocument();
    expect(screen.getByText(/skip/i)).toBeInTheDocument();
  });

  it('shows vote counts when provided', () => {
    render(
      <UnifiedProposalVoting 
        proposalId={1}
        proposalState={ProposalState.Active}
        yesVotes={100}
        noVotes={50}
        abstainVotes={25}
        showVoteCounts={true}
      />
    );
    
    // Check for vote counts
    expect(screen.getByText(/100/i)).toBeInTheDocument();
    expect(screen.getByText(/50/i)).toBeInTheDocument();
    expect(screen.getByText(/25/i)).toBeInTheDocument();
  });
});
