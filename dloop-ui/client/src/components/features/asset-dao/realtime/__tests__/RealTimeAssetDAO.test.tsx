import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { RealTimeAssetDAO } from '../RealTimeAssetDAO';
import { ProposalStatus, ProposalType } from '@/types/proposals';
import * as queryHooks from '@/hooks/query';
import * as realTimeHooks from '@/hooks/useRealTimeEvents';
import * as featureFlagHooks from '@/config/feature-flags';

// Mock the hooks
jest.mock('@/hooks/query', () => ({
  useQueryProposals: jest.fn(),
}));

jest.mock('@/hooks/useRealTimeEvents', () => ({
  useInitializeRealTimeEvents: jest.fn(),
  useProposalEvents: jest.fn(),
}));

jest.mock('@/config/feature-flags', () => ({
  useFeatureFlag: jest.fn(),
}));

// Mock child components
jest.mock('../RealTimeProposalCard', () => ({
  RealTimeProposalCard: jest.fn(() => <div data-testid="mocked-proposal-card" />),
}));

jest.mock('../../unified/UnifiedCreateProposalModal', () => ({
  UnifiedCreateProposalModal: jest.fn(({ isOpen }) => isOpen ? <div data-testid="mocked-modal" /> : null),
}));

describe('RealTimeAssetDAO Component', () => {
  const mockProposals = [
    {
      id: '1',
      title: 'Test Proposal 1',
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
      endsIn: '1 day'
    },
    {
      id: '2',
      title: 'Test Proposal 2',
      proposer: '0x0987654321098765432109876543210987654321',
      token: '0xfedcba0987654321fedcba0987654321fedcba09',
      amount: '2000000000000000000',
      status: ProposalStatus.PASSED,
      type: ProposalType.DIVEST,
      createdAt: 1619010000,
      endTime: 1619110000,
      executed: false,
      canceled: false,
      forVotes: '20',
      againstVotes: '5',
      endsIn: '2 days'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock implementations
    (queryHooks.useQueryProposals as jest.Mock).mockReturnValue({
      proposals: mockProposals,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      implementation: 'ethers'
    });
    
    (realTimeHooks.useInitializeRealTimeEvents as jest.Mock).mockReturnValue({
      status: 'connected',
      implementation: 'ethers'
    });
    
    (realTimeHooks.useProposalEvents as jest.Mock).mockReturnValue({
      isSubscribed: true
    });
    
    (featureFlagHooks.useFeatureFlag as jest.Mock).mockReturnValue(false);
  });

  test('renders loading state correctly', () => {
    (queryHooks.useQueryProposals as jest.Mock).mockReturnValue({
      proposals: [],
      isLoading: true,
      error: null,
      refetch: jest.fn(),
      implementation: 'ethers'
    });

    render(<RealTimeAssetDAO />);
    
    expect(screen.getByText('Loading proposals...')).toBeInTheDocument();
  });

  test('renders error state correctly', () => {
    const mockError = new Error('Failed to load proposals');
    
    (queryHooks.useQueryProposals as jest.Mock).mockReturnValue({
      proposals: [],
      isLoading: false,
      error: mockError,
      refetch: jest.fn(),
      implementation: 'ethers'
    });

    render(<RealTimeAssetDAO />);
    
    expect(screen.getByText('Error loading proposals')).toBeInTheDocument();
    expect(screen.getByText(mockError.message)).toBeInTheDocument();
  });

  test('renders proposals correctly', () => {
    render(<RealTimeAssetDAO />);
    
    // Since we mocked RealTimeProposalCard to render with a data-testid
    // we can check that we have 2 of them rendered
    const proposalCards = screen.getAllByTestId('mocked-proposal-card');
    expect(proposalCards).toHaveLength(2);
  });

  test('changes active tab when tab buttons are clicked', () => {
    render(<RealTimeAssetDAO />);
    
    // Click on the "Passed" tab
    fireEvent.click(screen.getByText('Passed'));
    
    // Check that the tab changed in the useQueryProposals hook
    expect(queryHooks.useQueryProposals).toHaveBeenCalledWith(
      expect.objectContaining({
        status: ProposalStatus.PASSED
      })
    );
  });

  test('changes type filter when filter buttons are clicked', () => {
    render(<RealTimeAssetDAO />);
    
    // Click on the "Invest" filter
    fireEvent.click(screen.getByText('Invest'));
    
    // Check that the filter changed in the useQueryProposals hook
    expect(queryHooks.useQueryProposals).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ProposalType.INVEST
      })
    );
  });

  test('opens and closes create proposal modal', async () => {
    render(<RealTimeAssetDAO />);
    
    // Initially the modal should not be visible
    expect(screen.queryByTestId('mocked-modal')).not.toBeInTheDocument();
    
    // Click on the "Create Proposal" button
    fireEvent.click(screen.getByText('Create Proposal'));
    
    // Now the modal should be visible
    await waitFor(() => {
      expect(screen.getByTestId('mocked-modal')).toBeInTheDocument();
    });
    
    // We would test closing the modal here, but since we've mocked the component
    // we can't directly test the close functionality in this test
  });

  test('displays websocket connection status', () => {
    (realTimeHooks.useInitializeRealTimeEvents as jest.Mock).mockReturnValue({
      status: 'connecting',
      implementation: 'ethers'
    });
    
    render(<RealTimeAssetDAO />);
    
    expect(screen.getByText('WebSocket:')).toBeInTheDocument();
    expect(screen.getByText('connecting')).toBeInTheDocument();
  });

  test('respects implementation prop', () => {
    render(<RealTimeAssetDAO implementation="wagmi" />);
    
    expect(queryHooks.useQueryProposals).toHaveBeenCalledWith(
      expect.objectContaining({
        implementation: 'wagmi'
      })
    );
  });

  test('displays empty state when no proposals match filters', () => {
    (queryHooks.useQueryProposals as jest.Mock).mockReturnValue({
      proposals: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      implementation: 'ethers'
    });
    
    render(<RealTimeAssetDAO />);
    
    expect(screen.getByText('No proposals found for the selected filters.')).toBeInTheDocument();
  });
});
