/**
 * Unified Create Proposal Modal Component
 * 
 * This component provides a consistent interface for creating new proposals
 * while supporting both Ethers and Wagmi implementations under the hood.
 * It uses the factory pattern to dynamically select the appropriate implementation.
 */

import React, { useCallback } from 'react';
import { createImplementationComponent, TelemetryData } from '@/components/common/factory';
import CreateProposalModal from '@/components/assetdao/CreateProposalModal';
import WagmiCreateProposalModal from '@/components/assetdao/WagmiCreateProposalModal';
import { processContractError } from '@/services/errorHandling';

export interface UnifiedCreateProposalModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;
  
  /**
   * Callback when the modal is closed
   */
  onClose: () => void;
  
  /**
   * Callback after successful proposal creation
   */
  onSuccess?: () => void;
  
  /**
   * Force a specific implementation regardless of feature flags
   */
  implementation?: 'ethers' | 'wagmi';
  
  /**
   * Callback for implementation-specific telemetry
   */
  onTelemetry?: (data: TelemetryData) => void;
}

/**
 * UnifiedCreateProposalModal implementation that uses the factory pattern
 * to switch between Ethers and Wagmi implementations
 */
export const UnifiedCreateProposalModal: React.FC<UnifiedCreateProposalModalProps> = (props) => {
  const {
    isOpen,
    onClose,
    onSuccess,
    implementation,
    onTelemetry
  } = props;
  
  // Success handler with telemetry
  const handleSuccess = useCallback(() => {
    // Track successful proposal creation
    if (onTelemetry) {
      onTelemetry({
        implementation: implementation || 'ethers',
        component: 'UnifiedCreateProposalModal',
        action: 'createProposal',
        status: 'success',
        timestamp: Date.now()
      });
    }
    
    // Call the original success callback
    if (onSuccess) {
      onSuccess();
    }
  }, [onSuccess, onTelemetry, implementation]);
  
  // Error handler with centralized error processing
  const handleError = useCallback((error: Error) => {
    processContractError(error, {
      component: 'UnifiedCreateProposalModal',
      method: 'createProposal',
      implementation: implementation || 'ethers'
    }, {
      showToast: true,
      onTelemetry
    });
  }, [onTelemetry, implementation]);
  
  // Use the factory pattern to create the appropriate component
  const ImplementationModal = createImplementationComponent(
    // Ethers implementation
    (ethersProps: any) => (
      <CreateProposalModal
        isOpen={isOpen}
        onClose={onClose}
        {...ethersProps}
      />
    ),
    // Wagmi implementation
    (wagmiProps: any) => (
      <WagmiCreateProposalModal
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={handleSuccess}
        {...wagmiProps}
      />
    ),
    // Feature flag key
    'useWagmiProposals'
  );
  
  // Only render if the modal is open
  if (!isOpen) return null;
  
  // Render the appropriate implementation
  return (
    <ImplementationModal
      forceImplementation={implementation}
      onError={handleError}
    />
  );
};

export default UnifiedCreateProposalModal;
