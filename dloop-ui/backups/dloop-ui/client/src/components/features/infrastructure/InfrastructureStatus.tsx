import React from 'react';
import { useInfrastructureStatus } from '@/hooks/useInfrastructureStatus';
import { AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { 
  Alert,
  AlertDescription,
  AlertTitle 
} from '@/components/common/ui/alert';

/**
 * Component that displays the status of critical infrastructure services
 * and provides guidance when they are not properly configured
 */
export function InfrastructureStatus() {
  const { isInfuraConnected, isWalletConnectConfigured, isLoading, error } = useInfrastructureStatus();

  if (isLoading) {
    return (
      <Alert className="bg-background border">
        <div className="flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-t-2 border-primary rounded-full"></div>
          <span>Checking infrastructure status...</span>
        </div>
      </Alert>
    );
  }

  // If both services are up, don't show anything
  if (isInfuraConnected && isWalletConnectConfigured) {
    return null;
  }

  return (
    <div className="space-y-4">
      {!isInfuraConnected && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Infura Connection Issue</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-2">
              We can't connect to the Ethereum Sepolia testnet because of an invalid or missing Infura API key.
            </p>
            <p className="text-sm mb-2">
              You need a valid Infura API key to interact with the blockchain. Please contact the administrator 
              to provide a valid API key.
            </p>
            <p className="text-xs mt-4 opacity-80">
              Error: {error || "Invalid Infura configuration"}
            </p>
          </AlertDescription>
        </Alert>
      )}

      {!isWalletConnectConfigured && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>WalletConnect Configuration Issue</AlertTitle>
          <AlertDescription className="mt-2">
            <p>
              WalletConnect v2 is not properly configured. Connecting with some wallets may not work correctly.
            </p>
            <p className="text-sm mt-2">
              A valid WalletConnect Project ID is required for full wallet integration. Please contact the administrator 
              to provide a valid Project ID.
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}