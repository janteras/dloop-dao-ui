import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RealTimeProposalCard } from '../RealTimeProposalCard';
import { ProposalStatus, ProposalType } from '@/types/proposals';
import * as tokenHooks from '@/hooks/useTokenInfo';
import * as voteHooks from '@/hooks/useQueryProposalVoting';
import * as realTimeHooks from '@/hooks/useProposalEvents';
import * as featureFlagHooks from '@/config/feature-flags';
import { formatEthereumAddress } from '@/types/web3-types';

// Mock the hooks
jest.mock('@/hooks/useTokenInfo', () => ({
  useTokenInfo: jest.fn(),
}));

jest.mock('@/hooks/useQueryProposalVoting', () => ({
  useQueryProposalVoting: jest.fn(),
}));

jest.mock('@/hooks/useProposalEvents', () => ({
  useProposalEvents: jest.fn(),
}));

jest.mock('@/config/feature-flags', () => ({
  useFeatureFlag: jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('RealTimeProposalCard Component', () => {
  const mockProposal = {
    id: '1',
    title: 'Test Proposal',
    description: 'This is a test proposal',
    proposer: '0x1234567890123456789012345678901234567890',
    token: '0xabcdef1234567890abcdef1234567890abcdef12',
    amount: '1000000000000000000',
    status: ProposalStatus.ACTIVE,
    type: ProposalType.INVEST,
    createdAt: 1619000000,
    endTime: 1619100000,
    executed: false,
    canceled: false,
    forVotes: '10',
    againstVotes: '5',
    hasVoted: false,
    endsIn: '1 day'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock implementations
    (tokenHooks.useTokenInfo as jest.Mock).mockReturnValue({
      token: mockProposal.token,
      symbol: 'TEST',
      decimals: 18,
      isLoading: false,
      error: null
    });
    
    (voteHooks.useQueryProposalVoting as jest.Mock).mockReturnValue({
      voteOnProposal: jest.fn(),
      isVoting: false,
    });
    
    (realTimeHooks.useProposalEvents as jest.Mock).mockReturnValue({
      voteEvents: [],
      isSubscribed: true
    });
    
    (featureFlagHooks.useFeatureFlag as jest.Mock).mockReturnValue(false);
  });

  test('renders proposal information correctly', () => {
    render(
      <RealTimeProposalCard 
        proposal={mockProposal} 
        implementation="ethers"
      />
    );
    
    // Check if title is rendered
    expect(screen.getByText(mockProposal.title)).toBeInTheDocument();
    
    // Check if truncated proposer address is rendered
    const formattedAddress = formatEthereumAddress(mockProposal.proposer);
    expect(screen.getByText(formattedAddress)).toBeInTheDocument();
    
    // Check if proposal amount and token are rendered
    expect(screen.getByText('1.0')).toBeInTheDocument();
    expect(screen.getByText('TEST')).toBeInTheDocument();
    
    // Check if status is rendered
    expect(screen.getByText('Active')).toBeInTheDocument();
    
    // Check if voting buttons are rendered
    expect(screen.getByText('For')).toBeInTheDocument();
    expect(screen.getByText('Against')).toBeInTheDocument();
  });

  test('handles vote action correctly', async () => {
    const mockVoteOnProposal = jest.fn();
    (voteHooks.useQueryProposalVoting as jest.Mock).mockReturnValue({
      voteOnProposal: mockVoteOnProposal,
      isVoting: false,
    });

    render(
      <RealTimeProposalCard 
        proposal={mockProposal} 
        implementation="ethers"
      />
    );
    
    // Click on the "For" button
    fireEvent.click(screen.getByText('For'));
    
    // Check if the voteOnProposal function was called with the correct arguments
    expect(mockVoteOnProposal).toHaveBeenCalledWith({
      proposalId: mockProposal.id,
      support: true
    });
  });

  test('displays loading state when voting', () => {
    (voteHooks.useQueryProposalVoting as jest.Mock).mockReturnValue({
      voteOnProposal: jest.fn(),
      isVoting: true,
    });

    render(
      <RealTimeProposalCard 
        proposal={mockProposal} 
        implementation="ethers"
      />
    );
    
    // Check if loading indicators are shown
    expect(screen.getByText('Voting...')).toBeInTheDocument();
  });

  test('updates local state when vote events are received', () => {
    const voteEvents = [
      {
        proposalId: '1',
        voter: '0x1234567890123456789012345678901234567890',
        support: true,
        votes: '5',
        timestamp: 1619050000
      }
    ];
    
    (realTimeHooks.useProposalEvents as jest.Mock).mockReturnValue({
      voteEvents,
      isSubscribed: true
    });

    render(
      <RealTimeProposalCard 
        proposal={mockProposal} 
        implementation="ethers"
      />
    );
    
    // The component should have added the vote to the local proposal state
    // We can check this by seeing that the "For" votes have increased
    expect(screen.getByText('15')).toBeInTheDocument(); // 10 original + 5 from the vote event
  });

  test('respects implementation prop', () => {
    render(
      <RealTimeProposalCard 
        proposal={mockProposal} 
        implementation="wagmi"
      />
    );
    
    expect(voteHooks.useQueryProposalVoting).toHaveBeenCalledWith(
      expect.objectContaining({
        implementation: 'wagmi'
      })
    );
  });

  test('disables voting buttons for non-active proposals', () => {
    const inactiveProposal = {
      ...mockProposal,
      status: ProposalStatus.PASSED
    };

    render(
      <RealTimeProposalCard 
        proposal={inactiveProposal} 
        implementation="ethers"
      />
    );
    
    // Check if voting buttons are disabled
    const forButton = screen.getByText('For').closest('button');
    const againstButton = screen.getByText('Against').closest('button');
    
    expect(forButton).toHaveAttribute('disabled');
    expect(againstButton).toHaveAttribute('disabled');
  });

  test('disables voting buttons if user has already voted', () => {
    const votedProposal = {
      ...mockProposal,
      hasVoted: true
    };

    render(
      <RealTimeProposalCard 
        proposal={votedProposal} 
        implementation="ethers"
      />
    );
    
    // Check if voting buttons are disabled
    const forButton = screen.getByText('For').closest('button');
    const againstButton = screen.getByText('Against').closest('button');
    
    expect(forButton).toHaveAttribute('disabled');
    expect(againstButton).toHaveAttribute('disabled');
  });

  // Test the address truncation and copy functionality
  test('truncates Ethereum addresses and provides copy functionality', () => {
    render(
      <RealTimeProposalCard 
        proposal={mockProposal} 
        implementation="ethers"
      />
    );
    
    // Check if the address is truncated correctly
    const formattedAddress = formatEthereumAddress(mockProposal.proposer);
    expect(screen.getByText(formattedAddress)).toBeInTheDocument();
    
    // Check if the copy button is present
    const copyButton = screen.getByLabelText('Copy address');
    expect(copyButton).toBeInTheDocument();
    
    // Simulate clicking the copy button
    fireEvent.click(copyButton);
    
    // Check if the success toast was called
    // We would need to test the clipboard API, but that's browser-specific
  });
});
