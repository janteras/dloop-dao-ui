/**
 * Unified Proposal Execution Component
 * 
 * This component provides a consistent interface for executing proposals
 * while supporting both Ethers and Wagmi implementations through the unified AssetDAO contract hook.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlayCircle, Loader2 } from 'lucide-react';
import { useUnifiedAssetDaoContract } from '@/hooks/unified/useUnifiedAssetDaoContract';
import { Web3Implementation } from '@/types/web3-types';
import { useUnifiedWallet } from '@/hooks/unified';
import { toast } from '@/components/ui/use-toast';
import { ProposalState } from '@/services/enhanced-assetDaoService';

export interface UnifiedProposalExecutionProps {
  /**
   * Proposal ID to execute
   */
  proposalId: number;
  
  /**
   * Current state of the proposal
   */
  proposalState: ProposalState;
  
  /**
   * Force a specific implementation regardless of feature flags
   */
  implementation?: Web3Implementation;
  
  /**
   * Custom size for the execution button
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Additional CSS class names
   */
  className?: string;
  
  /**
   * Callback when execution is completed
   */
  onExecuteComplete?: (proposalId: number) => void;
  
  /**
   * Show toasts for execution results
   */
  showToasts?: boolean;
}

/**
 * Unified component for executing proposals with consistent behavior
 * regardless of which implementation (Ethers or Wagmi) is being used
 */
export const UnifiedProposalExecution: React.FC<UnifiedProposalExecutionProps> = (props) => {
  const {
    proposalId,
    proposalState,
    implementation,
    size = 'md',
    className = '',
    onExecuteComplete,
    showToasts = true
  } = props;
  
  // State for loading indicator
  const [isExecuting, setIsExecuting] = useState(false);
  
  // Use unified hooks
  const { isConnected } = useUnifiedWallet({ implementation });
  const { executeProposal, implementation: actualImplementation } = useUnifiedAssetDaoContract({ 
    implementation 
  });
  
  // Button size classes
  const sizeClasses = {
    sm: 'h-8 px-2 text-xs',
    md: 'h-10 px-3 text-sm',
    lg: 'h-12 px-4 text-base'
  };
  
  // Check if proposal can be executed
  const canExecute = proposalState === ProposalState.Succeeded;
  const isExecuted = proposalState === ProposalState.Executed;
  
  // Handle execution
  const handleExecute = async () => {
    if (!isConnected || !canExecute) return;
    
    setIsExecuting(true);
    try {
      await executeProposal(proposalId);
      
      if (showToasts) {
        toast({
          title: "Proposal Executed",
          description: "The proposal has been successfully executed",
          variant: "default",
        });
      }
      
      if (onExecuteComplete) {
        onExecuteComplete(proposalId);
      }
    } catch (error) {
      console.error('Error executing proposal:', error);
      
      if (showToasts) {
        toast({
          title: "Execution Failed",
          description: error instanceof Error ? error.message : "Failed to execute the proposal",
          variant: "destructive",
        });
      }
    } finally {
      setIsExecuting(false);
    }
  };
  
  // Implementation-specific attributes for telemetry
  const dataAttributes = {
    'data-implementation': actualImplementation
  };
  
  // If the proposal is already executed, show a success message
  if (isExecuted) {
    return (
      <div className={`flex items-center ${className}`} {...dataAttributes}>
        <span className="text-sm text-green-600 flex items-center">
          <PlayCircle className="mr-2 h-4 w-4" />
          This proposal has been executed
        </span>
      </div>
    );
  }
  
  return (
    <div className={`flex ${className}`} {...dataAttributes}>
      <Button
        variant={canExecute ? "default" : "outline"}
        size={size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'default'}
        onClick={handleExecute}
        disabled={!isConnected || !canExecute || isExecuting}
        className={sizeClasses[size]}
      >
        {isExecuting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <PlayCircle className="mr-2 h-4 w-4" />
        )}
        Execute Proposal
      </Button>
      
      {!canExecute && !isExecuted && (
        <span className="ml-2 text-sm text-gray-500 flex items-center">
          Proposal must be in "Succeeded" state to execute
        </span>
      )}
    </div>
  );
};

export default UnifiedProposalExecution;
