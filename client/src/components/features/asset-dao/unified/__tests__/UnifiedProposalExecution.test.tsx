/**
 * Unit tests for the UnifiedProposalExecution component
 * 
 * Tests both Ethers and Wagmi implementations to ensure consistent behavior
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { UnifiedProposalExecution } from '../UnifiedProposalExecution';
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

describe('UnifiedProposalExecution Component', () => {
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
      executeProposal: jest.fn().mockResolvedValue('0xtxhash'),
      implementation: 'ethers',
      telemetry: { responseTime: 150 }
    });
  });

  it('renders the execution component properly', () => {
    render(
      <UnifiedProposalExecution 
        proposalId={1} 
        proposalState={ProposalState.Succeeded}
      />
    );
    
    // Check for execution button
    expect(screen.getByText(/execute proposal/i)).toBeInTheDocument();
  });

  it('disables execution when wallet is not connected', () => {
    // Mock wallet as not connected
    (useUnifiedWallet as jest.Mock).mockReturnValue({
      isConnected: false,
      address: null
    });
    
    render(
      <UnifiedProposalExecution 
        proposalId={1} 
        proposalState={ProposalState.Succeeded}
      />
    );
    
    // Check that button is disabled
    const executeButton = screen.getByText(/execute proposal/i).closest('button');
    expect(executeButton).toBeDisabled();
    
    // Should show wallet not connected message
    expect(screen.getByText(/connect wallet to execute/i)).toBeInTheDocument();
  });

  it('disables execution when proposal is not in executable state', () => {
    const nonExecutableStates = [
      ProposalState.Active,
      ProposalState.Canceled,
      ProposalState.Defeated,
      ProposalState.Executed,
      ProposalState.Expired
    ];
    
    // Test each non-executable state
    nonExecutableStates.forEach(state => {
      const { unmount } = render(
        <UnifiedProposalExecution 
          proposalId={1} 
          proposalState={state}
        />
      );
      
      // Check that button is disabled
      const executeButton = screen.getByText(/execute proposal/i).closest('button');
      expect(executeButton).toBeDisabled();
      
      // Should show appropriate message
      if (state === ProposalState.Active) {
        expect(screen.getByText(/proposal is still active/i)).toBeInTheDocument();
      } else if (state === ProposalState.Executed) {
        expect(screen.getByText(/proposal has already been executed/i)).toBeInTheDocument();
      } else {
        expect(screen.getByText(/proposal cannot be executed/i)).toBeInTheDocument();
      }
      
      unmount();
    });
  });

  it('handles execution correctly with Ethers implementation', async () => {
    const mockExecuteProposal = jest.fn().mockResolvedValue('0xtxhash');
    
    // Mock the contract hook
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      executeProposal: mockExecuteProposal,
      implementation: 'ethers',
      telemetry: { responseTime: 150 }
    });
    
    // Mock callback
    const onExecuteMock = jest.fn();
    
    // Render the component
    render(
      <UnifiedProposalExecution 
        proposalId={1}
        proposalState={ProposalState.Succeeded}
        onExecute={onExecuteMock}
      />
    );
    
    // Find the Execute button and click it
    const executeButton = screen.getByText(/execute proposal/i).closest('button');
    await act(async () => {
      fireEvent.click(executeButton);
    });
    
    // Verify the execute function was called with correct parameters
    expect(mockExecuteProposal).toHaveBeenCalledWith(1);
    
    // Verify callback was called
    await waitFor(() => {
      expect(onExecuteMock).toHaveBeenCalledWith(1, '0xtxhash');
    });
  });

  it('handles execution correctly with Wagmi implementation', async () => {
    const mockExecuteProposal = jest.fn().mockResolvedValue('0xtxhash');
    
    // Mock the contract hook with Wagmi implementation
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      executeProposal: mockExecuteProposal,
      implementation: 'wagmi',
      telemetry: { responseTime: 120 }
    });
    
    // Mock callback
    const onExecuteMock = jest.fn();
    
    // Render the component
    render(
      <UnifiedProposalExecution 
        proposalId={1}
        proposalState={ProposalState.Succeeded}
        onExecute={onExecuteMock}
        implementation="wagmi"
      />
    );
    
    // Find the Execute button and click it
    const executeButton = screen.getByText(/execute proposal/i).closest('button');
    await act(async () => {
      fireEvent.click(executeButton);
    });
    
    // Verify the execute function was called with correct parameters
    expect(mockExecuteProposal).toHaveBeenCalledWith(1);
    
    // Verify callback was called
    await waitFor(() => {
      expect(onExecuteMock).toHaveBeenCalledWith(1, '0xtxhash');
    });
  });

  it('shows loading state during execution', async () => {
    // Mock executeProposal to return a promise that doesn't resolve immediately
    const executePromise = new Promise<string>((resolve) => {
      setTimeout(() => resolve('0xtxhash'), 500);
    });
    
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      executeProposal: jest.fn().mockReturnValue(executePromise),
      implementation: 'ethers',
      telemetry: {}
    });
    
    render(
      <UnifiedProposalExecution 
        proposalId={1} 
        proposalState={ProposalState.Succeeded}
      />
    );
    
    // Find the Execute button and click it
    const executeButton = screen.getByText(/execute proposal/i).closest('button');
    fireEvent.click(executeButton);
    
    // Check for loading state
    expect(screen.getByText(/execution in progress/i)).toBeInTheDocument();
    
    // Button should be disabled during execution
    expect(executeButton).toBeDisabled();
    
    // Wait for the execution to complete
    await act(async () => {
      await executePromise;
    });
  });

  it('handles execution errors correctly', async () => {
    // Mock executeProposal to throw an error
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      executeProposal: jest.fn().mockRejectedValue(new Error('Execution failed')),
      implementation: 'ethers',
      telemetry: {}
    });
    
    // Mock callback
    const onErrorMock = jest.fn();
    
    render(
      <UnifiedProposalExecution 
        proposalId={1} 
        proposalState={ProposalState.Succeeded}
        onError={onErrorMock}
      />
    );
    
    // Find the Execute button and click it
    const executeButton = screen.getByText(/execute proposal/i).closest('button');
    await act(async () => {
      fireEvent.click(executeButton);
    });
    
    // Verify error callback was called
    await waitFor(() => {
      expect(onErrorMock).toHaveBeenCalledWith(expect.any(Error));
    });
    
    // Error message should be displayed
    expect(screen.getByText(/error occurred during execution/i)).toBeInTheDocument();
  });

  it('allows customizing execution button label', () => {
    render(
      <UnifiedProposalExecution 
        proposalId={1}
        proposalState={ProposalState.Succeeded}
        executeButtonLabel="Process Proposal"
      />
    );
    
    // Check for custom button label
    expect(screen.getByText(/process proposal/i)).toBeInTheDocument();
  });

  it('checks for execution eligibility', async () => {
    // Mock an additional method to check execution eligibility
    const mockCanExecute = jest.fn().mockResolvedValue(false);
    
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      executeProposal: jest.fn().mockResolvedValue('0xtxhash'),
      canExecuteProposal: mockCanExecute,
      implementation: 'ethers',
      telemetry: {}
    });
    
    render(
      <UnifiedProposalExecution 
        proposalId={1} 
        proposalState={ProposalState.Succeeded}
        checkEligibility={true}
      />
    );
    
    // Wait for eligibility check
    await waitFor(() => {
      // Button should be disabled if not eligible
      const executeButton = screen.getByText(/execute proposal/i).closest('button');
      expect(executeButton).toBeDisabled();
      
      // Should show not eligible message
      expect(screen.getByText(/not eligible to execute/i)).toBeInTheDocument();
    });
    
    // Verify canExecute was called
    expect(mockCanExecute).toHaveBeenCalledWith(1);
  });

  it('shows transaction hash after successful execution', async () => {
    // Mock successful execution
    (useUnifiedAssetDaoContract as jest.Mock).mockReturnValue({
      executeProposal: jest.fn().mockResolvedValue('0xabc123def456789'),
      implementation: 'ethers',
      telemetry: {}
    });
    
    render(
      <UnifiedProposalExecution 
        proposalId={1} 
        proposalState={ProposalState.Succeeded}
        showTransactionHash={true}
      />
    );
    
    // Find the Execute button and click it
    const executeButton = screen.getByText(/execute proposal/i).closest('button');
    await act(async () => {
      fireEvent.click(executeButton);
    });
    
    // Wait for success message with transaction hash
    await waitFor(() => {
      expect(screen.getByText(/execution successful/i)).toBeInTheDocument();
      expect(screen.getByText(/0xabc123def456789/i)).toBeInTheDocument();
    });
  });
});
