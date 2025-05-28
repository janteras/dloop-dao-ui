import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProposalCard from '@/components/assetdao/ProposalCard';
import { Proposal } from '@/types';

// Mock the hooks used in the component
jest.mock('@/hooks/useWallet', () => ({
  useWallet: jest.fn(() => ({
    isConnected: true,
  })),
}));

// Mock the utility functions
jest.mock('@/lib/utils', () => ({
  shortenAddress: jest.fn((address) => `${address.slice(0, 6)}...${address.slice(-4)}`),
  copyToClipboard: jest.fn(),
}));

// Create a mock toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('ProposalCard Component', () => {
  // Sample proposal data
  const mockProposal: Proposal = {
    id: 1,
    title: 'Test Proposal',
    description: 'This is a test proposal',
    type: 'invest',
    proposer: '0x1234567890abcdef1234567890abcdef12345678',
    token: 'USDC',
    amount: 1000,
    status: 'active',
    forVotes: 60,
    againstVotes: 40,
    endTime: Date.now() + 86400000, // 1 day from now
    endTimeISO: new Date(Date.now() + 86400000).toISOString(),
    endsIn: '1 day',
    executed: false,
    canceled: false,
    createdAt: Date.now() - 86400000, // 1 day ago
  };

  // Mock handlers
  const mockVoteHandler = jest.fn();
  const mockExecuteHandler = jest.fn();

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  test('renders correctly with investment proposal data', () => {
    render(
      <ProposalCard
        proposal={mockProposal}
        onVote={mockVoteHandler}
        onExecute={mockExecuteHandler}
      />
    );

    // Check that key elements are rendered
    expect(screen.getByText('Test Proposal')).toBeInTheDocument();
    expect(screen.getByText('This is a test proposal')).toBeInTheDocument();
    expect(screen.getByText('USDC')).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(screen.getByText('Investment')).toBeInTheDocument();
    expect(screen.getByText('0x1234...5678')).toBeInTheDocument();
    expect(screen.getByText('60% Yes')).toBeInTheDocument();
    
    // Check that vote buttons are rendered for active proposal
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  test('renders correctly with divestment proposal data', () => {
    const divestProposal = { ...mockProposal, type: 'divest' as const };
    
    render(
      <ProposalCard
        proposal={divestProposal}
        onVote={mockVoteHandler}
        onExecute={mockExecuteHandler}
      />
    );

    // Check that the proposal type is displayed correctly
    expect(screen.getByText('Divestment')).toBeInTheDocument();
  });

  test('calls onVote handler when Yes button is clicked', async () => {
    render(
      <ProposalCard
        proposal={mockProposal}
        onVote={mockVoteHandler}
        onExecute={mockExecuteHandler}
      />
    );

    // Click the Yes button
    fireEvent.click(screen.getByText('Yes'));
    
    // Check that the vote handler was called with the correct parameters
    expect(mockVoteHandler).toHaveBeenCalledWith(1, true);
  });

  test('calls onVote handler when No button is clicked', async () => {
    render(
      <ProposalCard
        proposal={mockProposal}
        onVote={mockVoteHandler}
        onExecute={mockExecuteHandler}
      />
    );

    // Click the No button
    fireEvent.click(screen.getByText('No'));
    
    // Check that the vote handler was called with the correct parameters
    expect(mockVoteHandler).toHaveBeenCalledWith(1, false);
  });

  test('renders Execute button for passed proposals', () => {
    const passedProposal = { ...mockProposal, status: 'passed' as const };
    
    render(
      <ProposalCard
        proposal={passedProposal}
        onVote={mockVoteHandler}
        onExecute={mockExecuteHandler}
      />
    );

    // Check that the execute button is rendered
    expect(screen.getByText('Execute Proposal')).toBeInTheDocument();
  });

  test('calls onExecute handler when Execute button is clicked', async () => {
    const passedProposal = { ...mockProposal, status: 'passed' as const };
    
    render(
      <ProposalCard
        proposal={passedProposal}
        onVote={mockVoteHandler}
        onExecute={mockExecuteHandler}
      />
    );

    // Click the Execute button
    fireEvent.click(screen.getByText('Execute Proposal'));
    
    // Check that the execute handler was called with the correct parameters
    expect(mockExecuteHandler).toHaveBeenCalledWith(1);
  });

  test('displays disabled button for executed proposals', () => {
    const executedProposal = { 
      ...mockProposal, 
      status: 'executed' as const,
      executed: true
    };
    
    render(
      <ProposalCard
        proposal={executedProposal}
        onVote={mockVoteHandler}
        onExecute={mockExecuteHandler}
      />
    );

    // Check that the disabled button is rendered
    const button = screen.getByText('Executed');
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  test('displays disabled button for failed proposals', () => {
    const failedProposal = { ...mockProposal, status: 'failed' as const };
    
    render(
      <ProposalCard
        proposal={failedProposal}
        onVote={mockVoteHandler}
        onExecute={mockExecuteHandler}
      />
    );

    // Check that the disabled button is rendered
    const button = screen.getByText('Failed');
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });
});
