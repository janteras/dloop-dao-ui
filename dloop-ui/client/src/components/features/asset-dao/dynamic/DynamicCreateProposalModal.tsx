/**
 * Dynamic Create Proposal Modal Component
 * 
 * A dynamically loaded wrapper around the UnifiedCreateProposalModal component
 * that includes optimistic UI updates and React Query integration.
 */

import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useQueryClient } from '@tanstack/react-query';
import { UnifiedCreateProposalModal } from '../unified/UnifiedCreateProposalModal';
import { proposalKeys } from '@/lib/query/config';
import { TelemetryData } from '@/components/common/factory';

/**
 * Fallback loading component
 */
const ModalLoadingFallback = () => (
  <div className="modal-skeleton">
    <div className="skeleton-header"></div>
    <div className="skeleton-body">
      <div className="skeleton-line"></div>
      <div className="skeleton-line"></div>
      <div className="skeleton-line"></div>
    </div>
    <div className="skeleton-footer"></div>
  </div>
);

/**
 * Error fallback component
 */
const ModalErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
  <div className="modal-error">
    <h3>Error loading proposal form</h3>
    <p>{error.message}</p>
    <button onClick={resetErrorBoundary}>Retry</button>
  </div>
);

/**
 * DynamicCreateProposalModal props
 */
interface DynamicCreateProposalModalProps {
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
   * Additional CSS class names
   */
  className?: string;
  
  /**
   * Callback for implementation-specific telemetry
   */
  onTelemetry?: (data: TelemetryData) => void;
  
  /**
   * Whether to automatically invalidate proposal queries after creation
   */
  autoInvalidateQueries?: boolean;
}

/**
 * Dynamic Create Proposal Modal Component
 * 
 * This component wraps the UnifiedCreateProposalModal in Suspense and ErrorBoundary
 * and adds optimistic UI updates with React Query.
 */
export function DynamicCreateProposalModal({
  isOpen,
  onClose,
  onSuccess,
  implementation,
  className = '',
  onTelemetry,
  autoInvalidateQueries = true
}: DynamicCreateProposalModalProps) {
  const queryClient = useQueryClient();
  
  // Handle successful proposal creation
  const handleSuccess = () => {
    // Invalidate all proposal queries to refetch data
    if (autoInvalidateQueries) {
      queryClient.invalidateQueries({
        queryKey: proposalKeys.all(),
      });
    }
    
    // Call the parent success handler
    if (onSuccess) {
      onSuccess();
    }
  };
  
  return (
    <ErrorBoundary 
      FallbackComponent={ModalErrorFallback}
      resetKeys={[isOpen]} // Reset the error boundary when modal opens/closes
    >
      <Suspense fallback={<ModalLoadingFallback />}>
        {isOpen && (
          <UnifiedCreateProposalModal
            isOpen={isOpen}
            onClose={onClose}
            onSuccess={handleSuccess}
            implementation={implementation}
            className={className}
            onTelemetry={onTelemetry}
          />
        )}
      </Suspense>
    </ErrorBoundary>
  );
}
