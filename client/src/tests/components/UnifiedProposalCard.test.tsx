import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UnifiedProposalCard } from '@/components/features/asset-dao/consolidated/UnifiedProposalCard';
import { Proposal } from '@/types';
import { ProposalType } from '@/services/enhanced-assetDaoService';

// Mock the wallet provider
jest.mock('@/components/features/wallet/simplified-wallet-provider', () => ({
  useWallet: jest.fn(() => ({
    isConnected: true,
    address: '0x1234567890abcdef1234567890abcdef12345678',
    provider: {},
    signer: {}
  })),
}));

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(() => ({
    toast: {
      success: jest.fn(),
      error: jest.fn()
    }
  })),
}));

// Mock the token symbol resolver
jest.mock('@/services/tokenSymbolService', () => ({
  TokenSymbolResolver: {
    resolveSymbol: jest.fn((token) => {
      // Map common token addresses to symbols for testing
      const tokenMap: Record<string, string> = {
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': 'USDC',
        '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599': 'WBTC',
        '0x1234567890abcdef1234567890abcdef12345678': 'DLOOP',
      };
      return tokenMap[token] || token;
    })
  }
}));

// Mock the enhanced AssetDAO service
jest.mock('@/services/enhanced-assetDaoService', () => ({
  ProposalType: {
    Investment: 0,
    Divestment: 1,
    ParameterChange: 2
  },
  EnhancedAssetDAOService: {
    voteOnProposal: jest.fn(),
    executeProposal: jest.fn()
  }
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('UnifiedProposalCard Component', () => {
  // Sample proposal data
  const mockProposal: Proposal = {
    id: 1,
    title: 'Test Proposal',
    description: 'This is a test proposal',
    type: ProposalType.Investment,
    proposer: '0x1234567890abcdef1234567890abcdef12345678',
    token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC address
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

  // Mock refresh handler
  const mockRefreshHandler = jest.fn();

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  test('renders correctly with investment proposal data', () => {
    render(
      <UnifiedProposalCard
        proposal={mockProposal}
        onRefresh={mockRefreshHandler}
      />
    );

    // Check that key elements are rendered
    expect(screen.getByText('Test Proposal')).toBeInTheDocument();
    expect(screen.getByText('This is a test proposal')).toBeInTheDocument();
    
    // Check for token symbol resolution
    expect(screen.getByText(/USDC/i)).toBeInTheDocument();
    
    // Check for amount display
    expect(screen.getByText(/1000/i)).toBeInTheDocument();
    
    // Check for proposal type display
    expect(screen.getByText(/Invest/i)).toBeInTheDocument();
    
    // Check for truncated address
    expect(screen.getByText(/0x1234/i)).toBeInTheDocument();
    
    // Check that vote buttons are rendered for active proposal
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  test('renders correctly with divestment proposal data', () => {
    const divestProposal = { 
      ...mockProposal, 
      type: ProposalType.Divestment 
    };
    
    render(
      <UnifiedProposalCard
        proposal={divestProposal}
        onRefresh={mockRefreshHandler}
      />
    );

    // Check that the proposal type is displayed correctly
    expect(screen.getByText(/Divest/i)).toBeInTheDocument();
  });

  test('renders correctly with parameter change proposal data', () => {
    const parameterProposal = { 
      ...mockProposal, 
      type: ProposalType.ParameterChange,
      token: '',
      amount: 0
    };
    
    render(
      <UnifiedProposalCard
        proposal={parameterProposal}
        onRefresh={mockRefreshHandler}
      />
    );

    // Check that the proposal type is displayed correctly
    expect(screen.getByText(/Parameter Change/i)).toBeInTheDocument();
  });

  test('handles string-based types correctly for backward compatibility', () => {
    const stringTypeProposal = { 
      ...mockProposal, 
      type: 'divest' as any 
    };
    
    render(
      <UnifiedProposalCard
        proposal={stringTypeProposal}
        onRefresh={mockRefreshHandler}
      />
    );

    // Check that the proposal type is displayed correctly
    expect(screen.getByText(/Divest/i)).toBeInTheDocument();
  });

  test('renders in list view mode correctly', () => {
    render(
      <UnifiedProposalCard
        proposal={mockProposal}
        onRefresh={mockRefreshHandler}
        listView={true}
      />
    );

    // Check that list view specific elements are rendered
    expect(screen.getByText('Test Proposal')).toBeInTheDocument();
    // In list view, we should have a more compact UI
    expect(screen.queryByText('This is a test proposal')).not.toBeInTheDocument();
  });

  test('calls onRefresh handler when vote is successful', async () => {
    const { EnhancedAssetDAOService } = require('@/services/enhanced-assetDaoService');
    // Mock successful vote
    EnhancedAssetDAOService.voteOnProposal.mockResolvedValue({ status: 'success' });
    
    render(
      <UnifiedProposalCard
        proposal={mockProposal}
        onRefresh={mockRefreshHandler}
      />
    );

    // Click the Yes button
    fireEvent.click(screen.getByText('Yes'));
    
    // Wait for async operations
    await waitFor(() => {
      // Check that the vote function was called
      expect(EnhancedAssetDAOService.voteOnProposal).toHaveBeenCalled();
      // Check that the refresh handler was called
      expect(mockRefreshHandler).toHaveBeenCalled();
    });
  });

  test('calls onRefresh handler when execution is successful', async () => {
    const { EnhancedAssetDAOService } = require('@/services/enhanced-assetDaoService');
    // Mock successful execution
    EnhancedAssetDAOService.executeProposal.mockResolvedValue({ status: 'success' });
    
    const passedProposal = { 
      ...mockProposal, 
      status: 'passed' 
    };
    
    render(
      <UnifiedProposalCard
        proposal={passedProposal}
        onRefresh={mockRefreshHandler}
      />
    );

    // Click the Execute button
    fireEvent.click(screen.getByText(/Execute/i));
    
    // Wait for async operations
    await waitFor(() => {
      // Check that the execute function was called
      expect(EnhancedAssetDAOService.executeProposal).toHaveBeenCalled();
      // Check that the refresh handler was called
      expect(mockRefreshHandler).toHaveBeenCalled();
    });
  });

  test('handles errors during vote correctly', async () => {
    const { EnhancedAssetDAOService } = require('@/services/enhanced-assetDaoService');
    const toast = require('react-hot-toast').default;
    
    // Mock failed vote
    EnhancedAssetDAOService.voteOnProposal.mockRejectedValue(new Error('Vote failed'));
    
    render(
      <UnifiedProposalCard
        proposal={mockProposal}
        onRefresh={mockRefreshHandler}
      />
    );

    // Click the No button
    fireEvent.click(screen.getByText('No'));
    
    // Wait for async operations
    await waitFor(() => {
      // Check that the vote function was called
      expect(EnhancedAssetDAOService.voteOnProposal).toHaveBeenCalled();
      // Check that error toast was shown
      expect(toast.error).toHaveBeenCalled();
      // Refresh should not be called on error
      expect(mockRefreshHandler).not.toHaveBeenCalled();
    });
  });

  test('displays executed state for executed proposals', () => {
    const executedProposal = { 
      ...mockProposal, 
      status: 'executed',
      executed: true
    };
    
    render(
      <UnifiedProposalCard
        proposal={executedProposal}
        onRefresh={mockRefreshHandler}
      />
    );

    // Check that the executed state is shown
    expect(screen.getByText(/Executed/i)).toBeInTheDocument();
    // Vote buttons should not be present
    expect(screen.queryByText('Yes')).not.toBeInTheDocument();
    expect(screen.queryByText('No')).not.toBeInTheDocument();
  });

  test('displays failed state for failed proposals', () => {
    const failedProposal = { 
      ...mockProposal, 
      status: 'failed'
    };
    
    render(
      <UnifiedProposalCard
        proposal={failedProposal}
        onRefresh={mockRefreshHandler}
      />
    );

    // Check that the failed state is shown
    expect(screen.getByText(/Failed/i)).toBeInTheDocument();
    // Vote buttons should not be present
    expect(screen.queryByText('Yes')).not.toBeInTheDocument();
    expect(screen.queryByText('No')).not.toBeInTheDocument();
  });

  test('correctly truncates long Ethereum addresses', () => {
    const proposalWithLongAddress = {
      ...mockProposal,
      proposer: '0xaB5801a7D398351b8bE11C439e05C5B3259aeC9B' // Vitalik's address
    };
    
    render(
      <UnifiedProposalCard
        proposal={proposalWithLongAddress}
        onRefresh={mockRefreshHandler}
      />
    );

    // Check for the truncated address (first 6 chars + ... + last 4 chars)
    expect(screen.getByText(/0xaB580.{1,4}aeC9B/i)).toBeInTheDocument();
  });

  test('handles special non-Ethereum addresses correctly', () => {
    const proposalWithSpecialAddress = {
      ...mockProposal,
      proposer: 'AI.Gov.ETHGlobal'
    };
    
    render(
      <UnifiedProposalCard
        proposal={proposalWithSpecialAddress}
        onRefresh={mockRefreshHandler}
      />
    );

    // Special addresses should be shown in full
    expect(screen.getByText('AI.Gov.ETHGlobal')).toBeInTheDocument();
  });
});
